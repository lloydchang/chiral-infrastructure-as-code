# PostgreSQL Comparison: AWS RDS vs Azure Postgres in LocalStack/azlocal

This comparison highlights a critical technical divide in the Chiral pattern: while the AWS side is "virtually real" locally, the Azure side currently acts as a "Metadata Validator" rather than a "Functional Simulator."

## Feature-by-Feature Comparison

| Feature               | AWS RDS (LocalStack)                          | Azure Postgres Flex (azlocal)                |
|-----------------------|-----------------------------------------------|---------------------------------------------|
| Engine Support       | Functional. Spins up a real Postgres container (v17+ default) mapped to your RDS resource. | Metadata Only. Validates the Bicep/ARM structure but does not spin up a real Postgres instance by default. |
| Connectivity         | Immediate. You can connect via psql to a local port (e.g., 4510) and run queries immediately. | Mocked. The "resource" exists in the local state, but there is no listening database port unless you manually link a container. |
| Bicep/CDK Validation | Validates CloudFormation/CDK against AWS spec. | Strong. Validates Bicep parameters, SKUs, and syntax against the real ARM schema. |
| Auth Emulation       | Supports IAM-based DB authentication mocks.   | Limited. Does not simulate complex Entra ID (managed identity) handshakes locally. |
| State Management     | High. Supports "Cloud Pods" to snapshot and share the DB state with your team. | Basic. Tracks that the resource "exists" in your local deployment stack. |

## Critical Insight for the Chiral Pattern

Since Chiral generates native artifacts from a single intent:

- **For AWS**: Local tests can be "end-to-end." Deploy via Chiral layer, connect to DB, create tables, and run app code.
- **For Azure**: Local tests are "Structural." Use azlocal to ensure Chiral-generated Bicep is deployable. It catches errors like "Invalid SKU for this region" or "Missing mandatory Bicep parameter" without hitting the cloud.

## Recommended Chiral Dev Loop

To get the best of both worlds without massive performance hit:

1. Use azlocal to verify Bicep generation logic.
2. Docker-compose a generic Postgres image for application's functional tests on the Azure side. This bypasses the need for a full Flexible Server emulator while testing data access layer.

## Note on "Azure Local" Branding

Be careful when searching for documentation. In 2025/2026, Microsoft rebranded Azure Stack HCI to "Azure Local." This is a hardware-based on-premise cloud solution and is not the same as LocalStack-style software emulation. Stick to azlocal or the LocalStack Azure Extension for Chiral dev environment.
