# Azure Local Setup: Azurite, Functions Core Tools, and Firebase

Focusing on synchronizing infrastructure across Azure Bicep and AWS CDK, Azurite and the Azure Functions Core Tools provide the most immediate value for local validation.

Since you are managing complex state across clouds with your "Chiral" approach, these emulators help verify that Bicep-generated resources (like Storage Accounts or Service Bus) behave consistently with AWS counterparts before deployment.

## 1. Setting up Azurite (Azure Storage)

Azurite is the gold standard for local Azure development. It emulates Blob, Queue, and Table storage.

### Installation

The easiest way is via Docker:

```bash
docker run -p 10000:10000 -p 10001:10001 -p 10002:10002 \
    mcr.microsoft.com/azure-storage/azurite
```

### Connection String

Use the "well-known" development connection string in your local code:

```
DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;
```

## 2. Azure Functions Core Tools

For serverless components handling logic between PostgreSQL and Kubernetes layers, this tool is essential. It runs the actual Azure Functions runtime locally.

### Installation

```bash
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

### Local Secret Management

It uses a `local.settings.json` file which mimics Environment Variables in the Azure Portal, allowing you to point local functions toward your Azurite instance.

## 3. Firebase Emulator Suite

While not yet used in your project, Firebase Emulator Suite is the most mature "all-in-one" local environment for prototyping frontends with managed backends.

### Key Feature

The Emulator Suite UI. Running `firebase emulators:start` launches a local dashboard at `localhost:4000` where you can manually inspect the local database, trigger functions, and view logs.

## 4. Integration with Chiral Pattern

Building a translation layer from TypeScript intent to native artifacts:

- **Contract Testing**: Use Azurite to ensure the "Blob" interface in your Azure Bicep branch returns the same data structures as the "S3" interface in your AWS CDK branch.
- **State Consistency**: Use these emulators in CI/CD pipelines (GitHub Actions or GitLab CI) to run integration tests against generated Bicep and CDK code without cloud costs or "Slow Start" provisioning.
