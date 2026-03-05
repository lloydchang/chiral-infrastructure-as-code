import { checkCompliance } from '../validation';
import { ChiralSystem } from '../intent';

describe('Compliance Checks', () => {
  describe('FedRAMP Compliance', () => {
    it('should pass FedRAMP Low with basic requirements', () => {
      const config: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' },
        compliance: {
          framework: 'fedramp-low',
          encryptionAtRest: true,
          auditLogging: true
        }
      };

      const result = checkCompliance(config, 'fedramp-low');
      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail FedRAMP Low without encryption', () => {
      const config: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' },
        compliance: {
          framework: 'fedramp-low',
          auditLogging: true
        }
      };

      const result = checkCompliance(config, 'fedramp-low');
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('FedRAMP LOW: Encryption at rest required');
    });

    it('should require GovCloud for FedRAMP Moderate', () => {
      const config: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        region: { aws: 'us-east-1', azure: 'East US', gcp: 'us-central1' },
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' },
        compliance: {
          framework: 'fedramp-moderate',
          encryptionAtRest: true,
          auditLogging: true
        }
      };

      const result = checkCompliance(config, 'fedramp-moderate');
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('FedRAMP MODERATE: AWS GovCloud or equivalent controls required');
    });

    it('should pass FedRAMP High with proper configuration', () => {
      const config: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        region: { aws: 'us-gov-east-1', azure: 'usgovvirginia', gcp: 'us-central1' },
        k8s: { version: '1.29', minNodes: 3, maxNodes: 15, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' },
        compliance: {
          framework: 'fedramp-high',
          encryptionAtRest: true,
          auditLogging: true
        }
      };

      const result = checkCompliance(config, 'fedramp-high');
      expect(result.compliant).toBe(true);
    });

    it('should fail FedRAMP High with too many nodes', () => {
      const config: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        region: { aws: 'us-gov-east-1', azure: 'usgovvirginia', gcp: 'us-central1' },
        k8s: { version: '1.29', minNodes: 3, maxNodes: 25, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' },
        compliance: {
          framework: 'fedramp-high',
          encryptionAtRest: true,
          auditLogging: true
        }
      };

      const result = checkCompliance(config, 'fedramp-high');
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('FedRAMP HIGH: Large node counts require additional security controls');
    });
  });

  describe('GovRAMP Compliance', () => {
    it('should pass GovRAMP Low with basic requirements', () => {
      const config: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' },
        compliance: {
          framework: 'govramp-low',
          encryptionAtRest: true,
          auditLogging: true,
          dataResidency: { aws: 'us-east-1', azure: 'East US', gcp: 'us-central1' }
        }
      };

      const result = checkCompliance(config, 'govramp-low');
      expect(result.compliant).toBe(true);
    });

    it('should fail GovRAMP Low without data residency', () => {
      const config: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' },
        compliance: {
          framework: 'govramp-low',
          encryptionAtRest: true,
          auditLogging: true
        }
      };

      const result = checkCompliance(config, 'govramp-low');
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('GovRAMP LOW: Data residency requirements must be specified');
    });

    it('should pass GovRAMP Moderate with proper configuration', () => {
      const config: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: { version: '1.29', minNodes: 2, maxNodes: 10, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' },
        compliance: {
          framework: 'govramp-moderate',
          encryptionAtRest: true,
          auditLogging: true,
          dataResidency: { aws: 'us-east-1', azure: 'East US', gcp: 'us-central1' }
        }
      };

      const result = checkCompliance(config, 'govramp-moderate');
      expect(result.compliant).toBe(true);
    });

    it('should fail GovRAMP High with insufficient storage', () => {
      const config: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: { version: '1.29', minNodes: 3, maxNodes: 12, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 20 },
        adfs: { size: 'large', windowsVersion: '2022' },
        compliance: {
          framework: 'govramp-high',
          encryptionAtRest: true,
          auditLogging: true,
          dataResidency: { aws: 'us-east-1', azure: 'East US', gcp: 'us-central1' }
        }
      };

      const result = checkCompliance(config, 'govramp-high');
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('GovRAMP HIGH: Production databases must have minimum 50GB storage');
    });
  });

  describe('Existing Compliance Frameworks', () => {
    it('should still work with SOC2', () => {
      const config: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' },
        compliance: {
          framework: 'soc2',
          encryptionAtRest: true,
          auditLogging: true
        }
      };

      const result = checkCompliance(config, 'soc2');
      expect(result.compliant).toBe(true);
    });
  });
});
