import { mapInstanceTypeToWorkloadSize, mapDbClassToWorkloadSize } from '../translation/import-map';

describe('Import Mappings', () => {
  describe('mapInstanceTypeToWorkloadSize', () => {
    it('maps AWS instance types correctly', () => {
      expect(mapInstanceTypeToWorkloadSize('t3.small', 'aws')).toBe('small');
      expect(mapInstanceTypeToWorkloadSize('t3.medium', 'aws')).toBe('medium'); // Fixed mapping
      expect(mapInstanceTypeToWorkloadSize('t3.large', 'aws')).toBe('large');
      expect(mapInstanceTypeToWorkloadSize('unknown', 'aws')).toBe('small'); // Default
    });

    it('maps Azure VM sizes correctly', () => {
      expect(mapInstanceTypeToWorkloadSize('Standard_B1s', 'azure')).toBe('small');
      expect(mapInstanceTypeToWorkloadSize('Standard_D2s_v3', 'azure')).toBe('small'); // Legacy mapping
      expect(mapInstanceTypeToWorkloadSize('Standard_D4s_v3', 'azure')).toBe('large');
    });

    it('maps GCP machine types correctly', () => {
      expect(mapInstanceTypeToWorkloadSize('e2-small', 'gcp')).toBe('small');
      expect(mapInstanceTypeToWorkloadSize('e2-medium', 'gcp')).toBe('medium'); // Fixed mapping
      expect(mapInstanceTypeToWorkloadSize('n1-standard-2', 'gcp')).toBe('large');
    });
  });

  describe('mapDbClassToWorkloadSize', () => {
    it('maps AWS DB classes correctly', () => {
      expect(mapDbClassToWorkloadSize('db.t3.small', 'aws')).toBe('small');
      expect(mapDbClassToWorkloadSize('db.t3.medium', 'aws')).toBe('medium'); // Fixed mapping
      expect(mapDbClassToWorkloadSize('db.m5.large', 'aws')).toBe('large');
    });

    it('maps Azure DB SKUs correctly', () => {
      expect(mapDbClassToWorkloadSize('Standard_B2s', 'azure')).toBe('small');
      expect(mapDbClassToWorkloadSize('Standard_D4s_v3', 'azure')).toBe('large');
    });

    it('maps GCP DB tiers correctly', () => {
      expect(mapDbClassToWorkloadSize('db-f1-micro', 'gcp')).toBe('small');
      expect(mapDbClassToWorkloadSize('db-custom-2-4096', 'gcp')).toBe('medium');
      expect(mapDbClassToWorkloadSize('db-custom-4-8192', 'gcp')).toBe('large');
    });
  });
});
