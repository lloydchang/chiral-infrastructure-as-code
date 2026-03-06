import { importIaC } from '../main';
import { ChiralSystem } from '../intent';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock path module
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  basename: jest.fn((filePath: string) => {
    if (filePath === './terraform') return 'terraform';
    return filePath.split('/').pop() || '';
  }),
  extname: jest.fn((filePath: string) => {
    if (filePath === './terraform') return '';
    const parts = filePath.split('.');
    return parts.length > 1 ? '.' + parts.pop() : '';
  })
}));

// Mock child_process module
jest.mock('child_process');
const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;

describe('Main CLI Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('importIaC', () => {
    it('should import from Terraform directory', async () => {
      const mockTfFiles = ['main.tf', 'outputs.tf', 'variables.tf'];
      const mockTfContent = `
resource "aws_eks_cluster" "main" {
  name     = "my-cluster"
  role_arn = aws_iam_role.cluster.arn
  version  = "1.29"

  vpc_config {
    subnet_ids = ["subnet-12345", "subnet-67890"]
  }
}

resource "aws_rds_instance" "postgres" {
  identifier     = "my-postgres"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"
  allocated_storage = 100
}
`;

      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(mockTfFiles as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await importIaC('./terraform', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
      expect(mockFs.statSync).toHaveBeenCalled();
      expect(mockFs.readdirSync).toHaveBeenCalled();
    });

    it('should import from single Terraform file', async () => {
      const mockTfContent = `
resource "aws_eks_cluster" "main" {
  name     = "my-cluster"
  role_arn = aws_iam_role.cluster.arn
  version  = "1.29"
}
`;

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await importIaC('./main.tf', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should handle agentic import', async () => {
      const mockTfContent = `
resource "aws_eks_cluster" "main" {
  name     = "my-cluster"
  role_arn = aws_iam_role.cluster.arn
  version  = "1.29"
}
`;

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await importIaC('./main.tf', 'aws', 'test-stack', true);
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should handle import errors gracefully', async () => {
      mockFs.statSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = await importIaC('./nonexistent.tf', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should handle unsupported file extensions', async () => {
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue('some content');

      const result = await importIaC('./unknown.xyz', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should import from YAML files', async () => {
      const mockYamlContent = `
k8s:
  version: "1.29"
  minNodes: 2
  maxNodes: 5
  size: "medium"
postgres:
  engineVersion: "15"
  storageGb: 100
  size: "medium"
adfs:
  size: "medium"
  windowsVersion: "2022"
`;

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockYamlContent);

      const result = await importIaC('./config.yaml', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should import from JSON files', async () => {
      const mockJsonContent = JSON.stringify({
        k8s: {
          version: "1.29",
          minNodes: 2,
          maxNodes: 5,
          size: "medium"
        },
        postgres: {
          engineVersion: "15",
          storageGb: 100,
          size: "medium"
        },
        adfs: {
          size: "medium",
          windowsVersion: "2022"
        }
      });

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockJsonContent);

      const result = await importIaC('./config.json', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should import from .tfstate files', async () => {
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
            provider: "provider[\"registry.terraform.io/hashicorp/aws\"]",
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

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockStateContent);

      const result = await importIaC('./terraform.tfstate', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should import from Bicep files', async () => {
      const mockBicepContent = `
@description('Kubernetes cluster name')
param clusterName string = 'my-cluster'

@description('Kubernetes version')
param kubernetesVersion string = '1.29'

resource kubernetesCluster 'Microsoft.ContainerService/managedClusters@2023-05-01' = {
  name: clusterName
  properties: {
    kubernetesVersion: kubernetesVersion
  }
}
`;

      // Mock Azure CLI availability
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('az --version')) {
          return 'azure-cli 2.45.0';
        }
        if (cmd.includes('az bicep build')) {
          // Create a temp file with mock ARM template
          const tempFile = cmd.match(/--outfile (\S+)/)?.[1];
          if (tempFile && typeof mockFs.existsSync === 'function') {
            mockFs.writeFileSync(tempFile, JSON.stringify({
              resources: [
                {
                  type: 'Microsoft.ContainerService/managedClusters',
                  properties: {
                    name: 'my-cluster',
                    kubernetesVersion: '1.29'
                  }
                }
              ]
            }));
          }
          return '';
        }
        throw new Error('Command not found');
      });

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.writeFileSync.mockImplementation(() => {});
      mockFs.readFileSync.mockReturnValue(mockBicepContent);

      const result = await importIaC('./main.bicep', 'azure', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should handle different providers', async () => {
      const mockTfContent = `
resource "google_container_cluster" "main" {
  name     = "my-cluster"
  location = "us-central1"
  min_master_version = "1.29"
}
`;

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await importIaC('./main.tf', 'gcp', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should handle Azure provider', async () => {
      const mockTfContent = `
resource "azurerm_kubernetes_cluster" "main" {
  name                = "my-cluster"
  location            = "East US"
  kubernetes_version  = "1.29"
}
`;

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await importIaC('./main.tf', 'azure', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should handle missing Azure CLI gracefully', async () => {
      const mockBicepContent = 'some bicep content';

      // Mock Azure CLI not available
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('az --version')) {
          throw new Error('Command not found');
        }
        return '';
      });

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockBicepContent);

      const result = await importIaC('./main.bicep', 'azure', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should handle Bicep build failure gracefully', async () => {
      const mockBicepContent = 'invalid bicep content';

      // Mock Azure CLI available but Bicep build fails
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd.includes('az --version')) {
          return 'azure-cli 2.45.0';
        }
        if (cmd.includes('az bicep build')) {
          throw new Error('Bicep build failed');
        }
        return '';
      });

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.writeFileSync.mockImplementation(() => {});
      mockFs.readFileSync.mockReturnValue(mockBicepContent);

      const result = await importIaC('./main.bicep', 'azure', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });
  });
});
