# Basic Local Development Example

This example demonstrates a simple web application setup using Chiral's local provider.

## Configuration

```typescript
// chiral.config.ts
import { ChiralSystem } from './src/intent';

export const config: ChiralSystem = {
  projectName: 'simple-web-app',
  environment: 'dev',
  networkCidr: '192.168.65.0/24',
  region: { 
    local: 'localhost',
    aws: 'us-east-1',
    azure: 'eastus',
    gcp: 'us-central1'
  },
  k8s: {
    version: '1.27',
    minNodes: 1,
    maxNodes: 2,
    size: 'small'
  },
  postgres: {
    engineVersion: '15',
    storageGb: 20,
    size: 'small'
  },
  adfs: {
    size: 'small',
    windowsVersion: '2022'
  }
};
```

## Generate Local Environment

```bash
# Generate Docker Compose environment
chiral core compile -c chiral.config.ts --providers local -o simple-local

# Start local development
cd simple-local
chmod +x setup-local.sh && ./setup-local.sh
docker-compose up -d

# Check service health
make health

# View logs
make logs

# Stop services
make stop
```

## Generated Files

### Core Infrastructure
- `docker-compose.yml` - Main services configuration
- `docker-compose.dev.yml` - Development overrides
- `docker-compose.prod.yml` - Production overrides
- `.env.example` - Environment variables template

### Kubernetes Support
- `k8s/namespace.yaml` - Kubernetes namespace
- `k8s/postgres.yaml` - PostgreSQL deployment
- `k8s/adfs.yaml` - ADFS deployment
- `k8s/configmap.yaml` - Configuration data
- `k8s/ingress.yaml` - Ingress configuration

### Local Kubernetes
- `kind-config.yaml` - KIND cluster configuration
- `k3s-config.yaml` - K3s configuration

### Development Tools
- `setup-local.sh` - Environment setup script
- `teardown-local.sh` - Cleanup script
- `health-check.sh` - Health monitoring
- `Makefile` - Development commands

## Usage Examples

### Development Workflow

```bash
# 1. Setup environment
make setup

# 2. Start services
make start

# 3. Access services
# PostgreSQL: localhost:5432
# ADFS: http://localhost
# Nginx: http://localhost:8080

# 4. Development with hot reload
docker-compose up -d --build

# 5. Run tests
make test

# 6. Clean up
make clean
```

### Database Operations

```bash
# Access PostgreSQL
make shell-postgres

# Create database backup
make backup

# Restore from backup
make restore FILE=backup_20231201_120000.sql
```

### Multi-Environment Support

```bash
# Generate for different environments
chiral core compile -c chiral.config.ts --providers local -o dev-env
chiral core compile -c chiral.config.ts --providers local -o staging-env
chiral core compile -c chiral.config.ts --providers local -o prod-env

# Start specific environment
cd dev-env && docker-compose up -d
```

## Import Existing Configuration

```bash
# Import from existing Docker Compose
chiral import -s docker-compose.yml -p local -o imported-config.ts

# Import from Kubernetes manifests
chiral import -s k8s/ -p local -o imported-config.ts

# Import from local development
chiral import -s . -p local -o current-config.ts
```

## Cost Comparison

```bash
# Compare local vs cloud costs
chiral core cost -c chiral.config.ts --providers aws,azure,gcp,local

# Example output:
# Local: $0/month (FREE)
# AWS: $342.67/month
# Azure: $389.45/month  
# GCP: $298.23/month
```

## Migration to Cloud

```bash
# 1. Generate cloud artifacts from same config
chiral core compile -c chiral.config.ts --providers aws,azure,gcp -o cloud-deployment

# 2. Deploy to cloud (example AWS)
cd cloud-deployment/aws
terraform init
terraform plan
terraform apply

# 3. Use traffic enforcement for gradual migration
chiral traffic init -p aws -o traffic-config.json
chiral traffic enforce -c traffic-config.json
```

## Advanced Features

### Monitoring Stack

```bash
# Generate with monitoring
chiral core compile -c chiral.config.ts --providers local -o monitored-env
# (requires includeMonitoring: true in generator options)

# Start monitoring stack
cd monitored-env
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### Custom Resource Limits

```typescript
// In chiral.config.ts, adjust for your machine
k8s: {
  version: '1.27',
  minNodes: 1,
  maxNodes: 2,
  size: 'medium'  // Increase for better performance
},
postgres: {
  engineVersion: '15',
  storageGb: 50,  // Increase for development
  size: 'medium'
}
```

## Troubleshooting

### Port Conflicts

```bash
# Check port usage
netstat -tulpn | grep :5432

# Use different network CIDR
networkCidr: '192.168.66.0/24'  // Instead of .65.0/24
```

### Resource Issues

```bash
# Check Docker resource usage
docker stats

# Adjust resource limits in docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '1.5'
      memory: '2G'
```

### Service Connectivity

```bash
# Test database connection
docker-compose exec postgres pg_isready -U admin -d simple-web-app

# Test ADFS endpoint
curl -f http://localhost

# Check service logs
docker-compose logs postgres
docker-compose logs adfs
```

## Best Practices

1. **Version Control**: Commit `chiral.config.ts` and generated artifacts
2. **Environment Variables**: Use `.env` file for sensitive data
3. **Resource Limits**: Set appropriate limits for your development machine
4. **Health Monitoring**: Use provided health check scripts
5. **Backup Strategy**: Regular database backups during development
6. **Cleanup**: Use teardown script to free resources when done

## Next Steps

- Explore [LOCAL_PROVIDER_GUIDE.md](../LOCAL_PROVIDER_GUIDE.md) for advanced features
- Try different environment types (minikube, kind, k3s)
- Set up CI/CD integration
- Implement monitoring and alerting
