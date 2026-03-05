// File: src/migration/templates/aws-eks-postgres-template.ts

// Migration Template: AWS EKS + PostgreSQL Setup
// Use this template to migrate typical AWS EKS + RDS PostgreSQL infrastructure

import { ChiralSystem } from '../../intent';

export const awsEksPostgresTemplate: ChiralSystem = {
  projectName: 'migrated-aws-infrastructure',
  environment: 'prod',
  networkCidr: '10.0.0.0/16',
  compliance: {
    framework: 'hipaa' as const,
  },
  region: {
    aws: 'us-east-1'
  },

  k8s: {
    version: '1.28',
    minNodes: 2,
    maxNodes: 5,
    size: 'large' // Will map to m5.large instances
  },

  postgres: {
    engineVersion: '15.3',
    size: 'large', // Will map to db.m5.large instance
    storageGb: 100
  },

  adfs: {
    size: 'medium', // Will map to m5.xlarge instance
    windowsVersion: '2022'
  },

  // Migration metadata
  migration: {
    strategy: 'progressive',
    rollbackPlan: [
      { description: 'Scale EKS node groups back to original size' },
      { description: 'Switch traffic back to original load balancer' },
      { description: 'Restore original security groups and IAM roles' },
      { description: 'Delete Chiral-generated resources' }
    ],
    validateCompliance: true,
    notes: [
      'Ensure EKS cluster version compatibility',
      'Migrate PostgreSQL data before cutover',
      'Test ADFS integration thoroughly',
      'Validate security group rules'
    ]
  }
};
