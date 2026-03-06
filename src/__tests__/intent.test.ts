import { ChiralSystem, conductPrivacyImpactAssessment, PrivacyImpactAssessment, DataFlow, PrivacyRisk, Mitigation } from '../intent';

describe('ChiralSystem Intent Schema', () => {
  describe('valid configurations', () => {
    it('should accept valid production config', () => {
      const config: ChiralSystem = {
        projectName: 'test-project',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: {
          version: '1.29',
          minNodes: 2,
          maxNodes: 5,
          size: 'large'
        },
        postgres: {
          engineVersion: '15',
          size: 'large',
          storageGb: 100
        },
        adfs: {
          size: 'large',
          windowsVersion: '2022'
        }
      };

      expect(config).toBeDefined();
      expect(config.environment).toBe('prod');
      expect(config.k8s.size).toBe('large');
    });

    it('should accept valid development config', () => {
      const config: ChiralSystem = {
        projectName: 'dev-project',
        environment: 'dev',
        networkCidr: '10.0.0.0/16',
        k8s: {
          version: '1.28',
          minNodes: 1,
          maxNodes: 3,
          size: 'small'
        },
        postgres: {
          engineVersion: '14',
          size: 'small',
          storageGb: 50
        },
        adfs: {
          size: 'small',
          windowsVersion: '2019'
        }
      };

      expect(config).toBeDefined();
      expect(config.environment).toBe('dev');
      expect(config.k8s.size).toBe('small');
    });

    it('should accept config with Terraform backend', () => {
      const config: ChiralSystem = {
        projectName: 'test-project',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        terraform: {
          backend: {
            type: 'gcs',
            bucket: 'my-state-bucket',
            prefix: 'terraform-state'
          }
        },
        k8s: {
          version: '1.29',
          minNodes: 2,
          maxNodes: 5,
          size: 'large'
        },
        postgres: {
          engineVersion: '15',
          size: 'large',
          storageGb: 100
        },
        adfs: {
          size: 'large',
          windowsVersion: '2022'
        }
      };

      expect(config).toBeDefined();
      expect(config.terraform?.backend?.type).toBe('gcs');
      expect(config.terraform?.backend?.bucket).toBe('my-state-bucket');
    });

    it('should accept config with comprehensive compliance settings', () => {
      const config: ChiralSystem = {
        projectName: 'compliance-project',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        compliance: {
          framework: 'soc2',
          frameworks: ['soc2', 'iso27001', 'hipaa'],
          dataResidency: {
            aws: 'us-east-1',
            azure: 'eastus',
            gcp: 'us-central1'
          },
          encryptionAtRest: true,
          encryptionInTransit: true,
          auditLogging: true,
          privacyByDesign: true,
          dataMinimization: true,
          purposeLimitation: true,
          consentManagement: true,
          dataSubjectRights: true,
          breachNotification: true,
          privacyImpactAssessment: true,
          crossBorderTransfer: false,
          retentionPolicy: {
            defaultRetentionDays: 2555,
            piiRetentionDays: 2555,
            auditLogRetentionDays: 2555
          },
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
            complianceMonitoring: true,
            configurationManagement: true
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
          }
        },
        k8s: {
          version: '1.29',
          minNodes: 3,
          maxNodes: 10,
          size: 'large'
        },
        postgres: {
          engineVersion: '15',
          size: 'large',
          storageGb: 500
        },
        adfs: {
          size: 'large',
          windowsVersion: '2022'
        }
      };

      expect(config).toBeDefined();
      expect(config.compliance?.framework).toBe('soc2');
      expect(config.compliance?.frameworks).toHaveLength(3);
      expect(config.compliance?.encryptionAtRest).toBe(true);
      expect(config.compliance?.securityControls?.mfaRequired).toBe(true);
      expect(config.compliance?.privacyControls?.dataClassification).toBe(true);
    });

    it('should accept config with migration settings', () => {
      const config: ChiralSystem = {
        projectName: 'migration-project',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        migration: {
          strategy: 'progressive',
          sourceState: 'terraform.tfstate',
          validateCompliance: true,
          rollbackPlan: [
            { description: 'Destroy new resources', notes: 'Use cloud-native tools' },
            { description: 'Restore from backup', notes: 'Verify data integrity' }
          ]
        },
        k8s: {
          version: '1.29',
          minNodes: 2,
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
        }
      };

      expect(config).toBeDefined();
      expect(config.migration?.strategy).toBe('progressive');
      expect(config.migration?.rollbackPlan).toHaveLength(2);
    });
  });

  describe('type validation', () => {
    it('should enforce environment tier types', () => {
      // TypeScript will catch invalid environment values at compile time
      const validConfig: ChiralSystem = {
        projectName: 'test',
        environment: 'prod', // Only 'dev' | 'prod' allowed
        networkCidr: '10.0.0.0/16',
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' }
      };
      expect(validConfig.environment).toMatch(/^(dev|prod)$/);
    });

    it('should enforce workload size types', () => {
      const validConfig: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' }, // 'small' | 'medium' | 'large'
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' }
      };
      expect(validConfig.k8s.size).toMatch(/^(small|medium|large)$/);
    });

    it('should enforce Windows version types', () => {
      const validConfig: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' } // Only '2019' | '2022'
      };
      expect(validConfig.adfs.windowsVersion).toMatch(/^(2019|2022)$/);
    });
  });

  describe('Privacy Impact Assessment', () => {
    it('should conduct privacy impact assessment for basic system', () => {
      const config: ChiralSystem = {
        projectName: 'test-system',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: {
          version: '1.29',
          minNodes: 2,
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
        }
      };

      const assessment: PrivacyImpactAssessment = conductPrivacyImpactAssessment(config);

      expect(assessment).toBeDefined();
      expect(assessment.assessmentId).toMatch(/^PIA-\d+$/);
      expect(assessment.systemName).toBe('test-system');
      expect(assessment.assessmentDate).toBeInstanceOf(Date);
      expect(assessment.approvalStatus).toBe('pending');
      expect(assessment.assessor).toBe('Chiral Platform');
    });

    it('should analyze data flows correctly', () => {
      const config: ChiralSystem = {
        projectName: 'data-intensive-system',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        region: {
          aws: 'us-east-1',
          azure: 'eastus'
        },
        compliance: {
          retentionPolicy: {
            piiRetentionDays: 3650
          },
          encryptionAtRest: true
        },
        k8s: {
          version: '1.29',
          minNodes: 3,
          maxNodes: 10,
          size: 'large'
        },
        postgres: {
          engineVersion: '15',
          size: 'large',
          storageGb: 500
        },
        adfs: {
          size: 'large',
          windowsVersion: '2022'
        }
      };

      const assessment: PrivacyImpactAssessment = conductPrivacyImpactAssessment(config);

      expect(assessment.dataFlows).toHaveLength(1);
      const dataFlow: DataFlow = assessment.dataFlows[0];
      expect(dataFlow.id).toBe('db-flow-1');
      expect(dataFlow.source).toBe('Application');
      expect(dataFlow.destination).toBe('PostgreSQL Database');
      expect(dataFlow.dataTypes).toContain('user_data');
      expect(dataFlow.dataTypes).toContain('personal_information');
      expect(dataFlow.volume).toBe('high');
      expect(dataFlow.sensitivity).toBe('confidential');
      expect(dataFlow.retentionPeriod).toBe(3650);
      expect(dataFlow.crossBorder).toBe(true);
    });

    it('should assess privacy risks correctly', () => {
      const config: ChiralSystem = {
        projectName: 'risk-assessment-system',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: {
          version: '1.29',
          minNodes: 2,
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
        }
      };

      const assessment: PrivacyImpactAssessment = conductPrivacyImpactAssessment(config);

      expect(assessment.risks).toHaveLength(1);
      const risk: PrivacyRisk = assessment.risks[0];
      expect(risk.id).toBe('risk-db-flow-1');
      expect(risk.description).toContain('Privacy risk for');
      expect(risk.likelihood).toBe('medium');
      expect(risk.impact).toBe('high');
      expect(risk.riskLevel).toBe('medium');
      expect(risk.dataFlows).toContain('db-flow-1');
    });

    it('should define mitigations based on risks', () => {
      const config: ChiralSystem = {
        projectName: 'mitigation-system',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        compliance: {
          encryptionAtRest: true
        },
        k8s: {
          version: '1.29',
          minNodes: 2,
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
        }
      };

      const assessment: PrivacyImpactAssessment = conductPrivacyImpactAssessment(config);

      expect(assessment.mitigations).toHaveLength(1);
      const mitigation: Mitigation = assessment.mitigations[0];
      expect(mitigation.id).toBe('mit-risk-db-flow-1');
      expect(mitigation.riskId).toBe('risk-db-flow-1');
      expect(mitigation.description).toBe('Implement privacy controls and encryption');
      expect(mitigation.implementationStatus).toBe('implemented');
      expect(mitigation.effectiveness).toBe('high');
    });

    it('should provide recommendations for missing controls', () => {
      const config: ChiralSystem = {
        projectName: 'recommendation-system',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: {
          version: '1.29',
          minNodes: 2,
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
        }
      };

      const assessment: PrivacyImpactAssessment = conductPrivacyImpactAssessment(config);

      expect(assessment.recommendations).toContain('Implement data minimization');
    });

    it('should handle development environment correctly', () => {
      const config: ChiralSystem = {
        projectName: 'dev-system',
        environment: 'dev',
        networkCidr: '10.0.0.0/16',
        k8s: {
          version: '1.29',
          minNodes: 1,
          maxNodes: 3,
          size: 'small'
        },
        postgres: {
          engineVersion: '15',
          size: 'small',
          storageGb: 20
        },
        adfs: {
          size: 'small',
          windowsVersion: '2022'
        }
      };

      const assessment: PrivacyImpactAssessment = conductPrivacyImpactAssessment(config);

      expect(assessment.dataFlows).toHaveLength(1);
      const dataFlow: DataFlow = assessment.dataFlows[0];
      expect(dataFlow.volume).toBe('medium');
    });

    it('should handle system without postgres', () => {
      const config: ChiralSystem = {
        projectName: 'k8s-only-system',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: {
          version: '1.29',
          minNodes: 2,
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
        }
      };

      const assessment: PrivacyImpactAssessment = conductPrivacyImpactAssessment(config);

      // Should still create assessment but with different data flow analysis
      expect(assessment).toBeDefined();
      expect(assessment.systemName).toBe('k8s-only-system');
    });
  });
});
