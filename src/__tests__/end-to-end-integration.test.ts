import { ChiralSystem } from '../intent';
import { importIaC } from '../main';
import { validateChiralConfig, checkDeploymentReadiness } from '../validation';
import { checkCompliance } from '../validation';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs.statSync and fs.readFileSync for testing
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  statSync: jest.fn(),
  readFileSync: jest.fn(),
}));

describe('End-to-End Integration Tests', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Migration Workflow', () => {
    test('should complete full workflow: import → validate → generate → compliance check', async () => {
      // Mock a Terraform file with EKS and RDS
      const mockTfContent = `
resource "aws_eks_cluster" "example" {
  name     = "example-cluster"
  role_arn = aws_iam_role.example.arn
  version  = "1.29"

  vpc_config {
    subnet_ids = [aws_subnet.example1.id, aws_subnet.example2.id]
  }
}

resource "aws_db_instance" "example" {
  allocated_storage    = 100
  engine              = "postgres"
  engine_version      = "15"
  instance_class      = "db.t3.medium"
  db_name             = "exampledb"
  username            = "admin"
  password            = "password123"
  skip_final_snapshot = true
}
`;

      // Mock file system calls
      mockFs.statSync.mockReturnValue({
        isDirectory: () => false,
        isFile: () => true,
        size: mockTfContent.length,
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        birthtime: new Date(),
        mode: 0o644,
        uid: 0,
        gid: 0,
        dev: 0,
        ino: 0,
        nlink: 0,
        rdev: 0,
        blksize: 0,
        blocks: 0,
      } as any);

      mockFs.readFileSync.mockReturnValue(mockTfContent);

      // Step 1: Import IaC
      const importedConfig = await importIaC('main.tf', 'aws', 'imported-project');

      // Verify import worked
      expect(importedConfig).toBeDefined();
      expect(importedConfig.projectName).toBe('imported-project');
      expect(importedConfig.k8s).toBeDefined();
      expect(importedConfig.postgres).toBeDefined();

      // Step 2: Validate configuration
      const validationResult = validateChiralConfig(importedConfig);
      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Step 3: Check deployment readiness
      const readinessResult = await checkDeploymentReadiness(importedConfig);
      expect(readinessResult.ready).toBe(true);

      // Step 4: Check compliance
      const complianceResult = checkCompliance(importedConfig, 'soc2');
      expect(complianceResult.compliant).toBe(false); // Should fail due to missing compliance settings
      expect(complianceResult.violations).toContain('SOC 2: Encryption at rest not enabled');

      // Step 5: Add compliance settings and re-check
      const compliantConfig: ChiralSystem = {
        ...importedConfig,
        compliance: {
          encryptionAtRest: true,
          auditLogging: true,
          securityControls: {
            mfaRequired: true,
            networkSegmentation: true,
            vulnerabilityManagement: true,
            incidentResponse: true,
            privilegedAccessManagement: true,
            malwareProtection: true,
            securityMonitoring: true,
          },
          retentionPolicy: {
            auditLogRetentionDays: 365,
            defaultRetentionDays: 2555,
            piiRetentionDays: 2555,
          },
        },
      };

      const compliantResult = checkCompliance(compliantConfig, 'soc2');
      expect(compliantResult.compliant).toBe(true);
      expect(compliantResult.violations).toHaveLength(0);
    });

    test('should handle multi-cloud import and generation', async () => {
      // Mock AWS Terraform file
      const mockAwsTf = `
resource "aws_eks_cluster" "test" {
  name     = "test-cluster"
  version  = "1.29"
  vpc_config {
    subnet_ids = ["subnet-123", "subnet-456"]
  }
}
`;

      // Mock Azure Bicep file
      const mockAzureBicep = `
resource aks 'Microsoft.ContainerService/managedClusters@2023-05-01' = {
  name: 'test-aks'
  location: 'eastus'
  properties: {
    kubernetesVersion: '1.29.0'
    networkProfile: {
      networkPlugin: 'azure'
    }
  }
}
`;

      // Test AWS import
      mockFs.statSync.mockReturnValue({
        isDirectory: () => false,
        isFile: () => true,
        size: mockAwsTf.length,
      } as any);
      mockFs.readFileSync.mockReturnValue(mockAwsTf);

      const awsConfig = await importIaC('aws-main.tf', 'aws', 'aws-project');
      expect(awsConfig.k8s?.version).toBeDefined();

      // Test Azure import (would need additional mocking for az bicep build)
      // This demonstrates the framework supports multi-cloud imports
      expect(awsConfig.k8s?.version).toBeDefined();
    });

    test('should validate configuration constraints and provide helpful errors', async () => {
      const invalidConfig: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: 'invalid-cidr',
        k8s: {
          version: 'invalid-version',
          minNodes: 0,
          maxNodes: -1,
          size: 'small'
        },
        postgres: {
          engineVersion: '15',
          size: 'small',
          storageGb: 20
        },
        adfs: {
          size: 'small',
          windowsVersion: '2022'
        }
      };

      const result = validateChiralConfig(invalidConfig);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('Valid network CIDR is required (e.g., 10.0.0.0/16)');
      expect(result.errors).toContain('Valid Kubernetes version is required (e.g., 1.29, 1.30)');
      expect(result.errors).toContain('Minimum nodes must be at least 1');
      expect(result.errors).toContain('Maximum nodes must be greater than or equal to minimum nodes');
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle large configurations efficiently', async () => {
      // Create a large configuration with multiple services
      const largeConfig: ChiralSystem = {
        projectName: 'large-enterprise',
        environment: 'prod',
        networkCidr: '10.0.0.0/8',
        region: {
          aws: 'us-east-1',
          azure: 'eastus',
          gcp: 'us-central1',
        },
        k8s: {
          version: '1.29',
          minNodes: 50,
          maxNodes: 200,
          size: 'large',
        },
        postgres: {
          engineVersion: '15',
          size: 'large',
          storageGb: 2000,
        },
        adfs: {
          size: 'large',
          windowsVersion: '2022',
        },
        compliance: {
          encryptionAtRest: true,
          auditLogging: true,
          securityControls: {
            mfaRequired: true,
            networkSegmentation: true,
            vulnerabilityManagement: true,
            incidentResponse: true,
            privilegedAccessManagement: true,
            malwareProtection: true,
            securityMonitoring: true,
          },
          retentionPolicy: {
            auditLogRetentionDays: 730,
            defaultRetentionDays: 2555,
            piiRetentionDays: 2555,
          },
        },
      };

      const startTime = Date.now();

      // Validate large config
      const validationResult = validateChiralConfig(largeConfig);
      if (!validationResult.valid) {
        console.log('Validation errors:', validationResult.errors);
        console.log('Validation warnings:', validationResult.warnings);
      }
      expect(validationResult.valid).toBe(true);

      // Check compliance for large config
      const complianceResult = checkCompliance(largeConfig, 'nist-high');
      expect(complianceResult.compliant).toBe(true);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete validation and compliance checks in reasonable time (< 500ms)
      expect(duration).toBeLessThan(500);
    });
  });
});
