// File: src/utils/terraform-hcl-generator.ts

// HCL generation utilities for Terraform provider

import { TerraformConfig } from '../adapters/declarative/terraform-adapter';

export interface TerraformBlock {
  type: string;
  name: string;
  config: any;
  depends_on?: string[];
}

export interface TerraformConfig {
  provider: 'aws' | 'azure' | 'gcp';
  delegateState?: boolean;
  outputDirectory?: string;
  projectName: string;
  environment: string;
  region?: string;
}

export class TerraformHCLGenerator {
  static generate(config: TerraformConfig): string {
    const blocks: TerraformBlock[] = [];
    
    // Terraform block
    blocks.push({
      type: 'terraform',
      name: '',
      config: {
        required_version: '>= 1.0',
        required_providers: {
          [config.provider]: {
            source: `hashicorp/${config.provider}`,
            version: '~> 4.0'
          }
        }
      }
    });
    
    // Variables block
    blocks.push({
      type: 'variable',
      name: 'project_name',
      config: {
        description: 'Project name',
        type: 'string',
        default: config.projectName
      }
    });
    
    blocks.push({
      type: 'variable',
      name: 'environment',
      config: {
        description: 'Environment',
        type: 'string',
        default: config.environment
      }
    });
    
    blocks.push({
      type: 'variable',
      name: 'region',
      config: {
        description: 'Cloud region',
        type: 'string',
        default: config.region
      }
    });
    
    // Provider block
    const providerConfig = config.delegateState ? {
      region: '${var.region}',
      '# State delegation enabled\n# State will be managed by cloud provider'
    } : {
      region: '${var.region}'
    };
    
    blocks.push({
      type: 'provider',
      name: config.provider,
      config: providerConfig
    });
    
    // Resource block
    blocks.push({
      type: 'resource',
      name: `${config.provider}_kubernetes_cluster`,
      config: config.config,
      depends_on: config.depends_on
    });
    
    // Output block
    blocks.push({
      type: 'output',
      name: 'cluster_id',
      config: {
        description: 'Kubernetes cluster ID',
        value: `\${${config.provider}_kubernetes_cluster.main.id}`
      }
    });
    
    blocks.push({
      type: 'output',
      name: 'config',
      config: {
        description: 'Cluster configuration',
        value: `\${${config.provider}_kubernetes_cluster.main.config}`
      }
    });
    
    return this.renderHCL(blocks);
  }
  
  private static renderHCL(blocks: TerraformBlock[]): string {
    let hcl = '';
    
    blocks.forEach(block => {
      hcl += `\n# ${block.type.charAt(0).toUpperCase() + block.type.slice(1)} ${block.name}`;
      
      if (block.type === 'terraform') {
        hcl += this.renderTerraformBlock(block.config);
      } else if (block.type === 'variable') {
        hcl += this.renderVariableBlock(block.config);
      } else if (block.type === 'provider') {
        hcl += this.renderProviderBlock(block.config);
      } else if (block.type === 'resource') {
        hcl += this.renderResourceBlock(block.config);
      } else if (block.type === 'output') {
        hcl += this.renderOutputBlock(block.config);
      }
      
      hcl += '\n';
    });
    
    return hcl;
  }
  
  private static renderTerraformBlock(config: any): string {
    let result = ' {\n';
    
    Object.entries(config).forEach(([key, value]) => {
      if (typeof value === 'string') {
        result += `  ${key} = "${value}"\n`;
      } else if (typeof value === 'object' && value !== null) {
        result += `  ${key} = {\n`;
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (typeof subValue === 'string') {
            result += `    ${subKey} = "${subValue}"\n`;
          } else if (typeof subValue === 'object') {
            result += `    ${subKey} = {\n`;
            Object.entries(subValue).forEach(([subSubKey, subSubValue]) => {
              result += `      ${subSubKey} = "${subSubValue}"\n`;
            });
            result += '    }\n';
          }
        });
        result += '  }\n';
      }
    });
    
    result += '}';
    return result;
  }
  
  private static renderVariableBlock(config: any): string {
    let result = ' {\n';
    
    Object.entries(config).forEach(([key, value]) => {
      if (key === 'default' && typeof value === 'string') {
        result += `  default = "${value}"\n`;
      } else if (key === 'type' && typeof value === 'string') {
        result += `  type = ${value}\n`;
      } else if (key === 'description' && typeof value === 'string') {
        result += `  description = "${value}"\n`;
      }
    });
    
    result += '}';
    return result;
  }
  
  private static renderProviderBlock(config: any): string {
    if (typeof config === 'string') {
      return `  region = ${config}`;
    }
    
    let result = ' {\n';
    Object.entries(config).forEach(([key, value]) => {
      if (typeof value === 'string') {
        result += `  ${key} = ${value}\n`;
      }
    });
    result += '}';
    return result;
  }
  
  private static renderResourceBlock(config: any): string {
    let result = ' {\n';
    
    Object.entries(config).forEach(([key, value]) => {
      if (typeof value === 'string') {
        result += `    ${key} = "${value}"\n`;
      } else if (typeof value === 'number') {
        result += `    ${key} = ${value}\n`;
      } else if (typeof value === 'object' && value !== null) {
        result += `    ${key} = {\n`;
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (typeof subValue === 'string') {
            result += `      ${subKey} = "${subValue}"\n`;
          } else if (typeof subValue === 'number') {
            result += `      ${subKey} = ${subValue}\n`;
          } else if (typeof subValue === 'object') {
            result += `      ${subKey} = {\n`;
            Object.entries(subValue).forEach(([subSubKey, subSubValue]) => {
              if (typeof subSubValue === 'string') {
                result += `        ${subSubKey} = "${subSubValue}"\n`;
              } else if (typeof subSubValue === 'number') {
                result += `        ${subSubKey} = ${subSubValue}\n`;
              }
            });
            result += '      }\n';
          }
        });
        result += '    }\n';
      }
    });
    
    result += '  }';
    return result;
  }
  
  private static renderOutputBlock(config: any): string {
    let result = ' {\n';
    
    Object.entries(config).forEach(([key, value]) => {
      if (typeof value === 'string') {
        result += `  ${key} = "${value}"\n`;
      }
    });
    
    result += '}';
    return result;
  }
}
