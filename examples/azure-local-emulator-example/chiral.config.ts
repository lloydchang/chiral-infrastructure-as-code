// Azure Local Emulator Development Example
// This demonstrates using Azurite or similar Azure emulator for local development

import { ChiralSystem } from '../../src/intent';

export const config: ChiralSystem = {
  projectName: 'myproject-azure-emulator',
  environment: 'dev',
  networkCidr: '127.0.0.0/24', // Local network for emulator

  // Configure regions for local emulator
  region: {
    local: 'localhost',
    azure: 'East US', // Emulator will simulate this region
  },

  // Use local provider for emulator
  terraformBridge: {
    enabled: true,
    provider: 'local',
    delegateState: false,
  },

  k8s: {
    version: '1.27',
    minNodes: 1,
    maxNodes: 3,
    size: 'small' // Uses local k8s emulator (kind/k3s/minikube)
  },

  postgres: {
    engineVersion: '15',
    size: 'small', // Uses local PostgreSQL container
    storageGb: 20
  },

  adfs: {
    size: 'small', // Uses local AD emulator or mock service
    windowsVersion: '2022'
  }
};
