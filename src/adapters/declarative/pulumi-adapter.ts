// File: src/adapters/declarative/pulumi-adapter.ts

// Pulumi Migration Bridge Adapter
// Purpose: Help teams escape Pulumi state management by generating Pulumi that delegates to cloud-native state

import { ChiralSystem } from '../../intent';
import { getRegionalHardwareMap, validateRegionalCapabilities } from '../../translation/hardware-map';

export interface PulumiConfig {
  provider: 'aws' | 'azure' | 'gcp';
  region: string;
  resources: PulumiResource[];
  variables: PulumiVariable[];
  backend?: PulumiBackend;
  outputs?: Record<string, any>;
}

export interface PulumiResource {
  type: string;
  name: string;
  properties: Record<string, any>;
  depends_on?: string[];
}

export interface PulumiVariable {
  name: string;
  type: string;
  description?: string;
  default?: any;
  sensitive?: boolean;
}

export interface PulumiBackend {
  type: 'cloudformation' | 'arm' | 'gcs';
  config: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ExecutionPlan {
  add: PulumiResource[];
  change: PulumiResource[];
  destroy: PulumiResource[];
}

export interface DeploymentResult {
  success: boolean;
  resources: PulumiResource[];
  outputs: Record<string, any>;
  errors: string[];
}

// =================================================================
// PULUMI MIGRATION BRIDGE ADAPTER
// -----------------------------------------------------------------
// This class generates Pulumi configurations that DELEGATE state management
// to cloud-native services, avoiding traditional Pulumi state issues.
//
// PRIMARY USE CASE: Migration bridge from traditional Pulumi to Chiral pattern
// SECONDARY USE CASE: Teams requiring Pulumi output during transition
// =================================================================

export class PulumiAdapter {
  static generate(intent: ChiralSystem, options: { delegateState?: boolean } = {}): PulumiConfig {
    const provider = this.detectProvider(intent);
    const region = intent.region?.[provider] || this.getDefaultRegion(provider);
    
    // Validate regional capabilities
    const regionalValidation = validateRegionalCapabilities(provider, region, ['kubernetes', 'postgresql', 'activeDirectory']);
    if (!regionalValidation.valid) {
      throw new Error(`${provider.toUpperCase()} region ${region} missing required services: ${regionalValidation.missingServices.join(', ')}`);
    }

    // Get region-aware hardware mappings
    const regionalHardware = getRegionalHardwareMap(provider, region);

    const config: PulumiConfig = {
      provider,
      region,
      resources: this.generateResources(intent, regionalHardware, options.delegateState ?? false),
      variables: this.extractVariables(intent, region),
      backend: options.delegateState ? this.generateDelegatedBackend(provider, region, intent) : undefined
    };

    return config;
  }

  static validate(config: PulumiConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!config.provider) {
      errors.push('Provider is required');
    }

    if (!config.region) {
      errors.push('Region is required');
    }

    // Resource validation
    const resourceTypes = config.resources.map(r => r.type);
    const requiredResources = ['kubernetes', 'database', 'network'];
    
    for (const required of requiredResources) {
      if (!resourceTypes.includes(required)) {
        warnings.push(`Missing ${required} resources`);
      }
    }

    // State delegation validation
    if (config.backend) {
      warnings.push('Using delegated state management - traditional Pulumi state issues will be handled by cloud provider');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  static plan(config: PulumiConfig): ExecutionPlan {
    // Generate execution plan (simplified)
    return {
      add: [], // Would be populated by pulumi preview
      change: config.resources,
      destroy: []
    };
  }

  static apply(config: PulumiConfig): DeploymentResult {
    // This would execute pulumi up with generated configuration
    // In practice, this is handled by cloud-native deployment tools
    
    return {
      success: true,
      resources: config.resources,
      outputs: this.extractOutputs(config.resources),
      errors: []
    };
  }

  // =================================================================
  // PRIVATE HELPER METHODS
  // =================================================================

  private static detectProvider(intent: ChiralSystem): 'aws' | 'azure' | 'gcp' {
    // Auto-detect provider based on region configuration
    if (intent.region?.aws) return 'aws';
    if (intent.region?.azure) return 'azure';
    if (intent.region?.gcp) return 'gcp';
    
    // Default to AWS for backward compatibility
    return 'aws';
  }

  private static getDefaultRegion(provider: 'aws' | 'azure' | 'gcp'): string {
    const defaults = {
      aws: 'us-east-1',
      azure: 'eastus',
      gcp: 'us-central1'
    };
    return defaults[provider] || 'us-east-1';
  }

  private static generateResources(intent: ChiralSystem, regionalHardware: any, delegateState: boolean): PulumiResource[] {
    const resources: PulumiResource[] = [];

    // Kubernetes resources
    if (intent.k8s) {
      const k8sResource = this.generateKubernetesResource(intent, regionalHardware, delegateState);
      resources.push(k8sResource);
    }

    // Database resources
    if (intent.postgres) {
      const dbResource = this.generateDatabaseResource(intent, regionalHardware, delegateState);
      resources.push(dbResource);
    }

    // Active Directory resources
    if (intent.adfs) {
      const adfsResource = this.generateADFSResource(intent, regionalHardware, delegateState);
      resources.push(adfsResource);
    }

    // Networking resources
    const networkResource = this.generateNetworkResource(intent, delegateState);
    resources.push(networkResource);

    return resources;
  }

  private static generateKubernetesResource(intent: ChiralSystem, regionalHardware: any, delegateState: boolean): PulumiResource {
    const machineType = regionalHardware.k8s[intent.k8s.size];
    
    if (delegateState) {
      // CloudFormation-managed EKS (delegates state to AWS)
      return {
        type: 'aws:cloudformation:Stack',
        name: `${intent.projectName}-eks`,
        properties: {
          template: 'aws-eks-template.json',
          parameters: {
            ClusterName: intent.projectName,
            NodeInstanceType: machineType,
            MinNodes: intent.k8s.minNodes,
            MaxNodes: intent.k8s.maxNodes
          }
        }
      };
    } else {
      // Traditional EKS resource (keeps Pulumi state)
      return {
        type: 'aws:eks:Cluster',
        name: `${intent.projectName}-eks`,
        properties: {
          version: intent.k8s.version,
          roleArn: 'arn:aws:iam::123456789012:role/eks-service-role', // Placeholder ARN
          vpcConfig: {
            subnetIds: ['subnet-12345', 'subnet-67890'] // Placeholder subnet IDs
          },
          nodeGroup: {
            instanceTypes: [machineType],
            minSize: intent.k8s.minNodes,
            maxSize: intent.k8s.maxNodes,
            desiredSize: Math.floor((intent.k8s.minNodes + intent.k8s.maxNodes) / 2)
          }
        }
      };
    }
  }

  private static generateDatabaseResource(intent: ChiralSystem, regionalHardware: any, delegateState: boolean): PulumiResource {
    const instanceClass = regionalHardware.db[intent.postgres.size];
    
    if (delegateState) {
      // CloudFormation-managed RDS (delegates state to AWS)
      return {
        type: 'aws:cloudformation:Stack',
        name: `${intent.projectName}-database`,
        properties: {
          template: 'aws-rds-template.json',
          parameters: {
            DatabaseName: `${intent.projectName}-postgres`,
            InstanceClass: instanceClass,
            StorageGB: intent.postgres.storageGb
          }
        }
      };
    } else {
      // Traditional RDS resource (keeps Pulumi state)
      return {
        type: 'aws:rds:Instance',
        name: `${intent.projectName}-postgres`,
        properties: {
          identifier: `${intent.projectName}-postgres`,
          engine: 'postgres',
          engineVersion: intent.postgres.engineVersion,
          instanceClass: instanceClass,
          allocatedStorage: intent.postgres.storageGb,
          storageType: 'gp2',
          storageEncrypted: true,
          skipFinalSnapshot: true
        }
      };
    }
  }

  private static generateADFSResource(intent: ChiralSystem, regionalHardware: any, delegateState: boolean): PulumiResource {
    const instanceType = regionalHardware.vm[intent.adfs.size];
    
    if (delegateState) {
      // CloudFormation-managed EC2 (delegates state to AWS)
      return {
        type: 'aws:cloudformation:Stack',
        name: `${intent.projectName}-adfs`,
        properties: {
          template: 'aws-adfs-template.json',
          parameters: {
            InstanceType: instanceType,
            WindowsVersion: intent.adfs.windowsVersion
          }
        }
      };
    } else {
      // Traditional EC2 resource (keeps Pulumi state)
      return {
        type: 'aws:ec2:Instance',
        name: `${intent.projectName}-adfs`,
        properties: {
          ami: '_windows_server_2019_english_full',
          instanceType: instanceType,
          userData: Buffer.from('<powershell>...</powershell>').toString('base64'),
          getPasswordData: false
        }
      };
    }
  }

  private static generateNetworkResource(intent: ChiralSystem, delegateState: boolean): PulumiResource {
    if (delegateState) {
      // CloudFormation-managed VPC (delegates state to AWS)
      return {
        type: 'aws:cloudformation:Stack',
        name: `${intent.projectName}-network`,
        properties: {
          template: 'aws-vpc-template.json',
          parameters: {
            VpcCidr: intent.networkCidr
          }
        }
      };
    } else {
      // Traditional VPC resource (keeps Pulumi state)
      return {
        type: 'aws:ec2:Vpc',
        name: `${intent.projectName}-vpc`,
        properties: {
          cidrBlock: intent.networkCidr,
          enableDnsHostnames: true,
          enableDnsSupport: true,
          tags: {
            Name: intent.projectName,
            Environment: intent.environment || 'dev'
          }
        }
      };
    }
  }

  private static extractVariables(intent: ChiralSystem, region: string): PulumiVariable[] {
    return [
      {
        name: 'project_name',
        type: 'string',
        description: 'Project name for resource naming',
        default: intent.projectName
      },
      {
        name: 'environment',
        type: 'string',
        description: 'Environment tier',
        default: intent.environment || 'dev'
      },
      {
        name: 'region',
        type: 'string',
        description: 'Cloud provider region',
        default: region
      }
    ];
  }

  private static generateDelegatedBackend(provider: string, region: string, intent: ChiralSystem): PulumiBackend {
    switch (provider) {
      case 'aws':
        return {
          type: 'cloudformation',
          config: {
            region: region,
            // Use CloudFormation as state backend instead of Pulumi
            // This eliminates Pulumi state management issues
          }
        };
      case 'azure':
        return {
          type: 'arm',
          config: {
            resourceGroupName: `${intent.projectName}-rg`,
            location: region
          }
        };
      case 'gcp':
        return {
          type: 'gcs',
          config: {
            bucket: `${intent.projectName}-pulumi-state`,
            prefix: 'pulumi/state/'
          }
        };
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private static extractOutputs(resources: PulumiResource[]): Record<string, any> {
    const outputs: Record<string, any> = {};
    
    for (const resource of resources) {
      if (resource.type.includes('cloudformation:Stack')) {
        outputs[`${resource.name}_outputs`] = {
          description: `CloudFormation stack outputs for ${resource.name}`,
          value: `${resource.type}.${resource.name}.outputs`
        };
      }
    }
    
    return outputs;
  }
}
