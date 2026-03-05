import { checkCompliance } from '../validation';
import { ChiralSystem } from '../intent';

describe('Compliance Checks', () => {
  describe('ISO 27001 Compliance', () => {
    it('should pass ISO 27001 with comprehensive controls', () => {
      const config: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '192.168.0.0/16',
        region: { aws: 'us-east-1', azure: 'East US', gcp: 'us-central1' },
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' },
        compliance: {
          framework: 'iso27001',
          encryptionAtRest: true,
          encryptionInTransit: true,
          auditLogging: true,
          securityControls: {
            backupAndRecovery: true,
            malwareProtection: true,
            incidentResponse: true,
            complianceMonitoring: true
          }
        }
      };

      const result = checkCompliance(config, 'iso27001');
      console.log('ISO 27001 violations:', result.violations);
      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail ISO 27001 without encryption', () => {
      const config: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '192.168.0.0/16',
        region: { aws: 'us-east-1', azure: 'East US', gcp: 'us-central1' },
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' },
        compliance: {
          framework: 'iso27001',
          auditLogging: true,
          securityControls: {
            backupAndRecovery: true,
            malwareProtection: true,
            incidentResponse: true,
            complianceMonitoring: true
          }
        }
      };

      const result = checkCompliance(config, 'iso27001');
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('ISO 27001: A.10.1.1 - Encryption at rest required for data protection');
    });

    it('should fail ISO 27001 with default network CIDR', () => {
      const config: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        region: { aws: 'us-east-1', azure: 'East US', gcp: 'us-central1' },
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' },
        compliance: {
          framework: 'iso27001',
          encryptionAtRest: true,
          auditLogging: true,
          securityControls: {
            backupAndRecovery: true,
            malwareProtection: true,
            incidentResponse: true,
            complianceMonitoring: true
          }
        }
      };

      const result = checkCompliance(config, 'iso27001');
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('ISO 27001: A.9.1.2 - Default network CIDR may not meet access control requirements');
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
          auditLogging: true,
          securityControls: {
            networkSegmentation: true,
            mfaRequired: true
          }
        }
      };

      const result = checkCompliance(config, 'soc2');
      expect(result.compliant).toBe(true);
    });

    it('should still work with ISO27001', () => {
      const config: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        region: { aws: 'us-east-1', azure: 'East US', gcp: 'us-central1' },
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' },
        compliance: {
          framework: 'iso27001',
          encryptionAtRest: true,
          auditLogging: true,
          securityControls: {
            backupAndRecovery: true,
            malwareProtection: true,
            incidentResponse: true,
            complianceMonitoring: true
          }
        }
      };

      const result = checkCompliance(config, 'iso27001');
      expect(result.compliant).toBe(true);
    });
  });
});
