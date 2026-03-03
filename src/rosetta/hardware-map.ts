// File: src/rosetta/hardware-map.ts

// 3. The Rosetta Layer (Translation)

// Maps abstract sizes to specific AWS Instance Types and Azure SKUs.

import { WorkloadSize } from '../intent';

interface CloudSkuMap {
  db: Record<WorkloadSize, string>;
  vm: Record<WorkloadSize, string>; // For AD FS Node
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
    }
  } as CloudSkuMap
};
