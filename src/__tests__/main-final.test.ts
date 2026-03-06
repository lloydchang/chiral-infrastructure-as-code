import { importIaC, analyzeTerraformSetup, analyzePulumiSetup, compareApproaches, getMigrationStrategyInfo, generateMigrationPlan } from '../main';
import { ChiralSystem } from '../intent';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock path module
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  basename: jest.fn((filePath: string) => filePath.split('/').pop() || ''),
  extname: jest.fn((filePath: string) => {
    const parts = filePath.split('.');
    return parts.length > 1 ? '.' + parts.pop() : '';
  })
}));

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('Main CLI Final Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleWarn.mockClear();
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('importIaC - Edge Cases', () => {
    it('should handle CloudFormation templates', async () => {
      const mockCFContent = JSON.stringify({
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          MyEksCluster: {
            Type: 'AWS::EKS::Cluster',
            Properties: {
              Name: 'my-cluster',
              Version: '1.29'
            }
          }
        }
      });

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockCFContent);

      const result = await importIaC('./template.json', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should handle ARM templates', async () => {
      const mockARMContent = JSON.stringify({
        $schema: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
        resources: [
          {
            type: 'Microsoft.ContainerService/managedClusters',
            apiVersion: '2023-05-01',
            name: 'my-cluster',
            properties: {
              kubernetesVersion: '1.29'
            }
          }
        ]
      });

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockARMContent);

      const result = await importIaC('./template.json', 'azure', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should handle empty JSON files', async () => {
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue('{}');

      const result = await importIaC('./empty.json', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should handle YAML with syntax errors', async () => {
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue('invalid: yaml: content: [unclosed');

      const result = await importIaC('./invalid.yaml', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
      expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('Failed to parse')));
    });

    it('should handle JSON with syntax errors', async () => {
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue('{"invalid": json}');

      const result = await importIaC('./invalid.json', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
      expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('Failed to parse')));
    });

    it('should handle Pulumi YAML format', async () => {
      const mockPulumiYaml = `
name: my-app
runtime: nodejs
resources:
  type: aws:eks/cluster:Cluster
  properties:
    name: my-cluster
`;

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockPulumiYaml);

      const result = await importIaC('./Pulumi.yaml', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should handle file read errors', async () => {
      mockFs.statSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await importIaC('./protected.tf', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });
  });

  describe('analyzeTerraformSetup - Complex Scenarios', () => {
    it('should handle Terraform workspaces', async () => {
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
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🏢 Workspace: production')));
    });

    it('should handle backend configuration with encryption', async () => {
      const mockBackendConfig = `
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-west-2"
    encrypt = true
    dynamodb_table = "terraform-locks"
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
      mockFs.readdirSync.mockReturnValue(['backend.tf', 'terraform.tfstate'] as any);
      mockFs.readFileSync.mockImplementation((path: any, options?: any) => {
        const filePath = typeof path === 'string' ? path : String(path);
        if (filePath.includes('backend.tf')) return mockBackendConfig;
        if (filePath.includes('terraform.tfstate')) return mockStateContent;
        return '';
      });

      await analyzeTerraformSetup('./terraform', 'aws', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔍 Backend: S3')));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Encryption: Enabled')));
    });

    it('should handle provider configuration analysis', async () => {
      const mockProviderConfig = `
provider "aws" {
  region = "us-west-2"
  version = "~> 5.0"
}

provider "aws" {
  alias = "east"
  region = "us-east-1"
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

      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockProviderConfig);

      await analyzeTerraformSetup('./providers.tf', 'aws', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📊 File Analysis: providers.tf')));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📦 Terraform Version: 1.5.0')));
    });

    it('should handle module analysis', async () => {
      const mockModuleConfig = `
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "19.0.0"
  
  cluster_name    = "my-cluster"
  cluster_version = "1.29"
  
  subnets = ["subnet-123", "subnet-456"]
}

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "3.0.0"
  
  name = "my-vpc"
  cidr = "10.0.0.0/16"
}
`;

      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockModuleConfig);

      await analyzeTerraformSetup('./main.tf', 'aws', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📊 File Analysis: main.tf')));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📦 Terraform Version: 1.5.0')));
    });
  });

  describe('analyzePulumiSetup - Advanced Features', () => {
    it('should handle stack configuration with secrets', async () => {
      const mockPulumiYaml = `
name: my-app
runtime: nodejs
description: Application with secrets
config:
  aws:region:
    type: string
    default: us-west-2
  databasePassword:
    type: string
    secret: true
  apiKey:
    type: string
    secret: true
`;

      const mockStackContent = JSON.stringify({
        version: "3.0.0",
        deployment: {
          manifest: {
            resources: [],
            outputs: {
              dbPassword: {
                secret: true,
                value: "sensitive-data"
              }
            }
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
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('⚙️  Configuration')));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Secrets detected')));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📤 Stack Outputs')));
    });

    it('should handle project dependencies', async () => {
      const mockPulumiYaml = `
name: my-app
runtime: nodejs
description: Node.js application
dependencies:
  "@pulumi/aws": "^5.0.0"
  "@pulumi/pulumi": "^3.0.0"
  "@pulumi/random": "^4.0.0"
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
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📦 Dependencies')));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('@pulumi/aws')));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('@pulumi/random')));
    });

    it('should handle Python stack analysis', async () => {
      const mockPulumiYaml = `
name: my-app
runtime: python
description: Python application
`;

      const mockPyContent = `
import pulumi
import pulumi_aws as aws

cluster = aws.eks.Cluster("my-cluster",
    version="1.29"
)
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
      mockFs.readdirSync.mockReturnValue(['Pulumi.yaml', '__main__.py', 'Pulumi.test.stack.json'] as any);
      mockFs.readFileSync.mockImplementation((path: any, options?: any) => {
        const filePath = typeof path === 'string' ? path : String(path);
        if (filePath.includes('Pulumi.yaml')) return mockPulumiYaml;
        if (filePath.includes('__main__.py')) return mockPyContent;
        if (filePath.includes('.stack.json')) return mockStackContent;
        return '';
      });

      await analyzePulumiSetup('./pulumi', 'aws', false);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔧 Runtime: python')));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📄 Stack Type: Python')));
    });
  });

  describe('compareApproaches - Detailed Analysis', () => {
    it('should provide comprehensive comparison for enterprise teams', async () => {
      await compareApproaches(100, 50, 'complex');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📊 Detailed Comparison')));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Team Size: 50')));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Complexity: Complex')));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔒 Security')));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📋 Compliance')));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('⏱️  Time to Value')));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('💰 Cost Comparison')));
    });

    it('should show learning curve analysis', async () => {
      await compareApproaches(5, 2, 'simple');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Learning Curve: Low')));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Documentation Quality')));
    });

    it('should show operational overhead comparison', async () => {
      await compareApproaches(25, 10, 'medium');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔧 Operational Overhead')));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Maintenance Required')));
    });
  });

  describe('generateMigrationPlan - Enterprise Features', () => {
    it('should handle enterprise-scale migration', async () => {
      const mockTfContent = `
resource "aws_eks_cluster" "main" {
  name = "my-cluster"
  version = "1.29"
  
  node_groups {
    name = "general"
    instance_type = "m5.large"
    min_size = 3
    max_size = 10
  }
  
  node_groups {
    name = "compute"
    instance_type = "c5.xlarge"
    min_size = 2
    max_size = 5
  }
}

resource "aws_rds_instance" "postgres" {
  identifier = "my-postgres"
  engine = "postgres"
  engine_version = "15.4"
  instance_class = "db.r5.large"
  allocated_storage = 500
  
  backup_retention_period = 30
  backup_window = "03:00-04:00"
  maintenance_window = "sun:04:00-sun:05:00"
}

resource "aws_lb" "main" {
  name = "main-lb"
  internal = false
  load_balancer_type = "application"
  
  security_groups = [aws_security_group.lb.id]
}

resource "aws_security_group" "lb" {
  name = "lb-sg"
  description = "Load balancer security group"
  
  ingress {
    from_port = 80
    to_port = 80
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
`;

      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await generateMigrationPlan('./main.tf', 'aws', 'progressive');
      
      expect(result).toBeDefined();
      expect(result.estimatedDuration).toBeDefined();
      expect(result.riskLevel).toBeDefined();
      expect(result.preRequisites.length).toBeGreaterThan(5);
      expect(result.steps.length).toBeGreaterThan(10);
      expect(result.rollbackSteps.length).toBeGreaterThan(5);
      expect(result.postMigration.length).toBeGreaterThan(3);
    });

    it('should handle multi-environment setup', async () => {
      const mockTfContent = `
resource "aws_eks_cluster" "dev" {
  name = "dev-cluster"
  version = "1.29"
}

resource "aws_eks_cluster" "staging" {
  name = "staging-cluster"
  version = "1.29"
}

resource "aws_eks_cluster" "prod" {
  name = "prod-cluster"
  version = "1.29"
}
`;

      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await generateMigrationPlan('./main.tf', 'aws', 'parallel');
      
      expect(result).toBeDefined();
      expect(result.steps.some(step => step.description.includes('environment'))).toBe(true);
      expect(result.postMigration.some(post => post.includes('environment'))).toBe(true);
    });

    it('should handle compliance requirements', async () => {
      const mockTfContent = `
resource "aws_eks_cluster" "main" {
  name = "my-cluster"
  version = "1.29"
  
  logging {
    cluster_logging = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
  }
}

resource "aws_cloudtrail" "main" {
  name = "my-cloudtrail"
  s3_bucket_name = "my-cloudtrail-bucket"
  
  include_global_service_events = true
  is_multi_region_trail = true
}
`;

      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await generateMigrationPlan('./main.tf', 'aws', 'greenfield');
      
      expect(result).toBeDefined();
      expect(result.preRequisites.some(prereq => prereq.includes('compliance'))).toBe(true);
      expect(result.steps.some(step => step.description.includes('compliance'))).toBe(true);
    });
  });
});
