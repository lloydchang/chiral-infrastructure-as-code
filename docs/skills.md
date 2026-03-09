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

### 🤖 Agent-Enhanced Skills

#### `multi_agent_generate`
Uses GenDB-inspired multi-agent architecture for optimized IaC generation.

**Parameters:**
- `config`: ChiralSystem configuration object
- `optimization_goals`: Array of goals (cost, performance, security)
- `max_iterations`: Maximum optimization iterations

**Response:**
```json
{
  "artifacts": {
    "aws": "# Optimized CDK code...",
    "azure": "# Optimized Bicep code...",
    "gcp": "# Optimized Terraform code..."
  },
  "metadata": {
    "generatedAt": "2024-01-01T00:00:00Z",
    "processingTime": 3500,
    "agentEnhanced": true,
    "agentsUsed": ["WorkloadAnalyzer", "StorageDesigner", "IaCPlanner", "IaCGenerator", "IaCOptimizer"],
    "optimizations": ["Cost reduced by 15%", "Performance improved by 25%"]
  }
}
```

#### `intelligent_import`
Uses AI-enhanced import from existing IaC (Terraform, Pulumi, CloudFormation).

**Parameters:**
- `source_file`: Path to source IaC file
- `source_type`: IaC type (terraform, pulumi, cloudformation)
- `target_providers`: Array of target cloud providers

**Response:**
```json
{
  "chiralConfig": {
    "projectName": "imported-project",
    "k8s": {...},
    "postgres": {...},
    "adfs": {...}
  },
  "metadata": {
    "confidence": 0.95,
    "mappings": ["EC2 -> EKS nodes", "RDS -> PostgreSQL"],
    "warnings": ["Some resource properties may need manual review"]
  }
}
```

### 🔒 Security & Compliance Skills

#### `security_assessment`
Performs comprehensive security assessment against multiple frameworks.

**Parameters:**
- `config`: ChiralSystem configuration object
- `frameworks`: Security frameworks (ISO27001, SOC2, NIST, CIS)
- `severity_threshold`: Minimum severity level to report

**Response:**
```json
{
  "compliant": false,
  "violations": [
    {
      "framework": "ISO27001",
      "control": "A.9.4.1",
      "severity": "high",
      "description": "Encryption not enabled for data at rest"
    }
  ],
  "remediations": ["Enable AES-256 encryption for PostgreSQL"]
}
```

#### `privacy_impact_analysis`
Conducts privacy impact assessment for data processing components.

**Parameters:**
- `config`: ChiralSystem configuration object
- `data_classification`: Data sensitivity level (public, internal, confidential, restricted)
- `jurisdictions`: Applicable privacy jurisdictions (GDPR, CCPA, etc.)

**Response:**
```json
{
  "piaRequired": true,
  "risks": [
    {
      "category": "data_processing",
      "impact": "high",
      "description": "Cross-border data transfer without adequate safeguards"
    }
  ],
  "mitigations": ["Implement data residency controls", "Add encryption in transit"]
}
```

## Cloud Agent Integration

### AWS Q/Bedrock Integration

Chiral skills are exposed as Amazon Q Business skills:

```json
{
  "skill": {
    "name": "chiral_infrastructure_generation",
    "description": "Generate multi-cloud infrastructure as code",
    "parameters": {
      "config": {"type": "object", "description": "Chiral configuration"},
      "providers": {"type": "array", "items": {"enum": ["aws", "azure", "gcp"]}}
    },
    "handler": "arn:aws:lambda:us-east-1:123456789012:function:chiral-skill-handler"
  }
}
```

### Azure AI Integration

Skills are registered with Azure OpenAI assistants:

```json
{
  "assistant": {
    "name": "Chiral Infrastructure Assistant",
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "generate_infrastructure",
          "description": "Generate IaC from Chiral intent",
          "parameters": {...}
        }
      }
    ]
  }
}
```

### GCP Vertex AI Integration

Chiral capabilities are exposed as Vertex AI extensions:

```json
{
  "extension": {
    "name": "chiral-iac-generator",
    "description": "Multi-cloud infrastructure generation",
    "operations": [
      {
        "name": "generate",
        "description": "Generate IaC artifacts",
        "parameters": {...}
      }
    ]
  }
}
```

## Agent Communication Protocol

Chiral agents communicate using a standardized message format:

```typescript
interface AgentMessage {
  from: string;        // Sending agent name
  to: string;          // Target agent name
  type: 'analysis' | 'design' | 'plan' | 'generation' | 'optimization' | 'feedback';
  payload: any;        // Message-specific data
  timestamp: number;   // Unix timestamp
}
```

## Best Practices

1. **Fallback Strategy**: Always maintain deterministic fallbacks when agent services are unavailable
2. **Cost Optimization**: Cache agent responses and use batch processing to minimize API costs
3. **Security**: Validate all agent inputs against Chiral schemas to prevent injection attacks
4. **Monitoring**: Log agent interactions for debugging and optimization
5. **Versioning**: Pin cloud SDK versions to ensure predictable behavior

## Error Handling

All skills return standardized error responses:

```json
{
  "error": {
    "code": "AGENT_UNAVAILABLE",
    "message": "Cloud agent service temporarily unavailable",
    "fallback": "Deterministic generation will be used"
  }
}
```
