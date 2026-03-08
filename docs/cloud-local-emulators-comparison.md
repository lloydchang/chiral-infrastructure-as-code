# Cloud Local Emulators Comparison Table

| Service Category | AWS LocalStack / Alternative | Azure Emulator / Tool | GCP Emulator / Tool | Coverage Notes |
|------------------|-----------------------------|-----------------------|---------------------|----------------|
| Storage | S3, DynamoDB, EFS (LocalStack) | Azurite (Blob, Queue, Table) | Cloud Storage Emulator (beta) | AWS LocalStack covers more storage types; Azure and GCP mainly Blob/Object storage |
| Serverless Functions | Lambda (LocalStack, SAM CLI) | Azure Functions Core Tools | Functions Framework / Emulator | AWS Lambda simulation more complete; Azure & GCP need separate tools per language/runtime |
| Databases | DynamoDB, RDS (partial) | Cosmos DB Emulator | Firestore / Datastore Emulator, Cloud Spanner Emulator | AWS has partial RDS emulation; Azure & GCP require separate emulators per DB |
| Messaging / Event | SQS, SNS, EventBridge (LocalStack) | Service Bus (no full emulator), Event Grid (partial) | Pub/Sub Emulator | AWS LocalStack supports multiple patterns; Azure & GCP require separate emulators |
| API / Gateway | API Gateway (LocalStack) | Functions Core Tools + HTTP triggers | Functions Framework + Cloud Endpoints (manual) | AWS fully supports API emulation; others partial, manual wiring needed |
| Queues / Streams | Kinesis, SQS | Azure Queue via Azurite (limited) | Pub/Sub Emulator | AWS broader support; Azure and GCP need multiple tools |
| Others | CloudWatch, SecretsManager (partial) | Key Vault (no full emulator), Storage triggers | Secret Manager (manual), Stackdriver logging (limited) | AWS LocalStack covers monitoring/secrets partially; others mostly missing |

## Notes

- AWS LocalStack is the only near-full cloud-local emulator covering a wide range of services.
- Azure and GCP emulation is service-specific, requiring developers to combine multiple emulators for full workflow testing.
- For integration testing across multiple services, AWS is easiest locally; Azure/GCP require more setup.

## Expanded Comparison (From Claude)

| Feature | AWS (LocalStack) | Azure (Official Tools) | GCP (Official Tools) |
|---------|------------------|-----------------------|---------------------|
| Object Storage | LocalStack (S3) | Azurite | GCP Storage Emulator |
| NoSQL / DB | LocalStack (DynamoDB) | Cosmos DB Emulator | Spanner / Bigtable Emulators |
| Serverless | LocalStack (Lambda) | Azure Functions Core Tools | Functions Framework |
| Pub/Sub / Messaging | LocalStack (SQS/SNS) | Azurite / Service Bus (LocalStack) | Pub/Sub Emulator |
| Unified Platform | LocalStack | LocalStack for Azure | (Fragmented gcloud emulators) |

## Setup Comparison

| Feature | AWS (via LocalStack) | Azure (Official Tools) | GCP (Official Tools) |
|---------|----------------------|-----------------------|---------------------|
| Setup Style | Unified (One container) | Fragmented (Multiple tools) | Fragmented (Multiple tools) |
| Compute / Functions | LocalStack / SAM | Functions Core Tools | Functions Framework |
| Storage (Blobs) | LocalStack (S3) | Azurite | None Official (Use fake-gcs-server) |
| Messaging/Queues | LocalStack (SQS/SNS) | Service Bus / Azurite | Pub/Sub Emulator |
| Databases | DynamoDB Local | Cosmos DB Emulator | Firestore / Spanner / Bigtable |
| Cross-Service Routing | Native (They talk to each other) | Manual (Need connection strings) | Manual (Need connection strings) |

## Developer Experience Comparison

| Feature | AWS (LocalStack) | Azure (Azurite/Others) | GCP (gcloud + Firebase) |
|---------|------------------|-----------------------|-----------------------|
| Philosophy | Unified Container | Fragmented Emulators | Service-Specific Binaries |
| Ease of Setup | High (Single Docker) | Medium (Docker + CLI) | Moderate (Individual CLI) |
| Data Fidelity | Medium (API Mocks) | High (Storage/DB) | High (Native Binaries) |
| Serverless | LocalStack (Lambda) | Azure Functions Tools | Firebase/Cloud Functions Emulator |
| IaC Validation | LocalStack / cdk-nag | azlocal / Bicep lint | Policy Controller / Gator (OPA) |
