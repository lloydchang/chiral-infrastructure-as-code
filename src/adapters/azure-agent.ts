// File: src/adapters/azure-agent.ts

import { OpenAIAgent } from '@azure/arm-openai';
import { ChiralSystem } from '../intent';
import { AzureBicepAdapter } from './declarative/azure-bicep';
import { validateChiralConfig, checkCompliance } from '../validation';
import { CostAnalyzer } from '../cost-analysis';
import { TerraformImportAdapter } from './declarative/terraform-adapter';

// Skill Response Interfaces (matching AWS agent)
export interface ArtifactResponse {
  artifacts: {
    aws?: string;
    azure?: string;
    gcp?: string;
  };
  metadata: {
    generatedAt: Date;
    agentEnhanced: boolean;
    processingTime: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface CostAnalysis {
  comparison: any;
  recommendations: string[];
}

export interface ComplianceResult {
  compliant: boolean;
  violations: Array<{
    id?: string;
    severity?: 'high' | 'medium' | 'low';
    description?: string;
    remediation?: string;
  }>; 
  recommendations: string[];
}

export interface DriftResult {
  hasDrift: boolean;
  driftedResources: string[];
  missingResources: string[];
  addedResources: string[];
  summary: string;
}

export class AzureAgentAdapter {
  private client: OpenAIAgent;
  private region: string;

  constructor(region: string = 'eastus') {
    this.region = region;
    // Initialize OpenAI client for Azure AI Foundry
    this.client = new OpenAIAgent({
      endpoint: `https://${region}.api.cognitive.microsoft.com`,
      apiKey: process.env.AZURE_OPENAI_KEY || '',
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
      const response = await this.client.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1 // Low temperature for deterministic outputs
      });

      return response.choices[0]?.message?.content || 'No response from Azure agent';
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
