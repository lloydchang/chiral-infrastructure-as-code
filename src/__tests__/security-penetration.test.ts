import { SecurityComplianceEngine } from '../security-compliance';
import { ChiralSystem, ComplianceFramework } from '../intent';

describe('Security Penetration Tests', () => {
  let complianceEngine: SecurityComplianceEngine;
  let testConfig: ChiralSystem;

  beforeEach(() => {
    complianceEngine = new SecurityComplianceEngine();
    testConfig = {
      projectName: 'test-project',
      environment: 'prod',
      networkCidr: '10.1.0.0/16',
      compliance: {
        frameworks: ['iso27001', 'iso27017', 'iso27018'],
        encryptionAtRest: true,
        encryptionInTransit: true,
        auditLogging: true,
        securityControls: {
          mfaRequired: true,
          privilegedAccessManagement: true,
          networkSegmentation: true,
          vulnerabilityManagement: true,
          malwareProtection: true,
          backupAndRecovery: true,
          disasterRecovery: true,
          businessContinuity: true,
          incidentResponse: true,
          securityMonitoring: true,
          complianceMonitoring: true
        }
      },
      k8s: {
        version: '1.35',
        minNodes: 3,
        maxNodes: 10,
        size: 'medium'
      },
      postgres: {
        engineVersion: '15',
        storageGb: 100,
        size: 'medium'
      },
      adfs: {
        size: 'medium',
        windowsVersion: '2022'
      }
    };
  });

  describe('Infrastructure Security Tests', () => {
    it('should detect default network configurations', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.networkCidr = '10.0.0.0/16'; // Default CIDR

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27001']);
      const iso27001Result = results.find(r => r.framework === 'iso27001');
      
      expect(iso27001Result!.violations.filter(v => v.control.includes('A.9.1.2'))).toHaveLength(1);
    });

    it('should detect insufficient node count for production', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.k8s.minNodes = 1; // Single node

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27001']);
      const iso27001Result = results.find(r => r.framework === 'iso27001');
      
      expect(iso27001Result!.violations.filter(v => v.control.includes('A.12.2.1'))).toHaveLength(1);
    });

    it('should detect insufficient storage for production databases', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.postgres.storageGb = 20; // Too small for production

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27001']);
      const iso27001Result = results.find(r => r.framework === 'iso27001');
      
      expect(iso27001Result!.violations.filter(v => v.control.includes('A.14.2.5'))).toHaveLength(1);
    });
  });

  describe('Encryption Security Tests', () => {
    it('should detect missing encryption at rest', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.encryptionAtRest = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27001']);
      const iso27001Result = results.find(r => r.framework === 'iso27001');
      
      expect(iso27001Result!.violations.filter(v => v.control.includes('A.10.1.1'))).toHaveLength(1);
    });

    it('should detect missing encryption in transit', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.encryptionInTransit = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27001']);
      const iso27001Result = results.find(r => r.framework === 'iso27001');
      
      expect(iso27001Result!.violations.filter(v => v.control.includes('A.10.1.2'))).toHaveLength(1);
    });
  });

  describe('Access Control Tests', () => {
    it('should detect missing MFA', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.securityControls!.mfaRequired = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27001']);
      const iso27001Result = results.find(r => r.framework === 'iso27001');
      
      expect(iso27001Result!.violations.filter(v => v.category === 'technical').length).toBeGreaterThan(0);
    });

    it('should detect missing privileged access management', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.securityControls!.privilegedAccessManagement = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27001']);
      const iso27001Result = results.find(r => r.framework === 'iso27001');
      
      expect(iso27001Result!.violations.filter(v => v.category === 'policy').length).toBeGreaterThan(0);
    });
  });

  describe('Cloud Security Tests', () => {
    it('should detect missing shared responsibility model', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.cloudSpecificControls = undefined;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27017']);
      const iso27017Result = results.find(r => r.framework === 'iso27017');
      
      expect(iso27017Result!.violations.filter(v => v.control.includes('Shared Responsibility'))).toHaveLength(1);
    });

    it('should detect missing cloud monitoring', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.cloudSpecificControls = {
        ...insecureConfig.compliance!.cloudSpecificControls,
        cloudMonitoring: false
      };

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27017']);
      const iso27017Result = results.find(r => r.framework === 'iso27017');
      
      expect(iso27017Result!.violations.filter(v => v.control.includes('Cloud Monitoring'))).toHaveLength(1);
    });
  });

  describe('Privacy Security Tests', () => {
    it('should detect missing privacy by design', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.privacyByDesign = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27018']);
      const iso27018Result = results.find((r: any) => r.framework === 'iso27018');
      
      expect(iso27018Result!.violations.filter((v: any) => v.severity === 'critical')).toHaveLength(4);
    });

    it('should detect missing consent management', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.consentManagement = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27018']);
      const iso27018Result = results.find((r: any) => r.framework === 'iso27018');
      
      expect(iso27018Result!.violations.filter((v: any) => v.control.includes('Consent Management'))).toHaveLength(1);
    });

    it('should detect missing data subject rights', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.dataSubjectRights = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27018']);
      const iso27018Result = results.find((r: any) => r.framework === 'iso27018');
      
      expect(iso27018Result!.violations.filter((v: any) => v.control.includes('Data Subject Rights'))).toHaveLength(1);
    });
  });

  describe('Operational Security Tests', () => {
    it('should detect missing backup and recovery', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.securityControls!.backupAndRecovery = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27001']);
      const iso27001Result = results.find((r: any) => r.framework === 'iso27001');
      
      expect(iso27001Result!.violations.filter((v: any) => v.control.includes('A.12.3.1'))).toHaveLength(1);
    });

    it('should detect missing incident response', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.securityControls!.incidentResponse = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27001']);
      const iso27001Result = results.find((r: any) => r.framework === 'iso27001');
      
      expect(iso27001Result!.violations.filter((v: any) => v.control.includes('A.16.1.1'))).toHaveLength(1);
    });

    it('should detect missing malware protection', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.securityControls!.malwareProtection = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27001']);
      const iso27001Result = results.find(r => r.framework === 'iso27001');
      
      expect(iso27001Result!.violations.filter(v => v.control.includes('A.12.2.1'))).toHaveLength(1);
    });
  });

  describe('Risk Assessment Tests', () => {
    it('should calculate correct risk scores', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.encryptionAtRest = false; // Critical violation

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27001']);
      const iso27001Result = results.find((r: any) => r.framework === 'iso27001');
      
      expect(iso27001Result!.riskAssessment.riskScore).toBeGreaterThan(50);
      expect(iso27001Result!.riskAssessment.overallRisk).toBe('high');
    });

    it('should generate remediation plans', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.encryptionAtRest = false;
      insecureConfig.compliance!.auditLogging = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27001']);
      const iso27001Result = results.find((r: any) => r.framework === 'iso27001');
      
      expect(iso27001Result!.remediationPlan.length).toBeGreaterThan(0);
      expect(iso27001Result!.remediationPlan[0].status).toBe('pending');
    });
  });

  describe('Multi-Cloud Security Tests', () => {
    it('should validate multi-cloud configurations', async () => {
      const multiCloudConfig = { ...testConfig };
      multiCloudConfig.region = {
        aws: 'us-east-1',
        azure: 'East US',
        gcp: 'us-central1'
      };

      const results = await complianceEngine.assessCompliance(multiCloudConfig, ['iso27017']);
      const iso27017Result = results.find(r => r.framework === 'iso27017');
      
      expect(iso27017Result!.violations.filter(v => v.control.includes('Multi-Cloud'))).toHaveLength(0);
    });

    it('should detect missing cloud exit strategy', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.cloudSpecificControls = {
        ...insecureConfig.compliance!.cloudSpecificControls,
        cloudExitStrategy: false
      };

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27017']);
      const iso27017Result = results.find((r: any) => r.framework === 'iso27017');
      
      expect(iso27017Result!.violations.filter((v: any) => v.control.includes('Cloud Exit Strategy'))).toHaveLength(1);
    });
  });
});
