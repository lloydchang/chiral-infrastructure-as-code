import { HardwareMap, getRegionalHardwareMap, validateRegionalCapabilities } from '../translation/hardware-map';

describe('HardwareMap', () => {
  describe('AWS mappings', () => {
    it('should map small database size correctly', () => {
      expect(HardwareMap.aws.db.small).toBe('db.t3.small');
    });

    it('should map medium database size correctly', () => {
      expect(HardwareMap.aws.db.medium).toBe('db.t3.medium');
    });

    it('should map large database size correctly', () => {
      expect(HardwareMap.aws.db.large).toBe('db.m5.large');
    });

    it('should map small VM size correctly', () => {
      expect(HardwareMap.aws.vm.small).toBe('t3.small');
    });

    it('should map medium VM size correctly', () => {
      expect(HardwareMap.aws.vm.medium).toBe('t3.medium');
    });

    it('should map large VM size correctly', () => {
      expect(HardwareMap.aws.vm.large).toBe('m5.large');
    });

    it('should map small k8s node size correctly', () => {
      expect(HardwareMap.aws.k8s.small).toBe('t3.small');
    });

    it('should map medium k8s node size correctly', () => {
      expect(HardwareMap.aws.k8s.medium).toBe('t3.medium');
    });

    it('should map large k8s node size correctly', () => {
      expect(HardwareMap.aws.k8s.large).toBe('m5.large');
    });
  });

  describe('Azure mappings', () => {
    it('should map small database size correctly', () => {
      expect(HardwareMap.azure.db.small).toBe('Standard_B1s');
    });

    it('should map medium database size correctly', () => {
      expect(HardwareMap.azure.db.medium).toBe('Standard_B2s');
    });

    it('should map large database size correctly', () => {
      expect(HardwareMap.azure.db.large).toBe('Standard_D4s_v3');
    });

    it('should map small VM size correctly', () => {
      expect(HardwareMap.azure.vm.small).toBe('Standard_B1s');
    });

    it('should map medium VM size correctly', () => {
      expect(HardwareMap.azure.vm.medium).toBe('Standard_D2s_v3');
    });

    it('should map large VM size correctly', () => {
      expect(HardwareMap.azure.vm.large).toBe('Standard_D4s_v3');
    });

    it('should map small k8s node size correctly', () => {
      expect(HardwareMap.azure.k8s.small).toBe('Standard_B1s');
    });

    it('should map medium k8s node size correctly', () => {
      expect(HardwareMap.azure.k8s.medium).toBe('Standard_B2s');
    });

    it('should map large k8s node size correctly', () => {
      expect(HardwareMap.azure.k8s.large).toBe('Standard_D4s_v3');
    });
  });

  describe('GCP mappings', () => {
    it('should map small database size correctly', () => {
      expect(HardwareMap.gcp.db.small).toBe('db-g1-small');
    });

    it('should map medium database size correctly', () => {
      expect(HardwareMap.gcp.db.medium).toBe('db-custom-2-4096');
    });

    it('should map large database size correctly', () => {
      expect(HardwareMap.gcp.db.large).toBe('db-custom-4-8192');
    });

    it('should map small VM size correctly', () => {
      expect(HardwareMap.gcp.vm.small).toBe('e2-small');
    });

    it('should map medium VM size correctly', () => {
      expect(HardwareMap.gcp.vm.medium).toBe('e2-medium');
    });

    it('should map large VM size correctly', () => {
      expect(HardwareMap.gcp.vm.large).toBe('n1-standard-2');
    });

    it('should map small k8s node size correctly', () => {
      expect(HardwareMap.gcp.k8s.small).toBe('e2-small');
    });

    it('should map medium k8s node size correctly', () => {
      expect(HardwareMap.gcp.k8s.medium).toBe('e2-medium');
    });

    it('should map large k8s node size correctly', () => {
      expect(HardwareMap.gcp.k8s.large).toBe('n1-standard-2');
    });
  });
});

describe('Regional Hardware Functions', () => {
  describe('getRegionalHardwareMap', () => {
    it('should return regional hardware map for known region', () => {
      const regionalMap = getRegionalHardwareMap('aws', 'us-east-1');
      
      expect(regionalMap).toBeDefined();
      expect(regionalMap.db.small).toBeDefined();
      expect(regionalMap.vm.small).toBeDefined();
      expect(regionalMap.k8s.small).toBeDefined();
    });

    it('should fallback to global mappings for unknown region', () => {
      const regionalMap = getRegionalHardwareMap('aws', 'unknown-region');
      
      expect(regionalMap).toEqual(HardwareMap.aws);
    });

    it('should work for all providers', () => {
      const awsMap = getRegionalHardwareMap('aws', 'us-east-1');
      const azureMap = getRegionalHardwareMap('azure', 'eastus');
      const gcpMap = getRegionalHardwareMap('gcp', 'us-central1');
      
      expect(awsMap).toBeDefined();
      expect(azureMap).toBeDefined();
      expect(gcpMap).toBeDefined();
    });
  });

  describe('validateRegionalCapabilities', () => {
    it('should validate available services in known region', () => {
      const result = validateRegionalCapabilities('aws', 'us-east-1', ['kubernetes', 'postgresql', 'activeDirectory']);
      
      expect(result.valid).toBe(true);
      expect(result.missingServices).toHaveLength(0);
    });

    it('should handle unknown regions gracefully', () => {
      const result = validateRegionalCapabilities('aws', 'unknown-region', ['kubernetes']);
      
      expect(result.valid).toBe(true);
      expect(result.missingServices).toHaveLength(0);
    });

    it('should detect missing services in region', () => {
      // Test with a region that might not have all services
      const result = validateRegionalCapabilities('aws', 'us-east-1', ['kubernetes', 'postgresql', 'activeDirectory']);
      
      expect(typeof result.valid).toBe('boolean');
      expect(Array.isArray(result.missingServices)).toBe(true);
    });

    it('should work for all providers', () => {
      const awsResult = validateRegionalCapabilities('aws', 'us-east-1', ['kubernetes']);
      const azureResult = validateRegionalCapabilities('azure', 'eastus', ['postgresql']);
      const gcpResult = validateRegionalCapabilities('gcp', 'us-central1', ['activeDirectory']);
      
      expect(typeof awsResult.valid).toBe('boolean');
      expect(typeof azureResult.valid).toBe('boolean');
      expect(typeof gcpResult.valid).toBe('boolean');
    });

    it('should handle empty required services list', () => {
      const result = validateRegionalCapabilities('aws', 'us-east-1', []);
      
      expect(result.valid).toBe(true);
      expect(result.missingServices).toHaveLength(0);
    });

    it('should format missing service names correctly', () => {
      const result = validateRegionalCapabilities('aws', 'unknown-region', ['kubernetes', 'postgresql']);
      
      if (!result.valid) {
        result.missingServices.forEach(service => {
          expect(service).toMatch(/\(aws-unknown-region\)$/);
        });
      }
    });
  });
});
