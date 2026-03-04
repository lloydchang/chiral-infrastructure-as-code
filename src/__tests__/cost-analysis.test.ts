// File: src/__tests__/cost-analysis.test.ts

// Tests for cost analysis functionality

import { AzureCostAnalyzer, AWSCostAnalyzer, GCPCostAnalyzer, CostAnalyzer, CostOptimizer } from '../cost-analysis';
import { ChiralSystem } from '../intent';

describe('Cost Analysis', () => {
  const testConfig: ChiralSystem = {
    projectName: 'test-project',
    environment: 'dev',
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

  describe('AzureCostAnalyzer', () => {
    describe('isAvailable', () => {
      it('should return boolean indicating azure-cost-cli availability', () => {
        const result = AzureCostAnalyzer.isAvailable();
        expect(typeof result).toBe('boolean');
      });
    });

    describe('getAzurePricing', () => {
      it('should return cost estimate for Azure', async () => {
        const estimate = await AzureCostAnalyzer.getAzurePricing(testConfig);
        
        expect(estimate.provider).toBe('azure');
        expect(estimate.totalMonthlyCost).toBeGreaterThan(0);
        expect(estimate.currency).toBe('USD');
        expect(estimate.breakdown).toBeDefined();
        expect(estimate.breakdown.compute.total).toBeGreaterThan(0);
        expect(estimate.breakdown.storage.total).toBeGreaterThan(0);
        expect(estimate.breakdown.network.total).toBeGreaterThan(0);
        expect(estimate.breakdown.other.total).toBeGreaterThanOrEqual(0);
      });

      it('should include recommendations and warnings', async () => {
        const estimate = await AzureCostAnalyzer.getAzurePricing(testConfig);
        
        expect(Array.isArray(estimate.recommendations)).toBe(true);
        expect(Array.isArray(estimate.warnings)).toBe(true);
      });

      it('should handle custom options', async () => {
        const options = {
          region: 'West Europe',
          currency: 'EUR',
          detailed: true
        };
        
        const estimate = await AzureCostAnalyzer.getAzurePricing(testConfig, options);
        
        expect(estimate.currency).toBe('EUR');
      });
    });
  });

  describe('AWSCostAnalyzer', () => {
    describe('isAvailable', () => {
      it('should return boolean indicating AWS cost analysis tools availability', () => {
        const result = AWSCostAnalyzer.isAvailable();
        expect(typeof result).toBe('boolean');
      });
    });

    describe('getAWSPricing', () => {
      it('should return cost estimate for AWS', async () => {
        const estimate = await AWSCostAnalyzer.getAWSPricing(testConfig);
        
        expect(estimate.provider).toBe('aws');
        expect(estimate.totalMonthlyCost).toBeGreaterThan(0);
        expect(estimate.currency).toBe('USD');
        expect(estimate.breakdown).toBeDefined();
        expect(estimate.breakdown.compute.total).toBeGreaterThan(0);
        expect(estimate.breakdown.storage.total).toBeGreaterThan(0);
        expect(estimate.breakdown.network.total).toBeGreaterThanOrEqual(0);
        expect(estimate.breakdown.other.total).toBeGreaterThanOrEqual(0);
      });

      it('should include recommendations and warnings', async () => {
        const estimate = await AWSCostAnalyzer.getAWSPricing(testConfig);
        
        expect(Array.isArray(estimate.recommendations)).toBe(true);
        expect(Array.isArray(estimate.warnings)).toBe(true);
      });

      it('should handle custom options', async () => {
        const options = {
          region: 'us-west-2',
          currency: 'USD',
          detailed: true
        };
        
        const estimate = await AWSCostAnalyzer.getAWSPricing(testConfig, options);
        
        expect(estimate.currency).toBe('USD');
      });
    });
  });

  describe('GCPCostAnalyzer', () => {
    describe('isAvailable', () => {
      it('should return boolean indicating GCP cost analysis tools availability', () => {
        const result = GCPCostAnalyzer.isAvailable();
        expect(typeof result).toBe('boolean');
      });
    });

    describe('getGCPPricing', () => {
      it('should return cost estimate for GCP', async () => {
        const estimate = await GCPCostAnalyzer.getGCPPricing(testConfig);
        
        expect(estimate.provider).toBe('gcp');
        expect(estimate.totalMonthlyCost).toBeGreaterThan(0);
        expect(estimate.currency).toBe('USD');
        expect(estimate.breakdown).toBeDefined();
        expect(estimate.breakdown.compute.total).toBeGreaterThan(0);
        expect(estimate.breakdown.storage.total).toBeGreaterThan(0);
        expect(estimate.breakdown.network.total).toBeGreaterThanOrEqual(0);
        expect(estimate.breakdown.other.total).toBeGreaterThanOrEqual(0);
      });

      it('should include recommendations and warnings', async () => {
        const estimate = await GCPCostAnalyzer.getGCPPricing(testConfig);
        
        expect(Array.isArray(estimate.recommendations)).toBe(true);
        expect(Array.isArray(estimate.warnings)).toBe(true);
      });

      it('should handle custom options', async () => {
        const options = {
          region: 'europe-west1',
          currency: 'EUR',
          detailed: true
        };
        
        const estimate = await GCPCostAnalyzer.getGCPPricing(testConfig, options);
        
        expect(estimate.currency).toBe('EUR');
      });
    });
  });

  describe('CostAnalyzer', () => {
    describe('compareCosts', () => {
      it('should return cost comparison across all providers', async () => {
        const comparison = await CostAnalyzer.compareCosts(testConfig);
        
        expect(comparison.cheapest.provider).toBeDefined();
        expect(comparison.cheapest.cost).toBeGreaterThan(0);
        expect(comparison.cheapest.savings).toBeGreaterThanOrEqual(0);
        expect(comparison.mostExpensive.provider).toBeDefined();
        expect(comparison.mostExpensive.cost).toBeGreaterThan(0);
        expect(comparison.estimates.aws).toBeDefined();
        expect(comparison.estimates.azure).toBeDefined();
        expect(comparison.estimates.gcp).toBeDefined();
      });

      it('should have cheapest cost less than or equal to most expensive', async () => {
        const comparison = await CostAnalyzer.compareCosts(testConfig);
        
        expect(comparison.cheapest.cost).toBeLessThanOrEqual(comparison.mostExpensive.cost);
      });
    });

    describe('getAWSEstimate', () => {
      it('should return AWS cost estimate', async () => {
        const estimate = await CostAnalyzer.getAWSEstimate(testConfig);
        
        expect(estimate.provider).toBe('aws');
        expect(estimate.totalMonthlyCost).toBeGreaterThan(0);
        expect(estimate.currency).toBe('USD');
        expect(estimate.breakdown.compute.total).toBeGreaterThan(0);
      });
    });

    describe('getGCPEstimate', () => {
      it('should return GCP cost estimate', async () => {
        const estimate = await CostAnalyzer.getGCPEstimate(testConfig);
        
        expect(estimate.provider).toBe('gcp');
        expect(estimate.totalMonthlyCost).toBeGreaterThan(0);
        expect(estimate.currency).toBe('USD');
        expect(estimate.breakdown.compute.total).toBeGreaterThan(0);
      });
    });

    describe('generateCostReport', () => {
      it('should generate formatted cost report', async () => {
        const comparison = await CostAnalyzer.compareCosts(testConfig);
        const report = CostAnalyzer.generateCostReport(comparison);
        
        expect(typeof report).toBe('string');
        expect(report).toContain('Cost Analysis Report');
        expect(report).toContain('Cheapest:');
        expect(report).toContain('Most Expensive:');
        expect(report).toContain('Potential Savings:');
      });

      it('should include detailed breakdown when requested', async () => {
        const comparison = await CostAnalyzer.compareCosts(testConfig);
        const report = CostAnalyzer.generateCostReport(comparison, { detailed: true });
        
        expect(report).toContain('Detailed Breakdown');
        expect(report).toContain('AWS:');
        expect(report).toContain('Azure:');
        expect(report).toContain('GCP:');
      });
    });
  });

  describe('CostOptimizer', () => {
    describe('analyzeConfiguration', () => {
      it('should return optimization recommendations', () => {
        const recommendations = CostOptimizer.analyzeConfiguration(testConfig);
        
        expect(Array.isArray(recommendations)).toBe(true);
      });

      it('should recommend reducing nodes for large dev clusters', () => {
        const largeDevConfig: ChiralSystem = {
          ...testConfig,
          environment: 'dev',
          k8s: {
            ...testConfig.k8s,
            maxNodes: 15
          }
        };
        
        const recommendations = CostOptimizer.analyzeConfiguration(largeDevConfig);
        const hasNodeRecommendation = recommendations.some(rec => 
          rec.includes('reducing max nodes')
        );
        
        expect(hasNodeRecommendation).toBe(true);
      });

      it('should recommend enabling autoscaling for production', () => {
        const prodConfigNoAutoscaling: ChiralSystem = {
          ...testConfig,
          environment: 'prod',
          k8s: {
            ...testConfig.k8s,
            minNodes: 3,
            maxNodes: 3
          }
        };
        
        const recommendations = CostOptimizer.analyzeConfiguration(prodConfigNoAutoscaling);
        const hasAutoscalingRecommendation = recommendations.some(rec => 
          rec.includes('autoscaling')
        );
        
        expect(hasAutoscalingRecommendation).toBe(true);
      });
    });

    describe('suggestCostEffectiveAlternatives', () => {
      it('should return alternative provider suggestions', () => {
        const alternatives = CostOptimizer.suggestCostEffectiveAlternatives(testConfig);
        
        expect(Array.isArray(alternatives)).toBe(true);
        alternatives.forEach(alt => {
          expect(alt.provider).toBeDefined();
          expect(alt.reason).toBeDefined();
          expect(alt.savings).toBeDefined();
        });
      });
    });
  });

  describe('Cost Analysis Integration', () => {
    it('should handle different environment configurations', async () => {
      const prodConfig: ChiralSystem = {
        ...testConfig,
        environment: 'prod'
      };
      
      const devEstimate = await AzureCostAnalyzer.getAzurePricing(testConfig);
      const prodEstimate = await AzureCostAnalyzer.getAzurePricing(prodConfig);
      
      // Production should typically cost more due to HA settings
      expect(prodEstimate.totalMonthlyCost).toBeGreaterThanOrEqual(devEstimate.totalMonthlyCost);
    });

    it('should handle different sizes', async () => {
      const smallConfig: ChiralSystem = {
        ...testConfig,
        k8s: { ...testConfig.k8s, size: 'small', maxNodes: 2 },
        postgres: { ...testConfig.postgres, size: 'small', storageGb: 20 },
        adfs: { ...testConfig.adfs, size: 'small' }
      };
      
      const largeConfig: ChiralSystem = {
        ...testConfig,
        k8s: { ...testConfig.k8s, size: 'large', maxNodes: 10 },
        postgres: { ...testConfig.postgres, size: 'large', storageGb: 1000 },
        adfs: { ...testConfig.adfs, size: 'large' }
      };
      
      const smallEstimate = await AzureCostAnalyzer.getAzurePricing(smallConfig);
      const largeEstimate = await AzureCostAnalyzer.getAzurePricing(largeConfig);
      
      expect(largeEstimate.totalMonthlyCost).toBeGreaterThan(smallEstimate.totalMonthlyCost);
    });
  });
});
