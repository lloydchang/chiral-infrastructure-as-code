// File: src/migration/templates/aws-eks-postgres-template.ts

// Migration Template: AWS EKS + PostgreSQL Setup
// Use this template to migrate typical AWS EKS + RDS PostgreSQL infrastructure

import { ChiralSystem } from '../../intent';

export const awsEksPostgresTemplate: Partial<ChiralSystem> = {
  projectName: 'migrated-aws-infrastructure',
  environment: 'prod',
  networkCidr: '10.0.0.0/16',

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
    source: 'terraform',
    strategy: 'progressive',
    rollbackPlan: {
      steps: [
        'Scale EKS node groups back to original size',
        'Switch traffic back to original load balancer',
        'Restore original security groups and IAM roles',
        'Delete Chiral-generated resources'
      ],
      estimatedTime: '2 hours',
      requiresDowntime: false
    },
    validateCompliance: ['soc2', 'hipaa'],
    notes: [
      'Ensure EKS cluster version compatibility',
      'Migrate PostgreSQL data before cutover',
      'Test ADFS integration thoroughly',
      'Validate security group rules'
    ]
  }
};
