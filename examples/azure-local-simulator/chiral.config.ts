// Azure Local Simulator Development Example
// This demonstrates using lightweight Azure service simulation with Chiral

import { ChiralSystem } from '../../src/intent';

export const config: ChiralSystem = {
  projectName: 'azure-simulator-app',
  environment: 'dev',
  networkCidr: '10.2.0.0/16',  // Azure VNet range
  
  // Azure simulator configuration
  region: {
    local: 'localhost:7070',  // Simulator endpoint
    aws: 'us-east-1',     // For comparison
    azure: 'eastus',      // Production Azure region
    gcp: 'us-central1'
  },

  // Lightweight Azure Kubernetes Service simulation
  k8s: {
    version: '1.27',      // AKS supported version
    minNodes: 1,           // Single node simulation
    maxNodes: 1,           // Fixed for simulation
    size: 'small'          // Minimal resources
  },

  // Azure Database for PostgreSQL simulation (mock)
  postgres: {
    engineVersion: '15',   // PostgreSQL version
    size: 'small',         // Basic tier equivalent
    storageGb: 10         // Small storage for simulation
  },

  // Azure Active Directory Federation Services simulation (mock)
  adfs: {
    size: 'small',         // Basic VM size
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
    subnetCidr: '10.2.1.0/24'  // Simple subnet
  },

  // Local state management
  terraform: {
    backend: {
      type: 'local',
      bucket: 'azure-simulator-state',
      prefix: 'chiral-azure-simulator'
    }
  }
};
