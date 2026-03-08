# CI/CD Validation for Chiral Infrastructure

To integrate Chiral infrastructure testing into your CI/CD pipeline, create a "validation gate" that catches Bicep or CDK errors before they touch real cloud resources.

Using LocalStack (for AWS) and azlocal (for Azure) in GitHub Actions achieves parity in local testing.

## GitHub Actions Workflow Template

This workflow uses a standard Ubuntu runner. It installs necessary CLI tools and validates infrastructure artifacts sequentially.

```yaml
name: Chiral Infrastructure Validation
on: [push, pull_request]

jobs:
  validate-chiral-artifacts:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      # 1. Setup LocalStack for AWS
      - name: Start LocalStack
        run: |
          docker run -d -p 4566:4566 localstack/localstack
          # Wait for LocalStack to be ready
          sleep 10

      # 2. Setup AzLocal for Azure
      - name: Install AzLocal
        run: pip install azlocal

      # 3. Validate AWS (CDK)
      - name: Validate AWS CDK
        run: |
          cd dist/aws
          # Point AWS CLI to LocalStack
          export AWS_ENDPOINT_URL=http://localhost:4566
          # Run deployment validation
          cdk synth --strict

      # 4. Validate Azure (Bicep)
      - name: Validate Bicep via AzLocal
        run: |
          cd dist/azure
          # Intercept Azure CLI calls to use LocalStack
          azlocal start-interception
          az deployment group validate --resource-group test-rg --template-file main.bicep
```

## Integration Strategy for Chiral

Since Chiral generates native artifacts, CI/CD should treat generated output as the source of truth, not TypeScript intent code.

- **Linting as a Gate**: Always run `az bicep lint` and `cdk synth` before emulation steps. If generated artifact is syntactically invalid, no need to spin up emulator.
- **What-If Analysis**: For Azure, after azlocal schema validation, add a step to run native `az deployment group what-if` against a "sandbox" or "ephemeral" Azure subscription. This catches configuration errors (policy violations) that azlocal might miss.

## Summary of Best Practices for Chiral

- **Build Once, Validate Twice**: Generate AWS CDK and Azure Bicep artifacts in a single build job. Pass artifacts between stages using GitHub Actions `upload-artifact` and `download-artifact`.
- **Mocked Data**: Since local emulators don't replicate full networking or IAM complexity, supplement with Unit Tests for TypeScript intent logic to ensure intent is sound before Bicep/CDK generation.
- **Clean Environments**: Always use `--force` or teardown commands after test suites to avoid "zombie" resources in LocalStack container interfering with subsequent runs.
