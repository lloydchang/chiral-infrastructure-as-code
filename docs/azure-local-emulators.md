# Azure Local Emulators Guide

This document provides detailed information about local development tools and emulators available for Microsoft Azure, including setup instructions, use cases, and integration patterns.

## Overview

Azure's local development ecosystem is fragmented compared to AWS's LocalStack. Microsoft provides several service-specific emulators rather than a single unified platform. However, emerging third-party tools like LocalStack for Azure are beginning to bridge this gap.

## Core Azure Emulators

### Azurite
Azurite is the primary local emulator for Azure Storage services.

#### Features
- Emulates Azure Blob Storage
- Emulates Azure Queue Storage
- Emulates Azure Table Storage
- REST API compatible with Azure Storage

#### Installation
```bash
# Via npm
npm install -g azurite

# Via Docker
docker run -p 10000:10000 -p 10001:10001 -p 10002:10002 mcr.microsoft.com/azure-storage/azurite
```

#### Usage
```bash
# Start Azurite
azurite

# Connection String (Development)
DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;
```

#### Use Cases
- Local development of applications using Azure Storage
- Unit testing storage operations
- Development without Azure subscription costs

### Azure Functions Core Tools
Official Microsoft tool for running Azure Functions locally.

#### Features
- Run Azure Functions locally
- Simulate HTTP, Queue, Timer, and other triggers
- Debug functions in VS Code
- Support for multiple languages (.NET, Node.js, Python, etc.)

#### Installation
```bash
# Install via npm
npm install -g azure-functions-core-tools@4 --unsafe-perm true

# Or via Chocolatey (Windows)
choco install azure-functions-core-tools
```

#### Usage
```bash
# Create new function app
func init MyFunctionApp

# Create new function
func new

# Run locally
func start
```

#### Configuration
- Uses `local.settings.json` for environment variables
- Supports connection to Azurite for storage triggers
- Can connect to real Azure services for testing

### Azure Cosmos DB Emulator
Local emulator for Azure Cosmos DB.

#### Features
- Emulates Cosmos DB API
- Supports SQL API, MongoDB API, Cassandra API, etc.
- Data Explorer web interface
- Certificate-based authentication

#### Installation
- Windows: Download from Azure portal
- Docker: `docker run -p 8081:8081 mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator`

#### Usage
```bash
# Start emulator (Windows)
Microsoft.Azure.Cosmos.Emulator.exe /NoFirewall

# Connection string
AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==
```

### Azure Service Bus Emulator
Local emulator for Azure Service Bus (2024 addition).

#### Features
- Emulates queues and topics
- REST API compatible
- Docker-based deployment

#### Installation
```bash
docker run -p 5672:5672 mcr.microsoft.com/azure-messaging/servicebus-emulator
```

### Azure Event Hubs Emulator
Local development tool for Azure Event Hubs.

#### Features
- Emulates Event Hubs namespace
- Supports AMQP and Kafka protocols
- Docker-based

## Emerging Third-Party Tools

### LocalStack for Azure
LocalStack has expanded to provide Azure service emulation.

#### Features
- Unified container like AWS LocalStack
- Supports Azure Resource Manager (ARM) templates
- Bicep template validation
- Service interception for CLI commands

#### Installation
```bash
pip install azlocal
```

#### Usage
```bash
# Start LocalStack with Azure extension
localstack start -d

# Intercept Azure CLI calls
azlocal start-interception

# Deploy Bicep template
az deployment group create --resource-group test-rg --template-file main.bicep
```

#### Supported Services (March 2026 Status)
- Resource Groups
- Storage Accounts
- App Service & Functions
- Key Vault (basic)

#### Limitations
- Metadata validation rather than full functional emulation
- Networking/VNet simulation limited
- No real database instances (PostgreSQL, etc.)

## Integration Patterns

### Multi-Cloud Development
For applications spanning multiple clouds, combine emulators:

```yaml
# docker-compose.yml example
version: '3.8'
services:
  azurite:
    image: mcr.microsoft.com/azure-storage/azurite
    ports:
      - "10000:10000"
      - "10001:10001"
      - "10002:10002"
  
  cosmos-emulator:
    image: mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator
    ports:
      - "8081:8081"
```

### Chiral Pattern Integration
For the Chiral translation layer:

1. Use Azurite for storage validation
2. Use azlocal for Bicep artifact validation
3. Combine with generic PostgreSQL for database testing
4. Use real Azure dev subscription for complex networking

### CI/CD Integration
```yaml
# GitHub Actions workflow
- name: Validate Bicep via AzLocal
  run: |
    cd dist/azure
    azlocal start-interception
    az deployment group validate --resource-group test-rg --template-file main.bicep
```

## Comparison with Other Clouds

| Feature | Azure | AWS (LocalStack) | GCP (Firebase) |
|---------|-------|------------------|----------------|
| Unified Tool | ❌ (Fragmented) | ✅ (LocalStack) | ❌ (Service-specific) |
| Storage | ✅ (Azurite) | ✅ (LocalStack) | ❌ (fake-gcs-server) |
| Functions | ✅ (Core Tools) | ✅ (LocalStack) | ✅ (Firebase Suite) |
| Databases | ✅ (Cosmos) | ✅ (LocalStack) | ✅ (Firestore/Spanner) |
| Ease of Setup | Medium | High | Moderate |

## Best Practices

1. **Use Azurite for Storage Development**: Best emulator for Blob/Queue/Table operations
2. **Combine Tools**: Use Azurite + Functions Core Tools + Cosmos for comprehensive local testing
3. **Watch for LocalStack Azure**: Emerging tool that may unify Azure local development
4. **Test in Real Azure**: For complex networking, IAM, and enterprise features
5. **Docker Compose**: Orchestrate multiple emulators for integration testing

## Troubleshooting

- **Azurite Connection Issues**: Ensure ports 10000-10002 are available
- **Functions Core Tools**: May require .NET runtime installation
- **Cosmos Emulator**: Heavy resource usage; consider Docker on Linux/Mac
- **azlocal**: Still maturing; expect limitations compared to AWS LocalStack
