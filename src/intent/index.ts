// File: src/intent/index.ts

// 2. The Intent Layer (Types)

// Defines the abstract business requirements (The Schema).

export type EnvironmentTier = 'dev' | 'prod';
export type WorkloadSize = 'small' | 'large';

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
  terraform?: { // GCP-specific Terraform backend settings
    backend?: {
      type: 'gcs'; // Currently only GCS supported for GCP
      bucket: string;
      prefix?: string; // Optional path prefix within bucket
    };
  };
  
  // The Three Pillars
  k8s: KubernetesIntent;
  postgres: DatabaseIntent;
  adfs: AdfsIntent;
}
