// File: src/translation/hardware-map.ts

// 3. The Translation Layer

// Region-aware hardware mapping that adapts to regional capabilities and compliance requirements

import { WorkloadSize } from '../intent';
import { RegionalMetadata, getRegionalInstanceTypes } from './regional-metadata';

interface CloudSkuMap {
  db: Record<WorkloadSize, string>;
  vm: Record<WorkloadSize, string>; // For AD FS Node
  k8s: Record<WorkloadSize, string>; // For Kubernetes nodes
}

/**
 * Legacy global hardware mappings (for backward compatibility)
 * These will be phased out in favor of region-aware mappings
 */
export const HardwareMap = {
  aws: {
    db: {
      small: 'db.t3.small',
      medium: 'db.t3.medium',
      large: 'db.m5.large'
    },
    vm: {
      small: 't3.small',
      medium: 't3.medium',
      large: 't3.large'
    },
    k8s: {
      small: 't3.small',
      medium: 't3.medium',
      large: 'm5.large'
    }
  } as CloudSkuMap,

  azure: {
    db: {
      small: 'Standard_B1s',
      medium: 'Standard_B2s',
      large: 'Standard_D4s_v3'
    },
    vm: {
      small: 'Standard_B1s',
      medium: 'Standard_D2s_v3',
      large: 'Standard_D4s_v3'
    },
    k8s: {
      small: 'Standard_B2s',
      medium: 'Standard_D2s_v3',
      large: 'Standard_D4s_v3'
    }
  } as CloudSkuMap,

  gcp: {
    db: {
      small: 'db-g1-small',
      medium: 'db-custom-2-4096',
      large: 'db-custom-4-8192'
    },
    vm: {
      small: 'e2-small',
      medium: 'e2-medium',
      large: 'n1-standard-2'
    },
    k8s: {
      small: 'e2-small',
      medium: 'e2-medium',
      large: 'n1-standard-2'
    }
  } as CloudSkuMap
};

/**
 * Get region-aware hardware mappings that consider regional capabilities
 */
export function getRegionalHardwareMap(provider: 'aws' | 'azure' | 'gcp', regionId: string): CloudSkuMap {
  // For now, fall back to legacy mappings
  // In a full implementation, this would query regional metadata
  // and return region-specific instance types

  const regionKey = `${provider}-${regionId}`;
  const regionalData = RegionalMetadata[regionKey];

  if (regionalData) {
    // Use region-specific instance types if available
    const instanceTypes = regionalData.capabilities.instanceTypes;
    const dbClasses = regionalData.capabilities.databaseClasses;

    return {
      db: {
        small: dbClasses.small[0] || HardwareMap[provider].db.small,
        medium: HardwareMap[provider].db.medium, // Use global mapping for medium
        large: dbClasses.large[0] || HardwareMap[provider].db.large
      },
      vm: {
        small: instanceTypes.small[0] || HardwareMap[provider].vm.small,
        medium: HardwareMap[provider].vm.medium, // Use global mapping for medium
        large: instanceTypes.large[0] || HardwareMap[provider].vm.large
      },
      k8s: {
        small: instanceTypes.small[0] || HardwareMap[provider].k8s.small,
        medium: HardwareMap[provider].k8s.medium, // Use global mapping for medium
        large: instanceTypes.large[0] || HardwareMap[provider].k8s.large
      }
    };
  }

  // Fall back to legacy global mappings
  return HardwareMap[provider];
}

/**
 * Check if required services are available in the specified region
 */
export function validateRegionalCapabilities(
  provider: 'aws' | 'azure' | 'gcp',
  regionId: string,
  requiredServices: ('kubernetes' | 'postgresql' | 'activeDirectory')[]
): { valid: boolean; missingServices: string[] } {
  const regionKey = `${provider}-${regionId}`;
  const regionalData = RegionalMetadata[regionKey];

  if (!regionalData) {
    // Unknown region - assume services are available (legacy behavior)
    return { valid: true, missingServices: [] };
  }

  const missingServices = requiredServices.filter(
    service => !regionalData.capabilities.services[service]
  );

  return {
    valid: missingServices.length === 0,
    missingServices: missingServices.map(s => `${s} (${provider}-${regionId})`)
  };
}
