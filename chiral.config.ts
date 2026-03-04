// File: chiral.config.ts

// 4. The DNA (Configuration)

// The Single Source of Truth for the deployment.

import { ChiralSystem } from './src/intent';

export const config: ChiralSystem = {
  projectName: 'identity-platform',
  environment: 'prod',
  networkCidr: '10.0.0.0/16',

  // Optional: Configure regions for each cloud (defaults will be used if not specified)
  region: {
    aws: 'us-east-1',      // Default: from CDK env vars
    azure: 'East US',      // Default: resourceGroup().location
    gcp: 'us-central1'     // Default: us-central1
  },

  // Optional: Configure network settings (defaults will be calculated if not specified)
  network: {
    subnetCidr: '10.0.1.0/24'  // Default: calculated from networkCidr (/16 -> /24)
  },

  // Optional: Configure Terraform backend for GCP (recommended for state management)
  // terraform: {
  //   backend: {
  //     type: 'gcs',
  //     bucket: 'my-terraform-state-bucket',
  //     prefix: 'chiral-state'  // Optional
  //   }
  // },

  k8s: {
    version: '1.29',
    minNodes: 2,
    maxNodes: 5,
    size: 'large' // Resolves to m5.large (AWS) / Standard_D4s_v3 (Azure)
  },

  postgres: {
    engineVersion: '15',
    size: 'large', // Resolves to m5.large (AWS) / Standard_D4s_v3 (Azure)
    storageGb: 100
  },

  adfs: {
    size: 'large', // Resolves to m5.xlarge (AWS) / Standard_D4s_v3 (Azure)
    windowsVersion: '2022'
  }
};
