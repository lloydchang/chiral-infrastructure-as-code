// Privacy Impact Assessment (PIA) functionality for ISO 27018 compliance

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
  retentionPeriod: number; // days
  crossBorder: boolean;
  thirdParties: string[];
}

export interface PrivacyRisk {
  id: string;
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  dataFlows: string[]; // references to data flow IDs
}

export interface Mitigation {
  id: string;
  riskId: string;
  description: string;
  implementationStatus: 'planned' | 'implemented' | 'verified';
  effectiveness: 'low' | 'medium' | 'high';
}

export function conductPrivacyImpactAssessment(system: any): PrivacyImpactAssessment {
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

  // Analyze data flows based on system configuration
  if (system.postgres) {
    assessment.dataFlows.push({
      id: 'db-flow-1',
      source: 'Application',
      destination: 'PostgreSQL Database',
      dataTypes: ['user_data', 'personal_information', 'transaction_data'],
      volume: system.environment === 'prod' ? 'high' : 'medium',
      sensitivity: 'confidential',
      retentionPeriod: system.compliance?.retentionPolicy?.piiRetentionDays || 2555, // 7 years
      crossBorder: system.region ? Object.keys(system.region).length > 1 : false,
      thirdParties: ['Cloud Provider']
    });
  }

  if (system.adfs) {
    assessment.dataFlows.push({
      id: 'auth-flow-1',
      source: 'User Authentication',
      destination: 'ADFS Service',
      dataTypes: ['authentication_data', 'identity_information'],
      volume: 'medium',
      sensitivity: 'confidential',
      retentionPeriod: 90, // 90 days
      crossBorder: false,
      thirdParties: []
    });
  }

  // Assess privacy risks
  assessment.dataFlows.forEach(flow => {
    if (flow.sensitivity === 'confidential' || flow.sensitivity === 'restricted') {
      assessment.risks.push({
        id: `risk-${flow.id}-1`,
        description: `Unauthorized access to ${flow.dataTypes.join(', ')} in ${flow.destination}`,
        likelihood: flow.volume === 'high' ? 'medium' : 'low',
        impact: 'high',
        riskLevel: 'medium',
        dataFlows: [flow.id]
      });
    }

    if (flow.crossBorder) {
      assessment.risks.push({
        id: `risk-${flow.id}-2`,
        description: `Cross-border data transfer compliance risk for ${flow.dataTypes.join(', ')}`,
        likelihood: 'medium',
        impact: 'medium',
        riskLevel: 'medium',
        dataFlows: [flow.id]
      });
    }
  });

  // Define mitigations
  assessment.risks.forEach(risk => {
    if (risk.description.includes('Unauthorized access')) {
      assessment.mitigations.push({
        id: `mit-${risk.id}`,
        riskId: risk.id,
        description: 'Implement encryption at rest and access controls',
        implementationStatus: system.compliance?.encryptionAtRest ? 'implemented' : 'planned',
        effectiveness: 'high'
      });
    }

    if (risk.description.includes('Cross-border')) {
      assessment.mitigations.push({
        id: `mit-${risk.id}-cb`,
        riskId: risk.id,
        description: 'Implement data residency controls and transfer agreements',
        implementationStatus: system.compliance?.dataResidency && Object.keys(system.compliance.dataResidency).length > 0 ? 'implemented' : 'planned',
        effectiveness: 'medium'
      });
    }
  });

  // Generate recommendations
  if (!system.compliance?.privacyImpactAssessment) {
    assessment.recommendations.push('Enable Privacy Impact Assessment in compliance settings');
  }

  if (!system.compliance?.dataMinimization) {
    assessment.recommendations.push('Implement data minimization principles');
  }

  if (!system.compliance?.consentManagement) {
    assessment.recommendations.push('Implement consent management for data processing');
  }

  return assessment;
}

export function validatePrivacyCompliance(system: any): { compliant: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!system.compliance?.privacyImpactAssessment) {
    issues.push('Privacy Impact Assessment not enabled');
  }

  if (!system.compliance?.dataMinimization) {
    issues.push('Data minimization not implemented');
  }

  if (!system.compliance?.encryptionAtRest) {
    issues.push('Encryption at rest not configured for PII protection');
  }

  if (system.region && Object.keys(system.region).length > 1 && !system.compliance?.crossBorderTransfer) {
    issues.push('Cross-border data transfers require explicit approval');
  }

  return {
    compliant: issues.length === 0,
    issues
  };
}
