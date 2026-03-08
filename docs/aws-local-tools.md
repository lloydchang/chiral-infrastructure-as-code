# AWS Local Development Tools

This document covers local development tools for AWS, including the comprehensive LocalStack emulator and various simulators for component-level testing. These tools integrate seamlessly with the expanded Chiral translation system.

## Tool Categories

### Emulators
Full AWS environment simulation with API compatibility.

### Simulators
Lightweight tools for specific AWS service testing.

## LocalStack (AWS Emulator)

LocalStack is the most comprehensive local AWS cloud emulator, providing API-compatible simulation of 100+ AWS services.

### Features
- **Comprehensive Service Coverage**: S3, Lambda, DynamoDB, SQS, SNS, API Gateway, CloudFormation, and more
- **Single Container**: All services in one Docker container
- **Cross-Service Interactions**: Services communicate locally (S3 → Lambda → DynamoDB)
- **CloudFormation Support**: Deploy CloudFormation templates locally
- **State Persistence**: Maintain data between container restarts
- **Pro Tier**: Advanced services (RDS, Cognito, etc.)

### Installation
```bash
# Run LocalStack
docker run -d -p 4566:4566 localstack/localstack

# Configure AWS CLI
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566
```

### Use Cases
- Full-stack AWS application development
- Integration testing across multiple services
- CloudFormation template validation
- Development without AWS costs

### Chiral Integration
```bash
# Export to LocalStack
chiral export aws-emulator --endpoint http://localhost:4566

# Import from LocalStack
chiral import aws-emulator --endpoint http://localhost:4566

# Validate LocalStack deployment
chiral validate aws-emulator --services s3,lambda,dynamodb
```

## AWS SAM CLI (Simulator)

Serverless Application Model command-line interface for local serverless development.

### Features
- Local Lambda function execution
- API Gateway simulation
- Step Functions local testing
- Hot reloading during development
- Event source integration
- X-Ray tracing support

### Installation
```bash
# Install SAM CLI
pip install aws-sam-cli

# Or via Homebrew (macOS)
brew install aws-sam-cli
```

### Usage
```bash
# Initialize SAM project
sam init

# Build application
sam build

# Run locally
sam local start-api

# Invoke function
sam local invoke MyFunction

# Generate event
sam local generate-event s3 put
```

### Use Cases
- Serverless function development
- API Gateway testing
- Event-driven architecture testing
- Local debugging

### Chiral Integration
```bash
# Export SAM template
chiral export aws-simulator --format sam

# Generate SAM configuration
chiral export aws-simulator --template-file template.yaml

# Validate SAM deployment
chiral validate aws-simulator --template template.yaml
```

## Moto (Simulator)

Python library that mocks AWS services for testing.

### Features
- In-process AWS service mocking
- Comprehensive service coverage
- Python unit test integration
- Lightweight and fast
- Decorator-based usage
- Context manager support

### Installation
```bash
pip install moto
```

### Usage
```python
import boto3
from moto import mock_s3

@mock_s3
def test_s3_operations():
    client = boto3.client('s3', region_name='us-east-1')
    client.create_bucket(Bucket='test-bucket')
    # Test operations...
```

### Use Cases
- Python unit testing
- Fast CI/CD pipelines
- Isolated service testing
- Development without AWS credentials

### Chiral Integration
```bash
# Generate Moto test fixtures
chiral export aws-simulator --tool moto --output test_fixtures.py

# Import from Moto mock
chiral import aws-simulator --mock-file test_moto.py

# Validate Moto compatibility
chiral validate aws-simulator --tool moto --services s3,dynamodb
```

## Serverless Offline (Simulator)

Node.js plugin for the Serverless Framework providing local serverless simulation.

### Features
- Local Lambda and API Gateway
- Hot reloading
- Serverless Framework integration
- Environment variable support
- CORS handling
- Custom authorizers

### Installation
```bash
npm install serverless-offline --save-dev
```

### Configuration
```yaml
# serverless.yml
plugins:
  - serverless-offline

functions:
  hello:
    handler: handler.hello
    events:
      - http:
          path: hello
          method: get
```

### Usage
```bash
# Start local server
serverless offline

# Start on specific port
serverless offline --port 4000
```

### Use Cases
- Node.js serverless development
- Serverless Framework workflows
- API testing and debugging
- Local development with hot reload

### Chiral Integration
```bash
# Export Serverless configuration
chiral export aws-simulator --tool serverless-offline --config serverless.yml

# Generate handler templates
chiral export aws-simulator --tool serverless-offline --functions

# Validate Serverless setup
chiral validate aws-simulator --tool serverless-offline
```

## Comparison Matrix

| Tool | Category | Startup Time | Resource Usage | Service Coverage | Best For |
|------|----------|-------------|----------------|------------------|----------|
| LocalStack | Emulator | Slow | High | 100+ services | Integration testing |
| SAM CLI | Simulator | Medium | Medium | Serverless focused | Function development |
| Moto | Simulator | Fast | Low | Most services | Unit testing |
| Serverless Offline | Simulator | Medium | Medium | Serverless focused | Framework development |

## Development Workflows

### Local-First Development
1. Draft infrastructure with Chiral locally
2. Test components with simulators (Moto, Serverless Offline)
3. Validate integration with LocalStack
4. Deploy to AWS with SAM

### CI/CD Integration
```yaml
# GitHub Actions workflow
name: AWS Local Testing
jobs:
  test-aws-local:
    steps:
      - name: Test with Moto
        run: |
          pip install moto boto3
          python -m pytest tests/ -v

      - name: Test with SAM
        run: |
          sam build
          sam local invoke

      - name: Test with LocalStack
        run: |
          docker run -d -p 4566:4566 localstack/localstack
          sleep 30
          # Run integration tests
```

### Chiral AWS Workflow
```bash
# Complete AWS development cycle
chiral init my-aws-app

# Test with simulators
chiral export aws-simulator --tool moto --validate
chiral export aws-simulator --tool sam --validate

# Validate with emulator
chiral export aws-emulator --tool localstack --validate

# Deploy to production
chiral export aws --template cloudformation.json
aws cloudformation deploy --template-file cloudformation.json
```

## Best Practices

### Tool Selection
- **Unit Testing**: Use Moto for fast, isolated tests
- **Function Development**: Use SAM CLI for serverless workflows
- **Framework Development**: Use Serverless Offline for Serverless Framework
- **Integration Testing**: Use LocalStack for full-stack validation

### Performance Optimization
- Use simulators for development iteration
- Reserve LocalStack for comprehensive testing
- Run emulators in Docker for isolation

### Resource Management
- Start/stop LocalStack as needed
- Use Moto's decorators for test isolation
- Monitor memory usage with LocalStack

### Testing Strategy
- Unit tests with Moto
- Component tests with SAM/Serverless Offline
- Integration tests with LocalStack
- End-to-end tests in AWS

This comprehensive AWS local tools ecosystem, integrated with Chiral's translation capabilities, enables efficient cloud-native development across the full AWS service spectrum.
