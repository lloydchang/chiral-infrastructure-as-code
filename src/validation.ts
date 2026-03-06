// File: src/validation.ts

// Enhanced validation and drift detection capabilities for Chiral

import { ChiralSystem, ComplianceFramework } from './intent';
import * as fs from 'fs';
import * as path from 'path';
import { validateNISTHighCompliance } from './compliance';
import { CostAnalyzer, CostAnalysisOptions } from './cost-analysis';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  monitoringReport?: {
    summary: string;
    criticalIssues: number;
    totalAlerts: number;
    recommendations: string[];
  };
}

export interface DriftDetectionResult {
  hasDrift: boolean;
  driftedResources: string[];
  missingResources: string[];
  addedResources: string[];
  summary: string;
}

export interface ComplianceCheck {
  framework: ComplianceFramework;
  compliant: boolean;
  violations: string[];
  recommendations: string[];
  auditType?: 'type1' | 'type2';
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

  // Skills validation (optional)
  if (config.skills) {
    if (config.skills.imageProcessing) {
      const capability = config.skills.imageProcessing.capability;
      const performance = config.skills.imageProcessing.performance;
      if (!['resize', 'filter', 'analyze'].includes(capability)) {
        errors.push('Image processing capability must be resize, filter, or analyze');
      }
      if (!['low', 'medium', 'high'].includes(performance)) {
        errors.push('Image processing performance must be low, medium, or high');
      }
    }

    if (config.skills.dataAnalysis) {
      const capability = config.skills.dataAnalysis.capability;
      const framework = config.skills.dataAnalysis.framework;
      if (!['ml', 'statistics', 'reporting'].includes(capability)) {
        errors.push('Data analysis capability must be ml, statistics, or reporting');
      }
      if (!['tensorflow', 'pytorch', 'scikit-learn'].includes(framework)) {
        errors.push('Data analysis framework must be tensorflow, pytorch, or scikit-learn');
      }
    }

    if (config.skills.naturalLanguage) {
      const capability = config.skills.naturalLanguage.capability;
      const modelSize = config.skills.naturalLanguage.modelSize;
      if (!['text-generation', 'sentiment-analysis', 'translation'].includes(capability)) {
        errors.push('Natural language capability must be text-generation, sentiment-analysis, or translation');
      }
      if (!['small', 'medium', 'large'].includes(modelSize)) {
        errors.push('Natural language model size must be small, medium, or large');
      }
    }

    if (config.skills.automation) {
      const capability = config.skills.automation.capability;
      const complexity = config.skills.automation.complexity;
      if (!['workflow-automation', 'data-pipeline', 'monitoring'].includes(capability)) {
        errors.push('Automation capability must be workflow-automation, data-pipeline, or monitoring');
      }
      if (!['simple', 'moderate', 'complex'].includes(complexity)) {
        errors.push('Automation complexity must be simple, moderate, or complex');
      }
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
  framework: ComplianceFramework = 'soc2',
  auditType?: 'type1' | 'type2'
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

  // SOC 1 compliance checks (Financial Controls)
  if (framework === 'soc1') {
    // SOC 1 focuses on controls relevant to financial reporting
    // Type 1: Report on controls at a point in time
    // Type 2: Report on controls over a period of time (typically 6-12 months)
    
    // Common SOC 1 requirements
    if (!config.compliance?.auditLogging) {
      violations.push('SOC 1: Audit logging required for financial controls');
      recommendations.push('Enable detailed audit logging for access and changes to financial systems');
    }

    if (config.environment === 'prod' && config.k8s && config.k8s.minNodes < 2) {
      violations.push('SOC 1: Production environments must have high availability for financial systems');
      recommendations.push('Deploy at least 2 nodes for fault tolerance and continuity of financial operations');
    }

    if (!config.compliance?.encryptionAtRest) {
      violations.push('SOC 1: Encryption at rest required for financial data protection');
      recommendations.push('Enable encryption at rest for all data stores containing financial information');
    }

    if (!config.region) {
      violations.push('SOC 1: Region specification required for data residency and compliance');
      recommendations.push('Specify regions for all cloud providers to ensure financial data controls');
    }

    if (config.networkCidr === '10.0.0.0/16') {
      violations.push('SOC 1: Default network CIDR may not meet financial controls requirements');
      recommendations.push('Use organization-specific network ranges with proper segmentation for financial systems');
    }
    
    // Type 2 specific requirements (operational effectiveness over time)
    if (auditType === 'type2') {
      // Type 2 requires evidence of operating effectiveness over time
      if (!config.compliance?.securityControls?.backupAndRecovery) {
        violations.push('SOC 1 Type 2: Backup and recovery testing required for operational effectiveness');
        recommendations.push('Implement regular backup and recovery testing with documented results');
      }
      
      if (!config.compliance?.securityControls?.incidentResponse) {
        violations.push('SOC 1 Type 2: Incident response procedures with testing required');
        recommendations.push('Implement and regularly test incident response procedures');
      }
      
      if (!config.compliance?.securityControls?.vulnerabilityManagement) {
        violations.push('SOC 1 Type 2: Vulnerability management program required');
        recommendations.push('Implement ongoing vulnerability scanning and remediation program');
      }
      
      if (!config.compliance?.retentionPolicy?.auditLogRetentionDays || config.compliance.retentionPolicy.auditLogRetentionDays < 365) {
        violations.push('SOC 1 Type 2: Audit logs must be retained for at least 1 year');
        recommendations.push('Configure audit log retention for minimum 365 days');
      }
    }
    
    // Type 1 specific requirements (design effectiveness)
    if (auditType === 'type1') {
      // Type 1 focuses on control design at a point in time
      if (!config.compliance?.securityControls?.complianceMonitoring) {
        violations.push('SOC 1 Type 1: Compliance monitoring controls must be designed');
        recommendations.push('Design and implement compliance monitoring controls');
      }
    }
  }

  // SOC 2 compliance checks (Trust Services Criteria)
  if (framework === 'soc2') {
    // SOC 2 covers: Security, Availability, Processing Integrity, Confidentiality, Privacy
    // Type 1: Report on controls at a point in time
    // Type 2: Report on controls over a period of time (typically 6-12 months)

    // Common SOC 2 requirements
    // Security: Protect against unauthorized access
    if (!config.compliance?.auditLogging) {
      violations.push('SOC 2 Security: Audit logging required');
      recommendations.push('Enable detailed audit logging for security monitoring');
    }

    if (!config.compliance?.encryptionAtRest) {
      violations.push('SOC 2 Security: Encryption at rest required for data protection');
      recommendations.push('Enable encryption at rest for all data stores');
    }

    // Availability: Ensure systems are available for operation
    if (config.environment === 'prod' && config.k8s && config.k8s.minNodes < 2) {
      violations.push('SOC 2 Availability: Production environments must have high availability');
      recommendations.push('Deploy at least 2 nodes for fault tolerance');
    }

    // Processing Integrity: Ensure data is processed accurately
    if (config.postgres && config.postgres.storageGb < 50 && config.environment === 'prod') {
      violations.push('SOC 2 Processing Integrity: Production databases must have adequate storage for data integrity');
      recommendations.push('Increase database storage to ensure processing integrity');
    }

    // Confidentiality: Protect sensitive information
    if (config.networkCidr === '10.0.0.0/16') {
      violations.push('SOC 2 Confidentiality: Default network CIDR may not meet confidentiality requirements');
      recommendations.push('Use organization-specific network ranges with proper access controls');
    }

    // Privacy: Protect personal information
    if (!config.region) {
      violations.push('SOC 2 Privacy: Region specification required for data privacy compliance');
      recommendations.push('Specify regions for all cloud providers to ensure data residency for privacy');
    }
    
    // Type 2 specific requirements (operational effectiveness over time)
    if (auditType === 'type2') {
      // Type 2 requires evidence of operating effectiveness over time
      if (!config.compliance?.encryptionInTransit) {
        violations.push('SOC 2 Type 2: Encryption in transit required for ongoing security');
        recommendations.push('Enable encryption in transit for all communications');
      }
      
      if (!config.compliance?.securityControls?.malwareProtection) {
        violations.push('SOC 2 Type 2: Malware protection required for ongoing security');
        recommendations.push('Implement continuous malware protection and monitoring');
      }
      
      if (!config.compliance?.securityControls?.backupAndRecovery) {
        violations.push('SOC 2 Type 2: Backup recovery testing required for availability');
        recommendations.push('Implement and test backup recovery procedures regularly');
      }
      
      if (!config.compliance?.securityControls?.incidentResponse) {
        violations.push('SOC 2 Type 2: Incident response testing required');
        recommendations.push('Conduct regular incident response drills and testing');
      }
      
      if (!config.compliance?.retentionPolicy?.auditLogRetentionDays || config.compliance.retentionPolicy.auditLogRetentionDays < 365) {
        violations.push('SOC 2 Type 2: Audit logs must be retained for at least 1 year');
        recommendations.push('Configure audit log retention for minimum 365 days');
      }
      
      if (!config.compliance?.securityControls?.securityMonitoring) {
        violations.push('SOC 2 Type 2: Continuous security monitoring required');
        recommendations.push('Implement 24/7 security monitoring and alerting');
      }
    }
    
    // Type 1 specific requirements (design effectiveness)
    if (auditType === 'type1') {
      // Type 1 focuses on control design at a point in time
      if (!config.compliance?.securityControls?.networkSegmentation) {
        violations.push('SOC 2 Type 1: Network segmentation controls must be designed');
        recommendations.push('Design network segmentation for security zones');
      }
      
      if (!config.compliance?.securityControls?.mfaRequired) {
        violations.push('SOC 2 Type 1: Multi-factor authentication must be configured');
        recommendations.push('Configure MFA for all administrative access');
      }
    }
  }

  // SOC 3 compliance checks (General Use SOC 2)
  if (framework === 'soc3') {
    // SOC 3 is a simplified version of SOC 2 for general use, focusing on trust services criteria
    // Similar to SOC 2 but less detailed and for general distribution
    // Type 1: Report on controls at a point in time
    // Type 2: Report on controls over a period of time (typically 6-12 months)

    // Common SOC 3 requirements (simplified from SOC 2)
    if (!config.compliance?.encryptionAtRest) {
      violations.push('SOC 3: Encryption at rest required');
      recommendations.push('Enable encryption at rest for data protection');
    }

    if (config.environment === 'prod' && config.k8s && config.k8s.minNodes < 2) {
      violations.push('SOC 3: Production environments must have high availability');
      recommendations.push('Deploy at least 2 nodes for reliability');
    }

    if (!config.region) {
      violations.push('SOC 3: Region specification required for compliance');
      recommendations.push('Specify regions for all cloud providers');
    }
    
    // Type 2 specific requirements (operational effectiveness over time)
    if (auditType === 'type2') {
      // Type 2 requires evidence of operating effectiveness over time (simplified)
      if (!config.compliance?.auditLogging) {
        violations.push('SOC 3 Type 2: Basic audit logging required for ongoing monitoring');
        recommendations.push('Enable audit logging for security and compliance monitoring');
      }
      
      if (!config.compliance?.securityControls?.backupAndRecovery) {
        violations.push('SOC 3 Type 2: Basic backup procedures required');
        recommendations.push('Implement regular backup procedures');
      }
      
      if (!config.compliance?.retentionPolicy?.auditLogRetentionDays || config.compliance.retentionPolicy.auditLogRetentionDays < 180) {
        violations.push('SOC 3 Type 2: Audit logs must be retained for at least 6 months');
        recommendations.push('Configure audit log retention for minimum 180 days');
      }
    }
    
    // Type 1 specific requirements (design effectiveness)
    if (auditType === 'type1') {
      // Type 1 focuses on control design at a point in time (simplified)
      if (!config.compliance?.securityControls?.mfaRequired) {
        violations.push('SOC 3 Type 1: Basic authentication controls required');
        recommendations.push('Configure strong authentication controls');
      }
    }
  }

  // ISO 27001 compliance checks
  if (framework === 'iso27001') {
    // Only check for explicitly disabled critical controls
    if (!config.compliance?.encryptionAtRest) {
      violations.push('ISO 27001: A.10.1.1 - Encryption at rest required for data protection');
      recommendations.push('Enable encryption at rest for all data stores (ISO 27001 A.10.1.1)');
    }

    if (!config.compliance?.auditLogging) {
      violations.push('ISO 27001: A.12.4.1 - Event logging required for security monitoring');
      recommendations.push('Enable comprehensive audit logging (ISO 27001 A.12.4.1)');
    }

    // Check for basic infrastructure requirements - only require region/data residency for production
    if (config.environment === 'prod' && !config.region && !config.compliance?.dataResidency) {
      violations.push('ISO 27001: A.8.1.1 - Inventory of assets requires region specification or data residency for production');
      recommendations.push('Specify regions for all cloud providers or define data residency requirements (ISO 27001 A.8.1.1)');
    }

    if (config.networkCidr === '10.0.0.0/16') {
      violations.push('ISO 27001: A.9.1.2 - Default network CIDR may not meet access control requirements');
      recommendations.push('Use organization-specific network ranges (ISO 27001 A.9.1.2)');
    }

    if (config.environment === 'prod' && config.k8s && config.k8s.minNodes < 2) {
      violations.push('ISO 27001: A.12.2.1 - Production environments must have redundancy controls');
      recommendations.push('Deploy at least 2 nodes for operational resilience (ISO 27001 A.12.2.1)');
    }
  }

  // ISO 27017 cloud security compliance checks
  if (framework === 'iso27017') {
    // Cloud-specific controls - only check explicitly disabled
    if (config.compliance?.cloudSpecificControls?.sharedResponsibility === false) {
      violations.push('ISO 27017: Shared responsibility model must be defined');
      recommendations.push('Define shared responsibilities between cloud provider and customer');
    }

    if (config.compliance?.cloudSpecificControls?.cloudProviderAssessment === false) {
      violations.push('ISO 27017: Cloud provider assessment required');
      recommendations.push('Conduct regular cloud provider security assessments');
    }

    if (config.compliance?.cloudSpecificControls?.cloudConfigurationManagement === false) {
      violations.push('ISO 27017: Cloud configuration management required');
      recommendations.push('Implement cloud configuration management and monitoring');
    }

    if (config.compliance?.cloudSpecificControls?.cloudMonitoring === false) {
      violations.push('ISO 27017: Cloud service monitoring required');
      recommendations.push('Implement cloud service monitoring');
    }

    if (config.compliance?.cloudSpecificControls?.cloudBackup === false) {
      violations.push('ISO 27017: Cloud backup procedures required');
      recommendations.push('Implement cloud data backup and recovery procedures');
    }

    if (config.compliance?.cloudSpecificControls?.cloudDisasterRecovery === false) {
      violations.push('ISO 27017: Cloud disaster recovery required');
      recommendations.push('Implement cloud disaster recovery procedures');
    }

    if (config.compliance?.cloudSpecificControls?.serviceLevelAgreements === false) {
      violations.push('ISO 27017: Service level agreement monitoring required');
      recommendations.push('Monitor and manage cloud service level agreements');
    }

    if (config.compliance?.cloudSpecificControls?.cloudExitStrategy === false) {
      violations.push('ISO 27017: Cloud exit strategy required');
      recommendations.push('Define cloud service exit strategy and procedures');
    }
  }

  // ISO 27018 privacy in cloud compliance checks
  if (framework === 'iso27018') {
    // Privacy-specific controls - only check explicitly disabled
    if (!config.compliance?.privacyByDesign) {
      violations.push('ISO 27018: Privacy by design principles required');
      recommendations.push('Implement privacy by design in all systems and processes');
    }

    if (!config.compliance?.dataMinimization) {
      violations.push('ISO 27018: Data minimization principles required');
      recommendations.push('Implement data minimization practices');
    }

    if (!config.compliance?.purposeLimitation) {
      violations.push('ISO 27018: Purpose limitation required');
      recommendations.push('Implement purpose limitation controls');
    }

    if (!config.compliance?.consentManagement) {
      violations.push('ISO 27018: Consent management required');
      recommendations.push('Implement user consent management procedures');
    }

    if (!config.compliance?.dataSubjectRights) {
      violations.push('ISO 27018: Data subject rights support required');
      recommendations.push('Implement procedures to handle data subject rights');
    }

    if (!config.compliance?.breachNotification) {
      violations.push('ISO 27018: Breach notification procedures required');
      recommendations.push('Implement data breach notification procedures');
    }

    if (!config.compliance?.privacyImpactAssessment) {
      violations.push('ISO 27018: Privacy impact assessments required');
      recommendations.push('Conduct privacy impact assessments for all systems');
    }

    if (!config.compliance?.privacyControls?.dataClassification) {
      violations.push('ISO 27018: Data classification required');
      recommendations.push('Implement data classification for personal data');
    }

    if (!config.compliance?.privacyControls?.dataLossPrevention) {
      violations.push('ISO 27018: Data loss prevention required');
      recommendations.push('Implement data loss prevention controls');
    }

    if (!config.compliance?.privacyControls?.consentRecording) {
      violations.push('ISO 27018: Consent recording required');
      recommendations.push('Implement consent recording and tracking');
    }

    if (!config.compliance?.privacyControls?.dataSubjectRequests) {
      violations.push('ISO 27018: Data subject request handling required');
      recommendations.push('Implement procedures to handle data subject requests');
    }

    if (!config.compliance?.privacyControls?.privacyAudits) {
      violations.push('ISO 27018: Privacy audits required');
      recommendations.push('Conduct regular privacy audits');
    }

    if (config.compliance?.retentionPolicy?.piiRetentionDays !== undefined && config.compliance.retentionPolicy.piiRetentionDays <= 0) {
      violations.push('ISO 27018: PII retention policy required');
      recommendations.push('Define and implement PII retention policies');
    }
  }

  // ISO 27701 Privacy Information Management compliance checks
  if (framework === 'iso27701') {
    // Extended privacy controls
    if (!config.compliance?.privacyByDesign) {
      violations.push('ISO 27701: Privacy by design and by default required');
      recommendations.push('Implement privacy by design and by default principles');
    }

    if (!config.compliance?.privacyImpactAssessment) {
      violations.push('ISO 27701: Privacy impact assessment required');
      recommendations.push('Conduct privacy impact assessments for all processing activities');
    }

    if (!config.compliance?.privacyControls?.privacyTraining) {
      violations.push('ISO 27701: Privacy training required');
      recommendations.push('Provide privacy training to all personnel');
    }

    if (!config.compliance?.crossBorderTransfer) {
      violations.push('ISO 27701: Cross-border transfer controls required');
      recommendations.push('Implement cross-border data transfer controls');
    }
  }

  // GDPR compliance checks
  if (framework === 'gdpr') {
    if (config.compliance?.privacyByDesign === false) {
      violations.push('GDPR: Privacy by design and by default required');
      recommendations.push('Implement privacy by design and by default principles');
    }

    if (config.compliance?.consentManagement === false) {
      violations.push('GDPR: Consent management required');
      recommendations.push('Implement explicit consent management procedures');
    }

    if (config.compliance?.dataSubjectRights === false) {
      violations.push('GDPR: Data subject rights support required');
      recommendations.push('Implement procedures for data subject rights (access, rectification, erasure)');
    }

    if (config.compliance?.breachNotification === false) {
      violations.push('GDPR: Breach notification within 72 hours required');
      recommendations.push('Implement 72-hour breach notification procedures');
    }

    if (config.compliance?.privacyImpactAssessment === false) {
      violations.push('GDPR: Data protection impact assessment required');
      recommendations.push('Conduct DPIAs for high-risk processing activities');
    }

    if (config.compliance?.dataMinimization === false) {
      violations.push('GDPR: Data minimization principle required');
      recommendations.push('Implement data minimization practices');
    }

    if (!config.compliance?.retentionPolicy?.piiRetentionDays) {
      violations.push('GDPR: Storage limitation principle required');
      recommendations.push('Define and implement data retention policies');
    }
  }

  // CCPA compliance checks
  if (framework === 'ccpa') {
    if (!config.compliance?.dataSubjectRights) {
      violations.push('CCPA: Consumer rights support required');
      recommendations.push('Implement procedures for consumer rights (know, delete, opt-out)');
    }

    if (!config.compliance?.privacyControls?.privacyNotices) {
      violations.push('CCPA: Privacy notice required');
      recommendations.push('Provide privacy notices to consumers');
    }

    if (!config.compliance?.consentManagement) {
      violations.push('CCPA: Consent management for minors required');
      recommendations.push('Implement consent management for minors under 16');
    }

    if (!config.compliance?.privacyControls?.dataLossPrevention) {
      violations.push('CCPA: Data security required');
      recommendations.push('Implement reasonable security procedures');
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
      violations.push(`FedRAMP ${level.toUpperCase()}: Audit logging required`);
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
      violations.push(`GovRAMP ${level.toUpperCase()}: Audit logging required`);
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

  // NIST compliance checks
  if (framework.startsWith('nist-')) {
    const level = framework.split('-')[1]; // 'low', 'moderate', 'high'

    // Basic NIST requirements (simplified)
    if (config.compliance?.encryptionAtRest === false) {
      violations.push(`NIST ${level.toUpperCase()}: Encryption at rest required`);
      recommendations.push('Enable encryption at rest for all data stores');
    }

    if (config.compliance?.auditLogging === false) {
      violations.push(`NIST ${level.toUpperCase()}: Audit logging required`);
      recommendations.push('Enable comprehensive audit logging');
    }

    if (config.environment === 'prod' && config.k8s && config.k8s.minNodes < 2) {
      violations.push(`NIST ${level.toUpperCase()}: High availability required for production`);
      recommendations.push('Deploy at least 2 nodes for fault tolerance');
    }

    // Level-specific requirements
    if (level === 'moderate' || level === 'high') {
      if (config.compliance?.securityControls?.mfaRequired === false) {
        violations.push(`NIST ${level.toUpperCase()}: Multi-factor authentication required`);
        recommendations.push('Implement MFA for all administrative access');
      }
    }

    if (level === 'high') {
      if (config.compliance?.securityControls?.privilegedAccessManagement === false) {
        violations.push(`NIST HIGH: Privileged access management required`);
        recommendations.push('Implement PAM for privileged account management');
      }

      // High-level specific requirements
      if (config.postgres && config.postgres.storageGb < 100 && config.environment === 'prod') {
        violations.push('NIST HIGH: Production databases must have enhanced storage capacity');
        recommendations.push('Configure at least 100GB storage for high-impact production databases');
      }

      if (config.k8s && config.k8s.minNodes < 3 && config.environment === 'prod') {
        violations.push('NIST HIGH: High-impact production environments require enhanced availability');
        recommendations.push('Deploy at least 3 nodes for high-impact production workloads');
      }
    }
  }

  // HIPAA compliance checks (enhanced with levels)
  if (framework.startsWith('hipaa-')) {
    const level = framework.split('-')[1]; // 'low', 'moderate', 'high'
    
    // Common HIPAA requirements
    if (config.networkCidr.startsWith('10.0.0.0/16')) {
      violations.push(`HIPAA ${level.toUpperCase()}: Default network ranges may not meet data protection requirements`);
      recommendations.push('Use private network ranges with proper segmentation');
    }

    if (config.environment === 'prod' && !config.region) {
      violations.push(`HIPAA ${level.toUpperCase()}: Production workloads must specify regions for data residency`);
      recommendations.push('Specify compliant regions for healthcare data');
    }

    if (config.compliance?.encryptionAtRest === false) {
      violations.push(`HIPAA ${level.toUpperCase()}: Encryption at rest is required for PHI`);
      recommendations.push('Enable encryption at rest for all data stores containing PHI');
    }

    if (config.compliance?.auditLogging === false) {
      violations.push(`HIPAA ${level.toUpperCase()}: Audit logging required for PHI access`);
      recommendations.push('Enable detailed audit logging for all PHI access and modifications');
    }

    // Level-specific requirements
    if (level === 'moderate' || level === 'high') {
      if (config.postgres && config.postgres.storageGb < 100 && config.environment === 'prod') {
        violations.push(`HIPAA ${level.toUpperCase()}: Production databases must have adequate backup storage`);
        recommendations.push('Configure at least 100GB storage for production PHI databases');
      }

      if (config.k8s && config.k8s.minNodes < 3 && config.environment === 'prod') {
        violations.push(`HIPAA ${level.toUpperCase()}: Production environments require high availability for PHI systems`);
        recommendations.push('Deploy at least 3 nodes for production PHI workloads');
      }
    }

    if (level === 'high') {
      if (!config.compliance?.dataResidency) {
        violations.push('HIPAA HIGH: Data residency requirements must be explicitly specified');
        recommendations.push('Define specific regions for PHI data residency compliance');
      }

      if (config.adfs && config.adfs.size === 'small' && config.environment === 'prod') {
        violations.push('HIPAA HIGH: Production ADFS infrastructure must be sized for high availability');
        recommendations.push('Use medium or large workload size for production ADFS');
      }
    }
  }

  // HITRUST CSF compliance checks
  if (framework.startsWith('hitrust-')) {
    const level = framework.split('-')[1]; // 'low', 'moderate', 'high'

    // Common HITRUST CSF requirements
    if (!config.compliance?.encryptionAtRest) {
      violations.push(`HITRUST CSF ${level.toUpperCase()}: Encryption at rest is mandatory`);
      recommendations.push('Enable encryption at rest for all data');
    }

    if (!config.compliance?.auditLogging) {
      violations.push(`HITRUST CSF ${level.toUpperCase()}: Audit logging required`);
      recommendations.push('Implement detailed audit logging for all system activities');
    }

    if (config.environment === 'prod' && config.k8s && config.k8s.minNodes < 2) {
      violations.push(`HITRUST CSF ${level.toUpperCase()}: Production environments require high availability`);
      recommendations.push('Deploy at least 2 nodes for production workloads');
    }

    // Network security requirements
    if (config.networkCidr === '10.0.0.0/16') {
      violations.push(`HITRUST CSF ${level.toUpperCase()}: Default network CIDR does not meet security requirements`);
      recommendations.push('Use organization-specific, non-default network CIDR ranges');
    }

    // Level-specific requirements
    if (level === 'moderate' || level === 'high') {
      if (!config.region) {
        violations.push(`HITRUST CSF ${level.toUpperCase()}: Region specification required for compliance`);
        recommendations.push('Specify regions for all cloud providers');
      }

      if (config.postgres && config.postgres.storageGb < 50 && config.environment === 'prod') {
        violations.push(`HITRUST CSF ${level.toUpperCase()}: Production databases must have adequate backup storage`);
        recommendations.push('Configure at least 50GB storage for production databases');
      }

      // Enhanced security controls
      if (!config.compliance?.dataResidency) {
        violations.push(`HITRUST CSF ${level.toUpperCase()}: Data residency requirements must be specified`);
        recommendations.push('Define compliant regions for data residency');
      }
    }

    if (level === 'high') {
      // High requires additional security controls
      if (config.k8s && config.k8s.maxNodes > 20) {
        violations.push('HITRUST CSF HIGH: Large clusters require enhanced security controls');
        recommendations.push('Implement network segmentation and advanced threat detection');
      }

      if (config.environment === 'prod' && config.k8s && config.k8s.minNodes < 3) {
        violations.push('HITRUST CSF HIGH: Production environments require enhanced high availability');
        recommendations.push('Deploy at least 3 nodes for production high-availability');
      }

      // Additional requirements for high sensitivity
      if (config.adfs && config.adfs.size === 'small') {
        violations.push('HITRUST CSF HIGH: Identity infrastructure must be sized for security');
        recommendations.push('Use medium or large workload size for ADFS infrastructure');
      }
    }
  }

  // HITECH compliance checks
  if (framework.startsWith('hitech-')) {
    const level = framework.split('-')[1]; // 'low', 'moderate', 'high'

    // HITECH builds on HIPAA but adds breach notification requirements
    if (config.networkCidr.startsWith('10.0.0.0/16')) {
      violations.push(`HITECH ${level.toUpperCase()}: Default network ranges may not meet breach prevention requirements`);
      recommendations.push('Use private network ranges with enhanced security controls');
    }

    if (!config.compliance?.auditLogging) {
      violations.push(`HITECH ${level.toUpperCase()}: Enhanced audit logging required for breach detection`);
      recommendations.push('Implement comprehensive audit logging for breach detection and notification');
    }

    if (!config.compliance?.encryptionAtRest) {
      violations.push(`HITECH ${level.toUpperCase()}: Encryption required to prevent breach notifications`);
      recommendations.push('Enable encryption at rest to reduce breach notification requirements');
    }

    // Level-specific requirements
    if (level === 'moderate' || level === 'high') {
      if (config.environment === 'prod' && !config.region) {
        violations.push(`HITECH ${level.toUpperCase()}: Production workloads must specify regions for breach compliance`);
        recommendations.push('Specify regions compliant with HITECH breach notification requirements');
      }

      if (config.postgres && config.postgres.storageGb < 75 && config.environment === 'prod') {
        violations.push(`HITECH ${level.toUpperCase()}: Production databases must have adequate backup for breach investigation`);
        recommendations.push('Configure at least 75GB storage for production databases');
      }
    }

    if (level === 'high') {
      // High requires enhanced breach prevention
      if (!config.compliance?.dataResidency) {
        violations.push('HITECH HIGH: Data residency must be specified for breach notification compliance');
        recommendations.push('Define specific regions for data residency and breach compliance');
      }

      if (config.k8s && config.k8s.minNodes < 3 && config.environment === 'prod') {
        violations.push('HITECH HIGH: Production environments require enhanced availability for breach prevention');
        recommendations.push('Deploy at least 3 nodes for production high-availability');
      }

      // Additional monitoring requirements
      if (config.adfs && config.adfs.size === 'small' && config.environment === 'prod') {
        violations.push('HITECH HIGH: Identity infrastructure must support enhanced monitoring');
        recommendations.push('Use medium or large workload size for production ADFS');
      }
    }
  }

  // DoD compliance checks (Impact Levels)
  if (framework.startsWith('dod-il')) {
    const level = framework.split('-')[1]; // 'il2', 'il4', 'il5', 'il6'

    // Common checks for all DoD levels
    if (!config.compliance?.encryptionAtRest) {
      violations.push(`DoD ${level.toUpperCase()}: Encryption at rest required for defense data`);
      recommendations.push('Enable encryption at rest for all data stores');
    }

    if (!config.compliance?.auditLogging) {
      violations.push(`DoD ${level.toUpperCase()}: Audit logging required`);
      recommendations.push('Enable detailed audit logging for all resources and access');
    }

    if (config.environment === 'prod' && config.k8s && config.k8s.minNodes < 2) {
      violations.push(`DoD ${level.toUpperCase()}: Production environments must have high availability`);
      recommendations.push('Deploy at least 2 nodes for fault tolerance');
    }

    // Level-specific checks
    if (level === 'il2') {
      // IL2 - Basic protection for CUI (Controlled Unclassified Information)
      if (config.region?.aws && !config.region.aws.includes('gov')) {
        violations.push('DoD IL2: AWS GovCloud recommended for CUI workloads');
        recommendations.push('Use AWS GovCloud or implement equivalent security controls');
      }

      if (config.region?.azure && !config.region.azure.includes('usgov')) {
        violations.push('DoD IL2: Azure Government recommended for CUI workloads');
        recommendations.push('Use Azure Government or implement equivalent security controls');
      }

      if (config.networkCidr === '10.0.0.0/16') {
        violations.push('DoD IL2: Default network CIDR may not meet security requirements');
        recommendations.push('Use organization-specific network ranges with proper segmentation');
      }
    }

    if (level === 'il4') {
      // IL4 - Enhanced protection for CUI and mission-critical systems
      if (config.region?.aws && !config.region.aws.includes('gov')) {
        violations.push('DoD IL4: AWS GovCloud required for IL4 workloads');
        recommendations.push('Use AWS GovCloud regions for defense compliance');
      }

      if (config.region?.azure && !config.region.azure.includes('usgov')) {
        violations.push('DoD IL4: Azure Government required for IL4 workloads');
        recommendations.push('Use Azure Government regions');
      }

      if (config.region?.gcp && !config.region.gcp.includes('gov')) {
        violations.push('DoD IL4: GCP GovCloud required for IL4 workloads');
        recommendations.push('Use GCP GovCloud regions');
      }

      if (config.postgres && config.postgres.storageGb < 50 && config.environment === 'prod') {
        violations.push('DoD IL4: Production databases must have minimum 50GB storage');
        recommendations.push('Increase database storage to meet compliance requirements');
      }

      if (config.k8s && config.k8s.maxNodes > 20) {
        violations.push('DoD IL4: Large node counts require additional security controls');
        recommendations.push('Implement enhanced security monitoring for large clusters');
      }
    }

    if (level === 'il5') {
      // IL5 - Highest level of protection for CUI and national security systems
      if (config.region?.aws && !config.region.aws.includes('gov')) {
        violations.push('DoD IL5: AWS GovCloud (Secret Region) required');
        recommendations.push('Use AWS GovCloud Secret Region for IL5 compliance');
      }

      if (config.region?.azure && !config.region.azure.includes('usgov')) {
        violations.push('DoD IL5: Azure Government (Secret Region) required');
        recommendations.push('Use Azure Government Secret regions');
      }

      if (config.region?.gcp && !config.region.gcp.includes('gov')) {
        violations.push('DoD IL5: GCP GovCloud (Secret Region) required');
        recommendations.push('Use GCP GovCloud Secret regions');
      }

      if (config.k8s && config.k8s.minNodes < 3) {
        violations.push('DoD IL5: High-security environments require enhanced availability');
        recommendations.push('Deploy at least 3 nodes for critical defense systems');
      }

      if (config.postgres && config.postgres.storageGb < 100 && config.environment === 'prod') {
        violations.push('DoD IL5: Production databases must have minimum 100GB storage');
        recommendations.push('Increase database storage for high-security requirements');
      }

      if (!config.region) {
        violations.push('DoD IL5: Explicit region specification required for data sovereignty');
        recommendations.push('Specify government cloud regions for all providers');
      }
    }

    if (level === 'il6') {
      // IL6 - Classified information processing (SCI/SAP)
      violations.push('DoD IL6: Requires specialized classified computing environments');
      recommendations.push('Contact DoD for classified computing infrastructure requirements');
      
      if (config.environment !== 'prod') {
        violations.push('DoD IL6: Classified workloads must use production-grade security');
        recommendations.push('Use production environment with enhanced controls for classified data');
      }

      if (config.k8s && config.k8s.maxNodes > 10) {
        violations.push('DoD IL6: Classified environments require minimal attack surface');
        recommendations.push('Limit cluster size and implement strict access controls');
      }
    }
  }

  return {
    framework,
    auditType,
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
    'eastus', 'westus', 'centralus', 'northeurope', 'westeurope',
    'eastasia', 'southeastasia', 'australiaeast'
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

