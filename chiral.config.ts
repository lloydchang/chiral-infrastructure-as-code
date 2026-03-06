// File: chiral.config.ts

// 4. The DNA (Configuration)

// The Single Source of Truth for the deployment.

import { ChiralSystem } from './src/intent';

export const config: ChiralSystem = {
  projectName: 'identity-platform',
  environment: 'prod',
  networkCidr: '10.100.0.0/16',

  // Optional: Configure regions for each cloud (defaults will be used if not specified)
  region: {
    aws: 'us-east-1',      // Default: from CDK env vars
    azure: 'eastus',      // Default: resourceGroup().location
    gcp: 'us-central1'     // Default: us-central1
  },

  // Optional: Configure network settings (defaults will be calculated if not specified)
  network: {
    subnetCidr: '10.0.1.0/24'  // Default: calculated from networkCidr (/16 -> /24)
  },

  // Optional: Configure compliance settings
  compliance: {
    encryptionAtRest: true,
    encryptionInTransit: true,
    auditLogging: true
  },

  k8s: {
    version: '1.35',
    minNodes: 2,
    maxNodes: 5,
    size: 'large' // Resolves to m5.large (AWS) / Standard_D4s_v3 (Azure) / n1-standard-2 (GCP)
  },

  postgres: {
    engineVersion: '15',
    size: 'large', // Resolves to db.m5.large (AWS) / Standard_D4s_v3 (Azure) / db-custom-2-4096 (GCP)
    storageGb: 100
  },

  adfs: {
    size: 'large', // Resolves to m5.large (AWS) / Standard_D4s_v3 (Azure) / n1-standard-2 (GCP)
    windowsVersion: '2022'
  }
};
