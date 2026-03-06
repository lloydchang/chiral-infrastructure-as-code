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

// Mock console methods
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

describe('Main CLI Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleWarn.mockClear();
    mockConsoleLog.mockClear();
  });

  afterEach(() => {
    mockConsoleWarn.mockRestore();
    mockConsoleLog.mockRestore();
  });

  describe('Additional importIaC scenarios', () => {
    it('should handle empty Terraform directory', async () => {
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue([] as any);

      const result = await importIaC('./empty-terraform', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🔍 Parsing Terraform directory: empty-terraform'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('📊 Migration Analytics:'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Total Resources: 0'));
    });

    it('should handle nested directory paths', async () => {
      const mockTfContent = `
resource "aws_eks_cluster" "main" {
  name = "my-cluster"
  version = "1.29"
}
`;

      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['main.tf'] as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await importIaC('./nested/path/terraform', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should handle large Terraform files', async () => {
      const mockTfContent = `
resource "aws_eks_cluster" "main" {
  name = "my-cluster"
  version = "1.29"
}

resource "aws_rds_instance" "postgres" {
  identifier = "my-postgres"
  engine = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"
  allocated_storage = 100
}

resource "aws_instance" "adfs" {
  ami = "ami-12345678"
  instance_type = "t3.large"
}
`;

      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['main.tf', 'outputs.tf', 'variables.tf', 'data.tf'] as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await importIaC('./large-terraform', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
      expect(mockConsoleLog).toHaveBeenCalledWith('✅ Extracted 3 resources from HCL using legacy parser');
    });

    it('should handle YAML files', async () => {
      const mockYamlContent = `
k8s:
  version: "1.29"
postgres:
  engineVersion: "15"
adfs:
  size: "medium"
  windowsVersion: "2022"
`;

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockYamlContent);

      const result = await importIaC('./config.yaml', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
      expect(result.environment).toBe('prod');
    });

    it('should handle JSON with all fields', async () => {
      const mockJsonContent = JSON.stringify({
        projectName: 'full-config',
        environment: 'staging',
        networkCidr: '172.16.0.0/12',
        region: {
          aws: 'us-west-2',
          azure: 'westus2',
          gcp: 'us-west1'
        },
        k8s: {
          version: '1.28',
          minNodes: 5,
          maxNodes: 20,
          size: 'large'
        },
        postgres: {
          engineVersion: '14',
          storageGb: 500,
          size: 'medium'
        },
        adfs: {
          size: 'medium',
          windowsVersion: '2019'
        },
        compliance: {
          framework: 'hipaa',
          encryptionAtRest: true,
          encryptionInTransit: true,
          auditLogging: true
        },
        migration: {
          strategy: 'parallel',
          sourceState: 'terraform.tfstate',
          validateCompliance: true,
          rollbackPlan: [
            { description: 'Step 1', notes: 'Backup current state' },
            { description: 'Step 2', notes: 'Migrate resources' }
          ]
        }
      });

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockJsonContent);

      const result = await importIaC('./full-config.json', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
      expect(result.environment).toBe('prod'); // Import always defaults to prod for safety
    });

    it('should handle special characters in paths', async () => {
      const mockTfContent = `
resource "aws_eks_cluster" "main" {
  name = "my-cluster"
  version = "1.29"
}
`;

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await importIaC('./path with spaces/main.tf', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should handle relative paths', async () => {
      const mockTfContent = `
resource "aws_eks_cluster" "main" {
  name = "my-cluster"
  version = "1.29"
}
`;

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await importIaC('../relative/path/main.tf', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });
  });

  describe('Error handling scenarios', () => {
    it('should handle permission denied errors', async () => {
      mockFs.statSync.mockImplementation(() => {
        const error = new Error('EACCES: permission denied');
        (error as any).code = 'EACCES';
        throw error;
      });

      const result = await importIaC('./no-permission.tf', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should handle file not found errors', async () => {
      mockFs.statSync.mockImplementation(() => {
        const error = new Error('ENOENT: no such file');
        (error as any).code = 'ENOENT';
        throw error;
      });

      const result = await importIaC('./missing.tf', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should handle JSON parse errors', async () => {
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue('invalid json content {');

      const result = await importIaC('./invalid.json', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should handle YAML parse errors', async () => {
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue('invalid: yaml: content: -');

      const result = await importIaC('./invalid.yaml', 'aws', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });
  });

  describe('Provider-specific behavior', () => {
    it('should handle GCP-specific resources', async () => {
      const mockTfContent = `
resource "google_container_cluster" "main" {
  name = "my-gke-cluster"
  location = "us-central1"
  min_master_version = "1.29"
  node_config {
    machine_type = "e2-medium"
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }
}

resource "google_sql_database_instance" "postgres" {
  name = "my-postgres"
  database_version = "POSTGRES_15"
  region = "us-central1"
  settings {
    tier = "db-custom-2-4096"
  }
}
`;

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await importIaC('./gcp-resources.tf', 'gcp', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
      expect(result.k8s.version).toBe('1.29');
    });

    it('should handle Azure-specific resources', async () => {
      const mockTfContent = `
resource "azurerm_kubernetes_cluster" "main" {
  name = "my-aks-cluster"
  location = "East US"
  kubernetes_version = "1.29"
  dns_prefix = "myaks"
  
  network_profile {
    network_plugin = "azure"
  }
}

resource "azurerm_postgresql_flexible_server" "postgres" {
  name = "my-postgres"
  location = "East US"
  version = "15"
  administrator_login = "postgresadmin"
  sku_name = "B_Standard_B2s"
  storage_mb = 102400
}
`;

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(mockTfContent);

      const result = await importIaC('./azure-resources.tf', 'azure', 'test-stack');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
      expect(result.k8s.version).toBe('1.29');
    });
  });
});
