# Expanded Chiral CLI Reference

The expanded Chiral CLI supports bidirectional translation between all deployment environments: local development, cloud providers, emulators, and simulators. This reference covers all commands and options for the universal infrastructure translation system.

## Installation

```bash
npm install -g @chiral/cli
# or
yarn global add @chiral/cli
# or
pnpm add -g @chiral/cli
```

## Global Options

```bash
chiral [command] [options]

Options:
  -v, --version          Show version
  -h, --help            Show help
  --verbose             Enable verbose logging
  --quiet               Suppress non-error output
  --config <file>       Specify config file (default: chiral.config.ts)
  --project <name>      Specify project name
  --dry-run             Show what would be done without executing
```

## Core Commands

### Init
Initialize a new Chiral project.

```bash
chiral init [name] [options]

Options:
  --template <type>     Project template (typescript, javascript)
  --target <env>        Primary target environment
  --providers <list>   Cloud providers (comma-separated)

Examples:
  chiral init my-app
  chiral init my-app --template typescript --target aws
  chiral init my-app --providers aws,azure,gcp
```

### Import
Import infrastructure from any environment.

```bash
chiral import <source> [options]

Sources:
  local                 Import from local TypeScript files
  aws                   Import from AWS (CloudFormation, CDK)
  aws-emulator          Import from LocalStack
  aws-simulator         Import from SAM CLI, Moto, etc.
  azure                 Import from Azure (ARM, Bicep)
  azure-emulator        Import from Azurite, Cosmos DB
  azure-simulator       Import from Functions Core Tools
  gcp                   Import from GCP (Terraform, Deployment Manager)
  gcp-emulator          Import from Firebase Suite
  gcp-simulator         Import from gcloud emulators

Common Options:
  --output <file>       Output file for imported intent
  --merge               Merge with existing intent
  --validate            Validate imported configuration
  --discover            Auto-discover resources (cloud imports)

AWS Import Examples:
  chiral import aws --template my-stack.json
  chiral import aws --account-id 123456789012 --region us-east-1
  chiral import aws-emulator --endpoint http://localhost:4566
  chiral import aws-simulator --tool moto --file test_moto.py

Azure Import Examples:
  chiral import azure --template main.bicep
  chiral import azure --resource-group my-rg
  chiral import azure-emulator --tool azurite
  chiral import azure-simulator --tool functions-core-tools

GCP Import Examples:
  chiral import gcp --config main.tf
  chiral import gcp --project my-project
  chiral import gcp-emulator --tool firebase
  chiral import gcp-simulator --tool gcloud-pubsub
```

### Export
Export infrastructure to any environment.

```bash
chiral export <target> [options]

Targets: (same as import sources)

Common Options:
  --input <file>        Input intent file
  --output <file/dir>   Output location
  --optimize <criteria> Optimize for cost/performance/security
  --validate           Validate exported configuration
  --format <type>      Output format (json, yaml, bicep, tf, etc.)

AWS Export Examples:
  chiral export aws --template cloudformation.json
  chiral export aws-emulator --compose-file docker-compose.yml
  chiral export aws-simulator --tool sam --template-file template.yaml

Azure Export Examples:
  chiral export azure --template main.bicep
  chiral export azure-emulator --config azurite-config.json
  chiral export azure-simulator --tool functions-core-tools --project functions/

GCP Export Examples:
  chiral export gcp --config main.tf
  chiral export gcp-emulator --config firebase.json
  chiral export gcp-simulator --tool gcloud-functions --source functions/
```

### Validate
Validate compatibility and correctness.

```bash
chiral validate [options]

Options:
  --source <env>        Source environment
  --target <env>        Target environment
  --intent <file>       Intent file to validate
  --tool <name>         Specific tool validation
  --services <list>     Specific services to validate
  --consistency        Check consistency across environments

Examples:
  chiral validate --source local --target aws
  chiral validate --tool localstack --services s3,lambda
  chiral validate-consistency --environments dev,prod
```

### Analyze
Analyze infrastructure for insights.

```bash
chiral analyze [options]

Options:
  --intent <file>       Intent file to analyze
  --cost-optimization   Analyze cost optimization opportunities
  --security-audit      Perform security analysis
  --performance         Analyze performance characteristics
  --compliance <std>    Check compliance (soc2, hipaa, pci-dss)
  --report <file>       Generate analysis report

Examples:
  chiral analyze --cost-optimization
  chiral analyze --security-audit --report security.json
  chiral analyze --compliance soc2
```

### Compare
Compare configurations across environments.

```bash
chiral compare [options]

Options:
  --sources <list>      Source configurations to compare
  --metric <criteria>   Comparison metrics (cost, performance, security)
  --output <file>       Comparison report file
  --format <type>       Output format

Examples:
  chiral compare --sources config1.json,config2.json --metric cost
  chiral compare --targets aws,azure,gcp --metric performance
```

### Deploy
Deploy to multiple environments.

```bash
chiral deploy [targets] [options]

Options:
  --targets <list>      Target environments (comma-separated)
  --environment <name>  Deployment environment (dev, staging, prod)
  --parallel           Deploy in parallel
  --rollback-on-failure Rollback on deployment failure
  --approve            Auto-approve changes

Examples:
  chiral deploy aws --environment prod
  chiral deploy aws,azure,gcp --environment staging
  chiral deploy --targets aws-emulator,azure-emulator --parallel
```

## Advanced Commands

### Sync
Synchronize configurations across environments.

```bash
chiral sync [options]

Options:
  --from <env>         Source environment
  --to <env-list>      Target environments
  --strategy <type>    Sync strategy (overwrite, merge, diff)
  --auto-approve       Auto-approve sync operations

Examples:
  chiral sync --from aws --to azure,gcp
  chiral sync --from main-branch --to dev,staging
```

### Modernize
Modernize legacy infrastructure configurations.

```bash
chiral modernize [options]

Options:
  --input <file>       Legacy configuration file
  --target <env>       Target environment for modernization
  --best-practices     Apply cloud best practices
  --output <file>      Modernized configuration

Examples:
  chiral modernize --input legacy.json --target aws --best-practices
  chiral modernize --target gcp --output modern.tf
```

### Hybrid
Generate hybrid cloud-local deployments.

```bash
chiral hybrid [options]

Options:
  --cloud <list>       Cloud environments
  --local <list>       Local services
  --output <file>      Hybrid deployment configuration

Examples:
  chiral hybrid --cloud aws,azure --local postgres,redis
```

## Environment-Specific Commands

### Local Development
```bash
chiral local setup     # Setup local development environment
chiral local test      # Run local tests
chiral local clean     # Clean local artifacts
```

### AWS Commands
```bash
chiral aws stacks      # List CloudFormation stacks
chiral aws regions     # Show available regions
chiral aws profiles    # List AWS profiles
```

### Azure Commands
```bash
chiral azure subscriptions    # List subscriptions
chiral azure resource-groups  # List resource groups
chiral azure locations        # Show locations
```

### GCP Commands
```bash
chiral gcp projects    # List projects
chiral gcp regions     # Show regions
chiral gcp services    # List enabled services
```

## Configuration

### Global Configuration
Create `~/.chiral/config.json`:

```json
{
  "defaultProvider": "aws",
  "environments": {
    "dev": {
      "aws": { "region": "us-east-1" },
      "azure": { "subscription": "xxx" },
      "gcp": { "project": "my-project" }
    }
  },
  "emulators": {
    "localstack": { "endpoint": "http://localhost:4566" },
    "azurite": { "connectionString": "..." }
  }
}
```

### Project Configuration
Create `chiral.config.ts` in project root:

```typescript
export default {
  name: 'my-app',
  providers: ['aws', 'azure', 'gcp'],
  environments: {
    dev: {
      aws: { region: 'us-east-1' },
      azure: { location: 'eastus' },
      gcp: { region: 'us-central1' }
    }
  }
};
```

## Error Handling

### Common Exit Codes
- `0`: Success
- `1`: General error
- `2`: Validation failed
- `3`: Import failed
- `4`: Export failed
- `5`: Deployment failed

### Error Messages
```bash
# Get detailed error information
chiral --verbose command

# View last error
chiral error last

# Clear error history
chiral error clear
```

## Examples

### Complete Development Workflow
```bash
# Initialize project
chiral init my-multi-cloud-app --providers aws,azure,gcp

# Develop locally
# Edit src/intent.ts...

# Test in simulators
chiral export aws-simulator --validate
chiral export azure-simulator --validate
chiral export gcp-simulator --validate

# Validate in emulators
chiral export aws-emulator --validate
chiral export azure-emulator --validate
chiral export gcp-emulator --validate

# Deploy everywhere
chiral deploy --targets aws,azure,gcp --environment prod
```

### Migration Workflow
```bash
# Import existing AWS infrastructure
chiral import aws --account-id 123456789012 --discover

# Analyze current setup
chiral analyze --cost-optimization --report analysis.json

# Export to Azure and GCP
chiral export azure --optimize
chiral export gcp --optimize

# Compare costs
chiral compare --targets aws,azure,gcp --metric cost

# Deploy to cheapest option
chiral deploy gcp --environment prod
```

This expanded CLI provides the complete interface for Chiral's universal infrastructure translation system, enabling seamless development across all cloud and local environments.
