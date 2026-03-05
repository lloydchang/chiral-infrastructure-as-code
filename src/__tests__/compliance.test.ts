// Tests for ISO compliance functionality

import { checkCompliance } from '../validation';
import { validateISO27001Compliance, validateISO27017Compliance, validateISO27018Compliance, validateNISTLowCompliance, validateNISTModerateCompliance, validateNISTHighCompliance } from '../compliance';
import { conductPrivacyImpactAssessment } from '../intent';

describe('ISO 27001 Compliance', () => {
  const baseConfig = {
    projectName: 'test-project',
    environment: 'prod' as const,
    networkCidr: '10.0.0.0/16',
    k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'medium' as const },
    postgres: { engineVersion: '15', storageGb: 100, size: 'large' as const },
    adfs: { size: 'medium' as const, windowsVersion: '2022' as const },
    compliance: {
      encryptionAtRest: true,
      auditLogging: true,
      dataResidency: true
    }
  };

  test('validates ISO 27001 compliance successfully', () => {
    const result = checkCompliance(baseConfig, 'iso27001');
    expect(result.compliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test('validates ISO 27001 function directly', () => {
    const result = validateISO27001Compliance(baseConfig);
    expect(result.valid).toBe(true);
    expect(result.issues.length).toBe(0);
  });

  test('fails ISO 27001 without encryption', () => {
    const config = { ...baseConfig, compliance: { ...baseConfig.compliance, encryptionAtRest: false } };
    const result = validateISO27001Compliance(config);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Encryption at rest not enabled');
  });
});

describe('ISO 27017 Compliance', () => {
  const baseConfig = {
    projectName: 'test-project',
    environment: 'prod' as const,
    networkCidr: '10.0.0.0/16',
    k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'medium' as const },
    postgres: { engineVersion: '15', storageGb: 100, size: 'large' as const },
    adfs: { size: 'medium' as const, windowsVersion: '2022' as const },
    compliance: {
      sharedResponsibility: true,
      dataResidency: true,
      auditLogging: true
    }
  };

  test('validates ISO 27017 compliance successfully', () => {
    const result = checkCompliance(baseConfig, 'iso27017');
    expect(result.compliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test('validates ISO 27017 function directly', () => {
    const result = validateISO27017Compliance(baseConfig);
    expect(result.valid).toBe(true);
    expect(result.issues.length).toBe(0);
  });

  test('fails ISO 27017 without shared responsibility', () => {
    const config = { ...baseConfig, compliance: { ...baseConfig.compliance, sharedResponsibility: false } };
    const result = validateISO27017Compliance(config);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Shared responsibility model not documented');
  });
});

describe('ISO 27018 Compliance', () => {
  const baseConfig = {
    projectName: 'test-project',
    environment: 'prod' as const,
    networkCidr: '10.0.0.0/16',
    k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'medium' as const },
    postgres: { engineVersion: '15', storageGb: 100, size: 'large' as const },
    adfs: { size: 'medium' as const, windowsVersion: '2022' as const },
    compliance: {
      dataMinimization: true,
      consentManagement: true,
      breachNotification: true,
      encryptionAtRest: true
    }
  };

  test('validates ISO 27018 compliance successfully', () => {
    const result = checkCompliance(baseConfig, 'iso27018');
    expect(result.compliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test('validates ISO 27018 function directly', () => {
    const result = validateISO27018Compliance(baseConfig);
    expect(result.valid).toBe(true);
    expect(result.issues.length).toBe(0);
  });

  test('fails ISO 27018 without data minimization', () => {
    const config = { ...baseConfig, compliance: { ...baseConfig.compliance, dataMinimization: false } };
    const result = validateISO27018Compliance(config);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('Data minimization not implemented');
  });
});

describe('NIST Low Compliance', () => {
  const baseConfig = {
    projectName: 'test-project',
    environment: 'prod' as const,
    networkCidr: '10.0.0.0/16',
    k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'medium' as const },
    postgres: { engineVersion: '15', storageGb: 100, size: 'large' as const },
    adfs: { size: 'medium' as const, windowsVersion: '2022' as const },
    compliance: {
      encryptionAtRest: true,
      auditLogging: true,
      encryptionInTransit: true,
      securityControls: {
        mfaRequired: true
      }
    }
  };

  test('validates NIST Low compliance successfully', () => {
    const result = checkCompliance(baseConfig, 'nist-low');
    expect(result.compliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test('validates NIST Low function directly', () => {
    const result = validateNISTLowCompliance(baseConfig);
    expect(result.valid).toBe(true);
    expect(result.issues.length).toBe(0);
  });

  test('fails NIST Low without encryption at rest', () => {
    const config = { ...baseConfig };
    delete config.compliance.encryptionAtRest;
    const result = validateNISTLowCompliance(config);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('NIST LOW: SC-28 - Encryption at rest not enabled');
  });
});

describe('NIST Moderate Compliance', () => {
  const baseConfig = {
    projectName: 'test-project',
    environment: 'prod' as const,
    networkCidr: '10.0.0.0/16',
    k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'medium' as const },
    postgres: { engineVersion: '15', storageGb: 100, size: 'large' as const },
    adfs: { size: 'medium' as const, windowsVersion: '2022' as const },
    compliance: {
      encryptionAtRest: true,
      auditLogging: true,
      encryptionInTransit: true,
      securityControls: {
        mfaRequired: true,
        networkSegmentation: true,
        vulnerabilityManagement: true,
        incidentResponse: true
      },
      retentionPolicy: {
        auditLogRetentionDays: 365
      }
    }
  };

  test('validates NIST Moderate compliance successfully', () => {
    const result = checkCompliance(baseConfig, 'nist-moderate');
    expect(result.compliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test('validates NIST Moderate function directly', () => {
    const result = validateNISTModerateCompliance(baseConfig);
    expect(result.valid).toBe(true);
    expect(result.issues.length).toBe(0);
  });

  test('fails NIST Moderate without network segmentation', () => {
    const config = { ...baseConfig };
    delete config.compliance.securityControls.networkSegmentation;
    const result = validateNISTModerateCompliance(config);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('NIST MODERATE: AC-4 - Network segmentation required');
  });
});

describe('NIST High Compliance', () => {
  const baseConfig = {
    projectName: 'test-project',
    environment: 'prod' as const,
    networkCidr: '10.0.0.0/16',
    k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'medium' as const },
    postgres: { engineVersion: '15', storageGb: 100, size: 'large' as const },
    adfs: { size: 'medium' as const, windowsVersion: '2022' as const },
    compliance: {
      encryptionAtRest: true,
      auditLogging: true,
      encryptionInTransit: true,
      securityControls: {
        mfaRequired: true,
        networkSegmentation: true,
        vulnerabilityManagement: true,
        incidentResponse: true,
        privilegedAccessManagement: true,
        malwareProtection: true,
        securityMonitoring: true
      },
      retentionPolicy: {
        auditLogRetentionDays: 730
      }
    }
  };

  test('validates NIST High compliance successfully', () => {
    const result = checkCompliance(baseConfig, 'nist-high');
    expect(result.compliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test('validates NIST High function directly', () => {
    const result = validateNISTHighCompliance(baseConfig);
    expect(result.valid).toBe(true);
    expect(result.issues.length).toBe(0);
  });

  test('fails NIST High without privileged access management', () => {
    const config = { ...baseConfig };
    delete config.compliance.securityControls.privilegedAccessManagement;
    const result = validateNISTHighCompliance(config);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('NIST HIGH: AC-6 - Privileged access management required');
  });
});

describe('Privacy Impact Assessment', () => {
  const baseConfig = {
    projectName: 'test-project',
    environment: 'prod' as const,
    networkCidr: '10.0.0.0/16',
    k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'medium' as const },
    postgres: { engineVersion: '15', storageGb: 100, size: 'large' as const },
    adfs: { size: 'medium' as const, windowsVersion: '2022' as const },
    compliance: {
      dataMinimization: true,
      encryptionAtRest: true,
      retentionPolicy: { piiRetentionDays: 2555 }
    }
  };

  test('conducts PIA successfully', () => {
    const pia = conductPrivacyImpactAssessment(baseConfig);
    expect(pia.assessmentId).toMatch(/^PIA-/);
    expect(pia.systemName).toBe('test-project');
    expect(pia.dataFlows.length).toBeGreaterThan(0);
    expect(pia.risks.length).toBeGreaterThan(0);
    expect(pia.mitigations.length).toBeGreaterThan(0);
  });

  test('generates appropriate risks for confidential data', () => {
    const pia = conductPrivacyImpactAssessment(baseConfig);
    const dbRisk = pia.risks.find(r => r.description.includes('personal_information'));
    expect(dbRisk).toBeDefined();
    expect(dbRisk?.riskLevel).toBe('medium');
  });

  test('provides recommendations when controls are missing', () => {
    const configWithoutMinimization = {
      ...baseConfig,
      compliance: { ...baseConfig.compliance, dataMinimization: false }
    };
    const pia = conductPrivacyImpactAssessment(configWithoutMinimization);
    expect(pia.recommendations).toContain('Implement data minimization');
  });
});
