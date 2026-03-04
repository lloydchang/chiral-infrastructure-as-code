# Migration Guide: From Stateful to Stateless IaC

## Overview

Chiral provides import tools to convert existing infrastructure as code (IaC) into Chiral intent schemas, helping teams migrate from traditional IaC tools to the stateless Chiral pattern. This migration eliminates the state management tax and operational overhead identified in enterprise analysis.

## Why Migrate to Stateless Architecture?

Based on industry assessments of Terraform state management challenges, migrating to Chiral provides:

**Eliminate State Management Costs**
- **Zero IBM Terraform Premium fees**: Save $0.99/month per resource (e.g., $1,188/year for 100 resources)
- **No backend storage costs**: Eliminate S3/GCS storage and request charges
- **Reduced operational overhead**: No state backup, recovery, or maintenance procedures

**Remove Operational Risks**
- **No state corruption**: Cloud providers handle consistency natively
- **No lock contention**: Cloud control planes manage concurrency automatically
- **No compliance violations**: No external state files to secure or audit
- **No cross-organizational coordination**: State issues don't span teams

**Enable Scalable Automation**
- **More pipelines = more problems** becomes "more pipelines = no additional complexity"
- **No orphaned locks**: Cloud services handle cleanup automatically
- **Instant disaster recovery**: Standard cloud recovery applies without state restoration

## Migration Strategy: Proof of Concept Approach

Based on industry recommendations for Bicep migration, follow this strategic path:

### 1. Proof of Concept: Low-Risk Workload
- **Identify** a net-new, low-risk workload to deploy using Chiral
- **Evaluate** developer experience, linting, and CI/CD integration safely
- **Compare** generated artifacts with existing Terraform/CloudFormation
- **Validate** deployment process and operational procedures

### 2. Ecosystem and Identity Audit
- **Azure**: Enable Microsoft Graph Bicep extension to manage App Registrations and Groups natively
- **AWS**: Review current Terraform configurations for non-AWS providers (e.g., Okta, PagerDuty)
- **GCP**: Plan decoupling strategies for non-GCP providers
- **Multi-cloud**: Document cross-cloud dependencies and migration sequence

### 3. Migration Assessment
- **Azure**: Test `az bicep decompile` command against exported ARM templates
- **AWS**: Use CDK migration tools to convert CloudFormation to CDK constructs
- **GCP**: Evaluate Infrastructure Manager blueprints vs Terraform state
- **Cost Analysis**: Calculate state management cost savings vs migration effort

## Supported Formats

- **Terraform**: `.tf` (HCL configuration files) and `.tfstate` (state files)
- **CloudFormation**: `.yaml`, `.yml`, and `.json` templates
- **Azure Bicep**: `.bicep` template files

## Usage

### Basic Import Command

```bash
npx ts-node src/main.ts import -s path/to/your/infrastructure.tf -p aws -o chiral.config.ts
```

### Command Options

- `-s, --source <path>`: Path to the IaC source file
- `-p, --provider <provider>`: Target cloud provider (`aws`, `azure`, `gcp`)
- `-o, --output <path>`: Output path for the generated Chiral config file (default: `chiral.config.ts`)

## How It Works

1. **Parse**: The tool parses the IaC file using appropriate libraries
2. **Extract Resources**: Identifies infrastructure resources (VMs, databases, networks, etc.)
3. **Map to Intent**: Translates concrete resource configurations to abstract Chiral intent (e.g., instance type `t3.medium` → workload size `small`)
4. **Generate Config**: Creates a Chiral config file with inferred intent values

## Migration Path Examples

### Example 1: Azure-First Organization
**Scenario**: 100 resources in Azure with Terraform, paying $99/month for IBM Terraform Premium

**Migration Steps**:
1. **Export** existing Terraform configurations to ARM templates
2. **Run** `az bicep decompile` to convert to Bicep
3. **Import** Bicep files into Chiral: `npx ts-node src/main.ts import -s deployment.bicep -p azure -o chiral.config.ts`
4. **Generate** Chiral artifacts: `npx ts-node src/main.ts compile -c chiral.config.ts`
5. **Compare** generated Bicep with original for validation
6. **Deploy** to test environment and verify functionality

**Benefits**: $1,188/year savings, no state management overhead, native Azure integration

### Example 2: Multi-Cloud Enterprise
**Scenario**: AWS (CloudFormation), Azure (Terraform), GCP (Terraform) with 300 total resources

**Migration Steps**:
1. **AWS**: Import CloudFormation templates directly
2. **Azure**: Follow Azure-first migration path
3. **GCP**: Import Terraform HCL (avoid state files)
4. **Unify** under single Chiral intent configuration
5. **Generate** all cloud artifacts from single source
6. **Establish** consistent deployment processes across clouds

**Benefits**: Consistent multi-cloud management, $3,564/year savings, unified operational procedures

### Example 3: Greenfield Development
**Scenario**: New microservices platform targeting all three clouds

**Migration Steps**:
1. **Define** Chiral intent based on business requirements
2. **Generate** cloud artifacts for all targets
3. **Deploy** to development environments in parallel
4. **Iterate** on intent based on testing feedback
5. **Scale** to production with confidence in consistency

**Benefits**: No migration cost, immediate stateless benefits, consistent multi-cloud deployment from day one

### Importing from Terraform State Files

**⚠️ SECURITY WARNING**: State files contain sensitive information and compliance risks:

```bash
# From HCL configuration (preferred)
npx ts-node src/main.ts import -s main.tf -p gcp -o config.ts

# From state file (use with caution)
npx ts-node src/main.ts import -s terraform.tfstate -p aws -o config.ts
```

**State File Risks**:
- **Plain text secrets**: Database passwords, API keys, certificates
- **Metadata exposure**: IP addresses, network configurations, resource relationships
- **Compliance violations**: SOC 2, ISO 27001, GDPR violations from improper handling
- **Audit trail gaps**: Limited visibility into state file access

**Best Practices**:
- Prefer HCL configuration files over state files when possible
- Sanitize state files to remove sensitive data before import
- Review generated configs for security and compliance issues
- Consider manual configuration for high-security environments

### Importing from CloudFormation

```bash
npx ts-node src/main.ts import -s template.yaml -p aws -o config.ts
npx ts-node src/main.ts import -s stack.json -p aws -o config.ts
```

### Importing from Azure Bicep

```bash
npx ts-node src/main.ts import -s deployment.bicep -p azure -o config.ts
```

## Limitations and Considerations

### Migration Complexity
- **Heuristic Mapping**: Conversions use best-effort heuristics; complex or custom resources may require manual adjustment
- **Fidelity Loss**: Some cloud-specific configurations cannot be perfectly abstracted to Chiral intent
- **Learning Curve**: Teams must adapt to intent-driven thinking vs implementation-focused approach

### Security and Compliance
- **State File Risks**: Generated configs should be reviewed, especially when importing from state files containing sensitive data
- **Audit Requirements**: Ensure migration process maintains compliance with organizational standards
- **Data Sovereignty**: Verify that Chiral's stateless approach meets regulatory requirements

### Technical Scope
- **Resource Coverage**: Currently focuses on core resources (Kubernetes, databases, VMs); advanced features may not be supported
- **Provider Dependencies**: Requires Azure CLI for Bicep parsing, and CLI must be available in PATH
- **Regional Limitations**: Some cloud services may not be available in all regions

## Post-Migration Validation

### 1. Configuration Review
- **Check** generated config file for accuracy and completeness
- **Validate** that all critical resources are properly mapped
- **Adjust** workload sizes, regions, or other inferred values as needed
- **Security**: Review for any sensitive data exposure

### 2. Artifact Generation Testing
- **Run** `npx ts-node src/main.ts compile -c chiral.config.ts` to generate artifacts
- **Validate** generated Bicep/CloudFormation/Terraform syntax
- **Compare** with original IaC to ensure functional equivalence
- **Test** deployment to isolated environment

### 3. Production Readiness
- **Deploy** to staging environment and verify full functionality
- **Performance**: Compare with existing infrastructure performance
- **Security**: Run security scans and compliance checks
- **Documentation**: Update operational procedures and runbooks

### 4. Cutover Planning
- **Schedule** maintenance window for production migration
- **Backup** existing infrastructure and state files
- **Execute** migration using Chiral-generated artifacts
- **Monitor** post-migration performance and issues
- **Rollback**: Prepare rollback procedure if needed

## Troubleshooting Migration Issues

### Common Import Problems

**"Unsupported file extension"**
- Ensure file has a supported extension (.tf, .tfstate, .yaml, .yml, .json, .bicep)
- Check file encoding and line endings
- Verify file is not corrupted or truncated

**"Command failed" for Bicep**
- Install Azure CLI and ensure `az` is in PATH
- Run `az login` to authenticate
- Check Azure CLI version compatibility

**Empty or incomplete config**
- The IaC may contain unsupported resources
- Start with simpler files and gradually add complexity
- Manually add missing intent for unsupported resources
- Check for syntax errors in source IaC

**Type errors in generated config**
- Fix any TypeScript issues by adjusting the config structure
- Ensure all required Chiral intent fields are populated
- Check for conflicting or invalid values

### State File Specific Issues

**Corrupted state files**
- State files may be partially corrupted from failed applies
- Try `terraform state pull` to get fresh state
- Use `terraform validate` to check state file integrity
- Consider manual resource recreation if state is unrecoverable

**Sensitive data exposure**
- Review generated configs for exposed secrets
- Sanitize state files before import when possible
- Use environment variables for sensitive values in Chiral config
- Implement proper secret management post-migration

### Getting Help

**Debugging Steps**:
- Check generated config file for comments indicating mapping issues
- Compare with original IaC to identify unmapped resources
- Use `--verbose` flag for detailed import logging
- For complex migrations, consider starting with a minimal IaC file and building up

**Community Support**:
- Review migration examples in the repository
- Check GitHub issues for similar migration scenarios
- Consider professional services for complex enterprise migrations

## Migration Roadmap

### Near-Term Enhancements
- **Enhanced state file handling**: Better parsing of corrupted or complex Terraform state
- **Batch import**: Support for importing multiple IaC files simultaneously
- **Improved mapping**: Better heuristics for complex resource configurations
- **Security scanning**: Automated detection of sensitive data in imported configs

### Medium-Term Goals
- **Live infrastructure import**: Integration with cloud APIs to import existing deployed resources
- **Pulumi support**: Import from Pulumi state and configurations
- **CDK app import**: Direct import from AWS CDK applications
- **Migration validation**: Automated comparison between original and generated infrastructure

### Long-Term Vision
- **Zero-downtime migration**: Tools for migrating production infrastructure without service interruption
- **Progressive migration**: Support for hybrid approaches during transition periods
- **Compliance automation**: Automated compliance checking during migration process
- **Cost optimization**: Automated recommendations for cost savings during migration

## Conclusion

Migrating from traditional IaC tools to Chiral's stateless pattern addresses the fundamental challenges identified in enterprise Terraform state management analysis. By eliminating state management overhead, reducing operational risks, and enabling scalable automation, organizations can achieve significant cost savings and operational improvements while maintaining multi-cloud consistency and compliance.

The proof-of-concept approach recommended here allows organizations to validate benefits incrementally, minimizing migration risk while maximizing the strategic advantages of stateless infrastructure management.
