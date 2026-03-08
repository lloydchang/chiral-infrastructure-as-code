# Chiral Pattern Integration with Local Emulators

This document explains how to integrate local cloud emulators with the Chiral infrastructure translation layer, enabling end-to-end local testing of multi-cloud infrastructure artifacts.

## Chiral Overview

Chiral is a translation layer that generates native infrastructure artifacts (CDK, Bicep, Terraform) from a single TypeScript intent. Local emulators enable testing these artifacts without cloud deployment.

## Validation Strategies

### AWS CDK Validation

#### CDK-NAG (Security & Compliance)
CDK-NAG scans CDK constructs for security violations.

```typescript
import { Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';

const app = new App();
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
```

#### Snapshot Testing
Test CloudFormation template generation.

```typescript
test('S3 Bucket created with Encryption', () => {
  const app = new App();
  const stack = new MyStack(app, 'TestStack');
  expect(Template.fromStack(stack)).toMatchSnapshot();
});
```

#### LocalStack Integration
Deploy CDK-generated templates to LocalStack.

```yaml
# GitHub Actions
- name: Start LocalStack
  run: docker run -d -p 4566:4566 localstack/localstack

- name: Validate AWS CDK
  run: |
    cd dist/aws
    export AWS_ENDPOINT_URL=http://localhost:4566
    cdk synth --strict
```

### Azure Bicep Validation

#### Bicep Linter Configuration
Enforce best practices via `bicepconfig.json`.

```json
{
  "analyzers": {
    "core": {
      "enabled": true,
      "rules": {
        "adminusername-should-not-be-literal": { "level": "error" },
        "no-hardcoded-env-urls": { "level": "error" },
        "secure-parameter-default": { "level": "error" }
      }
    }
  }
}
```

#### AzLocal for Bicep Testing
Use LocalStack's Azure extension for Bicep validation.

```bash
pip install azlocal
localstack start -d
azlocal start-interception
az deployment group create --resource-group chiral-local-test --template-file ./dist/azure/main.bicep
```

#### Dynamic BicepConfig Generation
Automate configuration injection in CI/CD.

```javascript
// scripts/setup-bicep.js
const fs = require('fs');
const path = require('path');

const config = {
  analyzers: {
    core: {
      enabled: true,
      rules: {
        "adminusername-should-not-be-literal": { "level": "error" },
        "no-hardcoded-env-urls": { "level": "error" }
      }
    }
  }
};

const targetDir = path.join(__dirname, '../dist/azure');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(
  path.join(targetDir, 'bicepconfig.json'),
  JSON.stringify(config, null, 2)
);
```

### GCP Terraform Validation

#### Policy Controller with Gator
Use OPA Gatekeeper for policy-as-code validation.

```bash
# Install tools
go install github.com/open-policy-agent/gatekeeper/gator@latest

# Test policies
terraform plan -out=tfplan.binary
terraform show -json tfplan.binary > tfplan.json
gator test -f tfplan.json policies/
```

#### Rego Policy Example
Enforce security rules across clouds.

```rego
package chiral.security

# Deny public storage access
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_s3_bucket_public_access_block"
    resource.change.after.block_public_policy == false
    msg := sprintf("S3 Bucket %s must have BlockPublicPolicy enabled!", [resource.address])
}

deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "Microsoft.Storage/storageAccounts"
    resource.change.after.allowBlobPublicAccess == true
    msg := sprintf("Azure Storage Account %s must have allowBlobPublicAccess disabled!", [resource.address])
}
```

## Unified Policy-as-Code with OPA

Transition from cloud-specific linting to unified OPA/Gator.

### Comparison of Tools

| Feature | cdk-nag (AWS) | Bicep Linter (Azure) | Gator / OPA (Cross-Cloud) |
|---------|---------------|----------------------|--------------------------|
| Primary Focus | AWS Construct Tree | ARM/Bicep Templates | Policy-as-Code (Any JSON/YAML) |
| Logic Language | TypeScript / Aspects | Native Bicep Rules | Rego (Declarative) |
| Scope | AWS-specific | Azure-specific | Unified/Universal |
| Dev Loop | cdk synth | az bicep build | gator test |

### Implementation Strategy

1. **Define Policies in Rego**: Store in `policies/` directory
2. **Convert Artifacts**: Transform CDK/Bicep output to JSON
3. **Validate with Gator**: Run `gator test` in CI/CD pipeline

```yaml
- name: Run Unified Policy Checks
  run: gator test --filename=dist/aws/ --filename=dist/azure/ --filename=policies/
```

## CI/CD Workflows

### GitHub Actions Template

```yaml
name: Chiral Infrastructure Validation
on: [push, pull_request]

jobs:
  validate-chiral-artifacts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Setup AWS LocalStack
      - name: Start LocalStack
        run: docker run -d -p 4566:4566 localstack/localstack

      # Setup Azure AzLocal
      - name: Install AzLocal
        run: pip install azlocal

      # Setup GCP Gator
      - name: Install Gator
        run: go install github.com/open-policy-agent/gatekeeper/gator@latest

      # Generate Chiral Artifacts
      - name: Generate Artifacts
        run: npm run build

      # Validate AWS
      - name: Validate AWS CDK
        run: |
          cd dist/aws
          export AWS_ENDPOINT_URL=http://localhost:4566
          cdk synth --strict

      # Validate Azure
      - name: Validate Azure Bicep
        run: |
          cd dist/azure
          azlocal start-interception
          az deployment group validate --resource-group test-rg --template-file main.bicep

      # Validate GCP
      - name: Validate GCP Policies
        run: gator test -f dist/gcp/ policies/
```

### VS Code Integration

#### Real-time Linting Setup

**Azure Bicep**:
- Install Bicep extension
- Place `bicepconfig.json` in root
- Automatic validation as you type

**AWS CDK**:
- Install CDK NAG Validator extension
- Add Aspects to `bin/app.ts`
- Real-time violation highlighting

## Contract Testing

### Blob Storage Interface Consistency

Use emulators to ensure Chiral-generated interfaces behave consistently.

```typescript
// Test AWS S3 vs Azure Blob parity
test('Storage interface consistency', async () => {
  const awsClient = new S3Client({ endpoint: 'http://localhost:4566' });
  const azureClient = new BlobServiceClient('UseDevelopmentStorage=true');

  // Upload file via Chiral AWS interface
  await awsClient.send(new PutObjectCommand({ Bucket: 'test', Key: 'file.txt', Body: 'data' }));

  // Verify via Chiral Azure interface
  const containerClient = azureClient.getContainerClient('test');
  const blobClient = containerClient.getBlockBlobClient('file.txt');
  const downloadResponse = await blobClient.download();
  expect(await streamToString(downloadResponse.readableStreamBody!)).toBe('data');
});
```

## State Consistency

### Cloud Pods (LocalStack)
Snapshot and share LocalStack state for team consistency.

```bash
# Save state
localstack pod save my-pod

# Load state
localstack pod load my-pod
```

### Emulator Orchestration

Use Docker Compose for multi-emulator environments.

```yaml
version: '3.8'
services:
  localstack:
    image: localstack/localstack
    ports:
      - "4566:4566"

  azurite:
    image: mcr.microsoft.com/azure-storage/azurite
    ports:
      - "10000:10000"
      - "10001:10001"
      - "10002:10002"

  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
```

## Best Practices

### Fail-Fast Approach
1. **Generate Artifacts**: Chiral creates CDK/Bicep/Terraform
2. **Static Validation**: Run linters before emulators
3. **Emulator Testing**: Deploy to local environments
4. **Policy Checking**: Final OPA/Gator validation

### Environment Management
- Use unique ports for each emulator
- Clean up resources between test runs
- Avoid zombie containers in CI/CD

### Hybrid Testing
- Use emulators for functional testing
- Reserve real cloud for integration/complex scenarios
- Balance cost vs. fidelity

## Troubleshooting

### Common Issues

**LocalStack API Key**: As of 2026, requires account login for free tier.

**AzLocal Limitations**: Metadata validation, not full functional simulation.

**Gator Compatibility**: Ensure JSON/YAML formats match policy expectations.

**Port Conflicts**: Configure unique ports for each emulator service.

### Performance Considerations

- LocalStack can be RAM-intensive
- Cosmos DB emulator is resource-heavy
- Firebase Suite provides best performance for Firebase apps

## Future Integration

- **Enhanced LocalStack Azure**: More services and better fidelity
- **Unified GCP Emulator**: Single-container GCP simulation
- **Cross-Cloud Policy Engine**: Native multi-cloud policy support
- **Chiral IDE Plugins**: Real-time validation in development

This integration enables the Chiral pattern to provide confidence in multi-cloud deployments through comprehensive local testing and validation.
