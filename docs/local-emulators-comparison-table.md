# Local Cloud Emulators Comparison Table

| Service Category          | AWS LocalStack / Alternative               | Azure Emulator / Tool                     | GCP Emulator / Tool                       | Coverage Notes |
|---------------------------|--------------------------------------------|-------------------------------------------|-------------------------------------------|----------------|
| Storage                  | S3, DynamoDB, EFS (LocalStack)            | Azurite (Blob, Queue, Table)             | Cloud Storage Emulator (beta)            | AWS LocalStack covers more storage types; Azure and GCP mainly Blob/Object storage |
| Serverless Functions     | Lambda (LocalStack, SAM CLI)              | Azure Functions Core Tools               | Functions Framework / Emulator           | AWS Lambda simulation more complete; Azure & GCP need separate tools per language/runtime |
| Databases                | DynamoDB, RDS (partial)                   | Cosmos DB Emulator                       | Firestore / Datastore Emulator, Cloud Spanner Emulator | AWS has partial RDS emulation; Azure & GCP require separate emulators per DB |
| Messaging / Event        | SQS, SNS, EventBridge (LocalStack)        | Service Bus (no full emulator), Event Grid (partial) | Pub/Sub Emulator                        | AWS LocalStack supports multiple patterns; Azure & GCP require separate emulators |
| API / Gateway            | API Gateway (LocalStack)                  | Functions Core Tools + HTTP triggers     | Functions Framework + Cloud Endpoints (manual) | AWS fully supports API emulation; others partial, manual wiring needed |
| Queues / Streams         | Kinesis, SQS                              | Azure Queue via Azurite (limited)        | Pub/Sub Emulator                        | AWS broader support; Azure and GCP need multiple tools |
| Others                   | CloudWatch, SecretsManager (partial)      | Key Vault (no full emulator), Storage triggers | Secret Manager (manual), Stackdriver logging (limited) | AWS LocalStack covers monitoring/secrets partially; others mostly missing |

## Notes

- AWS LocalStack is the only near-full cloud-local emulator covering a wide range of services.
- Azure and GCP emulation is service-specific, requiring developers to combine multiple emulators for full workflow testing.
- For integration testing across multiple services, AWS is easiest locally; Azure/GCP require more setup.
