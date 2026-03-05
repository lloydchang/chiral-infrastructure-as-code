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
  const monitor = new CloudSecurityMonitor({
    enabled: true,
    alertThresholds: { failedLogins: 5, unusualActivity: 10, configChanges: 3 },
    logRetentionDays: 365,
    realTimeMonitoring: true,
    complianceMonitoring: true
  });

  // Cloud shared responsibility checks
  if (!config.compliance?.sharedResponsibility) {
    issues.push('Shared responsibility model not documented');
  }

  // Data residency checks
  if (!config.compliance?.dataResidency) {
    issues.push('Data residency controls not implemented');
  }

  // Cloud-specific monitoring
  if (config.region?.aws) {
    monitorAwsSecurity(config, monitor);
  }
  if (config.region?.azure) {
    monitorAzureSecurity(config, monitor);
  }
  if (config.region?.gcp) {
    monitorGcpSecurity(config, monitor);
  }

  // Check for monitoring alerts
  const alerts = monitor.getRecentAlerts(1); // Last hour
  if (alerts.length > 0) {
    issues.push(`${alerts.length} security alerts detected in cloud environment`);
  }

  return {
    valid: issues.length === 0,
    errors: issues,
    warnings: [],
    monitoringReport: monitor.generateSecurityReport(),
    recommendations: []
  };
}

export function validateISO27018Compliance(config: any): ValidationResult {
  const issues: string[] = [];

  // Privacy controls
  if (!config.compliance?.privacyByDesign) {
    issues.push('ISO 27018: Privacy by design principles required');
  }

  if (!config.compliance?.dataMinimization) {
    issues.push('ISO 27018: Data minimization principles required');
  }

  if (!config.compliance?.purposeLimitation) {
    issues.push('ISO 27018: Purpose limitation required');
  }

  if (!config.compliance?.consentManagement) {
    issues.push('ISO 27018: Consent management required');
  }

  if (!config.compliance?.dataSubjectRights) {
    issues.push('ISO 27018: Data subject rights support required');
  }

  if (!config.compliance?.breachNotification) {
    issues.push('ISO 27018: Breach notification procedures required');
  }

  if (!config.compliance?.privacyImpactAssessment) {
    issues.push('ISO 27018: Privacy impact assessments required');
  }

  if (!config.compliance?.privacyControls?.dataClassification) {
    issues.push('ISO 27018: Data classification required');
  }

  if (!config.compliance?.privacyControls?.dataLossPrevention) {
    issues.push('ISO 27018: Data loss prevention required');
  }

  if (!config.compliance?.privacyControls?.consentRecording) {
    issues.push('ISO 27018: Consent recording required');
  }

  if (!config.compliance?.privacyControls?.dataSubjectRequests) {
    issues.push('ISO 27018: Data subject request handling required');
  }

  if (!config.compliance?.privacyControls?.privacyAudits) {
    issues.push('ISO 27018: Privacy audits required');
  }

  if (!config.compliance?.retentionPolicy?.piiRetentionDays) {
    issues.push('ISO 27018: PII retention policy required');
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
  if (!config.compliance?.encryptionAtRest) {
    issues.push('NIST LOW: SC-28 - Encryption at rest not enabled');
  }

  // AU-2 - Event Logging
  if (!config.compliance?.auditLogging) {
    issues.push('NIST LOW: AU-2 - Audit logging not configured');
  }

  // IA-2 - Identification and Authentication
  if (!config.compliance?.securityControls?.mfaRequired) {
    issues.push('NIST LOW: IA-2 - Multi-factor authentication required');
  }

  // SC-8 - Transmission Confidentiality and Integrity
  if (!config.compliance?.encryptionInTransit) {
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
  if (!config.compliance?.encryptionAtRest) {
    issues.push('NIST MODERATE: SC-28 - Encryption at rest not enabled');
  }

  // AU-2 - Event Logging
  if (!config.compliance?.auditLogging) {
    issues.push('NIST MODERATE: AU-2 - Audit logging not configured');
  }

  // IA-2 - Identification and Authentication
  if (!config.compliance?.securityControls?.mfaRequired) {
    issues.push('NIST MODERATE: IA-2 - Multi-factor authentication required');
  }

  // SC-8 - Transmission Confidentiality and Integrity
  if (!config.compliance?.encryptionInTransit) {
    issues.push('NIST MODERATE: SC-8 - Encryption in transit not enabled');
  }

  // AC-4 - Information Flow Enforcement
  if (!config.compliance?.securityControls?.networkSegmentation) {
    issues.push('NIST MODERATE: AC-4 - Network segmentation required');
  }

  // SI-2 - Flaw Remediation
  if (!config.compliance?.securityControls?.vulnerabilityManagement) {
    issues.push('NIST MODERATE: SI-2 - Vulnerability management required');
  }

  // IR-4 - Incident Handling
  if (!config.compliance?.securityControls?.incidentResponse) {
    issues.push('NIST MODERATE: IR-4 - Incident response procedures required');
  }

  // AU-11 - Audit Record Retention
  if (!config.compliance?.retentionPolicy?.auditLogRetentionDays || config.compliance.retentionPolicy.auditLogRetentionDays < 365) {
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
  if (!config.compliance?.encryptionAtRest) {
    issues.push('NIST HIGH: SC-28 - Encryption at rest not enabled');
  }

  // AU-2 - Event Logging
  if (!config.compliance?.auditLogging) {
    issues.push('NIST HIGH: AU-2 - Audit logging not configured');
  }

  // IA-2 - Identification and Authentication
  if (!config.compliance?.securityControls?.mfaRequired) {
    issues.push('NIST HIGH: IA-2 - Multi-factor authentication required');
  }

  // SC-8 - Transmission Confidentiality and Integrity
  if (!config.compliance?.encryptionInTransit) {
    issues.push('NIST HIGH: SC-8 - Encryption in transit not enabled');
  }

  // AC-4 - Information Flow Enforcement
  if (!config.compliance?.securityControls?.networkSegmentation) {
    issues.push('NIST HIGH: AC-4 - Advanced network segmentation required');
  }

  // SI-2 - Flaw Remediation
  if (!config.compliance?.securityControls?.vulnerabilityManagement) {
    issues.push('NIST HIGH: SI-2 - Continuous vulnerability management required');
  }

  // IR-4 - Incident Handling
  if (!config.compliance?.securityControls?.incidentResponse) {
    issues.push('NIST HIGH: IR-4 - Comprehensive incident response required');
  }

  // AC-6 - Least Privilege
  if (!config.compliance?.securityControls?.privilegedAccessManagement) {
    issues.push('NIST HIGH: AC-6 - Privileged access management required');
  }

  // SI-3 - Malicious Code Protection
  if (!config.compliance?.securityControls?.malwareProtection) {
    issues.push('NIST HIGH: SI-3 - Advanced malware protection required');
  }

  // SI-4 - Information System Monitoring
  if (!config.compliance?.securityControls?.securityMonitoring) {
    issues.push('NIST HIGH: SI-4 - Continuous security monitoring required');
  }

  // AU-11 - Audit Record Retention
  if (!config.compliance?.retentionPolicy?.auditLogRetentionDays || config.compliance.retentionPolicy.auditLogRetentionDays < 730) {
    issues.push('NIST HIGH: AU-11 - Audit logs must be retained for at least 2 years');
  }

  return {
    valid: issues.length === 0,
    errors: issues,
    warnings: [],
    recommendations: []
  };
}
