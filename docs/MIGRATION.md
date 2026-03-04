# Migration Guide

## Overview

Chiral provides import tools to convert existing infrastructure as code (IaC) into Chiral intent schemas, helping teams migrate from traditional IaC tools to the Chiral pattern. This enables easier adoption by allowing you to start with existing infrastructure definitions.

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

## Examples

### Importing from Terraform

```bash
# From HCL configuration
npx ts-node src/main.ts import -s main.tf -p gcp -o config.ts

# From state file (if HCL parsing fails)
npx ts-node src/main.ts import -s terraform.tfstate -p aws -o config.ts
```

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

- **Heuristic Mapping**: Conversions use best-effort heuristics; complex or custom resources may require manual adjustment
- **Fidelity Loss**: Some cloud-specific configurations cannot be perfectly abstracted to Chiral intent
- **Security Review**: Generated configs should be reviewed, especially when importing from state files containing sensitive data
- **Scope**: Currently focuses on core resources (Kubernetes, databases, VMs); advanced features may not be supported
- **Dependencies**: Requires Azure CLI for Bicep parsing, and the CLI must be available in PATH

## Post-Import Steps

1. **Review Generated Config**: Check the output file for accuracy and completeness
2. **Refine Intent**: Adjust workload sizes, regions, or other inferred values as needed
3. **Test Generation**: Run `npx ts-node src/main.ts compile -c chiral.config.ts` to generate artifacts
4. **Validate Artifacts**: Deploy to a test environment and verify the generated infrastructure matches your intent

## Troubleshooting

### Common Issues

- **"Unsupported file extension"**: Ensure the file has a supported extension (.tf, .tfstate, .yaml, .yml, .json, .bicep)
- **"Command failed" for Bicep**: Install Azure CLI and ensure `az` is in PATH
- **Empty or incomplete config**: The IaC may contain unsupported resources; start with simpler files or manually add missing intent
- **Type errors in generated config**: Fix any TypeScript issues by adjusting the config structure

### Getting Help

- Check the generated config file for comments indicating mapping issues
- Compare with the original IaC to identify unmapped resources
- For complex migrations, consider starting with a minimal IaC file and building up

## Roadmap

Future enhancements may include:
- Support for additional IaC formats (Pulumi, CDK apps)
- Improved mapping accuracy for complex resources
- Batch import from multiple files
- Integration with cloud APIs for live infrastructure import
