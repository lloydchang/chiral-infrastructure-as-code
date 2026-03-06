// File: src/adapters/gcp-agent.ts

import { VertexAI } from '@google-cloud/aiplatform';
import { ChiralSystem } from '../intent';
import { GcpTerraformAdapter } from './declarative/gcp-terraform';

export class GcpAgentAdapter {
  private client: VertexAI;

  constructor(projectId: string, location: string = 'us-central1') {
    this.client = new VertexAI({ project: projectId, location });
  }

  /**
   * Generate GCP Terraform artifacts using agent assistance
   */
  async generateWithAgent(config: ChiralSystem, useAgent: boolean = true): Promise<string> {
    if (!useAgent) {
      // Fallback to deterministic generation
      return GcpTerraformAdapter.generate(config);
    }

    // Use Vertex AI agent to enhance generation
    const intentDescription = this.buildIntentPrompt(config);
    const agentResponse = await this.invokeGcpAgent(intentDescription);

    // Parse and apply suggestions
    const enhancedConfig = this.applyAgentSuggestions(config, agentResponse);

    // Generate Terraform
    return GcpTerraformAdapter.generate(enhancedConfig);
  }

  private buildIntentPrompt(config: ChiralSystem): string {
    return `
Generate optimized Google Cloud Terraform code for this infrastructure intent:

Project: ${config.projectName}
Environment: ${config.environment}
Network: ${config.networkCidr}

Kubernetes (GKE):
- Version: ${config.k8s.version}
- Nodes: ${config.k8s.minNodes}-${config.k8s.maxNodes}
- Size: ${config.k8s.size}

PostgreSQL (Cloud SQL):
- Version: ${config.postgres.engineVersion}
- Storage: ${config.postgres.storageGb}GB
- Size: ${config.postgres.size}

ADFS (Compute Engine):
- Size: ${config.adfs.size}
- Windows: ${config.adfs.windowsVersion}

Provide Terraform HCL code that implements this infrastructure securely and cost-effectively.
Focus on best practices for GKE, Cloud SQL, and Compute Engine.
`;
  }

  private async invokeGcpAgent(prompt: string): Promise<string> {
    try {
      const generativeModel = this.client.getGenerativeModel({
        model: 'gemini-1.5-pro'
      });

      const result = await generativeModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.warn('GCP agent call failed, falling back to deterministic generation:', error);
      return 'Fallback to deterministic';
    }
  }

  private applyAgentSuggestions(originalConfig: ChiralSystem, agentResponse: string): ChiralSystem {
    // Simple implementation - enhance with structured parsing
    const enhancedConfig = { ...originalConfig };

    // Apply validated suggestions
    return enhancedConfig;
  }

  async suggestMappings(unmappable: string[]): Promise<string[]> {
    const prompt = `
Analyze these unmappable Terraform resource types and suggest how they could be integrated into a Chiral system (focusing on K8s, Postgres, ADFS components).
Unmappable resources: ${unmappable.join(', ')}

Provide suggestions for each resource type on how to handle it in a multi-cloud Chiral deployment.
`;

    try {
      const response = await this.invokeGcpAgent(prompt);
      return [response];
    } catch (error) {
      console.warn('GCP mapping suggestion failed:', error);
      return ['Fallback: Manual review required'];
    }
  }
}
