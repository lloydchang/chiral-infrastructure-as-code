terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Variables
variable "db_username" {
  description = "Database administrator username"
  type        = string
  default     = "demo_user"
}

variable "db_password" {
  description = "Database administrator password - CHANGE THIS IN PRODUCTION"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "demo_db"
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "main-vpc"
  }
}

# EKS Cluster
resource "aws_eks_cluster" "demo" {
  name     = "demo-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.35"

  vpc_config {
    subnet_ids = [aws_subnet.example1.id, aws_subnet.example2.id]
  }
}

# EKS Node Group
resource "aws_eks_node_group" "demo" {
  cluster_name    = aws_eks_cluster.demo.name
  node_group_name = "demo-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = [aws_subnet.example1.id, aws_subnet.example2.id]

  scaling_config {
    desired_size = 2
    max_size     = 5
    min_size     = 1
  }

  instance_type = "t3.medium"

  tags = {
    Name = "demo-nodes"
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "postgres" {
  allocated_storage    = 20
  engine              = "postgres"
  engine_version      = "15.3"
  instance_class      = "db.t3.medium"
  db_name             = var.db_name
  username            = var.db_username
  password            = var.db_password
  parameter_group_name = "default.postgres15"
  skip_final_snapshot = true

  tags = {
    Name = "demo-postgres"
  }
}

# EC2 Instance for ADFS
resource "aws_instance" "adfs" {
  ami           = "ami-12345678"
  instance_type = "t3.medium"

  tags = {
    Name = "demo-adfs"
  }
}

# IAM Role for EKS Cluster (placeholder)
resource "aws_iam_role" "eks_cluster" {
  name = "eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })
}

# IAM Role for EKS Nodes (placeholder)
resource "aws_iam_role" "eks_nodes" {
  name = "eks-nodes-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# Subnets (placeholders)
resource "aws_subnet" "example1" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "example1"
  }
}

resource "aws_subnet" "example2" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.2.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "example2"
  }
}
