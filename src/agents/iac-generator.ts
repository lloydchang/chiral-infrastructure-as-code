// File: src/agents/iac-generator.ts

import { BaseAgent } from './base-agent';
import { ChiralSystem } from '../intent';
import { IaCPlan } from './iac-planner';
import { ResourceDesign } from './storage-designer';

export interface GeneratedIaC {
  provider: 'aws' | 'azure' | 'gcp';
  code: string;
  language: 'typescript' | 'hcl' | 'bicep';
  artifacts: { [filename: string]: string };
}

export class IaCGeneratorAgent extends BaseAgent {
  constructor(cloudAgent: any) {
    super('IaCGenerator', cloudAgent);
  }

  async process(config: ChiralSystem, plan: IaCPlan, design?: ResourceDesign): Promise<GeneratedIaC> {
    console.log(`[${this.name}] Generating IaC code for ${plan.provider}`);

    // Receive message from IaCPlanner
    const messages = this.getMessages();
    const planMessage = messages.find(m => m.type === 'plan');
    if (planMessage) {
      plan = { ...plan, ...planMessage.payload };
    }

    // Merge design if available
    const fullDesign = design || this.extractDesignFromPlan(plan);

    // Generate IaC code using LLM
    const generated = await this.generateWithLLM(config, plan, fullDesign);

    console.log(`[${this.name}] IaC generation complete: ${generated.language} code for ${generated.provider}`);

    // Send message to IaCOptimizer
    this.sendMessage('IaCOptimizer', 'generation', generated);

    return generated;
  }

  private extractDesignFromPlan(plan: IaCPlan): ResourceDesign {
    // Extract design info from plan if not provided separately
    // This is a fallback; ideally design is passed
    return {
      provider: plan.provider,
      k8s: { nodeCount: 3, storageType: 'ssd' },
      postgres: { storageGb: 100, storageType: 'ssd' },
      adfs: { storageType: 'ssd' },
      optimizations: { columnarEncoding: false, compression: false, caching: false }
    };
  }

  private async generateWithLLM(config: ChiralSystem, plan: IaCPlan, design: ResourceDesign): Promise<GeneratedIaC> {
    const provider = plan.provider;

    let language: 'typescript' | 'hcl' | 'bicep';
    let framework: string;

    if (provider === 'aws') {
      language = 'typescript';
      framework = 'AWS CDK';
    } else if (provider === 'azure') {
      language = 'bicep';
      framework = 'Azure Bicep';
    } else {
      language = 'hcl';
      framework = 'Google Cloud Terraform';
    }

    const prompt = `
Generate optimized IaC code for this Chiral infrastructure configuration using ${framework}:

Configuration: ${JSON.stringify(config, null, 2)}
Execution Plan: ${JSON.stringify(plan, null, 2)}
Resource Design: ${JSON.stringify(design, null, 2)}

Requirements:
- Use ${language} syntax
- Implement all steps from the execution plan
- Use the specified instance types and configurations from design
- Include proper dependencies and resource references
- Add security best practices (encryption, access controls)
- Optimize for cost and performance
- Include monitoring and logging where appropriate

Generate complete, runnable ${framework} code that deploys the full Chiral infrastructure (K8s cluster, PostgreSQL database, ADFS VM).

Return the generated code as a string, properly formatted and commented.
`;

    try {
      const code = await this.invokeLLM(prompt);

      // Validate and format the code
      const validatedCode = this.validateAndFormatCode(code, language);

      return {
        provider,
        code: validatedCode,
        language,
        artifacts: {
          [`main.${language === 'typescript' ? 'ts' : language === 'hcl' ? 'tf' : 'bicep'}`]: validatedCode
        }
      };
    } catch (error) {
      console.warn(`[${this.name}] IaC generation failed:`, error);
      // Fallback to deterministic generation
      const fallbackCode = this.generateFallback(config, plan, design);
      return {
        provider,
        code: fallbackCode,
        language,
        artifacts: {
          [`main.${language === 'typescript' ? 'ts' : language === 'hcl' ? 'tf' : 'bicep'}`]: fallbackCode
        }
      };
    }
  }

  private validateAndFormatCode(code: string, language: string): string {
    // Basic validation - in production, use linters/formatters
    if (!code || code.length < 100) {
      throw new Error('Generated code too short or empty');
    }

    // Basic formatting
    return code.trim();
  }

  private generateFallback(config: ChiralSystem, plan: IaCPlan, design: ResourceDesign): string {
    // Fallback to existing adapters if LLM fails
    console.log(`[${this.name}] Using fallback generation`);

    if (plan.provider === 'aws') {
      // Use existing AwsCdkAdapter logic
      return `// Fallback CDK code for ${config.projectName}
// Generated deterministically due to LLM failure
// TODO: Implement full CDK generation`;
    } else if (plan.provider === 'azure') {
      // Use existing AzureBicepAdapter logic
      return `// Fallback Bicep code for ${config.projectName}
// Generated deterministically due to LLM failure
// TODO: Implement full Bicep generation`;
    } else {
      // Use existing GcpTerraformAdapter logic
      return `// Fallback Terraform code for ${config.projectName}
// Generated deterministically due to LLM failure
# TODO: Implement full Terraform generation`;
    }
  }
}
