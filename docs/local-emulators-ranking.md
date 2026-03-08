# Local Cloud Emulator Completeness Ranking (0–10)

| Cloud | Local Emulator Completeness | Notes |
|-------|-----------------------------|-------|
| AWS  | 9                          | LocalStack + SAM CLI covers storage, databases, messaging, serverless, API Gateway, and partial monitoring. Very broad support for local testing. Missing some RDS and advanced services. |
| Azure | 5                          | Azurite + Functions Core Tools + Cosmos DB Emulator provide storage, serverless, and database emulation. Lacks full Service Bus, Event Grid, Key Vault, and advanced services. Integration requires multiple tools. |
| GCP   | 4                          | Firestore / Datastore, Pub/Sub Emulator, Functions Framework, Cloud Spanner Emulator cover key services. Many services like Storage, Logging, Secret Manager, and BigQuery have limited or manual emulation. |

## Notes

AWS is clearly the most complete single tool for local emulation. Azure and GCP require combining multiple service-specific emulators to approximate AWS LocalStack functionality.

**Optional:** For a developer targeting multi-cloud local testing, AWS offers the fastest setup; Azure and GCP will require extra scripting and orchestration.
