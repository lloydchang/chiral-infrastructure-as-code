# Chiral Infrastructure as Code - Agent Skills

## Overview

Chiral exposes its core infrastructure generation capabilities as **agent skills** that can be invoked by cloud provider agent services (AWS Q/Bedrock, Azure AI, GCP Vertex AI). These skills enable agentic infrastructure management while preserving Chiral's deterministic core.

## Available Skills

### 🔧 Core Infrastructure Skills

#### `generate_infrastructure`
Generates multi-cloud IaC artifacts from a Chiral intent schema.

**Parameters:**
- `config`: ChiralSystem configuration object
- `providers`: Array of target cloud providers (aws, azure, gcp)
- `output_format`: IaC format (cdk, bicep, terraform)

**Response:**
```json
{
  "artifacts": {
    "aws": "# CDK code...",
    "azure": "# Bicep code...",
    "gcp": "# Terraform code..."
  },
  "metadata": {
    "generatedAt": "2024-01-01T00:00:00Z",
    "processingTime": 1500,
    "agentEnhanced": false
  }
}
```

#### `validate_configuration`
Validates a Chiral intent schema for correctness and compliance.

**Parameters:**
- `config`: ChiralSystem configuration object
- `frameworks`: Array of compliance frameworks to check

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": ["Consider enabling encryption"],
  "recommendations": ["Add backup retention policy"]
}
```

#### `analyze_cost`
Performs multi-cloud cost analysis and optimization recommendations.

**Parameters:**
- `config`: ChiralSystem configuration object
- `providers`: Array of providers to analyze
- `timeframe`: Analysis period (monthly, yearly)

**Response:**
```json
{
  "comparison": {
    "cheapest": {
      "provider": "aws",
      "cost": 125.50,
      "savings": 45.25
    },
    "estimates": {
      "aws": {"totalCost": 125.50, "breakdown": {...}},
      "azure": {"totalCost": 158.75, "breakdown": {...}},
      "gcp": {"totalCost": 142.30, "breakdown": {...}}
    }
  },
  "recommendations": ["Use reserved instances for 20% savings"]
}
```

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
