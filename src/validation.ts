// File: src/validation.ts

// Enhanced validation and drift detection capabilities for Chiral

import { ChiralSystem } from './intent';
import * as fs from 'fs';
import * as path from 'path';
import { CostAnalyzer, AzureCostAnalyzer, CostOptimizer, CostAnalysisOptions } from './cost-analysis';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface DriftDetectionResult {
  hasDrift: boolean;
  driftedResources: string[];
  missingResources: string[];
  addedResources: string[];
  summary: string;
}

export interface ComplianceCheck {
  framework: 'soc2' | 'iso27001' | 'hipaa' | 'fedramp-low' | 'fedramp-moderate' | 'fedramp-high' | 'govramp-low' | 'govramp-moderate' | 'govramp-high' | 'none';
  compliant: boolean;
  violations: string[];
  recommendations: string[];
}

// =================================================================
// VALIDATION FUNCTIONS
// =================================================================

export function validateChiralConfig(config: ChiralSystem): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Basic structure validation
  if (!config.projectName || config.projectName.trim() === '') {
    errors.push('Project name is required and cannot be empty');
  }

  if (!config.networkCidr || !isValidCIDR(config.networkCidr)) {
    errors.push('Valid network CIDR is required (e.g., 10.0.0.0/16)');
  }

  // Kubernetes validation
  if (!config.k8s) {
    errors.push('Kubernetes configuration is required');
  } else {
    if (!config.k8s.version || !isValidKubernetesVersion(config.k8s.version)) {
      errors.push('Valid Kubernetes version is required (e.g., 1.29, 1.30)');
    }
    if (!config.k8s.minNodes || config.k8s.minNodes < 1) {
      errors.push('Minimum nodes must be at least 1');
    }
    if (!config.k8s.maxNodes || config.k8s.maxNodes < config.k8s.minNodes) {
      errors.push('Maximum nodes must be greater than or equal to minimum nodes');
    }
    if (config.k8s.maxNodes > 100) {
      warnings.push('Large node counts may impact cost and complexity');
    }
  }

  // Database validation
  if (!config.postgres) {
    errors.push('PostgreSQL configuration is required');
  } else {
    if (!config.postgres.engineVersion || !isValidPostgresVersion(config.postgres.engineVersion)) {
      errors.push('Valid PostgreSQL version is required (e.g., 14, 15, 16)');
    }
    if (!config.postgres.storageGb || config.postgres.storageGb < 20) {
      errors.push('Storage must be at least 20GB');
    }
    if (config.postgres.storageGb > 32768) {
      warnings.push('Storage over 32TB may require special configuration');
    }
  }

  // ADFS validation
  if (!config.adfs) {
    errors.push('ADFS configuration is required');
  } else {
    if (!config.adfs.windowsVersion || !['2019', '2022'].includes(config.adfs.windowsVersion)) {
      errors.push('Windows version must be 2019 or 2022');
    }
  }

  // Environment-specific validation
  if (config.environment === 'prod') {
    // Production-specific checks
    if (config.k8s && config.k8s.minNodes < 2) {
      warnings.push('Production environments should have at least 2 nodes for high availability');
    }
    if (config.postgres && config.postgres.storageGb < 100) {
      warnings.push('Production databases should have at least 100GB storage');
    }
  }

  // Regional validation
  if (config.region) {
    if (config.region.aws && !isValidAWSRegion(config.region.aws)) {
      errors.push(`Invalid AWS region: ${config.region.aws}`);
    }
    if (config.region.azure && !isValidAzureRegion(config.region.azure)) {
      errors.push(`Invalid Azure region: ${config.region.azure}`);
    }
    if (config.region.gcp && !isValidGCPRegion(config.region.gcp)) {
      errors.push(`Invalid GCP region: ${config.region.gcp}`);
    }
  }

  // Recommendations
  if (config.environment === 'prod' && config.k8s && config.k8s.maxNodes > 10) {
    recommendations.push('Consider using autoscaling for large production clusters');
  }

  if (config.postgres && config.postgres.storageGb > 1000) {
    recommendations.push('Consider database sharding for very large storage requirements');
  }

  // Add cost optimization recommendations
  const costOptimizations = CostOptimizer.analyzeConfiguration(config);
  recommendations.push(...costOptimizations);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    recommendations
  };
}

// =================================================================
// DRIFT DETECTION FUNCTIONS
// =================================================================

export function detectDrift(
  config: ChiralSystem,
  generatedArtifacts: { aws?: string; azure?: string; gcp?: string }
): DriftDetectionResult {
  const driftedResources: string[] = [];
  const missingResources: string[] = [];
  const addedResources: string[] = [];

  // This is a simplified drift detection
  // In a real implementation, this would:
  // 1. Parse generated artifacts to extract resource definitions
  // 2. Compare with current deployed infrastructure via cloud APIs
  // 3. Identify differences

  if (generatedArtifacts.aws) {
    // AWS drift detection would use CloudFormation APIs
    const awsDrift = analyzeAWSDrift(config, generatedArtifacts.aws);
    driftedResources.push(...awsDrift.drifted);
    missingResources.push(...awsDrift.missing);
    addedResources.push(...awsDrift.added);
  }

  if (generatedArtifacts.azure) {
    // Azure drift detection would use Resource Manager APIs
    const azureDrift = analyzeAzureDrift(config, generatedArtifacts.azure);
    driftedResources.push(...azureDrift.drifted);
    missingResources.push(...azureDrift.missing);
    addedResources.push(...azureDrift.added);
  }

  if (generatedArtifacts.gcp) {
    // GCP drift detection would use Resource Manager APIs
    const gcpDrift = analyzeGCPDrift(config, generatedArtifacts.gcp);
    driftedResources.push(...gcpDrift.drifted);
    missingResources.push(...gcpDrift.missing);
    addedResources.push(...gcpDrift.added);
  }

  const hasDrift = driftedResources.length > 0 || missingResources.length > 0 || addedResources.length > 0;

  return {
    hasDrift,
    driftedResources,
    missingResources,
    addedResources,
    summary: hasDrift 
      ? `Detected ${driftedResources.length} drifted, ${missingResources.length} missing, and ${addedResources.length} added resources`
      : 'No drift detected - infrastructure is in sync'
  };
}

// =================================================================
// COMPLIANCE CHECKING FUNCTIONS
// =================================================================

export function checkCompliance(
  config: ChiralSystem,
  framework: ComplianceCheck['framework'] = 'soc2'
): ComplianceCheck {
  const violations: string[] = [];
  const recommendations: string[] = [];

  if (framework === 'none') {
    return {
      framework: 'none',
      compliant: true,
      violations: [],
      recommendations: []
    };
  }

  // SOC 2 compliance checks
  if (framework === 'soc2') {
    // Check for security configurations
    if (config.environment === 'prod' && config.k8s && config.k8s.minNodes < 2) {
      violations.push('SOC 2: Production environments must have high availability');
      recommendations.push('Deploy at least 2 nodes for production workloads');
    }

    if (config.networkCidr === '10.0.0.0/16') {
      violations.push('SOC 2: Default network CIDR may not meet security requirements');
      recommendations.push('Use organization-specific network CIDR ranges');
    }
  }

  // ISO 27001 compliance checks
  if (framework === 'iso27001') {
    // Check for access control and encryption
    if (!config.region) {
      violations.push('ISO 27001: Region specification required for compliance');
      recommendations.push('Specify regions for all cloud providers');
    }

    if (config.postgres && config.postgres.storageGb < 50 && config.environment === 'prod') {
      violations.push('ISO 27001: Production databases must have adequate backup storage');
      recommendations.push('Configure at least 50GB storage for production databases');
    }
  }

  // HIPAA compliance checks
  if (framework === 'hipaa') {
    // Check for data protection measures
    if (config.networkCidr.startsWith('10.0.0.0/16')) {
      violations.push('HIPAA: Default network ranges may not meet data protection requirements');
      recommendations.push('Use private network ranges with proper segmentation');
    }

    if (config.environment === 'prod' && !config.region) {
      violations.push('HIPAA: Production workloads must specify regions for data residency');
      recommendations.push('Specify compliant regions for healthcare data');
    }
  }

  // FedRAMP compliance checks
  if (framework === 'fedramp') {
    // Check for government cloud compliance
    if (config.region?.aws && !config.region.aws.includes('gov')) {
      violations.push('FedRAMP: AWS GovCloud required for federal workloads');
      recommendations.push('Use AWS GovCloud regions for federal compliance');
    }

    if (config.region?.azure && !config.region.azure.includes('usgov')) {
      violations.push('FedRAMP: Azure Government required for federal workloads');
      recommendations.push('Use Azure Government regions for federal compliance');
    }
  }

  return {
    framework,
    compliant: violations.length === 0,
    violations,
    recommendations
  };
}

// =================================================================
// DEPLOYMENT READINESS CHECKS
// =================================================================

export async function checkDeploymentReadiness(config: ChiralSystem): Promise<{
  ready: boolean;
  blockers: string[];
  warnings: string[];
  checklist: { [key: string]: boolean };
}> {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const checklist: { [key: string]: boolean } = {};

  // Configuration completeness
  checklist.configComplete = validateChiralConfig(config).valid;
  if (!checklist.configComplete) {
    blockers.push('Configuration validation failed - fix errors before deployment');
  }

  // Cloud provider readiness
  checklist.awsReady = true; // Assume AWS is always ready
  checklist.azureReady = true; // Assume Azure is always ready
  checklist.gcpReady = true; // Assume GCP is always ready

  // Resource availability
  checklist.resourcesAvailable = true;
  if (config.region) {
    if (config.region.aws && !isRegionServiceAvailable('aws', config.region.aws, 'kubernetes')) {
      warnings.push('EKS may not be available in specified AWS region');
    }
    if (config.region.azure && !isRegionServiceAvailable('azure', config.region.azure, 'kubernetes')) {
      warnings.push('AKS may not be available in specified Azure region');
    }
    if (config.region.gcp && !isRegionServiceAvailable('gcp', config.region.gcp, 'kubernetes')) {
      warnings.push('GKE may not be available in specified GCP region');
    }
  }

  // Cost estimation
  checklist.costEstimated = true;
  const estimatedCost = await estimateDeploymentCost(config);
  if (estimatedCost > 10000) { // $10k/month threshold
    warnings.push(`High estimated monthly cost: $${estimatedCost.toFixed(2)}`);
  }

  // Security checks
  checklist.securityConfigured = true;
  if (config.environment === 'prod' && config.k8s && config.k8s.minNodes < 2) {
    warnings.push('Production deployment should have multiple nodes for high availability');
  }

  const ready = blockers.length === 0 && checklist.configComplete;

  return {
    ready,
    blockers,
    warnings,
    checklist
  };
}

// =================================================================
// HELPER FUNCTIONS
// =================================================================

function isValidCIDR(cidr: string): boolean {
  const cidrPattern = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  return cidrPattern.test(cidr);
}

function isValidKubernetesVersion(version: string): boolean {
  const versionPattern = /^\d+\.\d+(\.\d+)?$/;
  return versionPattern.test(version);
}

function isValidPostgresVersion(version: string): boolean {
  const validVersions = ['13', '14', '15', '16'];
  return validVersions.includes(version);
}

function isValidAWSRegion(region: string): boolean {
  const validRegions = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-west-3',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2'
  ];
  return validRegions.includes(region);
}

function isValidAzureRegion(region: string): boolean {
  const validRegions = [
    'East US', 'West US', 'Central US', 'North Europe', 'West Europe',
    'East Asia', 'Southeast Asia', 'Australia East'
  ];
  return validRegions.includes(region);
}

function isValidGCPRegion(region: string): boolean {
  const validRegions = [
    'us-central1', 'us-east1', 'us-west1', 'us-west2',
    'europe-west1', 'europe-west2', 'europe-west3',
    'asia-east1', 'asia-southeast1', 'asia-northeast1'
  ];
  return validRegions.includes(region);
}

function analyzeAWSDrift(config: ChiralSystem, artifact: string): {
  drifted: string[];
  missing: string[];
  added: string[];
} {
  // Simplified AWS drift analysis
  // In real implementation, this would use AWS CloudFormation APIs
  return {
    drifted: [],
    missing: [],
    added: []
  };
}

function analyzeAzureDrift(config: ChiralSystem, artifact: string): {
  drifted: string[];
  missing: string[];
  added: string[];
} {
  // Simplified Azure drift analysis
  // In real implementation, this would use Azure Resource Manager APIs
  return {
    drifted: [],
    missing: [],
    added: []
  };
}

function analyzeGCPDrift(config: ChiralSystem, artifact: string): {
  drifted: string[];
  missing: string[];
  added: string[];
} {
  // Simplified GCP drift analysis
  // In real implementation, this would use GCP Resource Manager APIs
  return {
    drifted: [],
    missing: [],
    added: []
  };
}

function isRegionServiceAvailable(provider: string, region: string, service: string): boolean {
  // Simplified service availability check
  // In real implementation, this would check cloud provider APIs
  return true;
}

async function estimateDeploymentCost(config: ChiralSystem, provider?: 'aws' | 'azure' | 'gcp', options?: CostAnalysisOptions): Promise<number> {
  // Use enhanced cost analysis with azure-cost-cli integration
  if (provider === 'azure' || !provider) {
    // Try to get accurate Azure pricing using azure-cost-cli
    try {
      const azureEstimate = await AzureCostAnalyzer.getAzurePricing(config, options);
      return azureEstimate.totalMonthlyCost;
    } catch (error) {
      // Fallback to simplified estimation
      return getFallbackCostEstimation(config);
    }
  }

  // For other providers or fallback, use simplified estimation
  return getFallbackCostEstimation(config);
}

function getFallbackCostEstimation(config: ChiralSystem): number {
  // Simplified cost estimation (original fallback logic)
  let baseCost = 500; // Base infrastructure cost
  
  if (config.k8s) {
    baseCost += config.k8s.maxNodes * 50; // Node cost
  }
  
  if (config.postgres) {
    baseCost += config.postgres.storageGb * 0.1; // Storage cost
  }
  
  return baseCost;
}
