// File: src/intent/index.ts

// 2. The Intent Layer (Types)

// Defines the abstract business requirements (The Schema).

export type EnvironmentTier = 'dev' | 'prod';
export type WorkloadSize = 'small' | 'medium' | 'large';
export type ComplianceFramework = 'none' | 'soc2' | 'iso27001' | 'hipaa' | 'fedramp-low' | 'fedramp-moderate' | 'fedramp-high' | 'govramp-low' | 'govramp-moderate' | 'govramp-high' | 'hitrust-low' | 'hitrust-moderate' | 'hitrust-high' | 'hitech-low' | 'hitech-moderate' | 'hitech-high' | 'hipaa-low' | 'hipaa-moderate' | 'hipaa-high';
export type DeploymentStrategy = 'greenfield' | 'progressive' | 'parallel';

export interface KubernetesIntent {
  version: string;
  minNodes: number;
  maxNodes: number;
  size: WorkloadSize; // For consistent node sizing across clouds
}

export interface DatabaseIntent {
  engineVersion: string; // e.g., "15"
  storageGb: number;
  size: WorkloadSize;
}

export interface AdfsIntent {
  // AD FS runs on Windows Server. We define the compute power here.
  size: WorkloadSize;
  windowsVersion: '2019' | '2022';
}

export interface ChiralSystem {
  projectName: string;
  environment: EnvironmentTier;
  networkCidr: string;
  
  // Optional configurable settings (with sensible defaults)
  region?: {
    aws?: string;
    azure?: string;
    gcp?: string;
  };
  network?: {
    subnetCidr?: string; // Default subnet within networkCidr
  };
  terraformBridge?: {
    enabled?: boolean;
    provider?: 'aws' | 'azure' | 'gcp';
    delegateState?: boolean;
    sourcePath?: string;
  };
  terraform?: {
    backend?: {
      type?: 's3' | 'gcs' | 'azurerm' | 'local';
      bucket: string;
      prefix?: string;
    };
  };
  pulumiBridge?: {
    enabled?: boolean;
    provider?: 'aws' | 'azure' | 'gcp';
    delegateState?: boolean;
    sourcePath?: string;
  };
  
  // State management and migration settings
  migration?: {
    strategy?: DeploymentStrategy; // How to migrate from existing infrastructure
    sourceState?: string; // Path to existing Terraform state file for migration
    validateCompliance?: boolean; // Check compliance during migration
    rollbackPlan?: Array<{ description: string; notes?: string }>; // Rollback procedures
  };
  
  // Compliance and data sovereignty settings
  compliance?: {
    framework?: ComplianceFramework; // Compliance framework requirements
    dataResidency?: {
      aws?: string; // AWS region for data residency
      azure?: string; // Azure region for data residency
      gcp?: string; // GCP region for data residency
    };
    encryptionAtRest?: boolean; // Require encryption at rest
    auditLogging?: boolean; // Enable comprehensive audit logging
  };
  
  // The Three Pillars
  k8s: KubernetesIntent;
  postgres: DatabaseIntent;
  adfs: AdfsIntent;
}
