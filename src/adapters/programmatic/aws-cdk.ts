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
    const regionalHardware = getRegionalHardwareMap('aws', awsRegion);

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
    // 5. AI AGENT SKILLS (Optional - Level 3 Constructs)
    // =================================================================
    this.createSkillResources(intent);

    // =================================================================
    // 6. SECURITY & NETWORKING INTEGRATION
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

  private createSkillResources(intent: ChiralSystem) {
    if (!intent.skills) return;

    // Image Processing Skill
    if (intent.skills.imageProcessing) {
      this.createImageProcessingSkill(intent.skills.imageProcessing);
    }

    // Data Analysis Skill
    if (intent.skills.dataAnalysis) {
      this.createDataAnalysisSkill(intent.skills.dataAnalysis);
    }

    // Natural Language Skill
    if (intent.skills.naturalLanguage) {
      this.createNaturalLanguageSkill(intent.skills.naturalLanguage);
    }

    // Automation Skill
    if (intent.skills.automation) {
      this.createAutomationSkill(intent.skills.automation);
    }
  }

  private createImageProcessingSkill(skill: NonNullable<ChiralSystem['skills']>['imageProcessing']) {
    const lambdaFunction = new lambda.Function(this, 'ImageProcessingFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset('skills/image-processing'),
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(5),
      memorySize: skill.performance! === 'high' ? 2048 : skill.performance! === 'medium' ? 1024 : 512,
      environment: {
        CAPABILITY: skill.capability!,
        PERFORMANCE: skill.performance!
      }
    });

    // Grant necessary permissions for image processing
    const bucket = new s3.Bucket(this, 'ImageProcessingBucket');
    bucket.grantReadWrite(lambdaFunction);

    // API Gateway for HTTP access
    const api = new apigateway.LambdaRestApi(this, 'ImageProcessingApi', {
      handler: lambdaFunction,
    });
  }

  private createDataAnalysisSkill(skill: NonNullable<ChiralSystem['skills']>['dataAnalysis']) {
    const runtime = skill.framework === 'tensorflow' ? lambda.Runtime.PYTHON_3_9 :
                   skill.framework === 'pytorch' ? lambda.Runtime.PYTHON_3_9 :
                   lambda.Runtime.PYTHON_3_8; // scikit-learn

    const lambdaFunction = new lambda.Function(this, 'DataAnalysisFunction', {
      runtime: runtime,
      code: lambda.Code.fromAsset(`skills/data-analysis/${skill.framework}`),
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(10),
      memorySize: 2048, // ML workloads need more memory
      environment: {
        FRAMEWORK: skill.framework,
        CAPABILITY: skill.capability
      }
    });

    // Grant access to database for data analysis
    this.postgresDatabase.connections.allowFrom(lambdaFunction, ec2.Port.tcp(5432));

    // API Gateway
    const api = new apigateway.LambdaRestApi(this, 'DataAnalysisApi', {
      handler: lambdaFunction,
    });
  }

  private createNaturalLanguageSkill(skill: NonNullable<ChiralSystem['skills']>['naturalLanguage']) {
    const lambdaFunction = new lambda.Function(this, 'NaturalLanguageFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset('skills/natural-language'),
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(5),
      memorySize: skill.modelSize === 'large' ? 4096 : skill.modelSize === 'medium' ? 2048 : 1024,
      environment: {
        CAPABILITY: skill.capability,
        MODEL_SIZE: skill.modelSize
      }
    });

    // API Gateway
    const api = new apigateway.LambdaRestApi(this, 'NaturalLanguageApi', {
      handler: lambdaFunction,
    });
  }

  private createAutomationSkill(skill: NonNullable<ChiralSystem['skills']>['automation']) {
    const lambdaFunction = new lambda.Function(this, 'AutomationFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('skills/automation'),
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(skill.complexity === 'complex' ? 15 : skill.complexity === 'moderate' ? 10 : 5),
      memorySize: skill.complexity === 'complex' ? 2048 : skill.complexity === 'moderate' ? 1024 : 512,
      environment: {
        CAPABILITY: skill.capability,
        COMPLEXITY: skill.complexity
      }
    });

    // Grant access to database and EKS for automation
    this.postgresDatabase.connections.allowFrom(lambdaFunction, ec2.Port.tcp(5432));
    lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['eks:DescribeCluster', 'eks:ListClusters'],
      resources: [this.eksCluster.clusterArn]
    }));

    // API Gateway
    const api = new apigateway.LambdaRestApi(this, 'AutomationApi', {
      handler: lambdaFunction,
    });
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
