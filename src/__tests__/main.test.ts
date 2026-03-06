import { importIaC } from '../main';
import { ChiralSystem } from '../intent';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Main Module Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('importIaC', () => {
    it('should handle Terraform directory import', async () => {
      const mockConfig: ChiralSystem = {
        projectName: 'imported-infrastructure',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'medium' },
        postgres: { engineVersion: '15', storageGb: 100, size: 'medium' },
        adfs: { size: 'medium', windowsVersion: '2022' }
      };

      // Mock directory reading
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['main.tf', 'variables.tf'] as any);
      mockFs.readFileSync.mockReturnValue(`
resource "aws_eks_cluster" "main" {
  name = "my-cluster"
  version = "1.29"
}

resource "aws_rds_instance" "main" {
  engine = "postgres"
  engine_version = "15"
}
      `);

      const result = await importIaC('./terraform', 'aws');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('imported-infrastructure');
      expect(result.environment).toBe('prod');
    });

    it('should handle single Terraform file import', async () => {
      const mockConfig: ChiralSystem = {
        projectName: 'imported-infrastructure',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'medium' },
        postgres: { engineVersion: '15', storageGb: 100, size: 'medium' },
        adfs: { size: 'medium', windowsVersion: '2022' }
      };

      // Mock file reading
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(`
resource "aws_eks_cluster" "main" {
  name = "my-cluster"
  version = "1.29"
}
      `);

      const result = await importIaC('./main.tf', 'aws');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('imported-infrastructure');
    });

    it('should handle agentic import when enabled', async () => {
      const mockConfig: ChiralSystem = {
        projectName: 'imported-infrastructure',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'medium' },
        postgres: { engineVersion: '15', storageGb: 100, size: 'medium' },
        adfs: { size: 'medium', windowsVersion: '2022' }
      };

      // Mock directory reading
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['unknown.tf'] as any);
      mockFs.readFileSync.mockReturnValue(`
resource "unknown_resource" "test" {
  name = "test"
}
      `);

      const result = await importIaC('./terraform', 'aws', 'test-stack', true);
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('test-stack');
    });

    it('should handle import errors gracefully', async () => {
      // Mock file system error
      mockFs.statSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const result = await importIaC('./nonexistent', 'aws');
      
      expect(result).toBeDefined();
      expect(result.projectName).toBe('imported-infrastructure');
    });
  });
});
