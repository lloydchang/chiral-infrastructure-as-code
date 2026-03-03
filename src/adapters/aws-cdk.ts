// File: src/adapters/aws-left.ts

// 5. The Adapters (Logic)

// The Left Enantiomer: AWS CDK Implementation.

import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { KubectlV26Layer } from '@aws-cdk/lambda-layer-kubectl-v26';
import { Construct } from 'constructs';
import { ChiralSystem } from '../intent';
import { HardwareMap } from '../rosetta/hardware-map';

export class AwsCdkAdapter extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly eksCluster: eks.Cluster;
  public readonly postgresDatabase: rds.DatabaseInstance;
  public readonly adfsInstance: ec2.Instance;
  public readonly dbSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, intent: ChiralSystem, props?: cdk.StackProps) {
    super(scope, id, props);

    // =================================================================
    // 1. NETWORKING LAYER (Level 2 Construct)
    // =================================================================
    this.vpc = this.createVpc(intent);

    // =================================================================
    // 2. KUBERNETES LAYER (Level 3 Construct - EKS)
    // =================================================================
    this.eksCluster = this.createEksCluster(intent);

    // =================================================================
    // 3. DATABASE LAYER (Level 3 Construct - RDS PostgreSQL)
    // =================================================================
    const { database, secret } = this.createPostgresDatabase(intent);
    this.postgresDatabase = database;
    this.dbSecret = secret;

    // =================================================================
    // 4. ACTIVE DIRECTORY FEDERATION SERVICES (Level 2 Construct)
    // =================================================================
    this.adfsInstance = this.createAdfsInstance(intent);

    // =================================================================
    // 5. SECURITY & NETWORKING INTEGRATION
    // =================================================================
    this.setupSecurityIntegration();

    // =================================================================
    // 6. OUTPUTS
    // =================================================================
    this.createOutputs(intent);
  }

  private createVpc(intent: ChiralSystem): ec2.Vpc {
    return new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr(intent.networkCidr),
      maxAzs: 2,
      natGateways: intent.environment === 'prod' ? 2 : 1,
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

  private createEksCluster(intent: ChiralSystem): eks.Cluster {
    // Create IAM role for EKS cluster
    const clusterAdminRole = new iam.Role(this, 'EksClusterAdminRole', {
      assumedBy: new iam.AccountRootPrincipal(),
    });

    // Create the EKS cluster
    const cluster = new eks.Cluster(this, 'EksCluster', {
      vpc: this.vpc,
      version: eks.KubernetesVersion.of(intent.k8s.version),
      clusterName: `${intent.projectName}-eks`,
      endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
      mastersRole: clusterAdminRole,
      kubectlLayer: new KubectlV26Layer(this, 'KubectlLayer'),
    });

    // Add managed node group for system workloads
    cluster.addNodegroupCapacity('SystemNodeGroup', {
      instanceTypes: [new ec2.InstanceType(HardwareMap.aws.k8s[intent.k8s.size])],
      minSize: intent.environment === 'prod' ? 2 : 1,
      maxSize: 3,
      desiredSize: intent.environment === 'prod' ? 2 : 1,
      nodegroupName: 'system-nodes',
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Add managed node group for application workloads
    cluster.addNodegroupCapacity('ApplicationNodeGroup', {
      instanceTypes: [new ec2.InstanceType(HardwareMap.aws.k8s[intent.k8s.size])],
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
      parameterName: `/${intent.projectName}/eks/cluster-name`,
      stringValue: cluster.clusterName,
    });

    return cluster;
  }

  private createPostgresDatabase(intent: ChiralSystem) {
    const dbInstanceType = new ec2.InstanceType(HardwareMap.aws.db[intent.postgres.size]);

    // Create database secret
    const secret = new secretsmanager.Secret(this, 'PostgresSecret', {
      secretName: `${intent.projectName}/postgres/credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'postgres_admin',
        }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
        requireEachIncludedType: true,
      },
    });

    const database = new rds.DatabaseInstance(this, 'PostgresDB', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.of(intent.postgres.engineVersion, intent.postgres.engineVersion)
      }),
      vpc: this.vpc,
      instanceType: dbInstanceType,
      allocatedStorage: intent.postgres.storageGb,
      multiAz: intent.environment === 'prod',
      databaseName: 'appdb',
      credentials: rds.Credentials.fromSecret(secret),
      backupRetention: intent.environment === 'prod' ? cdk.Duration.days(30) : cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      removalPolicy: intent.environment === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
    });

    return { database, secret };
  }

  private createAdfsInstance(intent: ChiralSystem): ec2.Instance {
    const adfsVmType = new ec2.InstanceType(HardwareMap.aws.vm[intent.adfs.size]);

    return new ec2.Instance(this, 'AdfsServer', {
      vpc: this.vpc,
      instanceType: adfsVmType,
      machineImage: ec2.MachineImage.latestWindows(
        intent.adfs.windowsVersion === '2022'
          ? ec2.WindowsVersion.WINDOWS_SERVER_2022_ENGLISH_FULL_BASE
          : ec2.WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_FULL_BASE
      ),
      userData: ec2.UserData.forWindows(),
    });
  }

  private setupSecurityIntegration() {
    // Allow EKS to access database
    this.postgresDatabase.connections.allowFrom(this.eksCluster, ec2.Port.tcp(5432));

    // Allow EKS to access AD FS
    this.adfsInstance.connections.allowFrom(this.eksCluster, ec2.Port.tcp(443));
  }

  private createOutputs(intent: ChiralSystem) {
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'EksClusterName', {
      value: this.eksCluster.clusterName,
      description: 'EKS Cluster Name',
    });

    new cdk.CfnOutput(this, 'PostgresEndpoint', {
      value: this.postgresDatabase.dbInstanceEndpointAddress,
      description: 'PostgreSQL Endpoint',
    });

    new cdk.CfnOutput(this, 'AdfsInstanceId', {
      value: this.adfsInstance.instanceId,
      description: 'AD FS Instance ID',
    });
  }
}
