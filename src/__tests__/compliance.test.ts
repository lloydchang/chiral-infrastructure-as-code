// Tests for ISO compliance functionality

import { checkCompliance } from '../validation';

describe('ISO 27001 Compliance', () => {
  const baseConfig = {
    projectName: 'test-project',
    environment: 'prod' as const,
    networkCidr: '192.168.1.0/24',
    region: { aws: 'us-east-1' },
    k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'medium' as const },
    postgres: { engineVersion: '15', storageGb: 100, size: 'large' as const },
    adfs: { size: 'medium' as const, windowsVersion: '2022' as const },
    compliance: {
      encryptionAtRest: true,
      encryptionInTransit: true,
      auditLogging: true,
      dataResidency: { aws: 'us-east-1' }
    }
  };

  test('validates ISO 27001 compliance successfully', () => {
    const result = checkCompliance(baseConfig, 'iso27001');
    expect(result.compliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test('fails ISO 27001 without encryption', () => {
    const config = { ...baseConfig, compliance: { ...baseConfig.compliance, encryptionAtRest: false } };
    const result = checkCompliance(config, 'iso27001');
    expect(result.compliant).toBe(false);
    expect(result.violations.some(v => v.includes('Encryption at rest'))).toBe(true);
  });
});
