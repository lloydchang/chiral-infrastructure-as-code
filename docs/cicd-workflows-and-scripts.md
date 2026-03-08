# CI/CD Workflows and Automation Scripts

This document provides practical examples of CI/CD workflows and automation scripts for integrating cloud local emulators with the Chiral infrastructure validation pipeline.

## GitHub Actions Workflow Template

Complete workflow for validating Chiral-generated artifacts across all clouds.

```yaml
name: Chiral Infrastructure Validation
on: [push, pull_request]

jobs:
  validate-chiral-artifacts:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      # 1. Setup LocalStack for AWS
      - name: Start LocalStack
        run: |
          docker run -d -p 4566:4566 localstack/localstack
          sleep 10

      # 2. Setup AzLocal for Azure
      - name: Install AzLocal
        run: pip install azlocal

      # 3. Setup Gator for GCP
      - name: Install Gator
        run: go install github.com/open-policy-agent/gatekeeper/gator@latest

      # 4. Generate Chiral Artifacts
      - name: Build Chiral Artifacts
        run: |
          npm install
          npm run build

      # 5. Inject Bicep Configuration
      - name: Inject Bicep Config
        run: node scripts/setup-bicep.js

      # 6. Validate AWS (CDK)
      - name: Validate AWS CDK
        run: |
          cd dist/aws
          export AWS_ENDPOINT_URL=http://localhost:4566
          cdk synth --strict

      # 7. Validate Azure (Bicep)
      - name: Validate Azure Bicep
        run: |
          cd dist/azure
          azlocal start-interception
          az deployment group validate --resource-group test-rg --template-file main.bicep

      # 8. Validate GCP (Policies)
      - name: Validate GCP Policies
        run: gator test -f dist/gcp/ policies/

      # 9. Run Integration Tests
      - name: Run Emulator Integration Tests
        run: npm test
        env:
          AWS_ENDPOINT_URL: http://localhost:4566
          AZURITE_CONNECTION_STRING: DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==
          FIRESTORE_EMULATOR_HOST: localhost:8080
```

## Automation Scripts

### Bicep Configuration Setup Script

```javascript
// scripts/setup-bicep.js
const fs = require('fs');
const path = require('path');

const config = {
  analyzers: {
    core: {
      enabled: true,
      verbose: false,
      rules: {
        "adminusername-should-not-be-literal": { "level": "error" },
        "no-hardcoded-env-urls": { "level": "error" },
        "no-unused-params": { "level": "warning" },
        "no-unused-vars": { "level": "warning" },
        "outputs-should-not-contain-secrets": { "level": "error" },
        "prefer-interpolation": { "level": "warning" },
        "secure-parameter-default": { "level": "error" },
        "use-recent-api-versions": {
          "level": "warning",
          "maxAllowedAgeInDays": 730
        }
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

console.log("Successfully injected bicepconfig.json into artifact directory.");
```

### Unified Validation Script

```bash
#!/bin/bash
# scripts/validate-all.sh

set -e

echo "Starting Chiral Infrastructure Validation..."

# Generate artifacts
npm run build

# AWS Validation
echo "Validating AWS CDK..."
docker run -d --name localstack -p 4566:4566 localstack/localstack
sleep 15
export AWS_ENDPOINT_URL=http://localhost:4566
cd dist/aws
cdk synth --strict
cd ../..

# Azure Validation
echo "Validating Azure Bicep..."
pip install azlocal
localstack start -d
sleep 10
azlocal start-interception
cd dist/azure
az deployment group validate --resource-group test-rg --template-file main.bicep
cd ../..

# GCP Validation
echo "Validating GCP Policies..."
go install github.com/open-policy-agent/gatekeeper/gator@latest
gator test -f dist/gcp/ policies/

# Integration Tests
echo "Running integration tests..."
npm test

echo "All validations passed! ✅"
```

### Docker Compose for Local Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  # AWS LocalStack
  localstack:
    image: localstack/localstack:3.0
    ports:
      - "4566:4566"
    environment:
      - SERVICES=lambda,dynamodb,s3,sqs,sns,apigateway,cloudformation
      - DEBUG=1
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"

  # Azure Azurite
  azurite:
    image: mcr.microsoft.com/azure-storage/azurite:latest
    ports:
      - "10000:10000"  # Blob
      - "10001:10001"  # Queue
      - "10002:10002"  # Table
    volumes:
      - azurite-data:/data

  # Generic PostgreSQL for database testing
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: chiral_test
      POSTGRES_USER: chiral
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  # Redis for caching/state
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  azurite-data:
  postgres-data:
```

### Environment Configuration Script

```bash
#!/bin/bash
# scripts/setup-env.sh

# AWS LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

# Azure Azurite
export AZURITE_CONNECTION_STRING="DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;"

# GCP Firestore
export FIRESTORE_EMULATOR_HOST=localhost:8080

# GCP Pub/Sub
export PUBSUB_EMULATOR_HOST=localhost:8085

# PostgreSQL
export DATABASE_URL="postgresql://chiral:password@localhost:5432/chiral_test"

echo "Environment variables set for local development"
```

## VS Code Configuration

### settings.json for Real-time Validation

```json
{
  "bicep.trace.server": "verbose",
  "cdk.enableAutoValidation": true,
  "cdk-nag.enabled": true,
  "cdk-nag.verbose": true,
  "[bicep]": {
    "editor.defaultFormatter": "ms-azuretools.vscode-bicep"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### Launch Configuration for Debugging

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Chiral Build",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/dist/index.js",
      "preLaunchTask": "npm: build",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    },
    {
      "name": "Debug CDK Synth",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/cdk",
      "args": ["synth"],
      "cwd": "${workspaceFolder}/dist/aws",
      "env": {
        "AWS_ENDPOINT_URL": "http://localhost:4566"
      }
    }
  ]
}
```

## Package.json Scripts

```json
{
  "scripts": {
    "build": "tsc && npm run generate-artifacts",
    "generate-artifacts": "node dist/index.js",
    "validate:aws": "cd dist/aws && cdk synth",
    "validate:azure": "cd dist/azure && az bicep build --file main.bicep",
    "validate:gcp": "gator test -f dist/gcp/ policies/",
    "validate:all": "npm run validate:aws && npm run validate:azure && npm run validate:gcp",
    "test": "jest",
    "test:emulators": "docker-compose up -d && npm run setup-env && npm test",
    "clean": "docker-compose down -v && rm -rf dist/"
  }
}
```

## OPA Policy Examples

### Storage Security Policy

```rego
# policies/storage-security.rego
package chiral.security

# Deny if S3 bucket has 'BlockPublicAccess' disabled
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_s3_bucket_public_access_block"
    resource.change.after.block_public_policy == false
    msg := sprintf("S3 Bucket %s must have BlockPublicPolicy enabled!", [resource.address])
}

# Deny if Azure storage account allows public blob access
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "Microsoft.Storage/storageAccounts"
    resource.change.after.allowBlobPublicAccess == true
    msg := sprintf("Azure Storage Account %s must have allowBlobPublicAccess disabled!", [resource.address])
}

# Deny if GCS bucket has uniform bucket level access disabled
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "google_storage_bucket"
    resource.change.after.uniform_bucket_level_access == false
    msg := sprintf("GCS Bucket %s must have uniform bucket level access enabled!", [resource.address])
}
```

### Test Suite for Policies

```yaml
# tests/test-suite.yaml
kind: Suite
apiVersion: test.gatekeeper.sh/v1alpha1
tests:
  - name: public-storage-denied
    template: policies/storage-security.rego
    cases:
      - name: invalid-public-s3
        object: resources/bad-s3.json
        assertions:
          - violations: yes
      - name: valid-private-s3
        object: resources/good-s3.json
        assertions:
          - violations: no
```

## Monitoring and Logging

### Emulator Health Checks

```bash
#!/bin/bash
# scripts/health-check.sh

# LocalStack
if curl -s http://localhost:4566/_localstack/health | grep -q '"dynamodb": "available"'; then
  echo "✅ LocalStack healthy"
else
  echo "❌ LocalStack unhealthy"
  exit 1
fi

# Azurite
if curl -s http://localhost:10000/devstoreaccount1 | grep -q "Azurite"; then
  echo "✅ Azurite healthy"
else
  echo "❌ Azurite unhealthy"
  exit 1
fi

# PostgreSQL
if pg_isready -h localhost -p 5432 -U chiral; then
  echo "✅ PostgreSQL healthy"
else
  echo "❌ PostgreSQL unhealthy"
  exit 1
fi
```

### Log Aggregation

```yaml
# docker-compose.override.yml for logging
version: '3.8'
services:
  localstack:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  azurite:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Performance Optimization

### LocalStack Configuration

```bash
# docker run with optimized settings
docker run -d \
  --name localstack \
  -p 4566:4566 \
  -e SERVICES=lambda,dynamodb,s3 \
  -e DEBUG=0 \
  -e PERSISTENCE=1 \
  -e LAMBDA_EXECUTOR=docker-reuse \
  -v "/tmp/localstack:/tmp/localstack" \
  localstack/localstack:3.0
```

### Resource Management

```bash
#!/bin/bash
# scripts/cleanup.sh

# Stop all emulators
docker-compose down -v

# Remove orphaned containers
docker system prune -f

# Clean up generated files
rm -rf dist/
rm -rf .cdk.out/

echo "Cleanup complete"
```

## Troubleshooting Guide

### Common Issues

1. **Port Conflicts**: Change default ports in docker-compose.yml
2. **Memory Issues**: Reduce LocalStack services or increase Docker memory
3. **Authentication**: Use development keys for local testing
4. **Timing**: Add sleep commands after emulator startup
5. **Cleanup**: Always run cleanup script between test runs

### Debug Commands

```bash
# LocalStack logs
docker logs localstack

# Azurite debug
docker run -it --rm -p 10000:10000 mcr.microsoft.com/azure-storage/azurite azurite --debug

# Gator verbose output
gator test -f dist/ policies/ --verbose
```

This comprehensive setup enables robust local testing and validation of Chiral-generated infrastructure across AWS, Azure, and GCP using their respective local emulators and policy engines.
