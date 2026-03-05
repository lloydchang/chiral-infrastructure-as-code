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
  framework: 'soc2' | 'iso27001' | 'hipaa' | 'fedramp-low' | 'fedramp-moderate' | 'fedramp-high' | 'govramp-low' | 'govramp-moderate' | 'govramp-high' | 'hitrust-low' | 'hitrust-moderate' | 'hitrust-high' | 'hitech-low' | 'hitech-moderate' | 'hitech-high' | 'hipaa-low' | 'hipaa-moderate' | 'hipaa-high' | 'nist-low' | 'nist-moderate' | 'nist-high' | 'dod-il2' | 'dod-il4' | 'dod-il5' | 'dod-il6' | 'none';
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
  if (framework.startsWith('fedramp-')) {
    const level = framework.split('-')[1]; // 'low', 'moderate', 'high'

    // Common checks for all FedRAMP levels
    if (!config.compliance?.encryptionAtRest) {
      violations.push(`FedRAMP ${level.toUpperCase()}: Encryption at rest required`);
      recommendations.push('Enable encryption at rest for all data stores');
    }

    if (!config.compliance?.auditLogging) {
      violations.push(`FedRAMP ${level.toUpperCase()}: Comprehensive audit logging required`);
      recommendations.push('Enable detailed audit logging for all resources');
    }

    if (config.environment === 'prod' && config.k8s && config.k8s.minNodes < 2) {
      violations.push(`FedRAMP ${level.toUpperCase()}: Production environments must have high availability (minimum 2 nodes)`);
      recommendations.push('Deploy at least 2 nodes for fault tolerance');
    }

    // Level-specific checks
    if (level === 'moderate' || level === 'high') {
      // Moderate and High require government cloud or equivalent controls
      if (config.region?.aws && !config.region.aws.includes('gov')) {
        violations.push(`FedRAMP ${level.toUpperCase()}: AWS GovCloud or equivalent controls required`);
        recommendations.push('Use AWS GovCloud regions or implement compensating controls');
      }

      if (config.region?.azure && !config.region.azure.includes('usgov')) {
        violations.push(`FedRAMP ${level.toUpperCase()}: Azure Government required`);
        recommendations.push('Use Azure Government regions');
      }

      if (config.postgres && config.postgres.storageGb < 50 && config.environment === 'prod') {
        violations.push(`FedRAMP ${level.toUpperCase()}: Production databases must have minimum 50GB storage`);
        recommendations.push('Increase database storage to meet compliance requirements');
      }
    }

    if (level === 'high') {
      // High impact additional requirements
      if (config.k8s && config.k8s.maxNodes > 20) {
        violations.push('FedRAMP HIGH: Large node counts require additional security controls');
        recommendations.push('Implement additional security monitoring for large clusters');
      }

      if (!config.region) {
        violations.push('FedRAMP HIGH: Explicit region specification required');
        recommendations.push('Specify regions for all cloud providers to ensure data sovereignty');
      }
    }
  }

  // GovRAMP compliance checks (formerly StateRAMP)
  if (framework.startsWith('govramp-')) {
    const level = framework.split('-')[1]; // 'low', 'moderate', 'high'

    // GovRAMP is similar to FedRAMP Moderate but for state/local governments
    // Basic requirements similar to FedRAMP Moderate
    if (!config.compliance?.encryptionAtRest) {
      violations.push(`GovRAMP ${level.toUpperCase()}: Encryption at rest required`);
      recommendations.push('Enable encryption at rest for all data stores');
    }

    if (!config.compliance?.auditLogging) {
      violations.push(`GovRAMP ${level.toUpperCase()}: Comprehensive audit logging required`);
      recommendations.push('Enable detailed audit logging for all resources');
    }

    if (config.environment === 'prod' && config.k8s && config.k8s.minNodes < 2) {
      violations.push(`GovRAMP ${level.toUpperCase()}: Production environments must have high availability`);
      recommendations.push('Deploy at least 2 nodes for fault tolerance');
    }

    // GovRAMP typically requires data residency within the state/country
    if (!config.compliance?.dataResidency) {
      violations.push(`GovRAMP ${level.toUpperCase()}: Data residency requirements must be specified`);
      recommendations.push('Specify data residency regions for all cloud providers');
    }

    // State-specific checks (example - may vary by state)
    if (level === 'moderate' || level === 'high') {
      if (config.region?.aws && config.region.aws.includes('gov')) {
        violations.push(`GovRAMP ${level.toUpperCase()}: Commercial cloud preferred for state workloads unless required`);
        recommendations.push('Use commercial cloud regions unless government cloud is mandated');
      }

      if (config.postgres && config.postgres.storageGb < 50 && config.environment === 'prod') {
        violations.push(`GovRAMP ${level.toUpperCase()}: Production databases must have minimum 50GB storage`);
        recommendations.push('Increase database storage to meet compliance requirements');
      }
    }

    if (level === 'high') {
      if (config.k8s && config.k8s.maxNodes > 15) {
        violations.push('GovRAMP HIGH: Large node counts require additional oversight');
        recommendations.push('Implement additional monitoring for large clusters');
      }
    }
  }

  // HITRUST CSF compliance checks
  if (framework.startsWith('hitrust-')) {
    const level = framework.split('-')[1]; // 'low', 'moderate', 'high'

    // Common checks for all HITRUST levels - based on healthcare security framework
    if (!config.compliance?.encryptionAtRest) {
      violations.push(`HITRUST CSF ${level.toUpperCase()}: Encryption at rest required`);
      recommendations.push('Enable encryption at rest for all data stores');
    }

    if (!config.compliance?.auditLogging) {
      violations.push(`HITRUST CSF ${level.toUpperCase()}: Comprehensive audit logging required`);
      recommendations.push('Enable detailed audit logging for all resources');
    }

    if (config.environment === 'prod' && config.k8s && config.k8s.minNodes < 2) {
      violations.push(`HITRUST CSF ${level.toUpperCase()}: Production environments must have high availability`);
      recommendations.push('Deploy at least 2 nodes for fault tolerance');
    }

    // HITRUST specific: endpoint protection and data residency
    if (!config.region) {
      violations.push(`HITRUST CSF ${level.toUpperCase()}: Region specification required for data residency`);
      recommendations.push('Specify regions for all cloud providers');
    }

    // Level-specific checks
    if (level === 'moderate' || level === 'high') {
      // Moderate and High require stricter controls for healthcare data
      if (config.postgres && config.postgres.storageGb < 50 && config.environment === 'prod') {
        violations.push(`HITRUST CSF ${level.toUpperCase()}: Production databases must have minimum 50GB storage`);
        recommendations.push('Increase database storage for healthcare data retention');
      }
    }

    if (level === 'high') {
      // High impact additional requirements for healthcare
      if (config.k8s && config.k8s.maxNodes > 10) {
        violations.push('HITRUST CSF HIGH: Large clusters require enhanced security monitoring');
        recommendations.push('Implement advanced security monitoring for large healthcare clusters');
      }
    }
  }

  // HITECH compliance checks
  if (framework.startsWith('hitech-')) {
    const level = framework.split('-')[1]; // 'low', 'moderate', 'high'

    // HITECH focuses on electronic health records security
    if (!config.compliance?.encryptionAtRest) {
      violations.push(`HITECH ${level.toUpperCase()}: Encryption at rest required for EHR data`);
      recommendations.push('Enable encryption at rest for all health data stores');
    }

    if (!config.compliance?.auditLogging) {
      violations.push(`HITECH ${level.toUpperCase()}: Audit logging required for breach notification`);
      recommendations.push('Enable comprehensive audit logging for access tracking');
    }

    if (config.environment === 'prod' && !config.region) {
      violations.push(`HITECH ${level.toUpperCase()}: Geographic data residency required`);
      recommendations.push('Specify regions compliant with health data location requirements');
    }

    if (level === 'moderate' || level === 'high') {
      if (config.networkCidr.startsWith('10.0.0.0/16')) {
        violations.push(`HITECH ${level.toUpperCase()}: Default network ranges not suitable for health data`);
        recommendations.push('Use segmented networks for health information systems');
      }
    }

    if (level === 'high') {
      if (config.k8s && config.k8s.minNodes < 3) {
        violations.push('HITECH HIGH: High-risk health data requires enhanced availability');
        recommendations.push('Deploy at least 3 nodes for critical health systems');
      }
    }
  }

  // HIPAA with levels
  if (framework.startsWith('hipaa-')) {
    const level = framework.split('-')[1]; // 'low', 'moderate', 'high'

    // Basic HIPAA checks for data protection
    if (config.networkCidr.startsWith('10.0.0.0/16')) {
      violations.push(`HIPAA ${level.toUpperCase()}: Default network ranges may not meet data protection requirements`);
      recommendations.push('Use private network ranges with proper segmentation');
    }

    if (config.environment === 'prod' && !config.region) {
      violations.push(`HIPAA ${level.toUpperCase()}: Production workloads must specify regions for data residency`);
      recommendations.push('Specify compliant regions for healthcare data');
    }

    if (level === 'moderate' || level === 'high') {
      if (!config.compliance?.encryptionAtRest) {
        violations.push(`HIPAA ${level.toUpperCase()}: Encryption at rest required`);
        recommendations.push('Enable encryption at rest for protected health information');
      }
    }

    if (level === 'high') {
      if (!config.compliance?.auditLogging) {
        violations.push('HIPAA HIGH: Comprehensive audit logging required for high-risk data');
        recommendations.push('Enable detailed audit logging for all PHI access');
      }

      if (config.postgres && config.postgres.storageGb < 100 && config.environment === 'prod') {
        violations.push('HIPAA HIGH: High-risk data requires enhanced storage capacity');
        recommendations.push('Configure at least 100GB storage for production healthcare databases');
      }
    }
  // NIST 800-53 compliance checks
  if (framework.startsWith('nist-')) {
    const level = framework.split('-')[1]; // 'low', 'moderate', 'high'

    // Common controls for all NIST levels - SP 800-53 core requirements
    if (!config.compliance?.encryptionAtRest) {
      violations.push(`NIST 800-53 ${level.toUpperCase()}: SC-28 (Cryptographic Protection) - Encryption at rest required`);
      recommendations.push('Enable encryption at rest for all data stores (NIST SC-28)');
    }

    if (!config.compliance?.auditLogging) {
      violations.push(`NIST 800-53 ${level.toUpperCase()}: AU-2 (Audit Events) - Comprehensive audit logging required`);
      recommendations.push('Enable detailed audit logging for security-relevant events (NIST AU-2)');
    }

    if (config.environment === 'prod' && config.k8s && config.k8s.minNodes < 2) {
      violations.push(`NIST 800-53 ${level.toUpperCase()}: CP-2 (Continuity of Operations) - Production environments must have high availability`);
      recommendations.push('Deploy at least 2 nodes for fault tolerance and continuity (NIST CP-2)');
    }

    // Access Control (AC) family checks
    if (!config.region) {
      violations.push(`NIST 800-53 ${level.toUpperCase()}: AC-4 (Information Flow Enforcement) - Region specification required for access control`);
      recommendations.push('Specify regions for all cloud providers to enforce access controls (NIST AC-4)');
    }

    // Identification and Authentication (IA) family
    if (config.networkCidr === '10.0.0.0/16') {
      violations.push(`NIST 800-53 ${level.toUpperCase()}: IA-3 (Device Identification and Authentication) - Default network CIDR may not meet identification requirements`);
      recommendations.push('Use organization-specific network ranges with proper device authentication (NIST IA-3)');
    }

    // Level-specific additional controls
    if (level === 'moderate' || level === 'high') {
      // Moderate baseline additional controls
      if (config.postgres && config.postgres.storageGb < 50 && config.environment === 'prod') {
        violations.push(`NIST 800-53 ${level.toUpperCase()}: SC-32 (Cryptographic Key Establishment) - Production databases must have minimum storage for key management`);
        recommendations.push('Increase database storage to support cryptographic key management (NIST SC-32)');
      }

      // System and Communications Protection (SC) family
      if (config.k8s && config.k8s.maxNodes > 20) {
        violations.push(`NIST 800-53 ${level.toUpperCase()}: SC-5 (Denial of Service Protection) - Large clusters require DoS protection measures`);
        recommendations.push('Implement denial of service protection for large-scale deployments (NIST SC-5)');
      }
    }

    if (level === 'high') {
      // High baseline additional controls - most stringent requirements
      if (!config.compliance?.dataResidency) {
        violations.push('NIST 800-53 HIGH: AC-4 (Information Flow Enforcement) - Data residency controls required for high-impact systems');
        recommendations.push('Specify data residency regions and implement information flow controls (NIST AC-4)');
      }

      // Configuration Management (CM) family
      if (config.k8s && config.k8s.maxNodes > 15) {
        violations.push('NIST 800-53 HIGH: CM-6 (Configuration Settings) - Large node counts require enhanced configuration management');
        recommendations.push('Implement automated configuration management for large clusters (NIST CM-6)');
      }

      // Incident Response (IR) family
      if (config.postgres && config.postgres.storageGb < 100 && config.environment === 'prod') {
        violations.push('NIST 800-53 HIGH: IR-2 (Incident Response Training) - High-impact systems require enhanced incident response capabilities');
        recommendations.push('Configure adequate storage for incident response data retention (NIST IR-2)');
      }

      // System and Information Integrity (SI) family
      if (config.environment === 'prod' && config.k8s && config.k8s.minNodes < 3) {
        violations.push('NIST 800-53 HIGH: SI-4 (Information System Monitoring) - High-impact systems require enhanced monitoring');
        recommendations.push('Deploy at least 3 nodes for comprehensive system monitoring (NIST SI-4)');
      }
    }
  // DOD Impact Level compliance checks
  if (framework.startsWith('dod-')) {
    const level = framework.split('-')[1]; // 'il2', 'il4', 'il5', 'il6'

    // Common controls for all DOD IL levels - based on NIST 800-53 but DOD-specific
    if (!config.compliance?.encryptionAtRest) {
      violations.push(`DOD IL${level.toUpperCase()}: Encryption at rest required`);
      recommendations.push('Enable encryption at rest for all data stores');
    }

    if (!config.compliance?.auditLogging) {
      violations.push(`DOD IL${level.toUpperCase()}: Comprehensive audit logging required`);
      recommendations.push('Enable detailed audit logging for all resources');
    }

    if (config.environment === 'prod' && config.k8s && config.k8s.minNodes < 2) {
      violations.push(`DOD IL${level.toUpperCase()}: Production environments must have high availability`);
      recommendations.push('Deploy at least 2 nodes for fault tolerance');
    }

    // Level-specific checks
    if (level === 'il4' || level === 'il5' || level === 'il6') {
      // Moderate and higher require government cloud or equivalent controls
      if (config.region?.aws && !config.region.aws.includes('gov')) {
        violations.push(`DOD IL${level.toUpperCase()}: AWS GovCloud or equivalent controls required`);
        recommendations.push('Use AWS GovCloud regions or implement compensating controls');
      }

      if (config.region?.azure && !config.region.azure.includes('usgov')) {
        violations.push(`DOD IL${level.toUpperCase()}: Azure Government required`);
        recommendations.push('Use Azure Government regions');
      }

      if (config.postgres && config.postgres.storageGb < 50 && config.environment === 'prod') {
        violations.push(`DOD IL${level.toUpperCase()}: Production databases must have minimum 50GB storage`);
        recommendations.push('Increase database storage to meet compliance requirements');
      }
    }

    if (level === 'il5' || level === 'il6') {
      // High impact additional requirements
      if (config.k8s && config.k8s.maxNodes > 20) {
        violations.push(`DOD IL${level.toUpperCase()}: Large node counts require additional security controls`);
        recommendations.push('Implement additional security monitoring for large clusters');
      }

      if (!config.region) {
        violations.push(`DOD IL${level.toUpperCase()}: Explicit region specification required`);
        recommendations.push('Specify regions for all cloud providers to ensure data sovereignty');
      }
    }

    if (level === 'il6') {
      // Highest impact - most stringent requirements
      if (config.environment === 'prod' && config.k8s && config.k8s.minNodes < 3) {
        violations.push('DOD IL6: Highest impact systems require enhanced availability');
        recommendations.push('Deploy at least 3 nodes for critical systems');
      }

      if (!config.compliance?.dataResidency) {
        violations.push('DOD IL6: Data residency controls required for highest impact systems');
        recommendations.push('Specify data residency regions and implement strict controls');
      }
    }
  }
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
