// Example: Greenfield development using Chiral
// This demonstrates a new microservices platform deployment

import { ChiralSystem } from '../../src/intent';

export const config: ChiralSystem = {
  projectName: 'microservices-platform',
  environment: 'dev',  // Development environment
  networkCidr: '10.0.0.0/16',

  // Development-optimized regions
  region: {
    aws: 'us-west-2',      // Cost-effective for development
    azure: 'Central US',     // Good for development workloads
    gcp: 'us-west1'        // Cost-effective development region
  },

  // Development-optimized Kubernetes
  k8s: {
    version: '1.30',        // Latest version for development
    minNodes: 1,           // Single node for development
    maxNodes: 3,           // Scalable for testing
    size: 'small'           // Cost-optimized for development
  },

  // Development database
  postgres: {
    engineVersion: '16',    // Latest version for development
    size: 'small',           // Cost-optimized for development
    storageGb: 50           // Adequate for development workloads
  },

  // Minimal AD FS for development
  adfs: {
    size: 'small',           // Cost-optimized for development
    windowsVersion: '2022'  // Latest Windows Server
  }
};
