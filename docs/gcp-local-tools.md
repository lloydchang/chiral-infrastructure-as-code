# GCP Local Development Tools

This document covers local development tools for Google Cloud Platform, including the comprehensive Firebase Emulator Suite and individual gcloud-based simulators. These tools integrate with the expanded Chiral translation system for seamless GCP development.

## Tool Categories

### Emulators
Full GCP service simulation with API compatibility.

### Simulators
Lightweight tools for specific GCP component testing.

## Firebase Emulator Suite (GCP Emulator)

Firebase Emulator Suite is the most comprehensive local development environment for Firebase and GCP services, providing a unified testing platform.

### Features
- **Firestore/Realtime Database**: NoSQL database emulation with real-time sync
- **Authentication**: User authentication and authorization
- **Cloud Functions**: Serverless function execution
- **Cloud Storage**: File storage operations
- **Pub/Sub**: Message queuing
- **Hosting**: Static site serving
- **Web UI**: Browser-based dashboard for data inspection
- **Real-time Monitoring**: Function logs and performance metrics
- **Security Rules Testing**: Validate Firestore and Storage security rules
- **Hot Reloading**: Automatic updates on code changes

### Installation
```bash
npm install -g firebase-tools
```

### Usage
```bash
# Initialize Firebase project
firebase init

# Start all emulators
firebase emulators:start

# Start specific emulators
firebase emulators:start --only functions,firestore

# Start with UI
firebase emulators:start --ui
```

### Configuration
- **firebase.json**: Emulator configuration and port settings
- **.firebaserc**: Project settings and aliases
- **functions/.env.local**: Environment variables for functions

### Web Dashboard
- **URL**: http://localhost:4000 (when running)
- **Features**: 
  - View database data
  - Trigger functions manually
  - Monitor function logs
  - Test authentication flows

### Use Cases
- Full-stack Firebase application development
- Security rules validation
- Real-time feature testing
- Cloud Functions debugging
- Integration testing across Firebase services

### Chiral Integration
```bash
# Export to Firebase
chiral export gcp-emulator --tool firebase --config firebase.json

# Generate Firebase project structure
chiral export gcp-emulator --tool firebase --init

# Validate Firebase setup
chiral validate gcp-emulator --tool firebase --project my-project
```

## Google Cloud Emulators (gcloud Simulators)

Official GCP emulators provided through the gcloud CLI for individual service testing.

### Cloud Datastore/Firestore Emulator
```bash
# Start emulator
gcloud beta emulators datastore start --host-port=localhost:8081

# Set environment variables
$(gcloud beta emulators datastore env-init)

# Use in application
# Connect to localhost:8081
```

### Pub/Sub Emulator
```bash
# Start emulator
gcloud beta emulators pubsub start --host-port=localhost:8085

# Set environment
$(gcloud beta emulators pubsub env-init)

# Create topics/subscriptions
gcloud pubsub topics create my-topic --project=my-project
gcloud pubsub subscriptions create my-sub --topic=my-topic
```

### Cloud Functions Emulator
```bash
# Start emulator
gcloud beta emulators functions start --host-port=localhost:8000

# Deploy function locally
gcloud functions deploy my-function \
  --source=. \
  --runtime=nodejs16 \
  --trigger-http \
  --allow-unauthenticated
```

### Cloud Spanner Emulator
```bash
# Start emulator
gcloud beta emulators spanner start --host-port=localhost:9010

# Set environment
$(gcloud beta emulators spanner env-init)

# Create instance/database
gcloud spanner instances create test-instance \
  --config=emulator-config \
  --description="Test Instance" \
  --nodes=1

gcloud spanner databases create test-db --instance=test-instance
```

### Bigtable Emulator
```bash
# Start emulator
gcloud beta emulators bigtable start --host-port=localhost:8086

# Set environment
$(gcloud beta emulators bigtable env-init)

# Create instance/table
cbt createtable my-table
cbt createfamily my-table cf1
```

### Cloud Storage Emulator (fake-gcs-server)
Community tool for Cloud Storage simulation:
```bash
docker run -p 4443:4443 fsouza/fake-gcs-server:latest -scheme http
```

## Comparison Matrix

| Tool | Category | Startup Time | Resource Usage | Service Coverage | Best For |
|------|----------|-------------|----------------|------------------|----------|
| Firebase Suite | Emulator | Medium | Medium | Firebase ecosystem | Full-stack Firebase apps |
| Datastore/Firestore | Simulator | Fast | Low | NoSQL database | Database operations |
| Pub/Sub | Simulator | Fast | Low | Messaging | Event-driven workflows |
| Cloud Functions | Simulator | Medium | Medium | Serverless | Function development |
| Cloud Spanner | Simulator | Medium | Medium | Relational DB | SQL operations |
| Bigtable | Simulator | Medium | Medium | Wide-column DB | Analytics workloads |

## Development Workflows

### Firebase-Centric Development
1. Draft infrastructure with Chiral locally
2. Export to Firebase Emulator Suite
3. Develop with full Firebase ecosystem locally
4. Test security rules and real-time features
5. Deploy to Firebase/GCP

### GCP Service Development
1. Use individual gcloud emulators for specific services
2. Combine with Docker Compose for multi-service testing
3. Validate with Firebase Suite for integration
4. Deploy to GCP with Terraform

### CI/CD Integration
```yaml
# GitHub Actions workflow
name: GCP Local Testing
jobs:
  test-gcp-local:
    steps:
      - name: Setup Firebase
        run: |
          npm install -g firebase-tools
          firebase emulators:start --only firestore &
          # Wait for startup

      - name: Test Firestore
        run: |
          # Run Firestore tests
          npm test

      - name: Test Functions
        run: |
          gcloud beta emulators functions start &
          # Deploy and test functions

      - name: Integration Test
        run: |
          firebase emulators:start &
          # Run full integration tests
```

### Chiral GCP Workflow
```bash
# Complete GCP development cycle
chiral init my-gcp-app

# Test with simulators
chiral export gcp-simulator --tool gcloud-pubsub --validate
chiral export gcp-simulator --tool gcloud-functions --validate

# Validate with Firebase emulator
chiral export gcp-emulator --tool firebase --validate

# Deploy to production
chiral export gcp --config main.tf
terraform apply
```

## Docker Compose Orchestration

```yaml
version: '3.8'
services:
  firebase-emulator:
    image: firebase/emulator:latest
    ports:
      - "4000:4000"  # UI
      - "8080:8080"  # Firestore
      - "9099:9099"  # Auth
      - "5001:5001"  # Functions
    volumes:
      - ./firebase.json:/app/firebase.json
      - ./functions:/app/functions

  pubsub-emulator:
    image: google/cloud-sdk:latest
    command: gcloud beta emulators pubsub start --host-port=0.0.0.0:8085
    ports:
      - "8085:8085"

  spanner-emulator:
    image: google/cloud-sdk:latest
    command: gcloud beta emulators spanner start --host-port=0.0.0.0:9010
    ports:
      - "9010:9010"
```

## Best Practices

### Tool Selection
- **Full Firebase Apps**: Use Firebase Emulator Suite
- **Individual Services**: Use specific gcloud emulators
- **Integration Testing**: Combine Firebase with gcloud emulators
- **CI/CD**: Use lightweight simulators for speed

### Performance Optimization
- Use gcloud emulators for fast component testing
- Reserve Firebase Suite for comprehensive validation
- Run emulators in Docker for isolation

### Resource Management
- Monitor Firebase Suite memory usage
- Start/stop individual emulators as needed
- Use environment variables for configuration

### Testing Strategy
- Unit tests with gcloud emulators
- Integration tests with Firebase Suite
- Security rule tests with Firebase
- End-to-end tests in GCP

### Security Rules Testing
```javascript
// Example Firestore security rules test
const firebase = require('@firebase/testing');

const db = firebase.initializeTestApp({
  projectId: 'test-project',
  auth: { uid: 'alice' }
}).firestore();

// Test security rules
await firebase.assertSucceeds(
  db.collection('posts').doc('post1').get()
);
```

This comprehensive GCP local tools ecosystem, integrated with Chiral's bidirectional translation, enables efficient cloud-native development across the full GCP service spectrum, with special emphasis on the powerful Firebase development experience.
