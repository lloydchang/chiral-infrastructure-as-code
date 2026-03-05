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
      dataResidency: { aws: 'us-east-1' },
      region: { aws: 'us-east-1' }
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
    expect(result.errors.length).toBe(0);
  });

  test('fails ISO 27001 without encryption', () => {
    const config = { ...baseConfig, compliance: { ...baseConfig.compliance, encryptionAtRest: false } };
    const result = validateISO27001Compliance(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Encryption at rest not enabled');
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
      dataResidency: { aws: 'us-east-1' },
      auditLogging: true,
      cloudProviderAssessment: true,
      serviceLevelAgreements: true
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
    expect(result.errors.length).toBe(0);
  });

  test('fails ISO 27017 without shared responsibility', () => {
    const config = { ...baseConfig, compliance: { ...baseConfig.compliance, sharedResponsibility: false } };
    const result = validateISO27017Compliance(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Shared responsibility model not documented');
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
      encryptionAtRest: true,
      privacyByDesign: true,
      purposeLimitation: true,
      dataSubjectRights: true,
      privacyImpactAssessment: true,
      privacyControls: {
        dataClassification: true,
        dataLossPrevention: true,
        consentRecording: true,
        dataSubjectRequests: true,
        privacyAudits: true
      },
      retentionPolicy: {
        piiRetentionDays: 365
      }
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
    expect(result.errors.length).toBe(0);
  });

  test('fails ISO 27018 without data minimization', () => {
    const config = { ...baseConfig, compliance: { ...baseConfig.compliance, dataMinimization: false } };
    const result = validateISO27018Compliance(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('ISO 27018: Data minimization principles required');
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
    expect(result.errors.length).toBe(0);
  });

  test('fails NIST Low without encryption at rest', () => {
    const config = { ...baseConfig };
    config.compliance.encryptionAtRest = false;
    const result = validateNISTLowCompliance(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('NIST LOW: SC-28 - Encryption at rest not enabled');
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
    expect(result.errors.length).toBe(0);
  });

  test('fails NIST Moderate without network segmentation', () => {
    const config = { ...baseConfig };
    config.compliance.securityControls.networkSegmentation = false;
    const result = validateNISTModerateCompliance(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('NIST MODERATE: AC-4 - Network segmentation required');
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
    expect(result.errors.length).toBe(0);
  });

  test('fails NIST High without privileged access management', () => {
    const config = { ...baseConfig };
    config.compliance.securityControls.privilegedAccessManagement = false;
    const result = validateNISTHighCompliance(config);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('NIST HIGH: AC-6 - Privileged access management required');
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

describe('HIPAA Compliance', () => {
  const baseConfig = {
    projectName: 'test-project',
    environment: 'prod' as const,
    networkCidr: '192.168.0.0/16',
    k8s: { version: '1.29', minNodes: 3, maxNodes: 5, size: 'medium' as const },
    postgres: { engineVersion: '15', storageGb: 100, size: 'large' as const },
    adfs: { size: 'medium' as const, windowsVersion: '2022' as const },
    region: { aws: 'us-east-1' },
    compliance: {
      encryptionAtRest: true,
      auditLogging: true,
      dataResidency: { aws: 'us-east-1' }
    }
  };

  test('validates HIPAA Low compliance successfully', () => {
    const result = checkCompliance(baseConfig, 'hipaa-low');
    expect(result.compliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test('validates HIPAA Moderate compliance successfully', () => {
    const result = checkCompliance(baseConfig, 'hipaa-moderate');
    expect(result.compliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test('validates HIPAA High compliance successfully', () => {
    const result = checkCompliance(baseConfig, 'hipaa-high');
    expect(result.compliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test('fails HIPAA without encryption at rest', () => {
    const config = { ...baseConfig, compliance: { ...baseConfig.compliance, encryptionAtRest: false } };
    const result = checkCompliance(config, 'hipaa-moderate');
    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('HIPAA MODERATE: Encryption at rest is required for PHI');
  });

  test('fails HIPAA with default network CIDR', () => {
    const config = { ...baseConfig, networkCidr: '10.0.0.0/16' };
    const result = checkCompliance(config, 'hipaa-high');
    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('HIPAA HIGH: Default network ranges may not meet data protection requirements');
  });

  test('fails HIPAA Moderate without adequate storage', () => {
    const config = { ...baseConfig, postgres: { ...baseConfig.postgres, storageGb: 50 } };
    const result = checkCompliance(config, 'hipaa-moderate');
    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('HIPAA MODERATE: Production databases must have adequate backup storage');
  });

  test('fails HIPAA High without data residency', () => {
    const config = { ...baseConfig, compliance: { ...baseConfig.compliance, dataResidency: undefined } };
    const result = checkCompliance(config, 'hipaa-high');
    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('HIPAA HIGH: Data residency requirements must be explicitly specified');
  });

  test('fails HIPAA High with small ADFS in production', () => {
    const config = { ...baseConfig, adfs: { size: 'small' as const, windowsVersion: '2022' as const } };
    const result = checkCompliance(config, 'hipaa-high');
    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('HIPAA HIGH: Production ADFS infrastructure must be sized for high availability');
  });
});

describe('HITRUST CSF Compliance', () => {
  const baseConfig = {
    projectName: 'test-project',
    environment: 'prod' as const,
    networkCidr: '192.168.0.0/16',
    k8s: { version: '1.29', minNodes: 3, maxNodes: 5, size: 'medium' as const },
    postgres: { engineVersion: '15', storageGb: 50, size: 'large' as const },
    adfs: { size: 'medium' as const, windowsVersion: '2022' as const },
    region: { aws: 'us-east-1' },
    compliance: {
      encryptionAtRest: true,
      auditLogging: true,
      dataResidency: { aws: 'us-east-1' }
    }
  };

  test('validates HITRUST CSF Low compliance successfully', () => {
    const result = checkCompliance(baseConfig, 'hitrust-low');
    expect(result.compliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test('validates HITRUST CSF Moderate compliance successfully', () => {
    const result = checkCompliance(baseConfig, 'hitrust-moderate');
    expect(result.compliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test('validates HITRUST CSF High compliance successfully', () => {
    const result = checkCompliance(baseConfig, 'hitrust-high');
    expect(result.compliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test('fails HITRUST CSF without encryption at rest', () => {
    const config = { ...baseConfig, compliance: { ...baseConfig.compliance, encryptionAtRest: false } };
    const result = checkCompliance(config, 'hitrust-moderate');
    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('HITRUST CSF MODERATE: Encryption at rest is mandatory');
  });

  test('fails HITRUST CSF with default network CIDR', () => {
    const config = { ...baseConfig, networkCidr: '10.0.0.0/16' };
    const result = checkCompliance(config, 'hitrust-high');
    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('HITRUST CSF HIGH: Default network CIDR does not meet security requirements');
  });

  test('fails HITRUST CSF Moderate without region specification', () => {
    const config = { ...baseConfig, region: undefined };
    const result = checkCompliance(config, 'hitrust-moderate');
    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('HITRUST CSF MODERATE: Region specification required for compliance');
  });

  test('fails HITRUST CSF High with large cluster', () => {
    const config = { ...baseConfig, k8s: { ...baseConfig.k8s, maxNodes: 25 } };
    const result = checkCompliance(config, 'hitrust-high');
    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('HITRUST CSF HIGH: Large clusters require enhanced security controls');
  });

  test('fails HITRUST CSF High with small ADFS', () => {
    const config = { ...baseConfig, adfs: { size: 'small' as const, windowsVersion: '2022' as const } };
    const result = checkCompliance(config, 'hitrust-high');
    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('HITRUST CSF HIGH: Identity infrastructure must be sized for security');
  });
});

describe('HITECH Compliance', () => {
  const baseConfig = {
    projectName: 'test-project',
    environment: 'prod' as const,
    networkCidr: '192.168.0.0/16',
    k8s: { version: '1.29', minNodes: 3, maxNodes: 5, size: 'medium' as const },
    postgres: { engineVersion: '15', storageGb: 75, size: 'large' as const },
    adfs: { size: 'medium' as const, windowsVersion: '2022' as const },
    region: { aws: 'us-east-1' },
    compliance: {
      encryptionAtRest: true,
      auditLogging: true,
      dataResidency: { aws: 'us-east-1' }
    }
  };

  test('validates HITECH Low compliance successfully', () => {
    const result = checkCompliance(baseConfig, 'hitech-low');
    expect(result.compliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test('validates HITECH Moderate compliance successfully', () => {
    const result = checkCompliance(baseConfig, 'hitech-moderate');
    expect(result.compliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test('validates HITECH High compliance successfully', () => {
    const result = checkCompliance(baseConfig, 'hitech-high');
    expect(result.compliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test('fails HITECH without encryption at rest', () => {
    const config = { ...baseConfig, compliance: { ...baseConfig.compliance, encryptionAtRest: false } };
    const result = checkCompliance(config, 'hitech-moderate');
    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('HITECH MODERATE: Encryption required to prevent breach notifications');
  });

  test('fails HITECH with default network CIDR', () => {
    const config = { ...baseConfig, networkCidr: '10.0.0.0/16' };
    const result = checkCompliance(config, 'hitech-high');
    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('HITECH HIGH: Default network ranges may not meet breach prevention requirements');
  });

  test('fails HITECH Moderate without adequate backup storage', () => {
    const config = { ...baseConfig, postgres: { ...baseConfig.postgres, storageGb: 50 } };
    const result = checkCompliance(config, 'hitech-moderate');
    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('HITECH MODERATE: Production databases must have adequate backup for breach investigation');
  });

  test('fails HITECH High without data residency', () => {
    const config = { ...baseConfig, compliance: { ...baseConfig.compliance, dataResidency: undefined } };
    const result = checkCompliance(config, 'hitech-high');
    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('HITECH HIGH: Data residency must be specified for breach notification compliance');
  });

  test('fails HITECH High with small ADFS in production', () => {
    const config = { ...baseConfig, adfs: { size: 'small' as const, windowsVersion: '2022' as const } };
    const result = checkCompliance(config, 'hitech-high');
    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('HITECH HIGH: Identity infrastructure must support enhanced monitoring');
  });
});
