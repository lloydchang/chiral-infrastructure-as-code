// GCP Local Emulator Development Example
// This demonstrates using Firebase emulators and GCP emulators for local development with Chiral

import { ChiralSystem } from '../../src/intent';

export const config: ChiralSystem = {
  projectName: 'gcp-emulator-app',
  environment: 'dev',
  networkCidr: '10.3.0.0/16',  // GCP VPC range
  
  // GCP emulator configuration
  region: {
    local: 'localhost:4000',  // Firebase emulator endpoint
    aws: 'us-east-1',     // For comparison
    azure: 'eastus',      // For comparison
    gcp: 'us-central1'    // Production GCP region
  },

  // Google Kubernetes Engine emulation
  k8s: {
    version: '1.27',      // GKE supported version
    minNodes: 1,           // Single node for emulation
    maxNodes: 3,           // Scale for testing
    size: 'small'          // Lightweight for local
  },

  // Cloud SQL for PostgreSQL emulation
  postgres: {
    engineVersion: '15',   // PostgreSQL version
    size: 'small',         // db-g1-small equivalent
    storageGb: 20         // Minimal storage for development
  },

  // Google Cloud Identity Services
  adfs: {
    size: 'small',         // e2-small equivalent
    windowsVersion: '2022' // Windows Server version
  },

  // Firebase emulator-specific configuration
  terraformBridge: {
    enabled: true,
    provider: 'local',
    delegateState: false,
    sourcePath: './terraform/firebase-emulator'
  },

  // GCP emulator compliance
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

  // GCP VPC configuration
  network: {
    subnetCidr: '10.3.1.0/24'  // Subnet for services
  },

  // GCP-specific settings for emulation
  terraform: {
    backend: {
      type: 'local',
      bucket: 'firebase-emulator-state',
      prefix: 'chiral-gcp-emulator'
    }
  }
};
