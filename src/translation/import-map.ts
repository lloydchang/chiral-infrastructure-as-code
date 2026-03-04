// File: src/translation/import-map.ts

// Reverse mappings for importing IaC into Chiral intent

import { WorkloadSize, EnvironmentTier, ChiralSystem } from '../intent';

// AWS mappings
const awsInstanceTypeToSize: { [key: string]: WorkloadSize } = {
  't3.medium': 'small',
  't3.large': 'large',
  'm5.large': 'large',
  't3.small': 'small',
  'm5.xlarge': 'large',
};

const awsDbClassToSize: { [key: string]: WorkloadSize } = {
  'db.t3.medium': 'small',
  'db.m5.large': 'large',
  'db.t3.small': 'small',
  'db.m5.xlarge': 'large',
};

// Azure mappings
const azureVmSizeToSize: { [key: string]: WorkloadSize } = {
  'Standard_B2s': 'small',
  'Standard_D4s_v3': 'large',
  'Standard_D2s_v3': 'small',
};

const azureDbSkuToSize: { [key: string]: WorkloadSize } = {
  'Standard_B2s': 'small',
  'Standard_D4s_v3': 'large',
  'Standard_D2s_v3': 'small',
};

// GCP mappings
const gcpMachineTypeToSize: { [key: string]: WorkloadSize } = {
  'e2-medium': 'small',
  'n1-standard-2': 'large',
  'f1-micro': 'small',
  'n1-standard-4': 'large',
};

const gcpDbTierToSize: { [key: string]: WorkloadSize } = {
  'db-f1-micro': 'small',
  'db-custom-2-4096': 'large',
  'db-n1-standard-2': 'large',
};

export function mapInstanceTypeToWorkloadSize(instanceType: string, provider: 'aws' | 'azure' | 'gcp'): WorkloadSize {
  switch (provider) {
    case 'aws':
      return awsInstanceTypeToSize[instanceType] || 'small'; // Default to small if unknown
    case 'azure':
      return azureVmSizeToSize[instanceType] || 'small';
    case 'gcp':
      return gcpMachineTypeToSize[instanceType] || 'small';
    default:
      return 'small';
  }
}

export function mapDbClassToWorkloadSize(dbClass: string, provider: 'aws' | 'azure' | 'gcp'): WorkloadSize {
  switch (provider) {
    case 'aws':
      return awsDbClassToSize[dbClass] || 'small';
    case 'azure':
      return azureDbSkuToSize[dbClass] || 'small';
    case 'gcp':
      return gcpDbTierToSize[dbClass] || 'small';
    default:
      return 'small';
  }
}

// Placeholder for other mappings
export function inferEnvironment(stackName?: string): EnvironmentTier {
  if (stackName?.toLowerCase().includes('prod')) return 'prod';
  return 'dev'; // Default
}

export function inferProjectName(stackName?: string, defaultName: string = 'imported-project'): string {
  return stackName || defaultName;
}

export function inferRegion(provider: 'aws' | 'azure' | 'gcp', providerConfig?: any): { aws?: string, azure?: string, gcp?: string } | undefined {
  const region = providerConfig?.region || providerConfig?.location;
  if (region) {
    return { [provider]: region };
  }
  return undefined;
}

export function inferNetworkCidr(resources: any[]): string {
  // Look for VPC or VNet CIDR in resources
  // Placeholder: return default
  return '10.0.0.0/16';
}

// Function to build ChiralSystem from parsed IaC resources
export function buildChiralSystemFromResources(
  resources: any[],
  provider: 'aws' | 'azure' | 'gcp',
  stackName?: string
): ChiralSystem {
  // Initialize with defaults
  const config: ChiralSystem = {
    projectName: inferProjectName(stackName),
    environment: inferEnvironment(stackName),
    networkCidr: inferNetworkCidr(resources),
    region: inferRegion(provider, {}),
    k8s: { version: '1.27', minNodes: 1, maxNodes: 3, size: 'small' },
    postgres: { engineVersion: '15', storageGb: 20, size: 'small' },
    adfs: { size: 'small', windowsVersion: '2022' },
  };

  // Scan resources to infer intent
  for (const resource of resources) {
    // Example: if AWS EKS, set k8s
    // This is placeholder; actual implementation would parse resource types and properties
    if (resource.type === 'aws_eks_cluster' || resource.type === 'Microsoft.ContainerService/managedClusters') {
      config.k8s.version = resource.properties?.kubernetesVersion || config.k8s.version;
      config.k8s.minNodes = resource.properties?.minCount || config.k8s.minNodes;
      config.k8s.maxNodes = resource.properties?.maxCount || config.k8s.maxNodes;
      // Map node size if available
    }
    // Similar for DB and VM
  }

  return config;
}
