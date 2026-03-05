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

  describe('Healthcare Compliance', () => {
    it('should pass HIPAA Low with basic requirements', () => {
      const config: ChiralSystem = {
        projectName: 'healthcare-system',
        environment: 'prod',
        networkCidr: '192.168.0.0/16',
        region: { aws: 'us-east-1' },
        k8s: { version: '1.35', minNodes: 2, maxNodes: 5, size: 'medium' },
        postgres: { engineVersion: '15', size: 'medium', storageGb: 50 },
        adfs: { size: 'medium', windowsVersion: '2022' },
        compliance: {
          framework: 'hipaa-low',
          encryptionAtRest: true,
          auditLogging: true
        }
      };

      const result = checkCompliance(config, 'hipaa-low');
      expect(result.compliant).toBe(true);
    });

    it('should fail HIPAA High without data residency', () => {
      const config: ChiralSystem = {
        projectName: 'healthcare-system',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: { version: '1.35', minNodes: 2, maxNodes: 5, size: 'medium' },
        postgres: { engineVersion: '15', size: 'medium', storageGb: 50 },
        adfs: { size: 'small', windowsVersion: '2022' },
        compliance: {
          framework: 'hipaa-high',
          encryptionAtRest: true,
          auditLogging: true
        }
      };

      const result = checkCompliance(config, 'hipaa-high');
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('HIPAA HIGH: Data residency requirements must be explicitly specified');
    });

    it('should pass HITRUST CSF Moderate with proper configuration', () => {
      const config: ChiralSystem = {
        projectName: 'healthcare-portal',
        environment: 'prod',
        networkCidr: '172.16.0.0/16',
        region: { aws: 'us-east-1', azure: 'eastus' },
        k8s: { version: '1.35', minNodes: 2, maxNodes: 8, size: 'medium' },
        postgres: { engineVersion: '15', size: 'medium', storageGb: 50 },
        adfs: { size: 'medium', windowsVersion: '2022' },
        compliance: {
          framework: 'hitrust-moderate',
          encryptionAtRest: true,
          auditLogging: true,
          dataResidency: {
            aws: 'us-east-1',
            azure: 'eastus'
          }
        }
      };

      const result = checkCompliance(config, 'hitrust-moderate');
      expect(result.compliant).toBe(true);
    });

    it('should fail HITRUST CSF High with insufficient nodes', () => {
      const config: ChiralSystem = {
        projectName: 'healthcare-critical',
        environment: 'prod',
        networkCidr: '192.168.0.0/16',
        region: { aws: 'us-east-1' },
        k8s: { version: '1.35', minNodes: 2, maxNodes: 5, size: 'medium' },
        postgres: { engineVersion: '15', size: 'medium', storageGb: 100 },
        adfs: { size: 'small', windowsVersion: '2022' },
        compliance: {
          framework: 'hitrust-high',
          encryptionAtRest: true,
          auditLogging: true
        }
      };

      const result = checkCompliance(config, 'hitrust-high');
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('HITRUST CSF HIGH: Production environments require enhanced high availability');
    });

    it('should pass HITECH High with breach prevention controls', () => {
      const config: ChiralSystem = {
        projectName: 'ehr-system',
        environment: 'prod',
        networkCidr: '10.200.0.0/16',
        region: { aws: 'us-east-1' },
        k8s: { version: '1.35', minNodes: 3, maxNodes: 15, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 75 },
        adfs: { size: 'large', windowsVersion: '2022' },
        compliance: {
          framework: 'hitech-high',
          encryptionAtRest: true,
          auditLogging: true,
          dataResidency: {
            aws: 'us-east-1'
          }
        }
      };

      const result = checkCompliance(config, 'hitech-high');
      expect(result.compliant).toBe(true);
    });
  });

  describe('Existing Compliance Frameworks', () => {
    it('should still work with SOC2', () => {
      const config: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '192.168.0.0/16',
        region: { aws: 'us-east-1', azure: 'East US', gcp: 'us-central1' },
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' },
        compliance: {
          framework: 'soc2',
          encryptionAtRest: true,
          encryptionInTransit: true,
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
      expect(result.compliant).toBe(true);
    });
  });

  describe('SOC 1 Compliance', () => {
    it('should pass SOC 1 Type 1 with basic financial controls', () => {
      const config: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.1.0.0/16',
        region: { aws: 'us-east-1', azure: 'East US', gcp: 'us-central1' },
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' },
        compliance: {
          framework: 'soc1',
          encryptionAtRest: true,
          auditLogging: true,
          securityControls: {
            complianceMonitoring: true
          }
        }
      };

      const result = checkCompliance(config, 'soc1', 'type1');
      expect(result.compliant).toBe(true);
      expect(result.auditType).toBe('type1');
    });

    it('should pass SOC 2 Type 1 with trust services criteria', () => {
      const config: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.1.0.0/16',
        region: { aws: 'us-east-1', azure: 'East US', gcp: 'us-central1' },
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

      const result = checkCompliance(config, 'soc2', 'type1');
      expect(result.compliant).toBe(true);
      expect(result.auditType).toBe('type1');
    });

    it('should pass SOC 3 Type 1 with simplified requirements', () => {
      const config: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.1.0.0/16',
        region: { aws: 'us-east-1', azure: 'East US', gcp: 'us-central1' },
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' },
        compliance: {
          framework: 'soc3',
          encryptionAtRest: true,
          securityControls: {
            mfaRequired: true
          }
        }
      };

      const result = checkCompliance(config, 'soc3', 'type1');
      expect(result.compliant).toBe(true);
      expect(result.auditType).toBe('type1');
    });
  });
});
