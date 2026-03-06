// File: src/adapters/gcp-agent.ts

import { VertexAI } from '@google-cloud/vertexai';
import { ChiralSystem } from '../intent';
import { GcpTerraformAdapter } from './declarative/gcp-terraform';
import { validateChiralConfig, checkCompliance } from '../validation';
import { CostAnalyzer } from '../cost-analysis';
import { TerraformImportAdapter } from './declarative/terraform-adapter';

// Skill Response Interfaces (matching AWS/Azure agents)
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

export class GcpAgentAdapter {
  private vertexClient: VertexAI;
  private region: string;

  constructor(region: string = 'us-central1') {
    this.region = region;
    // Initialize Vertex AI client for GCP Vertex AI
    this.vertexClient = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT || '',
      location: region,
      googleAuthOptions: {
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      }
    });
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
      const response = await this.vertexClient.generateContent({
        model: 'gemini-1.5-pro',
        prompt: prompt,
        maxOutputTokens: 2000,
        temperature: 0.1 // Low temperature for deterministic outputs
      });
      return response.response?.text || 'No response from GCP agent';
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
