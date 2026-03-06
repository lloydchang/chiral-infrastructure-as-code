// File: src/__tests__/agent-integration.test.ts

import { AwsAgentAdapter } from '../adapters/aws-agent';
import { AzureAgentAdapter } from '../adapters/azure-agent';
import { GcpAgentAdapter } from '../adapters/gcp-agent';
import { AgentOrchestrator, OrchestratorConfig } from '../agents/orchestrator';
import { AgentSecurityManager, SecurityConfig } from '../agents/security-manager';
import { ChiralSystem } from '../intent';

// Mock console methods - suppress all warnings/errors in tests
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock AWS SDK to suppress warnings in tests
jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({
      body: new TextEncoder().encode(JSON.stringify({
        content: [{ text: 'Mock agent response' }]
      }))
    })
  })),
  InvokeModelCommand: jest.fn()
}));

jest.mock('@aws-sdk/credential-providers', () => ({
  fromNodeProviderChain: jest.fn().mockResolvedValue({
    accessKeyId: 'test',
    secretAccessKey: 'test',
    sessionToken: 'test'
  })
}));

describe('Agent Integration Tests', () => {
  let testConfig: ChiralSystem;
  let securityConfig: SecurityConfig;
  let orchestratorConfig: OrchestratorConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleWarn.mockClear();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();

    testConfig = {
      projectName: 'test-project',
      environment: 'dev' as any,
      networkCidr: '10.0.0.0/16',
      k8s: {
        version: '1.29',
        minNodes: 1,
        maxNodes: 3,
        size: 'small'
      },
      postgres: {
        engineVersion: '15',
        storageGb: 20,
        size: 'small'
      },
      adfs: {
        size: 'small',
        windowsVersion: '2022'
      }
    };

    securityConfig = {
      enforceEncryption: true,
      requireMFA: true,
      enableAuditLogging: true,
      rateLimitPerMinute: 60,
      allowedIps: [],
      sessionTimeout: 3600
    };

    orchestratorConfig = {
      enableMultiAgent: true,
      securityConfig,
      fallbackToDeterministic: true,
      maxRetries: 3,
      timeoutMs: 30000
    };
  });

  afterEach(() => {
    mockConsoleWarn.mockRestore();
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('AWS Agent Adapter', () => {
    let awsAgent: AwsAgentAdapter;

    beforeEach(() => {
      awsAgent = new AwsAgentAdapter('us-east-1');
    });

    describe('generateArtifacts', () => {
      it('should generate AWS artifacts successfully', async () => {
        const result = await awsAgent.generateArtifacts(testConfig, ['aws']);
        
        expect(result).toBeDefined();
        expect(result.artifacts.aws).toBeDefined();
        expect(result.metadata.agentEnhanced).toBe(true);
        expect(result.metadata.processingTime).toBeGreaterThan(0);
      });

      it('should validate config before generation', async () => {
        const invalidConfig = { ...testConfig, projectName: '' };
        
        await expect(awsAgent.generateArtifacts(invalidConfig, ['aws']))
          .rejects.toThrow('Configuration validation failed');
      });
    });

    describe('validateConfig', () => {
      it('should validate valid configuration', async () => {
        const result = await awsAgent.validateConfig(testConfig);
        
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should detect invalid configuration', async () => {
        const invalidConfig = { ...testConfig, environment: 'invalid' as any };
        const result = await awsAgent.validateConfig(invalidConfig);
        
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('analyzeCosts', () => {
      it('should return cost analysis', async () => {
        const result = await awsAgent.analyzeCosts(testConfig);
        
        expect(result).toBeDefined();
        expect(result.comparison).toBeDefined();
        expect(result.recommendations).toBeInstanceOf(Array);
      });
    });

    describe('importIaC', () => {
      it('should handle IaC import with agentic enhancement', async () => {
        // Mock the import process
        jest.spyOn(awsAgent as any, 'suggestMappings').mockResolvedValue(['mock suggestion']);
        
        // This would normally read from a real file
        const mockSourcePath = '/mock/terraform/path';
        
        // Expect this to handle gracefully with mocks
        const result = await awsAgent.importIaC(mockSourcePath, 'aws', true);
        
        expect(result).toBeDefined();
        expect(result.projectName).toBeDefined();
      });
    });

    describe('checkCompliance', () => {
      it('should check compliance against frameworks', async () => {
        const result = await awsAgent.checkCompliance(testConfig, 'soc2');
        
        expect(result).toBeDefined();
        expect(typeof result.compliant).toBe('boolean');
        expect(Array.isArray(result.violations)).toBe(true);
        expect(Array.isArray(result.recommendations)).toBe(true);
      });
    });

    describe('detectDrift', () => {
      it('should detect drift in infrastructure', async () => {
        const mockArtifacts = { aws: 'mock-artifact' };
        const result = await awsAgent.detectDrift(testConfig, mockArtifacts);
        
        expect(result).toBeDefined();
        expect(typeof result.hasDrift).toBe('boolean');
        expect(Array.isArray(result.driftedResources)).toBe(true);
      });
    });
  });

  describe('Azure Agent Adapter', () => {
    let azureAgent: AzureAgentAdapter;

    beforeEach(() => {
      azureAgent = new AzureAgentAdapter('eastus');
    });

    describe('generateArtifacts', () => {
      it('should generate Azure artifacts successfully', async () => {
        const result = await azureAgent.generateArtifacts(testConfig, ['azure']);
        
        expect(result).toBeDefined();
        expect(result.artifacts.azure).toBeDefined();
        expect(result.metadata.agentEnhanced).toBe(true);
      });
    });

    describe('validateConfig', () => {
      it('should validate configuration for Azure', async () => {
        const result = await azureAgent.validateConfig(testConfig);
        
        expect(result).toBeDefined();
        expect(typeof result.valid).toBe('boolean');
      });
    });
  });

  describe('GCP Agent Adapter', () => {
    let gcpAgent: GcpAgentAdapter;

    beforeEach(() => {
      gcpAgent = new GcpAgentAdapter('us-central1');
    });

    describe('generateArtifacts', () => {
      it('should generate GCP artifacts successfully', async () => {
        const result = await gcpAgent.generateArtifacts(testConfig, ['gcp']);
        
        expect(result).toBeDefined();
        expect(result.artifacts.gcp).toBeDefined();
        expect(result.metadata.agentEnhanced).toBe(true);
      });
    });

    describe('validateConfig', () => {
      it('should validate configuration for GCP', async () => {
        const result = await gcpAgent.validateConfig(testConfig);
        
        expect(result).toBeDefined();
        expect(typeof result.valid).toBe('boolean');
      });
    });
  });

  describe('Agent Security Manager', () => {
    let securityManager: AgentSecurityManager;

    beforeEach(() => {
      securityManager = new AgentSecurityManager(securityConfig);
    });

    describe('validateInput', () => {
      it('should validate safe input', () => {
        const safeInput = 'Generate infrastructure for web application';
        const result = securityManager.validateInput(safeInput);
        
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.riskScore).toBe(0);
      });

      it('should detect SQL injection attempts', () => {
        const maliciousInput = "'; DROP TABLE users; --";
        const result = securityManager.validateInput(maliciousInput);
        
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.riskScore).toBeGreaterThan(0);
      });

      it('should detect XSS attempts', () => {
        const maliciousInput = '<script>alert("xss")</script>';
        const result = securityManager.validateInput(maliciousInput);
        
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.riskScore).toBeGreaterThan(0);
      });

      it('should detect command injection attempts', () => {
        const maliciousInput = 'rm -rf /; cat /etc/passwd';
        const result = securityManager.validateInput(maliciousInput);
        
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.riskScore).toBeGreaterThan(0);
      });
    });

    describe('encryptRequest', () => {
      it('should encrypt request data', () => {
        const data = { sensitive: 'information' };
        const agentId = 'test-agent';
        
        const encrypted = securityManager.encryptRequest(data, agentId);
        
        expect(encrypted).toBeDefined();
        expect(encrypted.data).toBeDefined();
        expect(encrypted.signature).toBeDefined();
        expect(encrypted.timestamp).toBeDefined();
        expect(encrypted.nonce).toBeDefined();
      });
    });

    describe('verifyRequest', () => {
      it('should verify valid request signature', () => {
        const data = { test: 'data' };
        const agentId = 'test-agent';
        const encrypted = securityManager.encryptRequest(data, agentId);
        
        const isValid = securityManager.verifyRequest(encrypted, agentId);
        
        expect(isValid).toBe(true);
      });

      it('should reject invalid request signature', () => {
        const encrypted = {
          data: 'invalid',
          signature: 'invalid',
          timestamp: Date.now(),
          nonce: 'invalid'
        };
        
        const isValid = securityManager.verifyRequest(encrypted, 'test-agent');
        
        expect(isValid).toBe(false);
      });
    });

    describe('checkRateLimit', () => {
      it('should allow requests within rate limit', () => {
        const agentId = 'test-agent';
        const ipAddress = '192.168.1.1';
        
        // Make requests within limit
        for (let i = 0; i < 10; i++) {
          const allowed = securityManager.checkRateLimit(agentId, ipAddress);
          expect(allowed).toBe(true);
        }
      });

      it('should block requests exceeding rate limit', () => {
        const agentId = 'test-agent';
        const ipAddress = '192.168.1.1';
        
        // Exceed rate limit (configured to 60 per minute)
        for (let i = 0; i < 65; i++) {
          securityManager.checkRateLimit(agentId, ipAddress);
        }
        
        const blocked = !securityManager.checkRateLimit(agentId, ipAddress);
        expect(blocked).toBe(true);
      });
    });

    describe('logSecurityEvent', () => {
      it('should log security events', () => {
        const event = {
          operation: 'test-operation',
          agentId: 'test-agent',
          ipAddress: '192.168.1.1',
          userAgent: 'test-agent',
          success: true,
          duration: 100,
          securityFlags: []
        };
        
        securityManager.logSecurityEvent(event);
        
        const logs = securityManager.getAuditLogs(1);
        expect(logs).toHaveLength(1);
        expect(logs[0].operation).toBe('test-operation');
      });
    });
  });

  describe('Agent Orchestrator', () => {
    let orchestrator: AgentOrchestrator;

    beforeEach(() => {
      orchestrator = new AgentOrchestrator(orchestratorConfig);
    });

    describe('executePipeline', () => {
      it('should execute multi-agent pipeline successfully', async () => {
        const result = await orchestrator.executePipeline(testConfig, ['aws']);
        
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result.artifacts.metadata.agentEnhanced).toBe(true);
        expect(result.performanceMetrics.totalDuration).toBeGreaterThan(0);
      });

      it('should handle pipeline failures gracefully', async () => {
        const invalidConfig = { ...testConfig, projectName: '' };
        const result = await orchestrator.executePipeline(invalidConfig, ['aws']);
        
        expect(result).toBeDefined();
        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('handleAgentFailure', () => {
      it('should handle agent failures with fallback', async () => {
        const error = new Error('Agent failed');
        const context = { config: testConfig };
        
        await expect(orchestrator.handleAgentFailure('aws', context, error))
          .resolves.not.toThrow();
      });
    });

    describe('getAgentStatus', () => {
      it('should return agent status information', () => {
        const status = orchestrator.getAgentStatus();
        
        expect(status).toBeDefined();
        expect(typeof status).toBe('object');
      });
    });

    describe('getPerformanceMetrics', () => {
      it('should return performance metrics', () => {
        const metrics = orchestrator.getPerformanceMetrics();
        
        expect(metrics).toBeDefined();
        expect(typeof metrics.totalAgents).toBe('number');
        expect(typeof metrics.activeAgents).toBe('number');
        expect(typeof metrics.queuedMessages).toBe('number');
      });
    });
  });

  describe('End-to-End Integration', () => {
    it('should complete full agent workflow', async () => {
      const orchestrator = new AgentOrchestrator(orchestratorConfig);
      
      // Execute full pipeline
      const result = await orchestrator.executePipeline(testConfig, ['aws', 'azure', 'gcp']);
      
      expect(result.success).toBe(true);
      expect(result.artifacts.artifacts.aws).toBeDefined();
      expect(result.performanceMetrics.totalDuration).toBeGreaterThan(0);
      expect(result.performanceMetrics.agentDurations).toBeDefined();
    });

    it('should handle security violations gracefully', async () => {
      const securityConfigWithRestrictions = {
        ...securityConfig,
        allowedIps: ['192.168.1.100'] // Restrict to specific IP
      };
      
      const orchestrator = new AgentOrchestrator({
        ...orchestratorConfig,
        securityConfig: securityConfigWithRestrictions
      });
      
      // This should handle IP restrictions gracefully
      const result = await orchestrator.executePipeline(testConfig, ['aws']);
      
      expect(result).toBeDefined();
      // Should either succeed or fail gracefully with proper error handling
    });
  });

  describe('Performance Tests', () => {
    it('should complete operations within reasonable time', async () => {
      const awsAgent = new AwsAgentAdapter();
      const startTime = Date.now();
      
      await awsAgent.validateConfig(testConfig);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent operations', async () => {
      const awsAgent = new AwsAgentAdapter();
      const azureAgent = new AzureAgentAdapter();
      const gcpAgent = new GcpAgentAdapter();
      
      const promises = [
        awsAgent.validateConfig(testConfig),
        azureAgent.validateConfig(testConfig),
        gcpAgent.validateConfig(testConfig)
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });
});
