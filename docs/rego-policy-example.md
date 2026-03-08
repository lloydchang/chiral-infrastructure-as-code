# Rego Policy Example for Storage Security

To standardize compliance in Chiral across AWS, Azure, and GCP, use Open Policy Agent (OPA) with Rego. Write rule once and apply to generated artifacts (CloudFormation/Bicep/Terraform JSON) for any provider.

## 1. Example: Deny Public Storage Access

This Rego policy detects if S3 bucket (AWS) or Azure Storage Account has public access enabled.

```rego
package chiral.security

# Deny if S3 bucket has 'BlockPublicAccess' disabled
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_s3_bucket_public_access_block"
    resource.change.after.block_public_policy == false
    msg := sprintf("S3 Bucket %s must have BlockPublicPolicy enabled!", [resource.address])
}

# Deny if Azure storage account allows public blob access
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "Microsoft.Storage/storageAccounts"
    resource.change.after.allowBlobPublicAccess == true
    msg := sprintf("Azure Storage Account %s must have allowBlobPublicAccess disabled!", [resource.address])
}
```

## 2. How to Test with Gator CLI

Use Gator to test policy locally before CI/CD pipeline.

### Structure Files

```
policies/
  storage-security.rego
tests/
  test-suite.yaml
```

### Define Test Suite (tests/test-suite.yaml)

```yaml
kind: Suite
apiVersion: test.gatekeeper.sh/v1alpha1
tests:
  - name: public-storage-denied
    template: policies/storage-security.rego
    cases:
      - name: invalid-public-s3
        object: resources/bad-s3.json
        assertions:
          - violations: yes
```

### Run Verification

```bash
gator verify tests/test-suite.yaml
```

## Integration for Chiral Workflow

Add final "Governance Stage" to CI/CD pipeline:

- **Generate**: Chiral creates `main.bicep` and `cdk.out/`.
- **Convert**: Run `terraform show -json` or convert Bicep/CDK output to unified JSON format for policy engine.
- **Evaluate**: Run `gator test -f dist/` to check all generated artifacts against `policies/` directory.

By using Rego-based model, stop writing "security scripts" per cloud; update Rego policies, entire infrastructure inherits new security posture instantly.

**Relevant Tutorial**: "Open Policy Agent and Terraform - Examining a Terraform Execution Plan with Rego" (Ned in the Cloud) demonstrates parsing infrastructure plans to JSON, prerequisite for OPA/Gator checks on Chiral artifacts.
