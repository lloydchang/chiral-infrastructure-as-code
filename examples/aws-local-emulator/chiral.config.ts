// AWS Local Emulator Development Example
// This demonstrates using LocalStack for AWS service emulation with Chiral

import { ChiralSystem } from '../../src/intent';

export const config: ChiralSystem = {
  projectName: 'aws-emulator-app',
  environment: 'dev',
  networkCidr: '172.16.0.0/16',  // Private network for emulation
  
  // AWS emulator configuration
  region: {
    local: 'localhost:4566',  // LocalStack endpoint
    aws: 'us-east-1',     // Production AWS region
    azure: 'eastus',
    gcp: 'us-central1'
  },

  // Kubernetes running on LocalStack EKS emulation
  k8s: {
    version: '1.27',      // LocalStack supported version
    minNodes: 1,           // Single node for emulation
    maxNodes: 2,           // Scale for testing
    size: 'small'          // Lightweight for local
  },

  // PostgreSQL on LocalStack RDS emulation
  postgres: {
    engineVersion: '15',   // PostgreSQL version
    size: 'small',         // db.t3.small equivalent
    storageGb: 20         // Minimal storage for development
  },

  // ADFS simulation with AWS services
  adfs: {
    size: 'small',         // t3.small equivalent
    windowsVersion: '2022' // Windows Server version
  },

  // LocalStack-specific configuration
  terraformBridge: {
    enabled: true,
    provider: 'local',
    delegateState: false,
    sourcePath: './terraform/localstack'
  },

  // AWS emulator compliance
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

  // Network configuration for LocalStack
  network: {
    subnetCidr: '172.16.1.0/24'  // Subnet for services
  },

  // AWS-specific settings for emulation
  terraform: {
    backend: {
      type: 'local',
      bucket: 'localstack-terraform-state',
      prefix: 'chiral-emulator'
    }
  }
};
