// File: src/agents/storage-designer.ts

import { BaseAgent } from './base-agent';
import { ChiralSystem } from '../intent';
import { WorkloadCharacteristics } from './workload-analyzer';

export interface ResourceDesign {
  provider: 'aws' | 'azure' | 'gcp';
  k8s: {
    instanceType?: string; // e.g., 'm5.large', 'Standard_D4s_v3', 'n1-standard-2'
    nodeCount: number;
    storageType: string;
  };
  postgres: {
    instanceClass?: string; // e.g., 'db.t3.medium', 'GP_Gen5_4', 'db-custom-2-4096'
    storageGb: number;
    storageType: string;
  };
  adfs: {
    instanceType?: string; // e.g., 't3.medium', 'Standard_D2s_v3', 'n1-standard-1'
    storageType: string;
  };
  optimizations: {
    columnarEncoding: boolean;
    compression: boolean;
    caching: boolean;
  };
}

export class StorageDesignerAgent extends BaseAgent {
  constructor(cloudAgent: any) {
    super('StorageDesigner', cloudAgent);
  }

  async process(config: ChiralSystem, workload: WorkloadCharacteristics): Promise<ResourceDesign> {
    console.log(`[${this.name}] Designing storage for provider: ${this.getProvider(config)}`);

    // Receive message from WorkloadAnalyzer
    const messages = this.getMessages();
    const analysisMessage = messages.find(m => m.type === 'analysis');
    if (analysisMessage) {
      workload = { ...workload, ...analysisMessage.payload };
    }

    // Basic deterministic design
    const basicDesign = this.designDeterministically(config, workload);

    // Enhanced LLM design
    const optimizedDesign = await this.designWithLLM(config, workload, basicDesign);

    console.log(`[${this.name}] Design complete:`, optimizedDesign);

    // Send message to IaCPlanner
    this.sendMessage('IaCPlanner', 'design', optimizedDesign);

    return optimizedDesign;
  }

  private getProvider(config: ChiralSystem): 'aws' | 'azure' | 'gcp' {
    if (config.region?.aws) return 'aws';
    if (config.region?.azure) return 'azure';
    if (config.region?.gcp) return 'gcp';
    return 'aws'; // Default
  }

  private designDeterministically(config: ChiralSystem, workload: WorkloadCharacteristics): ResourceDesign {
    const provider = this.getProvider(config);
    const baseDesign: ResourceDesign = {
      provider,
      k8s: {
        nodeCount: workload.resourceStats.k8sNodes.max,
        storageType: workload.storageType === 'columnar' ? 'ssd' : 'hdd'
      },
      postgres: {
        storageGb: workload.resourceStats.dbStorage,
        storageType: workload.storageType === 'columnar' ? 'ssd' : 'hdd'
      },
      adfs: {
        storageType: 'ssd'
      },
      optimizations: {
        columnarEncoding: workload.storageType === 'columnar',
        compression: workload.resourceStats.dbStorage > 500,
        caching: workload.performanceTargets.speed
      }
    };

    // Provider-specific mappings
    if (provider === 'aws') {
      baseDesign.k8s.instanceType = this.mapAwsInstance(workload.resourceStats.k8sNodes.size);
      baseDesign.postgres.instanceClass = this.mapAwsDbInstance(workload.resourceStats.dbStorage);
      baseDesign.adfs.instanceType = this.mapAwsVmInstance(workload.resourceStats.vmSize);
    } else if (provider === 'azure') {
      baseDesign.k8s.instanceType = this.mapAzureInstance(workload.resourceStats.k8sNodes.size);
      baseDesign.postgres.instanceClass = this.mapAzureDbInstance(workload.resourceStats.dbStorage);
      baseDesign.adfs.instanceType = this.mapAzureVmInstance(workload.resourceStats.vmSize);
    } else if (provider === 'gcp') {
      baseDesign.k8s.instanceType = this.mapGcpInstance(workload.resourceStats.k8sNodes.size);
      baseDesign.postgres.instanceClass = this.mapGcpDbInstance(workload.resourceStats.dbStorage);
      baseDesign.adfs.instanceType = this.mapGcpVmInstance(workload.resourceStats.vmSize);
    }

    return baseDesign;
  }

  private mapAwsInstance(size: string): string {
    const mapping: { [key: string]: string } = { small: 't3.medium', medium: 'm5.large', large: 'm5.2xlarge' };
    return mapping[size] || 't3.medium';
  }

  private mapAwsDbInstance(storage: number): string {
    if (storage > 1000) return 'db.r5.large';
    if (storage > 500) return 'db.t3.large';
    return 'db.t3.medium';
  }

  private mapAwsVmInstance(size: string): string {
    const mapping: { [key: string]: string } = { small: 't3.medium', medium: 'm5.large', large: 'm5.2xlarge' };
    return mapping[size] || 't3.medium';
  }

  // Similar for Azure and GCP
  private mapAzureInstance(size: string): string {
    const mapping: { [key: string]: string } = { small: 'Standard_D2s_v3', medium: 'Standard_D4s_v3', large: 'Standard_D8s_v3' };
    return mapping[size] || 'Standard_D2s_v3';
  }

  private mapAzureDbInstance(storage: number): string {
    if (storage > 1000) return 'GP_Gen5_8';
    if (storage > 500) return 'GP_Gen5_4';
    return 'GP_Gen5_2';
  }

  private mapAzureVmInstance(size: string): string {
    const mapping: { [key: string]: string } = { small: 'Standard_D2s_v3', medium: 'Standard_D4s_v3', large: 'Standard_D8s_v3' };
    return mapping[size] || 'Standard_D2s_v3';
  }

  private mapGcpInstance(size: string): string {
    const mapping: { [key: string]: string } = { small: 'n1-standard-1', medium: 'n1-standard-2', large: 'n1-standard-4' };
    return mapping[size] || 'n1-standard-1';
  }

  private mapGcpDbInstance(storage: number): string {
    if (storage > 1000) return 'db-custom-4-8192';
    if (storage > 500) return 'db-custom-2-4096';
    return 'db-custom-1-2048';
  }

  private mapGcpVmInstance(size: string): string {
    const mapping: { [key: string]: string } = { small: 'n1-standard-1', medium: 'n1-standard-2', large: 'n1-standard-4' };
    return mapping[size] || 'n1-standard-1';
  }

  private async designWithLLM(config: ChiralSystem, workload: WorkloadCharacteristics, basic: ResourceDesign): Promise<ResourceDesign> {
    const prompt = `
Optimize cloud resource design for this Chiral configuration:

Configuration: ${JSON.stringify(config, null, 2)}
Workload Analysis: ${JSON.stringify(workload, null, 2)}
Basic Design: ${JSON.stringify(basic, null, 2)}

Provider: ${basic.provider}

Suggest optimized instance types, storage configurations, and optimizations considering:
- Cost-performance balance
- Workload patterns (${workload.scalingPatterns} scaling)
- Compliance requirements (${workload.complianceRequirements.join(', ')})
- Performance targets (${Object.keys(workload.performanceTargets).some(k => workload.performanceTargets[k as keyof typeof workload.performanceTargets]) ? Object.keys(workload.performanceTargets).filter(k => workload.performanceTargets[k as keyof typeof workload.performanceTargets]).join(', ') : ''})

Return optimized ResourceDesign JSON.
`;

    try {
      const response = await this.invokeLLM(prompt);
      const optimized = JSON.parse(response);
      return { ...basic, ...optimized };
    } catch (error) {
      console.warn(`[${this.name}] LLM design failed:`, error);
      return basic;
    }
  }
}
