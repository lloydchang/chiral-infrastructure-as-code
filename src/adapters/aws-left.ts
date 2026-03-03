// File: src/adapters/aws-left.ts

// 5. The Adapters (Logic)

// The Left Enantiomer: AWS CDK Implementation.

import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ChiralSystem } from '../intent';
import { HardwareMap } from '../rosetta/hardware-map';

export class AwsLeftHandAdapter extends cdk.Stack {
  constructor(scope: Construct, id: string, intent: ChiralSystem, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Networking (L2 Construct)
    const vpc = new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr(intent.networkCidr),
      maxAzs: 2,
      natGateways: 1,
    });

    // 2. Kubernetes: EKS (L3 Construct)
    const cluster = new eks.Cluster(this, 'EksCluster', {
      vpc,
      version: eks.KubernetesVersion.of(intent.k8s.version),
      defaultCapacity: intent.k8s.minNodes,
      defaultCapacityInstance: ec2.InstanceType.of(
        ec2.InstanceClass.M5, 
        ec2.InstanceSize.LARGE
      ),
      clusterName: `${intent.projectName}-eks`
    });

    // 3. Database: RDS Postgres (L3 Construct)
    const dbInstanceType = new ec2.InstanceType(HardwareMap.aws.db[intent.postgres.size]);
    
    const database = new rds.DatabaseInstance(this, 'PostgresDB', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.of(intent.postgres.engineVersion, intent.postgres.engineVersion)
      }),
      vpc,
      instanceType: dbInstanceType,
      allocatedStorage: intent.postgres.storageGb,
      multiAz: intent.environment === 'prod',
      databaseName: 'appdb'
    });

    // 4. AD FS: Windows Server EC2 (L2 Construct)
    // AD FS requires a Windows VM. We configure it here.
    const adfsVmType = new ec2.InstanceType(HardwareMap.aws.vm[intent.adfs.size]);
    
    const adfsServer = new ec2.Instance(this, 'AdfsServer', {
      vpc,
      instanceType: adfsVmType,
      machineImage: ec2.MachineImage.latestWindows(
        intent.adfs.windowsVersion === '2022' 
          ? ec2.WindowsVersion.WINDOWS_SERVER_2022_ENGLISH_FULL_BASE 
          : ec2.WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_FULL_BASE
      ),
      userData: ec2.UserData.forWindows(),
    });

    // Add UserData to install AD FS features (PowerShell intent)
    adfsServer.userData.addCommands(
      'Install-WindowsFeature ADFS-Federation -IncludeManagementTools'
    );
  }
}
