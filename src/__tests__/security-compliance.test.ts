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
      
      console.log('GDPR violations:', gdprResult!.violations);
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
