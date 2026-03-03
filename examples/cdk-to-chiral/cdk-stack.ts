import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';

export interface ChiralStackProps extends cdk.StackProps {
  projectName: string;
  environment: 'dev' | 'prod';
  networkCidr: string;
  k8sVersion: string;
  postgresVersion: string;
  postgresStorageGb: number;
  postgresInstanceSize: string;
  adfsInstanceSize: string;
  windowsVersion: '2019' | '2022';
}

export class InfrastructureStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly eksCluster: eks.Cluster;
  public readonly postgresDatabase: rds.DatabaseInstance;
  public readonly adfsInstance: ec2.Instance;
  public readonly dbSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: ChiralStackProps) {
    super(scope, id, props);

    // =================================================================
    // 1. NETWORKING LAYER (Level 2 Construct)
    // =================================================================
    this.vpc = this.createVpc(props);

    // =================================================================
    // 2. KUBERNETES LAYER (Level 3 Construct - EKS)
    // =================================================================
    this.eksCluster = this.createEksCluster(props);

    // =================================================================
    // 3. DATABASE LAYER (Level 3 Construct - RDS PostgreSQL)
    // =================================================================
    const { database, secret } = this.createPostgresDatabase(props);
    this.postgresDatabase = database;
    this.dbSecret = secret;

    // =================================================================
    // 4. ACTIVE DIRECTORY FEDERATION SERVICES (Level 2 Construct)
    // =================================================================
    this.adfsInstance = this.createAdfsInstance(props);

    // =================================================================
    // 5. SECURITY & NETWORKING INTEGRATION
    // =================================================================
    this.setupSecurityIntegration();

    // =================================================================
    // 6. OUTPUTS
    // =================================================================
    this.createOutputs(props);
  }

  private createVpc(props: ChiralStackProps): ec2.Vpc {
    return new ec2.Vpc(this, 'ChiralVPC', {
      ipAddresses: ec2.IpAddresses.cidr(props.networkCidr),
      maxAzs: 2,
      natGateways: props.environment === 'prod' ? 2 : 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });
  }

  private createEksCluster(props: ChiralStackProps): eks.Cluster {
    // Create IAM role for EKS cluster
    const clusterAdminRole = new iam.Role(this, 'EksClusterAdminRole', {
      assumedBy: new iam.AccountRootPrincipal(),
    });

    // Create the EKS cluster
    const cluster = new eks.Cluster(this, 'ChiralEKSCluster', {
      vpc: this.vpc,
      version: eks.KubernetesVersion.of(props.k8sVersion),
      clusterName: `${props.projectName}-eks-cluster`,
      defaultCapacity: 0, // We'll add node groups manually
      endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
      mastersRole: clusterAdminRole,
      albController: {
        version: eks.AlbControllerVersion.V2_6_0,
      },
      kubectlLayer: undefined as any,
    });

    // Add managed node group for system workloads
    cluster.addNodegroupCapacity('SystemNodeGroup', {
      instanceTypes: [new ec2.InstanceType('t3.medium')],
      minSize: props.environment === 'prod' ? 2 : 1,
      maxSize: 3,
      desiredSize: props.environment === 'prod' ? 2 : 1,
      nodegroupName: 'system-nodes',
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Add managed node group for application workloads
    cluster.addNodegroupCapacity('ApplicationNodeGroup', {
      instanceTypes: [new ec2.InstanceType('m5.large')],
      minSize: 1,
      maxSize: 5,
      desiredSize: 2,
      nodegroupName: 'application-nodes',
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Store cluster config in SSM Parameter Store
    new ssm.StringParameter(this, 'EksClusterNameParameter', {
      parameterName: `/${props.projectName}/eks/cluster-name`,
      stringValue: cluster.clusterName,
    });

    return cluster;
  }

  private createPostgresDatabase(props: ChiralStackProps): { database: rds.DatabaseInstance; secret: secretsmanager.ISecret } {
    // Create database secret
    const dbSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `${props.projectName}-postgres-secret`,
      description: 'PostgreSQL database credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'postgres_admin',
        }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        requireEachIncludedType: true,
        passwordLength: 32,
      },
    });

    // Create security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for PostgreSQL database',
      allowAllOutbound: false,
    });

    // Create the RDS PostgreSQL instance
    const database = new rds.DatabaseInstance(this, 'ChiralPostgreSQL', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.of(props.postgresVersion, props.postgresVersion),
      }),
      instanceType: new ec2.InstanceType(props.postgresInstanceSize),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      databaseName: 'chiral_db',
      credentials: rds.Credentials.fromSecret(dbSecret),
      allocatedStorage: props.postgresStorageGb,
      maxAllocatedStorage: props.postgresStorageGb * 2,
      storageType: rds.StorageType.GP2,
      multiAz: props.environment === 'prod',
      deletionProtection: props.environment === 'prod',
      backupRetention: props.environment === 'prod' ? cdk.Duration.days(30) : cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      removalPolicy: props.environment === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
    });

    // Store database info in SSM Parameter Store
    new ssm.StringParameter(this, 'DatabaseEndpointParameter', {
      parameterName: `/${props.projectName}/rds/endpoint`,
      stringValue: database.instanceEndpoint.hostname,
    });

    return { database, secret: dbSecret };
  }

  private createAdfsInstance(props: ChiralStackProps): ec2.Instance {
    // Create security group for AD FS
    const adfsSecurityGroup = new ec2.SecurityGroup(this, 'AdfsSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for AD FS server',
      allowAllOutbound: true,
    });

    // Allow RDP access from bastion or specific IPs
    adfsSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.networkCidr),
      ec2.Port.tcp(3389),
      'RDP access from VPC'
    );

    // Allow HTTP/HTTPS for AD FS
    adfsSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.networkCidr),
      ec2.Port.tcp(80),
      'HTTP access for AD FS'
    );

    adfsSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.networkCidr),
      ec2.Port.tcp(443),
      'HTTPS access for AD FS'
    );

    // Determine Windows Server AMI
    const windowsAmi = ec2.MachineImage.latestWindows(
      props.windowsVersion === '2022' 
        ? ec2.WindowsVersion.WINDOWS_SERVER_2022_ENGLISH_FULL_BASE 
        : ec2.WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_FULL_BASE
    );

    // Create IAM role for AD FS instance
    const adfsRole = new iam.Role(this, 'AdfsInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Create the AD FS EC2 instance
    const adfsInstance = new ec2.Instance(this, 'ChiralAdfsServer', {
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      instanceType: new ec2.InstanceType(props.adfsInstanceSize),
      machineImage: windowsAmi,
      securityGroup: adfsSecurityGroup,
      role: adfsRole,
      userData: ec2.UserData.forWindows(),
      requireImdsv2: true,
    });

    // Add UserData to install and configure AD FS
    adfsInstance.userData.addCommands(`
      # Install AD FS role
      Install-WindowsFeature ADFS-Federation -IncludeManagementTools
      
      # Install additional required features
      Install-WindowsFeature Web-Server,Web-Mgmt-Tools -IncludeManagementTools
      
      # Create directories for configuration
      New-Item -Path "C:\\ADFS" -ItemType Directory -Force
      
      # Set PowerShell execution policy
      Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Force
      
      # Create initialization script
      @'
      # AD FS Initialization Script
      # This script will be run after domain join
      
      Write-Host "Initializing AD FS Federation Service..."
      
      # Import AD FS module
      Import-Module ADFS
      
      # Check if AD FS is already configured
      $adfsService = Get-Service -Name "adfssrv" -ErrorAction SilentlyContinue
      
      if (-not $adfsService) {
          Write-Host "AD FS service not found. Installing..."
          # Additional AD FS configuration would go here
      }
      
      Write-Host "AD FS initialization completed."
      '@ | Out-File -FilePath "C:\\ADFS\\Initialize-ADFS.ps1" -Encoding UTF8
    `);

    // Store AD FS instance info in SSM Parameter Store
    new ssm.StringParameter(this, 'AdfsInstanceIdParameter', {
      parameterName: `/${props.projectName}/adfs/instance-id`,
      stringValue: adfsInstance.instanceId,
    });

    return adfsInstance;
  }

  private setupSecurityIntegration(): void {
    // Allow EKS nodes to access the database
    this.postgresDatabase.connections.allowFrom(
      this.eksCluster,
      ec2.Port.tcp(5432),
      'EKS cluster access to PostgreSQL'
    );

    // Allow EKS nodes to access AD FS
    this.adfsInstance.connections.allowFrom(
      this.eksCluster,
      ec2.Port.tcp(443),
      'EKS cluster access to AD FS'
    );

    // Allow AD FS to access database (if needed for authentication)
    this.postgresDatabase.connections.allowFrom(
      this.adfsInstance,
      ec2.Port.tcp(5432),
      'AD FS server access to PostgreSQL'
    );
  }

  private createOutputs(props: ChiralStackProps): void {
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${props.projectName}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'EksClusterName', {
      value: this.eksCluster.clusterName,
      description: 'EKS Cluster Name',
      exportName: `${props.projectName}-eks-cluster-name`,
    });

    new cdk.CfnOutput(this, 'EksClusterEndpoint', {
      value: this.eksCluster.clusterEndpoint,
      description: 'EKS Cluster Endpoint',
      exportName: `${props.projectName}-eks-cluster-endpoint`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.postgresDatabase.instanceEndpoint.hostname,
      description: 'PostgreSQL Database Endpoint',
      exportName: `${props.projectName}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.dbSecret.secretArn,
      description: 'Database Secret ARN',
      exportName: `${props.projectName}-db-secret-arn`,
    });

    new cdk.CfnOutput(this, 'AdfsInstanceId', {
      value: this.adfsInstance.instanceId,
      description: 'AD FS Instance ID',
      exportName: `${props.projectName}-adfs-instance-id`,
    });

    new cdk.CfnOutput(this, 'AdfsPrivateIp', {
      value: this.adfsInstance.instancePrivateIp,
      description: 'AD FS Private IP',
      exportName: `${props.projectName}-adfs-private-ip`,
    });
  }
}
