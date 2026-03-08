# GCP Local Simulator Development

This example demonstrates using lightweight GCP service simulation for rapid development and testing with Chiral.

## Overview

The GCP simulator provides fast, lightweight mocking of Google Cloud Platform services without the overhead of full emulation. It's ideal for:

- Rapid prototyping
- Unit testing
- CI/CD pipelines
- Development workflows

## Prerequisites

- Node.js 18+
- Docker (optional, for containerized simulation)
- npm or yarn

## Quick Start

```bash
# Install dependencies
npm install

# Start the GCP simulator
npm run start:simulator

# Generate simulation artifacts
npx chiral generate --provider local

# Run simulation tests
npm run test:simulation
```

## Configuration

The `chiral.config.ts` is optimized for lightweight GCP simulation:

- **Network**: GCP VPC range `10.4.0.0/16`
- **Resources**: Minimal resource allocation
- **Storage**: 10GB for PostgreSQL simulation
- **Services**: Mock implementations of GCP services

## Usage

### Basic Simulation
```bash
# Generate simulation scripts
npx chiral generate --provider local

# Run GCP service simulations
./scripts/simulate-gcp-services.sh

# Test application against simulation
npm run test:integration
```

### Containerized Simulation
```bash
# Build simulator container
docker build -t gcp-simulator .

# Run simulation container
docker run -p 8080:8080 gcp-simulator

# Connect to simulator
export GCP_ENDPOINT_URL=http://localhost:8080
```

## Generated Artifacts

- `scripts/simulate-gcp-services.sh` - GCP service simulation scripts
- `mocks/gcp-services.js` - Mock GCP service implementations
- `tests/simulation/` - Integration tests for simulation
- `docker/Dockerfile` - Containerized simulator

## Architecture

```
GCP Simulator (localhost:8080)
├── Service Mocks
│   ├── GKE Mock
│   ├── Cloud SQL Mock
│   ├── Firestore Mock
│   └── Cloud Identity Mock
├── Data Store
│   └── In-memory storage
├── API Layer
│   └── HTTP endpoints
└── Test Harness
    └── Integration tests
```

## Simulation Features

### GKE Simulation
```javascript
// Mock GKE cluster operations
const mockGKE = {
  createCluster: (params) => ({ cluster: { status: 'RUNNING' } }),
  describeCluster: (params) => ({ cluster: { endpoint: 'localhost:8080' } }),
  listNodes: () => ({ nodes: mockNodes })
};
```

### Cloud SQL Simulation
```javascript
// Mock Cloud SQL operations
const mockCloudSQL = {
  createInstance: (params) => ({ instance: { state: 'RUNNABLE' } }),
  listInstances: () => ({ instances: [mockInstance] }),
  connect: () => mockPostgresConnection
};
```

### Firestore Simulation
```javascript
// Mock Firestore operations
const mockFirestore = {
  createDocument: (params) => ({ name: 'mock-document' }),
  listDocuments: () => ({ documents: mockDocuments }),
  getDocument: (params) => ({ fields: mockFields })
};
```

## Development Workflow

1. **Setup Simulation**
   ```bash
   npm run setup:simulator
   ```

2. **Generate Artifacts**
   ```bash
   npx chiral generate --provider local
   ```

3. **Run Tests**
   ```bash
   npm run test:simulation
   npm run test:integration
   ```

4. **Develop Application**
   ```bash
   npm run dev
   ```

5. **Validate Against Simulation**
   ```bash
   npm run validate:simulation
   ```

## Testing with Simulation

### Unit Tests
```javascript
// Test against simulated GCP services
describe('GCP Service Integration', () => {
  test('should create GKE cluster', async () => {
    const result = await gke.createCluster(mockParams);
    expect(result.cluster.status).toBe('RUNNING');
  });
});
```

### Integration Tests
```bash
# Run full integration test suite
npm run test:integration

# Test specific service
npm run test:firestore
npm run test:gke
npm run test:sql
```

## Performance Benefits

GCP simulation provides significant performance advantages:

- **Startup Time**: < 5 seconds vs 2+ minutes for Firebase emulators
- **Memory Usage**: < 512MB vs 4GB+ for full emulation
- **API Response**: < 10ms vs 100ms+ for emulated services
- **Resource Efficiency**: 90% less CPU and memory usage

## CI/CD Integration

### GitHub Actions
```yaml
- name: Start GCP Simulator
  run: |
    npm run start:simulator &
    sleep 5

- name: Run Integration Tests
  run: npm run test:integration
  env:
    GCP_ENDPOINT_URL: http://localhost:8080
```

### Google Cloud Build
```yaml
steps:
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['install']
  
  - name: 'node:18'
    entrypoint: 'npm'
    args: ['run', 'test:integration']
    env:
      - GCP_ENDPOINT_URL=http://localhost:8080
```

## Mock Data Management

### Custom Mock Data
```javascript
// mocks/custom-data.js
export const mockData = {
  clusters: ['dev-cluster', 'test-cluster'],
  databases: ['postgres-dev', 'postgres-test'],
  collections: ['users', 'products']
};
```

### Data Persistence
```bash
# Save simulation state
npm run save:simulation-state

# Load simulation state
npm run load:simulation-state

# Reset simulation data
npm run reset:simulation
```

## Monitoring and Debugging

### Simulation Logs
```bash
# View simulation logs
npm run logs:simulator

# Debug specific service
npm run debug:gke
npm run debug:sql
npm run debug:firestore
```

### Health Checks
```bash
# Check simulator health
curl http://localhost:8080/health

# Check service status
curl http://localhost:8080/services/status
```

## GCP Service APIs

### Firestore Operations
```bash
# Create document
curl -X POST http://localhost:8080/firestore/v1/projects/gcp-simulator-app/databases/(default)/documents/users \
  -H "Content-Type: application/json" \
  -d '{"fields": {"name": {"stringValue": "John Doe"}}}'

# List documents
curl http://localhost:8080/firestore/v1/projects/gcp-simulator-app/databases/(default)/documents/users
```

### GKE Operations
```bash
# Create cluster
curl -X POST http://localhost:8080/v1/projects/gcp-simulator-app/zones/us-central1-a/clusters \
  -H "Content-Type: application/json" \
  -d '{"cluster": {"name": "test-cluster"}}'

# Get cluster status
curl http://localhost:8080/v1/projects/gcp-simulator-app/zones/us-central1-a/clusters/test-cluster
```

### Cloud SQL Operations
```bash
# Create instance
curl -X POST http://localhost:8080/v1/projects/gcp-simulator-app/instances \
  -H "Content-Type: application/json" \
  -d '{"instance": {"name": "test-instance", "databaseVersion": "POSTGRES_15"}}'

# Connect to database
curl http://localhost:8080/v1/projects/gcp-simulator-app/instances/test-instance/connect
```

## Migration Path

### From Simulation to Emulation
```bash
# Export simulation configuration
npm run export:config

# Generate Firebase emulator configuration
npx chiral generate --provider gcp-local-emulator

# Import configuration
npm run import:config
```

### From Simulation to Production
```bash
# Generate production GCP artifacts
npx chiral generate --provider gcp

# Validate production readiness
npm run validate:production

# Deploy to GCP
npm run deploy:production
```

## Advanced Configuration

### Custom Service Mocks
```javascript
// mocks/custom-services.js
export const customServiceMock = {
  customOperation: (params) => {
    // Custom mock logic
    return { result: 'mocked' };
  }
};
```

### Simulation Configuration
```json
{
  "simulation": {
    "services": ["gke", "sql", "firestore"],
    "delay": 0,
    "errorRate": 0,
    "persistence": true
  }
}
```

## Troubleshooting

### Common Issues

1. **Simulator Not Starting**
   ```bash
   # Check port availability
   lsof -i :8080
   
   # Kill existing process
   pkill -f gcp-simulator
   ```

2. **Mock Data Issues**
   ```bash
   # Reset mock data
   npm run reset:mock-data
   
   # Validate mock configuration
   npm run validate:mocks
   ```

3. **Performance Issues**
   ```bash
   # Check memory usage
   npm run check:performance
   
   # Optimize simulation
   npm run optimize:simulator
   ```

## Best Practices

1. **Use simulation for rapid development**
2. **Validate against real GCP services before production**
3. **Keep mock data realistic but minimal**
4. **Use simulation in CI/CD for fast feedback**
5. **Document any simulation-specific behavior**

## Limitations

- **No real GCP API compatibility**
- **Limited service coverage**
- **No actual resource creation**
- **Simplified error handling**
- **No billing or cost tracking**

## Development Tools

### VS Code Extensions
- Cloud Code Extension
- Firebase Extension
- Docker Extension
- Terraform Extension

### Debugging Tools
```bash
# Enable debug mode
DEBUG=gcp-simulator:* npm run start:simulator

# Run with inspector
node --inspect ./src/simulator.js
```

## Performance Comparison

| Feature | Simulation | Firebase Emulators | Production GCP |
|---------|------------|-------------------|---------------|
| Startup Time | < 5s | 30-60s | N/A |
| Memory Usage | < 512MB | 2-4GB | N/A |
| API Response | < 10ms | 50-200ms | 100-500ms |
| Cost | Free | Free | $300+/month |

## Next Steps

1. Explore the GCP Local Emulator example for full API compatibility
2. Review production deployment examples
3. Learn about multi-cloud configurations
4. Understand GCP compliance and security requirements
5. Explore Cloud Functions development with simulation
6. Learn about Google Cloud Build integration
