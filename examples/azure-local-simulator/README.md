# Azure Local Simulator Development

This example demonstrates using lightweight Azure service simulation for rapid development and testing with Chiral.

## Overview

The Azure simulator provides fast, lightweight mocking of Azure services without the overhead of full emulation. It's ideal for:

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

# Start the Azure simulator
npm run start:simulator

# Generate simulation artifacts
npx chiral generate --provider local

# Run simulation tests
npm run test:simulation
```

## Configuration

The `chiral.config.ts` is optimized for lightweight Azure simulation:

- **Network**: Azure VNet range `10.2.0.0/16`
- **Resources**: Minimal resource allocation
- **Storage**: 10GB for PostgreSQL simulation
- **Services**: Mock implementations of Azure services

## Usage

### Basic Simulation
```bash
# Generate simulation scripts
npx chiral generate --provider local

# Run Azure service simulations
./scripts/simulate-azure-services.sh

# Test application against simulation
npm run test:integration
```

### Containerized Simulation
```bash
# Build simulator container
docker build -t azure-simulator .

# Run simulation container
docker run -p 7070:7070 azure-simulator

# Connect to simulator
export AZURE_ENDPOINT_URL=http://localhost:7070
```

## Generated Artifacts

- `scripts/simulate-azure-services.sh` - Azure service simulation scripts
- `mocks/azure-services.js` - Mock Azure service implementations
- `tests/simulation/` - Integration tests for simulation
- `docker/Dockerfile` - Containerized simulator

## Architecture

```
Azure Simulator (localhost:7070)
├── Service Mocks
│   ├── AKS Mock
│   ├── Azure Database Mock
│   ├── Storage Mock
│   └── Azure AD Mock
├── Data Store
│   └── In-memory storage
├── API Layer
│   └── HTTP endpoints
└── Test Harness
    └── Integration tests
```

## Simulation Features

### AKS Simulation
```javascript
// Mock AKS cluster operations
const mockAKS = {
  createCluster: (params) => ({ cluster: { status: 'Running' } }),
  describeCluster: (params) => ({ cluster: { fqdn: 'localhost:7070' } }),
  listNodes: () => ({ nodes: mockNodes })
};
```

### Azure Database Simulation
```javascript
// Mock Azure Database operations
const mockAzureDB = {
  createServer: (params) => ({ server: { state: 'Ready' } }),
  listServers: () => ({ servers: [mockServer] }),
  connect: () => mockPostgresConnection
};
```

### Storage Simulation
```javascript
// Mock Azure Storage operations
const mockStorage = {
  createContainer: (params) => ({ name: 'mock-container' }),
  listBlobs: () => ({ blobs: mockBlobs }),
  getBlob: (params) => ({ content: mockData })
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
// Test against simulated Azure services
describe('Azure Service Integration', () => {
  test('should create AKS cluster', async () => {
    const result = await aks.createCluster(mockParams);
    expect(result.cluster.status).toBe('Running');
  });
});
```

### Integration Tests
```bash
# Run full integration test suite
npm run test:integration

# Test specific service
npm run test:storage
npm run test:aks
npm run test:database
```

## Performance Benefits

Azure simulation provides significant performance advantages:

- **Startup Time**: < 5 seconds vs 2+ minutes for Azurite
- **Memory Usage**: < 512MB vs 4GB+ for full emulation
- **API Response**: < 10ms vs 100ms+ for emulated services
- **Resource Efficiency**: 90% less CPU and memory usage

## CI/CD Integration

### GitHub Actions
```yaml
- name: Start Azure Simulator
  run: |
    npm run start:simulator &
    sleep 5

- name: Run Integration Tests
  run: npm run test:integration
  env:
    AZURE_ENDPOINT_URL: http://localhost:7070
```

### Azure DevOps Pipeline
```yaml
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'

- script: |
    npm run start:simulator
    npm run test:integration
  env:
    AZURE_ENDPOINT_URL: http://localhost:7070
```

## Mock Data Management

### Custom Mock Data
```javascript
// mocks/custom-data.js
export const mockData = {
  containers: ['test-container-1', 'test-container-2'],
  databases: ['postgres-dev', 'postgres-test'],
  clusters: ['dev-cluster', 'test-cluster']
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
npm run debug:aks
npm run debug:database
npm run debug:storage
```

### Health Checks
```bash
# Check simulator health
curl http://localhost:7070/health

# Check service status
curl http://localhost:7070/services/status
```

## Azure Service APIs

### Storage Operations
```bash
# Create container
curl -X POST http://localhost:7070/storage/containers \
  -H "Content-Type: application/json" \
  -d '{"name": "test-container"}'

# List blobs
curl http://localhost:7070/storage/containers/test-container/blobs
```

### AKS Operations
```bash
# Create cluster
curl -X POST http://localhost:7070/aks/clusters \
  -H "Content-Type: application/json" \
  -d '{"name": "test-cluster", "region": "eastus"}'

# Get cluster status
curl http://localhost:7070/aks/clusters/test-cluster
```

### Database Operations
```bash
# Create database server
curl -X POST http://localhost:7070/database/servers \
  -H "Content-Type: application/json" \
  -d '{"name": "test-server", "version": "15"}'

# Connect to database
curl http://localhost:7070/database/servers/test-server/connect
```

## Migration Path

### From Simulation to Emulation
```bash
# Export simulation configuration
npm run export:config

# Generate Azurite configuration
npx chiral generate --provider azure-local-emulator

# Import configuration
npm run import:config
```

### From Simulation to Production
```bash
# Generate production Azure artifacts
npx chiral generate --provider azure

# Validate production readiness
npm run validate:production

# Deploy to Azure
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
    "services": ["aks", "database", "storage"],
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
   lsof -i :7070
   
   # Kill existing process
   pkill -f azure-simulator
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
2. **Validate against real Azure services before production**
3. **Keep mock data realistic but minimal**
4. **Use simulation in CI/CD for fast feedback**
5. **Document any simulation-specific behavior**

## Limitations

- **No real Azure API compatibility**
- **Limited service coverage**
- **No actual resource creation**
- **Simplified error handling**
- **No billing or cost tracking**

## Development Tools

### VS Code Extensions
- Azure Storage Extension
- Azure Account Extension
- Docker Extension
- Terraform Extension

### Debugging Tools
```bash
# Enable debug mode
DEBUG=azure-simulator:* npm run start:simulator

# Run with inspector
node --inspect ./src/simulator.js
```

## Next Steps

1. Explore the Azure Local Emulator example for full API compatibility
2. Review production deployment examples
3. Learn about multi-cloud configurations
4. Understand Azure compliance and security requirements
5. Explore Azure DevOps integration
