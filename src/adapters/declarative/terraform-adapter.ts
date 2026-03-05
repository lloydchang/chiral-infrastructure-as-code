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
        
        // Parse HCL content
        const parsed = hcl2.parse(content);
        
        // Extract resource blocks
        if (parsed.resource) {
          for (const [resourceType, resourceBlock] of Object.entries(parsed.resource)) {
            for (const [resourceName, config] of Object.entries(resourceBlock as any)) {
              resources.push({
                resourceType,
                resourceName,
                config,
                depends_on: (config as any).depends_on || []
              });
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
    
    // TODO: Map Terraform resources to Chiral intent
    // - AWS EKS/AKS/GKE -> KubernetesIntent
    // - RDS/SQL Database -> DatabaseIntent  
    // - EC2/VM instances -> AdfsIntent
    // - Network configurations -> network settings
    
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
