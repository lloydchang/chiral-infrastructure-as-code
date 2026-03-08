// Azure Local Simulator Development Example
// This demonstrates using lightweight Azure simulators for partial local development

import { ChiralSystem } from '../../src/intent';

export const config: ChiralSystem = {
  projectName: 'myproject-azure-simulator',
  environment: 'dev',
  networkCidr: '127.0.0.0/24', // Local network for simulator

  // Configure regions for local simulator
  region: {
    local: 'localhost',
    azure: 'East US', // Simulator will simulate this region
  },

  // Use local provider for simulator
  terraformBridge: {
    enabled: true,
    provider: 'local',
    delegateState: false,
  },

  // Minimal k8s simulation (mock services only)
  k8s: {
    version: '1.27',
    minNodes: 1,
    maxNodes: 1, // Single node simulation
    size: 'small' // Uses mock k8s API endpoints
  },

  postgres: {
    engineVersion: '15',
    size: 'small', // Uses in-memory or lightweight PostgreSQL
    storageGb: 5 // Reduced storage for simulation
  },

  adfs: {
    size: 'small', // Uses mock AD service
    windowsVersion: '2022'
  }
};
