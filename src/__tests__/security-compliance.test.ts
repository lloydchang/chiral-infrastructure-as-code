import { SecurityComplianceEngine } from '../security-compliance';
import { ChiralSystem, ComplianceFramework } from '../intent';

describe('Security Compliance Tests', () => {
  let complianceEngine: SecurityComplianceEngine;
  let testConfig: ChiralSystem;

  beforeEach(() => {
    complianceEngine = new SecurityComplianceEngine();
    testConfig = {
      projectName: 'test-project',
      environment: 'prod',
      networkCidr: '10.1.0.0/16',
      compliance: {
        frameworks: ['iso27001', 'iso27017', 'iso27018', 'gdpr'] as const,
        encryptionAtRest: true,
        encryptionInTransit: true,
        auditLogging: true,
        privacyByDesign: true,
        purposeLimitation: true,
        dataMinimization: true,
        consentManagement: true,
        dataSubjectRights: true,
        breachNotification: true,
        privacyImpactAssessment: true,
        crossBorderTransfer: true,
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
        },
        cloudSpecificControls: {
          sharedResponsibility: true,
          cloudProviderAssessment: true,
          serviceLevelAgreements: true,
          cloudExitStrategy: true,
          multiCloudStrategy: true,
          cloudNativeSecurity: true,
          cloudConfigurationManagement: true,
          cloudMonitoring: true,
          cloudBackup: true,
          cloudDisasterRecovery: true
        },
        privacyControls: {
          dataClassification: true,
          dataLossPrevention: true,
          anonymization: true,
          pseudonymization: true,
          consentRecording: true,
          privacyNotices: true,
          dataSubjectRequests: true,
          privacyTraining: true,
          privacyAudits: true,
          dataProtectionOfficer: true
        },
        retentionPolicy: {
          defaultRetentionDays: 2555,
          piiRetentionDays: 365,
          auditLogRetentionDays: 2555
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

  describe('ISO 27001:2022 Compliance', () => {
    it('should be compliant with ISO 27001:2022', async () => {
      const results = await complianceEngine.assessCompliance(testConfig, ['iso27001']);
      const iso27001Result = results.find(r => r.framework === 'iso27001');
      
      expect(iso27001Result).toBeDefined();
      expect(iso27001Result!.compliant).toBe(true);
      expect(iso27001Result!.score).toBeGreaterThan(90);
      expect(iso27001Result!.violations.filter(v => v.severity === 'critical')).toHaveLength(0);
    });

    it('should detect missing encryption controls', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.encryptionAtRest = false;
      insecureConfig.compliance!.encryptionInTransit = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27001']);
      const iso27001Result = results.find(r => r.framework === 'iso27001');
      
      expect(iso27001Result!.violations.filter(v => v.control.includes('A.10.1'))).toHaveLength(2);
    });
  });

  describe('ISO 27017 Cloud Security', () => {
    it('should be compliant with ISO 27017', async () => {
      const results = await complianceEngine.assessCompliance(testConfig, ['iso27017']);
      const iso27017Result = results.find(r => r.framework === 'iso27017');
      
      expect(iso27017Result).toBeDefined();
      expect(iso27017Result!.compliant).toBe(true);
      expect(iso27017Result!.score).toBeGreaterThan(90);
    });

    it('should detect missing cloud-specific controls', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.cloudSpecificControls = undefined;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27017']);
      const iso27017Result = results.find(r => r.framework === 'iso27017');
      
      expect(iso27017Result!.violations.length).toBeGreaterThan(5);
    });
  });

  describe('ISO 27018 Privacy', () => {
    it('should be compliant with ISO 27018', async () => {
      const results = await complianceEngine.assessCompliance(testConfig, ['iso27018']);
      const iso27018Result = results.find(r => r.framework === 'iso27018');
      
      expect(iso27018Result).toBeDefined();
      expect(iso27018Result!.compliant).toBe(true);
      expect(iso27018Result!.score).toBeGreaterThan(90);
    });

    it('should detect missing privacy controls', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.privacyByDesign = false;
      insecureConfig.compliance!.consentManagement = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['iso27018']);
      const iso27018Result = results.find(r => r.framework === 'iso27018');
      
      expect(iso27018Result!.violations.filter(v => v.severity === 'critical')).toHaveLength(2);
    });
  });

  describe('GDPR Compliance', () => {
    it('should be compliant with GDPR', async () => {
      const results = await complianceEngine.assessCompliance(testConfig, ['gdpr']);
      const gdprResult = results.find(r => r.framework === 'gdpr');
      
      expect(gdprResult).toBeDefined();
      expect(gdprResult!.compliant).toBe(true);
      expect(gdprResult!.score).toBeGreaterThan(90);
    });

    it('should detect missing GDPR controls', async () => {
      const results = await complianceEngine.assessCompliance(testConfig, ['gdpr']);
      const gdprResult = results.find(r => r.framework === 'gdpr');
      
      expect(gdprResult).toBeDefined();
      expect(gdprResult!.violations.filter(v => v.severity === 'critical')).toHaveLength(0);
    });

    it('should detect missing GDPR controls', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.breachNotification = false;
      insecureConfig.compliance!.dataSubjectRights = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['gdpr']);
      const gdprResult = results.find(r => r.framework === 'gdpr');
      
      expect(gdprResult!.violations.filter(v => v.severity === 'critical')).toHaveLength(2);
    });
  });

  describe('HIPAA Compliance', () => {
    it('should be compliant with HIPAA Low', async () => {
      const results = await complianceEngine.assessCompliance(testConfig, ['hipaa-low']);
      const hipaaResult = results.find(r => r.framework === 'hipaa-low');
      
      expect(hipaaResult).toBeDefined();
      expect(hipaaResult!.compliant).toBe(true);
      expect(hipaaResult!.score).toBeGreaterThan(90);
    });

    it('should detect missing PHI encryption in HIPAA', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.encryptionAtRest = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['hipaa']);
      const hipaaResult = results.find(r => r.framework === 'hipaa');
      
      expect(hipaaResult!.violations.filter(v => v.severity === 'critical')).toHaveLength(2);
      expect(hipaaResult!.violations.some(v => v.title.includes('PHI encryption'))).toBe(true);
    });

    it('should detect missing audit logging for PHI access', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.auditLogging = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['hipaa-high']);
      const hipaaResult = results.find(r => r.framework === 'hipaa-high');
      
      expect(hipaaResult!.violations.some(v => v.title.includes('PHI access audit logging'))).toBe(true);
    });

    it('should require network segmentation for HIPAA High', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.securityControls!.networkSegmentation = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['hipaa-high']);
      const hipaaResult = results.find(r => r.framework === 'hipaa-high');
      
      expect(hipaaResult!.violations.some(v => v.title.includes('Network segmentation missing'))).toBe(true);
    });

    it('should require adequate storage for HIPAA High', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.postgres!.storageGb = 50; // Below 100GB requirement

      const results = await complianceEngine.assessCompliance(insecureConfig, ['hipaa-high']);
      const hipaaResult = results.find(r => r.framework === 'hipaa-high');
      
      expect(hipaaResult!.violations.some(v => v.title.includes('storage capacity'))).toBe(true);
    });
  });

  describe('HITRUST CSF Compliance', () => {
    it('should be compliant with HITRUST Low', async () => {
      const results = await complianceEngine.assessCompliance(testConfig, ['hitrust-low']);
      const hitrustResult = results.find(r => r.framework === 'hitrust-low');
      
      expect(hitrustResult).toBeDefined();
      expect(hitrustResult!.compliant).toBe(true);
      expect(hitrustResult!.score).toBeGreaterThan(90);
    });

    it('should detect missing endpoint protection in HITRUST', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.securityControls!.malwareProtection = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['hitrust-moderate']);
      const hitrustResult = results.find(r => r.framework === 'hitrust-moderate');
      
      expect(hitrustResult!.violations.some(v => v.title.includes('Endpoint protection missing'))).toBe(true);
    });

    it('should require vulnerability management for HITRUST Moderate', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.securityControls!.vulnerabilityManagement = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['hitrust-moderate']);
      const hitrustResult = results.find(r => r.framework === 'hitrust-moderate');
      
      expect(hitrustResult!.violations.some(v => v.title.includes('Vulnerability management missing'))).toBe(true);
    });

    it('should require configuration management for HITRUST High', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.securityControls!.configurationManagement = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['hitrust-high']);
      const hitrustResult = results.find(r => r.framework === 'hitrust-high');
      
      expect(hitrustResult!.violations.some(v => v.title.includes('Configuration management missing'))).toBe(true);
    });
  });

  describe('HITECH Compliance', () => {
    it('should be compliant with HITECH Low', async () => {
      const results = await complianceEngine.assessCompliance(testConfig, ['hitech-low']);
      const hitechResult = results.find(r => r.framework === 'hitech-low');
      
      expect(hitechResult).toBeDefined();
      expect(hitechResult!.compliant).toBe(true);
      expect(hitechResult!.score).toBeGreaterThan(90);
    });

    it('should detect missing breach notification in HITECH', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.breachNotification = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['hitech-moderate']);
      const hitechResult = results.find(r => r.framework === 'hitech-moderate');
      
      expect(hitechResult!.violations.some(v => v.title.includes('Breach notification procedures missing'))).toBe(true);
    });

    it('should require incident response for HITECH Moderate', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.securityControls!.incidentResponse = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['hitech-moderate']);
      const hitechResult = results.find(r => r.framework === 'hitech-moderate');
      
      expect(hitechResult!.violations.some(v => v.title.includes('Incident response for breach containment'))).toBe(true);
    });

    it('should require advanced network segmentation for HITECH High', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.compliance!.securityControls!.networkSegmentation = false;

      const results = await complianceEngine.assessCompliance(insecureConfig, ['hitech-high']);
      const hitechResult = results.find(r => r.framework === 'hitech-high');
      
      expect(hitechResult!.violations.some(v => v.title.includes('Advanced network segmentation missing'))).toBe(true);
    });

    it('should require adequate storage for breach investigation in HITECH High', async () => {
      const insecureConfig = { ...testConfig };
      insecureConfig.postgres!.storageGb = 50; // Below 75GB requirement

      const results = await complianceEngine.assessCompliance(insecureConfig, ['hitech-high']);
      const hitechResult = results.find(r => r.framework === 'hitech-high');
      
      expect(hitechResult!.violations.some(v => v.title.includes('storage for breach investigation'))).toBe(true);
    });
  });

  describe('Multi-Framework Compliance', () => {
    it('should assess multiple frameworks simultaneously', async () => {
      const frameworks: ComplianceFramework[] = ['iso27001', 'iso27017', 'iso27018', 'gdpr'];
      const results = await complianceEngine.assessCompliance(testConfig, frameworks);
      
      expect(results).toHaveLength(4);
      results.forEach(result => {
        expect(result.compliant).toBe(true);
        expect(result.score).toBeGreaterThan(90);
      });
    });

    it('should generate comprehensive compliance report', () => {
      const mockResults = [
        {
          framework: 'iso27001' as const,
          compliant: true,
          score: 95,
          violations: [],
          recommendations: [],
          auditTrail: [],
          riskAssessment: {
            overallRisk: 'low' as const,
            riskScore: 20,
            risks: [],
            mitigations: [],
            residualRisk: 6,
            riskTolerance: 50
          },
          remediationPlan: []
        }
      ];

      const report = complianceEngine.generateComplianceReport(mockResults);
      
      expect(report).toContain('# Security Compliance Report');
      expect(report).toContain('ISO27001');
      expect(report).toContain('95.0%');
      expect(report).toContain('COMPLIANT');
    });
  });

  describe('Audit Trail', () => {
    it('should maintain audit trail', () => {
      complianceEngine.addAuditEntry({
        eventType: 'change',
        action: 'Compliance configuration updated',
        outcome: 'success',
        details: 'Updated ISO 27001 controls',
        userId: 'security-admin'
      });

      const history = complianceEngine.getComplianceHistory('iso27001');
      expect(history).toBeDefined();
    });
  });
});
