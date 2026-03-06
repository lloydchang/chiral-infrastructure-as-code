// File: src/agents/iac-planner.ts

import { BaseAgent } from './base-agent';
import { ChiralSystem } from '../intent';
import { ResourceDesign } from './storage-designer';

export interface IaCPlan {
  provider: 'aws' | 'azure' | 'gcp';
  steps: IaCStep[];
  dependencies: { [resource: string]: string[] };
  executionStrategy: 'parallel' | 'sequential' | 'hybrid';
  optimizations: {
    batching: boolean;
    caching: boolean;
    conditionalCreation: boolean;
  };
}

export interface IaCStep {
  id: string;
  type: 'network' | 'compute' | 'storage' | 'security' | 'monitoring';
  resource: string;
  action: 'create' | 'configure' | 'connect';
  priority: number; // Lower number = higher priority
  dependencies: string[];
}

export class IaCPlannerAgent extends BaseAgent {
  constructor(cloudAgent: any) {
    super('IaCPlanner', cloudAgent);
  }

  async process(config: ChiralSystem, design: ResourceDesign): Promise<IaCPlan> {
    console.log(`[${this.name}] Planning IaC execution for ${design.provider}`);

    // Receive message from StorageDesigner
    const messages = this.getMessages();
    const designMessage = messages.find(m => m.type === 'design');
    if (designMessage) {
      design = { ...design, ...designMessage.payload };
    }

    // Basic deterministic planning
    const basicPlan = this.planDeterministically(config, design);

    // Enhanced LLM planning
    const optimizedPlan = await this.planWithLLM(config, design, basicPlan);

    console.log(`[${this.name}] Plan complete with ${optimizedPlan.steps.length} steps`);

    // Send message to IaCGenerator
    this.sendMessage('IaCGenerator', 'plan', optimizedPlan);

    return optimizedPlan;
  }

  private planDeterministically(config: ChiralSystem, design: ResourceDesign): IaCPlan {
    const steps: IaCStep[] = [];

    // Network infrastructure first
    steps.push({
      id: 'vpc',
      type: 'network',
      resource: 'VPC/Network',
      action: 'create',
      priority: 1,
      dependencies: []
    });

    steps.push({
      id: 'subnets',
      type: 'network',
      resource: 'Subnets',
      action: 'create',
      priority: 2,
      dependencies: ['vpc']
    });

    steps.push({
      id: 'security',
      type: 'security',
      resource: 'Security Groups/Rules',
      action: 'create',
      priority: 3,
      dependencies: ['vpc']
    });

    // Database next
    steps.push({
      id: 'postgres',
      type: 'storage',
      resource: 'PostgreSQL Database',
      action: 'create',
      priority: 4,
      dependencies: ['subnets', 'security']
    });

    // Compute resources
    steps.push({
      id: 'k8s_cluster',
      type: 'compute',
      resource: 'Kubernetes Cluster',
      action: 'create',
      priority: 5,
      dependencies: ['subnets', 'security']
    });

    steps.push({
      id: 'k8s_nodes',
      type: 'compute',
      resource: 'K8s Nodes',
      action: 'create',
      priority: 6,
      dependencies: ['k8s_cluster']
    });

    steps.push({
      id: 'adfs_vm',
      type: 'compute',
      resource: 'ADFS VM',
      action: 'create',
      priority: 7,
      dependencies: ['subnets', 'security']
    });

    // Connections and configurations
    steps.push({
      id: 'connections',
      type: 'network',
      resource: 'Network Connections',
      action: 'connect',
      priority: 8,
      dependencies: ['k8s_cluster', 'postgres', 'adfs_vm']
    });

    steps.push({
      id: 'monitoring',
      type: 'monitoring',
      resource: 'Monitoring Setup',
      action: 'configure',
      priority: 9,
      dependencies: ['connections']
    });

    const dependencies = this.buildDependencies(steps);

    return {
      provider: design.provider,
      steps,
      dependencies,
      executionStrategy: design.k8s.nodeCount > 10 ? 'parallel' : 'sequential',
      optimizations: {
        batching: design.optimizations.columnarEncoding,
        caching: design.optimizations.caching,
        conditionalCreation: true
      }
    };
  }

  private buildDependencies(steps: IaCStep[]): { [resource: string]: string[] } {
    const deps: { [resource: string]: string[] } = {};
    steps.forEach(step => {
      deps[step.id] = step.dependencies;
    });
    return deps;
  }

  private async planWithLLM(config: ChiralSystem, design: ResourceDesign, basic: IaCPlan): Promise<IaCPlan> {
    const prompt = `
Optimize IaC execution plan for this Chiral configuration:

Configuration: ${JSON.stringify(config, null, 2)}
Resource Design: ${JSON.stringify(design, null, 2)}
Basic Plan: ${JSON.stringify(basic, null, 2)}

Provider: ${design.provider}

Suggest optimized execution plan considering:
- Resource dependencies and creation order
- Parallel vs sequential execution
- Batching opportunities
- Cost optimization through resource grouping
- Security-first approach

Return optimized IaCPlan JSON with steps, dependencies, and execution strategy.
`;

    try {
      const response = await this.invokeLLM(prompt);
      const optimized = JSON.parse(response);
      return { ...basic, ...optimized };
    } catch (error) {
      console.warn(`[${this.name}] LLM planning failed:`, error);
      return basic;
    }
  }
}
