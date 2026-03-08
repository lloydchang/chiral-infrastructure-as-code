# CDK Nag Setup for Chiral

To maintain parity in Chiral infrastructure strategy, enforce the same rigor on AWS CDK side as Bicep artifacts. Unlike Bicep's static template analysis, AWS CDK uses unit testing and Aspects (Visitor Pattern) for validation.

## CDK "Triple-Guard" Approach

Ensure CDK stacks are compliant with these three layers:

### 1. Security & Compliance: cdk-nag

The "gold standard" for AWS compliance, equivalent to Bicep linter. Uses Aspects to scan construct tree at synthesis time.

#### Setup

```bash
npm install cdk-nag
```

#### Application (in App or Stack file)

```typescript
import { Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';

const app = new App();
// Apply "AWS Solutions" pack to all stacks in app
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
```

**Benefit**: Fails synthesis (`cdk synth`) if infrastructure violates rules (e.g., S3 buckets without encryption, open security groups).

### 2. Policy Validation: CloudFormation Guard

Language-agnostic validation layer for generated CloudFormation (CDK output). Provides final "Policy-as-Code" audit before deployment.

### 3. Unit Testing: Snapshot Testing

Since CDK is code, write unit tests for infrastructure. Snapshot tests notify if TypeScript intent generates unexpected CloudFormation changes.

#### Implementation (Jest)

```typescript
test('S3 Bucket created with Encryption', () => {
  const app = new App();
  const stack = new MyStack(app, 'TestStack');
  // Snapshot template and compare to previous versions
  expect(Template.fromStack(stack)).toMatchSnapshot();
});
```

## Integrating into Chiral Workflow

Unify AWS and Azure validation with single validate script in root package:

```json
// package.json
"scripts": {
  "validate:aws": "cdk synth && cdk test",
  "validate:azure": "az bicep build --file main.bicep",
  "validate:all": "npm run validate:aws && npm run validate:azure"
}
```

## Why This Creates Parity

- **Shift Left Philosophy**: Both cdk-nag and bicepconfig.json catch misconfigurations locally before deployment.
- **Declarative vs. Imperative**: Different mechanisms (Aspects for CDK, static analysis for Bicep), but outcome is identical: Automated Governance.
