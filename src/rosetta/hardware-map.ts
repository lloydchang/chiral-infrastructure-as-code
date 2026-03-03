// File: src/rosetta/hardware-map.ts

// 3. The Rosetta Layer (Translation)

// Maps abstract sizes to specific AWS Instance Types and Azure SKUs.

import { WorkloadSize } from '../intent';

interface CloudSkuMap {
  db: Record<WorkloadSize, string>;
  vm: Record<WorkloadSize, string>; // For AD FS Node
  k8s: Record<WorkloadSize, string>; // For Kubernetes nodes
}

export const HardwareMap = {
  aws: {
    db: {
      small: 't3.medium',
      large: 'm5.large'
    },
    vm: {
      small: 't3.large',
      large: 'm5.xlarge'
    },
    k8s: {
      small: 't3.medium',
      large: 'm5.large'
    }
  } as CloudSkuMap,

  azure: {
    db: {
      small: 'Standard_B2s',
      large: 'Standard_D4s_v3'
    },
    vm: {
      small: 'Standard_D2s_v3',
      large: 'Standard_D4s_v3'
    },
    k8s: {
      small: 'Standard_D2s_v3',
      large: 'Standard_D4s_v3'
    }
  } as CloudSkuMap,

  gcp: {
    db: {
      small: 'db-f1-micro',
      large: 'db-custom-2-4096'
    },
    vm: {
      small: 'e2-medium',
      large: 'n1-standard-2'
    },
    k8s: {
      small: 'e2-medium',
      large: 'n1-standard-2'
    }
  } as CloudSkuMap
};
