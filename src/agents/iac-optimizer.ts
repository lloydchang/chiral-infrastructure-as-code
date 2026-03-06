// File: src/agents/iac-optimizer.ts

import { BaseAgent } from './base-agent';
import { ChiralSystem } from '../intent';
import { GeneratedIaC } from './iac-generator';

export interface OptimizationResult {
  optimizedIaC: GeneratedIaC;
  iterations: number;
  improvements: string[];
  finalMetrics: {
    cost: number;
    performance: number;
    security: number;
  };
}

export class IaCOptimizerAgent extends BaseAgent {
  private maxIterations = 3;
  private costTarget = 100; // Monthly cost threshold
  private performanceTarget = 0.8; // Performance score threshold

  constructor(cloudAgent: any) {
    super('IaCOptimizer', cloudAgent);
  }

  async process(config: ChiralSystem, generatedIaC: GeneratedIaC): Promise<OptimizationResult> {
    console.log(`[${this.name}] Optimizing IaC for ${generatedIaC.provider}`);

    // Receive message from IaCGenerator
    const messages = this.getMessages();
    const generationMessage = messages.find(m => m.type === 'generation');
    if (generationMessage) {
      generatedIaC = { ...generatedIaC, ...generationMessage.payload };
    }

    let currentIaC = generatedIaC;
    const improvements: string[] = [];
    let iteration = 0;

    while (iteration < this.maxIterations) {
      console.log(`[${this.name}] Optimization iteration ${iteration + 1}`);

      // Get feedback on current IaC
      const feedback = await this.getFeedback(currentIaC, config);

      // Check if targets met
      if (this.targetsMet(feedback)) {
        console.log(`[${this.name}] Optimization targets met at iteration ${iteration + 1}`);
        break;
      }

      // Refine IaC based on feedback
      const refinedIaC = await this.refineWithLLM(currentIaC, feedback, config);
      currentIaC = refinedIaC;
      improvements.push(`Iteration ${iteration + 1}: ${feedback.suggestions.join(', ')}`);

      iteration++;
    }

    const finalMetrics = await this.calculateMetrics(currentIaC);

    const result: OptimizationResult = {
      optimizedIaC: currentIaC,
      iterations: iteration,
      improvements,
      finalMetrics
    };

    console.log(`[${this.name}] Optimization complete: ${iteration} iterations, final cost: $${finalMetrics.cost}/month`);

    return result;
  }

  private async getFeedback(iaC: GeneratedIaC, config: ChiralSystem): Promise<{
    cost: number;
    performance: number;
    security: number;
    suggestions: string[];
  }> {
    // Simulate feedback - in production, this would deploy/test the IaC
    const feedback = {
      cost: await this.estimateCost(iaC),
      performance: this.estimatePerformance(iaC),
      security: this.estimateSecurity(iaC),
      suggestions: [] as string[]
    };

    // Generate suggestions based on metrics
    if (feedback.cost > this.costTarget) {
      feedback.suggestions.push('Reduce instance sizes for cost optimization');
    }
    if (feedback.performance < this.performanceTarget) {
      feedback.suggestions.push('Increase compute resources for better performance');
    }
    if (feedback.security < 0.9) {
      feedback.suggestions.push('Add encryption and access controls for better security');
    }

    return feedback;
  }

  private async estimateCost(iaC: GeneratedIaC): Promise<number> {
    // Use LLM to estimate cost based on IaC content
    const prompt = `
Estimate monthly cost for this IaC configuration:

Provider: ${iaC.provider}
Code: ${iaC.code.substring(0, 1000)}...

Return a single number representing estimated monthly cost in USD.
`;

    try {
      const response = await this.invokeLLM(prompt);
      const cost = parseFloat(response.replace(/[^\d.]/g, ''));
      return isNaN(cost) ? 150 : cost; // Fallback
    } catch {
      return 150; // Fallback estimate
    }
  }

  private estimatePerformance(iaC: GeneratedIaC): number {
    // Simple heuristic based on instance types in code
    let score = 0.5;
    if (iaC.code.includes('large') || iaC.code.includes('xlarge')) score += 0.3;
    if (iaC.code.includes('t3.') || iaC.code.includes('Standard_D')) score += 0.2;
    if (iaC.code.includes('encryption') || iaC.code.includes('ssl')) score += 0.1;
    return Math.min(score, 1.0);
  }

  private estimateSecurity(iaC: GeneratedIaC): number {
    let score = 0.5;
    if (iaC.code.includes('encrypt')) score += 0.2;
    if (iaC.code.includes('security') || iaC.code.includes('iam')) score += 0.2;
    if (iaC.code.includes('monitor') || iaC.code.includes('log')) score += 0.1;
    return Math.min(score, 1.0);
  }

  private targetsMet(feedback: any): boolean {
    return feedback.cost <= this.costTarget &&
           feedback.performance >= this.performanceTarget &&
           feedback.security >= 0.9;
  }

  private async refineWithLLM(iaC: GeneratedIaC, feedback: any, config: ChiralSystem): Promise<GeneratedIaC> {
    const prompt = `
Refine this IaC code based on feedback:

Current Code: ${iaC.code.substring(0, 2000)}...

Feedback:
- Cost: $${feedback.cost}/month (target: $${this.costTarget})
- Performance: ${(feedback.performance * 100).toFixed(1)}% (target: ${(this.performanceTarget * 100).toFixed(1)}%)
- Security: ${(feedback.security * 100).toFixed(1)}% (target: 90%)
- Suggestions: ${feedback.suggestions.join(', ')}

Configuration: ${JSON.stringify(config, null, 2)}

Generate improved ${iaC.language} code that addresses the feedback while maintaining functionality.
Focus on cost optimization, performance improvements, and security enhancements.
`;

    try {
      const refinedCode = await this.invokeLLM(prompt);
      return {
        ...iaC,
        code: this.validateAndFormatCode(refinedCode, iaC.language),
        artifacts: {
          ...iaC.artifacts,
          [`optimized.${iaC.language === 'typescript' ? 'ts' : iaC.language === 'hcl' ? 'tf' : 'bicep'}`]: refinedCode
        }
      };
    } catch (error) {
      console.warn(`[${this.name}] Refinement failed:`, error);
      return iaC; // Return unchanged
    }
  }

  private validateAndFormatCode(code: string, language: string): string {
    // Basic validation
    return code.trim();
  }

  private async calculateMetrics(iaC: GeneratedIaC): Promise<{ cost: number; performance: number; security: number }> {
    return {
      cost: await this.estimateCost(iaC),
      performance: this.estimatePerformance(iaC),
      security: this.estimateSecurity(iaC)
    };
  }
}
