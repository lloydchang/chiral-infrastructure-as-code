terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Variables
variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "chiral-secrets-demo"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
  
  validation {
    condition     = var.db_allocated_storage >= 20
    error_message = "Storage must be at least 20GB."
  }
}

# Random password generation
resource "random_password" "db_password" {
  length  = 32
  special = true
  
  keepers = {
    # Generate new password only when project changes
    project_name = var.project_name
    environment   = var.environment
  }
}

# AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.project_name}-db-credentials-${var.environment}"
  description             = "Database credentials for ${var.project_name} in ${var.environment}"
  recovery_window_in_days = var.environment == "prod" ? 30 : 0
  
  tags = {
    Environment = var.environment
    Project    = var.project_name
    ManagedBy  = "chiral-secrets-manager"
    Rotation   = "automatic"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = "chiral_admin"
    password = random_password.db_password.result
    engine   = "postgres"
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    database = aws_db_instance.main.db_name
  })
}

# IAM Role for Secret Rotation
resource "aws_iam_role" "secret_rotation" {
  name = "${var.project_name}-secret-rotation"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Environment = var.environment
    Project    = var.project_name
    Purpose    = "secret-rotation"
  }
}

# IAM Policy for Secret Rotation
resource "aws_iam_policy" "secret_rotation" {
  name = "${var.project_name}-secret-rotation-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:RotateSecret"
        ]
        Resource = aws_secretsmanager_secret.db_credentials.arn
      },
      {
        Effect = "Allow"
        Action = [
          "rds:ModifyDBInstance",
          "rds:DescribeDBInstances"
        ]
        Resource = aws_db_instance.main.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "secret_rotation" {
  role       = aws_iam_role.secret_rotation.name
  policy_arn = aws_iam_policy.secret_rotation.arn
}

# Lambda for Secret Rotation (simplified example)
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.secret_rotation.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  
  tags = {
    Name        = "${var.project_name}-vpc"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_subnet" "main" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
  
  tags = {
    Name        = "${var.project_name}-subnet"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Security Group
resource "aws_security_group" "database" {
  name   = "${var.project_name}-db-sg"
  vpc_id = aws_vpc.main.id
  
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name        = "${var.project_name}-db-sg"
    Environment = var.environment
    Project     = var.project_name
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-db-${var.environment}"
  
  engine         = "postgres"
  engine_version = "15.3"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 2
  storage_type         = "gp2"
  storage_encrypted     = true
  
  db_name  = "chiral_db"
  username = jsondecode(aws_secretsmanager_secret_version.db_credentials.secret_string)["username"]
  password = jsondecode(aws_secretsmanager_secret_version.db_credentials.secret_string)["password"]
  
  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = var.environment == "prod" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = var.environment != "prod"
  
  deletion_protection = var.environment == "prod"
  
  tags = {
    Name        = "${var.project_name}-db-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "chiral-secrets-manager"
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = [aws_subnet.main.id]
  
  tags = {
    Name        = "${var.project_name}-db-subnet-group"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Secret Rotation Configuration
resource "aws_secretsmanager_secret_rotation" "db_rotation" {
  secret_id           = aws_secretsmanager_secret.db_credentials.id
  rotation_lambda_arn  = aws_lambda_function.rotation.arn
  rotation_rules {
    automatically_after_days = 90
  }
}

# Lambda Function for Secret Rotation
resource "aws_lambda_function" "rotation" {
  filename         = "rotation.zip"
  function_name    = "${var.project_name}-db-rotation"
  role            = aws_iam_role.secret_rotation.arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 300
  
  # Simplified rotation function - in production, use AWS's rotation templates
  source_code_hash = filebase64sha256("rotation.zip")
  
  environment {
    variables = {
      SECRET_ID = aws_secretsmanager_secret.db_credentials.id
    }
  }
  
  tags = {
    Name        = "${var.project_name}-db-rotation"
    Environment = var.environment
    Project     = var.project_name
    Purpose     = "secret-rotation"
  }
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "rotation" {
  name              = "/aws/lambda/${aws_lambda_function.rotation.function_name}"
  retention_in_days = var.environment == "prod" ? 365 : 30
  
  tags = {
    Name        = "${var.project_name}-rotation-logs"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Outputs
output "database_endpoint" {
  description = "RDS database endpoint"
  value       = aws_db_instance.main.address
  sensitive   = true
}

output "database_port" {
  description = "RDS database port"
  value       = aws_db_instance.main.port
  sensitive   = true
}

output "secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.db_credentials.arn
  sensitive   = true
}

output "secret_name" {
  description = "Secrets Manager secret name"
  value       = aws_secretsmanager_secret.db_credentials.name
}

output "rotation_lambda_arn" {
  description = "Secret rotation Lambda ARN"
  value       = aws_lambda_function.rotation.arn
}
