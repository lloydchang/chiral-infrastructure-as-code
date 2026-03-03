// File: src/intent/index.ts

// 2. The Intent Layer (Types)

// Defines the abstract business requirements (The Schema).

export type EnvironmentTier = 'dev' | 'prod';
export type WorkloadSize = 'small' | 'large';

export interface KubernetesIntent {
  version: string;
  minNodes: number;
  maxNodes: number;
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
  
  // The Three Pillars
  k8s: KubernetesIntent;
  postgres: DatabaseIntent;
  adfs: AdfsIntent;
}
