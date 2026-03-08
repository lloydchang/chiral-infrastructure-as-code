# AWS Local Emulator Development

This example demonstrates using LocalStack to emulate AWS services locally with Chiral.

## Prerequisites

- Docker installed and running
- Docker Compose
- AWS CLI (configured for LocalStack)
- At least 4GB RAM available

## Quick Start

```bash
# Start LocalStack
docker-compose up -d

# Wait for services to be ready
curl http://localhost:4566/_localstack/health

# Configure AWS CLI for LocalStack
aws configure set aws_access_key_id test
aws configure set aws_secret_access_key test
aws configure set region us-east-1
aws configure set default.endpoint_url http://localhost:4566
```

## Configuration

The `chiral.config.ts` is optimized for LocalStack emulation:

- **Region**: Uses `localhost:4566` for LocalStack endpoint
- **Network**: Private network `172.16.0.0/16` for emulation
- **Services**: EKS, RDS, and other AWS services emulated
- **Storage**: Local state management

## Usage

```bash
# Generate LocalStack artifacts
npx chiral generate --provider local

# Start the emulator environment
docker-compose up -d

# Apply Terraform configuration
cd terraform/localstack
terraform init
terraform apply

# Test AWS services locally
aws s3 ls --endpoint-url http://localhost:4566
aws dynamodb list-tables --endpoint-url http://localhost:4566
```

## Generated Artifacts

- `docker-compose.yml` - LocalStack and service definitions
- `terraform/localstack/` - Terraform configurations for LocalStack
- Kubernetes manifests for EKS emulation
- RDS PostgreSQL configurations

## Architecture

```
LocalStack (localhost:4566)
├── EKS Emulation
│   ├── Kubernetes Control Plane
│   └── Worker Nodes
├── RDS Emulation
│   └── PostgreSQL Instance
├── S3 Emulation
│   └── Object Storage
├── DynamoDB Emulation
│   └── NoSQL Database
└── Lambda Emulation
    └── Function Runtime
```

## Development Workflow

1. Start LocalStack with Docker Compose
2. Generate Chiral artifacts
3. Apply Terraform configurations
4. Develop and test applications
5. Validate against AWS APIs locally

## Testing AWS Services

### S3 Operations
```bash
# Create bucket
aws s3 mb s3://test-bucket --endpoint-url http://localhost:4566

# List objects
aws s3 ls s3://test-bucket --endpoint-url http://localhost:4566
```

### DynamoDB Operations
```bash
# Create table
aws dynamodb create-table \
  --table-name TestTable \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:4566
```

### Lambda Operations
```bash
# Create function
aws lambda create-function \
  --function-name test-function \
  --runtime nodejs18.x \
  --handler index.handler \
  --role arn:aws:iam::123456789012:role/test-role \
  --zip-file fileb://function.zip \
  --endpoint-url http://localhost:4566
```

## LocalStack Services

This example configures these LocalStack services:

- **EKS** - Kubernetes cluster management
- **RDS** - Relational database service
- **S3** - Object storage
- **DynamoDB** - NoSQL database
- **Lambda** - Function compute
- **API Gateway** - HTTP API management
- **SQS/SNS** - Messaging services

## Monitoring and Debugging

```bash
# Check LocalStack logs
docker-compose logs localstack

# Monitor service health
curl http://localhost:4566/_localstack/health

# View service status
aws service-quotas get-service-quota \
  --service-code s3 \
  --quota-code L-1234567890 \
  --endpoint-url http://localhost:4566
```

## Migration to Production

When ready to migrate to AWS:

```bash
# Generate production AWS artifacts
npx chiral generate --provider aws

# Update AWS configuration
aws configure set profile production

# Apply to production
cd terraform/aws
terraform init
terraform apply
```

## Troubleshooting

### Common Issues

1. **LocalStack Not Starting**
   ```bash
   # Check Docker resources
   docker system df
   
   # Increase Docker memory allocation
   # Docker Desktop > Settings > Resources > Memory
   ```

2. **Service Timeouts**
   ```bash
   # Wait for services to initialize
   timeout 60 bash -c 'until curl -s http://localhost:4566/_localstack/health; do sleep 2; done'
   ```

3. **AWS CLI Authentication**
   ```bash
   # Reset AWS configuration
   aws configure set profile.default.region us-east-1
   aws configure set profile.default.endpoint_url http://localhost:4566
   ```

## Advanced Configuration

### Custom Services
```yaml
# docker-compose.yml
services:
  localstack:
    environment:
      SERVICES: eks,rds,s3,dynamodb,lambda,apigateway,sqs,sns
      DEBUG: 1
      DATA_DIR: /tmp/localstack/data
```

### Persistence
```yaml
volumes:
  localstack_data:
    driver: local
```

## Cost Analysis

LocalStack provides free local emulation:

```bash
# Compare costs
npx chiral analyze-costs --providers local,aws

# Expected output:
# - Local: $0/month
# - AWS: $~500/month (equivalent services)
```
