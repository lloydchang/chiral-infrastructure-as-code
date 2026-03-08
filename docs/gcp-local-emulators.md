# GCP Local Emulators Guide

This document provides detailed information about local development tools and emulators available for Google Cloud Platform (GCP), including Firebase Suite, gcloud CLI emulators, and integration patterns.

## Overview

GCP's local development approach differs from AWS and Azure. Instead of unified emulators, Google provides service-specific binaries and the comprehensive Firebase Emulator Suite for Firebase ecosystem development. The gcloud CLI manages individual emulators for broader GCP services.

## Firebase Emulator Suite

The Firebase Emulator Suite is GCP's most comprehensive local development tool, particularly strong for Firebase-integrated applications.

### Features
- Firestore/Realtime Database emulation
- Authentication emulation
- Cloud Functions emulation
- Pub/Sub emulation
- Hosting emulation
- Web-based UI for data visualization and debugging
- Real-time data inspection
- Function logs and metrics

### Installation
```bash
npm install -g firebase-tools
```

### Usage
```bash
# Initialize Firebase project
firebase init

# Start emulators
firebase emulators:start

# Start specific emulators
firebase emulators:start --only functions,firestore
```

### Configuration
- Uses `firebase.json` for emulator configuration
- Uses `.firebaserc` for project settings
- Environment variables via `functions/.env.local`

### Web UI
- Access at `localhost:4000` when emulators are running
- Visualize database data
- Trigger functions manually
- View logs and metrics

### Use Cases
- Full-stack Firebase development
- Testing Firebase security rules
- Cloud Functions development and debugging
- Integration testing across Firebase services

## Individual GCP Emulators (gcloud CLI)

Google provides official emulators for core GCP services via the gcloud CLI.

### Cloud Datastore/Firestore Emulator
```bash
# Start emulator
gcloud beta emulators datastore start

# Set environment variables
$(gcloud beta emulators datastore env-init)

# Use in application
# Connect to localhost:8081
```

### Pub/Sub Emulator
```bash
# Start emulator
gcloud beta emulators pubsub start

# Set environment
$(gcloud beta emulators pubsub env-init)

# Create topics/subscriptions
gcloud pubsub topics create my-topic --project=my-project
```

### Cloud Functions Emulator
```bash
# Start emulator
gcloud beta emulators functions start

# Deploy function locally
gcloud functions deploy my-function --source=. --runtime=nodejs16 --trigger-http
```

### Cloud Spanner Emulator
```bash
# Start emulator
gcloud beta emulators spanner start

# Set environment
$(gcloud beta emulators spanner env-init)

# Create instance/database
gcloud spanner instances create test-instance --config=emulator-config --description="Test Instance" --nodes=1
```

### Bigtable Emulator
```bash
# Start emulator
gcloud beta emulators bigtable start

# Set environment
$(gcloud beta emulators bigtable env-init)

# Create instance/table
cbt createtable my-table
```

### Cloud Storage Emulator (fake-gcs-server)
While not official, this community tool provides Cloud Storage emulation:

```bash
# Run via Docker
docker run -p 4443:4443 fsouza/fake-gcs-server:latest -scheme http
```

## Integration Patterns

### Multi-Service Development
For applications using multiple GCP services:

```bash
# Start multiple emulators
gcloud beta emulators start firestore,functions,pubsub

# Or use Firebase Suite for integrated experience
firebase emulators:start
```

### Chiral Pattern Integration
For the Chiral translation layer:

1. Use Firebase Suite for Firebase-native artifacts
2. Use gcloud emulators for Terraform-generated resources
3. Combine with Policy Controller/Gator for validation
4. Use Docker Compose for orchestrated local environments

### Container-Native Development
GCP emphasizes Cloud Run, so local development often involves:

```yaml
# docker-compose.yml for Cloud Run local dev
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:8080"
  firestore:
    image: google/cloud-sdk:latest
    command: gcloud beta emulators firestore start --host-port=0.0.0.0:8080
    ports:
      - "8080:8080"
```

## Policy-as-Code with OPA Gatekeeper

GCP's equivalent to cdk-nag and Bicep linter is Policy Controller with Gator.

### Installation
```bash
# Install OPA
curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
chmod +x opa

# Install Gator
go install github.com/open-policy-agent/gatekeeper/gator@latest
```

### Usage
```bash
# Test policies against Terraform plans
terraform plan -out=tfplan.binary
terraform show -json tfplan.binary > tfplan.json
gator test -f tfplan.json policies/
```

### Rego Policy Example
```rego
package chiral.security

# Deny if Cloud Storage bucket is public
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "google_storage_bucket"
    resource.change.after.uniform_bucket_level_access == false
    msg := sprintf("GCS Bucket %s must have uniform bucket level access enabled!", [resource.address])
}
```

## Comparison with Other Clouds

| Feature | GCP | AWS (LocalStack) | Azure (Azurite) |
|---------|-----|------------------|-----------------|
| Unified Tool | ❌ (Firebase Suite for Firebase) | ✅ (LocalStack) | ❌ (Fragmented) |
| Philosophy | Service-Specific Binaries | Unified Container | Fragmented Emulators |
| Setup Style | Moderate (Individual CLI) | High (Single Docker) | Medium (Docker + CLI) |
| Data Fidelity | High (Native Binaries) | Medium (API Mocks) | High (Storage/DB) |
| Serverless | ✅ (Firebase/Functions) | ✅ (LocalStack) | ✅ (Functions Tools) |
| IaC Validation | ✅ (Policy Controller/Gator) | ✅ (LocalStack/cdk-nag) | ✅ (azlocal/Bicep lint) |

## Firebase vs gcloud Emulators

| Aspect | Firebase Suite | gcloud Emulators |
|--------|----------------|------------------|
| Scope | Firebase ecosystem | Broader GCP services |
| UI | Rich web dashboard | CLI-only |
| Setup | Single command | Service-by-service |
| Integration | Tight Firebase coupling | Loose service coupling |
| Use Case | Firebase apps | General GCP development |

## Best Practices

1. **Use Firebase Suite for Firebase Projects**: Best DX for Firestore/Functions/Auth
2. **Combine Emulators**: Use gcloud to run multiple services together
3. **Policy Validation**: Use Gator/OPA for infrastructure compliance
4. **Container-First**: Test Cloud Run apps locally with Docker
5. **Real GCP for Complex Scenarios**: Networking, IAM, and specialized services

## Troubleshooting

- **Emulator Port Conflicts**: Each emulator needs unique ports
- **Java Dependencies**: Some emulators require Java runtime
- **Environment Variables**: Always source `env-init` commands
- **Firebase Auth**: May need real Firebase project for some features
- **Bigtable Emulator**: Limited HBase compatibility

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Setup GCP Emulators
  run: |
    gcloud beta emulators firestore start &
    gcloud beta emulators pubsub start &
    # Wait for startup
    sleep 10

- name: Run Tests
  run: |
    npm test
  env:
    FIRESTORE_EMULATOR_HOST: localhost:8080
    PUBSUB_EMULATOR_HOST: localhost:8085
```

## Future Developments

- **Unified GCP Emulator**: Google may provide a more unified solution
- **Enhanced Firebase Suite**: More services and better enterprise features
- **Policy Controller**: Continued improvements in policy-as-code
- **LocalStack GCP**: Emerging third-party support
