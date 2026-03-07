import { analyzeTerraformSetup, analyzePulumiSetup, compareApproaches, getMigrationStrategyInfo, generateMigrationPlan } from '../main';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('Main CLI Functions - Fixed Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleWarn.mockClear();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  describe('analyzeTerraformSetup', () => {
    it('should analyze Terraform directory with state files', async () => {
      const mockStateContent = JSON.stringify({
        version: 4,
        terraform_version: "1.5.0",
        serial: 1,
        lineage: "test-lineage",
        outputs: {
          cluster_endpoint: { value: "eks.example.com" }
        },
        resources: [
          {
            mode: "managed",
            type: "aws_eks_cluster",
            name: "main",
            provider: "provider[\"registry.terraform.io/hashicorp/aws\"]",
            instances: [
              {
                attributes: {
                  name: "my-cluster",
                  version: "1.29"
                }
              }
            ]
          },
          {
            mode: "managed",
            type: "aws_rds_instance",
            name: "postgres",
            provider: "provider[\"registry.terraform.io/hashicorp/aws\"]",
            instances: [
              {
                attributes: {
                  engine: "postgres",
                  engine_version: "15.4"
                }
              }
            ]
          }
        ]
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['terraform.tfstate', 'main.tf', 'outputs.tf'] as any);
      mockFs.readFileSync.mockReturnValue(mockStateContent);

      const result = await analyzeTerraformSetup('./terraform', 'aws', true);
      
      expect(result).toBeDefined();
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📋 Terraform Setup Analysis'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Total Resources: 2'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Provider: aws'));
    });

    it('should analyze Terraform directory with remote backend', async () => {
      const mockBackendConfig = `
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "prod/terraform.tfstate"
    region  = "us-west-2"
  }
}
`;

      const mockStateContent = JSON.stringify({
        version: 4,
        terraform_version: "1.5.0",
        serial: 1,
        lineage: "test-lineage",
        outputs: {},
        resources: []
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['terraform.tfstate', 'backend.tf'] as any);
      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('backend.tf')) return mockBackendConfig;
        if (filePath.includes('terraform.tfstate')) return mockStateContent;
        return '';
      });

      await analyzeTerraformSetup('./terraform', 'aws', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔍 Backend: S3'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Bucket: my-terraform-state'));
    });

    it('should handle missing Terraform files gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['main.tf', 'variables.tf'] as any);
      mockFs.readFileSync.mockReturnValue('');

      await analyzeTerraformSetup('./terraform', 'aws', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('⚠️ No state files found'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('💡 Consider running: terraform plan -out=tfplan'));
    });

    it('should handle corrupted Terraform state files', async () => {
      const mockCorruptedState = '{ invalid json';

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockCorruptedState);

      await expect(analyzeTerraformSetup('./terraform.tfstate', 'aws')).rejects.toThrow('Corrupted Terraform state file');
    });

    it('should handle empty Terraform state files', async () => {
      const mockEmptyState = JSON.stringify({
        version: 4,
        terraform_version: "1.5.0",
        serial: 1,
        lineage: "test-lineage",
        outputs: {},
        resources: []
      });

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockEmptyState);

      const result = await analyzeTerraformSetup('./terraform.tfstate', 'aws');
      
      expect(result).toBeDefined();
      expect((result as any).projectName).toBeUndefined();
    });
  });

  describe('analyzePulumiSetup', () => {
    it('should analyze Pulumi directory with TypeScript stack', async () => {
      const mockPulumiYaml = `
name: my-app
runtime: nodejs
description: Node.js application
`;

      const mockTsContent = `
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const bucket = new aws.s3.Bucket("my-bucket", {
  bucket: "my-test-bucket"
});

export const bucketName = bucket.id;
`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['Pulumi.yaml', 'index.ts'] as any);
      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('Pulumi.yaml')) return mockPulumiYaml;
        if (filePath.includes('index.ts')) return mockTsContent;
        return '';
      });

      await analyzePulumiSetup('./pulumi', 'aws', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📤 Stack Outputs'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔧 Runtime: nodejs'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📄 Stack Type: TypeScript'));
    });

    it('should handle missing Pulumi configuration', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue([] as any);

      await analyzePulumiSetup('./empty', 'aws', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('⚠️  No Pulumi.yaml found'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('💡 Consider running: pulumi new'));
    });
  });

  describe('compareApproaches', () => {
    it('should handle different team sizes', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await compareApproaches(10, 1, 'simple');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Team Size: 1'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Learning Curve: Low'));
      
      consoleSpy.mockRestore();
    });

    it('should handle large teams', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await compareApproaches(50, 20, 'complex');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Team Size: 20'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Learning Curve: High'));
      
      consoleSpy.mockRestore();
    });

    it('should show security considerations', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await compareApproaches(10, 5, 'medium');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🔒 Security'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Secret Management'));
      
      consoleSpy.mockRestore();
    });

    it('should show compliance features', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await compareApproaches(15, 8, 'complex');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📋 Compliance'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Audit Trail'));
      
      consoleSpy.mockRestore();
    });
  });
});
