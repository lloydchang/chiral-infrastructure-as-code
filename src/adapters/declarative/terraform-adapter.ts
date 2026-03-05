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

export interface ParsedTerraformResource {
  resourceType: string;
  resourceName: string;
  config: any;
  depends_on?: string[];
}

export class TerraformImportAdapter {
  static async parseTerraformFiles(sourcePath: string, provider: 'aws' | 'azure' | 'gcp'): Promise<ParsedTerraformResource[]> {
    const resources: ParsedTerraformResource[] = [];
    
    try {
      // Read all .tf files from sourcePath
      const tfFiles = fs.readdirSync(sourcePath).filter((file: string) => file.endsWith('.tf'));
      
      for (const tfFile of tfFiles) {
        const filePath = path.join(sourcePath, tfFile);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Simple regex-based HCL parsing (basic implementation)
        const resourceBlocks = this.extractResourceBlocks(content);
        
        for (const block of resourceBlocks) {
          resources.push({
            resourceType: block.type,
            resourceName: block.name,
            config: block.config,
            depends_on: block.config.depends_on || []
          });
        }
      }
    } catch (error) {
      console.warn(`Warning: Failed to parse Terraform files from ${sourcePath}: ${error}`);
    }
    
    return resources;
  }

  private static extractResourceBlocks(content: string): Array<{type: string, name: string, config: any}> {
    const blocks: Array<{type: string, name: string, config: any}> = [];
    
    // Match resource blocks: resource "type" "name" { ... }
    const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{([^}]+)\}/gs;
    let match;
    
    while ((match = resourceRegex.exec(content)) !== null) {
      const [, resourceType, resourceName, blockContent] = match;
      
      // Simple key-value extraction from block content
      const config = this.parseBlockContent(blockContent);
      
      blocks.push({
        type: resourceType,
        name: resourceName,
        config
      });
    }
    
    return blocks;
  }

  private static parseBlockContent(content: string): any {
    const config: any = {};
    
    // Simple parsing of key = value pairs
    const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
    
    for (const line of lines) {
      const keyValueMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
      if (keyValueMatch) {
        const [, key, value] = keyValueMatch;
        
        // Remove quotes and parse basic types
        if (value.startsWith('"') && value.endsWith('"')) {
          config[key] = value.slice(1, -1);
        } else if (value === 'true' || value === 'false') {
          config[key] = value === 'true';
        } else if (!isNaN(Number(value))) {
          config[key] = Number(value);
        } else {
          config[key] = value;
        }
      }
    }
    
    return config;
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
          this.mapAwsResource(resource, intent);
          }
          break;
          
        case 'aws_db_instance':
        case 'azurerm_postgresql_server':
        case 'google_sql_database_instance':
          // Map database configurations
          if (resource.config.engine_version) {
            intent.postgres!.engineVersion = resource.config.engine_version;
          }
          if (resource.config.instance_class || resource.config.vm_size) {
            const instanceType = resource.config.instance_class || resource.config.vm_size;
            intent.postgres!.size = mapDbClassToWorkloadSize(instanceType, provider);
          }
          if (resource.config.allocated_storage) {
            intent.postgres!.storageGb = resource.config.allocated_storage;
          }
          break;
          
        case 'aws_instance':
        case 'azurerm_linux_virtual_machine':
        case 'google_compute_instance':
          // Map VM configurations for ADFS
          if (resource.config.instance_type || resource.config.vm_size) {
            const instanceType = resource.config.instance_type || resource.config.vm_size;
            intent.adfs!.size = mapInstanceTypeToWorkloadSize(instanceType, provider);
          }
          break;
          
        case 'aws_vpc':
        case 'azurerm_virtual_network':
        case 'google_compute_network':
          // Extract network CIDR if available
          if (resource.config.cidr_block) {
            intent.networkCidr = resource.config.cidr_block;
          }
          break;
      }
    }
    
    return intent;
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
