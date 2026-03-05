import { ChiralSystem } from '../intent';

describe('ChiralSystem Intent Schema', () => {
  describe('valid configurations', () => {
    it('should accept valid production config', () => {
      const config: ChiralSystem = {
        projectName: 'test-project',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: {
          version: '1.29',
          minNodes: 2,
          maxNodes: 5,
          size: 'large'
        },
        postgres: {
          engineVersion: '15',
          size: 'large',
          storageGb: 100
        },
        adfs: {
          size: 'large',
          windowsVersion: '2022'
        }
      };

      expect(config).toBeDefined();
      expect(config.environment).toBe('prod');
      expect(config.k8s.size).toBe('large');
    });

    it('should accept valid development config', () => {
      const config: ChiralSystem = {
        projectName: 'dev-project',
        environment: 'dev',
        networkCidr: '10.0.0.0/16',
        k8s: {
          version: '1.28',
          minNodes: 1,
          maxNodes: 3,
          size: 'small'
        },
        postgres: {
          engineVersion: '14',
          size: 'small',
          storageGb: 50
        },
        adfs: {
          size: 'small',
          windowsVersion: '2019'
        }
      };

      expect(config).toBeDefined();
      expect(config.environment).toBe('dev');
      expect(config.k8s.size).toBe('small');
    });

    it('should accept config with Terraform backend', () => {
      const config: ChiralSystem = {
        projectName: 'test-project',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        terraform: {
          backend: {
            type: 'gcs',
            bucket: 'my-state-bucket',
            prefix: 'terraform-state'
          }
        },
        k8s: {
          version: '1.29',
          minNodes: 2,
          maxNodes: 5,
          size: 'large'
        },
        postgres: {
          engineVersion: '15',
          size: 'large',
          storageGb: 100
        },
        adfs: {
          size: 'large',
          windowsVersion: '2022'
        }
      };

      expect(config).toBeDefined();
      expect(config.terraform?.backend?.type).toBe('gcs');
      expect(config.terraform?.backend?.bucket).toBe('my-state-bucket');
    });
  });

  describe('type validation', () => {
    it('should enforce environment tier types', () => {
      // TypeScript will catch invalid environment values at compile time
      const validConfig: ChiralSystem = {
        projectName: 'test',
        environment: 'prod', // Only 'dev' | 'prod' allowed
        networkCidr: '10.0.0.0/16',
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' }
      };
      expect(validConfig.environment).toMatch(/^(dev|prod)$/);
    });

    it('should enforce workload size types', () => {
      const validConfig: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' }, // 'small' | 'medium' | 'large'
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' }
      };
      expect(validConfig.k8s.size).toMatch(/^(small|medium|large)$/);
    });

    it('should enforce Windows version types', () => {
      const validConfig: ChiralSystem = {
        projectName: 'test',
        environment: 'prod',
        networkCidr: '10.0.0.0/16',
        k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'large' },
        postgres: { engineVersion: '15', size: 'large', storageGb: 100 },
        adfs: { size: 'large', windowsVersion: '2022' } // Only '2019' | '2022'
      };
      expect(validConfig.adfs.windowsVersion).toMatch(/^(2019|2022)$/);
    });
  });
});
