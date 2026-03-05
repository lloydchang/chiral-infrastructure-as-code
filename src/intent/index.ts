// File: src/intent/index.ts

// 2. The Intent Layer (Types)

// Defines the abstract business requirements (The Schema).

export type EnvironmentTier = 'dev' | 'prod';
export type WorkloadSize = 'small' | 'medium' | 'large';
export type ComplianceFramework = 'none' | 'soc2' | 'iso27001' | 'fedramp-low' | 'fedramp-moderate' | 'fedramp-high' | 'govramp-low' | 'govramp-moderate' | 'govramp-high';
export type DeploymentStrategy = 'greenfield' | 'progressive' | 'parallel';

export interface KubernetesIntent {
  version: string;
  minNodes: number;
  maxNodes: number;
  size: WorkloadSize; // For consistent node sizing across clouds
}

export interface DatabaseIntent {
  engineVersion: string; // e.g., "15"
  storageGb: number;
  size: WorkloadSize;
}

export interface AdfsIntent {
  // AD FS runs on Windows Server. We define the compute power here.
  size: WorkloadSize;
  windowsVersion: '2019' | '2022';
}

export interface ChiralSystem {
  projectName: string;
  environment: EnvironmentTier;
  networkCidr: string;
  
  // Optional configurable settings (with sensible defaults)
  region?: {
    aws?: string;
    azure?: string;
    gcp?: string;
  };
  network?: {
    subnetCidr?: string; // Default subnet within networkCidr
  };
  terraformBridge?: {
    enabled?: boolean;
    provider?: 'aws' | 'azure' | 'gcp';
    delegateState?: boolean;
    sourcePath?: string;
  };
  terraform?: {
    backend?: {
      type?: 's3' | 'gcs' | 'azurerm' | 'local';
      bucket: string;
      prefix?: string;
    };
  };
  pulumiBridge?: {
    enabled?: boolean;
    provider?: 'aws' | 'azure' | 'gcp';
    delegateState?: boolean;
    sourcePath?: string;
  };
  
  // State management and migration settings
  migration?: {
    strategy?: DeploymentStrategy; // How to migrate from existing infrastructure
    sourceState?: string; // Path to existing Terraform state file for migration
    validateCompliance?: boolean; // Check compliance during migration
    rollbackPlan?: Array<{ description: string; notes?: string }>; // Rollback procedures
  };
  
  // Compliance and data sovereignty settings
  compliance?: {
    framework?: ComplianceFramework; // Compliance framework requirements
    frameworks?: ComplianceFramework[]; // Multiple compliance frameworks
    dataResidency?: {
      aws?: string; // AWS region for data residency
      azure?: string; // Azure region for data residency
      gcp?: string; // GCP region for data residency
    };
    encryptionAtRest?: boolean; // Require encryption at rest
    encryptionInTransit?: boolean; // Require encryption in transit
    auditLogging?: boolean; // Enable comprehensive audit logging
    privacyByDesign?: boolean; // Implement privacy by design principles
    dataMinimization?: boolean; // Implement data minimization
    purposeLimitation?: boolean; // Enforce purpose limitation
    consentManagement?: boolean; // Manage user consent
    dataSubjectRights?: boolean; // Support data subject rights
    breachNotification?: boolean; // Enable breach notification procedures
    privacyImpactAssessment?: boolean; // Conduct privacy impact assessments
    crossBorderTransfer?: boolean; // Allow cross-border data transfers
    retentionPolicy?: {
      defaultRetentionDays?: number; // Default data retention period
      piiRetentionDays?: number; // PII retention period
      auditLogRetentionDays?: number; // Audit log retention period
    };
    securityControls?: {
      mfaRequired?: boolean; // Require multi-factor authentication
      privilegedAccessManagement?: boolean; // Enable PAM
      networkSegmentation?: boolean; // Implement network segmentation
      vulnerabilityManagement?: boolean; // Enable vulnerability scanning
      malwareProtection?: boolean; // Enable malware protection
      backupAndRecovery?: boolean; // Enable backup and recovery
      disasterRecovery?: boolean; // Enable disaster recovery
      businessContinuity?: boolean; // Enable business continuity
      incidentResponse?: boolean; // Enable incident response
      securityMonitoring?: boolean; // Enable security monitoring
      complianceMonitoring?: boolean; // Enable compliance monitoring
    };
    privacyControls?: {
      dataClassification?: boolean; // Enable data classification
      dataLossPrevention?: boolean; // Enable DLP
      anonymization?: boolean; // Enable data anonymization
      pseudonymization?: boolean; // Enable data pseudonymization
      consentRecording?: boolean; // Record user consent
      privacyNotices?: boolean; // Manage privacy notices
      dataSubjectRequests?: boolean; // Handle data subject requests
      privacyTraining?: boolean; // Provide privacy training
      privacyAudits?: boolean; // Conduct privacy audits
    };
    cloudSpecificControls?: {
      sharedResponsibility?: boolean; // Define shared responsibilities
      cloudProviderAssessment?: boolean; // Assess cloud providers
      serviceLevelAgreements?: boolean; // Monitor SLAs
      cloudExitStrategy?: boolean; // Define cloud exit strategy
      multiCloudStrategy?: boolean; // Define multi-cloud strategy
      cloudNativeSecurity?: boolean; // Use cloud-native security
      cloudConfigurationManagement?: boolean; // Manage cloud configurations
      cloudMonitoring?: boolean; // Monitor cloud services
      cloudBackup?: boolean; // Backup cloud data
      cloudDisasterRecovery?: boolean; // Cloud disaster recovery
    };
  };

  // The Three Pillars
  k8s: KubernetesIntent;
  postgres: DatabaseIntent;
  adfs: AdfsIntent;
}

// Privacy Impact Assessment functionality
export interface PrivacyImpactAssessment {
  assessmentId: string;
  assessmentDate: Date;
  systemName: string;
  dataFlows: DataFlow[];
  risks: PrivacyRisk[];
  mitigations: Mitigation[];
  recommendations: string[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
  assessor: string;
}

export interface DataFlow {
  id: string;
  source: string;
  destination: string;
  dataTypes: string[];
  volume: 'low' | 'medium' | 'high';
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  retentionPeriod: number;
  crossBorder: boolean;
  thirdParties: string[];
}

export interface PrivacyRisk {
  id: string;
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  dataFlows: string[];
}

export interface Mitigation {
  id: string;
  riskId: string;
  description: string;
  implementationStatus: 'planned' | 'implemented' | 'verified';
  effectiveness: 'low' | 'medium' | 'high';
}

export function conductPrivacyImpactAssessment(system: ChiralSystem): PrivacyImpactAssessment {
  const assessment: PrivacyImpactAssessment = {
    assessmentId: `PIA-${Date.now()}`,
    assessmentDate: new Date(),
    systemName: system.projectName,
    dataFlows: [],
    risks: [],
    mitigations: [],
    recommendations: [],
    approvalStatus: 'pending',
    assessor: 'Chiral Platform'
  };

  // Analyze data flows
  if (system.postgres) {
    assessment.dataFlows.push({
      id: 'db-flow-1',
      source: 'Application',
      destination: 'PostgreSQL Database',
      dataTypes: ['user_data', 'personal_information'],
      volume: system.environment === 'prod' ? 'high' : 'medium',
      sensitivity: 'confidential',
      retentionPeriod: system.compliance?.retentionPolicy?.piiRetentionDays || 2555,
      crossBorder: system.region ? Object.keys(system.region).length > 1 : false,
      thirdParties: ['Cloud Provider']
    });
  }

  // Assess risks
  assessment.dataFlows.forEach(flow => {
    if (flow.sensitivity === 'confidential') {
      assessment.risks.push({
        id: `risk-${flow.id}`,
        description: `Privacy risk for ${flow.dataTypes.join(', ')} processing`,
        likelihood: 'medium',
        impact: 'high',
        riskLevel: 'medium',
        dataFlows: [flow.id]
      });
    }
  });

  // Define mitigations
  assessment.risks.forEach(risk => {
    assessment.mitigations.push({
      id: `mit-${risk.id}`,
      riskId: risk.id,
      description: 'Implement privacy controls and encryption',
      implementationStatus: system.compliance?.encryptionAtRest ? 'implemented' : 'planned',
      effectiveness: 'high'
    });
  });

  // Recommendations
  if (!system.compliance?.dataMinimization) {
    assessment.recommendations.push('Implement data minimization');
  }

  return assessment;
}
