# Chiral Infrastructure as Code - Agent Skills

This document defines Chiral's core functions as agent skills for integration with cloud agent platforms (AWS Q, Azure AI Foundry, GCP Vertex AI). Each skill exposes deterministic, stateless operations for infrastructure generation, validation, and analysis.

## Overview
Chiral provides agent-accessible skills for generating compliant, multi-cloud infrastructure artifacts. Skills are designed to be idempotent, secure, and integrated with cloud agent ecosystems.

## Skills

### generateArtifacts
**Description**: Generate native IaC artifacts (AWS CDK/CloudFormation, Azure Bicep, GCP Terraform) from a ChiralSystem intent configuration.

**Parameters**:
- `config`: ChiralSystem object (intent schema)
- `providers`: Array of target clouds ['aws', 'azure', 'gcp'] (optional, defaults to all)

**Output**: Object with generated artifacts per provider (strings of IaC code)

**Example Usage**:
```json
{
  "skill": "generateArtifacts",
  "parameters": {
    "config": {
      "projectName": "my-app",
      "environment": "prod",
      "networkCidr": "10.0.0.0/16",
      "k8s": {"version": "1.29", "minNodes": 3, "maxNodes": 10, "size": "large"},
      "postgres": {"engineVersion": "15", "storageGb": 100, "size": "large"},
      "adfs": {"size": "large", "windowsVersion": "2022"}
    }
  }
}
```

**Error Handling**: Returns validation errors if config is invalid.

### validateConfig
**Description**: Validate a ChiralSystem configuration against schemas, compliance frameworks, and regional availability.

**Parameters**:
- `config`: ChiralSystem object
- `frameworks`: Array of compliance frameworks ['soc2', 'hipaa', 'fedramp'] (optional)

**Output**: ValidationResult object with valid (boolean), errors (array), warnings (array), recommendations (array)

**Example Usage**:
```json
{
  "skill": "validateConfig",
  "parameters": {
    "config": {...},
    "frameworks": ["soc2", "hipaa"]
  }
}
```

### analyzeCosts
**Description**: Estimate monthly costs for generated infrastructure across providers using integrated cost analyzers (Infracost, Azure Cost, GCP Cost).

**Parameters**:
- `config`: ChiralSystem object
- `providers`: Array of clouds to analyze (optional)

**Output**: CostComparison object with cheapest provider, total costs, breakdowns, recommendations

**Example Usage**:
```json
{
  "skill": "analyzeCosts",
  "parameters": {
    "config": {...}
  }
}
```

### importIaC
**Description**: Import existing IaC (Terraform, Pulumi, CloudFormation) into ChiralSystem format, with AI-enhanced inference for unmappable resources.

**Parameters**:
- `sourcePath`: Path to IaC file/directory
- `provider`: Source cloud ('aws', 'azure', 'gcp')
- `agentic`: Boolean to enable AI-enhanced import (optional)

**Output**: ChiralSystem object inferred from source

**Example Usage**:
```json
{
  "skill": "importIaC",
  "parameters": {
    "sourcePath": "./terraform/",
    "provider": "aws",
    "agentic": true
  }
}
```

### checkCompliance
**Description**: Assess compliance of ChiralSystem against specified frameworks (SOC2, HIPAA, FedRAMP, etc.).

**Parameters**:
- `config`: ChiralSystem object
- `framework`: Compliance framework string

**Output**: ComplianceCheck object with compliant (boolean), violations (array), recommendations (array)

### detectDrift
**Description**: Compare generated artifacts with deployed infrastructure to detect configuration drift.

**Parameters**:
- `config`: ChiralSystem object
- `artifacts`: Object with generated artifacts per provider

**Output**: DriftDetectionResult with hasDrift (boolean), drifted/missing/added resources

## Integration Guidelines
- **Authentication**: Use cloud IAM roles/tokens for secure access.
- **Caching**: Implement response caching to reduce API costs and latency.
- **Fallbacks**: Skills include fallbacks to deterministic operations if agent services unavailable.
- **Observability**: Log skill invocations via cloud-native monitoring (CloudWatch, Azure Monitor, Cloud Logging).

## Security Considerations
- Input validation prevents injection attacks.
- No sensitive data (secrets, keys) in outputs.
- Encrypted communications via cloud agent protocols.

## Testing
- Unit tests mock agent APIs.
- Integration tests use test cloud accounts.
- Validation ensures outputs match chiral compliance standards.

This skills definition enables cloud agents to leverage Chiral's deterministic infrastructure generation while maintaining security and reliability.
