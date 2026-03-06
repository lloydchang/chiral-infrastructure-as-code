import * as fs from 'fs';
import * as path from 'path';
import { TerraformImportAdapter, TerraformImportConfig, ParsedTerraformResource } from '../adapters/declarative/terraform-adapter';
import { ChiralSystem } from '../intent';

describe('TerraformImportAdapter', () => {
  const testConfig: TerraformImportConfig = {
    provider: 'aws',
    sourcePath: '/path/to/terraform/files',
    analyzeOnly: false
  };

  describe('parseTerraformFiles', () => {
    it('should be defined as a static method', () => {
      expect(typeof TerraformImportAdapter.parseTerraformFiles).toBe('function');
    });

    it('should return an array of ParsedTerraformResource', async () => {
      // Create a test Terraform file
      const testContent = `
resource "aws_eks_cluster" "test" {
  name = "test-cluster"
  version = "1.28"
}

resource "aws_db_instance" "test" {
  engine = "postgres"
  engine_version = "15"
  instance_class = "db.t3.medium"
}
`;
      
      // Write to a temporary file for testing
      const tempDir = '/tmp/test-terraform';
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      fs.writeFileSync(path.join(tempDir, 'test.tf'), testContent);
      
      const resources = await TerraformImportAdapter.parseTerraformFiles(tempDir, 'aws');
      
      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBeGreaterThan(0);
      
      // Clean up
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should handle different providers', async () => {
      const awsResources = await TerraformImportAdapter.parseTerraformFiles('/aws/path', 'aws');
      const azureResources = await TerraformImportAdapter.parseTerraformFiles('/azure/path', 'azure');
      const gcpResources = await TerraformImportAdapter.parseTerraformFiles('/gcp/path', 'gcp');

      expect(Array.isArray(awsResources)).toBe(true);
      expect(Array.isArray(azureResources)).toBe(true);
      expect(Array.isArray(gcpResources)).toBe(true);
    });
  });

  describe('convertToChiralIntent', () => {
    it('should be defined as a static method', () => {
      expect(typeof TerraformImportAdapter.convertToChiralIntent).toBe('function');
    });

    it('should return a Partial<ChiralSystem>', async () => {
      const mockResources: ParsedTerraformResource[] = [];
      const intent = await TerraformImportAdapter.convertToChiralIntent(mockResources, 'aws');

      expect(intent).toBeDefined();
      expect(intent.projectName).toBe('imported-infrastructure');
      expect(intent.environment).toBe('prod');
      expect(intent.networkCidr).toBe('10.0.0.0/16');
      expect(intent.k8s).toBeDefined();
      expect(intent.postgres).toBeDefined();
      expect(intent.adfs).toBeDefined();
    });

    it('should handle empty resource array', async () => {
      const intent = await TerraformImportAdapter.convertToChiralIntent([], 'aws');

      expect(intent.k8s?.version).toBe('1.35');
      expect(intent.k8s?.minNodes).toBe(2);
      expect(intent.k8s?.maxNodes).toBe(5);
      expect(intent.k8s?.size).toBe('medium');

      expect(intent.postgres?.engineVersion).toBe('15');
      expect(intent.postgres?.size).toBe('medium');
      expect(intent.postgres?.storageGb).toBe(100);

      expect(intent.adfs?.size).toBe('medium');
      expect(intent.adfs?.windowsVersion).toBe('2022');
    });

    it('should support different providers', async () => {
      const intentAWS = await TerraformImportAdapter.convertToChiralIntent([], 'aws');
      const intentAzure = await TerraformImportAdapter.convertToChiralIntent([], 'azure');
      const intentGCP = await TerraformImportAdapter.convertToChiralIntent([], 'gcp');

      expect(intentAWS).toBeDefined();
      expect(intentAzure).toBeDefined();
      expect(intentGCP).toBeDefined();
    });
  });

  describe('importFromTerraform', () => {
    it('should be defined as a static method', () => {
      expect(typeof TerraformImportAdapter.importFromTerraform).toBe('function');
    });

    it('should return a complete ChiralSystem', async () => {
      // Mock console methods - suppress all warnings/errors in tests
      const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
      const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      const chiralSystem = await TerraformImportAdapter.importFromTerraform(testConfig);

      expect(chiralSystem).toBeDefined();
      expect(typeof chiralSystem.projectName).toBe('string');
      expect(['dev', 'prod']).toContain(chiralSystem.environment);
      expect(typeof chiralSystem.networkCidr).toBe('string');
      expect(chiralSystem.k8s).toBeDefined();
      expect(chiralSystem.postgres).toBeDefined();
      expect(chiralSystem.adfs).toBeDefined();
      expect(chiralSystem.migration).toBeDefined();
    });

    it('should set migration metadata', async () => {
      const chiralSystem = await TerraformImportAdapter.importFromTerraform(testConfig);

      expect(chiralSystem.migration?.strategy).toBe('progressive');
      expect(chiralSystem.migration?.sourceState).toBe(testConfig.sourcePath);
      expect(chiralSystem.migration?.validateCompliance).toBe(true);
    });

    it('should provide default values for required fields', async () => {
      const chiralSystem = await TerraformImportAdapter.importFromTerraform(testConfig);

      expect(chiralSystem.projectName).toBe('imported-infrastructure');
      expect(chiralSystem.environment).toBe('prod');
      expect(chiralSystem.networkCidr).toBe('10.0.0.0/16');
    });

    it('should handle analyzeOnly flag', async () => {
      const analyzeConfig: TerraformImportConfig = {
        ...testConfig,
        analyzeOnly: true
      };

      const chiralSystem = await TerraformImportAdapter.importFromTerraform(analyzeConfig);

      // analyzeOnly doesn't affect the return structure, just the intended usage
      expect(chiralSystem).toBeDefined();
      expect(chiralSystem.migration?.strategy).toBe('progressive');
    });
  });

  describe('integration workflow', () => {
    it('should complete full import workflow', async () => {
      // Parse Terraform files
      const resources = await TerraformImportAdapter.parseTerraformFiles(testConfig.sourcePath, testConfig.provider);

      // Convert to Chiral intent
      const intent = await TerraformImportAdapter.convertToChiralIntent(resources, testConfig.provider);

      // Import complete system
      const chiralSystem = await TerraformImportAdapter.importFromTerraform(testConfig);

      // Verify the workflow produces valid ChiralSystem
      expect(chiralSystem.projectName).toBeDefined();
      expect(chiralSystem.environment).toBeDefined();
      expect(chiralSystem.networkCidr).toBeDefined();
      expect(chiralSystem.k8s).toBeDefined();
      expect(chiralSystem.postgres).toBeDefined();
      expect(chiralSystem.adfs).toBeDefined();
    });

    it('should map AWS resources to Chiral intent correctly', async () => {
      const mockResources: ParsedTerraformResource[] = [
        {
          resourceType: 'aws_eks_cluster',
          resourceName: 'my-cluster',
          config: {
            version: '1.28',
            vpc_config: {
              subnet_ids: ['subnet-123', 'subnet-456']
            }
          }
        },
        {
          resourceType: 'aws_db_instance',
          resourceName: 'my-db',
          config: {
            engine: 'postgres',
            engine_version: '15',
            instance_class: 'db.t3.medium',
            allocated_storage: 100
          }
        },
        {
          resourceType: 'aws_instance',
          resourceName: 'my-vm',
          config: {
            instance_type: 't3.medium'
          }
        }
      ];

      const intent = await TerraformImportAdapter.convertToChiralIntent(mockResources, 'aws');

      expect(intent.k8s?.version).toBe('1.28');
      expect(intent.postgres?.engineVersion).toBe('15');
      expect(intent.postgres?.storageGb).toBe(100);
    });
  });
});
