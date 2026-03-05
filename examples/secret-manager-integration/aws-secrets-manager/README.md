# AWS Secrets Manager Integration with Chiral

This example demonstrates how to integrate Chiral-generated infrastructure with AWS Secrets Manager for secure credential management.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Chiral       │    │  AWS Secrets    │    │   RDS          │
│   Intent       │───▶│   Manager       │───▶│   PostgreSQL    │
│   Generator    │    │                 │    │   Database      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📁 Files

- `terraform-example.tf` - Terraform configuration with secret integration
- `deployment-guide.md` - Step-by-step deployment instructions

## 🔒 Security Features

### 1. Automatic Secret Generation
```hcl
resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${var.project_name}-db-password"
  description             = "Database password for ${var.project_name}"
  recovery_window_in_days = 0
  
  tags = {
    Environment = var.environment
    Project    = var.project_name
    ManagedBy  = "chiral-secrets-manager"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = "postgres_admin"
    password = random_password.db_password.result
  })
}
```

### 2. Random Password Generation
```hcl
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_db_instance" "main" {
  # ... other configuration ...
  username = jsondecode(aws_secretsmanager_secret_version.db_password.secret_string)["username"]
  password = jsondecode(aws_secretsmanager_secret_version.db_password.secret_string)["password"]
}
```

### 3. Secret Rotation
```hcl
resource "aws_secretsmanager_secret_rotation" "db_rotation" {
  secret_id           = aws_secretsmanager_secret.db_password.id
  rotation_lambda_arn = aws_lambda_function.rotation.arn
  
  rotation_rules {
    automatically_after_days = 90
  }
}
```

## 🚀 Deployment

1. **Initialize Terraform:**
   ```bash
   terraform init
   ```

2. **Review the plan:**
   ```bash
   terraform plan
   ```

3. **Apply the configuration:**
   ```bash
   terraform apply
   ```

4. **Retrieve credentials:**
   ```bash
   aws secretsmanager get-secret-value --secret-id my-project-db-password
   ```

## 📊 Monitoring

### CloudWatch Integration
- **Secret access logging** via CloudTrail
- **Rotation success/failure** metrics
- **Unauthorized access attempts** alerts

### IAM Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:my-project-*"
    }
  ]
}
```

## 🔄 Integration with Chiral

### 1. Generate Chiral Intent
```bash
npx chiral generate --config chiral.config.ts
```

### 2. Apply Secret Manager Integration
```bash
# Chiral generates base infrastructure
terraform apply chiral-generated.tf

# Apply secret manager overlay
terraform apply terraform-example.tf
```

### 3. Update Application Configuration
```typescript
// Application code retrieves secrets at runtime
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getDatabaseCredentials() {
  const secret = await secretsManager.getSecretValue({
    SecretId: process.env.DB_SECRET_NAME
  }).promise();
  
  return JSON.parse(secret.SecretString);
}
```

## 🛡️ Best Practices

1. **Never store secrets in code** - use Secrets Manager
2. **Enable automatic rotation** for all database credentials
3. **Use least privilege access** for secret access
4. **Monitor secret access** with CloudTrail
5. **Tag secrets properly** for environment separation
6. **Test secret rotation** regularly
7. **Use VPC endpoints** for Secrets Manager access

## 🔧 Customization

### Environment-Specific Secrets
```hcl
# Development
resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.project_name}-db-password-dev"
}

# Production
resource "aws_secretsmanager_secret" "db_password" {
  name = "${var.project_name}-db-password-prod"
  recovery_window_in_days = 30  # Allow recovery
}
```

### Cross-Account Secret Access
```hcl
resource "aws_secretsmanager_secret_policy" "cross_account" {
  secret_arn = aws_secretsmanager_secret.db_password.arn
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::PROD_ACCOUNT:root"
        }
        Action = "secretsmanager:GetSecretValue"
        Resource = "*"
      }
    ]
  })
}
```

## 📚 Additional Resources

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Chiral Security Best Practices](../../../docs/SECURITY.md)
