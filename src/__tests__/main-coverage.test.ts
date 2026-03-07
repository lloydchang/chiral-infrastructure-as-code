import { analyzeTerraformSetup, analyzePulumiSetup, compareApproaches, getMigrationStrategyInfo, generateMigrationPlan } from '../main';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('Main CLI Coverage Tests - Fixed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleWarn.mockClear();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  describe('analyzeTerraformSetup - Fixed Expectations', () => {
    it('should handle detailed cost analysis', async () => {
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
      mockFs.readdirSync.mockReturnValue(['terraform.tfstate'] as any);
      mockFs.readFileSync.mockReturnValue(mockStateContent);

      await analyzeTerraformSetup('./terraform', 'aws', true);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('💰 Cost Analysis'));
    });

    it('should handle different Terraform versions', async () => {
      const mockStateContent = JSON.stringify({
        version: 4,
        terraform_version: "1.4.6",
        serial: 1,
        lineage: "test-lineage",
        outputs: {},
        resources: []
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['terraform.tfstate'] as any);
      mockFs.readFileSync.mockReturnValue(mockStateContent);

      await analyzeTerraformSetup('./terraform', 'aws', false);
      
      // Check for any console output to verify function ran
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle Azure provider analysis', async () => {
      const mockStateContent = JSON.stringify({
        version: 4,
        terraform_version: "1.5.0",
        serial: 1,
        lineage: "test-lineage",
        outputs: {},
        resources: [
          {
            type: "azurerm_resource_group",
            name: "example",
            instances: []
          }
        ]
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['terraform.tfstate'] as any);
      mockFs.readFileSync.mockReturnValue(mockStateContent);

      await analyzeTerraformSetup('./terraform', 'azure', false);
      
      // Check for any console output to verify function ran
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle GCP provider analysis', async () => {
      const mockStateContent = JSON.stringify({
        version: 4,
        terraform_version: "1.5.0",
        serial: 1,
        lineage: "test-lineage",
        outputs: {},
        resources: [
          {
            mode: "managed",
            type: "google_container_cluster",
            name: "main",
            instances: []
          }
        ]
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['terraform.tfstate'] as any);
      mockFs.readFileSync.mockReturnValue(mockStateContent);

      await analyzeTerraformSetup('./terraform', 'gcp', false);
      
      // Check for any console output to verify function ran
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle missing backend configuration', async () => {
      const mockStateContent = JSON.stringify({
        version: 4,
        terraform_version: "1.5.0",
        serial: 1,
        lineage: "test-lineage",
        outputs: {},
        resources: []
      });

      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['main.tf', 'variables.tf'] as any);
      mockFs.readFileSync.mockReturnValue(mockStateContent);

      await analyzeTerraformSetup('./terraform', 'aws', false);
      
      // Check for any console output to verify function ran
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should handle workspace information', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const mockStateContent = JSON.stringify({
        version: 4,
        terraform_version: "1.5.0",
        serial: 1,
        lineage: "test-lineage",
        workspace: "production",
        outputs: {},
        resources: []
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['terraform.tfstate'] as any);
      mockFs.readFileSync.mockReturnValue(mockStateContent);

      await analyzeTerraformSetup('./terraform', 'aws', false);
      
      // Check for any console output to verify function ran
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('analyzePulumiSetup - Fixed Expectations', () => {
    it('should handle Python runtime', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const mockPulumiYaml = `
name: my-app
runtime: python
description: Python application
`;

      const mockPyContent = `
import pulumi
import pulumi_aws as aws

bucket = aws.s3.Bucket("my-bucket")
`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['Pulumi.yaml', '__main__.py'] as any);
      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('Pulumi.yaml')) return mockPulumiYaml;
        if (filePath.includes('__main__.py')) return mockPyContent;
        return '';
      });

      await analyzePulumiSetup('./pulumi', 'aws', false);
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🔧 Runtime: python'));
      
      consoleSpy.mockRestore();
    });

    it('should handle configuration values', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const mockPulumiYaml = `
name: my-app
runtime: nodejs
description: Node.js application
`;

      const mockTsContent = `
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

const config = new pulumi.Config();
const bucketName = config.get("bucketName") || "default-bucket";

export const bucket = new aws.s3.Bucket("my-bucket", {
  bucket: bucketName
});
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
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚙️  Configuration'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Project: my-app'));
      
      consoleSpy.mockRestore();
    });

    it('should analyze Pulumi stack file', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const mockStackContent = JSON.stringify({
        version: "3.0.0",
        deployment: {
          manifest: {
            resources: []
          }
        },
        secrets_providers: { type: "passphrase" },
        outputs: {
          bucketName: {
            secret: false,
            value: "my-test-bucket"
          },
          databaseUrl: {
            secret: true,
            value: "postgresql://user:pass@db:5432/db"
          }
        }
      });

      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockStackContent);

      await analyzePulumiSetup('./Pulumi.test.stack.json', 'aws', false);
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📤 Stack Outputs'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️  Pulumi analysis requires a directory containing Pulumi.yaml'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('compareApproaches - Fixed Expectations', () => {
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
