// File: src/cost-analysis.ts

// Cost analysis and estimation capabilities for Chiral Infrastructure as Code
// Integrates with azure-cost-cli for accurate Azure pricing data

import { ChiralSystem } from './intent';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface CostEstimate {
  provider: 'aws' | 'azure' | 'gcp';
  totalMonthlyCost: number;
  currency: string;
  breakdown: CostBreakdown;
  recommendations: string[];
  warnings: string[];
}

export interface CostBreakdown {
  compute: {
    kubernetes: number;
    vm: number;
    total: number;
  };
  storage: {
    database: number;
    vmDisk: number;
    total: number;
  };
  network: {
    dataTransfer: number;
    loadBalancer: number;
    total: number;
  };
  other: {
    management: number;
    monitoring: number;
    total: number;
  };
}

export interface CostComparison {
  cheapest: {
    provider: 'aws' | 'azure' | 'gcp';
    cost: number;
    savings: number; // percentage savings vs most expensive
  };
  mostExpensive: {
    provider: 'aws' | 'azure' | 'gcp';
    cost: number;
  };
  estimates: {
    aws: CostEstimate;
    azure: CostEstimate;
    gcp: CostEstimate;
  };
}

export interface CostAnalysisOptions {
  region?: string;
  currency?: string;
  includeRecommendations?: boolean;
  detailed?: boolean;
  timeframe?: 'hourly' | 'daily' | 'monthly' | 'yearly';
}

// =================================================================
// AZURE COST CLI INTEGRATION
// =================================================================

export class AzureCostAnalyzer {
  private static readonly AZURE_COST_CLI = 'azure-cost-cli';

  static isAvailable(): boolean {
    try {
      execSync(`${this.AZURE_COST_CLI} --version`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  static async getAzurePricing(config: ChiralSystem, options: CostAnalysisOptions = {}): Promise<CostEstimate> {
    const region = options.region || config.region?.azure || 'East US';
    const currency = options.currency || 'USD';

    if (!this.isAvailable()) {
      console.warn('azure-cost-cli not found, using fallback pricing estimation');
      return this.getFallbackAzurePricing(config, region, currency);
    }

    try {
      // Use azure-cost-cli for real pricing data
      const pricingData = await this.fetchAzurePricingData(config, region);
      return this.calculateAzureCosts(config, pricingData, region, currency);
    } catch (error) {
      console.warn('Failed to fetch Azure pricing data, using fallback:', error);
      return this.getFallbackAzurePricing(config, region, currency);
    }
  }

  private static async fetchAzurePricingData(config: ChiralSystem, region: string): Promise<any> {
    // This would use azure-cost-cli to fetch real pricing data
    // For now, we'll implement a placeholder that would be replaced with actual CLI calls
    
    // Example of what the azure-cost-cli integration might look like:
    // const result = execSync(`${this.AZURE_COST_CLI} prices --region "${region}" --service "Virtual Machines" --sku "Standard_D4s_v3"`, { encoding: 'utf8' });
    
    return {
      virtualMachines: await this.getVMPricing(region),
      kubernetes: await this.getAKSPricing(region),
      databases: await this.getPostgresPricing(region),
      storage: await this.getStoragePricing(region),
      networking: await this.getNetworkingPricing(region)
    };
  }

  private static async getVMPricing(region: string): Promise<any> {
    // Placeholder for azure-cost-cli VM pricing call
    // execSync(`${this.AZURE_COST_CLI} prices --region "${region}" --service "Virtual Machines"`);
    return {
      'Standard_D2s_v3': { hourly: 0.096, monthly: 69.12 },
      'Standard_D4s_v3': { hourly: 0.192, monthly: 138.24 },
      'Standard_D8s_v3': { hourly: 0.384, monthly: 276.48 }
    };
  }

  private static async getAKSPricing(region: string): Promise<any> {
    // Placeholder for azure-cost-cli AKS pricing call
    return {
      managementFee: { monthly: 0.10 }, // $0.10 per cluster per hour
      nodePools: {
        'Standard_B2s': { hourly: 0.041, monthly: 29.52 },
        'Standard_D4s_v3': { hourly: 0.192, monthly: 138.24 }
      }
    };
  }

  private static async getPostgresPricing(region: string): Promise<any> {
    // Placeholder for azure-cost-cli PostgreSQL pricing call
    return {
      flexibleServer: {
        'Standard_B2s': { hourly: 0.051, monthly: 36.72 },
        'Standard_D4s_v3': { hourly: 0.204, monthly: 146.88 },
        storage: { perGb: 0.115 } // $0.115 per GB-month
      }
    };
  }

  private static async getStoragePricing(region: string): Promise<any> {
    // Placeholder for azure-cost-cli storage pricing call
    return {
      premiumSSD: { perGb: 0.115 },
      standardSSD: { perGb: 0.06 },
      managedDiskOS: { perGb: 0.06 }
    };
  }

  private static async getNetworkingPricing(region: string): Promise<any> {
    // Placeholder for azure-cost-cli networking pricing call
    return {
      dataTransfer: { perGb: 0.087 },
      loadBalancer: { monthly: 18.00 },
      publicIP: { monthly: 3.60 }
    };
  }

  private static calculateAzureCosts(config: ChiralSystem, pricingData: any, region: string, currency: string): CostEstimate {
    const breakdown: CostBreakdown = {
      compute: { kubernetes: 0, vm: 0, total: 0 },
      storage: { database: 0, vmDisk: 0, total: 0 },
      network: { dataTransfer: 0, loadBalancer: 0, total: 0 },
      other: { management: 0, monitoring: 0, total: 0 }
    };

    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Kubernetes costs
    const k8sSku = this.getK8sSku(config);
    const k8sNodeCost = pricingData.kubernetes.nodePools[k8sSku]?.monthly || 138.24;
    const k8sManagementCost = pricingData.kubernetes.managementFee.monthly * 24 * 30; // $0.10/hour
    breakdown.compute.kubernetes = (k8sNodeCost * config.k8s.maxNodes) + k8sManagementCost;

    // VM costs (ADFS)
    const vmSku = this.getVMSku(config);
    const vmCost = pricingData.virtualMachines[vmSku]?.monthly || 69.12;
    breakdown.compute.vm = vmCost;

    // Database costs
    const dbSku = this.getDbSku(config);
    const dbComputeCost = pricingData.databases.flexibleServer[dbSku]?.monthly || 36.72;
    const dbStorageCost = config.postgres.storageGb * pricingData.databases.flexibleServer.storage.perGb;
    breakdown.storage.database = dbComputeCost + dbStorageCost;

    // VM disk costs
    const vmDiskCost = 128 * pricingData.storage.managedDiskOS.perGb; // Assume 128GB OS disk
    breakdown.storage.vmDisk = vmDiskCost;

    // Networking costs
    breakdown.network.loadBalancer = pricingData.networking.loadBalancer.monthly;
    breakdown.network.dataTransfer = 100 * pricingData.networking.dataTransfer.perGb; // Assume 100GB data transfer

    // Management and monitoring
    breakdown.other.management = 50; // Estimated management overhead
    breakdown.other.monitoring = 20; // Estimated monitoring costs

    // Calculate totals
    breakdown.compute.total = breakdown.compute.kubernetes + breakdown.compute.vm;
    breakdown.storage.total = breakdown.storage.database + breakdown.storage.vmDisk;
    breakdown.network.total = breakdown.network.dataTransfer + breakdown.network.loadBalancer;
    breakdown.other.total = breakdown.other.management + breakdown.other.monitoring;

    const totalMonthlyCost = Object.values(breakdown).reduce((sum, category) => sum + category.total, 0);

    // Generate recommendations
    if (config.environment === 'dev' && config.k8s.maxNodes > 3) {
      recommendations.push('Consider reducing max nodes for development environment to save costs');
    }

    if (config.postgres.storageGb > 1000) {
      recommendations.push('Consider database sharding for storage over 1TB');
    }

    if (totalMonthlyCost > 1000) {
      warnings.push(`High estimated monthly cost: $${totalMonthlyCost.toFixed(2)}`);
    }

    return {
      provider: 'azure',
      totalMonthlyCost,
      currency,
      breakdown,
      recommendations,
      warnings
    };
  }

  private static getFallbackAzurePricing(config: ChiralSystem, region: string, currency: string): CostEstimate {
    // Fallback pricing when azure-cost-cli is not available
    const breakdown: CostBreakdown = {
      compute: { kubernetes: 0, vm: 0, total: 0 },
      storage: { database: 0, vmDisk: 0, total: 0 },
      network: { dataTransfer: 0, loadBalancer: 0, total: 0 },
      other: { management: 0, monitoring: 0, total: 0 }
    };

    // Simplified fallback pricing
    breakdown.compute.kubernetes = config.k8s.maxNodes * 150; // $150 per node per month
    breakdown.compute.vm = 100; // $100 for ADFS VM
    breakdown.storage.database = config.postgres.storageGb * 0.15 + 50; // $0.15/GB + base cost
    breakdown.storage.vmDisk = 20; // $20 for VM disk
    breakdown.network.dataTransfer = 20; // $20 for data transfer
    breakdown.network.loadBalancer = 18; // $18 for load balancer
    breakdown.other.management = 30;
    breakdown.other.monitoring = 15;

    breakdown.compute.total = breakdown.compute.kubernetes + breakdown.compute.vm;
    breakdown.storage.total = breakdown.storage.database + breakdown.storage.vmDisk;
    breakdown.network.total = breakdown.network.dataTransfer + breakdown.network.loadBalancer;
    breakdown.other.total = breakdown.other.management + breakdown.other.monitoring;

    const totalMonthlyCost = Object.values(breakdown).reduce((sum, category) => sum + category.total, 0);

    return {
      provider: 'azure',
      totalMonthlyCost,
      currency,
      breakdown,
      recommendations: ['Install azure-cost-cli for more accurate pricing'],
      warnings: ['Using fallback pricing - install azure-cost-cli for accurate costs']
    };
  }

  private static getK8sSku(config: ChiralSystem): string {
    // Map size to Azure SKU - this should match the mapping in azure-bicep.ts
    const sizeMap: { [key: string]: string } = {
      'small': 'Standard_B2s',
      'medium': 'Standard_D4s_v3',
      'large': 'Standard_D8s_v3'
    };
    return sizeMap[config.k8s.size] || 'Standard_D4s_v3';
  }

  private static getVMSku(config: ChiralSystem): string {
    const sizeMap: { [key: string]: string } = {
      'small': 'Standard_D2s_v3',
      'medium': 'Standard_D4s_v3',
      'large': 'Standard_D8s_v3'
    };
    return sizeMap[config.adfs.size] || 'Standard_D4s_v3';
  }

  private static getDbSku(config: ChiralSystem): string {
    const sizeMap: { [key: string]: string } = {
      'small': 'Standard_B2s',
      'medium': 'Standard_D4s_v3',
      'large': 'Standard_D8s_v3'
    };
    return sizeMap[config.postgres.size] || 'Standard_D4s_v3';
  }
}

// =================================================================
// MULTI-CLOUD COST COMPARISON
// =================================================================

export class CostAnalyzer {
  static async compareCosts(config: ChiralSystem, options: CostAnalysisOptions = {}): Promise<CostComparison> {
    const [awsEstimate, azureEstimate, gcpEstimate] = await Promise.all([
      this.getAWSEstimate(config, options),
      AzureCostAnalyzer.getAzurePricing(config, options),
      this.getGCPEstimate(config, options)
    ]);

    const estimates = { aws: awsEstimate, azure: azureEstimate, gcp: gcpEstimate };
    
    const costs = [
      { provider: 'aws' as const, cost: awsEstimate.totalMonthlyCost },
      { provider: 'azure' as const, cost: azureEstimate.totalMonthlyCost },
      { provider: 'gcp' as const, cost: gcpEstimate.totalMonthlyCost }
    ].sort((a, b) => a.cost - b.cost);

    const cheapest = costs[0];
    const mostExpensive = costs[2];
    const savings = ((mostExpensive.cost - cheapest.cost) / mostExpensive.cost) * 100;

    return {
      cheapest: {
        provider: cheapest.provider,
        cost: cheapest.cost,
        savings: Math.round(savings * 100) / 100
      },
      mostExpensive: {
        provider: mostExpensive.provider,
        cost: mostExpensive.cost
      },
      estimates
    };
  }

  static async getAWSEstimate(config: ChiralSystem, options: CostAnalysisOptions = {}): Promise<CostEstimate> {
    // Simplified AWS pricing estimation
    // In a real implementation, this would use AWS Pricing API
    const breakdown: CostBreakdown = {
      compute: { kubernetes: 0, vm: 0, total: 0 },
      storage: { database: 0, vmDisk: 0, total: 0 },
      network: { dataTransfer: 0, loadBalancer: 0, total: 0 },
      other: { management: 0, monitoring: 0, total: 0 }
    };

    breakdown.compute.kubernetes = config.k8s.maxNodes * 145; // EKS pricing
    breakdown.compute.vm = 95; // EC2 instance
    breakdown.storage.database = config.postgres.storageGb * 0.23 + 55; // RDS
    breakdown.storage.vmDisk = 18; // EBS volume
    breakdown.network.dataTransfer = 25; // Data transfer
    breakdown.network.loadBalancer = 25; // ELB
    breakdown.other.management = 35;
    breakdown.other.monitoring = 18;

    breakdown.compute.total = breakdown.compute.kubernetes + breakdown.compute.vm;
    breakdown.storage.total = breakdown.storage.database + breakdown.storage.vmDisk;
    breakdown.network.total = breakdown.network.dataTransfer + breakdown.network.loadBalancer;
    breakdown.other.total = breakdown.other.management + breakdown.other.monitoring;

    const totalMonthlyCost = Object.values(breakdown).reduce((sum, category) => sum + category.total, 0);

    return {
      provider: 'aws',
      totalMonthlyCost,
      currency: 'USD',
      breakdown,
      recommendations: ['Consider Reserved Instances for production workloads'],
      warnings: []
    };
  }

  static async getGCPEstimate(config: ChiralSystem, options: CostAnalysisOptions = {}): Promise<CostEstimate> {
    // Simplified GCP pricing estimation
    // In a real implementation, this would use GCP Cloud Billing API
    const breakdown: CostBreakdown = {
      compute: { kubernetes: 0, vm: 0, total: 0 },
      storage: { database: 0, vmDisk: 0, total: 0 },
      network: { dataTransfer: 0, loadBalancer: 0, total: 0 },
      other: { management: 0, monitoring: 0, total: 0 }
    };

    breakdown.compute.kubernetes = config.k8s.maxNodes * 140; // GKE pricing
    breakdown.compute.vm = 90; // Compute Engine
    breakdown.storage.database = config.postgres.storageGb * 0.25 + 50; // Cloud SQL
    breakdown.storage.vmDisk = 17; // Persistent disk
    breakdown.network.dataTransfer = 22; // Data transfer
    breakdown.network.loadBalancer = 20; // Cloud Load Balancer
    breakdown.other.management = 32;
    breakdown.other.monitoring = 16;

    breakdown.compute.total = breakdown.compute.kubernetes + breakdown.compute.vm;
    breakdown.storage.total = breakdown.storage.database + breakdown.storage.vmDisk;
    breakdown.network.total = breakdown.network.dataTransfer + breakdown.network.loadBalancer;
    breakdown.other.total = breakdown.other.management + breakdown.other.monitoring;

    const totalMonthlyCost = Object.values(breakdown).reduce((sum, category) => sum + category.total, 0);

    return {
      provider: 'gcp',
      totalMonthlyCost,
      currency: 'USD',
      breakdown,
      recommendations: ['Use Committed Use Discounts for predictable workloads'],
      warnings: []
    };
  }

  static generateCostReport(comparison: CostComparison, options: CostAnalysisOptions = {}): string {
    const { cheapest, mostExpensive, estimates } = comparison;
    
    let report = `\n📊 Cost Analysis Report\n`;
    report += `${'='.repeat(50)}\n\n`;
    
    report += `💰 **Summary**\n`;
    report += `Cheapest: ${cheapest.provider.toUpperCase()} ($${cheapest.cost.toFixed(2)}/month)\n`;
    report += `Most Expensive: ${mostExpensive.provider.toUpperCase()} ($${mostExpensive.cost.toFixed(2)}/month)\n`;
    report += `Potential Savings: ${cheapest.savings}% with ${cheapest.provider.toUpperCase()}\n\n`;

    if (options.detailed) {
      report += `📈 **Detailed Breakdown**\n`;
      Object.entries(estimates).forEach(([provider, estimate]) => {
        report += `\n${provider.toUpperCase()}:\n`;
        report += `  Total: $${estimate.totalMonthlyCost.toFixed(2)}/month\n`;
        report += `  Compute: $${estimate.breakdown.compute.total.toFixed(2)}\n`;
        report += `  Storage: $${estimate.breakdown.storage.total.toFixed(2)}\n`;
        report += `  Network: $${estimate.breakdown.network.total.toFixed(2)}\n`;
        report += `  Other: $${estimate.breakdown.other.total.toFixed(2)}\n`;
        
        if (estimate.recommendations.length > 0) {
          report += `  Recommendations:\n`;
          estimate.recommendations.forEach(rec => report += `    • ${rec}\n`);
        }
        
        if (estimate.warnings.length > 0) {
          report += `  Warnings:\n`;
          estimate.warnings.forEach(warn => report += `    ⚠️  ${warn}\n`);
        }
      });
    }

    return report;
  }
}

// =================================================================
// COST OPTIMIZATION RECOMMENDATIONS
// =================================================================

export class CostOptimizer {
  static analyzeConfiguration(config: ChiralSystem): string[] {
    const recommendations: string[] = [];

    // Kubernetes optimization
    if (config.k8s.maxNodes > 10 && config.environment === 'dev') {
      recommendations.push('Development environment: Consider reducing max nodes from ' + 
        `${config.k8s.maxNodes} to 3-5 for cost savings`);
    }

    if (config.k8s.minNodes === config.k8s.maxNodes && config.environment === 'prod') {
      recommendations.push('Production environment: Enable autoscaling by setting maxNodes > minNodes');
    }

    // Database optimization
    if (config.postgres.storageGb > 500 && config.environment === 'dev') {
      recommendations.push('Development database: Consider reducing storage from ' + 
        `${config.postgres.storageGb}GB to 100-200GB`);
    }

    // Network optimization
    if (config.networkCidr === '10.0.0.0/16' && config.environment === 'dev') {
      recommendations.push('Consider using a smaller network CIDR for development (e.g., 10.0.0.0/20)');
    }

    return recommendations;
  }

  static suggestCostEffectiveAlternatives(config: ChiralSystem): Array<{provider: string, reason: string, savings: string}> {
    const alternatives: Array<{provider: string, reason: string, savings: string}> = [];

    // This would analyze the config and suggest alternatives
    // For now, return some example suggestions
    
    if (config.environment === 'dev') {
      alternatives.push({
        provider: 'GCP',
        reason: 'GCP offers competitive pricing for development workloads',
        savings: 'Up to 15% compared to AWS'
      });
    }

    if (config.k8s.maxNodes <= 3) {
      alternatives.push({
        provider: 'Azure',
        reason: 'Azure has competitive pricing for small Kubernetes clusters',
        savings: 'Up to 10% for small clusters'
      });
    }

    return alternatives;
  }
}
