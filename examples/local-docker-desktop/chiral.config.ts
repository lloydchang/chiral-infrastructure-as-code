// Local Docker Desktop Development Example
// This demonstrates using Docker Desktop for local development with Chiral

import { ChiralSystem } from '../../src/intent';

export const config: ChiralSystem = {
  projectName: 'docker-desktop-app',
  environment: 'dev',
  networkCidr: '192.168.65.0/24',  // Docker Desktop default network range
  
  // Local development configuration
  region: {
    local: 'localhost',
    aws: 'us-east-1',     // For future cloud migration
    azure: 'eastus',
    gcp: 'us-central1'
  },

  // Docker Desktop optimized Kubernetes
  k8s: {
    version: '1.27',      // Docker Desktop stable version
    minNodes: 1,           // Single node cluster
    maxNodes: 1,           // Docker Desktop doesn't support multi-node
    size: 'small'          // Lightweight for local development
  },

  // Local PostgreSQL database
  postgres: {
    engineVersion: '15',   // Stable version
    size: 'small',         // Minimal resources for local dev
    storageGb: 20         // Adequate for development
  },

  // Local ADFS simulation (Windows Container)
  adfs: {
    size: 'small',         // Minimal Windows container
    windowsVersion: '2022' // Latest Windows Server
  },

  // Terraform bridge for local Docker
  terraformBridge: {
    enabled: true,
    provider: 'local',
    delegateState: false,
    sourcePath: './terraform/local'
  },

  // Local compliance settings
  compliance: {
    encryptionAtRest: true,
    encryptionInTransit: true,
    auditLogging: false    // Disabled for local development
  }
};
