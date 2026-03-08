# GCP Local Emulator Development

This example demonstrates using Firebase emulators and GCP emulators for local development with Chiral.

## Prerequisites

- Node.js 18+
- Docker installed and running
- Docker Compose
- Firebase CLI
- At least 4GB RAM available

## Quick Start

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize Firebase emulators
firebase init emulators

# Start Firebase emulators
firebase emulators:start --project=gcp-emulator-app

# Generate GCP emulator artifacts
npx chiral generate --provider local

# Start additional services
docker-compose up -d
```

## Configuration

The `chiral.config.ts` is optimized for GCP emulation:

- **Region**: Uses `localhost:4000` for Firebase emulator endpoint
- **Network**: GCP VPC range `10.3.0.0/16`
- **Services**: GKE, Cloud SQL, and other GCP services emulated
- **Storage**: Local state management with Firebase emulators

## Usage

```bash
# Generate GCP emulator artifacts
npx chiral generate --provider local

# Start Firebase emulators
firebase emulators:start --project=gcp-emulator-app

# Apply Terraform configuration
cd terraform/firebase-emulator
terraform init
terraform apply

# Test GCP services locally
gcloud auth login --no-browser
gcloud config set project gcp-emulator-app
```

## Generated Artifacts

- `firebase.json` - Firebase emulator configuration
- `docker-compose.yml` - Additional service definitions
- `terraform/firebase-emulator/` - Terraform configurations
- Kubernetes manifests for GKE emulation
- Cloud SQL configurations

## Architecture

```
GCP Emulators (localhost:4000-9199)
├── Firebase Emulators
│   ├── Firestore (Port 4000)
│   ├── Realtime Database (Port 9000)
│   ├── Auth (Port 9099)
│   ├── Storage (Port 9199)
│   └── Functions (Port 5001)
├── GKE Emulation
│   ├── Kubernetes Control Plane
│   └── Worker Nodes
├── Cloud SQL Emulation
│   └── PostgreSQL Instance
└── Cloud Identity Emulation
    └── Identity Services
```

## Development Workflow

1. Start Firebase emulators
2. Generate Chiral artifacts
3. Apply Terraform configurations
4. Develop and test applications
5. Validate against GCP APIs locally

## Testing GCP Services

### Firestore Operations
```bash
# Create document
curl -X POST http://localhost:4000/firestore/v1/projects/gcp-emulator-app/databases/(default)/documents/users \
  -H "Content-Type: application/json" \
  -d '{"fields": {"name": {"stringValue": "John Doe"}}}'

# List documents
curl http://localhost:4000/firestore/v1/projects/gcp-emulator-app/databases/(default)/documents/users
```

### Realtime Database Operations
```bash
# Write data
curl -X PUT http://localhost:9000/gcp-emulator-app/users/user1.json \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# Read data
curl http://localhost:9000/gcp-emulator-app/users/user1.json
```

### Authentication Operations
```bash
# Create user
curl -X POST http://localhost:9099/identitytoolkit.googleapis.com/v1/projects/gcp-emulator-app/accounts \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Storage Operations
```bash
# Upload file
curl -X POST http://localhost:9199/upload/storage/v1/b/gcp-emulator-app.appspot.com/o \
  -H "Content-Type: application/json" \
  -d '{"name": "test.txt"}'
```

## Firebase Emulator Configuration

```json
{
  "emulators": {
    "firestore": {
      "port": 4000
    },
    "database": {
      "port": 9000
    },
    "auth": {
      "port": 9099
    },
    "storage": {
      "port": 9199
    },
    "functions": {
      "port": 5001
    },
    "ui": {
      "enabled": true,
      "port": 4001
    }
  },
  "projects": {
    "gcp-emulator-app": {
      "projectId": "gcp-emulator-app",
      "location": "us-central1"
    }
  }
}
```

## Docker Compose Configuration

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: gcp-emulator-app
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  gke-simulator:
    image: kindest/node:v1.27.3
    ports:
      - "6443:6443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

volumes:
  postgres_data:
```

## Firebase Emulator UI

Access the Firebase Emulator UI at `http://localhost:4001`:

- **Firestore** - Database viewer and editor
- **Realtime Database** - Database tree view
- **Authentication** - User management
- **Storage** - File browser
- **Functions** - Function logs

## Monitoring and Debugging

```bash
# Check Firebase emulator logs
firebase emulators:start --project=gcp-emulator-app --debug

# Monitor service health
curl http://localhost:4000/firestore/v1/projects/gcp-emulator-app

# View emulator status
firebase emulators:start --project=gcp-emulator-app --only firestore
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Start Firebase Emulators
  run: |
    firebase emulators:start --project=gcp-emulator-app &
    sleep 30

- name: Run Tests
  run: npm test
  env:
    FIREBASE_EMULATOR_HOST: localhost
    FIRESTORE_EMULATOR_PORT: 4000
```

### Google Cloud Build
```yaml
steps:
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['install']
  
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['run', 'test:emulators']
    env:
      - FIREBASE_CONFIG={"projectId":"gcp-emulator-app"}
```

## Migration to Production

When ready to migrate to GCP:

```bash
# Generate production GCP artifacts
npx chiral generate --provider gcp

# Authenticate with GCP
gcloud auth login
gcloud config set project your-production-project

# Apply to production
cd terraform/gcp
terraform init
terraform apply
```

## Advanced Configuration

### Custom Firebase Configuration
```json
{
  "emulators": {
    "firestore": {
      "port": 4000,
      "rules": "firestore.rules"
    },
    "database": {
      "port": 9000,
      "rules": "database.rules.json"
    }
  }
}
```

### Multiple Projects
```json
{
  "projects": {
    "dev": {
      "projectId": "gcp-emulator-app-dev",
      "location": "us-central1"
    },
    "test": {
      "projectId": "gcp-emulator-app-test",
      "location": "us-east1"
    }
  }
}
```

## Cost Analysis

Firebase emulators provide free local emulation:

```bash
# Compare costs
npx chiral analyze-costs --providers local,gcp

# Expected output:
# - Local: $0/month
# - GCP: $~350/month (equivalent services)
```

## Troubleshooting

### Common Issues

1. **Firebase Emulators Not Starting**
   ```bash
   # Check Firebase CLI version
   firebase --version
   
   # Update Firebase CLI
   npm install -g firebase-tools@latest
   
   # Check port conflicts
   lsof -i :4000
   lsof -i :9000
   ```

2. **Authentication Issues**
   ```bash
   # Reset Firebase configuration
   firebase logout
   firebase login --no-localhost
   
   # Check project configuration
   firebase projects:list
   ```

3. **Database Connection Issues**
   ```bash
   # Check Firestore rules
   firebase deploy --only firestore:rules
   
   # Verify database initialization
   curl http://localhost:4000/firestore/v1/projects/gcp-emulator-app
   ```

## Development Tools

### VS Code Extensions
- Firebase Extension
- Cloud Code Extension
- Docker Extension
- Terraform Extension

### Debugging Tools
```bash
# Enable debug mode
DEBUG=firebase:* firebase emulators:start

# Run with inspector
node --inspect ./node_modules/.bin/firebase emulators:start
```

## Best Practices

1. **Use Firebase emulators for local development**
2. **Validate against real GCP services before production**
3. **Keep emulator configurations in version control**
4. **Use environment-specific configurations**
5. **Regular backup of local emulator data**

## Performance Optimization

```bash
# Start only needed emulators
firebase emulators:start --only firestore,auth

# Use in-memory storage for faster tests
firebase emulators:start --project=gcp-emulator-app --import=./export-data
```

## Next Steps

1. Explore the GCP Local Simulator example for lightweight simulation
2. Review production deployment examples
3. Learn about multi-cloud configurations
4. Understand GCP compliance and security requirements
5. Explore Cloud Functions development with emulators
