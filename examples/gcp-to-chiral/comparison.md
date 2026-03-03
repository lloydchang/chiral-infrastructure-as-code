# IaC Tools Comparison Guide - GCP Focus

This directory contains a comparison of Infrastructure as Code tools specifically for Google Cloud Platform.

## GCP IaC Tool Ecosystem

### Infrastructure Manager (Native GCP)
**Status**: Current, supported native GCP tool

**Strengths:**
- **Google Native**: Built-in to GCP console and CLI
- **YAML-based**: Declarative configuration
- **Integrated**: Works with gcloud CLI and console
- **Supported**: Long-term Google commitment

**Weaknesses:**
- **Template-only**: No programming constructs
- **YAML complexity**: Verbose for complex resources
- **Limited tooling**: Smaller ecosystem than Terraform

### Terraform for GCP (Third-Party)
**Status**: Popular third-party tool

**Strengths:**
- **Multi-cloud**: Works across AWS, Azure, GCP
- **HCL**: More readable than YAML
- **Ecosystem**: Largest module registry
- **Testing**: Better testing frameworks

**Weaknesses:**
- **State management**: Complex external state handling
- **Provider lag**: May lag behind GCP features
- **Learning curve**: HCL + Terraform concepts

## Recommendation for GCP

| Use Case | Recommended Tool | Rationale |
|-----------|------------------|-----------|
| Simple GCP projects | Infrastructure Manager | Native, simple, integrated |
| Complex multi-cloud | Terraform | Consistent across providers |
| Enterprise with Terraform | Terraform | Existing team expertise |
| Migration from Deployment Manager | Infrastructure Manager | Direct replacement |

## Why Infrastructure Manager for Chiral?

**Consistency with Chiral Pattern:**
- **AWS CDK** → CloudFormation (native AWS)
- **Azure Bicep** → ARM (native Azure)
- **Infrastructure Manager** → GCP YAML (native GCP)

**Chiral GCP Adapter** would generate Infrastructure Manager YAML templates, maintaining the pattern of generating native, cloud-specific artifacts.

## Migration from Deployment Manager

Since Deployment Manager is deprecated (March 31, 2026), Infrastructure Manager is the recommended replacement for native GCP IaC within the Chiral pattern.
