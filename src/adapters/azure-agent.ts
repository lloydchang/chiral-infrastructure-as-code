// File: src/adapters/azure-agent.ts

import { AzureOpenAI } from '@azure/openai';
import { ChiralSystem } from '../intent';
import { AzureBicepAdapter } from './declarative/azure-bicep';

export class AzureAgentAdapter {
  private client: AzureOpenAI;

  constructor(endpoint: string, apiKey: string, deployment: string) {
    this.client = new AzureOpenAI({
      endpoint,
      apiKey,
      deployment,
      apiVersion: '2024-02-15-preview'
    });
  }

  /**
   * Generate Azure Bicep artifacts using agent assistance
   */
  async generateWithAgent(config: ChiralSystem, useAgent: boolean = true): Promise<string> {
    if (!useAgent) {
      // Fallback to deterministic generation
      return AzureBicepAdapter.generate(config);
    }

    // Use Azure AI agent to enhance generation
    const intentDescription = this.buildIntentPrompt(config);
    const agentResponse = await this.invokeAzureAgent(intentDescription);

    // Parse and apply suggestions
    const enhancedConfig = this.applyAgentSuggestions(config, agentResponse);

    // Generate Bicep
    return AzureBicepAdapter.generate(enhancedConfig);
  }

  private buildIntentPrompt(config: ChiralSystem): string {
    return `
Generate optimized Azure Bicep code for this infrastructure intent:

Project: ${config.projectName}
Environment: ${config.environment}
Network: ${config.networkCidr}

Kubernetes (AKS):
- Version: ${config.k8s.version}
- Nodes: ${config.k8s.minNodes}-${config.k8s.maxNodes}
- Size: ${config.k8s.size}

PostgreSQL (Azure Database):
- Version: ${config.postgres.engineVersion}
- Storage: ${config.postgres.storageGb}GB
- Size: ${config.postgres.size}

ADFS (VM):
- Size: ${config.adfs.size}
- Windows: ${config.adfs.windowsVersion}

Provide Bicep code that implements this infrastructure securely and cost-effectively.
Focus on best practices for AKS, Azure Database for PostgreSQL, and VMs.
`;
  }

  private async invokeAzureAgent(prompt: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1 // Low temperature for deterministic outputs
      });

      return response.choices[0].message.content || 'Agent response empty';
    } catch (error) {
      console.warn('Azure agent call failed, falling back to deterministic generation:', error);
      return 'Fallback to deterministic';
    }
  }

  private applyAgentSuggestions(originalConfig: ChiralSystem, agentResponse: string): ChiralSystem {
    // Simple implementation - enhance with LLM parsing for structured suggestions
    const enhancedConfig = { ...originalConfig };

    // Example: Apply agent-suggested optimizations if validated
    return enhancedConfig;
  }

  async suggestMappings(unmappable: string[]): Promise<string[]> {
    const prompt = `
Analyze these unmappable Terraform resource types and suggest how they could be integrated into a Chiral system (focusing on K8s, Postgres, ADFS components).
Unmappable resources: ${unmappable.join(', ')}

Provide suggestions for each resource type on how to handle it in a multi-cloud Chiral deployment.
`;

    try {
      const response = await this.invokeAzureAgent(prompt);
      return [response];
    } catch (error) {
      console.warn('Azure mapping suggestion failed:', error);
      return ['Fallback: Manual review required'];
    }
  }
}
