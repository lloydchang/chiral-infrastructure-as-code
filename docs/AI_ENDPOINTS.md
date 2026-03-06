# AI Service Endpoints Configuration

This document provides configuration for AI service endpoints used in Chiral's agent integration.

## 🤖 **AWS Bedrock Configuration**

### **Endpoint Setup**
```typescript
// src/config/ai-endpoints.ts
export const AI_ENDPOINTS = {
  aws: {
    bedrock: {
      region: process.env.AWS_BEDROCK_REGION || 'us-east-1',
      endpoint: process.env.AWS_BEDROCK_ENDPOINT || undefined,
      models: {
        claude: 'anthropic.claude-3-sonnet-20240229-v1:0',
        titan: 'amazon.titan-text-express-v1',
        llama2: 'meta.llama2-13b-chat-v1'
      }
    }
  },
  azure: {
    openai: {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: '2024-02-15-preview',
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4'
    }
  },
  gcp: {
    vertexai: {
      project: process.env.GCP_PROJECT_ID,
      location: process.env.GCP_LOCATION || 'us-central1',
      endpoint: 'https://vertexai.googleapis.com',
      models: {
        gemini: 'gemini-pro',
        palm: 'text-bison-32k'
      }
    }
  }
};
```

### **Environment Variables**
```bash
# AWS Bedrock
export AWS_BEDROCK_REGION=us-east-1
export AWS_BEDROCK_ENDPOINT=  # Optional custom endpoint

# Azure OpenAI
export AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
export AZURE_OPENAI_API_KEY=your-api-key
export AZURE_OPENAI_DEPLOYMENT=gpt-4

# GCP Vertex AI
export GCP_PROJECT_ID=your-gcp-project
export GCP_LOCATION=us-central1
```

## 🔧 **Agent Service Integration**

### **AWS Bedrock Agent**
```typescript
// src/adapters/aws-agent.ts
export class AwsAgentAdapter {
  private bedrockClient: BedrockRuntimeClient;
  private endpoints: typeof AI_ENDPOINTS.aws;

  constructor(region: string = 'us-east-1') {
    this.endpoints = AI_ENDPOINTS.aws;
    this.bedrockClient = new BedrockRuntimeClient({ 
      region: this.endpoints.bedrock.region,
      endpoint: this.endpoints.bedrock.endpoint
    });
  }

  async invokeModel(prompt: string, model?: string): Promise<string> {
    const command = new InvokeModelCommand({
      modelId: model || this.endpoints.bedrock.models.claude,
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      }),
      contentType: 'application/json',
      accept: 'application/json'
    });

    try {
      const response = await this.bedrockClient.send(command);
      return new TextDecoder().decode(response.body);
    } catch (error) {
      console.error('Bedrock invocation failed:', error);
      throw new Error(`AI service error: ${error}`);
    }
  }
}
```

### **Azure OpenAI Agent**
```typescript
// src/adapters/azure-agent.ts
export class AzureAgentAdapter {
  private openaiConfig: typeof AI_ENDPOINTS.azure.openai;

  constructor() {
    this.openaiConfig = AI_ENDPOINTS.azure.openai;
    
    if (!this.openaiConfig.endpoint || !this.openaiConfig.apiKey) {
      throw new Error('Azure OpenAI configuration missing');
    }
  }

  async invokeModel(prompt: string): Promise<string> {
    const response = await fetch(
      `${this.openaiConfig.endpoint}/openai/deployments/${this.openaiConfig.deployment}/chat/completions?api-version=${this.openaiConfig.apiVersion}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.openaiConfig.apiKey
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.7
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure OpenAI error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
  }
}
```

### **GCP Vertex AI Agent**
```typescript
// src/adapters/gcp-agent.ts
export class GcpAgentAdapter {
  private vertexaiConfig: typeof AI_ENDPOINTS.gcp.vertexai;

  constructor() {
    this.vertexaiConfig = AI_ENDPOINTS.gcp.vertexai;
  }

  async invokeModel(prompt: string, model?: string): Promise<string> {
    const { VertexAI } = require('@google-cloud/vertexai');
    
    const vertexAI = new VertexAI({
      project: this.vertexaiConfig.project,
      location: this.vertexaiConfig.location
    });

    const modelInstance = vertexAI.preview.getGenerativeModel({
      model: model || this.vertexaiConfig.models.gemini,
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.7
      }
    });

    try {
      const response = await modelInstance.generateContent(prompt);
      return response.response.text();
    } catch (error) {
      console.error('Vertex AI invocation failed:', error);
      throw new Error(`AI service error: ${error}`);
    }
  }
}
```

## 🛡️ **Security & Performance**

### **Authentication**
- **AWS**: Uses IAM roles and AWS SDK credential chain
- **Azure**: API key authentication with Azure AD
- **GCP**: Service account authentication

### **Rate Limiting**
```typescript
export const RATE_LIMITS = {
  aws: { requestsPerSecond: 10, tokensPerMinute: 40000 },
  azure: { requestsPerSecond: 120, tokensPerMinute: 120000 },
  gcp: { requestsPerSecond: 60, tokensPerMinute: 32000 }
};
```

### **Fallback Strategy**
```typescript
export class AgentFallback {
  static async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    error: Error
  ): Promise<T> {
    console.warn('Primary AI service failed, using fallback:', error);
    return await fallback();
  }
}
```

## 📊 **Monitoring & Metrics**

### **Performance Tracking**
```typescript
export interface AIMetrics {
  provider: 'aws' | 'azure' | 'gcp';
  model: string;
  latency: number;
  tokensUsed: number;
  success: boolean;
  error?: string;
}
```

### **Health Checks**
```typescript
export class AIHealthCheck {
  static async checkAWS(): Promise<boolean> {
    // Test Bedrock connectivity
  }
  
  static async checkAzure(): Promise<boolean> {
    // Test OpenAI connectivity
  }
  
  static async checkGCP(): Promise<boolean> {
    // Test Vertex AI connectivity
  }
}
```

## 🚀 **Usage Examples**

### **Multi-Provider Orchestration**
```typescript
const orchestrator = new AgentOrchestrator({
  providers: ['aws', 'azure', 'gcp'],
  fallbackStrategy: 'deterministic',
  rateLimiting: true,
  monitoring: true
});

const result = await orchestrator.generateArtifacts(config);
```

### **Single Provider with Fallback**
```typescript
const awsAgent = new AwsAgentAdapter();
const azureAgent = new AzureAgentAdapter();

const artifacts = await AgentFallback.withFallback(
  () => awsAgent.generateArtifacts(config),
  () => azureAgent.generateArtifacts(config),
  new Error('AWS service unavailable')
);
```

## 📋 **Deployment Checklist**

- [ ] Configure environment variables for AI endpoints
- [ ] Set up IAM roles for AWS Bedrock access
- [ ] Deploy Azure OpenAI resource and get API keys
- [ ] Enable Vertex AI API in GCP project
- [ ] Configure rate limiting and monitoring
- [ ] Test fallback mechanisms
- [ ] Set up health checks and alerting

This configuration enables production-ready AI service integration with proper security, monitoring, and fallback mechanisms.
