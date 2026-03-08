# Chiral Pattern Integration with Local Emulators

The Chiral pattern involves building a translation layer from single TypeScript intent to native artifacts. Local emulators help verify that generated resources behave consistently across clouds.

## Integration with Chiral Pattern

- **Contract Testing**: Use Azurite to ensure the "Blob" interface in your Azure Bicep branch returns the same data structures as the "S3" interface in your AWS CDK branch.
- **State Consistency**: Use emulators in CI/CD pipelines (GitHub Actions or GitLab CI) to run integration tests against generated Bicep and CDK code without cloud costs or "Slow Start" provisioning.

## Docker Compose for Unified Local Environment

A docker-compose file to spin up LocalStack, Azurite, and PostgreSQL:

```yaml
version: '3.8'
services:
  localstack:
    image: localstack/localstack
    ports:
      - "4566:4566"
    environment:
      - SERVICES=lambda,dynamodb,s3,sqs,sns
      - DEBUG=1
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"

  azurite:
    image: mcr.microsoft.com/azure-storage/azurite
    ports:
      - "10000:10000"
      - "10001:10001"
      - "10002:10002"

  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: chiral_test
      POSTGRES_USER: chiral
      POSTGRES_PASSWORD: chiral123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

This setup provides:
- LocalStack on port 4566 for AWS services
- Azurite on ports 10000-10002 for Azure Storage
- PostgreSQL on port 5432 for database testing
