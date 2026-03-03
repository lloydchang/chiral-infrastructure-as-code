// File: chiral.config.ts

// 4. The DNA (Configuration)

// The Single Source of Truth for the deployment.

import { ChiralSystem } from './src/intent';

export const config: ChiralSystem = {
  projectName: 'identity-platform',
  environment: 'prod',
  networkCidr: '10.0.0.0/16',

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
