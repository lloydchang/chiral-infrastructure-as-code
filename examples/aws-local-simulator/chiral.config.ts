// AWS Local Simulator Development Example
// This demonstrates using lightweight AWS service simulation with Chiral

import { ChiralSystem } from '../../src/intent';

export const config: ChiralSystem = {
  projectName: 'aws-simulator-app',
  environment: 'dev',
  networkCidr: '10.0.0.0/16',  // Standard private network
  
  // AWS simulator configuration
  region: {
    local: 'localhost:8080',  // Simulator endpoint
    aws: 'us-east-1',     // Production AWS region
    azure: 'eastus',
    gcp: 'us-central1'
  },

  // Lightweight Kubernetes simulation
  k8s: {
    version: '1.27',      // Stable version
    minNodes: 1,           // Single node simulation
    maxNodes: 1,           // Fixed for simulation
    size: 'small'          // Minimal resources
  },

  // PostgreSQL simulation (mock)
  postgres: {
    engineVersion: '15',   // PostgreSQL version
    size: 'small',         // Minimal instance
    storageGb: 10         // Small storage for simulation
  },

  // ADFS simulation (mock)
  adfs: {
    size: 'small',         // Minimal instance
    windowsVersion: '2022' // Windows Server version
  },

  // Simulator-specific configuration
  terraformBridge: {
    enabled: true,
    provider: 'local',
    delegateState: false,
    sourcePath: './terraform/simulator'
  },

  // Lightweight compliance for simulation
  compliance: {
    encryptionAtRest: false,    // Disabled for simulation
    encryptionInTransit: false, // Disabled for simulation
    auditLogging: true,         // Enable for debugging
    securityControls: {
      networkSegmentation: false,  // Disabled for simulation
      vulnerabilityManagement: false,
      securityMonitoring: true
    }
  },

  // Simulation network configuration
  network: {
    subnetCidr: '10.0.1.0/24'  // Simple subnet
  },

  // Local state management
  terraform: {
    backend: {
      type: 'local',
      bucket: 'simulator-state',
      prefix: 'chiral-simulator'
    }
  }
};
