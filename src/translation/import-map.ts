// File: src/translation/import-map.ts

// Reverse mappings for importing IaC into Chiral intent

import { WorkloadSize, EnvironmentTier, ChiralSystem } from '../intent';

// AWS mappings
const awsInstanceTypeToSize: { [key: string]: WorkloadSize } = {
  't3.small': 'small',
  't3.medium': 'medium', // Fixed: was incorrectly mapped to small
  't3.large': 'large',
  'm5.large': 'large',
  'm5.xlarge': 'large',
};

const awsDbClassToSize: { [key: string]: WorkloadSize } = {
  'db.t3.small': 'small',
  'db.t3.medium': 'medium', // Fixed: was incorrectly mapped to small
  'db.m5.large': 'large',
  'db.m5.xlarge': 'large',
};

// Azure mappings
const azureVmSizeToSize: { [key: string]: WorkloadSize } = {
  'Standard_B1s': 'small',
  'Standard_B2s': 'medium', // Fixed: was incorrectly mapped to small
  'Standard_D2s_v3': 'medium', // Fixed: was incorrectly mapped to small
  'Standard_D4s_v3': 'large',
};

const azureDbSkuToSize: { [key: string]: WorkloadSize } = {
  'Standard_B1s': 'small',
  'Standard_B2s': 'medium', // Fixed: was incorrectly mapped to small
  'Standard_D2s_v3': 'large', // This is used for large DB instances
  'Standard_D4s_v3': 'large',
};

// GCP mappings
const gcpMachineTypeToSize: { [key: string]: WorkloadSize } = {
  'e2-small': 'small',
  'e2-medium': 'medium', // Fixed: was incorrectly mapped to small
  'n1-standard-2': 'large',
  'n1-standard-4': 'large',
};

const gcpDbTierToSize: { [key: string]: WorkloadSize } = {
  'db-g1-small': 'small',
  'db-custom-2-4096': 'medium',
  'db-custom-4-8192': 'large',
  'db-n1-standard-2': 'large',
};

// Local development mappings
const localInstanceTypeToSize: { [key: string]: WorkloadSize } = {
  'docker-compose': 'small',
  'minikube': 'small',
  'kind': 'small',
  'k3s': 'small',
  'docker-desktop': 'medium',
  'lima': 'small',
  'colima': 'medium',
};

const localDbClassToSize: { [key: string]: WorkloadSize } = {
  'postgres': 'small',
  'postgres-container': 'small',
  'mysql': 'small',
  'sqlite': 'small',
  'mariadb': 'small',
};

export function mapInstanceTypeToWorkloadSize(instanceType: string, provider: 'aws' | 'azure' | 'gcp' | 'local'): WorkloadSize {
  switch (provider) {
    case 'aws':
      return awsInstanceTypeToSize[instanceType] || 'small'; // Default to small if unknown
    case 'azure':
      return azureVmSizeToSize[instanceType] || 'small';
    case 'gcp':
      return gcpMachineTypeToSize[instanceType] || 'small';
    case 'local':
      return localInstanceTypeToSize[instanceType] || 'small';
    default:
      return 'small';
  }
}

export function mapDbClassToWorkloadSize(dbClass: string, provider: 'aws' | 'azure' | 'gcp' | 'local'): WorkloadSize {
  switch (provider) {
    case 'aws':
      return awsDbClassToSize[dbClass] || 'small';
    case 'azure':
      return azureDbSkuToSize[dbClass] || 'small';
    case 'gcp':
      return gcpDbTierToSize[dbClass] || 'small';
    case 'local':
      return localDbClassToSize[dbClass] || 'small';
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

export function inferRegion(provider: 'aws' | 'azure' | 'gcp' | 'local', providerConfig?: any): { aws?: string, azure?: string, gcp?: string, local?: string } | undefined {
  if (provider === 'local') {
    return { local: 'localhost' };
  }
  
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
  provider: 'aws' | 'azure' | 'gcp' | 'local',
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
    // Example: if AWS EKS, Azure AKS, GCP GKE, or local K8s
    if (resource.type === 'aws_eks_cluster' || 
        resource.type === 'Microsoft.ContainerService/managedClusters' || 
        resource.type === 'google_container_cluster' ||
        (provider === 'local' && (resource.type === 'kubernetes_cluster' || resource.type === 'minikube' || resource.type === 'kind'))) {
      config.k8s.version = resource.properties?.kubernetesVersion || config.k8s.version;
      config.k8s.minNodes = resource.properties?.minCount || config.k8s.minNodes;
      config.k8s.maxNodes = resource.properties?.maxCount || config.k8s.maxNodes;
      // Map node size if available
    }
    
    // Database inference for all providers
    if (resource.type?.includes('rds') || 
        resource.type?.includes('postgresql') || 
        resource.type?.includes('database') ||
        (provider === 'local' && (resource.type === 'postgres_container' || resource.type === 'database'))) {
      config.postgres.engineVersion = resource.properties?.engineVersion || config.postgres.engineVersion;
      config.postgres.storageGb = resource.properties?.allocatedStorage || config.postgres.storageGb;
      // Map database size if available
    }
  }

  return config;
}
