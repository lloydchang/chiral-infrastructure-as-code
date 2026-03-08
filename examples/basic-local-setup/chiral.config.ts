// Basic Web Application Configuration
import { ChiralSystem } from '../../src/intent';

export const config: ChiralSystem = {
  projectName: 'simple-web-app',
  environment: 'dev',
  networkCidr: '192.168.65.0/24',
  region: { 
    local: 'localhost',
    aws: 'us-east-1',
    azure: 'eastus',
    gcp: 'us-central1'
  },
  k8s: {
    version: '1.27',
    minNodes: 1,
    maxNodes: 2,
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
