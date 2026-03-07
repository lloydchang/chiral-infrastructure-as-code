import { ChiralConfig, WorkloadSize } from '../types';
import { generateTerraform } from '../cli/terraform-generator';
import * as fs from 'fs';
import * as path from 'path';

describe('Secret Manager Integration', () => {
  const testConfig: ChiralConfig = {
    project: {
      name: 'secret-test-project',
      environment: 'dev'
    },
    workloads: [
      {
        name: 'webapp',
        size: 'small' as WorkloadSize,
        replicas: 2,
        ports: [80],
        environment: {
          DATABASE_URL: '${aws_secretsmanager_secret.db_credentials.arn}'
        }
      },
      {
        name: 'database',
        size: 'small' as WorkloadSize,
        type: 'database',
        engine: 'postgres',
        version: '15'
      }
    ],
    networking: {
      vpcCidr: '10.0.0.0/16',
      subnets: [
        { cidr: '10.0.1.0/24', type: 'private', availabilityZone: 'us-west-2a' },
        { cidr: '10.0.2.0/24', type: 'public', availabilityZone: 'us-west-2a' }
      ]
    },
    security: {
      enableSecretManager: true,
      secretRotation: true
    }
  };

  describe('AWS Secrets Manager Integration', () => {
    it('should generate secret manager resources when enabled', async () => {
      const terraformCode = await generateTerraform(testConfig, 'aws');
      
      expect(terraformCode).toContain('aws_secretsmanager_secret');
      expect(terraformCode).toContain('random_password');
      expect(terraformCode).toContain('aws_secretsmanager_secret_version');
    });

    it('should include proper secret rotation configuration', async () => {
      const terraformCode = await generateTerraform(testConfig, 'aws');
      
      expect(terraformCode).toContain('aws_secretsmanager_secret_rotation');
      expect(terraformCode).toContain('rotation_lambda_arn');
      expect(terraformCode).toContain('automatically_after_days');
    });

    it('should reference secrets in workload environment variables', async () => {
      const terraformCode = await generateTerraform(testConfig, 'aws');
      
      expect(terraformCode).toContain('DATABASE_URL');
      expect(terraformCode).toContain('aws_secretsmanager_secret');
    });

    it('should not generate secret manager resources when disabled', async () => {
      const configWithoutSecrets = {
        ...testConfig,
        security: {
          ...testConfig.security,
          enableSecretManager: false
        }
      };

      const terraformCode = await generateTerraform(configWithoutSecrets, 'aws');
      
      expect(terraformCode).not.toContain('aws_secretsmanager_secret');
      expect(terraformCode).not.toContain('random_password');
    });
  });

  describe('Azure Key Vault Integration', () => {
    it('should generate Key Vault resources when enabled', async () => {
      const terraformCode = await generateTerraform(testConfig, 'azure');
      
      expect(terraformCode).toContain('azurerm_key_vault');
      expect(terraformCode).toContain('azurerm_key_vault_secret');
    });

    it('should include proper access policies for Key Vault', async () => {
      const terraformCode = await generateTerraform(testConfig, 'azure');
      
      expect(terraformCode).toContain('azurerm_key_vault_access_policy');
      expect(terraformCode).toContain('secret_permissions');
    });
  });

  describe('GCP Secret Manager Integration', () => {
    it('should generate Secret Manager resources when enabled', async () => {
      const terraformCode = await generateTerraform(testConfig, 'gcp');
      
      expect(terraformCode).toContain('google_secret_manager_secret');
      expect(terraformCode).toContain('google_secret_manager_secret_version');
    });

    it('should include proper IAM bindings for secret access', async () => {
      const terraformCode = await generateTerraform(testConfig, 'gcp');
      
      expect(terraformCode).toContain('google_secret_manager_secret_iam_binding');
      expect(terraformCode).toContain('roles/secretmanager.secretAccessor');
    });
  });

  describe('Security Best Practices', () => {
    it('should generate encrypted storage by default', async () => {
      const terraformCode = await generateTerraform(testConfig, 'aws');
      
      expect(terraformCode).toContain('storage_encrypted = true');
    });

    it('should include proper resource tagging', async () => {
      const terraformCode = await generateTerraform(testConfig, 'aws');
      
      expect(terraformCode).toContain('ManagedBy');
      expect(terraformCode).toContain('chiral-secrets-manager');
    });

    it('should configure different recovery windows for environments', async () => {
      const prodConfig = {
        ...testConfig,
        project: {
          ...testConfig.project,
          environment: 'prod'
        }
      };

      const devCode = await generateTerraform(testConfig, 'aws');
      const prodCode = await generateTerraform(prodConfig, 'aws');
      
      // Production should have longer recovery window
      expect(prodCode).toContain('recovery_window_in_days = 30');
      expect(devCode).toContain('recovery_window_in_days = 0');
    });
  });

  describe('Example Files Validation', () => {
    const examplesPath = path.join(__dirname, '../../examples/secret-manager-integration');
    
    it('should have AWS Secrets Manager example files', () => {
      const awsPath = path.join(examplesPath, 'aws-secrets-manager');
      expect(fs.existsSync(path.join(awsPath, 'README.md'))).toBe(true);
      expect(fs.existsSync(path.join(awsPath, 'terraform-example.tf'))).toBe(true);
      expect(fs.existsSync(path.join(awsPath, 'deployment-guide.md'))).toBe(true);
    });

    it('should have Azure Key Vault example files', () => {
      const azurePath = path.join(examplesPath, 'azure-key-vault');
      expect(fs.existsSync(path.join(azurePath, 'README.md'))).toBe(true);
      expect(fs.existsSync(path.join(azurePath, 'bicep-example.bicep'))).toBe(true);
      expect(fs.existsSync(path.join(azurePath, 'deployment-guide.md'))).toBe(true);
    });

    it('should have GCP Secret Manager example files', () => {
      const gcpPath = path.join(examplesPath, 'gcp-secret-manager');
      expect(fs.existsSync(path.join(gcpPath, 'README.md'))).toBe(true);
      expect(fs.existsSync(path.join(gcpPath, 'terraform-example.tf'))).toBe(true);
      expect(fs.existsSync(path.join(gcpPath, 'deployment-guide.md'))).toBe(true);
    });

    it('should validate Terraform syntax in AWS example', async () => {
      const awsTfPath = path.join(examplesPath, 'aws-secrets-manager/terraform-example.tf');
      const tfContent = fs.readFileSync(awsTfPath, 'utf8');
      
      expect(tfContent).toContain('terraform {');
      expect(tfContent).toContain('required_providers');
      expect(tfContent).toContain('aws_secretsmanager_secret');
      expect(tfContent).toContain('random_password');
      expect(tfContent).toContain('resource "aws_db_instance"');
    });

    it('should include proper security configurations in examples', () => {
      const awsTfPath = path.join(examplesPath, 'aws-secrets-manager/terraform-example.tf');
      const tfContent = fs.readFileSync(awsTfPath, 'utf8');
      
      expect(tfContent).toContain('storage_encrypted = true');
      expect(tfContent).toContain('recovery_window_in_days');
      expect(tfContent).toContain('aws_iam_role');
      expect(tfContent).toContain('aws_iam_policy');
    });
  });
});
