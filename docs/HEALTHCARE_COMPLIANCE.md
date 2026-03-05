# Healthcare Compliance Guide

## Overview

This guide covers implementing HIPAA, HITRUST CSF, and HITECH compliance requirements using Chiral Infrastructure as Code. These frameworks are essential for healthcare organizations handling Protected Health Information (PHI) and Electronic Health Records (EHR).

## Supported Healthcare Compliance Frameworks

### HIPAA (Health Insurance Portability and Accountability Act)

HIPAA sets the standard for protecting sensitive patient health information. Chiral supports three implementation levels:

- **HIPAA Low**: Basic HIPAA requirements for small healthcare applications
- **HIPAA Moderate**: Enhanced controls for medium-risk healthcare systems
- **HIPAA High**: Comprehensive controls for critical patient care systems

### HITRUST CSF (Health Information Trust Alliance Common Security Framework)

HITRUST CSF provides a comprehensive security framework specifically designed for healthcare organizations:

- **HITRUST CSF Low**: Basic healthcare security controls
- **HITRUST CSF Moderate**: Enhanced controls for healthcare data processing
- **HITRUST CSF High**: Advanced controls for high-sensitivity healthcare systems

### HITECH (Health Information Technology for Economic and Clinical Health Act)

HITECH strengthens HIPAA requirements and adds breach notification provisions:

- **HITECH Low**: Basic breach prevention requirements
- **HITECH Moderate**: Enhanced breach detection and notification
- **HITECH High**: Comprehensive breach prevention and rapid response

## Key Compliance Requirements

### Common Requirements Across All Healthcare Frameworks

#### 1. Data Protection
- **Encryption at Rest**: All PHI must be encrypted when stored
- **Encryption in Transit**: All PHI transmissions must be encrypted
- **Network Security**: Proper network segmentation and access controls

#### 2. Audit and Monitoring
- **Comprehensive Audit Logging**: All access to PHI must be logged
- **Access Controls**: Role-based access to healthcare systems
- **Monitoring**: Real-time monitoring of healthcare data access

#### 3. High Availability
- **Redundancy**: Multiple nodes for production healthcare systems
- **Backup and Recovery**: Regular backups and tested recovery procedures
- **Disaster Recovery**: Comprehensive disaster recovery planning

#### 4. Data Residency
- **Geographic Controls**: PHI must remain within specified geographic boundaries
- **Regional Compliance**: Use of healthcare-compliant cloud regions
- **Data Sovereignty**: Strict control over PHI storage locations

## Implementation Examples

### HIPAA High Implementation

```typescript
export const hipaaHighConfig: ChiralSystem = {
  projectName: 'critical-care-system',
  environment: 'prod',
  networkCidr: '192.168.0.0/16',  // Non-default network
  
  region: {
    aws: 'us-east-1',           // Healthcare-compliant regions
    azure: 'eastus',
    gcp: 'us-central1'
  },
  
  compliance: {
    framework: 'hipaa-high',
    encryptionAtRest: true,      // Required for PHI
    auditLogging: true,          // Enhanced PHI access logging
    dataResidency: {
      aws: 'us-east-1',
      azure: 'eastus',
      gcp: 'us-central1'
    }
  },
  
  k8s: {
    version: '1.35',
    minNodes: 3,                 // High availability for patient care
    maxNodes: 10,
    size: 'medium'
  },
  
  postgres: {
    engineVersion: '15',
    size: 'large',
    storageGb: 100               // Minimum 100GB for PHI databases
  },
  
  adfs: {
    size: 'medium',              // Production ADFS sizing
    windowsVersion: '2022'
  }
};
```

### HITRUST CSF Moderate Implementation

```typescript
export const hitrustModerateConfig: ChiralSystem = {
  projectName: 'healthcare-portal',
  environment: 'prod',
  networkCidr: '172.16.0.0/16',
  
  compliance: {
    framework: 'hitrust-moderate',
    encryptionAtRest: true,
    auditLogging: true,
    dataResidency: {
      aws: 'us-east-1',
      azure: 'eastus'
    }
  },
  
  k8s: {
    version: '1.35',
    minNodes: 2,
    maxNodes: 8,
    size: 'medium'
  },
  
  postgres: {
    engineVersion: '15',
    size: 'medium',
    storageGb: 50                // Minimum 50GB for HITRUST Moderate
  }
};
```

### HITECH High Implementation

```typescript
export const hitechHighConfig: ChiralSystem = {
  projectName: 'ehr-system',
  environment: 'prod',
  networkCidr: '10.200.0.0/16',
  
  compliance: {
    framework: 'hitech-high',
    encryptionAtRest: true,      // Prevents breach notifications
    auditLogging: true,          // Enhanced breach detection
    dataResidency: {
      aws: 'us-east-1'
    }
  },
  
  k8s: {
    version: '1.35',
    minNodes: 3,                 // Enhanced availability for breach prevention
    maxNodes: 15,
    size: 'large'
  },
  
  postgres: {
    engineVersion: '15',
    size: 'large',
    storageGb: 75                // Minimum 75GB for breach investigation
  }
};
```

## Compliance Validation

### Using Chiral CLI for Healthcare Compliance

```bash
# HIPAA compliance validation
chiral validate -c chiral.config.ts --compliance hipaa-low
chiral validate -c chiral.config.ts --compliance hipaa-moderate
chiral validate -c chiral.config.ts --compliance hipaa-high

# HITRUST CSF compliance validation
chiral validate -c chiral.config.ts --compliance hitrust-low
chiral validate -c chiral.config.ts --compliance hitrust-moderate
chiral validate -c chiral.config.ts --compliance hitrust-high

# HITECH compliance validation
chiral validate -c chiral.config.ts --compliance hitech-low
chiral validate -c chiral.config.ts --compliance hitech-moderate
chiral validate -c chiral.config.ts --compliance hitech-high

# Full compliance and deployment readiness check
chiral validate -c chiral.config.ts --compliance hipaa-high --deployment-check
```

### Programmatic Compliance Checking

```typescript
import { checkCompliance } from 'chiral-validation';

// Check HIPAA compliance
const hipaaResult = checkCompliance(config, 'hipaa-high');
if (!hipaaResult.compliant) {
  console.log('HIPAA violations:', hipaaResult.violations);
  console.log('Recommendations:', hipaaResult.recommendations);
}

// Check HITRUST compliance
const hitrustResult = checkCompliance(config, 'hitrust-moderate');
if (!hitrustResult.compliant) {
  console.log('HITRUST violations:', hitrustResult.violations);
  console.log('Recommendations:', hitrustResult.recommendations);
}

// Check HITECH compliance
const hitechResult = checkCompliance(config, 'hitech-high');
if (!hitechResult.compliant) {
  console.log('HITECH violations:', hitechResult.violations);
  console.log('Recommendations:', hitechResult.recommendations);
}
```

## Best Practices

### 1. Network Security
- Use non-default network CIDR ranges (avoid 10.0.0.0/16)
- Implement proper network segmentation
- Use healthcare-compliant cloud regions

### 2. Data Protection
- Enable encryption at rest for all data stores
- Enable encryption in transit for all communications
- Implement comprehensive audit logging

### 3. High Availability
- Use minimum 2 nodes for production systems
- Use minimum 3 nodes for high-sensitivity systems
- Implement proper backup and recovery procedures

### 4. Infrastructure Sizing
- Use medium or large workload sizes for production ADFS
- Ensure adequate storage for PHI databases (100GB+ for high sensitivity)
- Size clusters appropriately for expected load

### 5. Monitoring and Alerting
- Implement comprehensive monitoring for healthcare systems
- Set up alerts for unusual access patterns
- Regular security audits and penetration testing

## Common Compliance Violations and Fixes

### 1. Default Network CIDR
**Violation**: Using 10.0.0.0/16 network range
**Fix**: Use organization-specific network ranges like 192.168.0.0/16 or 172.16.0.0/16

### 2. Missing Encryption
**Violation**: Encryption at rest not enabled
**Fix**: Enable `encryptionAtRest: true` in compliance configuration

### 3. Insufficient Audit Logging
**Violation**: Comprehensive audit logging not enabled
**Fix**: Enable `auditLogging: true` in compliance configuration

### 4. Inadequate High Availability
**Violation**: Single node deployment in production
**Fix**: Use minimum 2-3 nodes for production healthcare systems

### 5. Missing Data Residency
**Violation**: Data residency requirements not specified
**Fix**: Specify `dataResidency` regions for all cloud providers

## Migration Considerations

### From Existing Healthcare Systems
1. **Assessment**: Evaluate current compliance posture
2. **Planning**: Create migration strategy with compliance validation
3. **Validation**: Test compliance before production deployment
4. **Monitoring**: Implement enhanced monitoring post-migration

### Multi-Cloud Healthcare Deployments
1. **Consistency**: Ensure compliance across all cloud providers
2. **Data Residency**: Maintain geographic requirements
3. **Network Security**: Implement consistent security controls
4. **Audit Trails**: Unified audit logging across clouds

## Testing and Validation

### Unit Tests
```typescript
describe('HIPAA High Compliance', () => {
  test('validates PHI protection requirements', () => {
    const result = checkCompliance(hipaaConfig, 'hipaa-high');
    expect(result.compliant).toBe(true);
  });
  
  test('fails without encryption at rest', () => {
    const config = { ...hipaaConfig, compliance: { ...hipaaConfig.compliance, encryptionAtRest: false } };
    const result = checkCompliance(config, 'hipaa-high');
    expect(result.compliant).toBe(false);
    expect(result.violations).toContain('HIPAA HIGH: Encryption at rest is required for PHI');
  });
});
```

### Integration Tests
- Test compliance validation across different cloud providers
- Validate audit logging functionality
- Test high availability scenarios
- Verify data residency controls

## Conclusion

Chiral provides comprehensive support for healthcare compliance frameworks with automated validation and enforcement. By following this guide and using the built-in compliance checking capabilities, healthcare organizations can ensure their infrastructure meets HIPAA, HITRUST CSF, and HITECH requirements while maintaining the benefits of multi-cloud deployments.

For additional support or questions about healthcare compliance implementation, refer to the main Chiral documentation or contact the compliance team.
