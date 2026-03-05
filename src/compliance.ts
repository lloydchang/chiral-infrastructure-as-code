// Enhanced compliance validation for ISO 27001:2022, 27017, 27018

import { ValidationResult } from './validation';
export function validateISO27001Compliance(config: any): ValidationResult {
  const issues: string[] = [];

  // Annex A.9 - Access Control
  if (!config.accessControl?.mfa) {
    issues.push('Multi-factor authentication not configured');
  }

  if (!config.accessControl?.rbac) {
    issues.push('Role-based access control not implemented');
  }

  // Annex A.10 - Cryptography
  if (!config.encryption?.atRest) {
    issues.push('Encryption at rest not enabled');
  }

  if (!config.encryption?.inTransit) {
    issues.push('Encryption in transit not enabled');
  }

  // Annex A.12 - Operations Security
  if (!config.monitoring?.logging) {
    issues.push('Security logging not configured');
  }

  if (!config.backup?.strategy) {
    issues.push('Backup strategy not defined');
  }

  // Annex A.16 - Incident Management
  if (!config.incidentResponse?.plan) {
    issues.push('Incident response plan not documented');
  }

  return {
    valid: issues.length === 0,
    errors: issues,
    warnings: [],
    recommendations: []
  };
}

export function validateISO27017Compliance(config: any): ValidationResult {
  const issues: string[] = [];

  // Cloud-specific controls
  if (!config.cloud?.sharedResponsibility) {
    issues.push('Shared responsibility model not documented');
  }

  if (!config.cloud?.dataResidency) {
    issues.push('Data residency controls not implemented');
  }

  if (!config.cloud?.auditLogging) {
    issues.push('Cloud audit logging not enabled');
  }

  return {
    valid: issues.length === 0,
    errors: issues,
    warnings: [],
    recommendations: []
  };
}

export function validateISO27018Compliance(config: any): ValidationResult {
  const issues: string[] = [];

  // Privacy controls
  if (!config.privacy?.dataMinimization) {
    issues.push('Data minimization not implemented');
  }

  if (!config.privacy?.consentManagement) {
    issues.push('Consent management not configured');
  }

  if (!config.privacy?.breachNotification) {
    issues.push('Breach notification procedures not defined');
  }

  return {
    valid: issues.length === 0,
    errors: issues,
    warnings: [],
    recommendations: []
  };
}

export function validateNISTLowCompliance(config: any): ValidationResult {
  const issues: string[] = [];

  // NIST Low Impact Baseline Controls
  // SC-28 - Protection of Information at Rest
  if (!config.encryption?.atRest) {
    issues.push('NIST LOW: SC-28 - Encryption at rest not enabled');
  }

  // AU-2 - Event Logging
  if (!config.auditLogging) {
    issues.push('NIST LOW: AU-2 - Audit logging not configured');
  }

  // IA-2 - Identification and Authentication
  if (!config.securityControls?.mfaRequired) {
    issues.push('NIST LOW: IA-2 - Multi-factor authentication required');
  }

  // SC-8 - Transmission Confidentiality and Integrity
  if (!config.encryption?.inTransit) {
    issues.push('NIST LOW: SC-8 - Encryption in transit not enabled');
  }

  return {
    valid: issues.length === 0,
    errors: issues,
    warnings: [],
    recommendations: []
  };
}

export function validateNISTModerateCompliance(config: any): ValidationResult {
  const issues: string[] = [];

  // NIST Moderate Impact Baseline Controls (includes Low)
  // SC-28 - Protection of Information at Rest
  if (!config.encryption?.atRest) {
    issues.push('NIST MODERATE: SC-28 - Encryption at rest not enabled');
  }

  // AU-2 - Event Logging
  if (!config.auditLogging) {
    issues.push('NIST MODERATE: AU-2 - Audit logging not configured');
  }

  // IA-2 - Identification and Authentication
  if (!config.securityControls?.mfaRequired) {
    issues.push('NIST MODERATE: IA-2 - Multi-factor authentication required');
  }

  // SC-8 - Transmission Confidentiality and Integrity
  if (!config.encryption?.inTransit) {
    issues.push('NIST MODERATE: SC-8 - Encryption in transit not enabled');
  }

  // AC-4 - Information Flow Enforcement
  if (!config.securityControls?.networkSegmentation) {
    issues.push('NIST MODERATE: AC-4 - Network segmentation required');
  }

  // SI-2 - Flaw Remediation
  if (!config.securityControls?.vulnerabilityManagement) {
    issues.push('NIST MODERATE: SI-2 - Vulnerability management required');
  }

  // IR-4 - Incident Handling
  if (!config.securityControls?.incidentResponse) {
    issues.push('NIST MODERATE: IR-4 - Incident response procedures required');
  }

  // AU-11 - Audit Record Retention
  if (!config.retentionPolicy?.auditLogRetentionDays || config.retentionPolicy.auditLogRetentionDays < 365) {
    issues.push('NIST MODERATE: AU-11 - Audit logs must be retained for at least 1 year');
  }

  return {
    valid: issues.length === 0,
    errors: issues,
    warnings: [],
    recommendations: []
  };
}

export function validateNISTHighCompliance(config: any): ValidationResult {
  const issues: string[] = [];

  // NIST High Impact Baseline Controls (includes Moderate)
  // SC-28 - Protection of Information at Rest
  if (!config.encryption?.atRest) {
    issues.push('NIST HIGH: SC-28 - Encryption at rest not enabled');
  }

  // AU-2 - Event Logging
  if (!config.auditLogging) {
    issues.push('NIST HIGH: AU-2 - Audit logging not configured');
  }

  // IA-2 - Identification and Authentication
  if (!config.securityControls?.mfaRequired) {
    issues.push('NIST HIGH: IA-2 - Multi-factor authentication required');
  }

  // SC-8 - Transmission Confidentiality and Integrity
  if (!config.encryption?.inTransit) {
    issues.push('NIST HIGH: SC-8 - Encryption in transit not enabled');
  }

  // AC-4 - Information Flow Enforcement
  if (!config.securityControls?.networkSegmentation) {
    issues.push('NIST HIGH: AC-4 - Advanced network segmentation required');
  }

  // SI-2 - Flaw Remediation
  if (!config.securityControls?.vulnerabilityManagement) {
    issues.push('NIST HIGH: SI-2 - Continuous vulnerability management required');
  }

  // IR-4 - Incident Handling
  if (!config.securityControls?.incidentResponse) {
    issues.push('NIST HIGH: IR-4 - Comprehensive incident response required');
  }

  // AC-6 - Least Privilege
  if (!config.securityControls?.privilegedAccessManagement) {
    issues.push('NIST HIGH: AC-6 - Privileged access management required');
  }

  // SI-3 - Malicious Code Protection
  if (!config.securityControls?.malwareProtection) {
    issues.push('NIST HIGH: SI-3 - Advanced malware protection required');
  }

  // SI-4 - Information System Monitoring
  if (!config.securityControls?.securityMonitoring) {
    issues.push('NIST HIGH: SI-4 - Continuous security monitoring required');
  }

  // AU-11 - Audit Record Retention
  if (!config.retentionPolicy?.auditLogRetentionDays || config.retentionPolicy.auditLogRetentionDays < 730) {
    issues.push('NIST HIGH: AU-11 - Audit logs must be retained for at least 2 years');
  }

  return {
    valid: issues.length === 0,
    errors: issues,
    warnings: [],
    recommendations: []
  };
}
