// File: src/agents/workload-analyzer.ts

import { BaseAgent } from './base-agent';
import { ChiralSystem } from '../intent';

export interface WorkloadCharacteristics {
  storageType: 'columnar' | 'row' | 'hybrid';
  hasSIMD: boolean;
  resourceStats: {
    k8sNodes: { min: number; max: number; size: string };
    dbStorage: number;
    vmSize: string;
  };
  complianceRequirements: string[];
  scalingPatterns: 'horizontal' | 'vertical' | 'hybrid';
  joinPatterns: string[]; // e.g., ['k8s-db', 'k8s-vm']
  filterSelectivity: 'low' | 'medium' | 'high';
  dataLocality: 'regional' | 'multi-region';
  performanceTargets: {
    cost: boolean;
    speed: boolean;
    security: boolean;
  };
}

export class WorkloadAnalyzerAgent extends BaseAgent {
  constructor(cloudAgent: any) {
    super('WorkloadAnalyzer', cloudAgent);
  }

  async process(config: ChiralSystem): Promise<WorkloadCharacteristics> {
    console.log(`[${this.name}] Analyzing workload for project: ${config.projectName}`);

    // Basic deterministic analysis
    const basicAnalysis = this.analyzeDeterministically(config);

    // Enhanced LLM analysis for deeper insights
    const llmInsights = await this.analyzeWithLLM(config, basicAnalysis);

    // Combine and structure
    const characteristics: WorkloadCharacteristics = {
      ...basicAnalysis,
      ...llmInsights
    };

    console.log(`[${this.name}] Analysis complete:`, characteristics);

    // Send message to next agent (StorageDesigner)
    this.sendMessage('StorageDesigner', 'analysis', characteristics);

    return characteristics;
  }

  private analyzeDeterministically(config: ChiralSystem): Partial<WorkloadCharacteristics> {
    const k8s = config.k8s;
    const postgres = config.postgres;
    const adfs = config.adfs;

    return {
      storageType: k8s?.size === 'large' || postgres?.size === 'large' ? 'columnar' : 'row',
      hasSIMD: k8s?.maxNodes > 10, // Assume SIMD for large clusters
      resourceStats: {
        k8sNodes: { min: k8s?.minNodes || 1, max: k8s?.maxNodes || 3, size: k8s?.size || 'small' },
        dbStorage: postgres?.storageGb || 100,
        vmSize: adfs?.size || 'small'
      },
      complianceRequirements: this.extractCompliance(config),
      scalingPatterns: k8s?.maxNodes > 5 ? 'horizontal' : 'vertical',
      joinPatterns: ['k8s-postgres', 'k8s-adfs'],
      filterSelectivity: 'medium', // Default
      dataLocality: config.region && Object.keys(config.region).length > 1 ? 'multi-region' : 'regional',
      performanceTargets: {
        cost: config.environment === 'prod',
        speed: k8s?.maxNodes > 10,
        security: true // Always prioritize security
      }
    };
  }

  private extractCompliance(config: ChiralSystem): string[] {
    const compliance: string[] = [];
    if (config.compliance?.framework) {
      compliance.push(config.compliance.framework);
    }
    if (config.compliance?.encryptionAtRest) compliance.push('encryption');
    if (config.compliance?.auditLogging) compliance.push('audit');
    return compliance;
  }

  private async analyzeWithLLM(config: ChiralSystem, basic: any): Promise<Partial<WorkloadCharacteristics>> {
    const prompt = `
Analyze this Chiral infrastructure configuration for workload characteristics:

Configuration: ${JSON.stringify(config, null, 2)}

Basic Analysis: ${JSON.stringify(basic, null, 2)}

Provide deeper insights on:
- Optimal storage type (columnar/row/hybrid) based on workload patterns
- SIMD utilization potential
- Join patterns and filter selectivity
- Scaling recommendations
- Performance optimization targets

Return as JSON object with the fields from WorkloadCharacteristics interface.
`;

    try {
      const response = await this.invokeLLM(prompt);
      const insights = JSON.parse(response);
      return insights;
    } catch (error) {
      console.warn(`[${this.name}] LLM analysis failed:`, error);
      return {};
    }
  }
}
