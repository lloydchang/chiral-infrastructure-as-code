# Chiral Configuration Examples

This directory contains example Chiral configurations that demonstrate different migration scenarios and use cases.

## Migration Scenarios

### 1. Azure-First Organization
**File**: `azure-migration-example/chiral.config.ts`

**Scenario**: 100 resources in Azure with Terraform, paying $99/month for IBM Terraform Premium

**Migration Path**:
1. Export existing Terraform configurations to ARM templates
2. Run `az bicep decompile` to convert to Bicep
3. Import Bicep files into Chiral
4. Generate Chiral artifacts
5. Compare generated Bicep with original for validation
6. Deploy to test environment and verify functionality

**Benefits**: $1,188/year savings, no state management overhead, native Azure integration

### 2. Multi-Cloud Enterprise
**File**: `multi-cloud-migration-example/chiral.config.ts`

**Scenario**: AWS (CloudFormation), Azure (Terraform), GCP (Terraform) with 300 total resources

**Migration Path**:
1. AWS: Import CloudFormation templates directly
2. Azure: Follow Azure-first migration path
3. GCP: Import Terraform HCL (avoid state files)
4. Unify under single Chiral intent configuration
5. Generate all cloud artifacts from single source
6. Establish consistent deployment processes across clouds

**Benefits**: Consistent multi-cloud management, $3,564/year savings, unified operational procedures

### 3. Greenfield Development
**File**: `greenfield-development-example/chiral.config.ts`

**Scenario**: New microservices platform targeting all three clouds

**Migration Path**:
1. Define Chiral intent based on business requirements
2. Generate cloud artifacts for all targets
3. Deploy to development environments in parallel
4. Iterate on intent based on testing feedback
5. Scale to production with confidence in consistency

**Benefits**: No migration cost, immediate stateless benefits, consistent multi-cloud deployment from day one

## Usage

Each example can be used directly:

```bash
# Generate artifacts for Azure migration example
npx ts-node src/main.ts compile -c examples/azure-migration-example/chiral.config.ts

# Generate artifacts for multi-cloud example
npx ts-node src/main.ts compile -c examples/multi-cloud-migration-example/chiral.config.ts

# Generate artifacts for greenfield development
npx ts-node src/main.ts compile -c examples/greenfield-development-example/chiral.config.ts
```

## Validation

Before deployment, validate each configuration:

```bash
# Validate configuration
npx ts-node src/main.ts validate -c examples/azure-migration-example/chiral.config.ts --compliance soc2

# Check deployment readiness
npx ts-node src/main.ts validate -c examples/multi-cloud-migration-example/chiral.config.ts

# Compare approaches for your setup
npx ts-node src/main.ts compare --resources 100 --team-size 5 --complexity medium
```

## Cost Analysis

Use the compare command to understand the financial impact of migration:

```bash
# Compare Terraform vs Chiral for 100 resources
npx ts-node src/main.ts compare --resources 100 --team-size 5 --complexity medium

# Expected output:
# Terraform: $99/month + operational overhead
# Chiral: $0/month + reduced operational overhead
# Savings: ~$1,200/year + reduced risk
```

## Migration Commands

For existing Terraform deployments, use the enhanced migration commands:

```bash
# Analyze current Terraform setup
npx ts-node src/main.ts analyze -s terraform.tfstate -p aws --cost-comparison

# Migrate with analysis
npx ts-node src/main.ts migrate -s terraform.tfstate -p aws --strategy progressive

# Import existing IaC (preferred over state files)
npx ts-node src/main.ts import -s main.tf -p aws -o chiral.config.ts
```

## Notes

- All examples use production-grade configurations unless otherwise specified
- Network CIDRs are examples - adjust for your organization's requirements
- Region selections demonstrate multi-cloud capabilities
- Migration metadata is included for tracking purposes
- Compliance checking is integrated for enterprise requirements

## Next Steps

1. Choose the example that best matches your scenario
2. Customize the configuration for your specific requirements
3. Validate the configuration using the validate command
4. Generate artifacts using the compile command
5. Deploy using cloud-native tools (no Terraform state required)
