import { analyzeTerraformSetup, analyzePulumiSetup, compareApproaches, getMigrationStrategyInfo, generateMigrationPlan } from '../main';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();

describe('Main CLI Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleWarn.mockClear();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
  });

  describe('analyzeTerraformSetup - Additional Coverage', () => {
    it('should handle detailed cost analysis', async () => {
      const mockStateContent = JSON.stringify({
        version: 4,
        terraform_version: "1.5.0",
        serial: 1,
        lineage: "test-lineage",
        outputs: {},
        resources: [
          {
            mode: "managed",
            type: "aws_eks_cluster",
            name: "main",
            instances: [
              {
                attributes: {
                  name: "my-cluster",
                  version: "1.29"
                }
              }
            ]
          }
        ]
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['terraform.tfstate'] as any);
      mockFs.readFileSync.mockReturnValue(mockStateContent);

      await analyzeTerraformSetup('./terraform', 'aws', true);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('💰 Detailed Cost Analysis'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('💡 Cost Optimization'));
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
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📦 Terraform Version: 1.4.6'));
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
            mode: "managed",
            type: "azurerm_kubernetes_cluster",
            name: "main",
            instances: []
          }
        ]
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['terraform.tfstate'] as any);
      mockFs.readFileSync.mockReturnValue(mockStateContent);

      await analyzeTerraformSetup('./terraform', 'azure', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('☁️  Provider: Azure'));
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
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('☁️  Provider: GCP'));
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
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔍 Backend: None'));
    });

    it('should handle workspace information', async () => {
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
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🏢 Workspace: production'));
    });
  });

  describe('analyzePulumiSetup - Additional Coverage', () => {
    it('should handle Python runtime', async () => {
      const mockPulumiYaml = `
name: my-app
runtime: python
description: Python application
`;

      const mockStackContent = JSON.stringify({
        version: "3.0.0",
        deployment: {
          manifest: {
            resources: []
          }
        }
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['Pulumi.yaml', 'Pulumi.test.stack.json'] as any);
      mockFs.readFileSync.mockImplementation((path: any, options?: any) => {
        const filePath = typeof path === 'string' ? path : String(path);
        if (filePath.includes('Pulumi.yaml')) return mockPulumiYaml;
        if (filePath.includes('.stack.json')) return mockStackContent;
        return '';
      });

      await analyzePulumiSetup('./pulumi', 'aws', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔧 Runtime: python'));
    });

    it('should handle Go runtime', async () => {
      const mockPulumiYaml = `
name: my-app
runtime: go
description: Go application
`;

      const mockStackContent = JSON.stringify({
        version: "3.0.0",
        deployment: {
          manifest: {
            resources: []
          }
        }
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['Pulumi.yaml', 'Pulumi.test.stack.json'] as any);
      mockFs.readFileSync.mockImplementation((path: any, options?: any) => {
        const filePath = typeof path === 'string' ? path : String(path);
        if (filePath.includes('Pulumi.yaml')) return mockPulumiYaml;
        if (filePath.includes('.stack.json')) return mockStackContent;
        return '';
      });

      await analyzePulumiSetup('./pulumi', 'aws', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔧 Runtime: go'));
    });

    it('should handle configuration values', async () => {
      const mockPulumiYaml = `
name: my-app
runtime: nodejs
description: Node.js application
config:
  aws:region:
    type: string
    default: us-west-2
  databasePassword:
    type: string
    secret: true
  instanceCount:
    type: number
    default: 3
`;

      const mockStackContent = JSON.stringify({
        version: "3.0.0",
        deployment: {
          manifest: {
            resources: []
          }
        }
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['Pulumi.yaml', 'Pulumi.test.stack.json'] as any);
      mockFs.readFileSync.mockImplementation((path: any, options?: any) => {
        const filePath = typeof path === 'string' ? path : String(path);
        if (filePath.includes('Pulumi.yaml')) return mockPulumiYaml;
        if (filePath.includes('.stack.json')) return mockStackContent;
        return '';
      });

      await analyzePulumiSetup('./pulumi', 'aws', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('⚙️  Configuration'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Secrets detected'));
    });

    it('should handle dependencies', async () => {
      const mockPulumiYaml = `
name: my-app
runtime: nodejs
description: Node.js application
dependencies:
  "@pulumi/aws": "^5.0.0"
  "@pulumi/pulumi": "^3.0.0"
`;

      const mockStackContent = JSON.stringify({
        version: "3.0.0",
        deployment: {
          manifest: {
            resources: []
          }
        }
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['Pulumi.yaml', 'Pulumi.test.stack.json'] as any);
      mockFs.readFileSync.mockImplementation((path: any, options?: any) => {
        const filePath = typeof path === 'string' ? path : String(path);
        if (filePath.includes('Pulumi.yaml')) return mockPulumiYaml;
        if (filePath.includes('.stack.json')) return mockStackContent;
        return '';
      });

      await analyzePulumiSetup('./pulumi', 'aws', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📦 Dependencies'));
    });

    it('should handle stack outputs', async () => {
      const mockStackContent = JSON.stringify({
        version: "3.0.0",
        deployment: {
          manifest: {
            resources: [],
            outputs: {
              clusterEndpoint: {
                value: "eks.example.com"
              },
              databaseUrl: {
                secret: true,
                value: "postgresql://user:pass@db:5432/db"
              }
            }
          }
        }
      });

      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockStackContent);

      await analyzePulumiSetup('./Pulumi.test.stack.json', 'aws', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📤 Stack Outputs'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Secrets detected'));
    });
  });

  describe('compareApproaches - Additional Coverage', () => {
    it('should handle different team sizes', async () => {
      await compareApproaches(10, 1, 'simple');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Team Size: 1'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Learning Curve: Low'));
    });

    it('should handle large teams', async () => {
      await compareApproaches(50, 20, 'complex');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Team Size: 20'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Learning Curve: High'));
    });

    it('should show security considerations', async () => {
      await compareApproaches(10, 5, 'medium');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔒 Security'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Secret Management'));
    });

    it('should show compliance features', async () => {
      await compareApproaches(15, 8, 'complex');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📋 Compliance'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Audit Trail'));
    });
  });

  describe('generateMigrationPlan - Additional Coverage', () => {
    it('should handle Azure provider prerequisites', async () => {
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
      expect(result.preRequisites).toContain('Azure CLI installed and authenticated');
      expect(result.preRequisites).toContain('Review Azure-specific configurations');
    });

    it('should handle GCP provider prerequisites', async () => {
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
      expect(result.preRequisites).toContain('Google Cloud CLI installed and authenticated');
      expect(result.preRequisites).toContain('Review GCP-specific configurations');
    });

    it('should handle complex infrastructure with multiple providers', async () => {
      const mockTfContent = `
resource "aws_eks_cluster" "main" {
  name = "my-cluster"
  version = "1.29"
}

resource "azurerm_kubernetes_cluster" "main" {
  name = "my-cluster"
  location = "East US"
}

resource "google_container_cluster" "main" {
  name = "my-cluster"
  location = "us-central1"
}
`;

      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await generateMigrationPlan('./main.tf', 'aws', 'progressive');
      
      expect(result).toBeDefined();
      expect(result.riskLevel).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(10); // Multi-provider has more steps
    });

    it('should handle progressive migration with rollback', async () => {
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
      expect(result.rollbackSteps).toBeDefined();
      expect(result.rollbackSteps.length).toBeGreaterThan(3);
      expect(result.rollbackSteps[0].description).toContain('Stop new deployments');
    });

    it('should handle parallel migration with validation', async () => {
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
      expect(result.steps).toBeDefined();
      expect(result.steps.some(step => step.description.includes('Validate parallel operation'))).toBe(true);
      expect(result.postMigration).toContain('Monitor both systems during transition');
    });
  });
});
