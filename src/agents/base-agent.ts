// File: src/agents/base-agent.ts

import { ChiralSystem } from '../intent';

export interface AgentMessage {
  from: string;
  to: string;
  type: 'analysis' | 'design' | 'plan' | 'generation' | 'optimization' | 'feedback';
  payload: any;
  timestamp: number;
}

export interface AgentTool {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
}

export abstract class BaseAgent {
  protected name: string;
  protected tools: Map<string, AgentTool> = new Map();
  protected messageQueue: AgentMessage[] = [];
  protected cloudAgent: any; // Reference to cloud-specific agent (Bedrock, OpenAI, etc.)

  constructor(name: string, cloudAgent: any) {
    this.name = name;
    this.cloudAgent = cloudAgent;

    // Add common tools
    this.addTool({
      name: 'file_read',
      description: 'Read file contents',
      execute: async (params: { path: string }) => {
        const fs = require('fs');
        return fs.readFileSync(params.path, 'utf8');
      }
    });

    this.addTool({
      name: 'file_write',
      description: 'Write content to file',
      execute: async (params: { path: string; content: string }) => {
        const fs = require('fs');
        const path = require('path');
        const dir = path.dirname(params.path);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(params.path, params.content);
        return 'File written successfully';
      }
    });

    this.addTool({
      name: 'terminal_execute',
      description: 'Execute terminal command',
      execute: async (params: { command: string }) => {
        const { execSync } = require('child_process');
        return execSync(params.command, { encoding: 'utf8' });
      }
    });
  }

  protected addTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  protected async invokeLLM(prompt: string): Promise<string> {
    // Delegate to cloud agent for LLM invocation
    if (this.cloudAgent && typeof this.cloudAgent.invokeBedrockAgent === 'function') {
      return await this.cloudAgent.invokeBedrockAgent(prompt);
    } else if (this.cloudAgent && typeof this.cloudAgent.invokeAzureAgent === 'function') {
      return await this.cloudAgent.invokeAzureAgent(prompt);
    } else if (this.cloudAgent && typeof this.cloudAgent.invokeGcpAgent === 'function') {
      return await this.cloudAgent.invokeGcpAgent(prompt);
    }
    return 'LLM not available, using deterministic fallback';
  }

  protected async executeTool(toolName: string, params: any): Promise<any> {
    const tool = this.tools.get(toolName);
    if (tool) {
      return await tool.execute(params);
    }
    throw new Error(`Tool ${toolName} not found`);
  }

  public sendMessage(to: string, type: AgentMessage['type'], payload: any): void {
    const message: AgentMessage = {
      from: this.name,
      to,
      type,
      payload,
      timestamp: Date.now()
    };
    // In a full implementation, this would send to a message bus
    console.log(`[${this.name}] Sending message to ${to}: ${type}`, payload);
    // For simplicity, store in queue for direct access
    this.messageQueue.push(message);
  }

  public receiveMessage(message: AgentMessage): void {
    this.messageQueue.push(message);
  }

  public getMessages(): AgentMessage[] {
    return this.messageQueue.splice(0); // Return and clear
  }

  public abstract process(config: ChiralSystem, input?: any): Promise<any>;
}
