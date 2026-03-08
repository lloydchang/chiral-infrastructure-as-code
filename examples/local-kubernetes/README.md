# Local Kubernetes Development

This example demonstrates using Chiral with local Kubernetes clusters (minikube, kind, k3d).

## Prerequisites

- Docker installed
- Local Kubernetes cluster (one of):
  - minikube
  - kind (Kubernetes in Docker)
  - k3d (Lightweight Kubernetes)
- kubectl configured

## Quick Start

### Using minikube
```bash
# Start minikube
minikube start --cpus=2 --memory=4096 --disk-size=20g

# Enable addons
minikube addons enable ingress
minikube addons enable metrics-server
```

### Using kind
```bash
# Create kind cluster
kind create cluster --name chiral-dev --config=kind-config.yaml
```

### Using k3d
```bash
# Create k3d cluster
k3d cluster create chiral-dev --agents=1 --servers=1 --port 8080:80@loadbalancer
```

## Configuration

The `chiral.config.ts` is optimized for local Kubernetes:

- **Network**: Uses standard pod network CIDR (`10.244.0.0/16`)
- **Storage**: 50GB persistent storage for PostgreSQL
- **Resources**: Small instance sizes for local development
- **Scalability**: Configurable 1-3 nodes for testing

## Usage

```bash
# Generate Kubernetes manifests
npx chiral generate --provider local

# Apply to local cluster
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -w

# Port forward services
kubectl port-forward svc/postgres 5432:5432
kubectl port-forward svc/adfs 8080:80

# Clean up
kubectl delete -f k8s/
```

## Generated Artifacts

- Kubernetes manifests in `k8s/` directory
- PostgreSQL StatefulSet and Service
- ADFS Deployment and Service
- ConfigMaps and Secrets
- PersistentVolumeClaims

## Architecture

```
Local Kubernetes Cluster
├── Namespace: chiral-dev
├── PostgreSQL StatefulSet
│   └── PersistentVolume (50GB)
├── ADFS Deployment
│   └── Windows Container
├── Services (LoadBalancer/NodePort)
└── Network Policies
```

## Development Workflow

1. Start your local Kubernetes cluster
2. Generate manifests with Chiral
3. Apply to cluster
4. Develop and test applications
5. Scale resources as needed

## Scaling for Testing

```bash
# Scale PostgreSQL
kubectl scale statefulset postgres --replicas=1

# Scale ADFS
kubectl scale deployment adfs --replicas=2
```

## Monitoring

```bash
# Check cluster resources
kubectl top nodes
kubectl top pods

# View logs
kubectl logs -f deployment/postgres
kubectl logs -f deployment/adfs
```

## Migration to Cloud

This configuration supports easy cloud migration:

```bash
# Generate cloud manifests
npx chiral generate --provider aws
npx chiral generate --provider azure  
npx chiral generate --provider gcp
```

## Troubleshooting

### Common Issues

1. **Insufficient Resources**
   ```bash
   # Increase cluster resources
   minikube start --cpus=4 --memory=8192
   ```

2. **Storage Issues**
   ```bash
   # Check storage classes
   kubectl get storageclass
   
   # Clean up PVCs
   kubectl delete pvc --all
   ```

3. **Network Issues**
   ```bash
   # Check network policies
   kubectl get networkpolicy
   
   # Reset cluster if needed
   minikube delete && minikube start
   ```
