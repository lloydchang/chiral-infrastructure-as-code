import { HardwareMap } from '../rosetta/hardware-map';

describe('HardwareMap', () => {
  describe('AWS mappings', () => {
    it('should map small database size correctly', () => {
      expect(HardwareMap.aws.db.small).toBe('t3.medium');
    });

    it('should map large database size correctly', () => {
      expect(HardwareMap.aws.db.large).toBe('m5.large');
    });

    it('should map small VM size correctly', () => {
      expect(HardwareMap.aws.vm.small).toBe('t3.large');
    });

    it('should map large VM size correctly', () => {
      expect(HardwareMap.aws.vm.large).toBe('m5.xlarge');
    });

    it('should map small k8s node size correctly', () => {
      expect(HardwareMap.aws.k8s.small).toBe('t3.medium');
    });

    it('should map large k8s node size correctly', () => {
      expect(HardwareMap.aws.k8s.large).toBe('m5.large');
    });
  });

  describe('Azure mappings', () => {
    it('should map small database size correctly', () => {
      expect(HardwareMap.azure.db.small).toBe('Standard_B2s');
    });

    it('should map large database size correctly', () => {
      expect(HardwareMap.azure.db.large).toBe('Standard_D4s_v3');
    });

    it('should map small VM size correctly', () => {
      expect(HardwareMap.azure.vm.small).toBe('Standard_D2s_v3');
    });

    it('should map large VM size correctly', () => {
      expect(HardwareMap.azure.vm.large).toBe('Standard_D4s_v3');
    });

    it('should map small k8s node size correctly', () => {
      expect(HardwareMap.azure.k8s.small).toBe('Standard_D2s_v3');
    });

    it('should map large k8s node size correctly', () => {
      expect(HardwareMap.azure.k8s.large).toBe('Standard_D4s_v3');
    });
  });

  describe('GCP mappings', () => {
    it('should map small database size correctly', () => {
      expect(HardwareMap.gcp.db.small).toBe('db-f1-micro');
    });

    it('should map large database size correctly', () => {
      expect(HardwareMap.gcp.db.large).toBe('db-custom-2-4096');
    });

    it('should map small VM size correctly', () => {
      expect(HardwareMap.gcp.vm.small).toBe('e2-medium');
    });

    it('should map large VM size correctly', () => {
      expect(HardwareMap.gcp.vm.large).toBe('n1-standard-2');
    });

    it('should map small k8s node size correctly', () => {
      expect(HardwareMap.gcp.k8s.small).toBe('e2-medium');
    });

    it('should map large k8s node size correctly', () => {
      expect(HardwareMap.gcp.k8s.large).toBe('n1-standard-2');
    });
  });
});
