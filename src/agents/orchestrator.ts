// File: src/agents/orchestrator.ts

import { ChiralSystem } from '../intent';
import { BaseAgent, AgentMessage } from './base-agent';
import { AwsAgentAdapter } from '../adapters/aws-agent';
import { AzureAgentAdapter } from '../adapters/azure-agent';
import { GcpAgentAdapter } from '../adapters/gcp-agent';
import { AgentSecurityManager, SecurityConfig } from './security-manager';

export interface OrchestratorConfig {
  enableMultiAgent: boolean;
  securityConfig: SecurityConfig;
  fallbackToDeterministic: boolean;
  maxRetries: number;
  timeoutMs: number;
}

export interface GeneratedArtifacts {
  artifacts: {
    aws?: string;
    azure?: string;
    gcp?: string;
  };
  metadata: {
    generatedAt: Date;
    processingTime: number;
    agentEnhanced: boolean;
    agentsUsed: string[];
    fallbackTriggered: boolean;
  };
}

export interface AgentPipelineResult {
  success: boolean;
  artifacts: GeneratedArtifacts;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  performanceMetrics: {
    totalDuration: number;
    agentDurations: Record<string, number>;
    securityEvents: number;
  };
}

export class AgentOrchestrator {
  private config: OrchestratorConfig;
  private securityManager: AgentSecurityManager;
  private agents: Map<string, BaseAgent> = new Map();
  private messageQueue: AgentMessage[] = [];

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.securityManager = new AgentSecurityManager(config.securityConfig);
    this.initializeAgents();
  }

  /**
   * Execute complete multi-agent pipeline for infrastructure generation
   */
  async executePipeline(
    chiralConfig: ChiralSystem,
    providers: string[] = ['aws', 'azure', 'gcp']
  ): Promise<AgentPipelineResult> {
    const startTime = Date.now();
    const agentDurations: Record<string, number> = {};
    let securityEvents = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate input security
      const validation = this.securityManager.validateInput(chiralConfig, 'orchestrator-input');
      if (!validation.valid) {
        errors.push(`Security validation failed: ${validation.errors.join(', ')}`);
        securityEvents += validation.errors.length;
      }

      // Initialize agents for specified providers
      const activeAgents = this.getActiveAgents(providers);
      
      if (this.config.enableMultiAgent) {
        // Multi-agent workflow
        return await this.executeMultiAgentWorkflow(
          chiralConfig, 
          activeAgents, 
          startTime, 
          agentDurations,
          securityEvents,
          errors,
          warnings
        );
      } else {
        // Single-agent fallback
        return await this.executeSingleAgentWorkflow(
          chiralConfig,
          activeAgents,
          startTime,
          agentDurations,
          securityEvents,
          errors,
          warnings
        );
      }
    } catch (error) {
      const errorMessage = `Pipeline execution failed: ${error}`;
      errors.push(errorMessage);
      
      return {
        success: false,
        artifacts: {
          artifacts: {},
          metadata: {
            generatedAt: new Date(),
            processingTime: Date.now() - startTime,
            agentEnhanced: false,
            agentsUsed: [],
            fallbackTriggered: true
          }
        },
        errors,
        warnings,
        recommendations: ['Review pipeline configuration and agent availability'],
        performanceMetrics: {
          totalDuration: Date.now() - startTime,
          agentDurations,
          securityEvents
        }
      };
    }
  }

  /**
   * Handle agent failures with fallback strategies
   */
  async handleAgentFailure(
    failedAgentId: string,
    context: any,
    error: Error
  ): Promise<void> {
    // Log security event
    this.securityManager.logSecurityEvent({
      operation: 'agent-failure',
      agentId: failedAgentId,
      ipAddress: 'internal',
      userAgent: 'orchestrator',
      success: false,
      duration: 0,
      securityFlags: [`agent-failure: ${error.message}`]
    });

    // Attempt fallback strategies
    if (this.config.fallbackToDeterministic) {
      console.warn(`Agent ${failedAgentId} failed, attempting deterministic fallback`);
      // Implement deterministic fallback logic here
    }

    // Retry logic
    if (this.config.maxRetries > 0) {
      console.log(`Retrying agent ${failedAgentId} with ${this.config.maxRetries} attempts remaining`);
      // Implement retry logic here
    }
  }

  /**
   * Send messages between agents for coordination
   */
  async sendMessage(message: AgentMessage): Promise<void> {
    this.messageQueue.push(message);
    
    const targetAgent = this.agents.get(message.to);
    if (targetAgent) {
      try {
        await targetAgent.receiveMessage(message);
      } catch (error) {
        console.error(`Failed to deliver message to agent ${message.to}:`, error);
      }
    }
  }

  /**
   * Get agent status and health metrics
   */
  getAgentStatus(): Record<string, {
    healthy: boolean;
    lastActivity: Date;
    messageCount: number;
    errorCount: number;
  }> {
    const status: Record<string, any> = {};
    
    for (const [agentId, agent] of this.agents.entries()) {
      status[agentId] = {
        healthy: agent.isHealthy?.() || true,
        lastActivity: agent.getLastActivity?.() || new Date(),
        messageCount: agent.getMessageCount?.() || 0,
        errorCount: agent.getErrorCount?.() || 0
      };
    }
    
    return status;
  }

  /**
   * Get orchestrator performance metrics
   */
  getPerformanceMetrics(): {
    totalAgents: number;
    activeAgents: number;
    queuedMessages: number;
    securityEvents: number;
    averageResponseTime: number;
  } {
    const agentStatus = this.getAgentStatus();
    const activeCount = Object.values(agentStatus).filter(status => status.healthy).length;
    
    return {
      totalAgents: this.agents.size,
      activeAgents: activeCount,
      queuedMessages: this.messageQueue.length,
      securityEvents: this.securityManager.getSecurityMetrics().auditLogSize,
      averageResponseTime: this.calculateAverageResponseTime()
    };
  }

  private initializeAgents(): void {
    // Initialize AWS agent
    const awsAgent = new AwsAgentAdapter();
    this.agents.set('aws', awsAgent as any);

    // Initialize Azure agent
    const azureAgent = new AzureAgentAdapter();
    this.agents.set('azure', azureAgent as any);

    // Initialize GCP agent
    const gcpAgent = new GcpAgentAdapter();
    this.agents.set('gcp', gcpAgent as any);
  }

  private getActiveAgents(providers: string[]): Map<string, BaseAgent> {
    const activeAgents = new Map<string, BaseAgent>();
    
    for (const provider of providers) {
      const agent = this.agents.get(provider);
      if (agent) {
        activeAgents.set(provider, agent);
      }
    }
    
    return activeAgents;
  }

  private async executeMultiAgentWorkflow(
    config: ChiralSystem,
    agents: Map<string, BaseAgent>,
    startTime: number,
    agentDurations: Record<string, number>,
    securityEvents: number,
    errors: string[],
    warnings: string[]
  ): Promise<AgentPipelineResult> {
    const artifacts: GeneratedArtifacts['artifacts'] = {};
    const agentsUsed: string[] = [];

    // Execute agents in parallel with coordination
    const agentPromises = Array.from(agents.entries()).map(async ([provider, agent]) => {
      const agentStartTime = Date.now();
      
      try {
        // Send configuration to agent
        await this.sendMessage({
          from: 'orchestrator',
          to: provider,
          type: 'generation',
          payload: config,
          timestamp: Date.now()
        });

        // Execute agent-specific logic
        const result = await agent.execute(config);
        
        agentDurations[provider] = Date.now() - agentStartTime;
        agentsUsed.push(provider);
        
        // Store result based on agent type
        if (provider === 'aws') {
          artifacts.aws = result.artifacts?.aws;
        } else if (provider === 'azure') {
          artifacts.azure = result.artifacts?.azure;
        } else if (provider === 'gcp') {
          artifacts.gcp = result.artifacts?.gcp;
        }

        return result;
      } catch (error) {
        await this.handleAgentFailure(provider, config, error as Error);
        errors.push(`Agent ${provider} failed: ${error}`);
        securityEvents++;
        return null;
      }
    });

    await Promise.all(agentPromises);

    return {
      success: errors.length === 0,
      artifacts: {
        artifacts,
        metadata: {
          generatedAt: new Date(),
          processingTime: Date.now() - startTime,
          agentEnhanced: true,
          agentsUsed,
          fallbackTriggered: false
        }
      },
      errors,
      warnings,
      recommendations: this.generateRecommendations(errors, warnings),
      performanceMetrics: {
        totalDuration: Date.now() - startTime,
        agentDurations,
        securityEvents
      }
    };
  }

  private async executeSingleAgentWorkflow(
    config: ChiralSystem,
    agents: Map<string, BaseAgent>,
    startTime: number,
    agentDurations: Record<string, number>,
    securityEvents: number,
    errors: string[],
    warnings: string[]
  ): Promise<AgentPipelineResult> {
    // Use primary agent (AWS preferred) for single-agent workflow
    const primaryAgent = agents.get('aws') || agents.get('azure') || agents.get('gcp');
    
    if (!primaryAgent) {
      errors.push('No available agents for single-agent workflow');
      return this.createFailureResult(startTime, errors, warnings, agentDurations, securityEvents);
    }

    const agentStartTime = Date.now();
    const providerId = Array.from(agents.keys())[0];

    try {
      const result = await primaryAgent.execute(config);
      agentDurations[providerId] = Date.now() - agentStartTime;

      return {
        success: true,
        artifacts: {
          artifacts: result.artifacts,
          metadata: {
            generatedAt: new Date(),
            processingTime: Date.now() - startTime,
            agentEnhanced: true,
            agentsUsed: [providerId],
            fallbackTriggered: false
          }
        },
        errors,
        warnings,
        recommendations: this.generateRecommendations(errors, warnings),
        performanceMetrics: {
          totalDuration: Date.now() - startTime,
          agentDurations,
          securityEvents
        }
      };
    } catch (error) {
      await this.handleAgentFailure(providerId, config, error as Error);
      errors.push(`Primary agent ${providerId} failed: ${error}`);
      securityEvents++;
      
      return this.createFailureResult(startTime, errors, warnings, agentDurations, securityEvents);
    }
  }

  private createFailureResult(
    startTime: number,
    errors: string[],
    warnings: string[],
    agentDurations: Record<string, number>,
    securityEvents: number
  ): AgentPipelineResult {
    return {
      success: false,
      artifacts: {
        artifacts: {},
        metadata: {
          generatedAt: new Date(),
          processingTime: Date.now() - startTime,
          agentEnhanced: false,
          agentsUsed: [],
          fallbackTriggered: true
        }
      },
      errors,
      warnings,
      recommendations: ['Review agent configuration and availability'],
      performanceMetrics: {
        totalDuration: Date.now() - startTime,
        agentDurations,
        securityEvents
      }
    };
  }

  private generateRecommendations(errors: string[], warnings: string[]): string[] {
    const recommendations: string[] = [];

    if (errors.length > 0) {
      recommendations.push('Review error logs and agent configurations');
    }

    if (warnings.length > 0) {
      recommendations.push('Address warnings to improve reliability');
    }

    if (this.config.enableMultiAgent) {
      recommendations.push('Monitor agent coordination and message passing');
    }

    return recommendations;
  }

  private calculateAverageResponseTime(): number {
    // Calculate average response time from recent operations
    const logs = this.securityManager.getAuditLogs(1); // Last hour
    if (logs.length === 0) return 0;

    const totalDuration = logs.reduce((sum, log) => sum + log.duration, 0);
    return totalDuration / logs.length;
  }

  /**
   * Cleanup resources and perform maintenance
   */
  async cleanup(): Promise<void> {
    // Clean up expired sessions
    this.securityManager.cleanupExpiredSessions();
    
    // Clean up old messages
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    this.messageQueue = this.messageQueue.filter(msg => msg.timestamp > cutoff);
    
    console.log('Orchestrator cleanup completed');
  }
}
