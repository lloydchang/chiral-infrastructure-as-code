# Azure Local Emulator Development

This example demonstrates using Azurite and Azure emulators for local development with Chiral.

## Prerequisites

- Docker installed and running
- Docker Compose
- Azure CLI (optional, for comparison)
- At least 4GB RAM available

## Quick Start

```bash
# Start Azure emulators
docker-compose up -d

# Wait for services to be ready
curl http://localhost:10000/devstoreaccount1

# Configure Azure CLI for local development (optional)
az storage account create --name localdev --resource-group test-rg
```

## Configuration

The `chiral.config.ts` is optimized for Azure emulation:

- **Region**: Uses `localhost:10000` for Azurite endpoint
- **Network**: Azure VNet range `10.1.0.0/16`
- **Services**: AKS, Azure Database, and other Azure services emulated
- **Storage**: Local state management with Azurite

## Usage

```bash
# Generate Azure emulator artifacts
npx chiral generate --provider local

# Start the emulator environment
docker-compose up -d

# Apply Terraform configuration
cd terraform/azurite
terraform init
terraform apply

# Test Azure services locally
az storage blob list --account-name devstoreaccount1 --connection-string "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;"
```

## Generated Artifacts

- `docker-compose.yml` - Azurite and service definitions
- `terraform/azurite/` - Terraform configurations for Azurite
- Kubernetes manifests for AKS emulation
- Azure Database configurations

## Architecture

```
Azure Emulators (localhost:10000-10002)
├── Azurite Storage Emulator
│   ├── Blob Storage (Port 10000)
│   ├── Queue Storage (Port 10001)
│   └── Table Storage (Port 10002)
├── AKS Emulation
│   ├── Kubernetes Control Plane
│   └── Worker Nodes
├── Azure Database Emulation
│   └── PostgreSQL Instance
└── Azure AD Emulation
    └── Identity Services
```

## Development Workflow

1. Start Azure emulators with Docker Compose
2. Generate Chiral artifacts
3. Apply Terraform configurations
4. Develop and test applications
5. Validate against Azure APIs locally

## Testing Azure Services

### Blob Storage Operations
```bash
# Create container
az storage container create \
  --name test-container \
  --account-name devstoreaccount1 \
  --connection-string "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;"

# Upload blob
az storage blob upload \
  --container-name test-container \
  --name test-file.txt \
  --file ./test-file.txt \
  --account-name devstoreaccount1 \
  --connection-string "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;"
```

### Queue Storage Operations
```bash
# Create queue
az storage queue create \
  --name test-queue \
  --account-name devstoreaccount1 \
  --connection-string "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;"
```

### Table Storage Operations
```bash
# Create table
az storage table create \
  --name test-table \
  --account-name devstoreaccount1 \
  --connection-string "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;TableEndpoint=http://127.0.0.1:10002/devstoreaccount1;"
```

## Azurite Services

This example configures these Azurite services:

- **Blob Storage** - Object storage emulation
- **Queue Storage** - Message queue emulation
- **Table Storage** - NoSQL table storage emulation
- **AKS** - Kubernetes cluster management
- **Azure Database** - PostgreSQL database service
- **Azure AD** - Identity and access management

## Monitoring and Debugging

```bash
# Check Azurite logs
docker-compose logs azurite

# Monitor service health
curl http://localhost:10000/devstoreaccount1

# View storage containers
az storage container list \
  --account-name devstoreaccount1 \
  --connection-string "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;"
```

## Docker Compose Configuration

```yaml
version: '3.8'
services:
  azurite:
    image: mcr.microsoft.com/azure-storage/azurite:latest
    ports:
      - "10000:10000"  # Blob storage
      - "10001:10001"  # Queue storage
      - "10002:10002"  # Table storage
    environment:
      AZURITE_ACCOUNTS: devstoreaccount1:Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==
    volumes:
      - azurite_data:/data

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: azure-emulator-app
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  azurite_data:
  postgres_data:
```

## Migration to Production

When ready to migrate to Azure:

```bash
# Generate production Azure artifacts
npx chiral generate --provider azure

# Update Azure configuration
az login
az account set --subscription "your-subscription-id"

# Apply to production
cd terraform/azure
terraform init
terraform apply
```

## Advanced Configuration

### Custom Azurite Configuration
```yaml
services:
  azurite:
    environment:
      AZURITE_ACCOUNTS: account1:key1,account2:key2
      AZURITE_LOGB_LEVEL: debug
      AZURITE_DEBUG: /debug
```

### Persistence
```yaml
volumes:
  azurite_data:
    driver: local
  postgres_data:
    driver: local
```

## Cost Analysis

Azurite provides free local emulation:

```bash
# Compare costs
npx chiral analyze-costs --providers local,azure

# Expected output:
# - Local: $0/month
# - Azure: $~400/month (equivalent services)
```

## Troubleshooting

### Common Issues

1. **Azurite Not Starting**
   ```bash
   # Check Docker resources
   docker system df
   
   # Check port conflicts
   lsof -i :10000
   lsof -i :10001
   lsof -i :10002
   ```

2. **Storage Connection Issues**
   ```bash
   # Verify connection string
   curl http://localhost:10000/devstoreaccount1
   
   # Check Azurite logs
   docker-compose logs azurite
   ```

3. **Permission Issues**
   ```bash
   # Fix volume permissions
   sudo chown -R $USER:$USER ./data
   ```

## Development Tools

### Azure Storage Explorer
1. Install Azure Storage Explorer
2. Add local storage account
3. Connection string: `DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;`

### VS Code Extensions
- Azure Storage Extension
- Docker Extension
- Terraform Extension

## Best Practices

1. **Use Azurite for local development**
2. **Validate against real Azure services before production**
3. **Keep connection strings secure**
4. **Use environment-specific configurations**
5. **Regular backup of local data**

## Next Steps

1. Explore the Azure Local Simulator example for lightweight simulation
2. Review production deployment examples
3. Learn about multi-cloud configurations
4. Understand Azure compliance and security requirements
