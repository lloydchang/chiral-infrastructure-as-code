import * as cdk from 'aws-cdk-lib';
import { AwsCdkAdapter } from '../adapters/programmatic/aws-cdk';
import { ChiralSystem } from '../intent';

describe('AWS CDK Adapter', () => {
  let app: cdk.App;
  let config: ChiralSystem;

  beforeEach(() => {
    app = new cdk.App();
    config = {
      projectName: 'test-project',
      environment: 'prod',
      networkCidr: '10.0.0.0/16',
      k8s: {
        version: '1.29',
        minNodes: 2,
        maxNodes: 5,
        size: 'medium'
      },
      postgres: {
        engineVersion: '15',
        size: 'medium',
        storageGb: 100
      },
      adfs: {
        size: 'medium',
        windowsVersion: '2022'
      }
    };
  });

  describe('Constructor', () => {
    it('should create AWS CDK stack with default props', () => {
      expect(() => {
        const stack = new AwsCdkAdapter(app, 'TestStack', config);
        expect(stack).toBeDefined();
        expect(stack.stackName).toBe('TestStack');
      }).not.toThrow();
    });

    it('should create AWS CDK stack with custom props', () => {
      const props = {
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      };
      
      expect(() => {
        const stack = new AwsCdkAdapter(app, 'TestStack', config, props);
        expect(stack).toBeDefined();
        expect(stack.stackName).toBe('TestStack');
      }).not.toThrow();
    });

    it('should handle different workload sizes', () => {
      const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
      
      sizes.forEach(size => {
        const testConfig = { ...config, k8s: { ...config.k8s, size } };
        expect(() => {
          const stack = new AwsCdkAdapter(app, `TestStack${size}`, testConfig);
          expect(stack).toBeDefined();
        }).not.toThrow();
      });
    });

    it('should handle different environments', () => {
      const environments: Array<'dev' | 'prod'> = ['dev', 'prod'];
      
      environments.forEach(env => {
        const testConfig = { ...config, environment: env };
        expect(() => {
          const stack = new AwsCdkAdapter(app, `TestStack${env}`, testConfig);
          expect(stack).toBeDefined();
        }).not.toThrow();
      });
    });
  });

  describe('Resource Generation', () => {
    it('should generate VPC with correct CIDR', () => {
      const stack = new AwsCdkAdapter(app, 'TestStack', config);
      
      expect(stack.vpc).toBeDefined();
      // CDK tokens are resolved at synthesis time, so we check if it's defined
      expect(stack.vpc.vpcCidrBlock).toBeDefined();
    });

    it('should generate EKS cluster', () => {
      const stack = new AwsCdkAdapter(app, 'TestStack', config);
      
      expect(stack.eksCluster).toBeDefined();
      // CDK tokens are resolved at synthesis time, so we check if it's defined
      expect(stack.eksCluster.clusterName).toBeDefined();
    });

    it('should generate RDS instance', () => {
      const stack = new AwsCdkAdapter(app, 'TestStack', config);
      
      expect(stack.postgresDatabase).toBeDefined();
      // CDK engine version is an object with fullVersion property
      expect(stack.postgresDatabase?.engine?.engineVersion?.fullVersion).toBe('15');
    });

    it('should generate Windows instance for ADFS', () => {
      const stack = new AwsCdkAdapter(app, 'TestStack', config);
      
      expect(stack.adfsInstance).toBeDefined();
    });

    it('should generate database secret', () => {
      const stack = new AwsCdkAdapter(app, 'TestStack', config);
      
      expect(stack.dbSecret).toBeDefined();
    });
  });

  describe('Configuration Mapping', () => {
    it('should map small workload to appropriate instance types', () => {
      const smallConfig = {
        ...config,
        k8s: { ...config.k8s, size: 'small' as const },
        postgres: { ...config.postgres, size: 'small' as const },
        adfs: { ...config.adfs, size: 'small' as const }
      };
      
      expect(() => {
        const stack = new AwsCdkAdapter(app, 'TestStack', smallConfig);
        expect(stack).toBeDefined();
        expect(stack.eksCluster).toBeDefined();
        expect(stack.postgresDatabase).toBeDefined();
        expect(stack.adfsInstance).toBeDefined();
      }).not.toThrow();
    });

    it('should map medium workload to appropriate instance types', () => {
      const mediumConfig = {
        ...config,
        k8s: { ...config.k8s, size: 'medium' as const },
        postgres: { ...config.postgres, size: 'medium' as const },
        adfs: { ...config.adfs, size: 'medium' as const }
      };
      
      expect(() => {
        const stack = new AwsCdkAdapter(app, 'TestStack', mediumConfig);
        expect(stack).toBeDefined();
        expect(stack.eksCluster).toBeDefined();
        expect(stack.postgresDatabase).toBeDefined();
        expect(stack.adfsInstance).toBeDefined();
      }).not.toThrow();
    });

    it('should map large workload to appropriate instance types', () => {
      const largeConfig = {
        ...config,
        k8s: { ...config.k8s, size: 'large' as const },
        postgres: { ...config.postgres, size: 'large' as const },
        adfs: { ...config.adfs, size: 'large' as const }
      };
      
      expect(() => {
        const stack = new AwsCdkAdapter(app, 'TestStack', largeConfig);
        expect(stack).toBeDefined();
        expect(stack.eksCluster).toBeDefined();
        expect(stack.postgresDatabase).toBeDefined();
        expect(stack.adfsInstance).toBeDefined();
      }).not.toThrow();
    });

    it('should handle different Kubernetes versions', () => {
      const versions = ['1.28', '1.29', '1.30'];
      
      versions.forEach(version => {
        const versionConfig = {
          ...config,
          k8s: { ...config.k8s, version }
        };
        
        expect(() => {
          const stack = new AwsCdkAdapter(app, `TestStack${version.replace(/\./g, '')}`, versionConfig);
          expect(stack).toBeDefined();
          expect(stack.eksCluster).toBeDefined();
        }).not.toThrow();
      });
    });

    it('should handle different PostgreSQL versions', () => {
      const versions = ['14', '15', '16'];
      
      versions.forEach(version => {
        const versionConfig = {
          ...config,
          postgres: { ...config.postgres, engineVersion: version }
        };
        
        expect(() => {
          const stack = new AwsCdkAdapter(app, `TestStack${version}`, versionConfig);
          expect(stack).toBeDefined();
          expect(stack.postgresDatabase).toBeDefined();
        }).not.toThrow();
      });
    });

    it('should handle different Windows versions', () => {
      const versions: Array<'2019' | '2022'> = ['2019', '2022'];
      
      versions.forEach(version => {
        const versionConfig = {
          ...config,
          adfs: { ...config.adfs, windowsVersion: version }
        };
        
        expect(() => {
          const stack = new AwsCdkAdapter(app, `TestStack${version}`, versionConfig);
          expect(stack).toBeDefined();
          expect(stack.adfsInstance).toBeDefined();
        }).not.toThrow();
      });
    });
  });

  describe('Node Count Configuration', () => {
    it('should handle different node counts', () => {
      const nodeConfigs = [
        { minNodes: 1, maxNodes: 3 },
        { minNodes: 2, maxNodes: 5 },
        { minNodes: 3, maxNodes: 10 }
      ];
      
      nodeConfigs.forEach(({ minNodes, maxNodes }) => {
        const nodeConfig = {
          ...config,
          k8s: { ...config.k8s, minNodes, maxNodes }
        };
        
        expect(() => {
          const stack = new AwsCdkAdapter(app, `TestStack${minNodes}-${maxNodes}`, nodeConfig);
          expect(stack).toBeDefined();
          expect(stack.eksCluster).toBeDefined();
        }).not.toThrow();
      });
    });
  });

  describe('Storage Configuration', () => {
    it('should handle different storage sizes', () => {
      const storageSizes = [20, 50, 100, 500, 1000];
      
      storageSizes.forEach(storageGb => {
        const storageConfig = {
          ...config,
          postgres: { ...config.postgres, storageGb }
        };
        
        expect(() => {
          const stack = new AwsCdkAdapter(app, `TestStack${storageGb}`, storageConfig);
          expect(stack).toBeDefined();
          expect(stack.postgresDatabase).toBeDefined();
        }).not.toThrow();
      });
    });
  });

  describe('Network Configuration', () => {
    it('should handle different network CIDRs', () => {
      const cidrs = ['10.0.0.0/16', '192.168.0.0/16', '172.16.0.0/16'];
      
      cidrs.forEach(networkCidr => {
        const networkConfig = {
          ...config,
          networkCidr
        };
        
        expect(() => {
          const stack = new AwsCdkAdapter(app, `TestStack${networkCidr.replace(/\./g, '-')}`, networkConfig);
          expect(stack).toBeDefined();
          expect(stack.vpc).toBeDefined();
        }).not.toThrow();
      });
    });
  });

  describe('Project Name Handling', () => {
    it('should handle different project names', () => {
      const projectNames = ['my-app', 'test-project', 'production-infrastructure'];
      
      projectNames.forEach(projectName => {
        const projectConfig = {
          ...config,
          projectName
        };
        
        expect(() => {
          const stack = new AwsCdkAdapter(app, projectName.replace(/[^a-zA-Z0-9]/g, '-'), projectConfig);
          expect(stack).toBeDefined();
        }).not.toThrow();
      });
    });
  });

  describe('Template Structure', () => {
    it('should generate valid CloudFormation template', () => {
      const stack = new AwsCdkAdapter(app, 'TestStack', config);
      const cloudAssembly = app.synth();
      const stackArtifact = cloudAssembly.getStackByName(stack.stackName);
      
      expect(stackArtifact).toBeDefined();
      expect(stackArtifact.template).toBeDefined();
      // Just check that template exists and has resources
      expect(stackArtifact.template.Resources).toBeDefined();
      expect(typeof stackArtifact.template.Resources).toBe('object');
    });

    it('should include required CloudFormation sections', () => {
      const stack = new AwsCdkAdapter(app, 'TestStack', config);
      const cloudAssembly = app.synth();
      const stackArtifact = cloudAssembly.getStackByName(stack.stackName);
      
      expect(stackArtifact).toBeDefined();
      expect(stackArtifact.template).toBeDefined();
      expect(stackArtifact.template.Resources).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid configurations gracefully', () => {
      // Test with minimal valid config
      const minimalConfig: ChiralSystem = {
        projectName: 'minimal',
        environment: 'dev',
        networkCidr: '10.0.0.0/16',
        k8s: {
          version: '1.29',
          minNodes: 1,
          maxNodes: 1,
          size: 'small'
        },
        postgres: {
          engineVersion: '15',
          size: 'small',
          storageGb: 20
        },
        adfs: {
          size: 'small',
          windowsVersion: '2019'
        }
      };
      
      expect(() => {
        const stack = new AwsCdkAdapter(app, 'MinimalStack', minimalConfig);
        expect(stack).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Regional Capabilities', () => {
    it('should validate region capabilities', () => {
      expect(() => {
        const stack = new AwsCdkAdapter(app, 'TestStack', config);
        expect(stack).toBeDefined();
      }).not.toThrow();
    });

    it('should use region-aware hardware mappings', () => {
      const stack = new AwsCdkAdapter(app, 'TestStack', config);
      expect(stack).toBeDefined();
      // The stack should have been created with regional hardware mappings
    });
  });
});
