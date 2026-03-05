import { GcpTerraformAdapter } from '../adapters/declarative/gcp-terraform';
import { ChiralSystem } from '../intent';

describe('GcpTerraformAdapter', () => {
  const testIntent: ChiralSystem = {
    projectName: 'test-project',
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

  describe('generate method', () => {
    it('should generate valid Terraform HCL', () => {
      const result = GcpTerraformAdapter.generate(testIntent);

      expect(result).toContain('terraform {');
      expect(result).toContain('required_providers');
      expect(result).toContain('google = {');
      expect(result).toContain('resource "google_compute_network" "vpc"');
      expect(result).toContain('resource "google_container_cluster" "gke"');
      expect(result).toContain('resource "google_sql_database_instance" "postgres"');
      expect(result).toContain('resource "google_compute_instance" "adfs"');
    });

    it('should include project name in resource names', () => {
      const result = GcpTerraformAdapter.generate(testIntent);

      expect(result).toContain('test-project-vpc');
      expect(result).toContain('test-project-gke');
      expect(result).toContain('test-project-pg');
      expect(result).toContain('test-project-adfs');
    });

    it('should use correct network CIDR', () => {
      const result = GcpTerraformAdapter.generate(testIntent);

      expect(result).toContain('ip_cidr_range = "10.0.0.0/16"');
    });

    it('should use HardwareMap values for GCP sizing', () => {
      const result = GcpTerraformAdapter.generate(testIntent);

      expect(result).toContain('machine_type = "n1-standard-2"'); // Large VM
      expect(result).toContain('tier = "db-custom-4-8192"'); // Large DB
    });

    it('should configure production settings correctly', () => {
      const result = GcpTerraformAdapter.generate(testIntent);

      expect(result).toContain('deletion_protection = true'); // Prod setting
    });

    it('should configure development settings correctly', () => {
      const devIntent = { ...testIntent, environment: 'dev' as const };
      const result = GcpTerraformAdapter.generate(devIntent);

      expect(result).toContain('deletion_protection = false'); // Dev setting
    });

    it('should use correct PostgreSQL version', () => {
      const result = GcpTerraformAdapter.generate(testIntent);

      expect(result).toContain('POSTGRES_15');
    });

    it('should use correct Windows version for AD FS', () => {
      const result = GcpTerraformAdapter.generate(testIntent);

      expect(result).toContain('windows-2022');
    });

    it('should return a string', () => {
      const result = GcpTerraformAdapter.generate(testIntent);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should trim whitespace', () => {
      const result = GcpTerraformAdapter.generate(testIntent);

      expect(result).toBe(result.trim());
    });
  });

  describe('storage configuration', () => {
    it('should set correct PostgreSQL storage', () => {
      const result = GcpTerraformAdapter.generate(testIntent);

      expect(result).toContain('disk_size = 100');
    });

    it('should configure backup settings for prod', () => {
      const result = GcpTerraformAdapter.generate(testIntent);

      expect(result).toContain('backup_configuration {');
      expect(result).toContain('enabled = true');
      expect(result).toContain('start_time = "02:00"');
    });
  });

  describe('autoscaling configuration', () => {
    it('should include autoscaling block with min/max nodes', () => {
      const result = GcpTerraformAdapter.generate(testIntent);

      expect(result).toContain('autoscaling {');
      expect(result).toContain('min_node_count = 2');
      expect(result).toContain('max_node_count = 5');
    });

    it('should honor custom minNodes and maxNodes values', () => {
      const customIntent = { 
        ...testIntent, 
        k8s: { ...testIntent.k8s, minNodes: 3, maxNodes: 10 }
      };
      const result = GcpTerraformAdapter.generate(customIntent);

      expect(result).toContain('min_node_count = 3');
      expect(result).toContain('max_node_count = 10');
      expect(result).toContain('node_count = 3');
    });
  });
});
