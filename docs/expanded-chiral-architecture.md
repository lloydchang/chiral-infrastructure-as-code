# Expanded Chiral Architecture: Emulators and Simulators

## Overview

This document outlines the deep expansion of the Chiral infrastructure translation layer to support local emulators and simulators for AWS, Azure, and GCP, enabling comprehensive local development and testing workflows.

## Current Architecture

The existing Chiral system supports bidirectional translation between:
- **Local** (Docker Compose, local Kubernetes)
- **AWS** (CDK, CloudFormation)
- **Azure** (Bicep, ARM templates)
- **GCP** (Terraform)

## Expanded Provider Matrix

The expanded architecture adds emulator and simulator variants for each cloud provider:

### Production Providers
- `local`: Native local deployment artifacts
- `aws`: AWS production (CDK/CloudFormation)
- `azure`: Azure production (Bicep/ARM)
- `gcp`: GCP production (Terraform)

### Local Emulators
Full-service simulation environments:
- `aws-local-emulator`: LocalStack (complete AWS service emulation)
- `azure-local-emulator`: Azurite + Functions Core Tools + Cosmos DB Emulator
- `gcp-local-emulator`: Firebase Emulator Suite + gcloud emulators

### Local Simulators
Partial/tool-based simulation:
- `aws-local-simulator`: SAM CLI + Moto (function/API simulation)
- `azure-local-simulator`: azlocal (ARM template validation)
- `gcp-local-simulator`: Gator + Policy Controller (policy validation)

## Provider Classification

| Category | Purpose | Fidelity | Setup Complexity | Use Case |
|----------|---------|----------|------------------|----------|
| Production | Cloud deployment | 100% | High | Production environments |
| Emulator | Full local simulation | 90-95% | Medium | Integration testing |
| Simulator | Partial simulation | 50-80% | Low | Unit testing, validation |

## Bidirectional Translation Patterns

### Forward Translation (Local Intent → All Variants)

```typescript
// Start with ChiralSystem intent
const config: ChiralSystem = {
  kubernetes: { /* K8s config */ },
  postgresql: { /* DB config */ },
  adfs: { /* Identity config */ }
};

// Generate all provider variants
const artifacts = await chiral.generateAll(config, [
  'local',
  'aws', 'aws-local-emulator', 'aws-local-simulator',
  'azure', 'azure-local-emulator', 'azure-local-simulator',
  'gcp', 'gcp-local-emulator', 'gcp-local-simulator'
]);
```

### Reverse Translation (Any Variant → Local Intent)

```typescript
// Start with any provider artifact
const sourceArtifact = fs.readFileSync('existing-aws-stack.json', 'utf8');
const sourceProvider = 'aws'; // or any variant

// Reverse-engineer to ChiralSystem
const config = await chiral.reverseEngineer(sourceArtifact, sourceProvider);

// Generate other variants
const artifacts = await chiral.generateAll(config, [
  'local', 'azure', 'gcp',
  'azure-local-emulator', 'gcp-local-simulator'
]);
```

## Artifact Generation Rules

### Production Artifacts
- Standard cloud provider templates
- Production-ready configurations
- Full resource definitions

### Emulator Artifacts
- Modified templates with localhost endpoints
- Emulator-specific connection strings
- Container-based service references

### Simulator Artifacts
- Minimal templates for targeted testing
- Mock configurations
- Validation-focused artifacts

## Example: AWS Variants

### Production (`aws`)
```json
{
  "Resources": {
    "MyTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": "my-table"
      }
    }
  }
}
```

### Local Emulator (`aws-local-emulator`)
```json
{
  "Resources": {
    "MyTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": "my-table",
        "Endpoint": "http://localhost:4566"
      }
    }
  }
}
```

### Local Simulator (`aws-local-simulator`)
```yaml
# SAM template for function testing
Resources:
  MyFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: app.handler
      Runtime: nodejs18.x
      Events:
        Api:
          Type: Api
          Properties:
            Path: /test
            Method: get
```

## Adapter Architecture Extension

### Current Adapters
- `LocalAgentAdapter`: Generates local artifacts
- `AwsAgentAdapter`: Generates AWS artifacts
- `AzureAgentAdapter`: Generates Azure artifacts
- `GcpAgentAdapter`: Generates GCP artifacts

### Extended Adapters
Each adapter gains methods for emulator/simulator variants:

```typescript
class AwsAgentAdapter {
  async generateArtifacts(config: ChiralSystem): Promise<ArtifactResponse> {
    // Existing production logic
  }

  async generateLocalEmulatorArtifacts(config: ChiralSystem): Promise<ArtifactResponse> {
    // LocalStack-specific logic
  }

  async generateLocalSimulatorArtifacts(config: ChiralSystem): Promise<ArtifactResponse> {
    // SAM CLI + Moto logic
  }

  async reverseEngineer(artifact: string): Promise<ChiralSystem> {
    // Extract intent from AWS artifacts
  }
}
```

## Translation Engine Updates

### Forward Translation Logic
```typescript
async function translateToProvider(config: ChiralSystem, targetProvider: string): Promise<string> {
  const baseAdapter = getAdapterForProvider(targetProvider);

  switch (targetProvider) {
    case 'aws':
      return baseAdapter.generateArtifacts(config);
    case 'aws-local-emulator':
      return baseAdapter.generateLocalEmulatorArtifacts(config);
    case 'aws-local-simulator':
      return baseAdapter.generateLocalSimulatorArtifacts(config);
    // Similar for other providers
  }
}
```

### Reverse Translation Logic
```typescript
async function reverseTranslate(artifact: string, sourceProvider: string): Promise<ChiralSystem> {
  const adapter = getAdapterForProvider(sourceProvider);
  const normalizedArtifact = normalizeArtifactForReverse(artifact, sourceProvider);

  return adapter.reverseEngineer(normalizedArtifact);
}

function normalizeArtifactForReverse(artifact: string, provider: string): string {
  // Remove emulator-specific configurations
  // Convert localhost endpoints to production placeholders
  // Strip simulator-specific mocks
}
```

## Validation and Compliance

### Variant-Specific Validation
Different validation rules for different modes:

```typescript
const validators = {
  'aws': productionValidators,
  'aws-local-emulator': emulatorValidators,
  'aws-local-simulator': simulatorValidators
};

async function validateArtifact(artifact: string, provider: string): Promise<ValidationResult> {
  const validator = validators[provider];
  return validator.validate(artifact);
}
```

### Cross-Variant Consistency Checks
Ensure generated artifacts across variants are consistent:

```typescript
async function checkVariantConsistency(config: ChiralSystem): Promise<ConsistencyResult> {
  const variants = await generateAllVariants(config);

  // Check that all variants implement the same logical infrastructure
  // Validate that emulator/simulator artifacts can be converted to production
  // Ensure reverse engineering produces equivalent ChiralSystem
}
```

## Implementation Roadmap

### Phase 1: Core Expansion
1. Extend provider enum to include all variants
2. Add emulator/simulator methods to existing adapters
3. Implement basic forward translation for all variants

### Phase 2: Reverse Engineering
1. Implement reverse translation from production artifacts
2. Add reverse translation from emulator artifacts
3. Support reverse translation from simulator artifacts

### Phase 3: Advanced Features
1. Cross-variant validation
2. Artifact optimization for specific modes
3. Integration with local development workflows

## Usage Examples

### Development Workflow
```bash
# Generate all variants for local development
chiral compile -c config.ts -p local,aws-local-emulator,azure-local-emulator,gcp-local-emulator

# Test with emulators
docker-compose up localstack azurite firestore-emulator
npm test

# Deploy production
chiral compile -c config.ts -p aws,azure,gcp
terraform apply
```

### Migration Workflow
```bash
# Import existing AWS infrastructure
chiral import aws existing-stack.json -o config.ts

# Generate emulator versions for testing
chiral compile -c config.ts -p aws-local-emulator,azure-local-emulator

# Validate migration
chiral validate config.ts --variants aws-local-emulator,azure-local-emulator
```

## Benefits of Expanded Architecture

1. **Comprehensive Local Testing**: Test against full emulators before production deployment
2. **Incremental Development**: Start with simulators, graduate to full emulators
3. **Migration Support**: Import existing infrastructure and generate local test versions
4. **Cross-Platform Validation**: Ensure consistency across all provider variants
5. **Cost Optimization**: Extensive local testing reduces cloud costs

## Challenges and Considerations

1. **Complexity Management**: 10 provider variants require careful adapter design
2. **Artifact Consistency**: Ensure all variants implement the same infrastructure logic
3. **Reverse Engineering Accuracy**: Complex templates may lose information during reverse translation
4. **Performance**: Running multiple emulators simultaneously requires significant resources
5. **Maintenance**: Keeping emulator/simulator support up-to-date with provider changes

This expanded architecture positions Chiral as the most comprehensive infrastructure translation layer, supporting the full spectrum from local development to production deployment across all major cloud providers.
