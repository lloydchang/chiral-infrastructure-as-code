# AWS Local Simulator Development

This example demonstrates using lightweight AWS service simulation for rapid development and testing with Chiral.

## Overview

The simulator provides fast, lightweight mocking of AWS services without the overhead of full emulation. It's ideal for:

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

# Start the simulator
npm run start:simulator

# Generate simulation artifacts
npx chiral generate --provider local

# Run simulation tests
npm run test:simulation
```

## Configuration

The `chiral.config.ts` is optimized for lightweight simulation:

- **Network**: Standard `10.0.0.0/16` private network
- **Resources**: Minimal resource allocation
- **Storage**: 10GB for PostgreSQL simulation
- **Services**: Mock implementations of AWS services

## Usage

### Basic Simulation
```bash
# Generate simulation scripts
npx chiral generate --provider local

# Run AWS service simulations
./scripts/simulate-aws-services.sh

# Test application against simulation
npm run test:integration
```

### Containerized Simulation
```bash
# Build simulator container
docker build -t aws-simulator .

# Run simulation container
docker run -p 8080:8080 aws-simulator

# Connect to simulator
export AWS_ENDPOINT_URL=http://localhost:8080
```

## Generated Artifacts

- `scripts/simulate-aws-services.sh` - AWS service simulation scripts
- `mocks/aws-services.js` - Mock AWS service implementations
- `tests/simulation/` - Integration tests for simulation
- `docker/Dockerfile` - Containerized simulator

## Architecture

```
AWS Simulator (localhost:8080)
├── Service Mocks
│   ├── EKS Mock
│   ├── RDS Mock
│   ├── S3 Mock
│   └── Lambda Mock
├── Data Store
│   └── In-memory storage
├── API Layer
│   └── HTTP endpoints
└── Test Harness
    └── Integration tests
```

## Simulation Features

### EKS Simulation
```javascript
// Mock EKS cluster operations
const mockEKS = {
  createCluster: (params) => ({ cluster: { status: 'ACTIVE' } }),
  describeCluster: (params) => ({ cluster: { endpoint: 'localhost:8080' } }),
  listNodes: () => ({ nodes: mockNodes })
};
```

### RDS Simulation
```javascript
// Mock RDS database operations
const mockRDS = {
  createDBInstance: (params) => ({ DBInstance: { status: 'available' } }),
  describeDBInstances: () => ({ DBInstances: [mockDBInstance] }),
  connect: () => mockPostgresConnection
};
```

### S3 Simulation
```javascript
// Mock S3 operations
const mockS3 = {
  createBucket: (params) => ({ Location: '/mock-bucket' }),
  listObjects: () => ({ Contents: mockObjects }),
  getObject: (params) => ({ Body: mockData })
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
// Test against simulated AWS services
describe('AWS Service Integration', () => {
  test('should create EKS cluster', async () => {
    const result = await eks.createCluster(mockParams);
    expect(result.cluster.status).toBe('ACTIVE');
  });
});
```

### Integration Tests
```bash
# Run full integration test suite
npm run test:integration

# Test specific service
npm run test:s3
npm run test:eks
npm run test:rds
```

## Performance Benefits

Simulation provides significant performance advantages:

- **Startup Time**: < 5 seconds vs 2+ minutes for LocalStack
- **Memory Usage**: < 512MB vs 4GB+ for full emulation
- **API Response**: < 10ms vs 100ms+ for emulated services
- **Resource Efficiency**: 90% less CPU and memory usage

## CI/CD Integration

### GitHub Actions
```yaml
- name: Start AWS Simulator
  run: |
    npm run start:simulator &
    sleep 5

- name: Run Integration Tests
  run: npm run test:integration
  env:
    AWS_ENDPOINT_URL: http://localhost:8080
```

### Jenkins Pipeline
```groovy
stage('Simulation Test') {
    steps {
        sh 'npm run start:simulator'
        sh 'npm run test:integration'
    }
}
```

## Mock Data Management

### Custom Mock Data
```javascript
// mocks/custom-data.js
export const mockData = {
  buckets: ['test-bucket-1', 'test-bucket-2'],
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
npm run debug:eks
npm run debug:rds
npm run debug:s3
```

### Health Checks
```bash
# Check simulator health
curl http://localhost:8080/health

# Check service status
curl http://localhost:8080/services/status
```

## Migration Path

### From Simulation to Emulation
```bash
# Export simulation configuration
npm run export:config

# Generate LocalStack configuration
npx chiral generate --provider aws-local-emulator

# Import configuration
npm run import:config
```

### From Simulation to Production
```bash
# Generate production artifacts
npx chiral generate --provider aws

# Validate production readiness
npm run validate:production

# Deploy to AWS
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
    "services": ["eks", "rds", "s3"],
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
   pkill -f aws-simulator
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
2. **Validate against real AWS services before production**
3. **Keep mock data realistic but minimal**
4. **Use simulation in CI/CD for fast feedback**
5. **Document any simulation-specific behavior**

## Limitations

- **No real AWS API compatibility**
- **Limited service coverage**
- **No actual resource creation**
- **Simplified error handling**
- **No billing or cost tracking**

## Next Steps

1. Explore the AWS Local Emulator example for full API compatibility
2. Review production deployment examples
3. Learn about multi-cloud configurations
4. Understand compliance and security requirements
