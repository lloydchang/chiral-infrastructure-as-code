# DoD Impact Level Compliance

This document outlines Chiral's support for Department of Defense (DoD) Impact Levels (IL2, IL4, IL5, IL6) compliance requirements. These levels correspond to Controlled Unclassified Information (CUI) and mission-critical defense systems.

## Impact Levels Overview

### IL2 - Basic Protection for CUI
- **Scope**: Controlled Unclassified Information (CUI)
- **Requirements**: Basic security controls for non-sensitive defense data
- **Cloud Providers**: AWS GovCloud or Azure Government recommended

### IL4 - Enhanced Protection
- **Scope**: CUI and mission-critical systems
- **Requirements**: Enhanced security controls, government cloud mandatory
- **Cloud Providers**: AWS GovCloud, Azure Government, GCP GovCloud required

### IL5 - Highest Level Protection
- **Scope**: National security systems and critical CUI
- **Requirements**: Specialized security controls, Secret Region required
- **Cloud Providers**: AWS GovCloud Secret, Azure Government Secret, GCP GovCloud Secret

### IL6 - Classified Information Processing
- **Scope**: SCI/SAP (Special Compartmented Information/Special Access Programs)
- **Requirements**: Classified computing environments, highly specialized
- **Cloud Providers**: Requires dedicated classified infrastructure

## Compliance Checks

### Common Requirements (All Levels)
- **Encryption at Rest**: Required for all data stores
- **Audit Logging**: Comprehensive logging for all resources and access
- **High Availability**: Production environments must have fault tolerance (min 2 nodes)

### Level-Specific Requirements

#### IL2 Checks
- **Government Cloud Preference**: AWS GovCloud or Azure Government recommended for CUI
- **Network Segmentation**: Avoid default CIDR ranges, use organization-specific networks

#### IL4 Checks
- **Government Cloud Mandatory**: GovCloud required for all providers
- **Storage Capacity**: Production databases minimum 50GB
- **Resource Scaling**: Enhanced monitoring for large clusters (>20 nodes)

#### IL5 Checks
- **Secret Region Required**: GovCloud Secret regions mandatory
- **Enhanced Availability**: Minimum 3 nodes for critical defense systems
- **Database Capacity**: Production databases minimum 100GB
- **Explicit Region Specification**: Government cloud regions required for all providers

#### IL6 Checks
- **Classified Environments**: Specialized classified computing infrastructure required
- **Production-Grade Security**: Production environment with enhanced controls mandatory
- **Minimal Attack Surface**: Cluster size limited (<10 nodes)

## Implementation

Chiral validates DoD compliance through the `checkCompliance` function with framework `dod-il2`, `dod-il4`, `dod-il5`, or `dod-il6`.

```typescript
const result = checkCompliance(config, 'dod-il4');
```

## Recommendations

- Use government cloud regions for defense workloads
- Implement comprehensive audit logging
- Ensure encryption at rest for all sensitive data
- Deploy multiple nodes for high availability
- Use appropriate storage capacities for production workloads
- Consult DoD for IL6 classified requirements

## Related Documents

- [Healthcare Compliance](./HEALTHCARE_COMPLIANCE.md)
- [FedRAMP/GovRAMP Compliance](./FEDRAMP_GOVRAMP_COMPLIANCE.md)
- [General Compliance Overview](../../README.md#compliance)
