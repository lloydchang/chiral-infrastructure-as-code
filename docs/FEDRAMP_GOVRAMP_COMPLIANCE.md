# FedRAMP and GovRAMP Compliance Guide

This document provides comprehensive guidance on implementing FedRAMP and GovRAMP compliance using Chiral Infrastructure as Code.

## Overview

Chiral provides built-in compliance validation for federal and state government cloud requirements through the FedRAMP (Federal Risk and Authorization Management Program) and GovRAMP (formerly StateRAMP) frameworks.

## Supported Compliance Frameworks

### FedRAMP Levels
- **FedRAMP Low**: Basic federal security controls for low-impact systems
- **FedRAMP Moderate**: Enhanced security controls for moderate-impact systems  
- **FedRAMP High**: Comprehensive security controls for high-impact systems

### GovRAMP Levels
- **GovRAMP Low**: Basic state/local government security controls
- **GovRAMP Moderate**: Enhanced security controls for state systems
- **GovRAMP High**: Comprehensive security controls for critical state systems

## Compliance Requirements

### Common Requirements (All Levels)

#### Encryption at Rest
```typescript
compliance: {
  framework: 'fedramp-low',
  encryptionAtRest: true,  // Required for all levels
  auditLogging: true      // Required for all levels
}
```

#### Audit Logging
Comprehensive audit logging is mandatory for all compliance levels and includes:
- API access logs
- Configuration changes
- Security events
- Data access patterns

#### High Availability
Production environments must meet minimum availability requirements:
- **FedRAMP/GovRAMP Low**: Minimum 2 nodes
- **FedRAMP/GovRAMP High**: Minimum 3 nodes

### FedRAMP Specific Requirements

#### FedRAMP Low
- Government cloud regions required (AWS GovCloud, Azure Government, GCP Government)
- Basic encryption and audit logging
- High availability for production workloads

#### FedRAMP Moderate
- All Low requirements plus:
- Minimum 50GB database storage for production
- Explicit data residency configuration
- Enhanced security controls

#### FedRAMP High
- All Moderate requirements plus:
- Minimum 3 nodes for production
- Minimum 500GB database storage
- FIPS 140-2 validated encryption
- Enhanced audit logging with tamper-evident storage
- Explicit region specification required

### GovRAMP Specific Requirements

#### GovRAMP Low
- Government cloud regions preferred
- Basic encryption and audit logging
- Data residency requirements must be specified
- High availability for production workloads

#### GovRAMP Moderate
- All Low requirements plus:
- Minimum 50GB database storage for production
- Commercial cloud preferred unless government cloud mandated
- Enhanced security monitoring

#### GovRAMP High
- All Moderate requirements plus:
- Minimum 3 nodes for production
- Minimum 200GB database storage
- FIPS 140-2 validated encryption
- Additional oversight for large clusters

## Implementation Examples

### FedRAMP Moderate Configuration
```typescript
export const config: ChiralSystem = {
  projectName: 'federal-system',
  environment: 'prod',
  networkCidr: '10.1.0.0/16',  // Non-default CIDR
  
  region: {
    aws: 'us-gov-east-1',      // GovCloud region
    azure: 'usgovvirginia',    // Azure Government
    gcp: 'us-gov-central1'     // GCP Government
  },
  
  compliance: {
    framework: 'fedramp-moderate',
    encryptionAtRest: true,
    auditLogging: true,
    dataResidency: {
      aws: 'us-gov-east-1',
      azure: 'usgovvirginia', 
      gcp: 'us-gov-central1'
    }
  },
  
  k8s: {
    version: '1.35',
    minNodes: 2,               // Minimum for production
    maxNodes: 5,
    size: 'medium'
  },
  
  postgres: {
    engineVersion: '15',
    size: 'medium',
    storageGb: 100             // Minimum 50GB for Moderate
  },
  
  adfs: {
    size: 'medium',
    windowsVersion: '2022'
  }
};
```

### GovRAMP High Configuration
```typescript
export const config: ChiralSystem = {
  projectName: 'state-critical-system',
  environment: 'prod',
  networkCidr: '192.168.0.0/16',
  
  region: {
    aws: 'us-gov-west-1',
    azure: 'usgovtexas',
    gcp: 'us-gov-west1'
  },
  
  compliance: {
    framework: 'govramp-high',
    encryptionAtRest: true,
    auditLogging: true,
    dataResidency: {
      aws: 'us-gov-west-1',
      azure: 'usgovtexas',
      gcp: 'us-gov-west1'
    }
  },
  
  k8s: {
    version: '1.35',
    minNodes: 3,               // Minimum 3 for High
    maxNodes: 10,
    size: 'large'
  },
  
  postgres: {
    engineVersion: '15',
    size: 'large',
    storageGb: 500             // Minimum 200GB for GovRAMP High
  },
  
  adfs: {
    size: 'large',
    windowsVersion: '2022'
  }
};
```

## Validation Commands

### Basic Compliance Validation
```bash
# Validate FedRAMP Moderate compliance
chiral validate -c config.ts --compliance fedramp-moderate

# Validate GovRAMP High compliance
chiral validate -c config.ts --compliance govramp-high

# Validate with detailed output
chiral validate -c config.ts --compliance fedramp-high --verbose
```

### Deployment Readiness with Compliance
```bash
# Check deployment readiness and compliance together
chiral validate -c config.ts --compliance fedramp-moderate --deployment-check

# Full validation suite
chiral validate -c config.ts --compliance govramp-high --deployment-check --cost-analysis
```

## Cloud Provider Requirements

### AWS FedRAMP/GovRAMP
- **FedRAMP**: Use AWS GovCloud (us-gov-east-1, us-gov-west-1)
- **GovRAMP**: AWS GovCloud preferred, commercial regions acceptable
- **Services**: EKS, RDS, EC2 with FIPS endpoints
- **Encryption**: AWS KMS with FIPS 140-2 validated keys

### Azure FedRAMP/GovRAMP
- **FedRAMP**: Azure Government (usgovvirginia, usgovtexas, usgovarizona)
- **GovRAMP**: Azure Government preferred
- **Services**: AKS, Azure Database, VMs with government compliance
- **Encryption**: Azure Key Vault with FIPS 140-2 validated HSMs

### GCP FedRAMP/GovRAMP
- **FedRAMP**: Google Cloud Government (us-gov-central1, us-gov-west1, us-gov-east1)
- **GovRAMP**: GCP Government preferred
- **Services**: GKE, Cloud SQL, Compute Engine with government compliance
- **Encryption**: Cloud KMS with FIPS 140-2 validated keys

## Security Controls

### Network Security
- Non-default network CIDR ranges
- Proper subnet segmentation
- Security group configurations
- Network ACLs where applicable

### Data Protection
- Encryption at rest (mandatory)
- Encryption in transit (TLS 1.2+)
- Data residency controls
- Backup and recovery procedures

### Access Control
- Role-based access control (RBAC)
- Multi-factor authentication (MFA)
- Principle of least privilege
- Regular access reviews

### Monitoring and Logging
- Comprehensive audit trails
- Security event monitoring
- Log retention policies
- Tamper-evident log storage

## Migration Considerations

### From Commercial to Government Cloud
1. **Assessment**: Validate current compliance status
2. **Planning**: Determine target compliance level
3. **Configuration**: Update regions and security settings
4. **Validation**: Run compliance checks before migration
5. **Deployment**: Use government cloud endpoints

### Compliance Validation During Migration
```bash
# Analyze existing infrastructure for compliance gaps
chiral analyze --source terraform/ --provider aws --compliance fedramp-moderate

# Generate compliant configuration
chiral migrate --source terraform/ --provider aws --compliance fedramp-moderate

# Validate before deployment
chiral validate -c migrated-config.ts --compliance fedramp-moderate
```

## Best Practices

### Configuration Management
- Use non-default network CIDR ranges
- Specify explicit regions for all providers
- Enable all required compliance features
- Regular compliance validation

### Security Hardening
- Implement defense-in-depth approach
- Regular security updates and patches
- Continuous monitoring and alerting
- Incident response procedures

### Documentation and Auditing
- Maintain compliance documentation
- Regular audit trail reviews
- Change management procedures
- Compliance reporting

## Troubleshooting

### Common Compliance Issues

#### Government Cloud Region Errors
```
FedRAMP MODERATE: AWS GovCloud or equivalent controls required
```
**Solution**: Update region configuration to use government cloud regions.

#### Encryption Requirements
```
FedRAMP LOW: Encryption at rest required
```
**Solution**: Enable `encryptionAtRest: true` in compliance configuration.

#### Data Residency Issues
```
GovRAMP LOW: Data residency requirements must be specified
```
**Solution**: Add `dataResidency` configuration with appropriate regions.

#### Availability Requirements
```
FedRAMP HIGH: Production environments require minimum 3 nodes
```
**Solution**: Update `minNodes` to meet compliance requirements.

### Validation Commands for Debugging
```bash
# Detailed validation output
chiral validate -c config.ts --compliance fedramp-moderate --verbose

# Check specific requirements
chiral validate -c config.ts --compliance govramp-high --check encryption

# Generate compliance report
chiral validate -c config.ts --compliance fedramp-high --report compliance-report.json
```

## Integration with CI/CD

### Automated Compliance Checks
```yaml
# GitHub Actions example
- name: Validate FedRAMP Compliance
  run: |
    chiral validate -c config.ts --compliance fedramp-moderate
    chiral validate -c config.ts --compliance fedramp-moderate --deployment-check

- name: Generate Compliance Report
  run: |
    chiral validate -c config.ts --compliance fedramp-high --report compliance.json
```

### Pre-deployment Validation
```bash
# Pipeline validation script
#!/bin/bash
echo "Validating FedRAMP Moderate compliance..."
chiral validate -c config.ts --compliance fedramp-moderate

if [ $? -ne 0 ]; then
  echo "❌ Compliance validation failed"
  exit 1
fi

echo "✅ Compliance validation passed"
echo "Generating deployment artifacts..."
chiral --config config.ts
```

## References

- [FedRAMP Marketplace](https://marketplace.fedramp.gov/)
- [GovRAMP Authorization](https://www.stateramp.com/)
- [AWS FedRAMP Compliance](https://aws.amazon.com/compliance/fedramp/)
- [Azure Government Compliance](https://azure.microsoft.com/en-us/global-infrastructure/government/)
- [Google Cloud Government](https://cloud.google.com/government)

## Support

For compliance-related questions or issues:
1. Review this documentation
2. Check validation output for specific requirements
3. Consult cloud provider compliance documentation
4. Contact your compliance officer for organization-specific requirements
