# Local Development and Cloud Emulator Examples

This directory contains comprehensive examples for local development and cloud emulator/simulator environments using Chiral Infrastructure as Code.

## Overview

Chiral supports multiple development environments from local Docker setups to full cloud emulators. These examples demonstrate how to:

- Develop locally with Docker Desktop and Kubernetes
- Use cloud emulators for API-compatible testing
- Implement lightweight simulators for rapid development
- Seamlessly migrate from local to production

## Example Categories

### 🐳 Local Development

#### [Local Docker Desktop](./local-docker-desktop/)
**Use Case**: Development with Docker Desktop's built-in Kubernetes
**Features**:
- Single-node cluster optimization
- Docker Desktop network configuration
- Minimal resource allocation
- Easy cloud migration path

```bash
cd local-docker-desktop
npx chiral generate --provider local
docker-compose up -d
```

#### [Local Kubernetes](./local-kubernetes/)
**Use Case**: Development with minikube, kind, or k3d
**Features**:
- Multi-cluster support (minikube, kind, k3d)
- Persistent storage configuration
- Scalable node configuration
- Production-ready manifests

```bash
cd local-kubernetes
# Start your preferred local cluster
minikube start --cpus=2 --memory=4096
npx chiral generate --provider local
kubectl apply -f k8s/
```

### ☁️ Cloud Emulators (Full API Compatibility)

#### [AWS Local Emulator](./aws-local-emulator/)
**Use Case**: Full AWS service emulation with LocalStack
**Features**:
- LocalStack EKS, RDS, S3, DynamoDB emulation
- Real AWS API compatibility
- Terraform integration
- Production-like behavior

```bash
cd aws-local-emulator
docker-compose up -d
npx chiral generate --provider local
cd terraform/localstack && terraform apply
```

#### [Azure Local Emulator](./azure-local-emulator/)
**Use Case**: Full Azure service emulation with Azurite
**Features**:
- Azurite Storage, Queue, Table emulation
- AKS cluster simulation
- Azure Database for PostgreSQL
- Real Azure API compatibility

```bash
cd azure-local-emulator
docker-compose up -d
npx chiral generate --provider local
cd terraform/azurite && terraform apply
```

#### [GCP Local Emulator](./gcp-local-emulator/)
**Use Case**: Full GCP service emulation with Firebase emulators
**Features**:
- Firebase Firestore, Auth, Storage emulators
- GKE cluster simulation
- Cloud SQL for PostgreSQL
- Real GCP API compatibility

```bash
cd gcp-local-emulator
firebase emulators:start --project=gcp-emulator-app
npx chiral generate --provider local
cd terraform/firebase-emulator && terraform apply
```

### ⚡ Cloud Simulators (Lightweight & Fast)

#### [AWS Local Simulator](./aws-local-simulator/)
**Use Case**: Rapid development with lightweight AWS service simulation
**Features**:
- Fast startup (< 5 seconds)
- Minimal resource usage (< 512MB)
- Mock service implementations
- Ideal for CI/CD and unit testing

```bash
cd aws-local-simulator
npm run start:simulator
npx chiral generate --provider local
npm run test:integration
```

#### [Azure Local Simulator](./azure-local-simulator/)
**Use Case**: Rapid development with lightweight Azure service simulation
**Features**:
- Fast startup and low memory usage
- Mock Azure services
- Integration testing support
- CI/CD pipeline optimization

```bash
cd azure-local-simulator
npm run start:simulator
npx chiral generate --provider local
npm run test:integration
```

#### [GCP Local Simulator](./gcp-local-simulator/)
**Use Case**: Rapid development with lightweight GCP service simulation
**Features**:
- Ultra-fast simulation
- Mock GCP services
- Development workflow optimization
- Testing automation support

```bash
cd gcp-local-simulator
npm run start:simulator
npx chiral generate --provider local
npm run test:integration
```

## Choosing the Right Example

### Development Stage Guidelines

| Stage | Recommended Example | Reason |
|-------|-------------------|--------|
| **Initial Development** | Local Docker Desktop | Fastest setup, minimal resources |
| **Kubernetes Development** | Local Kubernetes | Real K8s behavior, persistent storage |
| **API Testing** | Cloud Emulators | Full API compatibility, real behavior |
| **CI/CD Pipelines** | Cloud Simulators | Fast execution, minimal resources |
| **Production Validation** | Cloud Emulators | Realistic testing environment |

### Resource Requirements

| Example | Memory | CPU | Startup Time | Disk Space |
|---------|--------|-----|---------------|------------|
| Local Docker Desktop | 2GB | 2 cores | < 30s | 10GB |
| Local Kubernetes | 4GB | 2 cores | < 60s | 20GB |
| AWS/Azure/GCP Emulators | 4GB | 2 cores | 2-5 min | 15GB |
| AWS/Azure/GCP Simulators | 512MB | 1 core | < 5s | 1GB |

### Feature Comparison

| Feature | Local | Emulators | Simulators |
|---------|--------|-----------|------------|
| **API Compatibility** | Basic | Full | Mock |
| **Startup Speed** | Fast | Slow | Ultra-fast |
| **Resource Usage** | Medium | High | Minimal |
| **Production Parity** | Low | High | Low |
| **CI/CD Friendly** | Yes | No | Excellent |

## Migration Paths

### From Local to Cloud

All examples support seamless migration to production cloud environments:

```bash
# Generate cloud-specific artifacts
npx chiral generate --provider aws    # AWS
npx chiral generate --provider azure  # Azure
npx chiral generate --provider gcp    # GCP

# Deploy to production
cd terraform/aws && terraform apply
```

### From Simulator to Emulator

Upgrade from lightweight simulation to full emulation:

```bash
# Export current configuration
npm run export:config

# Switch to emulator example
cd ../aws-local-emulator

# Import and generate
npm run import:config
npx chiral generate --provider local
```

## Common Workflows

### Development Workflow
```bash
# 1. Choose your development environment
cd local-docker-desktop

# 2. Generate local artifacts
npx chiral generate --provider local

# 3. Start local services
docker-compose up -d

# 4. Develop and test
npm run dev
npm run test

# 5. Validate production readiness
npx chiral generate --provider aws
npx chiral analyze-costs
```

### CI/CD Workflow
```bash
# 1. Use simulator for fast testing
cd aws-local-simulator
npm run start:simulator &
npm run test:integration

# 2. Use emulator for integration testing
cd ../aws-local-emulator
docker-compose up -d
npm run test:integration

# 3. Deploy to staging
npx chiral generate --provider aws
cd terraform/staging && terraform apply

# 4. Deploy to production
cd terraform/production && terraform apply
```

### Multi-Cloud Workflow
```bash
# 1. Develop locally
cd local-docker-desktop
npx chiral generate --provider local

# 2. Test against all cloud emulators
cd ../aws-local-emulator && npx chiral generate --provider local
cd ../azure-local-emulator && npx chiral generate --provider local
cd ../gcp-local-emulator && npx chiral generate --provider local

# 3. Compare costs and features
npx chiral analyze-costs --providers aws,azure,gcp

# 4. Deploy to optimal cloud
npx chiral generate --provider [chosen-cloud]
```

## Configuration Patterns

### Minimal Development Configuration
```typescript
export const config: ChiralSystem = {
  projectName: 'my-app',
  environment: 'dev',
  networkCidr: '192.168.65.0/24',
  k8s: { version: '1.27', minNodes: 1, maxNodes: 1, size: 'small' },
  postgres: { engineVersion: '15', size: 'small', storageGb: 20 },
  adfs: { size: 'small', windowsVersion: '2022' }
};
```

### Production-Ready Configuration
```typescript
export const config: ChiralSystem = {
  projectName: 'my-app',
  environment: 'prod',
  networkCidr: '10.0.0.0/16',
  region: { aws: 'us-east-1', azure: 'eastus', gcp: 'us-central1' },
  compliance: {
    encryptionAtRest: true,
    encryptionInTransit: true,
    auditLogging: true
  },
  k8s: { version: '1.27', minNodes: 3, maxNodes: 5, size: 'large' },
  postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
  adfs: { size: 'large', windowsVersion: '2022' }
};
```

## Best Practices

### Development Best Practices

1. **Start Simple**: Begin with Local Docker Desktop for initial development
2. **Iterate Quickly**: Use simulators for rapid prototyping and testing
3. **Validate Early**: Use emulators to validate cloud compatibility
4. **Monitor Costs**: Regularly analyze costs across providers
5. **Document Decisions**: Keep configuration decisions documented

### CI/CD Best Practices

1. **Use Simulators**: For fast unit and integration tests
2. **Parallel Testing**: Test against multiple cloud providers
3. **Security Scanning**: Include security scans in pipelines
4. **Cost Monitoring**: Track cost implications of changes
5. **Environment Parity**: Maintain consistency across environments

### Production Best Practices

1. **Use Emulators**: For final validation before deployment
2. **Multi-Cloud Testing**: Test across multiple cloud providers
3. **Compliance Validation**: Ensure compliance requirements are met
4. **Performance Testing**: Validate performance under load
5. **Backup and Recovery**: Test backup and recovery procedures

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Check for port conflicts with `lsof -i :<port>`
2. **Resource Limits**: Ensure sufficient memory and CPU allocation
3. **Network Issues**: Verify network connectivity and firewall settings
4. **Permission Issues**: Check file permissions and Docker daemon access
5. **Version Mismatches**: Ensure compatible versions of tools and services

### Debugging Commands

```bash
# Check Docker resources
docker system df
docker stats

# Check Kubernetes cluster
kubectl cluster-info
kubectl get nodes

# Check emulator health
curl http://localhost:4566/_localstack/health  # AWS
curl http://localhost:10000/devstoreaccount1   # Azure
curl http://localhost:4000                     # GCP

# Check simulator status
curl http://localhost:8080/health
```

## Next Steps

1. **Choose Your Example**: Select the appropriate example for your use case
2. **Follow Setup Instructions**: Each example has detailed setup instructions
3. **Explore Configuration**: Understand the Chiral configuration options
4. **Test Migration**: Validate migration paths to production
5. **Review Documentation**: Explore the full Chiral documentation

## Additional Resources

- [Chiral Documentation](../docs/README.md)
- [Architecture Guide](../docs/ARCHITECTURE.md)
- [API Reference](../docs/API.md)
- [Migration Guide](../docs/MIGRATION.md)
- [Security and Compliance](../docs/security/)

## Community and Support

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share experiences
- **Examples**: Contribute your own examples
- **Documentation**: Help improve documentation

---

*Last updated: 2026-03-08*
