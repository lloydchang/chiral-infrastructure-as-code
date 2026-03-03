# CDK to Chiral Conversion Guide

This directory contains an example of converting a traditional AWS CDK stack to the Chiral pattern.

## Example: cdk-stack.ts and app.ts

- `cdk-stack.ts`: A traditional CDK stack with InfrastructureStack class using ChiralStackProps.
- `app.ts`: Instantiates stack with hardcoded props.

This example demonstrates a multi-cloud infrastructure (EKS, PostgreSQL, AD FS) implemented as a single CDK stack with props-based configuration.

## Converting Existing CDK to Chiral

The Chiral pattern converts traditional CDK projects into a multi-cloud, intent-driven architecture. Follow these steps to convert any existing CDK stack:

### Step 1: Analyze Your Existing CDK
- Review your CDK stack to identify core resources (e.g., VPC, EKS, RDS, EC2).
- Note hardcoded values (instance sizes, versions, CIDRs) and business logic.
- Determine business requirements: environment, sizing strategy, compliance needs.

### Step 2: Define Business Intent First
- Create `chiral.config.ts` with a `ChiralSystem` object representing business requirements:
  ```typescript
  export const config: ChiralSystem = {
    projectName: 'my-app',
    environment: 'prod', // or 'dev'
    networkCidr: '10.0.0.0/16',
    k8s: { version: '1.29', minNodes: 2, maxNodes: 5 },
    postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
    adfs: { size: 'large', windowsVersion: '2022' }
  };
  ```
- Ensure `src/intent/index.ts` has the necessary interfaces (`ChiralSystem`, etc.).

### Step 3: Update Rosetta Mappings
- Modify `src/rosetta/hardware-map.ts` to include your cloud SKUs:
  ```typescript
  export const HardwareMap = {
    aws: { db: { small: 't3.medium', large: 'm5.large' }, vm: { small: 't3.large', large: 'm5.xlarge' } },
    azure: { db: { small: 'Standard_B2s', large: 'Standard_D4s_v3' }, vm: { small: 'Standard_D2s_v3', large: 'Standard_D4s_v3' } }
  };
  ```

### Step 4: Refactor to AWS Adapter
- Extract your CDK stack logic into `src/adapters/aws-left.ts` as `AwsLeftHandAdapter`.
- Replace hardcodes with `intent` properties and `HardwareMap` lookups.
- Break down into methods: `createVpc`, `createEksCluster`, etc.
- Add security integrations and outputs.

### Step 5: Create Azure Adapter
- Implement `src/adapters/azure-right.ts` with `AzureRightHandAdapter.synthesize()`.
- Map resources to Azure equivalents with proper parameters and outputs.

### Step 6: Update Orchestrator
- Ensure `src/main.ts` imports both adapters and synthesizes from config.
- Run `npm run compile` to generate CloudFormation.

### Step 7: Test and Validate
- Deploy CloudFormation to AWS.
- Ensure output matches the original CDK functionality.

### Benefits of Conversion
- **Single Source of Truth**: Changes to config update both clouds.
- **No Vendor Lock-in**: Direct generation avoids third-party tools.
- **Consistency**: Intent drives identical functionality across providers.

### LLM-Assisted Conversion

While manual conversion follows the steps above, an LLM (Large Language Model) can automate much of the process by analyzing your CDK code and generating Chiral artifacts.

### What an LLM Needs
1. **CDK Source Code**: The full TypeScript stack file(s).
2. **Chiral Pattern Knowledge**: This README and the chiral codebase structure.
3. **Target Interfaces**: `ChiralSystem`, `HardwareMap`, adapter examples.
4. **Business Context**: Describe your environment (dev/prod) and requirements.

### How LLM Conversion Works
- **Prompt**: "Convert this CDK stack to Chiral format using the provided interfaces and mappings."
- **Analysis**: LLM parses constructs, infers intent from comments/variables (e.g., `t3.medium` → `size: 'small'`), abstracts hardcodes.
- **Output**: Generates `chiral.config.ts`, refactors adapters, ensures synthesis compatibility.
- **Validation**: Test with `npm run compile` and compare outputs.

### Advantages of LLM Approach
- **Speed**: Automates refactoring in minutes.
- **Intent Inference**: Uses probabilistic reasoning on code to identify business requirements.
- **Accuracy**: Reduces manual errors in abstraction.

### Example Prompt for LLM
```
Convert the following CDK stack to Chiral format. Use the ChiralSystem interface and generate adapters that match the functionality. Ensure the config abstracts sizes and environments properly.

[Insert CDK code here]
```

### Non-LLM Alternatives
- **AST Parsers**: Tools like TypeScript Compiler API can extract structure but lack intent understanding.
- **CDK Plugins**: Limited to AWS-specific analysis.

LLMs are recommended for creative refactoring like this. If you have CDK code, provide it for demonstration.

### Example Walkthrough
The files in this directory (`cdk-stack.ts`, `app.ts`) show a before-conversion CDK stack. Compare with the main chiral implementation in `src/` to see the transformation.
