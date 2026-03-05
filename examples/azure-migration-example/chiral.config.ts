// Example: Azure-first organization migrating from Terraform to Chiral
// This demonstrates the migration path for a 100-resource Azure deployment

import { ChiralSystem } from '../../src/intent';

export const config: ChiralSystem = {
  projectName: 'identity-platform',
  environment: 'prod',
  networkCidr: '10.0.0.0/16',

  // Azure-specific region configuration
  region: {
    azure: 'East US'  // Matches original Terraform setup
  },

  // Network configuration
  network: {
    subnetCidr: '10.0.1.0/24'  // Specific subnet for workloads
  },

  // Kubernetes configuration optimized for Azure
  k8s: {
    version: '1.29',  // Latest stable version
    minNodes: 2,        // Production minimum for HA
    maxNodes: 5,        // Scalable for production workloads
    size: 'large'       // Optimized for production workloads
  },

  // PostgreSQL configuration for production
  postgres: {
    engineVersion: '15',    // Latest stable version
    size: 'large',         // Production-grade performance
    storageGb: 100        // Adequate for production workloads
  },

  // AD FS configuration for enterprise identity
  adfs: {
    size: 'large',         // Enterprise-grade compute
    windowsVersion: '2022'  // Latest Windows Server
  },

  // Migration metadata (optional, for tracking)
  migration: {
    strategy: 'progressive',
    sourceState: 'terraform.tfstate',
    validateCompliance: true
  }
};
