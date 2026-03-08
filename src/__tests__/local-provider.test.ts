// Tests for local provider functionality
import { LocalAgentAdapter } from '../adapters/local-agent';
import { LocalArtifactGenerator } from '../adapters/local-artifacts-generator';
import { ChiralSystem } from '../intent';
import { mapInstanceTypeToWorkloadSize, mapDbClassToWorkloadSize } from '../translation/import-map';

describe('Local Provider Functionality', () => {
  let testConfig: ChiralSystem;
  let localAgent: LocalAgentAdapter;

  beforeEach(() => {
    testConfig = {
      projectName: 'test-project',
      environment: 'dev',
      networkCidr: '192.168.65.0/24',
      region: { local: 'localhost' },
      k8s: {
        version: '1.27',
        minNodes: 1,
        maxNodes: 3,
        size: 'small'
      },
      postgres: {
        engineVersion: '15',
        storageGb: 20, // Increased to meet validation requirements
        size: 'small'
      },
      adfs: {
        size: 'small',
        windowsVersion: '2022'
      },
      compliance: {
        framework: 'none', // Disable strict compliance for local dev
        encryptionAtRest: true,
        encryptionInTransit: true
      }
    };

    localAgent = new LocalAgentAdapter('localhost');
  });

  describe('Local Agent Adapter', () => {
    describe('generateArtifacts', () => {
      it('should generate local artifacts successfully', async () => {
        const result = await localAgent.generateArtifacts(testConfig, ['local']);
        
        expect(result.artifacts).toBeDefined();
        expect(result.artifacts.local).toBeDefined();
        expect(result.metadata.agentEnhanced).toBe(false);
        expect(result.metadata.processingTime).toBeGreaterThan(0);
      });

      it('should generate multi-provider artifacts including local', async () => {
        const result = await localAgent.generateArtifacts(testConfig, ['local', 'aws', 'azure', 'gcp']);
        
        expect(result.artifacts.local).toBeDefined();
        expect(result.artifacts.aws).toBeDefined();
        expect(result.artifacts.azure).toBeDefined();
        expect(result.artifacts.gcp).toBeDefined();
      });
    });

    describe('validateConfig', () => {
      it('should validate valid configuration', async () => {
        const result = await localAgent.validateConfig(testConfig);
        
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle invalid configuration', async () => {
        const invalidConfig = { ...testConfig, projectName: '' };
        const result = await localAgent.validateConfig(invalidConfig);
        
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('analyzeCosts', () => {
      it('should include local provider with zero cost', async () => {
        const result = await localAgent.analyzeCosts(testConfig);
        
        expect(result.comparison.estimates.local).toBeDefined();
        expect(result.comparison.estimates.local.totalCost).toBe(0);
        expect(result.comparison.cheapest.provider).toBe('local');
        expect(result.comparison.cheapest.cost).toBe(0);
        expect(result.comparison.cheapest.savings).toBe(100);
      });
    });

    describe('importIaC', () => {
      it('should import local IaC configuration', async () => {
        const result = await localAgent.importIaC('./test-compose.yml', 'local');
        
        expect(result.projectName).toBe('local-development');
        expect(result.environment).toBe('dev');
        expect(result.region?.local).toBe('localhost');
      });
    });

    describe('checkCompliance', () => {
      it('should check compliance for local environment', async () => {
        const result = await localAgent.checkCompliance(testConfig, 'soc2');
        
        expect(result.compliant).toBeDefined();
        expect(result.recommendations).toBeDefined();
        expect(Array.isArray(result.violations)).toBe(true);
      });
    });

    describe('detectDrift', () => {
      it('should detect drift in local environment', async () => {
        const artifacts = { local: 'test-artifacts' };
        const result = await localAgent.detectDrift(testConfig, artifacts);
        
        expect(result.hasDrift).toBeDefined();
        expect(Array.isArray(result.remediation)).toBe(true);
      });
    });
  });

  describe('Local Artifact Generator', () => {
    let artifactGenerator: LocalArtifactGenerator;

    beforeEach(() => {
      artifactGenerator = new LocalArtifactGenerator(testConfig, {
        environment: 'docker-compose',
        includeMonitoring: true,
        includeIngress: true,
        includePersistence: true,
        resourceLimits: true
      });
    });

    describe('generateAllArtifacts', () => {
      it('should generate all required artifact files', () => {
        const artifacts = artifactGenerator.generateAllArtifacts();
        
        // Core files
        expect(artifacts['docker-compose.yml']).toBeDefined();
        expect(artifacts['docker-compose.dev.yml']).toBeDefined();
        expect(artifacts['docker-compose.prod.yml']).toBeDefined();
        
        // Kubernetes manifests
        expect(artifacts['k8s/namespace.yaml']).toBeDefined();
        expect(artifacts['k8s/postgres.yaml']).toBeDefined();
        expect(artifacts['k8s/adfs.yaml']).toBeDefined();
        expect(artifacts['k8s/configmap.yaml']).toBeDefined();
        
        // Configuration files
        expect(artifacts['kind-config.yaml']).toBeDefined();
        expect(artifacts['k3s-config.yaml']).toBeDefined();
        
        // Scripts
        expect(artifacts['setup-local.sh']).toBeDefined();
        expect(artifacts['teardown-local.sh']).toBeDefined();
        expect(artifacts['health-check.sh']).toBeDefined();
        
        // Development tools
        expect(artifacts['Makefile']).toBeDefined();
        expect(artifacts['.env.example']).toBeDefined();
        
        // Monitoring (enabled)
        expect(artifacts['docker-compose.monitoring.yml']).toBeDefined();
        
        // Ingress (enabled)
        expect(artifacts['k8s/ingress.yaml']).toBeDefined();
      });

      it('should generate valid Docker Compose configuration', () => {
        const artifacts = artifactGenerator.generateAllArtifacts();
        const dockerCompose = artifacts['docker-compose.yml'];
        
        expect(dockerCompose).toContain('version: \'3.8\'');
        expect(dockerCompose).toContain('postgres:');
        expect(dockerCompose).toContain('adfs:');
        expect(dockerCompose).toContain('networks:');
        expect(dockerCompose).toContain('volumes:');
        expect(dockerCompose).toContain(testConfig.projectName);
        expect(dockerCompose).toContain(testConfig.networkCidr);
      });

      it('should generate valid Kubernetes manifests', () => {
        const artifacts = artifactGenerator.generateAllArtifacts();
        const namespace = artifacts['k8s/namespace.yaml'];
        const postgres = artifacts['k8s/postgres.yaml'];
        
        expect(namespace).toContain('kind: Namespace');
        expect(namespace).toContain(`name: ${testConfig.projectName}`);
        
        expect(postgres).toContain('kind: Deployment');
        expect(postgres).toContain('kind: Service');
        expect(postgres).toContain('kind: PersistentVolumeClaim');
        expect(postgres).toContain('kind: Secret');
        expect(postgres).toContain(testConfig.postgres.engineVersion);
        expect(postgres).toContain(`${testConfig.postgres.storageGb}Gi`);
      });

      it('should generate setup script with proper permissions', () => {
        const artifacts = artifactGenerator.generateAllArtifacts();
        const setupScript = artifacts['setup-local.sh'];
        
        expect(setupScript).toContain('#!/bin/bash');
        expect(setupScript).toContain('chmod +x *.sh');
        expect(setupScript).toContain('docker-compose up -d');
        expect(setupScript).toContain('kubectl');
      });

      it('should generate Makefile with common targets', () => {
        const artifacts = artifactGenerator.generateAllArtifacts();
        const makefile = artifacts['Makefile'];
        
        expect(makefile).toContain('.PHONY:');
        expect(makefile).toContain('help:');
        expect(makefile).toContain('setup:');
        expect(makefile).toContain('start:');
        expect(makefile).toContain('stop:');
        expect(makefile).toContain('logs:');
        expect(makefile).toContain('health:');
        expect(makefile).toContain('clean:');
      });

      it('should generate environment template', () => {
        const artifacts = artifactGenerator.generateAllArtifacts();
        const envExample = artifacts['.env.example'];
        
        expect(envExample).toContain('POSTGRES_PASSWORD=');
        expect(envExample).toContain('POSTGRES_DB=');
        expect(envExample).toContain('NODE_ENV=');
        expect(envExample).toContain('PROJECT_NAME=');
        expect(envExample).toContain(testConfig.projectName);
      });
    });

    describe('Resource calculation', () => {
      it('should calculate correct CPU limits based on workload size', () => {
        // Test small workload
        const smallConfig = { ...testConfig, k8s: { ...testConfig.k8s, size: 'small' as const } };
        const smallGenerator = new LocalArtifactGenerator(smallConfig, { environment: 'docker-compose' });
        const smallArtifacts = smallGenerator.generateAllArtifacts();
        expect(smallArtifacts['docker-compose.yml']).toContain('cpus: \'1\'');

        // Test medium workload
        const mediumConfig = { ...testConfig, k8s: { ...testConfig.k8s, size: 'medium' as const } };
        const mediumGenerator = new LocalArtifactGenerator(mediumConfig, { environment: 'docker-compose' });
        const mediumArtifacts = mediumGenerator.generateAllArtifacts();
        expect(mediumArtifacts['docker-compose.yml']).toContain('cpus: \'2\'');

        // Test large workload
        const largeConfig = { ...testConfig, k8s: { ...testConfig.k8s, size: 'large' as const } };
        const largeGenerator = new LocalArtifactGenerator(largeConfig, { environment: 'docker-compose' });
        const largeArtifacts = largeGenerator.generateAllArtifacts();
        expect(largeArtifacts['docker-compose.yml']).toContain('cpus: \'4\'');
      });

      it('should calculate correct memory limits based on workload size', () => {
        // Test small workload
        const smallConfig = { ...testConfig, k8s: { ...testConfig.k8s, size: 'small' as const } };
        const smallGenerator = new LocalArtifactGenerator(smallConfig, { environment: 'docker-compose' });
        const smallArtifacts = smallGenerator.generateAllArtifacts();
        expect(smallArtifacts['docker-compose.yml']).toContain('memory: \'1024M\'');

        // Test medium workload
        const mediumConfig = { ...testConfig, k8s: { ...testConfig.k8s, size: 'medium' as const } };
        const mediumGenerator = new LocalArtifactGenerator(mediumConfig, { environment: 'docker-compose' });
        const mediumArtifacts = mediumGenerator.generateAllArtifacts();
        expect(mediumArtifacts['docker-compose.yml']).toContain('memory: \'2048M\'');

        // Test large workload
        const largeConfig = { ...testConfig, k8s: { ...testConfig.k8s, size: 'large' as const } };
        const largeGenerator = new LocalArtifactGenerator(largeConfig, { environment: 'docker-compose' });
        const largeArtifacts = largeGenerator.generateAllArtifacts();
        expect(largeArtifacts['docker-compose.yml']).toContain('memory: \'4096M\'');
      });
    });

    describe('Environment-specific configurations', () => {
      it('should generate different Docker Compose for dev and prod', () => {
        const artifacts = artifactGenerator.generateAllArtifacts();
        const devCompose = artifacts['docker-compose.dev.yml'];
        const prodCompose = artifacts['docker-compose.prod.yml'];
        
        // Dev should have tools and different ports
        expect(devCompose).toContain('adminer:');
        expect(devCompose).toContain('redis-commander:');
        expect(devCompose).toContain('5433:5432'); // Different port
        
        // Prod should have higher resource limits
        expect(prodCompose).toContain('cpus: \'4\'');
        expect(prodCompose).toContain('memory: \'8G\'');
      });

      it('should generate KIND configuration with port mappings', () => {
        const artifacts = artifactGenerator.generateAllArtifacts();
        const kindConfig = artifacts['kind-config.yaml'];
        
        expect(kindConfig).toContain('kind: Cluster');
        expect(kindConfig).toContain(`${testConfig.projectName}-cluster`);
        expect(kindConfig).toContain('containerPort: 80');
        expect(kindConfig).toContain('containerPort: 443');
      });

      it('should generate K3s configuration with proper settings', () => {
        const artifacts = artifactGenerator.generateAllArtifacts();
        const k3sConfig = artifacts['k3s-config.yaml'];
        
        expect(k3sConfig).toContain('write-kubeconfig-mode: "0644"');
        expect(k3sConfig).toContain(`cluster-cidr: "${testConfig.networkCidr}"`);
        expect(k3sConfig).toContain('disable:');
        expect(k3sConfig).toContain('traefik');
      });
    });
  });

  describe('Translation Maps', () => {
    describe('mapInstanceTypeToWorkloadSize', () => {
      it('should map local instance types correctly', () => {
        expect(mapInstanceTypeToWorkloadSize('docker-compose', 'local')).toBe('small');
        expect(mapInstanceTypeToWorkloadSize('minikube', 'local')).toBe('small');
        expect(mapInstanceTypeToWorkloadSize('kind', 'local')).toBe('small');
        expect(mapInstanceTypeToWorkloadSize('k3s', 'local')).toBe('small');
        expect(mapInstanceTypeToWorkloadSize('k0s', 'local')).toBe('small');
        expect(mapInstanceTypeToWorkloadSize('microk8s', 'local')).toBe('small');
        expect(mapInstanceTypeToWorkloadSize('rancher-desktop', 'local')).toBe('medium');
        expect(mapInstanceTypeToWorkloadSize('podman', 'local')).toBe('small');
        expect(mapInstanceTypeToWorkloadSize('lima', 'local')).toBe('small');
        expect(mapInstanceTypeToWorkloadSize('colima', 'local')).toBe('medium');
        expect(mapInstanceTypeToWorkloadSize('docker-desktop', 'local')).toBe('medium');
        expect(mapInstanceTypeToWorkloadSize('unknown', 'local')).toBe('small'); // default
      });
    });

    describe('mapDbClassToWorkloadSize', () => {
      it('should map local database classes correctly', () => {
        expect(mapDbClassToWorkloadSize('postgres', 'local')).toBe('small');
        expect(mapDbClassToWorkloadSize('postgres-container', 'local')).toBe('small');
        expect(mapDbClassToWorkloadSize('mysql', 'local')).toBe('small');
        expect(mapDbClassToWorkloadSize('sqlite', 'local')).toBe('small');
        expect(mapDbClassToWorkloadSize('mariadb', 'local')).toBe('small');
        expect(mapDbClassToWorkloadSize('unknown', 'local')).toBe('small'); // default
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete local workflow end-to-end', async () => {
      // 1. Generate artifacts
      const artifacts = await localAgent.generateArtifacts(testConfig, ['local']);
      expect(artifacts.artifacts.local).toBeDefined();

      // 2. Validate configuration
      const validation = await localAgent.validateConfig(testConfig);
      expect(validation.valid).toBe(true);

      // 3. Analyze costs
      const costs = await localAgent.analyzeCosts(testConfig);
      expect(costs.comparison.estimates.local.totalCost).toBe(0);

      // 4. Check compliance
      const compliance = await localAgent.checkCompliance(testConfig, 'soc2');
      expect(compliance.compliant).toBeDefined();

      // 5. Detect drift
      const drift = await localAgent.detectDrift(testConfig, artifacts.artifacts);
      expect(drift.hasDrift).toBeDefined();
    });

    it('should support bidirectional translation', async () => {
      // Local to Chiral intent
      const localConfig = await localAgent.importIaC('./docker-compose.yml', 'local');
      expect(localConfig.projectName).toBeDefined();
      expect(localConfig.environment).toBe('dev');

      // Chiral intent to local artifacts
      const artifacts = await localAgent.generateArtifacts(localConfig, ['local']);
      expect(artifacts.artifacts.local).toBeDefined();
      expect(artifacts.artifacts.local).toContain('docker-compose');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid configuration gracefully', async () => {
      const invalidConfig = { ...testConfig, k8s: undefined as any };
      
      await expect(localAgent.generateArtifacts(invalidConfig, ['local']))
        .rejects.toThrow('Configuration validation failed');
    });

    it('should handle missing files gracefully', async () => {
      await expect(localAgent.importIaC('./non-existent.yml', 'local'))
        .resolves.toBeDefined(); // Should return default config
    });
  });
});

describe('Local Provider Security', () => {
  it('should not expose sensitive data in artifacts', () => {
    const testConfig = {
      projectName: 'secure-project',
      environment: 'dev' as const,
      networkCidr: '10.0.0.0/16',
      k8s: { version: '1.27', minNodes: 1, maxNodes: 3, size: 'small' as const },
      postgres: { engineVersion: '15', storageGb: 20, size: 'small' as const },
      adfs: { size: 'small' as const, windowsVersion: '2022' as const }
    };

    const artifactGenerator = new LocalArtifactGenerator(testConfig, {
      environment: 'docker-compose'
    });
    const artifacts = artifactGenerator.generateAllArtifacts();

    // Should use environment variables instead of hardcoded secrets
    expect(artifacts['docker-compose.yml']).toContain('${POSTGRES_PASSWORD}');
    expect(artifacts['docker-compose.yml']).toContain('${REDIS_PASSWORD}');
    expect(artifacts['docker-compose.yml']).not.toContain('password123');
    expect(artifacts['docker-compose.yml']).not.toContain('redis123');
    expect(artifacts['.env.example']).toContain('CHANGE_THIS_STRONG_PASSWORD');
    expect(artifacts['.env.example']).toContain('CHANGE_THIS_STRONG_REDIS_PASSWORD');
  });

  it('should generate secure Kubernetes secrets', () => {
    const testConfig = {
      projectName: 'secure-project',
      environment: 'dev' as const,
      networkCidr: '10.0.0.0/16',
      k8s: { version: '1.27', minNodes: 1, maxNodes: 3, size: 'small' as const },
      postgres: { engineVersion: '15', storageGb: 20, size: 'small' as const },
      adfs: { size: 'small' as const, windowsVersion: '2022' as const }
    };

    const artifactGenerator = new LocalArtifactGenerator(testConfig, {
      environment: 'minikube'
    });
    const artifacts = artifactGenerator.generateAllArtifacts();

    expect(artifacts['k8s/postgres.yaml']).toContain('secretKeyRef');
    expect(artifacts['k8s/postgres.yaml']).toContain('name: postgres-secret');
    expect(artifacts['k8s/postgres.yaml']).toContain('key: password');
  });
});

describe('Local Provider Performance', () => {
  let testConfig: ChiralSystem;
  
  beforeEach(() => {
    testConfig = {
      projectName: 'test-project',
      environment: 'dev',
      networkCidr: '192.168.65.0/24',
      region: { local: 'localhost' },
      k8s: {
        version: '1.27',
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
  });

  it('should generate artifacts within reasonable time', async () => {
    const startTime = Date.now();
    
    const artifactGenerator = new LocalArtifactGenerator(testConfig, {
      environment: 'docker-compose',
      includeMonitoring: true,
      includeIngress: true
    });
    
    const artifacts = artifactGenerator.generateAllArtifacts();
    const endTime = Date.now();
    
    expect(Object.keys(artifacts).length).toBeGreaterThan(10);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('should handle large configurations efficiently', async () => {
    const largeConfig = {
      ...testConfig,
      k8s: {
        version: '1.27',
        minNodes: 1,
        maxNodes: 10,
        size: 'large' as const
      },
      postgres: {
        engineVersion: '15',
        storageGb: 1000,
        size: 'large' as const
      }
    };

    const startTime = Date.now();
    const localAgent = new LocalAgentAdapter('localhost');
    const artifacts = await localAgent.generateArtifacts(largeConfig, ['local']);
    const endTime = Date.now();
    
    expect(artifacts.artifacts.local).toBeDefined();
    expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
  });
});
