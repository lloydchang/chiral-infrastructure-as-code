# Cloud Local Emulator Completeness Ranking

This document provides rankings of cloud providers based on the completeness, ease of use, and developer experience of their local emulation ecosystems. Rankings are scored on a 0-10 scale considering three factors: Breadth (how many services can be emulated), Fidelity (how closely it mimics the real cloud), and Cohesion (how easy it is to make the mocked services talk to each other locally).

## Primary Ranking (Initial Assessment)

| Cloud | Local Emulator Completeness | Notes |
|-------|-----------------------------|-------|
| AWS | 9 | LocalStack + SAM CLI covers storage, databases, messaging, serverless, API Gateway, and partial monitoring. Very broad support for local testing. Missing some RDS and advanced services. |
| Azure | 5 | Azurite + Functions Core Tools + Cosmos DB Emulator provide storage, serverless, and database emulation. Lacks full Service Bus, Event Grid, Key Vault, and advanced services. Integration requires multiple tools. |
| GCP | 4 | Firestore / Datastore, Pub/Sub Emulator, Functions Framework, Cloud Spanner Emulator cover key services. Many services like Storage, Logging, Secret Manager, and BigQuery have limited or manual emulation. |

**Notes**: AWS is clearly the most complete single tool for local emulation. Azure and GCP require combining multiple service-specific emulators to approximate AWS LocalStack functionality. Optional: For a developer targeting multi-cloud local testing, AWS offers the fastest setup; Azure and GCP will require extra scripting and orchestration.

## Detailed Ranking (From Claude)

| Cloud | Score | Reasoning |
|-------|-------|----------|
| AWS | 9/10 | LocalStack covers 100+ services in one unified tool, with a free tier and a Pro tier for more advanced services. By far the most complete local dev experience. |
| Azure | 6/10 | Good official emulators for core services (Blob, Cosmos DB, Service Bus, Event Hubs, Functions), but fragmented — no single unified tool, and many services have no local option at all. |
| GCP | 5/10 | Firebase Emulator Suite is excellent within the Firebase ecosystem, but broader GCP services are patchily covered. Individual emulators exist but feel less polished and harder to orchestrate together. |

**Key takeaway**: If local development experience is a priority, AWS + LocalStack wins by a wide margin. Azure is a solid second if you're working with its core services. GCP is fine if you're Firebase-heavy, but weaker for general cloud service emulation.

## Advanced Ranking (From Gemini)

| Cloud | Rank | Verdict | Why? |
|-------|------|---------|------|
| AWS | 9.5 | Gold Standard | LocalStack emulates almost everything (80+ services). Even complex things like IAM and cross-account roles work locally. The 0.5 deduction is for the 2026 move to a mandatory account login for the single image. |
| GCP | 7.0 | Developer Friendly | gcloud emulators (Pub/Sub, Spanner, Firestore) are high-fidelity and lightweight. However, there is no unified way to run "GCP" locally; you spin up individual binaries, and some niche services (like specialized AI APIs) still require the real cloud. |
| Azure | 6.5 | Fragmented but Strong | Azurite and Cosmos Emulator are fantastic for storage/DB. However, emulating Azure's networking (VNet/NSG) and complex Entra ID (Active Directory) flows locally remains difficult and often forces a "hybrid" approach where you use a real Dev tenant. |

### Detailed Comparison
- **AWS (The Heavyweight)**: LocalStack acts as a unified cloud environment. Point Terraform or CDK directly at localhost:4566 and it "just works."
- **GCP (The Native Emulators)**: Firebase Emulator Suite has the best visual tool for local development. gcloud emulators are rock solid but require separate Java dependencies.
- **Azure (The Enterprise Mix)**: Azurite is reliable for Blob/Queue/Table storage. Microsoft's emulators are often Windows-first or heavy.

### Recommendation for Chiral Pattern
Since the translation layer generates native artifacts, the biggest challenge is Azure's 6.5/10 score. AWS CDK code can be 100% tested locally, but Azure Bicep code may need real Azure Dev Subscription for networking/RBAC logic that Azurite can't simulate.

## Final Ranking Summary

| Cloud | Primary Score | Claude Score | Gemini Score | Average |
|-------|---------------|--------------|--------------|---------|
| AWS | 9 | 9/10 | 9.5 | 9.2 |
| Azure | 5 | 6/10 | 6.5 | 5.8 |
| GCP | 4 | 5/10 | 7.0 | 5.3 |

**Verdict**: If strict local-first development is a core requirement, AWS is currently the best platform due to LocalStack. For Azure and GCP, expect to mix local testing with dedicated cloud dev environments.
