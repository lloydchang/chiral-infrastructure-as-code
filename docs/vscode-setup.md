# VS Code Setup for Chiral Linting

To achieve real-time linting and security validation for Chiral in Visual Studio Code, use a two-pronged approach leveraging native language servers for Bicep and Aspect-based validation for AWS CDK.

## 1. Azure Bicep (Native Integration)

The Bicep experience is built into the official Bicep extension for VS Code. It provides "linting as you type" without extra setup.

- **Real-time Linting**: Install the Bicep extension from VS Code Marketplace. It automatically validates Bicep code against Azure Resource Manager schema.
- **Best Practice Enforcement**: Drop a `bicepconfig.json` file in root folder. Bicep language server detects it and underlines violations (errors/warnings) in editor in real-time.
- **Deployment Pane**: Use built-in "Deployment Pane" (cloud icon in top right) to run validate or what-if commands against actual Azure subscription without leaving file.

## 2. AWS CDK (Aspect-based Validation)

Since CDK is code (TypeScript/Python), it lacks a "static" linter like Bicep. Use Aspects for real-time feedback.

- **CDK-NAG**: Add `Aspects.of(app).add(new AwsSolutionsChecks())` to `bin/app.ts` for self-validating code. Terminal outputs violations on save or `cdk synth`.
- **IDE Extension**: Install CDK NAG Validator extension. It runs cdk-nag engine and highlights security/compliance findings in editor's "Problems" pane.

## Summary of VS Code Setup

| Feature               | Azure Bicep                | AWS CDK                     |
|-----------------------|----------------------------|-----------------------------|
| Primary Tool         | Bicep VS Code Extension   | cdk-nag library            |
| Real-time Feedback   | Automatic via Extension   | cdk-nag (terminal/extension)|
| Governance           | bicepconfig.json          | AwsSolutionsChecks (Aspects)|
| Visibility           | "Problems" Pane           | "Problems" Pane / Terminal |

## Next Step for Chiral

To complete integration, add a `settings.json` file to project's `.vscode/` folder to ensure all developers get the same linting experience.

**Recommended**: Create `.vscode/settings.json` that forces Bicep linter and CDK-NAG validator to ignore specific folders (like `cdk.out`) and focus on source code. (Settings template not provided in source.)
