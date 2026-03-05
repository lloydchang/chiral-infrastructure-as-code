# Secret Manager Integration Examples

This directory contains examples of integrating Chiral with cloud secret management services for production deployments.

## 📁 Structure

```
secret-manager-integration/
├── aws-secrets-manager/
│   ├── README.md
│   ├── terraform-example.tf
│   └── deployment-guide.md
├── azure-key-vault/
│   ├── README.md
│   ├── bicep-example.bicep
│   └── deployment-guide.md
└── gcp-secret-manager/
    ├── README.md
    ├── terraform-example.tf
    └── deployment-guide.md
```

## 🎯 Purpose

Demonstrates how to:
- **Generate secure credentials** using cloud secret managers
- **Inject secrets at deployment time** instead of storing in IaC
- **Implement proper secret rotation** policies
- **Follow security best practices** for production workloads

## 🔒 Security Benefits

- **No hardcoded secrets** in infrastructure code
- **Automatic secret generation** for unique credentials
- **Centralized secret management** across environments
- **Audit trails and access controls** for secret access
- **Integration with Chiral's** intent-based approach

## 🚀 Quick Start

### AWS Secrets Manager
```bash
cd aws-secrets-manager
terraform apply
```

### Azure Key Vault
```bash
cd azure-key-vault
az deployment group create ...
```

### GCP Secret Manager
```bash
cd gcp-secret-manager
gcloud deployment-manager deployments create ...
```

## 📚 Documentation

Each provider directory contains:
- **Integration examples** with Chiral-generated code
- **Step-by-step deployment guides**
- **Security configuration** recommendations
- **Monitoring and rotation** setup instructions
