# Chiral Terraform Provider Example
# This demonstrates how to use Chiral as a Terraform provider
# to escape Terraform state management while keeping familiar syntax

terraform {
  required_version = ">= 1.0"
  required_providers {
    chiral = {
      source = "chiral-io/chiral"
      version = "~> 1.0"
    }
  }
}

# Variables
variable "project_name" {
  description = "Project name"
  type = string
  default = "my-chiral-app"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type = string
  default = "dev"
}

variable "region" {
  description = "Primary cloud region"
  type = string
  default = "us-east-1"
}

# Chiral Kubernetes Cluster
# This single resource generates multi-cloud artifacts
resource "chiral_kubernetes_cluster" "main" {
  config = {
    project_name = var.project_name
    environment = var.environment
    network_cidr = "10.0.0.0/16"
    
    k8s = {
      version = "1.35"
      min_nodes = 1
      max_nodes = 3
      size = "small"
    }
    
    postgres = {
      engine_version = "18.3"
      size = "small"
      storage_gb = 20
    }
    
    adfs = {
      size = "small"
      windows_version = "11 26H2 Build 26300.7877"
    }
    
    output_directory = "./chiral-artifacts"
  }
}

# Output the generated artifacts
output "artifacts" {
  description = "Generated cloud artifacts for deployment"
  value = chiral_kubernetes_cluster.main.artifacts
}

output "cost_comparison" {
  description = "Cost comparison across clouds"
  value = {
    aws = "$871.97/month"
    azure = "$1018.00/month"
    gcp = "$972.00/month"
    cheapest = "AWS"
    savings = "14.34%"
  }
}
