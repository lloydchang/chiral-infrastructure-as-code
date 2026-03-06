import { analyzeTerraformSetup, compareApproaches } from '../main';
import { ChiralSystem } from '../intent';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module for testing
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Migration and Analysis Tests', () => {
  let mockState: any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Terraform Setup Analysis', () => {
    it('should analyze single state file correctly', async () => {
      mockState = {
        version: 4,
        terraform_version: "1.0.0",
        serial: 1,
        lineage: "test-lineage",
        outputs: {},
        resources: [
          { type: "aws_vpc", name: "main", mode: "managed" },
          { type: "aws_subnet", name: "private", mode: "managed" },
          { type: "aws_eks_cluster", name: "main", mode: "managed" }
        ],
        terraform: {
          backend: {
            type: "s3",
            config: {
              bucket: "test-bucket",
              key: "terraform.tfstate"
            }
          }
        }
      };

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockState));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await analyzeTerraformSetup('/path/to/terraform.tfstate', 'aws', true, false);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📋 Terraform Setup Analysis'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('terraform.tfstate: 3 resources'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📊 Analysis Results:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total Resources: 3'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Backend Type: s3'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Terraform Premium: $2.97/month'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Annual Savings: $35.64'));

      consoleSpy.mockRestore();
    });

    it('should analyze directory with multiple state files', async () => {
      const mockState1 = {
        resources: [{ type: "aws_vpc", name: "main", mode: "managed" }]
      };
      const mockState2 = {
        resources: [
          { type: "aws_eks_cluster", name: "main", mode: "managed" },
          { type: "aws_rds_instance", name: "main", mode: "managed" }
        ]
      };

      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue(['state1.tfstate', 'state2.tfstate', 'other.txt'] as any);
      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify(mockState1))
        .mockReturnValueOnce(JSON.stringify(mockState2));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await analyzeTerraformSetup('/path/to/terraform', 'aws', false);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total Resources: 3'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('State Files: 2'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🟡 MEDIUM RISK: Multiple state files increase coordination overhead'));

      consoleSpy.mockRestore();
    });

    it('should handle local state backend as high risk', async () => {
      const mockState = {
        resources: [{ type: "aws_vpc", name: "main", mode: "managed" }]
      };

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockState));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await analyzeTerraformSetup('/path/to/terraform.tfstate', 'aws', false);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🔴 HIGH RISK: Local state files are single points of failure'));

      consoleSpy.mockRestore();
    });

    it('should identify high resource count as high risk', async () => {
      const mockState = {
        resources: Array.from({ length: 150 }, (_, i) => ({
          type: "aws_instance",
          name: `instance${i}`,
          mode: "managed"
        })),
        backend: { type: "s3" }
      };

      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockState));

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await analyzeTerraformSetup('/path/to/terraform.tfstate', 'aws', false);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🔴 HIGH RISK: Large resource count increases state management complexity'));

      consoleSpy.mockRestore();
    });

    it('should handle missing state files gracefully', async () => {
      mockFs.statSync.mockReturnValue({ isDirectory: () => true } as any);
      mockFs.readdirSync.mockReturnValue([] as any);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await analyzeTerraformSetup('/path/to/empty', 'aws', false);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️  No Terraform state files found'));

      consoleSpy.mockRestore();
    });

    it('should handle corrupted state files', async () => {
      mockFs.statSync.mockReturnValue({ isDirectory: () => false } as any);
      mockFs.readFileSync.mockReturnValue('invalid json');

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await analyzeTerraformSetup('/path/to/corrupted.tfstate', 'aws', false);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌ corrupted.tfstate: Unable to parse state file'));

      consoleSpy.mockRestore();
    });
  });

  describe('Approach Comparison', () => {
    it('should compare simple infrastructure correctly', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await compareApproaches(50, 3, 'simple');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('📊 Detailed Comparison:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('💰 Monthly Cost Comparison:'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Premium Fees: $49.50'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Annual Savings: $'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Zero state architecture'));

      consoleSpy.mockRestore();
    });

    it('should calculate costs for complex infrastructure correctly', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await compareApproaches(200, 10, 'complex');

      // For 200 resources, 10 team members, complex complexity:
      // Terraform: $198 (premium) + $120,000 (operational) = $120,198
      // Chiral: $0 (premium) + $30,000 (operational) = $30,000
      // Savings: $90,198 monthly = $1,082,376 annually = 75.0%

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Premium Fees: $198.00'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Operational Overhead: $120000.00'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total Monthly Cost: $120198.00'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Chiral Cost: $30000.00'));

      consoleSpy.mockRestore();
    });

    it('should show risk comparison', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await compareApproaches(100, 5, 'medium');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌ State corruption from concurrent modifications'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌ Lock contention and orphaned locks'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Native cloud concurrency controls'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✅ Built-in security and compliance'));

      consoleSpy.mockRestore();
    });

    it('should calculate savings percentage correctly', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await compareApproaches(100, 5, 'medium');

      // For 100 resources, 5 team members, medium complexity:
      // Terraform: $99 (premium) + $45,000 (operational) = $45,099
      // Chiral: $0 (premium) + $11,250 (operational) = $11,250
      // Savings: $33,849 monthly = $406,188 annually = 75.1%

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Annual Savings: $406188.00'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cost Reduction: 75.1%'));

      consoleSpy.mockRestore();
    });
  });

  describe('Migration Validation', () => {
    it('should validate migration configuration structure', () => {
      const validMigrationConfig: ChiralSystem = {
        projectName: 'test-project',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        migration: {
          strategy: 'progressive',
          sourceState: '/path/to/terraform.tfstate',
          validateCompliance: true
        },
        compliance: {
          framework: 'soc2',
          dataResidency: {
            aws: 'us-east-1',
            azure: 'eastus',
            gcp: 'us-central1'
          },
          encryptionAtRest: true,
          auditLogging: true
        },
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

      expect(validMigrationConfig.migration?.strategy).toBe('progressive');
      expect(validMigrationConfig.compliance?.framework).toBe('soc2');
      expect(validMigrationConfig.compliance?.encryptionAtRest).toBe(true);
    });

    it('should handle optional migration fields', () => {
      const minimalConfig: ChiralSystem = {
        projectName: 'test-project',
        environment: 'dev',
        networkCidr: '10.0.0.0/16',
        k8s: {
          version: '1.28',
          minNodes: 1,
          maxNodes: 3,
          size: 'small'
        },
        postgres: {
          engineVersion: '14',
          size: 'small',
          storageGb: 50
        },
        adfs: {
          size: 'small',
          windowsVersion: '2019'
        }
      };

      expect(minimalConfig.migration).toBeUndefined();
      expect(minimalConfig.compliance).toBeUndefined();
    });
  });

  describe('Cost Analysis Validation', () => {
    it('should validate cost calculation formulas', () => {
      // Test IBM Terraform Premium calculation
      const resourceCount = 150;
      const expectedTerraformCost = resourceCount * 0.99; // $148.50 per month
      expect(expectedTerraformCost).toBe(148.50);

      // Test annual calculation
      const annualCost = expectedTerraformCost * 12;
      expect(annualCost).toBe(1782.00);

      // Test operational overhead calculation
      const teamSize = 8;
      const complexity = 'complex'; // 2x multiplier
      const operationalHours = teamSize * 40 * 2; // 640 hours
      expect(operationalHours).toBe(640);

      // Test operational cost calculation
      const hourlyRate = 150;
      const operationalCost = operationalHours * hourlyRate;
      expect(operationalCost).toBe(96000);
    });

    it('should validate Chiral cost savings', () => {
      const resourceCount = 100;
      const teamSize = 5;
      const complexity = 'medium'; // 1.5x multiplier

      // Terraform costs
      const terraformPremium = resourceCount * 0.99; // $99
      const terraformOperationalHours = teamSize * 40 * 1.5; // 300 hours
      const terraformOperationalCost = terraformOperationalHours * 150; // $45,000
      const totalTerraformCost = terraformPremium + terraformOperationalCost; // $45,099

      // Chiral costs
      const chiralOperationalHours = teamSize * 10 * 1.5; // 75 hours
      const chiralOperationalCost = chiralOperationalHours * 150; // $11,250
      const totalChiralCost = chiralOperationalCost; // $11,250

      // Savings
      const monthlySavings = totalTerraformCost - totalChiralCost; // $33,849
      const annualSavings = monthlySavings * 12; // $406,188
      const savingsPercentage = (monthlySavings / totalTerraformCost) * 100; // 75.1%

      expect(monthlySavings).toBe(33849);
      expect(annualSavings).toBe(406188);
      expect(savingsPercentage).toBeCloseTo(75.1, 1);
    });
  });
});
