# Implementation Guide: Adding Emulator/Simulator Support

This guide provides step-by-step instructions for extending Chiral adapters to support local emulators and simulators for AWS, Azure, and GCP.

## Prerequisites

- Existing Chiral adapter classes
- Understanding of emulator/simulator tools for each provider
- Knowledge of bidirectional translation patterns

## Step 1: Extend Provider Enum

Update the provider type definition to include all variants:

```typescript
// src/types/providers.ts
export type ProviderType =
  // Production providers
  | 'local'
  | 'aws'
  | 'azure'
  | 'gcp'
  // AWS variants
  | 'aws-local-emulator'
  | 'aws-local-simulator'
  // Azure variants
  | 'azure-local-emulator'
  | 'azure-local-simulator'
  // GCP variants
  | 'gcp-local-emulator'
  | 'gcp-local-simulator';
```

## Step 2: Extend Adapter Interfaces

Add new methods to the base adapter interface:

```typescript
// src/adapters/base-adapter.ts
export interface BaseAdapter {
  // Existing methods
  generateArtifacts(config: ChiralSystem): Promise<ArtifactResponse>;
  reverseEngineer(artifact: string): Promise<ChiralSystem>;

  // New emulator/simulator methods
  generateLocalEmulatorArtifacts?(config: ChiralSystem): Promise<ArtifactResponse>;
  generateLocalSimulatorArtifacts?(config: ChiralSystem): Promise<ArtifactResponse>;
  reverseEngineerEmulator?(artifact: string): Promise<ChiralSystem>;
  reverseEngineerSimulator?(artifact: string): Promise<ChiralSystem>;
}
```

## Step 3: Implement AWS Adapter Extensions

Extend the AWS adapter with LocalStack and SAM CLI support:

```typescript
// src/adapters/aws-agent.ts
export class AwsAgentAdapter implements BaseAdapter {
  // Existing production methods...

  async generateLocalEmulatorArtifacts(config: ChiralSystem): Promise<ArtifactResponse> {
    const startTime = Date.now();

    // Use LocalStack-specific CDK modifications
    const app = new cdk.App();
    const stack = new AwsCdkAdapter(app, 'LocalStackStack', {
      env: { account: '000000000000', region: 'us-east-1' }
    });

    // Apply LocalStack endpoint modifications
    this.applyLocalStackEndpoints(stack);

    const cloudFormation = app.synth().getStackByName('LocalStackStack').template;

    return {
      artifacts: { 'aws-local-emulator': JSON.stringify(cloudFormation, null, 2) },
      metadata: {
        generatedAt: new Date(),
        agentEnhanced: true,
        processingTime: Date.now() - startTime,
        mode: 'emulator'
      }
    };
  }

  async generateLocalSimulatorArtifacts(config: ChiralSystem): Promise<ArtifactResponse> {
    const startTime = Date.now();

    // Generate SAM template for function/API simulation
    const samTemplate = this.generateSamTemplate(config);

    return {
      artifacts: { 'aws-local-simulator': samTemplate },
      metadata: {
        generatedAt: new Date(),
        agentEnhanced: true,
        processingTime: Date.now() - startTime,
        mode: 'simulator'
      }
    };
  }

  private applyLocalStackEndpoints(stack: cdk.Stack): void {
    // Modify CDK constructs to use LocalStack endpoints
    // This requires custom CDK aspects or construct modifications
    Aspects.of(stack).add(new LocalStackEndpointAspect());
  }

  private generateSamTemplate(config: ChiralSystem): string {
    // Generate SAM YAML for serverless simulation
    return `
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Resources:
  HelloWorldFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: index.handler
      Runtime: nodejs18.x
      Events:
        HelloWorld:
          Type: Api
          Properties:
            Path: /hello
            Method: get
    `;
  }
}
```

## Step 4: Implement Azure Adapter Extensions

Extend the Azure adapter with Azurite and azlocal support:

```typescript
// src/adapters/azure-agent.ts
export class AzureAgentAdapter implements BaseAdapter {
  // Existing production methods...

  async generateLocalEmulatorArtifacts(config: ChiralSystem): Promise<ArtifactResponse> {
    const startTime = Date.now();

    // Generate Bicep with Azurite connection strings
    const bicepTemplate = await this.generateAzuriteBicep(config);

    return {
      artifacts: { 'azure-local-emulator': bicepTemplate },
      metadata: {
        generatedAt: new Date(),
        agentEnhanced: true,
        processingTime: Date.now() - startTime,
        mode: 'emulator'
      }
    };
  }

  async generateLocalSimulatorArtifacts(config: ChiralSystem): Promise<ArtifactResponse> {
    const startTime = Date.now();

    // Generate minimal Bicep for azlocal validation
    const minimalBicep = await this.generateMinimalBicep(config);

    return {
      artifacts: { 'azure-local-simulator': minimalBicep },
      metadata: {
        generatedAt: new Date(),
        agentEnhanced: true,
        processingTime: Date.now() - startTime,
        mode: 'simulator'
      }
    };
  }

  private async generateAzuriteBicep(config: ChiralSystem): Promise<string> {
    // Generate Bicep with Azurite-specific configurations
    const baseBicep = await this.generateAzureArtifacts(config);

    // Modify connection strings for Azurite
    return baseBicep.replace(
      /connectionString.*=.*'.*'/g,
      "connectionString = 'UseDevelopmentStorage=true'"
    );
  }

  private async generateMinimalBicep(config: ChiralSystem): Promise<string> {
    // Generate minimal Bicep for validation purposes only
    return `
param location string = 'East US'

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'teststorage${uniqueString(resourceGroup().id)}'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
}
    `;
  }
}
```

## Step 5: Implement GCP Adapter Extensions

Extend the GCP adapter with Firebase Suite and Gator support:

```typescript
// src/adapters/gcp-agent.ts
export class GcpAgentAdapter implements BaseAdapter {
  // Existing production methods...

  async generateLocalEmulatorArtifacts(config: ChiralSystem): Promise<ArtifactResponse> {
    const startTime = Date.now();

    // Generate Terraform with Firebase emulator configurations
    const terraformConfig = await this.generateFirebaseTerraform(config);

    return {
      artifacts: { 'gcp-local-emulator': terraformConfig },
      metadata: {
        generatedAt: new Date(),
        agentEnhanced: true,
        processingTime: Date.now() - startTime,
        mode: 'emulator'
      }
    };
  }

  async generateLocalSimulatorArtifacts(config: ChiralSystem): Promise<ArtifactResponse> {
    const startTime = Date.now();

    // Generate Rego policies for Gator validation
    const regoPolicies = this.generateRegoPolicies(config);

    return {
      artifacts: { 'gcp-local-simulator': regoPolicies },
      metadata: {
        generatedAt: new Date(),
        agentEnhanced: true,
        processingTime: Date.now() - startTime,
        mode: 'simulator'
      }
    };
  }

  private async generateFirebaseTerraform(config: ChiralSystem): Promise<string> {
    // Generate Terraform with Firebase emulator endpoints
    const baseTerraform = await this.generateGCPArtifacts(config);

    // Modify for Firebase emulator usage
    return baseTerraform.replace(
      /google_firestore_database/g,
      '# Using Firebase Emulator\n# google_firestore_database'
    );
  }

  private generateRegoPolicies(config: ChiralSystem): string {
    // Generate OPA Rego policies for policy validation
    return `
package chiral.security

deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "google_storage_bucket"
    resource.change.after.uniform_bucket_level_access == false
    msg := sprintf("GCS Bucket %s must have uniform bucket level access enabled!", [resource.address])
}
    `;
  }
}
```

## Step 6: Update Main Translation Engine

Modify the main translation logic to handle all variants:

```typescript
// src/main.ts
async function translateToProvider(config: ChiralSystem, provider: ProviderType): Promise<string> {
  const adapter = getAdapterForProvider(provider);

  switch (provider) {
    // Production providers
    case 'local':
      return adapter.generateArtifacts(config).then(r => r.artifacts.local);
    case 'aws':
      return adapter.generateArtifacts(config).then(r => r.artifacts.aws);
    case 'azure':
      return adapter.generateArtifacts(config).then(r => r.artifacts.azure);
    case 'gcp':
      return adapter.generateArtifacts(config).then(r => r.artifacts.gcp);

    // AWS variants
    case 'aws-local-emulator':
      return adapter.generateLocalEmulatorArtifacts(config).then(r => r.artifacts['aws-local-emulator']);
    case 'aws-local-simulator':
      return adapter.generateLocalSimulatorArtifacts(config).then(r => r.artifacts['aws-local-simulator']);

    // Azure variants
    case 'azure-local-emulator':
      return adapter.generateLocalEmulatorArtifacts(config).then(r => r.artifacts['azure-local-emulator']);
    case 'azure-local-simulator':
      return adapter.generateLocalSimulatorArtifacts(config).then(r => r.artifacts['azure-local-simulator']);

    // GCP variants
    case 'gcp-local-emulator':
      return adapter.generateLocalEmulatorArtifacts(config).then(r => r.artifacts['gcp-local-emulator']);
    case 'gcp-local-simulator':
      return adapter.generateLocalSimulatorArtifacts(config).then(r => r.artifacts['gcp-local-simulator']);
  }
}
```

## Step 7: Implement Reverse Translation

Add reverse engineering capabilities:

```typescript
// src/reverse-engineer.ts
export async function reverseEngineerArtifact(artifact: string, provider: ProviderType): Promise<ChiralSystem> {
  const adapter = getAdapterForProvider(provider);

  // Normalize artifact for reverse engineering
  const normalizedArtifact = normalizeForReverseEngineering(artifact, provider);

  switch (provider) {
    case 'aws':
    case 'aws-local-emulator':
    case 'aws-local-simulator':
      return adapter.reverseEngineer(normalizedArtifact);

    case 'azure':
    case 'azure-local-emulator':
    case 'azure-local-simulator':
      return adapter.reverseEngineer(normalizedArtifact);

    case 'gcp':
    case 'gcp-local-emulator':
    case 'gcp-local-simulator':
      return adapter.reverseEngineer(normalizedArtifact);

    case 'local':
      return adapter.reverseEngineer(normalizedArtifact);
  }
}

function normalizeForReverseEngineering(artifact: string, provider: ProviderType): string {
  switch (provider) {
    case 'aws-local-emulator':
      // Remove LocalStack-specific endpoints
      return artifact.replace(/"Endpoint":\s*"http:\/\/localhost:\d+"/g, '');
    case 'azure-local-emulator':
      // Convert Azurite connection strings back to production format
      return artifact.replace(/UseDevelopmentStorage=true/g, "'production-connection-string'");
    case 'aws-local-simulator':
    case 'azure-local-simulator':
    case 'gcp-local-simulator':
      // Simulators are minimal, may need special handling
      return artifact;
    default:
      return artifact;
  }
}
```

## Step 8: Update CLI Commands

Extend the CLI to support all provider variants:

```typescript
// src/cli/core-commands.ts
coreCmd
  .command('compile')
  .description('Generate infrastructure artifacts for all provider variants')
  .requiredOption('-c, --config <path>', 'Path to Chiral configuration file')
  .option('-o, --output <path>', 'Output directory', 'dist')
  .option('-p, --providers <providers>', 'Comma-separated provider list', 'local,aws,azure,gcp')
  .action(async (options) => {
    const providers = options.providers.split(',').map((p: string) => p.trim());
    // Generate artifacts for all specified providers
    const artifacts = await generateAllVariants(config, providers);
    // Save artifacts to appropriate directories
  });
```

## Step 9: Add Validation for Variants

Implement variant-specific validation:

```typescript
// src/validation/variant-validators.ts
export const variantValidators: Record<ProviderType, ValidationRule[]> = {
  'aws': productionAwsValidators,
  'aws-local-emulator': localStackValidators,
  'aws-local-simulator': samValidators,
  'azure': productionAzureValidators,
  'azure-local-emulator': azuriteValidators,
  'azure-local-simulator': azlocalValidators,
  'gcp': productionGcpValidators,
  'gcp-local-emulator': firebaseValidators,
  'gcp-local-simulator': gatorValidators,
  'local': localValidators
};
```

## Step 10: Update Tests

Add tests for all new adapter methods:

```typescript
// src/__tests__/adapters/aws-agent.test.ts
describe('AwsAgentAdapter', () => {
  describe('generateLocalEmulatorArtifacts', () => {
    it('should generate LocalStack-compatible CloudFormation', async () => {
      const config = createTestConfig();
      const adapter = new AwsAgentAdapter();
      const result = await adapter.generateLocalEmulatorArtifacts(config);

      expect(result.artifacts['aws-local-emulator']).toContain('localhost:4566');
      expect(result.metadata.mode).toBe('emulator');
    });
  });

  describe('generateLocalSimulatorArtifacts', () => {
    it('should generate SAM template', async () => {
      const config = createTestConfig();
      const adapter = new AwsAgentAdapter();
      const result = await adapter.generateLocalSimulatorArtifacts(config);

      expect(result.artifacts['aws-local-simulator']).toContain('AWS::Serverless::Function');
      expect(result.metadata.mode).toBe('simulator');
    });
  });
});
```

## Step 11: Update Documentation

Generate artifact examples for each variant:

```typescript
// scripts/generate-examples.ts
async function generateExamples() {
  const config = createExampleConfig();

  const variants = [
    'local', 'aws', 'aws-local-emulator', 'aws-local-simulator',
    'azure', 'azure-local-emulator', 'azure-local-simulator',
    'gcp', 'gcp-local-emulator', 'gcp-local-simulator'
  ];

  for (const variant of variants) {
    const artifact = await translateToProvider(config, variant as ProviderType);
    fs.writeFileSync(`docs/examples/${variant}.txt`, artifact);
  }
}
```

## Step 12: Integration Testing

Add integration tests that verify bidirectional translation:

```typescript
// src/__tests__/integration/bidirectional.test.ts
describe('Bidirectional Translation', () => {
  const testConfig = createTestConfig();

  it('should maintain consistency through round-trip translation', async () => {
    // Forward: config -> aws artifact
    const awsArtifact = await translateToProvider(testConfig, 'aws');

    // Reverse: aws artifact -> config
    const reversedConfig = await reverseEngineerArtifact(awsArtifact, 'aws');

    // Forward again: reversed config -> azure artifact
    const azureArtifact = await translateToProvider(reversedConfig, 'azure');

    // Verify the azure artifact contains expected resources
    expect(azureArtifact).toContain('Microsoft.Storage/storageAccounts');
  });
});
```

## Deployment Checklist

- [ ] Extend provider enums and types
- [ ] Add new adapter methods
- [ ] Implement emulator/simulator logic
- [ ] Update translation engine
- [ ] Add reverse engineering
- [ ] Update CLI commands
- [ ] Add variant validation
- [ ] Write comprehensive tests
- [ ] Update documentation
- [ ] Generate examples

## Testing Checklist

- [ ] Unit tests for all new adapter methods
- [ ] Integration tests for bidirectional translation
- [ ] Validation tests for all variants
- [ ] Performance tests with emulators running
- [ ] Cross-variant consistency tests

This implementation guide provides a complete roadmap for extending Chiral to support the full spectrum of local development tools across AWS, Azure, and GCP.
