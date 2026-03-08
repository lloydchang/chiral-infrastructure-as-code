// GCP Local Simulator Development Example
// This demonstrates using lightweight GCP service simulation with Chiral

import { ChiralSystem } from '../../src/intent';

export const config: ChiralSystem = {
  projectName: 'gcp-simulator-app',
  environment: 'dev',
  networkCidr: '10.4.0.0/16',  // GCP VPC range
  
  // GCP simulator configuration
  region: {
    local: 'localhost:8080',  // Simulator endpoint
    aws: 'us-east-1',     // For comparison
    azure: 'eastus',      // For comparison
    gcp: 'us-central1'    // Production GCP region
  },

  // Lightweight Google Kubernetes Engine simulation
  k8s: {
    version: '1.27',      // GKE supported version
    minNodes: 1,           // Single node simulation
    maxNodes: 1,           // Fixed for simulation
    size: 'small'          // Minimal resources
  },

  // Cloud SQL for PostgreSQL simulation (mock)
  postgres: {
    engineVersion: '15',   // PostgreSQL version
    size: 'small',         // db-g1-small equivalent
    storageGb: 10         // Small storage for simulation
  },

  // Google Cloud Identity Services simulation (mock)
  adfs: {
    size: 'small',         // e2-small equivalent
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
    subnetCidr: '10.4.1.0/24'  // Simple subnet
  },

  // Local state management
  terraform: {
    backend: {
      type: 'local',
      bucket: 'gcp-simulator-state',
      prefix: 'chiral-gcp-simulator'
    }
  }
};
