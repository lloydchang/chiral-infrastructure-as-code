#!/bin/bash

# GCP Terraform Deployment Script with State Management Best Practices
# This script demonstrates safe Terraform deployment for Chiral-generated GCP infrastructure

set -e  # Exit on any error

# Configuration
TERRAFORM_DIR="dist"
TERRAFORM_FILE="gcp-deployment.tf"
PROJECT_NAME="your-gcp-project-id"  # Replace with your GCP project ID
BUCKET_NAME="your-terraform-state-bucket"  # Replace with your GCS bucket for state

echo "🚀 Starting Chiral GCP Terraform Deployment"
echo "==========================================="

# Change to the directory containing the generated Terraform file
cd "$TERRAFORM_DIR"

# Initialize Terraform with remote backend
echo "🔧 Initializing Terraform with GCS backend..."
terraform init \
  -backend-config="bucket=$BUCKET_NAME" \
  -backend-config="prefix=$PROJECT_NAME/terraform-state"

# Validate the configuration
echo "🔍 Validating Terraform configuration..."
terraform validate

# Plan the deployment
echo "📋 Planning Terraform deployment..."
terraform plan \
  -out=tfplan \
  -var="project_id=$PROJECT_NAME"

# Apply the deployment (optional - comment out for manual review)
echo "⚠️  Applying Terraform deployment..."
echo "   This will create/modify infrastructure in GCP."
read -p "   Do you want to continue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    terraform apply tfplan
    echo "✅ Deployment completed successfully!"
else
    echo "❌ Deployment cancelled."
    exit 1
fi

echo ""
echo "📊 State Management Notes:"
echo "=========================="
echo "- State is stored in GCS bucket: gs://$BUCKET_NAME/$PROJECT_NAME/terraform-state/"
echo "- Ensure proper IAM permissions for team members"
echo "- Consider enabling versioning on the GCS bucket"
echo "- For disaster recovery, regularly backup state files"
echo ""
echo "🔒 Security Reminders:"
echo "======================"
echo "- Never commit state files to version control"
echo "- State files may contain sensitive information"
echo "- Use encryption at rest for GCS bucket"
echo "- Rotate access keys regularly"
