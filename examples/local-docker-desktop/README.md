# Local Docker Desktop Development

This example demonstrates how to use Chiral for local development with Docker Desktop.

## Prerequisites

- Docker Desktop installed and running
- Kubernetes enabled in Docker Desktop
- At least 4GB RAM allocated to Docker Desktop

## Configuration

The `chiral.config.ts` file is optimized for Docker Desktop:

- **Network**: Uses Docker Desktop's default network range (`192.168.65.0/24`)
- **Kubernetes**: Single-node cluster matching Docker Desktop capabilities
- **Resources**: Minimal resource allocation for local development
- **Storage**: 20GB PostgreSQL storage for development data

## Usage

```bash
# Generate local Docker artifacts
npx chiral generate --provider local

# Start the local environment
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop the environment
docker-compose down
```

## Generated Artifacts

- `docker-compose.yml` - Local service definitions
- `setup.sh` - Environment setup script
- Kubernetes manifests for Docker Desktop

## Architecture

```
Docker Desktop
├── Kubernetes Cluster (1 node)
├── PostgreSQL Container
├── ADFS Windows Container
└── Network Bridge
```

## Development Workflow

1. Make changes to your `chiral.config.ts`
2. Run `npx chiral generate --provider local`
3. Apply the generated artifacts
4. Test your application locally
5. Push to cloud when ready

## Migration to Cloud

This configuration includes cloud provider settings for easy migration:

```bash
# Generate AWS artifacts
npx chiral generate --provider aws

# Generate Azure artifacts  
npx chiral generate --provider azure

# Generate GCP artifacts
npx chiral generate --provider gcp
```
