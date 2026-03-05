import { HardwareMap } from '../translation/hardware-map';

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
      expect(HardwareMap.aws.vm.large).toBe('t3.large');
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
