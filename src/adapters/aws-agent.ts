// File: src/adapters/aws-agent.ts

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { ChiralSystem } from '../intent';
import { AwsCdkAdapter } from './programmatic/aws-cdk';
import * as cdk from 'aws-cdk-lib';

export class AwsAgentAdapter {
  private bedrockClient: BedrockRuntimeClient;

  constructor(region: string = 'us-east-1') {
    this.bedrockClient = new BedrockRuntimeClient({ region });
  }

  /**
   * Generate AWS CDK artifacts using agent assistance for optimization
   */
  async generateWithAgent(config: ChiralSystem, useAgent: boolean = true): Promise<string> {
    if (!useAgent) {
      // Fallback to deterministic generation
      const app = new cdk.App();
      const stack = new AwsCdkAdapter(app, 'AwsStack', config);
      app.synth();
      return 'CDK synthesis completed deterministically';
    }

    // Use Bedrock agent to enhance generation
    const intentDescription = this.buildIntentPrompt(config);
    const agentResponse = await this.invokeBedrockAgent(intentDescription);

    // Parse agent suggestions and apply to config if valid
    const enhancedConfig = this.applyAgentSuggestions(config, agentResponse);

    // Generate with enhanced config
    const app = new cdk.App();
    const stack = new AwsCdkAdapter(app, 'AwsStack', enhancedConfig);
    app.synth();

    return `Agent-enhanced CDK generated: ${agentResponse}`;
  }

  private buildIntentPrompt(config: ChiralSystem): string {
    return `
Generate optimized AWS CDK code for this infrastructure intent:

Project: ${config.projectName}
Environment: ${config.environment}
Network: ${config.networkCidr}

Kubernetes:
- Version: ${config.k8s.version}
- Nodes: ${config.k8s.minNodes}-${config.k8s.maxNodes}
- Size: ${config.k8s.size}

PostgreSQL:
- Version: ${config.postgres.engineVersion}
- Storage: ${config.postgres.storageGb}GB
- Size: ${config.postgres.size}

ADFS:
- Size: ${config.adfs.size}
- Windows: ${config.adfs.windowsVersion}

Provide CDK TypeScript code that implements this infrastructure securely and cost-effectively.
Focus on best practices for EKS, RDS, and EC2.
`;
  }

  private async invokeBedrockAgent(prompt: string): Promise<string> {
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
      contentType: 'application/json',
      accept: 'application/json'
    });

    try {
      const response = await this.bedrockClient.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));
      return result.content[0].text;
    } catch (error) {
      console.warn('Bedrock agent call failed, falling back to deterministic generation:', error);
      return 'Fallback to deterministic';
    }
  }

  private applyAgentSuggestions(originalConfig: ChiralSystem, agentResponse: string): ChiralSystem {
    // Simple parsing - in reality, use LLM to extract structured suggestions
    const enhancedConfig = { ...originalConfig };

    // Example: If agent suggests different instance types, apply them
    if (agentResponse.includes('t3.medium') && originalConfig.k8s.size === 'small') {
      // Keep original for determinism, or apply if validated
    }

    return enhancedConfig; // Return original for safety
  }

  async suggestMappings(unmappable: string[]): Promise<string[]> {
    const prompt = `
Analyze these unmappable Terraform resource types and suggest how they could be integrated into a Chiral system (focusing on K8s, Postgres, ADFS components).
Unmappable resources: ${unmappable.join(', ')}

Provide suggestions for each resource type on how to handle it in a multi-cloud Chiral deployment.
`;

    try {
      const response = await this.invokeBedrockAgent(prompt);
      return [response]; // Return suggestions
    } catch (error) {
      console.warn('Mapping suggestion failed:', error);
      return ['Fallback: Manual review required'];
    }
  }
}
