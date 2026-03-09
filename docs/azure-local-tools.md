# Azure Local Development Tools

This document covers local development tools for Microsoft Azure, including storage and database emulators, function simulators, and emerging unified platforms. These tools integrate with the expanded Chiral translation system for seamless Azure development.

## Tool Categories

### Emulators
Full Azure service simulation with API compatibility.

### Simulators
Lightweight tools for specific Azure component testing.

## Azurite (Azure Storage Emulator)

Azurite is the primary local emulator for Azure Storage services, providing API-compatible simulation of Blob, Queue, and Table storage.

### Features
- **Blob Storage**: Complete blob operations (upload, download, copy, delete)
- **Queue Storage**: Message queuing with full API support
- **Table Storage**: NoSQL table operations
- **REST API Compatibility**: Drop-in replacement for Azure Storage
- **Development Account**: Pre-configured development storage account
- **Docker Support**: Containerized deployment

### Installation
```bash
# Via npm
npm install -g azurite

# Via Docker
docker run -p 10000:10000 -p 10001:10001 -p 10002:10002 mcr.microsoft.com/azure-storage/azurite
```

### Usage
```bash
# Start Azurite
azurite

# Connection String (Development)
DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;
```

### Use Cases
- Storage-centric application development
- Azure Storage SDK testing
- Queue-based workflow development
- Development without Azure subscription

### Chiral Integration
```bash
# Export to Azurite
chiral export azure-emulator --tool azurite --connection-string "DefaultEndpointsProtocol=..."

# Import from Azurite configuration
chiral import azure-emulator --config azurite-config.json

# Validate Azurite setup
chiral validate azure-emulator --services blob,queue,table
```

## Azure Functions Core Tools (Simulator)

Official Microsoft tool for running Azure Functions locally with full runtime simulation.

### Features
- **Full Runtime**: Complete Azure Functions runtime locally
- **Multi-Language**: .NET, Node.js, Python, Java, PowerShell support
- **Trigger Simulation**: HTTP, Queue, Timer, Blob, Event Grid triggers
- **Binding Support**: Input/output bindings work locally
- **Debugging**: VS Code integration with breakpoints
- **Hot Reload**: Automatic function reloading on changes

### Installation
```bash
# Install via npm
npm install -g azure-functions-core-tools@4 --unsafe-perm true

# Or via Chocolatey (Windows)
choco install azure-functions-core-tools

# Or via Homebrew (macOS)
brew install azure-functions-core-tools
```

### Usage
```bash
# Create new function app
func init MyFunctionApp --language javascript

# Create new function
func new --name MyFunction --template "HTTP trigger"

# Run locally
func start

# Debug in VS Code
# F5 to start debugging
```

### Configuration
- **local.settings.json**: Environment variables and connection strings
- **host.json**: Function app configuration
- **function.json**: Individual function configuration

### Use Cases
- Function development and debugging
- Trigger and binding testing
- Local API development
- Event-driven architecture testing

### Chiral Integration
```bash
# Export Functions project
chiral export azure-simulator --tool functions-core-tools --project-dir functions/

# Generate function templates
chiral export azure-simulator --tool functions-core-tools --functions

# Validate Functions setup
chiral validate azure-simulator --tool functions-core-tools --project functions/
```

## Azure Cosmos DB Emulator (Emulator)

Local emulator for Azure Cosmos DB providing full database simulation.

### Features
- **Multi-API Support**: SQL, MongoDB, Cassandra, Gremlin, Table APIs
- **Data Explorer**: Web-based UI for data management
- **Certificate Authentication**: SSL certificate support
- **Performance**: Local performance testing
- **Backup/Restore**: Data persistence and migration

### Installation
```bash
# Windows: Download from Azure portal
# Download and install Azure Cosmos DB Emulator

# Docker (Linux/Mac)
docker run -p 8081:8081 mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator
```

### Usage
```bash
# Windows: Start from Start Menu
# "Azure Cosmos DB Emulator"

# Connection string
AccountEndpoint=https://localhost:8081/;AccountKey=C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==

# Access Data Explorer
# http://localhost:8081/_explorer/index.html
```

### Use Cases
- NoSQL database development
- Multi-API application testing
- Data modeling and querying
- Performance optimization

### Chiral Integration
```bash
# Export Cosmos DB configuration
chiral export azure-emulator --tool cosmos-db --connection-string "AccountEndpoint=..."

# Generate database schema
chiral export azure-emulator --tool cosmos-db --schema

# Validate Cosmos setup
chiral validate azure-emulator --tool cosmos-db --database mydb
```

## Azure Service Bus Emulator (Simulator)

Local emulator for Azure Service Bus messaging (introduced 2024).

### Features
- **Queues and Topics**: Full message queuing support
- **AMQP Protocol**: Compatible with Azure Service Bus clients
- **Docker-Based**: Containerized deployment
- **Message Routing**: Topic subscriptions and filters

### Installation
```bash
docker run -p 5672:5672 mcr.microsoft.com/azure-messaging/servicebus-emulator
```

### Usage
```bash
# Connection string
Endpoint=sb://localhost:5672/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=SAS_KEY_VALUE

# Use with Azure Service Bus SDK
# Same code as production, just different connection string
```

### Use Cases
- Message-based application development
- Queue/topic workflow testing
- Event-driven architecture
- Microservices communication

### Chiral Integration
```bash
# Export Service Bus configuration
chiral export azure-simulator --tool service-bus --connection-string "Endpoint=..."

# Generate queue/topic definitions
chiral export azure-simulator --tool service-bus --queues --topics

# Validate Service Bus setup
chiral validate azure-simulator --tool service-bus --namespace mynamespace
```

## LocalStack for Azure (Emerging Emulator)

LocalStack's Azure service emulation, providing unified local Azure environment.

### Features
- **ARM Template Support**: Deploy Azure Resource Manager templates locally
- **Bicep Integration**: Direct Bicep template validation
- **Service Coverage**: Growing list of Azure services
- **CLI Interception**: Redirect az commands to local container

### Installation
```bash
pip install azlocal
```

### Usage
```bash
# Start LocalStack with Azure
localstack start -d

# Intercept Azure CLI
azlocal start-interception

# Deploy Bicep template
az deployment group create --resource-group test-rg --template-file main.bicep
```

### Supported Services (March 2026)
- Resource Groups
- Storage Accounts (via S3 compatibility)
- App Service & Functions
- Key Vault (basic)

### Chiral Integration
```bash
# Export to LocalStack Azure
chiral export azure-emulator --tool localstack-azure --template main.bicep

# Import from LocalStack Azure
chiral import azure-emulator --tool localstack-azure --resource-group test-rg

# Validate LocalStack Azure deployment
chiral validate azure-emulator --tool localstack-azure --services storage,functions
```

## LocalStack for Azure Changelog

This changelog tracks updates to LocalStack for Azure support, including new services, enhancements, and compatibility fixes.

### Version 0.1.0

LocalStack for Azure 0.1.0 supports the following services:

- **Azure API Management**
- **Azure App Service**
- **Azure RBAC** (Role-Based Access Control)
- **Azure Container Registry**
- **Azure Kubernetes Service**
- **Azure Database for PostgreSQL**
- **Azure Key Vault**
- **Azure Resource Manager**
- **Azure Blob Storage**
- **Azure Storage**
- **Azure SQL**

For the latest updates and detailed release notes, visit: https://docs.localstack.cloud/azure/changelog/

## Comparison Matrix

| Tool | Category | Startup Time | Resource Usage | Service Focus | Best For |
|------|----------|-------------|----------------|---------------|----------|
| Azurite | Emulator | Fast | Low | Storage | Blob/Queue/Table development |
| Functions Core Tools | Simulator | Medium | Medium | Serverless | Function development |
| Cosmos DB Emulator | Emulator | Slow | High | Database | NoSQL development |
| Service Bus Emulator | Simulator | Medium | Medium | Messaging | Queue/Topic workflows |
| LocalStack Azure | Emulator | Slow | High | Multi-service | Integration testing |

## Development Workflows

### Azure-First Development
1. Draft infrastructure with Chiral locally
2. Test functions with Core Tools
3. Validate storage with Azurite
4. Test database with Cosmos Emulator
5. Validate messaging with Service Bus Emulator
6. Full integration with LocalStack Azure
7. Deploy to Azure

### CI/CD Integration
```yaml
# GitHub Actions workflow
name: Azure Local Testing
jobs:
  test-azure-local:
    steps:
      - name: Test Functions
        run: |
          npm install -g azure-functions-core-tools@4
          func start &
          # Run function tests

      - name: Test Storage (Azurite)
        run: |
          docker run -d -p 10000-10002:10000-10002 mcr.microsoft.com/azure-storage/azurite
          # Run storage tests

      - name: Test with LocalStack Azure
        run: |
          pip install azlocal
          localstack start -d
          azlocal start-interception
          # Run integration tests
```

### Chiral Azure Workflow
```bash
# Complete Azure development cycle
chiral init my-azure-app

# Test components
chiral export azure-simulator --tool functions-core-tools --validate
chiral export azure-simulator --tool service-bus --validate

# Validate with emulators
chiral export azure-emulator --tool azurite --validate
chiral export azure-emulator --tool cosmos-db --validate

# Full integration
chiral export azure-emulator --tool localstack-azure --validate

# Deploy to production
chiral export azure --template main.bicep
az deployment group create --resource-group prod-rg --template-file main.bicep
```

## Best Practices

### Tool Selection
- **Storage Development**: Azurite for blob/queue/table operations
- **Function Development**: Functions Core Tools for serverless
- **Database Development**: Cosmos DB Emulator for NoSQL
- **Messaging**: Service Bus Emulator for queues/topics
- **Integration Testing**: LocalStack Azure for multi-service

### Performance Optimization
- Use simulators for fast iteration
- Reserve emulators for comprehensive validation
- Run in Docker for resource isolation

### Resource Management
- Monitor Cosmos DB Emulator memory usage
- Start/stop Azurite as needed
- Use development connection strings

### Testing Strategy
- Unit tests with Functions Core Tools
- Storage tests with Azurite
- Database tests with Cosmos Emulator
- Integration tests with LocalStack Azure
- End-to-end tests in Azure

This comprehensive Azure local tools ecosystem, integrated with Chiral's bidirectional translation, enables efficient cloud-native development across the full Azure service spectrum.
