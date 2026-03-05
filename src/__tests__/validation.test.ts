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

    it('should fail SOC 1 Type 1 without compliance monitoring', () => {
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
          auditLogging: true
        }
      };

      const result = checkCompliance(config, 'soc1', 'type1');
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('SOC 1 Type 1: Compliance monitoring controls must be designed');
    });

    it('should pass SOC 1 Type 2 with operational effectiveness controls', () => {
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
            backupAndRecovery: true,
            incidentResponse: true,
            vulnerabilityManagement: true
          },
          retentionPolicy: {
            auditLogRetentionDays: 365
          }
        }
      };

      const result = checkCompliance(config, 'soc1', 'type2');
      expect(result.compliant).toBe(true);
      expect(result.auditType).toBe('type2');
    });

    it('should fail SOC 1 Type 2 without backup and recovery testing', () => {
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
            incidentResponse: true,
            vulnerabilityManagement: true
          },
          retentionPolicy: {
            auditLogRetentionDays: 365
          }
        }
      };

      const result = checkCompliance(config, 'soc1', 'type2');
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('SOC 1 Type 2: Backup and recovery testing required for operational effectiveness');
    });

    it('should fail SOC 1 Type 2 with insufficient log retention', () => {
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
            backupAndRecovery: true,
            incidentResponse: true,
            vulnerabilityManagement: true
          },
          retentionPolicy: {
            auditLogRetentionDays: 180
          }
        }
      };

      const result = checkCompliance(config, 'soc1', 'type2');
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('SOC 1 Type 2: Audit logs must be retained for at least 1 year');
    });
  });

  describe('SOC 2 Compliance', () => {
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

    it('should fail SOC 2 Type 1 without MFA', () => {
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
            networkSegmentation: true
          }
        }
      };

      const result = checkCompliance(config, 'soc2', 'type1');
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('SOC 2 Type 1: Multi-factor authentication must be configured');
    });

    it('should pass SOC 2 Type 2 with operational effectiveness', () => {
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
          encryptionInTransit: true,
          auditLogging: true,
          securityControls: {
            malwareProtection: true,
            backupAndRecovery: true,
            incidentResponse: true,
            securityMonitoring: true
          },
          retentionPolicy: {
            auditLogRetentionDays: 365
          }
        }
      };

      const result = checkCompliance(config, 'soc2', 'type2');
      expect(result.compliant).toBe(true);
      expect(result.auditType).toBe('type2');
    });

    it('should fail SOC 2 Type 2 without encryption in transit', () => {
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
            malwareProtection: true,
            backupAndRecovery: true,
            incidentResponse: true,
            securityMonitoring: true
          },
          retentionPolicy: {
            auditLogRetentionDays: 365
          }
        }
      };

      const result = checkCompliance(config, 'soc2', 'type2');
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('SOC 2 Type 2: Encryption in transit required for ongoing security');
    });
  });

  describe('SOC 3 Compliance', () => {
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

    it('should fail SOC 3 Type 1 without authentication controls', () => {
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
          encryptionAtRest: true
        }
      };

      const result = checkCompliance(config, 'soc3', 'type1');
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('SOC 3 Type 1: Basic authentication controls required');
    });

    it('should pass SOC 3 Type 2 with simplified operational requirements', () => {
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
          auditLogging: true,
          securityControls: {
            backupAndRecovery: true
          },
          retentionPolicy: {
            auditLogRetentionDays: 180
          }
        }
      };

      const result = checkCompliance(config, 'soc3', 'type2');
      expect(result.compliant).toBe(true);
      expect(result.auditType).toBe('type2');
    });

    it('should fail SOC 3 Type 2 with insufficient log retention', () => {
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
          auditLogging: true,
          securityControls: {
            backupAndRecovery: true
          },
          retentionPolicy: {
            auditLogRetentionDays: 90
          }
        }
      };

      const result = checkCompliance(config, 'soc3', 'type2');
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('SOC 3 Type 2: Audit logs must be retained for at least 6 months');
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
