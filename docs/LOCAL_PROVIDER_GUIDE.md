# Local Provider Development with Chiral

This guide demonstrates how to use Chiral's local provider for bidirectional translation between local development environments and cloud providers (AWS, Azure, GCP).

## Overview

The local provider enables:
- **Local Development**: Generate Docker Compose, Minikube, KIND, and K3s configurations from Chiral intent
- **Bidirectional Translation**: Import existing local configurations into Chiral intent
- **Cost Analysis**: Compare local (free) development against cloud provider costs
- **Multi-Environment Support**: Seamlessly switch between local and cloud deployments

## Quick Start

### 1. Generate Local Development Environment

Create a `chiral.config.ts` file:

```typescript
import { ChiralSystem } from './src/intent';

export const config: ChiralSystem = {
  projectName: 'my-app',
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
    maxNodes: 3,
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

Generate local artifacts:

```bash
# Generate local development artifacts
chiral core compile -c chiral.config.ts --providers local -o local-dev

# Or use the enhanced agent
chiral generate -c chiral.config.ts --providers local,aws,azure,gcp
```

### 2. Start Local Development

```bash
cd local-dev

# Setup environment
chmod +x setup-local.sh && ./setup-local.sh

# Start services
docker-compose up -d

# Or use Makefile
make start

# Check health
make health

# View logs
make logs
```

### 3. Import Existing Local Configuration

```bash
# Import Docker Compose to Chiral
chiral import -s docker-compose.yml -p local -o imported-config.ts

# Import Kubernetes manifests
chiral import -s k8s/ -p local -o imported-config.ts

# Import from local development to compare with cloud
chiral import -s ./ -p local -o local-config.ts
```

## Local Environment Types

### Docker Compose
Best for simple containerized applications:

```bash
chiral core compile -c config.ts --providers local -o docker-env
```

Generates:
- `docker-compose.yml` - Main services
- `docker-compose.dev.yml` - Development overrides
- `docker-compose.prod.yml` - Production overrides
- `.env.example` - Environment variables template

### Minikube
For single-node Kubernetes clusters:

```bash
chiral core compile -c config.ts --providers local -o minikube-env
```

Generates:
- `k8s/` - Kubernetes manifests
- Minikube-specific configurations
- Resource limits optimized for local development

### KIND
For multi-node Kubernetes testing:

```bash
chiral core compile -c config.ts --providers local -o kind-env
```

Generates:
- `kind-config.yaml` - KIND cluster configuration
- `k8s/` - Kubernetes manifests
- Port mappings for local access

### K3s
For lightweight Kubernetes:

```bash
chiral core compile -c config.ts --providers local -o k3s-env
```

Generates:
- `k3s-config.yaml` - K3s configuration
- Optimized for resource-constrained environments

## Bidirectional Workflow

### Local → Cloud

1. **Develop Locally**: Build and test in local environment
2. **Generate Cloud Artifacts**: Use same config for cloud providers
3. **Deploy to Cloud**: Deploy validated configuration to production

```bash
# Step 1: Local development
chiral core compile -c config.ts --providers local -o local
make start

# Step 2: Generate cloud artifacts
chiral core compile -c config.ts --providers aws,azure,gcp -o cloud

# Step 3: Deploy to cloud
cd cloud/aws
terraform apply
```

### Cloud → Local

1. **Import Cloud Config**: Import existing cloud IaC
2. **Generate Local Setup**: Create local development environment
3. **Develop Locally**: Iterate faster with local feedback

```bash
# Step 1: Import cloud configuration
chiral import -s terraform/ -p aws -o cloud-config.ts

# Step 2: Generate local environment
chiral core compile -c cloud-config.ts --providers local -o local

# Step 3: Start local development
cd local
make start
```

## Cost Comparison

Compare local development costs against cloud providers:

```bash
# Compare all providers
chiral core cost -c config.ts --providers aws,azure,gcp,local

# Output includes local (free) vs cloud costs
```

Example output:
```
💰 CHIRAL CORE - Infrastructure Cost Analysis
📊 Cost Comparison:
- Local: $0/month (FREE)
- AWS: $342.67/month
- Azure: $389.45/month  
- GCP: $298.23/month

💡 Recommendation: Use local for development, AWS for production
```

## Advanced Features

### Monitoring Stack

Enable monitoring for local development:

```typescript
// In your artifact generator options
const options = {
  environment: 'docker-compose',
  includeMonitoring: true,
  includeIngress: true,
  includePersistence: true,
  resourceLimits: true
};
```

Generates:
- Prometheus and Grafana containers
- Monitoring dashboards
- Alert configurations

### Traffic Management

Use traffic enforcement for gradual migration:

```bash
# Configure traffic enforcement
chiral traffic init -p local -o traffic-config.json

# Start gradual migration from local to cloud
chiral traffic enforce -c traffic-config.json -p aws
```

### Compliance and Validation

Ensure local environment meets compliance requirements:

```bash
# Validate configuration
chiral core validate -c config.ts

# Check compliance
chiral core compliance -c config.ts --frameworks soc2,hipaa

# Generate validation scripts
chiral validation-scripts -p local -n my-project
```

## Examples

### Basic Web Application

```typescript
export const webAppConfig: ChiralSystem = {
  projectName: 'web-app',
  environment: 'dev',
  networkCidr: '192.168.65.0/24',
  region: { local: 'localhost' },
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

### Microservices Architecture

```typescript
export const microservicesConfig: ChiralSystem = {
  projectName: 'microservices-app',
  environment: 'dev',
  networkCidr: '192.168.65.0/24',
  region: { local: 'localhost' },
  k8s: {
    version: '1.27',
    minNodes: 2,
    maxNodes: 5,
    size: 'medium'  // More resources for microservices
  },
  postgres: {
    engineVersion: '15',
    storageGb: 100,  // Larger storage for multiple services
    size: 'medium'
  },
  adfs: {
    size: 'medium',
    windowsVersion: '2022'
  }
};
```

### Production-Ready Local

```typescript
export const prodLocalConfig: ChiralSystem = {
  projectName: 'prod-local',
  environment: 'prod',
  networkCidr: '10.0.0.0/16',
  region: { 
    local: 'localhost',
    aws: 'us-east-1'  // Target cloud for migration
  },
  k8s: {
    version: '1.28',
    minNodes: 3,
    maxNodes: 5,
    size: 'large'
  },
  postgres: {
    engineVersion: '15',
    storageGb: 500,
    size: 'large'
  },
  adfs: {
    size: 'large',
    windowsVersion: '2022'
  },
  compliance: {
    framework: 'soc2',
    encryptionAtRest: true,
    encryptionInTransit: true,
    auditLogging: true
  }
};
```

## Best Practices

### 1. Environment Parity
- Use same Chiral config for local and production
- Ensure consistent versions across environments
- Test migration paths before production deployment

### 2. Resource Management
- Set appropriate resource limits for local machine
- Use monitoring to track resource usage
- Implement cleanup procedures

### 3. Security
- Use environment variables for secrets
- Implement proper network segmentation
- Enable encryption in transit and at rest

### 4. Workflow Integration
- Use version control for configuration changes
- Integrate with CI/CD pipelines
- Document migration procedures

## Troubleshooting

### Common Issues

**Port Conflicts**
```bash
# Check port usage
netstat -tulpn | grep :5432

# Use different ports in configuration
networkCidr: '192.168.66.0/24'  # Different subnet
```

**Resource Constraints**
```bash
# Monitor resource usage
docker stats

# Adjust resource limits
k8s.size: 'small'  // Reduce from medium/large
```

**Configuration Validation**
```bash
# Validate configuration before deployment
chiral core validate -c config.ts

# Check specific requirements
chiral core compliance -c config.ts --frameworks soc2
```

## Migration Paths

### Development to Production

1. **Local Development**: Build and test features locally
2. **Staging**: Deploy to cloud staging environment
3. **Production**: Gradual migration with traffic enforcement

### Cloud to Local

1. **Import**: Import existing cloud configuration
2. **Local Setup**: Generate local development environment
3. **Development**: Iterate with faster feedback loops

### Multi-Cloud Strategy

1. **Chiral Intent**: Define infrastructure requirements once
2. **Multi-Provider**: Generate artifacts for all providers
3. **Cost Analysis**: Compare and optimize across providers
4. **Flexibility**: Switch providers as needed

## Integration with CI/CD

### GitHub Actions

```yaml
name: Chiral Local Development

on: [push, pull_request]

jobs:
  test-local:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Chiral
        run: npm install -g chiral
        
      - name: Generate Local Environment
        run: |
          chiral core compile -c chiral.config.ts --providers local -o local-env
          
      - name: Start Local Services
        run: |
          cd local-env
          chmod +x setup-local.sh
          ./setup-local.sh
          docker-compose up -d
          
      - name: Run Tests
        run: |
          make health
          make test
          
      - name: Cleanup
        if: always()
        run: |
          cd local-env
          make clean
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    stages {
        stage('Setup Local') {
            steps {
                sh 'npm install -g chiral'
                sh 'chiral core compile -c chiral.config.ts --providers local -o local-env'
                sh 'cd local-env && chmod +x setup-local.sh && ./setup-local.sh'
                sh 'cd local-env && docker-compose up -d'
            }
        }
        
        stage('Test') {
            steps {
                sh 'cd local-env && make health'
                sh 'cd local-env && make test'
            }
        }
        
        stage('Cleanup') {
            steps {
                sh 'cd local-env && make clean || true'
            }
        }
    }
}
```

## Conclusion

The Chiral local provider provides:

✅ **Bidirectional Translation**: Seamless conversion between local and cloud
✅ **Cost Optimization**: Free local development vs cloud costs
✅ **Multi-Environment Support**: Docker, K8s, Minikube, KIND, K3s
✅ **Compliance**: Security and compliance validation
✅ **Automation**: CLI integration and CI/CD support

Start using the local provider today to accelerate development while maintaining production readiness!
