// Local Kubernetes Development Example
// This demonstrates using local Kubernetes (minikube/kind/k3d) for development with Chiral

import { ChiralSystem } from '../../src/intent';

export const config: ChiralSystem = {
  projectName: 'k8s-local-dev',
  environment: 'dev',
  networkCidr: '10.244.0.0/16',  // Standard pod network CIDR
  
  // Local Kubernetes configuration
  region: {
    local: 'localhost',
    aws: 'us-west-2',     // For future cloud migration
    azure: 'westus2',
    gcp: 'us-west1'
  },

  // Local Kubernetes cluster configuration
  k8s: {
    version: '1.28',      // Recent stable version
    minNodes: 1,           // Single node for development
    maxNodes: 3,           // Scale up for testing
    size: 'small'          // Resource-optimized for local
  },

  // PostgreSQL running in Kubernetes
  postgres: {
    engineVersion: '15',   // Stable version
    size: 'small',         // Minimal resources
    storageGb: 50         // Persistent storage for development
  },

  // ADFS simulation in Kubernetes
  adfs: {
    size: 'small',         // Minimal Windows container
    windowsVersion: '2022' // Latest Windows Server
  },

  // Terraform bridge for local Kubernetes
  terraformBridge: {
    enabled: true,
    provider: 'local',
    delegateState: false,
    sourcePath: './terraform/k8s-local'
  },

  // Local development compliance
  compliance: {
    encryptionAtRest: true,
    encryptionInTransit: true,
    auditLogging: false,    // Disabled for local development
    securityControls: {
      networkSegmentation: true,
      vulnerabilityManagement: false  // Disabled for local dev
    }
  },

  // Kubernetes-specific network configuration
  network: {
    subnetCidr: '10.244.1.0/24'  // Pod subnet
  }
};
