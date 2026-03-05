// File: src/adapters/declarative/terraform-adapter.ts

// Terraform Import Adapter for Chiral Infrastructure as Code
// Imports Terraform HCL configurations and converts them to Chiral intent
// This is part of the migration FROM Terraform TO Chiral

import * as fs from 'fs';
import * as path from 'path';
import * as hcl2 from 'hcl2-parser';
import { ChiralSystem } from '../../intent';
import { getRegionalHardwareMap } from '../../translation/hardware-map';
import { mapInstanceTypeToWorkloadSize, mapDbClassToWorkloadSize, inferEnvironment, inferProjectName, inferNetworkCidr } from '../../translation/import-map';

export interface TerraformImportConfig {
  provider: 'aws' | 'azure' | 'gcp';
  sourcePath: string;
  stateFile?: string;
  analyzeOnly?: boolean;
}

export interface TerraformConfig {
  provider: 'aws' | 'azure' | 'gcp';
  delegateState?: boolean;
  outputDirectory?: string;
  projectName: string;
  environment: string;
  region?: string;
}

export interface ParsedTerraformResource {
  resourceType: string;
  resourceName: string;
  config: any;
  depends_on?: string[];
}

export class TerraformImportAdapter {
  static async parseTerraformFiles(sourcePath: string, provider: 'aws' | 'azure' | 'gcp'): Promise<ParsedTerraformResource[]> {
    // Parse Terraform .tf files and extract resource definitions
    const resources: ParsedTerraformResource[] = [];
    
    try {
      // Read all .tf files from sourcePath
      const tfFiles = fs.readdirSync(sourcePath).filter((file: string) => file.endsWith('.tf'));
      
      for (const tfFile of tfFiles) {
        const filePath = path.join(sourcePath, tfFile);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Simple line-by-line HCL parsing for basic resource blocks
        const lines = content.split('\n');
        let currentResource: any = null;
        let braceCount = 0;
        let resourceContent = '';
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Check for resource declaration
          const resourceMatch = line.match(/^resource\s+["']?([^"'\s]+)["']?\s+["']?([^"'\s]+)["']?\s*\{/);
          if (resourceMatch) {
            currentResource = {
              resourceType: resourceMatch[1],
              resourceName: resourceMatch[2],
              config: {}
            };
            braceCount = 1;
            resourceContent = '';
            continue;
          }
          
          // If we're inside a resource block
          if (currentResource && braceCount > 0) {
            // Count braces to determine when block ends
            for (let char of line) {
              if (char === '{') braceCount++;
              if (char === '}') braceCount--;
            }
            
            if (braceCount > 0) {
              resourceContent += line + '\n';
            } else {
              // Resource block ended, parse its content
              const config: any = {};
              
              // Parse string values
              const stringValueRegex = /(\w+)\s*=\s*"([^"]*)"/g;
              let kvMatch;
              while ((kvMatch = stringValueRegex.exec(resourceContent)) !== null) {
                config[kvMatch[1]] = kvMatch[2];
              }
              
              // Parse numeric values
              const numericValueRegex = /(\w+)\s*=\s*(\d+)/g;
              while ((kvMatch = numericValueRegex.exec(resourceContent)) !== null) {
                config[kvMatch[1]] = parseInt(kvMatch[2]);
              }
              
              // Parse array values
              const arrayValueRegex = /(\w+)\s*=\s*\[([^\]]+)\]/g;
              while ((kvMatch = arrayValueRegex.exec(resourceContent)) !== null) {
                const arrayContent = kvMatch[2];
                const items = arrayContent.split(',').map(item => item.trim().replace(/"/g, ''));
                config[kvMatch[1]] = items;
              }
              
              // Parse boolean values
              const booleanValueRegex = /(\w+)\s*=\s*(true|false)/g;
              while ((kvMatch = booleanValueRegex.exec(resourceContent)) !== null) {
                config[kvMatch[1]] = kvMatch[2] === 'true';
              }
              
              resources.push({
                resourceType: currentResource.resourceType,
                resourceName: currentResource.resourceName,
                config,
                depends_on: []
              });
              
              currentResource = null;
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Failed to parse Terraform files from ${sourcePath}: ${error}`);
    }
    
    return resources;
  }

  static async convertToChiralIntent(resources: ParsedTerraformResource[], provider: 'aws' | 'azure' | 'gcp'): Promise<Partial<ChiralSystem>> {
    // Convert parsed Terraform resources to Chiral intent
    const intent: Partial<ChiralSystem> = {
      projectName: 'imported-infrastructure',
      environment: 'prod',
      networkCidr: '10.0.0.0/16',
      k8s: {
        version: '1.35',
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
    
    // Map Terraform resources to Chiral intent
    for (const resource of resources) {
      switch (provider) {
        case 'aws':
          this.mapAwsResource(resource, intent, provider);
          break;
        case 'azure':
          this.mapAzureResource(resource, intent, provider);
          break;
        case 'gcp':
          this.mapGcpResource(resource, intent, provider);
          break;
      }
    }
    
    return intent;
  }

  private static mapAwsResource(resource: ParsedTerraformResource, intent: Partial<ChiralSystem>, provider: 'aws' | 'azure' | 'gcp'): void {
    switch (resource.resourceType) {
      case 'aws_eks_cluster':
        if (resource.config.version) {
          intent.k8s!.version = resource.config.version;
        }
        if (resource.config.node_groups) {
          // Extract node count from EKS configuration
          const nodeGroups = Array.isArray(resource.config.node_groups) ? resource.config.node_groups : [resource.config.node_groups];
          if (nodeGroups.length > 0) {
            const firstGroup = nodeGroups[0];
            if (firstGroup.desired_size) {
              intent.k8s!.minNodes = firstGroup.desired_size;
              intent.k8s!.maxNodes = firstGroup.desired_size;
            }
            if (firstGroup.instance_type) {
              intent.k8s!.size = mapInstanceTypeToWorkloadSize(firstGroup.instance_type, provider);
            }
          }
        }
        break;
        
      case 'aws_db_instance':
        if (resource.config.engine === 'postgres') {
          if (resource.config.engine_version) {
            intent.postgres!.engineVersion = resource.config.engine_version;
          }
          if (resource.config.instance_class) {
            intent.postgres!.size = mapDbClassToWorkloadSize(resource.config.instance_class, provider);
          }
          if (resource.config.allocated_storage) {
            intent.postgres!.storageGb = resource.config.allocated_storage;
          }
        }
        break;
        
      case 'aws_instance':
        if (resource.config.instance_type) {
          intent.adfs!.size = mapInstanceTypeToWorkloadSize(resource.config.instance_type, provider);
        }
        break;
        
      case 'aws_vpc':
        if (resource.config.cidr_block) {
          intent.networkCidr = resource.config.cidr_block;
        }
        break;
    }
  }

  private static mapAzureResource(resource: ParsedTerraformResource, intent: Partial<ChiralSystem>, provider: 'aws' | 'azure' | 'gcp'): void {
    switch (resource.resourceType) {
      case 'azurerm_kubernetes_cluster':
        if (resource.config.kubernetes_version) {
          intent.k8s!.version = resource.config.kubernetes_version;
        }
        if (resource.config.default_node_pool) {
          const pool = resource.config.default_node_pool;
          if (pool.count) {
            intent.k8s!.minNodes = pool.count;
            intent.k8s!.maxNodes = pool.count;
          }
          if (pool.vm_size) {
            intent.k8s!.size = mapInstanceTypeToWorkloadSize(pool.vm_size, provider);
          }
        }
        break;
        
      case 'azurerm_postgresql_flexible_server':
        if (resource.config.version) {
          intent.postgres!.engineVersion = resource.config.version;
        }
        if (resource.config.sku_name) {
          intent.postgres!.size = mapDbClassToWorkloadSize(resource.config.sku_name, provider);
        }
        if (resource.config.storage_mb) {
          intent.postgres!.storageGb = Math.floor(resource.config.storage_mb / 1024);
        }
        break;
        
      case 'azurerm_windows_virtual_machine':
        if (resource.config.vm_size) {
          intent.adfs!.size = mapInstanceTypeToWorkloadSize(resource.config.vm_size, 'azure');
        }
        break;
        
      case 'azurerm_virtual_network':
        if (resource.config.address_space) {
          const addressSpace = Array.isArray(resource.config.address_space) ? resource.config.address_space[0] : resource.config.address_space;
          intent.networkCidr = addressSpace;
        }
        break;
    }
  }

  private static mapGcpResource(resource: ParsedTerraformResource, intent: Partial<ChiralSystem>, provider: 'aws' | 'azure' | 'gcp'): void {
    switch (resource.resourceType) {
      case 'google_container_cluster':
        if (resource.config.min_master_version) {
          intent.k8s!.version = resource.config.min_master_version;
        }
        if (resource.config.initial_node_count) {
          intent.k8s!.minNodes = resource.config.initial_node_count;
          intent.k8s!.maxNodes = resource.config.initial_node_count;
        }
        if (resource.config.node_config?.machine_type) {
          intent.k8s!.size = mapInstanceTypeToWorkloadSize(resource.config.node_config.machine_type, provider);
        }
        break;
        
      case 'google_sql_database_instance':
        if (resource.config.database_version) {
          const version = resource.config.database_version;
          if (version.startsWith('POSTGRES_')) {
            intent.postgres!.engineVersion = version.replace('POSTGRES_', '');
          }
        }
        if (resource.config.tier) {
          intent.postgres!.size = mapDbClassToWorkloadSize(resource.config.tier, provider);
        }
        if (resource.config.disk_size) {
          intent.postgres!.storageGb = resource.config.disk_size;
        }
        break;
        
      case 'google_compute_instance':
        if (resource.config.machine_type) {
          intent.adfs!.size = mapInstanceTypeToWorkloadSize(resource.config.machine_type, provider);
        }
        break;
        
      case 'google_compute_network':
        if (resource.config.auto_create_subnetworks === false && resource.config.name) {
          // Default to common GCP CIDR if not specified
          intent.networkCidr = intent.networkCidr || '10.128.0.0/9';
        }
        break;
    }
  }

  static async importFromTerraform(config: TerraformImportConfig): Promise<ChiralSystem> {
    const resources = await this.parseTerraformFiles(config.sourcePath, config.provider);
    const intent = await this.convertToChiralIntent(resources, config.provider);
    
    // Validate and fill in required fields
    const chiralSystem: ChiralSystem = {
      projectName: intent.projectName || 'imported-from-terraform',
      environment: intent.environment || 'dev',
      networkCidr: intent.networkCidr || '10.0.0.0/16',
      region: intent.region,
      k8s: intent.k8s!,
      postgres: intent.postgres!,
      adfs: intent.adfs!,
      migration: {
        strategy: 'progressive',
        sourceState: config.sourcePath,
        validateCompliance: true
      }
    };
    
    return chiralSystem;
  }
}
