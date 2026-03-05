// File: src/translation/regional-metadata.ts

// Regional intelligence and compliance handling for multi-cloud deployments

export type ComplianceLevel = 'standard' | 'government' | 'financial' | 'restricted';

export interface RegionalCapabilities {
  /** Available services/features in this region */
  services: {
    kubernetes: boolean;
    postgresql: boolean;
    activeDirectory: boolean;
    // Add more services as needed
  };
  /** Instance types available in this region */
  instanceTypes: {
    small: string[];
    medium: string[];
    large: string[];
  };
  /** Database instance classes available */
  databaseClasses: {
    small: string[];
    medium: string[];
    large: string[];
  };
  /** Regional pricing tier or cost considerations */
  pricingTier: 'standard' | 'premium' | 'economy';
}

export interface RegionMetadata {
  /** Cloud provider */
  provider: 'aws' | 'azure' | 'gcp';
  /** Region identifier */
  regionId: string;
  /** Human-readable name */
  displayName: string;
  /** Compliance classification */
  complianceLevel: ComplianceLevel;
  /** Geographic location */
  geography: string;
  /** Capabilities available in this region */
  capabilities: RegionalCapabilities;
  /** Special handling requirements */
  specialHandling?: {
    /** Requires special authentication */
    specialAuth?: boolean;
    /** Limited API access */
    limitedApi?: boolean;
    /** Custom resource naming requirements */
    customNaming?: boolean;
  };
}

// Regional metadata database
export const RegionalMetadata: Record<string, RegionMetadata> = {
  // AWS Standard Regions
  'us-east-1': {
    provider: 'aws',
    regionId: 'us-east-1',
    displayName: 'US East (N. Virginia)',
    complianceLevel: 'standard',
    geography: 'us-east',
    capabilities: {
      services: {
        kubernetes: true,
        postgresql: true,
        activeDirectory: true,
      },
      instanceTypes: {
        small: ['t3.small'],
        medium: ['t3.medium'],
        large: ['m5.large', 'm5.xlarge'],
      },
      databaseClasses: {
        small: ['db.t3.small'],
        medium: ['db.t3.medium'],
        large: ['db.m5.large'],
      },
      pricingTier: 'standard',
    },
  },

  // AWS GovCloud
  'us-gov-east-1': {
    provider: 'aws',
    regionId: 'us-gov-east-1',
    displayName: 'AWS GovCloud (US-East)',
    complianceLevel: 'government',
    geography: 'us-gov-east',
    capabilities: {
      services: {
        kubernetes: true,
        postgresql: true,
        activeDirectory: true,
      },
      instanceTypes: {
        small: ['t3.small'],
        medium: ['t3.medium'],
        large: ['m5.large'],
      },
      databaseClasses: {
        small: ['db.t3.small'],
        medium: ['db.t3.medium'],
        large: ['db.m5.large'],
      },
      pricingTier: 'premium',
    },
    specialHandling: {
      specialAuth: true,
      limitedApi: true,
    },
  },

  // Azure Commercial
  'eastus': {
    provider: 'azure',
    regionId: 'eastus',
    displayName: 'East US',
    complianceLevel: 'standard',
    geography: 'us-east',
    capabilities: {
      services: {
        kubernetes: true,
        postgresql: true,
        activeDirectory: true,
      },
      instanceTypes: {
        small: ['Standard_B2s'],
        medium: ['Standard_D2s_v3'],
        large: ['Standard_D4s_v3'],
      },
      databaseClasses: {
        small: ['Standard_B1s'],
        medium: ['Standard_B2s'],
        large: ['Standard_D4s_v3'],
      },
      pricingTier: 'standard',
    },
  },

  // Azure Government
  'usgovvirginia': {
    provider: 'azure',
    regionId: 'usgovvirginia',
    displayName: 'US Gov Virginia',
    complianceLevel: 'government',
    geography: 'us-gov-east',
    capabilities: {
      services: {
        kubernetes: true,
        postgresql: true,
        activeDirectory: true,
      },
      instanceTypes: {
        small: ['Standard_B2s'],
        medium: ['Standard_D2s_v3'],
        large: ['Standard_D4s_v3'],
      },
      databaseClasses: {
        small: ['Standard_B1s'],
        medium: ['Standard_B2s'],
        large: ['Standard_D4s_v3'],
      },
      pricingTier: 'premium',
    },
    specialHandling: {
      specialAuth: true,
      customNaming: true,
    },
  },

  // GCP Standard
  'us-central1': {
    provider: 'gcp',
    regionId: 'us-central1',
    displayName: 'Iowa',
    complianceLevel: 'standard',
    geography: 'us-central',
    capabilities: {
      services: {
        kubernetes: true,
        postgresql: true,
        activeDirectory: false, // GCP doesn't have native AD
      },
      instanceTypes: {
        small: ['e2-small'],
        medium: ['e2-medium'],
        large: ['n1-standard-2'],
      },
      databaseClasses: {
        small: ['db-f1-micro'],
        medium: ['db-g1-small'],
        large: ['db-custom-2-4096'],
      },
      pricingTier: 'standard',
    },
  },
};

/**
 * Get regional metadata for a specific region
 */
export function getRegionalMetadata(provider: string, regionId: string): RegionMetadata | null {
  const key = `${provider}-${regionId}`;
  return RegionalMetadata[key] || null;
}

/**
 * Check if a service is available in a specific region
 */
export function isServiceAvailable(provider: string, regionId: string, service: keyof RegionalCapabilities['services']): boolean {
  const metadata = getRegionalMetadata(provider, regionId);
  return metadata?.capabilities.services[service] ?? false;
}

/**
 * Get available instance types for a region and size
 */
export function getRegionalInstanceTypes(provider: string, regionId: string, size: 'small' | 'medium' | 'large'): string[] {
  const metadata = getRegionalMetadata(provider, regionId);
  return metadata?.capabilities.instanceTypes[size] || [];
}

/**
 * Get compliance level for a region
 */
export function getComplianceLevel(provider: string, regionId: string): ComplianceLevel {
  const metadata = getRegionalMetadata(provider, regionId);
  return metadata?.complianceLevel || 'standard';
}
