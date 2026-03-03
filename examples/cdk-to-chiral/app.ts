import * as cdk from 'aws-cdk-lib';
import { InfrastructureStack, ChiralStackProps } from './cdk-stack';

const app = new cdk.App();

const stackProps: ChiralStackProps = {
  projectName: 'chiral-infrastructure',
  environment: 'dev',
  networkCidr: '10.0.0.0/16',
  k8sVersion: '1.29',
  postgresVersion: '15',
  postgresStorageGb: 100,
  postgresInstanceSize: 't3.medium',
  adfsInstanceSize: 't3.large',
  windowsVersion: '2022',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
};

new InfrastructureStack(app, 'InfrastructureStack', stackProps);
app.synth();
