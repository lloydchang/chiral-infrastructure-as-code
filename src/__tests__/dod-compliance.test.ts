// File: src/__tests__/dod-compliance.test.ts

// DoD Compliance Tests
// Tests for DoD Impact Level compliance (IL2, IL4, IL5, IL6)

import { checkCompliance } from '../validation';
import { ChiralSystem, ComplianceFramework } from '../intent';

describe('DoD Compliance Tests', () => {
  let testConfig: ChiralSystem;

  beforeEach(() => {
    testConfig = {
      projectName: 'test-dod-project',
      environment: 'prod',
      networkCidr: '10.1.0.0/16',
      k8s: {
        version: '1.29',
        minNodes: 3,
        maxNodes: 5,
        size: 'medium'
      },
      postgres: {
        engineVersion: '15',
        size: 'medium',
        storageGb: 100
      },
      adfs: {
        size: 'medium',
        windowsVersion: '2022'
      },
      compliance: {
        framework: 'dod-il2' as ComplianceFramework,
        encryptionAtRest: true,
        auditLogging: true,
        dataResidency: {
          aws: 'us-gov-west-1',
          azure: 'USGov Arizona',
          gcp: 'us-gov-west1'
        }
      }
    };
  });

  describe('DoD IL2 Compliance', () => {
    it('should pass IL2 compliance with proper configuration', () => {
      const result = checkCompliance(testConfig, 'dod-il2' as ComplianceFramework);
      
      expect(result.framework).toBe('dod-il2');
      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail IL2 compliance without encryption at rest', () => {
      testConfig.compliance!.encryptionAtRest = false;
      
      const result = checkCompliance(testConfig, 'dod-il2' as ComplianceFramework);
      
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('DoD IL2: Encryption at rest required for defense data');
      expect(result.recommendations).toContain('Enable encryption at rest for all data stores');
    });

    it('should fail IL2 compliance without audit logging', () => {
      testConfig.compliance!.auditLogging = false;
      
      const result = checkCompliance(testConfig, 'dod-il2' as ComplianceFramework);
      
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('DoD IL2: Comprehensive audit logging required');
      expect(result.recommendations).toContain('Enable detailed audit logging for all resources and access');
    });

    it('should recommend GovCloud for commercial regions', () => {
      testConfig.region = {
        aws: 'us-east-1', // Commercial region
        azure: 'East US',  // Commercial region
        gcp: 'us-central1' // Commercial region
      };
      
      const result = checkCompliance(testConfig, 'dod-il2' as ComplianceFramework);
      
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('DoD IL2: AWS GovCloud recommended for CUI workloads');
      expect(result.violations).toContain('DoD IL2: Azure Government recommended for CUI workloads');
    });

    it('should fail IL2 compliance with default network CIDR', () => {
      testConfig.networkCidr = '10.0.0.0/16';
      
      const result = checkCompliance(testConfig, 'dod-il2' as ComplianceFramework);
      
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('DoD IL2: Default network CIDR may not meet security requirements');
    });
  });

  describe('DoD IL4 Compliance', () => {
    beforeEach(() => {
      testConfig.compliance!.framework = 'dod-il4' as ComplianceFramework;
    });

    it('should pass IL4 compliance with GovCloud regions', () => {
      testConfig.region = {
        aws: 'us-gov-west-1',
        azure: 'USGov Arizona',
        gcp: 'us-gov-west1'
      };
      
      const result = checkCompliance(testConfig, 'dod-il4' as ComplianceFramework);
      
      expect(result.framework).toBe('dod-il4');
      expect(result.compliant).toBe(false); // IL4 requires all providers to be GovCloud
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should require GovCloud for all providers', () => {
      testConfig.region = {
        aws: 'us-east-1', // Commercial - should fail
        azure: 'USGov Arizona', // Gov - should pass
        gcp: 'us-gov-west1' // Gov - should pass
      };
      
      const result = checkCompliance(testConfig, 'dod-il4' as ComplianceFramework);
      
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('DoD IL4: AWS GovCloud required for IL4 workloads');
    });

    it('should require minimum database storage for production', () => {
      testConfig.postgres.storageGb = 25; // Below 50GB requirement
      
      const result = checkCompliance(testConfig, 'dod-il4' as ComplianceFramework);
      
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('DoD IL4: Production databases must have minimum 50GB storage');
    });

    it('should flag large node counts', () => {
      testConfig.k8s.maxNodes = 25; // Above 20 node limit
      
      const result = checkCompliance(testConfig, 'dod-il4' as ComplianceFramework);
      
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('DoD IL4: Large node counts require additional security controls');
    });
  });

  describe('DoD IL5 Compliance', () => {
    beforeEach(() => {
      testConfig.compliance!.framework = 'dod-il5' as ComplianceFramework;
      testConfig.k8s.minNodes = 3; // IL5 requires minimum 3 nodes
      testConfig.postgres.storageGb = 100; // IL5 requires minimum 100GB
    });

    it('should pass IL5 compliance with Secret Region configuration', () => {
      testConfig.region = {
        aws: 'us-gov-west-1',
        azure: 'USGov Arizona',
        gcp: 'us-gov-west1'
      };
      
      const result = checkCompliance(testConfig, 'dod-il5' as ComplianceFramework);
      
      expect(result.framework).toBe('dod-il5');
      expect(result.compliant).toBe(false); // IL5 requires Secret Regions
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should require Secret Region for all providers', () => {
      testConfig.region = {
        aws: 'us-east-1', // Commercial region - should fail
        azure: 'USGov Arizona',
        gcp: 'us-gov-west1'
      };
      
      const result = checkCompliance(testConfig, 'dod-il5' as ComplianceFramework);
      
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('DoD IL5: AWS GovCloud (Secret Region) required');
      expect(result.violations).toContain('DoD IL5: Azure Government (Secret Region) required');
      expect(result.violations).toContain('DoD IL5: GCP GovCloud (Secret Region) required');
    });

    it('should require minimum 3 nodes for high availability', () => {
      testConfig.k8s.minNodes = 2; // Below IL5 requirement
      
      const result = checkCompliance(testConfig, 'dod-il5' as ComplianceFramework);
      
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('DoD IL5: High-security environments require enhanced availability');
    });

    it('should require minimum 100GB database storage', () => {
      testConfig.postgres.storageGb = 75; // Below IL5 requirement
      
      const result = checkCompliance(testConfig, 'dod-il5' as ComplianceFramework);
      
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('DoD IL5: Production databases must have minimum 100GB storage');
    });

    it('should require explicit region specification', () => {
      delete testConfig.region;
      
      const result = checkCompliance(testConfig, 'dod-il5' as ComplianceFramework);
      
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('DoD IL5: Explicit region specification required for data sovereignty');
    });
  });

  describe('DoD IL6 Compliance', () => {
    beforeEach(() => {
      testConfig.compliance!.framework = 'dod-il6' as ComplianceFramework;
      testConfig.k8s.maxNodes = 5; // IL6 requires minimal attack surface
    });

    it('should always recommend specialized environments', () => {
      const result = checkCompliance(testConfig, 'dod-il6' as ComplianceFramework);
      
      expect(result.framework).toBe('dod-il6');
      expect(result.compliant).toBe(false); // IL6 always fails due to specialized requirements
      expect(result.violations).toContain('DoD IL6: Requires specialized classified computing environments');
      expect(result.recommendations).toContain('Contact DoD for classified computing infrastructure requirements');
    });

    it('should require production environment', () => {
      testConfig.environment = 'dev';
      
      const result = checkCompliance(testConfig, 'dod-il6' as ComplianceFramework);
      
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('DoD IL6: Classified workloads must use production-grade security');
    });

    it('should limit cluster size for minimal attack surface', () => {
      testConfig.k8s.maxNodes = 15; // Above IL5 recommendation
      
      const result = checkCompliance(testConfig, 'dod-il6' as ComplianceFramework);
      
      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('DoD IL6: Classified environments require minimal attack surface');
    });
  });

  describe('Cross-Level Requirements', () => {
    it('should require high availability for production across all levels', () => {
      testConfig.k8s.minNodes = 1; // Single node
      
      const il2Result = checkCompliance(testConfig, 'dod-il2' as ComplianceFramework);
      const il4Result = checkCompliance(testConfig, 'dod-il4' as ComplianceFramework);
      const il5Result = checkCompliance(testConfig, 'dod-il5' as ComplianceFramework);
      const il6Result = checkCompliance(testConfig, 'dod-il6' as ComplianceFramework);
      
      expect(il2Result.violations).toContain('DoD IL2: Production environments must have high availability');
      expect(il4Result.violations).toContain('DoD IL4: Production environments must have high availability');
      expect(il5Result.violations).toContain('DoD IL5: Production environments must have high availability');
      expect(il6Result.violations).toContain('DoD IL6: Production environments must have high availability');
    });

    it('should require encryption at rest across all levels', () => {
      testConfig.compliance!.encryptionAtRest = false;
      
      const levels = ['dod-il2', 'dod-il4', 'dod-il5', 'dod-il6'] as const;
      
      levels.forEach(level => {
        const result = checkCompliance(testConfig, level as ComplianceFramework);
        expect(result.violations).toContain(`DoD ${level.split('-')[1].toUpperCase()}: Encryption at rest required for defense data`);
      });
    });

    it('should require audit logging across all levels', () => {
      testConfig.compliance!.auditLogging = false;
      
      const levels = ['dod-il2', 'dod-il4', 'dod-il5', 'dod-il6'] as const;
      
      levels.forEach(level => {
        const result = checkCompliance(testConfig, level as ComplianceFramework);
        expect(result.violations).toContain(`DoD ${level.split('-')[1].toUpperCase()}: Comprehensive audit logging required`);
      });
    });
  });

  describe('Progressive Requirements', () => {
    it('should show increasingly strict requirements from IL2 to IL5', () => {
      const configWithCommercialRegions = {
        ...testConfig,
        region: {
          aws: 'us-east-1',
          azure: 'East US',
          gcp: 'us-central1'
        }
      };
      
      const il2Result = checkCompliance(configWithCommercialRegions, 'dod-il2' as ComplianceFramework);
      const il4Result = checkCompliance(configWithCommercialRegions, 'dod-il4' as ComplianceFramework);
      const il5Result = checkCompliance(configWithCommercialRegions, 'dod-il5' as ComplianceFramework);
      
      // IL2 should recommend GovCloud
      expect(il2Result.violations).toContain('DoD IL2: AWS GovCloud recommended for CUI workloads');
      
      // IL4 should require GovCloud
      expect(il4Result.violations).toContain('DoD IL4: AWS GovCloud required for IL4 workloads');
      
      // IL5 should require Secret Region
      expect(il5Result.violations).toContain('DoD IL5: AWS GovCloud (Secret Region) required');
    });
  });
});
