# LocalStack for Azure

LocalStack for Azure addresses the "CDK vs. Bicep" gap by providing a unified local orchestration point. Instead of emulating just data services like Azurite, it emulates the Azure Resource Manager (ARM) layer itself.

## Direct Bicep Integration

The critical feature for Chiral is that LocalStack for Azure supports Bicep and ARM templates directly via azdlocal (part of the azlocal Python package).

### Workflow

Use existing Bicep files. Instead of `az deployment group create`, use `azdlocal up` or `azlocal`.

### Interception

It uses a "start_interception" mechanism. When active, it redirects Azure CLI (`az`) and Azure Developer CLI (`azd`) calls to the local container instead of `management.azure.com`.

### Validation

This allows verifying Bicep transpilations are syntactically and structurally sound without cloud provider validation.

## Supported Services (March 2026 Status)

While LocalStack for AWS is at 9.5/10, the Azure side is around 6.0/10 for general users, but purpose-built for core services:

- **Resource Groups**: Full lifecycle support.
- **Storage Accounts**: High fidelity (leverages S3-compatible backend for Blob storage).
- **App Service & Functions**: Support for local serverless logic execution.
- **Key Vault**: Basic secret/key management.

### Networking Note

It handles Virtual Network resources in the metadata layer, but does not simulate full kernel-level packet routing of an Azure VNet. For Chiral patterns, it confirms Bicep code correctness but won't "ping" between local subnets like a real VNet.

## Implementation for Chiral

To integrate into the Chiral local dev loop:

### Install the LocalStack Azure Extension

```bash
pip install azlocal
```

### Start the Local Environment

```bash
# Starts LocalStack container with Azure extension enabled
localstack start -d
```

### Deploy Bicep "Chiral" Artifact

```bash
# Redirects deployment to LocalStack
azlocal start-interception
az deployment group create --resource-group chiral-local-test --template-file ./dist/azure/main.bicep
```

## Why This Matters for Chiral

Chiral's value is a single source of truth generating native artifacts. LocalStack for Azure acts as the "Unit Test Runner" for your Bicep generator.

If your TypeScript intent produces a Bicep file that azlocal rejects, you've caught a translation logic bug in seconds rather than minutes. This maintains a "Fail Fast" loop for both AWS CDK and Azure Bicep branches of the Chiral pattern.
