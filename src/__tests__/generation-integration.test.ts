import * as fs from 'fs';
import * as path from 'path';
import { AzureBicepAdapter } from '../adapters/declarative/azure-bicep';
import { GcpTerraformAdapter } from '../adapters/declarative/gcp-terraform';
import { ChiralSystem } from '../intent';

describe('Chiral Generation Integration', () => {
  const testIntent: ChiralSystem = {
    projectName: 'integration-test',
    environment: 'prod',
    networkCidr: '10.0.0.0/16',
    k8s: {
      version: '1.29',
      minNodes: 2,
      maxNodes: 5,
      size: 'large'
    },
    postgres: {
      engineVersion: '15',
      size: 'large',
      storageGb: 100
    },
    adfs: {
      size: 'large',
      windowsVersion: '2022'
    }
  };

  describe('Azure Bicep Generation', () => {
    it('should generate deployable Bicep template', () => {
      const bicepContent = AzureBicepAdapter.generate(testIntent);

      // Validate Bicep structure
      expect(bicepContent).toContain('@description');
      expect(bicepContent).toContain('param location');
      expect(bicepContent).toContain('param adminPassword');
      expect(bicepContent).toContain('Microsoft.Network/virtualNetworks');
      expect(bicepContent).toContain('Microsoft.ContainerService/managedClusters');
      expect(bicepContent).toContain('Microsoft.DBforPostgreSQL/flexibleServers');
      expect(bicepContent).toContain('Microsoft.Compute/virtualMachines');

      // Validate resource naming
      expect(bicepContent).toContain('integration-test-vnet');
      expect(bicepContent).toContain('integration-test-aks');
      expect(bicepContent).toContain('integration-test-pg');
      expect(bicepContent).toContain('integration-test-adfs');
    });

    it('should include all required parameters', () => {
      const bicepContent = AzureBicepAdapter.generate(testIntent);

      expect(bicepContent).toContain('@secure()');
      expect(bicepContent).toContain('param adminPassword string');
      expect(bicepContent).toContain('param location string');
    });

    it('should include output definitions', () => {
      const bicepContent = AzureBicepAdapter.generate(testIntent);

      expect(bicepContent).toContain('output vnetId string');
      expect(bicepContent).toContain('output aksClusterName string');
      expect(bicepContent).toContain('output postgresEndpoint string');
      expect(bicepContent).toContain('output adfsVmId string');
    });
  });

  describe('Google Cloud Infrastructure Manager Terraform Generation', () => {
    it('should generate deployable Terraform HCL', () => {
      const tfContent = GcpTerraformAdapter.generate(testIntent);

      // Validate Terraform structure
      expect(tfContent).toContain('terraform {');
      expect(tfContent).toContain('required_providers');
      expect(tfContent).toContain('google = {');
      expect(tfContent).toContain('resource "google_compute_network"');
      expect(tfContent).toContain('resource "google_container_cluster"');
      expect(tfContent).toContain('resource "google_sql_database_instance"');
      expect(tfContent).toContain('resource "google_compute_instance"');

      // Validate resource naming
      expect(tfContent).toContain('integration-test-vpc');
      expect(tfContent).toContain('integration-test-gke');
      expect(tfContent).toContain('integration-test-pg');
      expect(tfContent).toContain('integration-test-adfs');
    });

    it('should include proper Terraform structure', () => {
      const tfContent = GcpTerraformAdapter.generate(testIntent);

      expect(tfContent).toContain('required_providers {');
      expect(tfContent).toContain('source  = "hashicorp/google"');
      expect(tfContent).toContain('version = "~> 4.0"');
    });

    it('should include database configuration', () => {
      const tfContent = GcpTerraformAdapter.generate(testIntent);

      expect(tfContent).toContain('database_version = "POSTGRES_15"');
      expect(tfContent).toContain('tier = "db-custom-4-8192"');
      expect(tfContent).toContain('disk_size = 100');
    });
  });

  describe('Cross-Cloud Consistency', () => {
    it('should use same project name across clouds', () => {
      const azureBicep = AzureBicepAdapter.generate(testIntent);
      const gcpTf = GcpTerraformAdapter.generate(testIntent);

      expect(azureBicep).toContain('integration-test');
      expect(gcpTf).toContain('integration-test');
    });

    it('should use same environment settings', () => {
      const azureBicep = AzureBicepAdapter.generate(testIntent);
      const gcpTf = GcpTerraformAdapter.generate(testIntent);

      // Both should reflect prod environment
      expect(azureBicep).toContain('ZoneRedundant'); // Prod HA
      expect(gcpTf).toContain('deletion_protection = true'); // Prod protection
    });

    it('should use consistent sizing from HardwareMap', () => {
      const azureBicep = AzureBicepAdapter.generate(testIntent);
      const gcpTf = GcpTerraformAdapter.generate(testIntent);

      // Large sizes should be used consistently
      expect(azureBicep).toContain('Standard_D4s_v3'); // Azure large
      expect(gcpTf).toContain('n1-standard-2'); // GCP large VM
      expect(gcpTf).toContain('db-custom-4-8192'); // GCP large DB
    });
  });

  describe('File Output Validation', () => {
    const distDir = path.join(__dirname, '..', '..', 'dist');
    const azurePath = path.join(distDir, 'azure-deployment.bicep');
    const gcpPath = path.join(distDir, 'gcp-deployment.tf');

    beforeAll(() => {
      // Ensure dist directory exists
      if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
      }
    });

    it('should write valid Azure Bicep file', () => {
      const bicepContent = AzureBicepAdapter.generate(testIntent);
      fs.writeFileSync(azurePath, bicepContent);

      const writtenContent = fs.readFileSync(azurePath, 'utf8');
      expect(writtenContent).toBe(bicepContent);
      expect(writtenContent).toContain('integration-test-aks');
    });

    it('should write valid Google Cloud Infrastructure Manager Terraform file', () => {
      const tfContent = GcpTerraformAdapter.generate(testIntent);
      fs.writeFileSync(gcpPath, tfContent);

      const writtenContent = fs.readFileSync(gcpPath, 'utf8');
      expect(writtenContent).toBe(tfContent);
      expect(writtenContent).toContain('integration-test-gke');
    });

    afterAll(() => {
      // Clean up test files
      if (fs.existsSync(azurePath)) fs.unlinkSync(azurePath);
      if (fs.existsSync(gcpPath)) fs.unlinkSync(gcpPath);
    });
  });
});
