import { analyzeTerraformSetup, analyzePulumiSetup, compareApproaches, getMigrationStrategyInfo, generateMigrationPlan } from '../main';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock path module
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  basename: jest.fn((filePath: string) => filePath.split('/').pop() || ''),
  join: jest.fn((...args: string[]) => args.join('/'))
}));

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('Main CLI Functions - Extended Coverage', () => {
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
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📊 Resource Count: 2'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔍 Backend: Local'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('💰 Estimated Monthly Cost'));
    });

    it('should analyze Terraform directory with remote backend', async () => {
      const mockBackendConfig = `
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-west-2"
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
      mockFs.readdirSync.mockReturnValue(['backend.tf', 'main.tf'] as any);
      mockFs.readFileSync.mockImplementation((path: any, options?: any) => {
        const filePath = typeof path === 'string' ? path : String(path);
        if (filePath.includes('backend.tf')) return mockBackendConfig;
        if (filePath.includes('terraform.tfstate')) return mockStateContent;
        return '';
      });

      await analyzeTerraformSetup('./terraform', 'aws', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔍 Backend: S3'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Bucket: my-terraform-state'));
    });

    it('should analyze Terraform directory without state files', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['main.tf', 'variables.tf'] as any);

      await analyzeTerraformSetup('./terraform', 'aws', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('⚠️  No state files found'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('💡 Consider running: terraform plan -out=tfplan'));
    });

    it('should analyze single Terraform file', async () => {
      const mockTfContent = `
resource "aws_eks_cluster" "main" {
  name     = "my-cluster"
  version  = "1.29"
}

resource "aws_rds_instance" "postgres" {
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"
}
`;

      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      await analyzeTerraformSetup('./main.tf', 'aws', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📋 Terraform Setup Analysis'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📊 File Analysis: main.tf'));
    });

    it('should detect corrupted state files', async () => {
      const mockCorruptedState = JSON.stringify({
        version: 4,
        terraform_version: "1.5.0",
        // Missing serial and lineage
        outputs: {},
        resources: []
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['terraform.tfstate'] as any);
      mockFs.readFileSync.mockReturnValue(mockCorruptedState);

      await analyzeTerraformSetup('./terraform', 'aws', false);
      
      expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('⚠️  WARNING: State file appears to be corrupted'));
    });

    it('should detect sensitive data in state files', async () => {
      const mockSensitiveState = JSON.stringify({
        version: 4,
        terraform_version: "1.5.0",
        serial: 1,
        lineage: "test-lineage",
        outputs: {},
        resources: [
          {
            mode: "managed",
            type: "aws_db_instance",
            name: "postgres",
            instances: [
              {
                attributes: {
                  password: "secret123",
                  master_password: "admin123"
                }
              }
            ]
          }
        ]
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['terraform.tfstate'] as any);
      mockFs.readFileSync.mockReturnValue(mockSensitiveState);

      await analyzeTerraformSetup('./terraform', 'aws', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔒 SECURITY RISKS DETECTED'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Secrets in plain text: YES'));
    });

    it('should handle different providers', async () => {
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
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('☁️  Provider: GCP'));
    });
  });

  describe('analyzePulumiSetup', () => {
    it('should analyze Pulumi directory with YAML stack', async () => {
      const mockPulumiYaml = `
name: my-app
runtime: nodejs
description: Test application
config:
  aws:region:
    type: string
    default: us-west-2
`;

      const mockStackContent = JSON.stringify({
        version: "3.0.0",
        deployment: {
          manifest: {
            resources: [
              {
                type: "aws:eks/cluster:Cluster",
                properties: {
                  name: "my-cluster"
                }
              }
            ]
          }
        }
      });

      mockFs.readdirSync.mockReturnValue(['Pulumi.yaml', 'Pulumi.test.yaml', 'Pulumi.test.stack.json'] as any);
      mockFs.readFileSync.mockImplementation((filePath: any, options?: any) => {
        const filePathLocal = typeof filePath === 'string' ? filePath : String(filePath);
        if (filePathLocal.includes('Pulumi.yaml')) return mockPulumiYaml;
        if (filePathLocal.includes('.stack.json')) return mockStackContent;
        return '';
      });

      await analyzePulumiSetup('./pulumi', 'aws', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📋 Pulumi Setup Analysis'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📊 Stack Name: test'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔧 Runtime: nodejs'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📈 Resource Count: 1'));
    });

    it('should analyze Pulumi directory with TypeScript stack', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const mockPulumiYaml = `
name: my-app
runtime: nodejs
description: TypeScript application
`;

      const mockTsContent = `
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export const cluster = new aws.eks.Cluster("my-cluster", {
  version: "1.29"
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
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📋 Pulumi Setup Analysis'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🔧 Runtime: nodejs'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📄 Stack Type: TypeScript'));
      
      consoleSpy.mockRestore();
    });

    it('should handle missing Pulumi configuration', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['main.ts'] as any);

      await analyzePulumiSetup('./pulumi', 'aws', false);
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️  No Pulumi configuration found'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('💡 Consider running: pulumi new'));
      
      consoleSpy.mockRestore();
    });

    it('should analyze single Pulumi stack file', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const mockStackContent = JSON.stringify({
        version: "3.0.0",
        deployment: {
          manifest: {
            resources: [
              {
                type: "aws:s3/bucket:Bucket",
                properties: {
                  bucket: "my-bucket"
                }
              }
            ]
          }
        }
      });

      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockStackContent);

      await analyzePulumiSetup('./Pulumi.test.stack.json', 'aws', false);
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📋 Pulumi Setup Analysis'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📊 File Analysis: Pulumi.test.stack.json'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('compareApproaches', () => {
    it('should compare approaches for simple setup', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await compareApproaches(5, 2, 'simple');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📊 Detailed Comparison'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📋 Terraform'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🚀 Chiral'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('💰 Cost Comparison'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⏱️  Time to Value'));
      
      consoleSpy.mockRestore();
    });

    it('should compare approaches for medium setup', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await compareApproaches(20, 5, 'medium');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📊 Detailed Comparison'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Complexity: Medium'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Team Size: 5'));
      
      consoleSpy.mockRestore();
    });

    it('should compare approaches for complex setup', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await compareApproaches(50, 10, 'complex');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📊 Detailed Comparison'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Complexity: Complex'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Team Size: 10'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('getMigrationStrategyInfo', () => {
    it('should return greenfield strategy info', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const result = getMigrationStrategyInfo('greenfield');
      
      expect(result).toBeDefined();
      expect(result).toContain('Greenfield Migration');
      expect(result).toContain('Clean slate approach');
      expect(result).toContain('Best for: New projects');
    });

    it('should return progressive strategy info', () => {
      const result = getMigrationStrategyInfo('progressive');
      
      expect(result).toBeDefined();
      expect(result).toContain('Progressive Migration');
      expect(result).toContain('Gradual transition');
      expect(result).toContain('Best for: Existing infrastructure');
    });

    it('should return parallel strategy info', () => {
      const result = getMigrationStrategyInfo('parallel');
      
      expect(result).toBeDefined();
      expect(result).toContain('Parallel Migration');
      expect(result).toContain('Run both systems');
      expect(result).toContain('Best for: Mission-critical systems');
    });
  });

  describe('generateMigrationPlan', () => {
    it('should generate greenfield migration plan', async () => {
      const mockTfContent = `
resource "aws_eks_cluster" "main" {
  name = "my-cluster"
  version = "1.29"
}
`;

      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await generateMigrationPlan('./main.tf', 'aws', 'greenfield');
      
      expect(result).toBeDefined();
      expect(result.estimatedDuration).toBeDefined();
      expect(result.riskLevel).toBeDefined();
      expect(result.preRequisites).toBeDefined();
      expect(result.steps).toBeDefined();
      expect(result.rollbackSteps).toBeDefined();
      expect(result.postMigration).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.rollbackSteps.length).toBeGreaterThan(0);
    });

    it('should generate progressive migration plan', async () => {
      const mockTfContent = `
resource "aws_eks_cluster" "main" {
  name = "my-cluster"
  version = "1.29"
}
`;

      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await generateMigrationPlan('./main.tf', 'aws', 'progressive');
      
      expect(result).toBeDefined();
      expect(result.estimatedDuration).toBeDefined();
      expect(result.riskLevel).toBeDefined();
      expect(result.preRequisites).toBeDefined();
      expect(result.steps).toBeDefined();
      expect(result.rollbackSteps).toBeDefined();
      expect(result.postMigration).toBeDefined();
    });

    it('should generate parallel migration plan', async () => {
      const mockTfContent = `
resource "aws_eks_cluster" "main" {
  name = "my-cluster"
  version = "1.29"
}
`;

      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await generateMigrationPlan('./main.tf', 'aws', 'parallel');
      
      expect(result).toBeDefined();
      expect(result.estimatedDuration).toBeDefined();
      expect(result.riskLevel).toBeDefined();
      expect(result.preRequisites).toBeDefined();
      expect(result.steps).toBeDefined();
      expect(result.rollbackSteps).toBeDefined();
      expect(result.postMigration).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(5); // Parallel migration has more steps
    });

    it('should handle different providers', async () => {
      const mockTfContent = `
resource "google_container_cluster" "main" {
  name = "my-cluster"
  location = "us-central1"
}
`;

      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await generateMigrationPlan('./main.tf', 'gcp', 'greenfield');
      
      expect(result).toBeDefined();
      expect(result.steps).toBeDefined();
      expect(result.preRequisites).toContain('Google Cloud CLI installed and authenticated');
    });

    it('should handle Azure provider', async () => {
      const mockTfContent = `
resource "azurerm_kubernetes_cluster" "main" {
  name = "my-cluster"
  location = "East US"
}
`;

      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await generateMigrationPlan('./main.tf', 'azure', 'greenfield');
      
      expect(result).toBeDefined();
      expect(result.steps).toBeDefined();
      expect(result.preRequisites).toContain('Azure CLI installed and authenticated');
    });

    it('should handle complex infrastructure', async () => {
      const mockTfContent = `
resource "aws_eks_cluster" "main" {
  name = "my-cluster"
  version = "1.29"
}

resource "aws_rds_instance" "postgres" {
  engine = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"
}

resource "aws_instance" "web" {
  ami = "ami-12345678"
  instance_type = "t3.large"
}

resource "aws_lb" "main" {
  name = "main-lb"
}

resource "aws_s3_bucket" "storage" {
  bucket = "my-storage-bucket"
}
`;

      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await generateMigrationPlan('./main.tf', 'aws', 'progressive');
      
      expect(result).toBeDefined();
      expect(result.estimatedDuration).toBeDefined();
      expect(result.riskLevel).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(5); // Complex infrastructure has more steps
    });
  });
});
