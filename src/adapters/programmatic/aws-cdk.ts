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
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { KubectlV26Layer } from '@aws-cdk/lambda-layer-kubectl-v26';
import { Construct } from 'constructs';
import { ChiralSystem } from '../../intent';
import { getRegionalHardwareMap, validateRegionalCapabilities } from '../../translation/hardware-map';

export class AwsCdkAdapter extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly eksCluster: eks.Cluster;
  public readonly postgresDatabase: rds.DatabaseInstance;
  public readonly adfsInstance: ec2.Instance;
  public readonly dbSecret: secretsmanager.ISecret;
  private readonly regionalHardware: any; // Region-aware hardware mappings

  constructor(scope: Construct, id: string, intent: ChiralSystem, props?: cdk.StackProps) {
    super(scope, id, props);

    // Validate regional capabilities
    const awsRegion = intent.region?.aws || process.env.CDK_DEFAULT_REGION || 'us-east-1';
    const regionalValidation = validateRegionalCapabilities('aws', awsRegion, ['kubernetes', 'postgresql', 'activeDirectory']);

    if (!regionalValidation.valid) {
      throw new Error(`AWS region ${awsRegion} missing required services: ${regionalValidation.missingServices.join(', ')}`);
    }

    // Get region-aware hardware mappings
    this.regionalHardware = getRegionalHardwareMap('aws', awsRegion);

    // =================================================================
    // 1. NETWORKING LAYER (Level 2 Construct)
    // =================================================================
    this.vpc = this.createVpc(intent);

    // =================================================================
    // 2. KUBERNETES LAYER (Level 3 Construct - EKS) - With Auto-scaling Support
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

    // Create EKS cluster with enhanced configuration
    const cluster = new eks.Cluster(this, 'EksCluster', {
      vpc: this.vpc,
      version: eks.KubernetesVersion.of(intent.k8s.version),
      clusterName: `${intent.projectName}-eks`,
      endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
      mastersRole: clusterAdminRole,
      kubectlLayer: new KubectlV26Layer(this, 'KubectlLayer'),
      // Enhanced security configuration for production
      clusterLogging: [
        eks.ClusterLoggingTypes.API,
        eks.ClusterLoggingTypes.AUDIT,
        eks.ClusterLoggingTypes.AUTHENTICATOR,
        eks.ClusterLoggingTypes.CONTROLLER_MANAGER,
        eks.ClusterLoggingTypes.SCHEDULER
      ],
      // Add encryption configuration
      secretsEncryptionKey: new kms.Key(this, 'EksSecretsKey', {
        description: 'KMS key for EKS secrets encryption',
        alias: `${intent.projectName}-eks-secrets-key`
      })
    });

    // Add managed node group for system workloads
    cluster.addNodegroupCapacity('SystemNodeGroup', {
      instanceTypes: [new ec2.InstanceType(this.regionalHardware.k8s[intent.k8s.size])],
      minSize: intent.k8s.minNodes,
      maxSize: intent.k8s.maxNodes,
      desiredSize: intent.k8s.minNodes,
      nodegroupName: 'system-nodes',
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      // Enhanced node group configuration
      capacityType: eks.CapacityType.ON_DEMAND
      // Auto-scaling already configured at top level with minSize/maxSize/desiredSize
    });

    // Add managed node group for application workloads
    cluster.addNodegroupCapacity('ApplicationNodeGroup', {
      instanceTypes: [new ec2.InstanceType(this.regionalHardware.k8s[intent.k8s.size])],
      minSize: 1,
      maxSize: 5,
      desiredSize: 2,
      nodegroupName: 'application-nodes',
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      // Enhanced node group configuration
      capacityType: eks.CapacityType.ON_DEMAND,
      launchTemplateSpec: {
        id: 'lt-application-template', // Use launch template ID instead of specification
        version: '$Latest'
      }
      // Auto-scaling already configured at top level with minSize/maxSize/desiredSize
    });

    // Store cluster config in SSM Parameter Store
    new ssm.StringParameter(this, 'EksClusterNameParameter', {
      parameterName: `/${intent.projectName}/eks/cluster-name`,
      stringValue: cluster.clusterName,
    });

    return cluster;
  }

  private createPostgresDatabase(intent: ChiralSystem) {
    const dbInstanceType = new ec2.InstanceType(this.regionalHardware.db[intent.postgres.size]);

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
    const adfsVmType = new ec2.InstanceType(this.regionalHardware.vm[intent.adfs.size]);

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
}
