import { TerraformImportAdapter } from '../adapters/declarative/terraform-adapter';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('TerraformImportAdapter Integration Tests', () => {
  let tempDir: string;

  beforeEach(() => {
    // Create a temporary directory for test Terraform files
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'terraform-test-'));
  });

  afterEach(() => {
    // Clean up temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Real Terraform File Parsing', () => {
    it('should parse AWS EKS cluster configuration', async () => {
      const terraformContent = `
resource "aws_eks_cluster" "main" {
  name     = "my-cluster"
  role_arn = "arn:aws:iam::123456789012:role/eks-service-role"
  version  = "1.28"

  vpc_config {
    subnet_ids = ["subnet-123", "subnet-456"]
  }
}

resource "aws_db_instance" "postgres" {
  identifier     = "my-database"
  engine         = "postgres"
  engine_version = "15.3"
  instance_class = "db.t3.medium"
  allocated_storage = 100
}

resource "aws_vpc" "main" {
  cidr_block = "10.1.0.0/16"
}
`;

      const tfFile = path.join(tempDir, 'main.tf');
      fs.writeFileSync(tfFile, terraformContent);

      const resources = await TerraformImportAdapter.parseTerraformFiles(tempDir, 'aws');
      
      expect(resources).toHaveLength(3);
      
      const eksCluster = resources.find(r => r.resourceType === 'aws_eks_cluster');
      expect(eksCluster).toBeDefined();
      expect(eksCluster!.resourceName).toBe('main');
      expect(eksCluster!.config.version).toBe('1.28');

      const dbInstance = resources.find(r => r.resourceType === 'aws_db_instance');
      expect(dbInstance).toBeDefined();
      expect(dbInstance!.resourceName).toBe('postgres');
      expect(dbInstance!.config.engine_version).toBe('15.3');
      expect(dbInstance!.config.instance_class).toBe('db.t3.medium');
      expect(dbInstance!.config.allocated_storage).toBe(100);

      const vpc = resources.find(r => r.resourceType === 'aws_vpc');
      expect(vpc).toBeDefined();
      expect(vpc!.config.cidr_block).toBe('10.1.0.0/16');
    });

    it('should parse Azure AKS cluster configuration', async () => {
      const terraformContent = `
resource "azurerm_kubernetes_cluster" "main" {
  name                = "my-aks-cluster"
  location            = "East US"
  resource_group_name = "my-resource-group"
  dns_prefix          = "myaks"

  default_node_pool {
    name       = "default"
    node_count = 3
    vm_size    = "Standard_D2s_v3"
  }

  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_postgresql_server" "main" {
  name                = "my-postgres-server"
  location            = "East US"
  resource_group_name = "my-resource-group"
  version             = "15"
  sku_name            = "Standard_B2s"
  storage_mb          = 32768
}

resource "azurerm_virtual_network" "main" {
  name                = "my-vnet"
  address_space       = ["10.2.0.0/16"]
  location            = "East US"
  resource_group_name = "my-resource-group"
}
`;

      const tfFile = path.join(tempDir, 'main.tf');
      fs.writeFileSync(tfFile, terraformContent);

      const resources = await TerraformImportAdapter.parseTerraformFiles(tempDir, 'azure');
      
      expect(resources).toHaveLength(3);
      
      const aksCluster = resources.find(r => r.resourceType === 'azurerm_kubernetes_cluster');
      expect(aksCluster).toBeDefined();
      expect(aksCluster!.resourceName).toBe('main');

      const postgresServer = resources.find(r => r.resourceType === 'azurerm_postgresql_server');
      expect(postgresServer).toBeDefined();
      expect(postgresServer!.resourceName).toBe('main');
      expect(postgresServer!.config.version).toBe('15');
      expect(postgresServer!.config.sku_name).toBe('Standard_B2s');

      const vnet = resources.find(r => r.resourceType === 'azurerm_virtual_network');
      expect(vnet).toBeDefined();
      expect(vnet!.config.address_space).toContain('10.2.0.0/16');
    });

    it('should parse GCP GKE cluster configuration', async () => {
      const terraformContent = `
resource "google_container_cluster" "main" {
  name     = "my-gke-cluster"
  location = "us-central1"

  remove_default_node_pool = true
  initial_node_count       = 1

  master_auth {
    client_certificate_config {
      issue_client_certificate = false
    }
  }
}

resource "google_sql_database_instance" "postgres" {
  name             = "my-postgres-instance"
  database_version = "POSTGRES_15"
  region           = "us-central1"
  settings {
    tier = "db-custom-2-4096"
    disk_size = 100
  }
}

resource "google_compute_network" "vpc" {
  name                    = "my-vpc"
  auto_create_subnetworks = false
}
`;

      const tfFile = path.join(tempDir, 'main.tf');
      fs.writeFileSync(tfFile, terraformContent);

      const resources = await TerraformImportAdapter.parseTerraformFiles(tempDir, 'gcp');
      
      expect(resources).toHaveLength(3);
      
      const gkeCluster = resources.find(r => r.resourceType === 'google_container_cluster');
      expect(gkeCluster).toBeDefined();
      expect(gkeCluster!.resourceName).toBe('main');
      expect(gkeCluster!.config.location).toBe('us-central1');

      const sqlInstance = resources.find(r => r.resourceType === 'google_sql_database_instance');
      expect(sqlInstance).toBeDefined();
      expect(sqlInstance!.resourceName).toBe('postgres');
      expect(sqlInstance!.config.database_version).toBe('POSTGRES_15');

      const vpc = resources.find(r => r.resourceType === 'google_compute_network');
      expect(vpc).toBeDefined();
      expect(vpc!.config.auto_create_subnetworks).toBe(false);
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should complete full AWS import workflow', async () => {
      const terraformContent = `
resource "aws_eks_cluster" "production" {
  name     = "prod-cluster"
  role_arn = "arn:aws:iam::123456789012:role/eks-service-role"
  version  = "1.29"

  vpc_config {
    subnet_ids = ["subnet-123", "subnet-456"]
  }
}

resource "aws_db_instance" "production" {
  identifier     = "prod-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.large"
  allocated_storage = 500
}

resource "aws_instance" "adfs" {
  ami           = "ami-12345678"
  instance_type = "t3.medium"
}
`;

      const tfFile = path.join(tempDir, 'main.tf');
      fs.writeFileSync(tfFile, terraformContent);

      // Parse Terraform files
      const resources = await TerraformImportAdapter.parseTerraformFiles(tempDir, 'aws');
      expect(resources).toHaveLength(3);

      // Convert to Chiral intent
      const intent = await TerraformImportAdapter.convertToChiralIntent(resources, 'aws');
      
      expect(intent.k8s?.version).toBe('1.29');
      expect(intent.postgres?.engineVersion).toBe('15.4');
      expect(intent.postgres?.storageGb).toBe(500);
      expect(intent.networkCidr).toBe('10.0.0.0/16'); // Default

      // Complete import workflow
      const chiralSystem = await TerraformImportAdapter.importFromTerraform({
        provider: 'aws',
        sourcePath: tempDir
      });

      expect(chiralSystem.projectName).toBe('imported-infrastructure');
      expect(chiralSystem.environment).toBe('prod');
      expect(chiralSystem.k8s.version).toBe('1.29');
      expect(chiralSystem.postgres.engineVersion).toBe('15.4');
      expect(chiralSystem.postgres.storageGb).toBe(500);
      expect(chiralSystem.migration?.strategy).toBe('progressive');
      expect(chiralSystem.migration?.sourceState).toBe(tempDir);
      expect(chiralSystem.migration?.validateCompliance).toBe(true);
    });

    it('should handle mixed provider resources gracefully', async () => {
      const terraformContent = `
resource "aws_eks_cluster" "main" {
  name     = "mixed-cluster"
  version  = "1.28"
}

resource "random_pet" "this" {
  length = 2
}
`;

      const tfFile = path.join(tempDir, 'main.tf');
      fs.writeFileSync(tfFile, terraformContent);

      const resources = await TerraformImportAdapter.parseTerraformFiles(tempDir, 'aws');
      
      // Should parse both resources but only map relevant ones
      expect(resources).toHaveLength(2);

      const intent = await TerraformImportAdapter.convertToChiralIntent(resources, 'aws');
      
      // Should map EKS cluster but ignore random_pet
      expect(intent.k8s?.version).toBe('1.28');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid directory gracefully', async () => {
      const resources = await TerraformImportAdapter.parseTerraformFiles('/nonexistent/path', 'aws');
      expect(resources).toEqual([]);
    });

    it('should handle malformed HCL gracefully', async () => {
      const malformedContent = `
resource "aws_eks_cluster" "main" {
  name     = "test"
  # Missing closing brace
`;

      const tfFile = path.join(tempDir, 'malformed.tf');
      fs.writeFileSync(tfFile, malformedContent);

      const resources = await TerraformImportAdapter.parseTerraformFiles(tempDir, 'aws');
      // Should not crash, but may not parse malformed content
      expect(Array.isArray(resources)).toBe(true);
    });

    it('should handle empty directory', async () => {
      const resources = await TerraformImportAdapter.parseTerraformFiles(tempDir, 'aws');
      expect(resources).toEqual([]);
    });
  });
});
