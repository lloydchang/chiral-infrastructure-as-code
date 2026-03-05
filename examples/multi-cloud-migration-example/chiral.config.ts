// Example: Multi-cloud enterprise migrating from Terraform to Chiral
// This demonstrates a 300-resource multi-cloud deployment with cost analysis

import { ChiralSystem } from '../../src/intent';

export const config: ChiralSystem = {
  projectName: 'enterprise-platform',
  environment: 'prod',
  networkCidr: '10.0.0.0/8',  // Larger network for enterprise

  // Multi-cloud regional configuration
  region: {
    aws: 'us-east-1',      // Primary AWS region
    azure: 'East US',        // Primary Azure region
    gcp: 'us-central1'      // Primary GCP region
  },

  // Network configuration for multi-cloud
  network: {
    subnetCidr: '10.0.1.0/24'  // Specific subnet for workloads
  },

  // Kubernetes configuration for enterprise workloads
  k8s: {
    version: '1.29',           // Latest stable version across clouds
    minNodes: 3,             // Enterprise minimum for HA
    maxNodes: 10,            // Scalable for production workloads
    size: 'large'              // Enterprise-grade compute
  },

  // PostgreSQL configuration for enterprise databases
  postgres: {
    engineVersion: '15',        // Latest stable version
    size: 'large',             // Enterprise-grade performance
    storageGb: 500             // Large storage for enterprise workloads
  },

  // AD FS configuration for enterprise identity
  adfs: {
    size: 'large',             // Enterprise-grade compute
    windowsVersion: '2022'      // Latest Windows Server
  },

  // Migration metadata for tracking
  migration: {
    strategy: 'progressive',
    sourceState: './terraform.tfstate',
    validateCompliance: true
  }
};
