// Azure Local Emulator Development Example
// This demonstrates using Azurite and Azure emulators for local development with Chiral

import { ChiralSystem } from '../../src/intent';

export const config: ChiralSystem = {
  projectName: 'azure-emulator-app',
  environment: 'dev',
  networkCidr: '10.1.0.0/16',  // Azure VNet range
  
  // Azure emulator configuration
  region: {
    local: 'localhost:10000',  // Azurite endpoint
    aws: 'us-east-1',     // For comparison
    azure: 'eastus',      // Production Azure region
    gcp: 'us-central1'
  },

  // Azure Kubernetes Service emulation
  k8s: {
    version: '1.27',      // AKS supported version
    minNodes: 1,           // Single node for emulation
    maxNodes: 3,           // Scale for testing
    size: 'small'          // Lightweight for local
  },

  // Azure Database for PostgreSQL emulation
  postgres: {
    engineVersion: '15',   // PostgreSQL version
    size: 'small',         // Basic tier equivalent
    storageGb: 20         // Minimal storage for development
  },

  // Azure Active Directory Federation Services
  adfs: {
    size: 'small',         // Basic VM size
    windowsVersion: '2022' // Windows Server version
  },

  // Azurite-specific configuration
  terraformBridge: {
    enabled: true,
    provider: 'local',
    delegateState: false,
    sourcePath: './terraform/azurite'
  },

  // Azure emulator compliance
  compliance: {
    encryptionAtRest: true,
    encryptionInTransit: true,
    auditLogging: true,     // Enable for debugging
    securityControls: {
      networkSegmentation: true,
      vulnerabilityManagement: false,  // Disabled for local dev
      securityMonitoring: true
    }
  },

  // Azure VNet configuration
  network: {
    subnetCidr: '10.1.1.0/24'  // Subnet for services
  },

  // Azure-specific settings for emulation
  terraform: {
    backend: {
      type: 'local',
      bucket: 'azurite-terraform-state',
      prefix: 'chiral-azure-emulator'
    }
  }
};
