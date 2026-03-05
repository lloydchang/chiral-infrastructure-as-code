// File: src/main.ts

// 6. The Chiral Engine (Orchestrator)

// The executable that generates the logic from
//
//   5. The Adapters (Logic)
//     File: src/adapters/aws-left.ts
//       The Left Enantiomer: AWS CDK Implementation.
//     File: src/adapters/azure-right.ts
//       The Right Enantiomer: Azure Bicep Generator.
//
// into real artifacts.

import * as cdk from 'aws-cdk-lib';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { Command } from 'commander';
import { ChiralSystem } from './intent';
import { AzureBicepAdapter } from './adapters/declarative/azure-bicep';
import { GcpTerraformAdapter } from './adapters/declarative/gcp-terraform';
import { AwsCdkAdapter } from './adapters/programmatic/aws-cdk';
import { validateChiralConfig, checkDeploymentReadiness, checkCompliance } from './validation';
import * as hcl2 from 'hcl2-parser';
import * as yaml from 'js-yaml';

// Import migration utilities
import { MigrationWizard } from './migration/wizard';
import { MigrationPlaybookGenerator } from './migration/playbooks';
import { ValidationScriptGenerator } from './migration/validation-scripts';
import { awsEksPostgresTemplate } from './migration/templates/aws-eks-postgres-template';
import { TerraformImportAdapter } from './adapters/declarative/terraform-adapter';

// =================================================================
// IMPORT HELPERS
// =================================================================
const importIaC = async (sourcePath: string, provider: 'aws' | 'azure' | 'gcp', stackName?: string): Promise<ChiralSystem> => {
  const ext = path.extname(sourcePath);
  let resources: any[] = [];

  // Check if it's a directory (for Terraform directories)
  try {
    const stats = fs.statSync(sourcePath);
    if (stats.isDirectory() && !ext) {
      // Handle Terraform directory with our new Terraform Import Adapter
      console.log(`🔍 Parsing Terraform directory: ${path.basename(sourcePath)}`);
      
      try {
        const parsedResources = await TerraformImportAdapter.parseTerraformFiles(sourcePath, provider);
        
        // Convert to the format expected by buildChiralSystemFromResources
        resources = parsedResources.map(resource => ({
          type: resource.resourceType,
          name: resource.resourceName,
          values: resource.config
        }));
        
        console.log(`✅ Extracted ${resources.length} resources from directory using Terraform Import Adapter`);
        
      } catch (error) {
        console.error(`❌ Failed to parse Terraform directory with Terraform Import Adapter: ${error}`);
        throw new Error(`Terraform directory parsing failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      return buildChiralSystemFromResources(resources, provider, stackName);
    }
  } catch (error) {
    // Continue with file-based handling if stat fails
  }

  if (ext === '.tfstate') {
    // Enhanced Terraform state file handling with corruption detection
    console.log(`🔍 Analyzing Terraform state file: ${path.basename(sourcePath)}`);
    
    let state: any;
    try {
      const stateContent = fs.readFileSync(sourcePath, 'utf8');
      state = JSON.parse(stateContent);
      
      // Validate state file integrity
      if (!state.version || !state.serial || !state.lineage) {
        console.warn(`⚠️  WARNING: State file appears to be corrupted or incomplete.`);
        console.warn(`   Missing required fields: version, serial, or lineage.`);
        console.warn(`   Consider using 'terraform state pull' to get fresh state.`);
      }
      
      // Check for common corruption indicators
      if (stateContent.includes('null') && stateContent.includes('undefined')) {
        console.warn(`⚠️  WARNING: State file contains null/undefined values - possible corruption detected.`);
      }
      
      resources = state.resources || [];
      
      // Enhanced security and compliance warnings
      console.log(`\n⚠️  TERRAFORM STATE IMPORT SECURITY ANALYSIS:`);
      console.log(`   🔒 SECURITY RISKS DETECTED:`);
      console.log(`     • Secrets in plain text: ${detectSensitiveData(stateContent) ? 'YES' : 'NO'}`);
      console.log(`     • IP addresses exposed: ${extractIPAddresses(state).length > 0 ? 'YES' : 'NO'}`);
      console.log(`     • Resource metadata exposed: ${resources.length} resources`);
      console.log(`\n   📄 COMPLIANCE CONCERNS:`);
      console.log(`     • SOC 2 violations: Potential unauthorized access to sensitive infrastructure data`);
      console.log(`     • ISO 27001 violations: Inadequate protection of configuration information`);
      console.log(`     • GDPR violations: Possible exposure of personal data in resource configurations`);
      console.log(`\n   � OPERATIONAL RISKS:`);
      console.log(`     • State corruption: ${state.serial ? `Serial #${state.serial}` : 'Unknown'} - may be inconsistent`);
      console.log(`     • Lock contention: Multiple pipelines may corrupt this state file`);
      console.log(`     • Recovery complexity: Manual intervention required if state becomes corrupted`);
      console.log(`\n   💰 COST IMPACT:`);
      console.log(`     • IBM Terraform Premium: $0.99/month per resource = $${(resources.length * 0.99).toFixed(2)}/month`);
      console.log(`     • Annual cost: $${(resources.length * 0.99 * 12).toFixed(2)}/year`);
      console.log(`     • Hidden costs: Backend storage, encryption, backup procedures, staff time`);
      console.log(`\n   ✅ CHIRAL ADVANTAGE:`);
      console.log(`     • Stateless generation eliminates ALL above risks`);
      console.log(`     • Zero state management costs and compliance violations`);
      console.log(`     • Native cloud integration for better security and reliability`);
      console.log(`\n   � MIGRATION RECOMMENDATION:`);
      console.log(`     • Import HCL configuration files instead of state files when possible`);
      console.log(`     • Sanitize state files to remove sensitive data before import`);
      console.log(`     • Consider manual configuration for high-security environments`);
      console.log(`     • See docs/MIGRATION.md for detailed migration guidance`);
      
    } catch (error) {
      console.error(`❌ ERROR: Failed to parse Terraform state file.`);
      console.error(`   This may indicate file corruption or invalid JSON format.`);
      console.error(`   Try: terraform state pull > fresh-state.tfstate`);
      console.error(`   Or: terraform validate && terraform plan`);
      throw new Error(`Corrupted Terraform state file: ${error instanceof Error ? error.message : String(error)}`);
    }
    
  } else if (ext === '.tf') {
    console.log(`🔍 Parsing Terraform HCL file: ${path.basename(sourcePath)}`);
    
    // Use the new Terraform Import Adapter for better parsing
    try {
      const terraformDir = path.dirname(sourcePath);
      const parsedResources = await TerraformImportAdapter.parseTerraformFiles(terraformDir, provider);
      
      // Convert to the format expected by buildChiralSystemFromResources
      resources = parsedResources.map(resource => ({
        type: resource.resourceType,
        name: resource.resourceName,
        values: resource.config
      }));
      
      console.log(`✅ Extracted ${resources.length} resources from HCL using Terraform Import Adapter`);
      
    } catch (error) {
      console.error(`❌ Failed to parse Terraform HCL file with Terraform Import Adapter: ${error}`);
      console.error(`   Falling back to legacy parser...`);
      
      // Fallback to legacy parser
      try {
        const content = fs.readFileSync(sourcePath, 'utf8');
        const parsed = hcl2.parse(content);

        // Enhanced HCL resource extraction with module support
        const extractResources = (hclData: any, modulePath: string[] = []): any[] => {
          const resources: any[] = [];

          // Extract resources from current scope
          if (hclData.resource) {
            Object.entries(hclData.resource).forEach(([resourceType, resourceBlocks]: [string, any]) => {
              Object.entries(resourceBlocks).forEach(([resourceName, resourceConfig]: [string, any]) => {
                resources.push({
                  type: resourceType,
                  name: resourceName,
                  values: resourceConfig,
                  modulePath: modulePath.join('.')
                });
              });
            });
          }

          // Extract resources from modules (recursive)
          if (hclData.module) {
            Object.entries(hclData.module).forEach(([moduleName, moduleConfig]: [string, any]) => {
              const moduleResources = extractResources(moduleConfig, [...modulePath, moduleName]);
              resources.push(...moduleResources);
            });
          }

          return resources;
        };

        resources = extractResources(parsed);

        // Enhanced variable resolution
        const resolveVariables = (config: any, variables: any = {}): any => {
          if (typeof config === 'string' && config.startsWith('var.')) {
            const varName = config.slice(4);
            return variables[varName] || config;
          }
          if (Array.isArray(config)) {
            return config.map(item => resolveVariables(item, variables));
          }
          if (typeof config === 'object' && config !== null) {
            const resolved: any = {};
            for (const [key, value] of Object.entries(config)) {
              resolved[key] = resolveVariables(value, variables);
            }
            return resolved;
          }
          return config;
        };

        // Apply variable resolution if variables.tf exists
        const varFile = path.join(path.dirname(sourcePath), 'variables.tf');
        let variables = {};
        if (fs.existsSync(varFile)) {
          try {
            const varContent = fs.readFileSync(varFile, 'utf8');
            const varParsed = hcl2.parse(varContent);
            if (varParsed.variable) {
              variables = varParsed.variable;
            }
          } catch (error) {
            console.warn(`⚠️  Could not parse variables.tf: ${error}`);
          }
        }

        // Resolve variables in resources
        resources = resources.map(resource => ({
          ...resource,
          values: resolveVariables(resource.values, variables)
        }));

        console.log(`✅ Extracted ${resources.length} resources from HCL using legacy parser`);

      } catch (fallbackError) {
        console.error(`❌ Both Terraform Import Adapter and legacy parser failed: ${fallbackError}`);
        console.error(`   Try: terraform validate && terraform fmt`);
        throw new Error(`Invalid Terraform HCL syntax: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
      }
    }
  } else if (ext === '.yaml' || ext === '.yml' || ext === '.json') {
    const content = fs.readFileSync(sourcePath, 'utf8');
    const template = ext === '.json' ? JSON.parse(content) : yaml.load(content);

    // Handle Pulumi YAML format
    if (template.resources) {
      // This looks like a Pulumi YAML file
      console.log(`🔍 Detected Pulumi YAML format`);
      resources = Object.keys(template.resources).map(key => ({
        type: template.resources[key].type,
        name: key,
        values: template.resources[key].properties || {}
      }));
    } else {
      // Standard CloudFormation/ARM template
      resources = Object.keys(template.Resources || {}).map(key => ({
        type: template.Resources[key].Type,
        properties: template.Resources[key].Properties
      }));
    }
  } else if (ext === '.bicep') {
    const tempJson = path.join(os.tmpdir(), `bicep-${Date.now()}.json`);
    try {
      execSync(`az bicep build --file ${sourcePath} --outfile ${tempJson}`, { stdio: 'ignore' });
      const arm = JSON.parse(fs.readFileSync(tempJson, 'utf8'));
      resources = arm.resources || [];
    } finally {
      if (fs.existsSync(tempJson)) fs.unlinkSync(tempJson);
    }
  } else {
    throw new Error(`Unsupported file extension: ${ext}`);
  }

  return buildChiralSystemFromResources(resources, provider, stackName);
};

// Helper functions for enhanced state file analysis
const detectSensitiveData = (content: string): boolean => {
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /api[_-]?key/i,
    /token/i,
    /certificate/i,
    /private[_-]?key/i,
    /access[_-]?key/i
  ];
  return sensitivePatterns.some(pattern => pattern.test(content));
};

const extractIPAddresses = (state: any): string[] => {
  const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  const stateString = JSON.stringify(state);
  const matches = stateString.match(ipPattern) || [];
  return [...new Set(matches)]; // Remove duplicates
};


// Enhanced inference functions
const inferKubernetesVersion = (resources: any[]): string => {
  // Look for version patterns in resource configurations
  const versions = resources.map(r => {
    const props = r.values || r.properties || {};
    return props.version || props.kubernetesVersion || props.kubernetes_version || '1.29';
  });
  return versions[0] || '1.29';
};

const inferNodeCount = (resources: any[], type: 'min' | 'max'): number => {
  const counts = resources.map(r => {
    const props = r.values || r.properties || {};
    if (type === 'min') {
      return props.minSize || props.min_count || props.minNodes || 1;
    } else {
      return props.maxSize || props.max_count || props.maxNodes || 5;
    }
  });
  return Math.max(...counts, 1);
};

const inferWorkloadSize = (resources: any[]): 'small' | 'medium' | 'large' => {
  // Enhanced size inference based on instance types and resource configurations
  const instanceTypes = resources.map(r => {
    const props = r.values || r.properties || {};
    return props.instanceType || props.vmSize || props.machineType || props.tier || '';
  }).filter(Boolean);

  // Map common instance types to sizes
  const largePatterns = [
    /large/i, /xlarge/i, /2xlarge/i, /4xlarge/i, /8xlarge/i,
    /standard_d[4-9]/i, /n1-standard-[4-9]/i, /m5\.[2-9]/i, /custom-[4-9]/i
  ];
  
  const mediumPatterns = [
    /medium/i, /t3\.medium/i, /standard_d[2-3]/i, /n1-standard-[2-3]/i, 
    /e2-medium/i, /db-g1-small/i, /custom-2-/i
  ];
  
  const hasLargeInstance = instanceTypes.some(type => 
    largePatterns.some(pattern => pattern.test(type))
  );
  
  const hasMediumInstance = instanceTypes.some(type => 
    mediumPatterns.some(pattern => pattern.test(type))
  );
  
  if (hasLargeInstance) return 'large';
  if (hasMediumInstance) return 'medium';
  return 'small';
};

const inferDatabaseVersion = (resources: any[]): string => {
  const versions = resources.map(r => {
    const props = r.values || r.properties || {};
    return props.engineVersion || props.engine || props.version || '15';
  });
  return versions[0] || '15';
};

const inferStorageSize = (resources: any[]): number => {
  const sizes = resources.map(r => {
    const props = r.values || r.properties || {};
    return props.allocatedStorage || props.storageSize || props.disk_size || 100;
  });
  return Math.max(...sizes, 50);
};

const inferWindowsVersion = (resources: any[]): '2019' | '2022' => {
  const versions = resources.map(r => {
    const props = r.values || r.properties || {};
    const image = props.image || props.imageReference || {};
    const sku = image.offer || image.sku || '';
    if (sku.includes('2022')) return '2022';
    if (sku.includes('2019')) return '2019';
    return '2022'; // Default to latest
  });
  return versions[0] || '2022';
};

const inferRegion = (resources: any[], provider: string): { aws?: string; azure?: string; gcp?: string } => {
  // Extract region information from resource configurations
  const regions = resources.map(r => {
    const props = r.values || r.properties || {};
    return props.region || props.location || props.zone || '';
  }).filter(Boolean);
  
  const region = regions[0];
  if (!region) return {};
  
  // Map region to provider-specific format
  if (provider === 'aws') {
    return { aws: region };
  } else if (provider === 'azure') {
    return { azure: region.replace(/\s+/g, ' ') };
  } else if (provider === 'gcp') {
    return { gcp: region.split('-')[0] + '-' + region.split('-')[1] };
  }
  
  return {};
};

const buildChiralSystemFromResources = (resources: any[], provider: string, stackName?: string): ChiralSystem => {
  // Enhanced resource mapping with better error handling and comprehensive type support
  const warnings: string[] = [];
  const unmappableResources: string[] = [];

  // Define resource type mappings per provider
  const resourceMappings = {
    aws: {
      k8s: ['aws_eks_cluster', 'aws_eks_node_group'],
      db: ['aws_db_instance', 'aws_rds_cluster'],
      vm: ['aws_instance'],
      network: ['aws_vpc', 'aws_subnet', 'aws_security_group']
    },
    azure: {
      k8s: ['azurerm_kubernetes_cluster', 'azurerm_kubernetes_cluster_node_pool'],
      db: ['azurerm_postgresql_flexible_server', 'azurerm_postgresql_server'],
      vm: ['azurerm_virtual_machine', 'azurerm_windows_virtual_machine'],
      network: ['azurerm_virtual_network', 'azurerm_subnet']
    },
    gcp: {
      k8s: ['google_container_cluster', 'google_container_node_pool'],
      db: ['google_sql_database_instance'],
      vm: ['google_compute_instance'],
      network: ['google_compute_network', 'google_compute_subnetwork']
    }
  };

  const providerMappings = resourceMappings[provider as keyof typeof resourceMappings] || resourceMappings.aws;

  // Enhanced filtering with specific resource types
  const k8sResources = resources.filter(r =>
    providerMappings.k8s.some(type => r.type === type) ||
    r.type?.includes('kubernetes') || r.type?.includes('eks') || r.type?.includes('aks') || r.type?.includes('gke')
  );
  const dbResources = resources.filter(r =>
    providerMappings.db.some(type => r.type === type) ||
    r.type?.includes('rds') || r.type?.includes('sql') || r.type?.includes('database')
  );
  const vmResources = resources.filter(r =>
    providerMappings.vm.some(type => r.type === type) ||
    r.type?.includes('instance') || r.type?.includes('vm') || r.type?.includes('compute')
  );
  const networkResources = resources.filter(r =>
    providerMappings.network.some(type => r.type === type) ||
    r.type?.includes('vpc') || r.type?.includes('vnet') || r.type?.includes('network') ||
    r.type?.includes('subnet') || r.type?.includes('security_group')
  );

  // Check for unmappable resources
  const allMappedTypes = Object.values(providerMappings).flat();
  resources.forEach(r => {
    if (!allMappedTypes.some(type => r.type === type) &&
        !r.type?.includes('kubernetes') && !r.type?.includes('eks') &&
        !r.type?.includes('aks') && !r.type?.includes('gke') &&
        !r.type?.includes('rds') && !r.type?.includes('sql') &&
        !r.type?.includes('database') && !r.type?.includes('instance') &&
        !r.type?.includes('vm') && !r.type?.includes('compute') &&
        !r.type?.includes('vpc') && !r.type?.includes('vnet') &&
        !r.type?.includes('network') && !r.type?.includes('subnet') &&
        !r.type?.includes('security_group')) {
      unmappableResources.push(r.type);
    }
  });

  if (unmappableResources.length > 0) {
    warnings.push(`Found ${unmappableResources.length} unmappable resource types: ${unmappableResources.slice(0, 5).join(', ')}${unmappableResources.length > 5 ? '...' : ''}. These will need manual migration.`);
  }

  // Migration analytics
  const migrationAnalytics = {
    totalResources: resources.length,
    mappableResources: resources.length - unmappableResources.length,
    unmappableResources: unmappableResources.length,
    resourceBreakdown: {
      k8s: k8sResources.length,
      database: dbResources.length,
      compute: vmResources.length,
      network: networkResources.length,
      other: resources.length - k8sResources.length - dbResources.length - vmResources.length - networkResources.length
    },
    confidence: calculateMigrationConfidence(resources, unmappableResources),
    estimatedEffort: estimateMigrationEffort(resources, unmappableResources)
  };

  // Display migration analytics
  console.log(`\n📊 Migration Analytics:`);
  console.log(`   Total Resources: ${migrationAnalytics.totalResources}`);
  console.log(`   Auto-mappable: ${migrationAnalytics.mappableResources} (${((migrationAnalytics.mappableResources / migrationAnalytics.totalResources) * 100).toFixed(1)}%)`);
  console.log(`   Manual Migration: ${migrationAnalytics.unmappableResources} (${((migrationAnalytics.unmappableResources / migrationAnalytics.totalResources) * 100).toFixed(1)}%)`);
  console.log(`   Confidence Level: ${migrationAnalytics.confidence}`);
  console.log(`   Estimated Effort: ${migrationAnalytics.estimatedEffort}`);

  console.log(`\n📋 Resource Breakdown:`);
  console.log(`   Kubernetes: ${migrationAnalytics.resourceBreakdown.k8s}`);
  console.log(`   Database: ${migrationAnalytics.resourceBreakdown.database}`);
  console.log(`   Compute: ${migrationAnalytics.resourceBreakdown.compute}`);
  console.log(`   Network: ${migrationAnalytics.resourceBreakdown.network}`);
  console.log(`   Other: ${migrationAnalytics.resourceBreakdown.other}`);

  if (migrationAnalytics.confidence === 'Low') {
    warnings.push('Low migration confidence detected. Consider breaking down your infrastructure into smaller, more manageable components.');
  }

  // Enhanced inference with better property extraction
  const inferKubernetesVersion = (resources: any[]): string => {
    for (const r of resources) {
      const props = r.values || r.properties || {};
      // Provider-specific version fields
      if (provider === 'aws' && props.version) return props.version;
      if (provider === 'azure' && props.kubernetes_version) return props.kubernetes_version;
      if (provider === 'gcp' && props.min_master_version) return props.min_master_version;
      // Generic fallbacks
      if (props.version || props.kubernetesVersion || props.kubernetes_version) {
        return props.version || props.kubernetesVersion || props.kubernetes_version;
      }
    }
    return '1.29'; // Latest stable
  };

  const inferNodeCount = (resources: any[], type: 'min' | 'max'): number => {
    let counts: number[] = [];

    for (const r of resources) {
      const props = r.values || r.properties || {};

      if (provider === 'aws') {
        if (r.type === 'aws_eks_node_group') {
          if (type === 'min' && props.scaling_config?.min_size) counts.push(props.scaling_config.min_size);
          if (type === 'max' && props.scaling_config?.max_size) counts.push(props.scaling_config.max_size);
        }
      } else if (provider === 'azure') {
        if (r.type === 'azurerm_kubernetes_cluster_node_pool') {
          if (type === 'min' && props.min_count) counts.push(props.min_count);
          if (type === 'max' && props.max_count) counts.push(props.max_count);
        }
      } else if (provider === 'gcp') {
        if (r.type === 'google_container_node_pool') {
          if (type === 'min' && props.autoscaling?.min_node_count) counts.push(props.autoscaling.min_node_count);
          if (type === 'max' && props.autoscaling?.max_node_count) counts.push(props.autoscaling.max_node_count);
        }
      }

      // Generic fallbacks
      const fallbackProps = [props.minSize, props.min_count, props.minNodes, props.minNodeCount];
      if (type === 'min' && fallbackProps.some(p => p !== undefined)) {
        counts.push(...fallbackProps.filter(p => p !== undefined));
      }
      const maxFallbackProps = [props.maxSize, props.max_count, props.maxNodes, props.maxNodeCount];
      if (type === 'max' && maxFallbackProps.some(p => p !== undefined)) {
        counts.push(...maxFallbackProps.filter(p => p !== undefined));
      }
    }

    return counts.length > 0 ? Math.max(...counts, 1) : (type === 'min' ? 1 : 5);
  };

  const inferWorkloadSize = (resources: any[]): 'small' | 'medium' | 'large' => {
    const instanceTypes: string[] = [];

    for (const r of resources) {
      const props = r.values || r.properties || {};

      // Extract instance types from different providers
      if (provider === 'aws') {
        if (r.type === 'aws_instance' && props.instance_type) instanceTypes.push(props.instance_type);
        if (r.type === 'aws_eks_node_group' && props.instance_types?.[0]) instanceTypes.push(props.instance_types[0]);
        if (r.type === 'aws_db_instance' && props.instance_class) instanceTypes.push(props.instance_class);
      } else if (provider === 'azure') {
        if (props.vm_size) instanceTypes.push(props.vm_size);
        if (props.sku_name) instanceTypes.push(props.sku_name);
      } else if (provider === 'gcp') {
        if (props.machine_type) instanceTypes.push(props.machine_type);
        if (props.tier) instanceTypes.push(props.tier);
      }

      // Generic fallbacks
      const fallbackTypes = [props.instanceType, props.vmSize, props.machineType, props.tier, props.sku];
      instanceTypes.push(...fallbackTypes.filter(t => t));
    }

    // Map to workload sizes
    const largePatterns = [
      /large/i, /xlarge/i, /2xlarge/i, /4xlarge/i, /8xlarge/i,
      /standard_d[4-9]/i, /n1-standard-[4-9]/i, /m5\./i, /db\..*\.large/i, /custom-[4-9]/i
    ];

    const mediumPatterns = [
      /medium/i, /t3\.medium/i, /standard_d[2-3]/i, /n1-standard-[2-3]/i,
      /e2-medium/i, /db-g1-small/i, /custom-2-/i, /db\.t3\.medium/i
    ];

    const hasLargeInstance = instanceTypes.some(type =>
      largePatterns.some(pattern => pattern.test(type))
    );

    const hasMediumInstance = instanceTypes.some(type =>
      mediumPatterns.some(pattern => pattern.test(type))
    );

    if (hasLargeInstance) return 'large';
    if (hasMediumInstance) return 'medium';
    return 'small';
  };

  const inferDatabaseVersion = (resources: any[]): string => {
    for (const r of resources) {
      const props = r.values || r.properties || {};
      if (provider === 'aws' && props.engine_version) return props.engine_version;
      if (provider === 'azure' && props.version) return props.version;
      if (provider === 'gcp' && props.database_version) return props.database_version;
      // Generic fallbacks
      if (props.engineVersion || props.engine || props.version) {
        return props.engineVersion || props.engine || props.version;
      }
    }
    return '15'; // PostgreSQL 15
  };

  const inferStorageSize = (resources: any[]): number => {
    for (const r of resources) {
      const props = r.values || r.properties || {};
      if (provider === 'aws' && props.allocated_storage) return props.allocated_storage;
      if (provider === 'azure' && props.storage_mb) return Math.ceil(props.storage_mb / 1024);
      if (provider === 'gcp' && props.settings?.disk_size) return props.settings.disk_size;
      // Generic fallbacks
      const storageProps = [props.allocatedStorage, props.storageSize, props.disk_size, props.storage_mb];
      const storage = storageProps.find(s => s !== undefined);
      if (storage) return typeof storage === 'string' ? parseInt(storage) : storage;
    }
    return 100; // 100GB default
  };

  const inferWindowsVersion = (resources: any[]): '2019' | '2022' => {
    for (const r of resources) {
      const props = r.values || r.properties || {};
      if (provider === 'aws' && props.ami && props.ami.includes('2019')) return '2019';
      if (provider === 'aws' && props.ami && props.ami.includes('2022')) return '2022';
      if (provider === 'azure' && props.source_image_reference?.offer?.includes('2019')) return '2019';
      if (provider === 'azure' && props.source_image_reference?.offer?.includes('2022')) return '2022';
      if (provider === 'gcp' && props.boot_disk?.initialize_params?.image?.includes('2019')) return '2019';
      if (provider === 'gcp' && props.boot_disk?.initialize_params?.image?.includes('2022')) return '2022';
    }
    return '2022'; // Default to latest
  };

  // Infer configuration from resources with improved logic
  const config: ChiralSystem = {
    projectName: stackName || 'imported-infrastructure',
    environment: 'prod', // Default to production for safety
    networkCidr: '10.0.0.0/16', // Default network
    k8s: {
      version: inferKubernetesVersion(k8sResources),
      minNodes: inferNodeCount(k8sResources, 'min'),
      maxNodes: inferNodeCount(k8sResources, 'max'),
      size: inferWorkloadSize(k8sResources.concat(vmResources))
    },
    postgres: {
      engineVersion: inferDatabaseVersion(dbResources),
      size: inferWorkloadSize(dbResources.concat(vmResources)),
      storageGb: inferStorageSize(dbResources)
    },
    adfs: {
      size: inferWorkloadSize(vmResources),
      windowsVersion: inferWindowsVersion(vmResources)
    }
  };

  // Add region inference if possible
  if (resources.length > 0) {
    config.region = inferRegion(resources, provider);
  }

  // Add warnings to config if any
  if (warnings.length > 0) {
    console.log(`\n⚠️  Migration Warnings:`);
    warnings.forEach(w => console.log(`   • ${w}`));
  }

  return config;
};

const writeChiralConfig = (config: ChiralSystem, outputPath: string) => {
  const content = `import { ChiralSystem } from './src/intent';\n\nexport const config: ChiralSystem = ${JSON.stringify(config, null, 2)};`;
  fs.writeFileSync(outputPath, content);
};

// Export types for users to import in their configs
export { ChiralSystem, EnvironmentTier, WorkloadSize, KubernetesIntent, DatabaseIntent, AdfsIntent } from './intent';
export { validateChiralConfig, checkDeploymentReadiness, checkCompliance } from './validation';

const calculateMigrationConfidence = (resources: any[], unmappableResources: string[]): 'High' | 'Medium' | 'Low' => {
  const totalResources = resources.length;
  const unmappableCount = unmappableResources.length;
  const unmappableRatio = unmappableCount / totalResources;

  if (unmappableRatio < 0.1) return 'High'; // <10% unmappable
  if (unmappableRatio < 0.3) return 'Medium'; // 10-30% unmappable
  return 'Low'; // >30% unmappable
};

const estimateMigrationEffort = (resources: any[], unmappableResources: string[]): string => {
  const totalResources = resources.length;
  const unmappableCount = unmappableResources.length;

  // Base effort calculation
  let effortDays = totalResources * 0.5; // 0.5 days per resource for auto-migration

  // Add effort for unmappable resources (manual migration)
  effortDays += unmappableCount * 2; // 2 days per unmappable resource

  // Add complexity factors
  if (totalResources > 50) effortDays *= 1.5; // Large infrastructure penalty
  if (unmappableResources.length > 10) effortDays *= 1.3; // Many unmappable resources penalty

  if (effortDays < 7) return `${Math.ceil(effortDays)} days`;
  if (effortDays < 30) return `${Math.ceil(effortDays / 7)} weeks`;
  return `${Math.ceil(effortDays / 30)} months`;
};
const program = new Command();

program
  .name('chiral')
  .description('Chiral Pattern: Stateless generation of K8s, Postgres, and AD FS across AWS, Azure, and GCP.')
  .version('1.0.0');

// Default compile command
program
  .command('compile', { isDefault: true })
  .description('Compile Chiral config into cloud artifacts')
  .requiredOption('-c, --config <path>', 'Path to the chiral config file (JS or TS)')
  .option('-o, --out <dir>', 'Output directory for generated files', 'dist')
  .action(async (options) => {
    const configPath = path.resolve(options.config);
    const DIST_DIR = path.resolve(options.out);

    // Load config dynamically
    let config: ChiralSystem;
    try {
      // For TS files, users need to transpile or use ts-node
      // Assume JS for now; users can build their config
      config = require(configPath).config || require(configPath);
      if (!config || typeof config !== 'object') {
        throw new Error('Config must export a "config" object or be the config object itself.');
      }
    } catch (error) {
      console.error(`❌ Failed to load config from ${configPath}:`, error instanceof Error ? error.message : String(error));
      process.exit(1);
    }

    // Warning for complex infra
    if (config.k8s && config.k8s.maxNodes > 10) {
      console.log(`⚠️  [Azure] Warning: Large cluster (${config.k8s.maxNodes} nodes) detected. Bicep may have performance issues with complex deployments. Consider using Terraform for Azure if you encounter issues.`);
    }

    // =================================================================
    // THE CHIRAL ENGINE (Orchestrator)
    // 1. Reads chiral config
    // 2. Instantiates Programmatic Adapter (AWS) -> Generates CDK and CloudFormation to dist/
    // 3. Instantiates Declarative Adapter (Azure) -> Generates Bicep to dist/
    // 4. Instantiates Declarative Adapter (GCP) -> Generates Google Cloud Infrastructure Manager Terraform Blueprint to dist/
    // 5. VALIDATES the generated Bicep using Azure CLI
    // =================================================================

    // Ensure output directory exists
    if (!fs.existsSync(DIST_DIR)) {
      fs.mkdirSync(DIST_DIR, { recursive: true });
    }

    console.log(`\n🧪 Starting Chiral Generation for: [${config.projectName}]`);

    // -----------------------------------------------------
    // 1. Generate via Programmatic Adapter (AWS CloudFormation)
    // -----------------------------------------------------
    const app = new cdk.App({
      outdir: path.join(DIST_DIR, 'aws-assembly')
    });

    new AwsCdkAdapter(app, 'AwsStack', config, {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: config.region?.aws || process.env.CDK_DEFAULT_REGION
      }
    });

    app.synth(); // This writes the CloudFormation template natively.
    console.log(`✅ [AWS]   CloudFormation synthesized to: ${path.relative(process.cwd(), path.join(DIST_DIR, 'aws-assembly'))}/`);

    // Estimate costs with Infracost
    console.log(`🔍 [AWS] Estimating costs with Infracost...`);
    try {
      const { AWSCostAnalyzer } = await import('./cost-analysis');
      const awsEstimate = await AWSCostAnalyzer.getAWSPricing(config, {
        region: config.region?.aws || 'us-east-1',
        detailed: true
      });
      console.log(`✅ [AWS] Cost estimation completed: $${awsEstimate.totalMonthlyCost.toFixed(2)}/month`);
      if (awsEstimate.warnings.length > 0) {
        console.log(`⚠️  [AWS] Warnings: ${awsEstimate.warnings.join(', ')}`);
      }
    } catch (error) {
      console.log(`⚠️  [AWS] Cost estimation failed or Infracost not installed. Install from https://www.infracost.io/`);
    }

    if (config.environment === 'prod') {
      console.log(`💡 [AWS] For production deployments, use CloudFormation stacks for complete mode and automatic cleanup:`);
      console.log(`   aws cloudformation deploy --template-file dist/aws-assembly/${config.projectName}-AwsStack.template.json --stack-name ${config.projectName}-stack --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM`);
    }

    // -----------------------------------------------------
    // 2. Generate via Declarative Adapter (Azure Bicep)
    // -----------------------------------------------------
    let bicepPath: string;
    try {
      // A. Generate the Bicep String
      const bicepContent = AzureBicepAdapter.generate(config);
      bicepPath = path.join(DIST_DIR, 'azure-deployment.bicep');

      // B. Write to Disk
      fs.writeFileSync(bicepPath, bicepContent);
      console.log(`✅ [Azure] Bicep template generated at:   ${path.relative(process.cwd(), bicepPath)}`);

      // Estimate costs
      console.log(`🔍 [Azure] Estimating costs with azure-cost-cli...`);
      try {
        execSync(`azure-cost-cli bicep --file ${bicepPath} --location ${config.region?.azure || 'eastus'}`, { stdio: 'inherit' });
        console.log(`✅ [Azure] Cost estimation completed.`);
      } catch (error) {
        console.log(`⚠️  [Azure] Cost estimation failed or azure-cost-cli not installed. Install from https://github.com/mivano/azure-cost-cli`);
      }

      // C. Validate Syntax (The Validation Step)
      // We use the 'az' CLI to ensure the generated text is valid Bicep.
      // This catches typos inside the template string in azure-right.ts.
      console.log(`🔍 [Azure] Validating Bicep syntax...`);

      // Check if Azure CLI is available
      let azAvailable = false;
      try {
        execSync('az --version', { stdio: 'ignore' });
        azAvailable = true;
      } catch {
        console.log(`⚠️  [Azure] Azure CLI not found. Skipping Bicep validation.`);
        console.log(`   Install Azure CLI (https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)`);
        console.log(`   or validate manually: az bicep build --file ${path.relative(process.cwd(), bicepPath)}`);
      }

      if (azAvailable) {
        // Running 'az bicep build' verifies the DSL structure, resource types, and types.
        execSync(`az bicep build --file ${bicepPath} --stdout`, { stdio: 'ignore' });
        console.log(`✅ [Azure] Validation Passed: Syntax is correct.`);
      } else {
        console.log(`⚠️  [Azure] Validation Skipped: Azure CLI not available.`);
      }

      if (config.environment === 'prod') {
        console.log(`💡 [Azure] For production deployments, use deployment stacks for complete mode and automatic cleanup:`);
        console.log(`   az stack group create --name ${config.projectName}-stack --resource-group <rg> --template-file ${path.relative(process.cwd(), bicepPath)} --action-on-unmanage deleteAll=resources`);
      }

    } catch (error) {
      console.error('\n' + '='.repeat(60));
      console.error('❌ [Azure] FATAL: Generated Bicep file contains syntax errors.');
      console.error('   The text in src/adapters/declarative/azure-bicep.ts produced invalid Bicep.');
      console.error('   Run "az bicep build --file dist/azure-deployment.bicep" to see exact errors.');
      console.error('='.repeat(60));
      console.error('\nDEBUGGING WORKFLOW:');
      console.error(`1. IDENTIFY: Run the following command to see the exact error and line number:`);
      console.error(`   > az bicep build --file ${path.join(DIST_DIR, 'azure-deployment.bicep')}`);

      console.error(`\n2. LOCATE: Open "src/adapters/declarative/azure-bicep.ts" and find the code corresponding`);
      console.error(`   to the line number reported in Step 1.`);

      console.error(`\n3. FIX: Correct the typo or syntax error inside the TypeScript backticks (\`).`);
      console.error(`   Alternatively, copy the error message from Step 1 and provide it to your`);
      console.error(`   AI Coding Agent's LLM (Large Language Model) to receive a corrected "azure-bicep.ts" file.`);

      console.error(`\n4. RETRY: Run "npm run compile" again.`);
      console.error('='.repeat(60) + '\n');

      process.exit(1);
    }

    // -----------------------------------------------------
    // 3. Generate via Declarative Adapter (GCP Terraform)
    // -----------------------------------------------------
    try {
      // A. Generate the Terraform HCL String
      const tfContent = GcpTerraformAdapter.generate(config);
      const tfPath = path.join(DIST_DIR, 'gcp-deployment.tf');

      // B. Write to Disk
      fs.writeFileSync(tfPath, tfContent);
      console.log(`✅ [GCP]   Terraform blueprint generated at: ${path.relative(process.cwd(), tfPath)}`);

      // D. Suggest backend if not configured
      if (!config.terraform?.backend) {
        console.log(`⚠️  [GCP] No remote backend configured. Consider setting terraform.backend in your config to use GCS for state management.`);
        console.log(`   This reduces risks of state corruption and improves team collaboration.`);
      }

      // C. Validate Syntax (Optional: Use terraform validate if available)
      console.log(`🔍 [GCP] Validating Terraform syntax...`);
      try {
        execSync('terraform --version', { stdio: 'ignore' });
        execSync(`terraform validate -json ${path.dirname(tfPath)}`, { stdio: 'ignore' });
        console.log(`✅ [GCP] Validation Passed: Syntax is correct.`);
      } catch {
        console.log(`⚠️  [GCP] Terraform CLI not found or validation failed. Skipping validation.`);
        console.log(`   Install Terraform CLI or validate manually.`);
      }

      // Estimate costs with Infracost
      console.log(`🔍 [GCP] Estimating costs with Infracost...`);
      try {
        const { GCPCostAnalyzer } = await import('./cost-analysis');
        const gcpEstimate = await GCPCostAnalyzer.getGCPPricing(config, {
          region: config.region?.gcp || 'us-central1',
          detailed: true
        });
        console.log(`✅ [GCP] Cost estimation completed: $${gcpEstimate.totalMonthlyCost.toFixed(2)}/month`);
        if (gcpEstimate.warnings.length > 0) {
          console.log(`⚠️  [GCP] Warnings: ${gcpEstimate.warnings.join(', ')}`);
        }
      } catch (error) {
        console.log(`⚠️  [GCP] Cost estimation failed or Infracost not installed. Install from https://www.infracost.io/`);
      }
    } catch (error) {
      console.error('\n' + '='.repeat(60));
      console.error('❌ [GCP] FATAL: Generated Terraform file contains syntax errors.');
      console.error('   The text in src/adapters/declarative/gcp-terraform.ts produced invalid Terraform.');
      console.error('='.repeat(60));
      process.exit(1);
    }

    if (config.environment === 'prod') {
      console.log(`💡 [GCP] For production deployments, use Google Cloud Infrastructure Manager with import policies for complete mode:`);
      console.log(`   gcloud infra-manager deployments apply projects/${config.region?.gcp?.split('-')[0] || 'my-project'}/locations/global/deployments/${config.projectName}-deployment --git-source-repo=https://github.com/my-org/my-repo --git-source-directory=dist --service-account=infra-manager@${config.region?.gcp?.split('-')[0] || 'my-project'}.iam.gserviceaccount.com`);
    }

    console.log(`\n🎉 Chiral Generation Complete! Check ${options.out} for generated artifacts.`);
  });

// Import command
program
  .command('import')
  .description('Import existing IaC into Chiral config')
  .requiredOption('-s, --source <path>', 'Path to IaC source file (.tf, .tfstate, .yaml, .json, .bicep)')
  .requiredOption('-p, --provider <provider>', 'Cloud provider: aws, azure, gcp')
  .option('-o, --output <path>', 'Output path for chiral config', 'chiral.config.ts')
  .action(async (options) => {
    const sourcePath = path.resolve(options.source);
    const provider = options.provider as 'aws' | 'azure' | 'gcp';
    const outputPath = path.resolve(options.output);

    console.log(`\n🧪 Importing IaC from [${sourcePath}] for [${provider}]`);

    try {
      const config = await importIaC(sourcePath, provider, path.basename(sourcePath, path.extname(sourcePath)));
      writeChiralConfig(config, outputPath);
      console.log(`✅ Import completed. Config written to: ${outputPath}`);
    } catch (error) {
      console.error(`❌ Import failed: ${error}`);
      process.exit(1);
    }
  });

// Terraform provider command
program
  .command('terraform-provider')
  .description('Generate and build Terraform provider for Chiral')
  .option('--build', 'Build the Go Terraform provider', false)
  .option('--example', 'Generate example Terraform configuration', false)
  .action(async (options) => {
    if (options.build) {
      console.log('🔨 Building Chiral Terraform Provider...');
      
      try {
        const { execSync } = require('child_process');
        execSync('cd src/adapters/terraform-provider && go build -o terraform-provider-chiral', { stdio: 'inherit' });
        console.log('✅ Terraform provider built successfully!');
        console.log('📁 Binary: src/adapters/terraform-provider/terraform-provider-chiral');
        console.log('💡 Install with: cp terraform-provider-chiral ~/.terraform.d/plugins/');
      } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
      }
    }
    
    if (options.example) {
      console.log('📝 Generating example Terraform configuration...');
      
      const exampleConfig = `
# Chiral Terraform Provider Example
terraform {
  required_providers {
    chiral = {
      source = "chiral-io/chiral"
      version = "~> 1.0"
    }
  }
}

resource "chiral_kubernetes_cluster" "main" {
  config = {
    project_name = "my-app"
    environment = "dev"
    k8s = {
      version = "1.35"
      min_nodes = 1
      max_nodes = 3
      size = "small"
    }
    postgres = {
      engine_version = "18.3"
      size = "small"
      storage_gb = 20
    }
    adfs = {
      size = "small"
      windows_version = "11 26H2 Build 26300.7877"
    }
  }
}
      `.trim();
      
      console.log(exampleConfig);
      console.log('\n💡 Save this as main.tf and run: terraform init && terraform apply');
    }
    
    if (!options.build && !options.example) {
      console.log('📚 Chiral Terraform Provider Usage:');
      console.log('');
      console.log('Build provider:');
      console.log('  chiral terraform-provider --build');
      console.log('');
      console.log('Generate example:');
      console.log('  chiral terraform-provider --example');
      console.log('');
      console.log('📖 See examples/terraform-provider-example/ for complete examples');
    }
  });

// Migrate command
program
  .command('migrate')
  .description('Migrate from Terraform or Pulumi to Chiral with analysis and guidance')
  .requiredOption('-s, --source <path>', 'Path to IaC source (Terraform .tfstate or Pulumi project directory)')
  .requiredOption('-p, --provider <provider>', 'Cloud provider: aws, azure, gcp')
  .option('-o, --output <path>', 'Output path for chiral config', 'chiral.config.ts')
  .option('--strategy <strategy>', 'Migration strategy: greenfield, progressive, parallel', 'progressive')
  .option('--terraform-bridge', 'Generate Terraform with cloud-native state delegation', false)
  .option('--pulumi-bridge', 'Generate Pulumi with cloud-native state delegation', false)
  .option('--iac-tool <tool>', 'IaC tool to migrate from: terraform, pulumi', 'terraform')
  .option('--analyze-only', 'Only analyze setup without migration', false)
  .action(async (options) => {
    const sourcePath = path.resolve(options.source);
    const provider = options.provider as 'aws' | 'azure' | 'gcp';
    const outputPath = path.resolve(options.output);
    const strategy = options.strategy as 'greenfield' | 'progressive' | 'parallel';
    const iacTool = options.iacTool as 'terraform' | 'pulumi';

    console.log(`\n🔄 ${iacTool.charAt(0).toUpperCase() + iacTool.slice(1)} to Chiral Migration Analysis`);
    console.log(`   Source: ${sourcePath}`);
    console.log(`   Provider: ${provider}`);
    console.log(`   Strategy: ${strategy}`);

    try {
      if (iacTool === 'terraform') {
        // Analyze Terraform setup first
        await analyzeTerraformSetup(sourcePath, provider, true);

        if (options.analyzeOnly) {
          console.log(`\n📊 Analysis complete. Use --no-analyze-only to proceed with migration.`);
          console.log(`\n📋 Migration Strategy Overview:`);
          console.log(getMigrationStrategyInfo(strategy));
          return;
        }

        // Generate migration plan
        console.log(`\n📋 Generating Migration Plan...`);
        const migrationPlan = await generateMigrationPlan(sourcePath, provider, strategy);

        console.log(`\n📝 Migration Plan:`);
        console.log(`   Estimated Duration: ${migrationPlan.estimatedDuration}`);
        console.log(`   Risk Level: ${migrationPlan.riskLevel}`);
        console.log(`   Steps Required: ${migrationPlan.steps.length}`);

        if (migrationPlan.preRequisites.length > 0) {
          console.log(`\n⚠️  Prerequisites:`);
          migrationPlan.preRequisites.forEach(prereq => console.log(`   • ${prereq}`));
        }

        console.log(`\n📋 Migration Steps:`);
        migrationPlan.steps.forEach((step, index) => {
          console.log(`   ${index + 1}. ${step.description}`);
          if (step.notes) console.log(`      Note: ${step.notes}`);
        });

        // Confirm before proceeding
        console.log(`\n🚨 This will generate a Chiral configuration from your Terraform state.`);
        console.log(`   Ensure you have backups and understand the migration process.`);

        // Import and migrate
        const config = await importIaC(sourcePath, provider, 'migrated-infrastructure');

        // Add migration settings
        config.migration = {
          strategy: strategy,
          sourceState: sourcePath,
          validateCompliance: true,
          rollbackPlan: migrationPlan.rollbackSteps
        };

        writeChiralConfig(config, outputPath);

        console.log(`\n✅ Migration completed!`);
        console.log(`   Config written to: ${outputPath}`);
        console.log(`   Next steps:`);
        console.log(`   1. Review the generated config for accuracy`);
        console.log(`   2. Test with 'chiral validate --config ${outputPath}'`);
        console.log(`   3. Generate artifacts with 'chiral --config ${outputPath}'`);
        console.log(`   4. Deploy using cloud-native tools (no Terraform state required)`);

        if (migrationPlan.postMigration.length > 0) {
          console.log(`\n📋 Post-Migration Tasks:`);
          migrationPlan.postMigration.forEach(task => console.log(`   • ${task}`));
        }
      } else if (iacTool === 'pulumi') {
        // Analyze Pulumi setup first
        await analyzePulumiSetup(sourcePath, provider, true);

        if (options.analyzeOnly) {
          console.log(`\n📊 Analysis complete. Use --no-analyze-only to proceed with migration.`);
          console.log(`\n📋 Migration Strategy Overview:`);
          console.log(getMigrationStrategyInfo(strategy));
          return;
        }

        // Generate migration plan
        console.log(`\n📋 Generating Migration Plan...`);
        const migrationPlan = await generateMigrationPlan(sourcePath, provider, strategy);

        console.log(`\n📝 Migration Plan:`);
        console.log(`   Estimated Duration: ${migrationPlan.estimatedDuration}`);
        console.log(`   Risk Level: ${migrationPlan.riskLevel}`);
        console.log(`   Steps Required: ${migrationPlan.steps.length}`);

        if (migrationPlan.preRequisites.length > 0) {
          console.log(`\n⚠️  Prerequisites:`);
          migrationPlan.preRequisites.forEach(prereq => console.log(`   • ${prereq}`));
        }

        console.log(`\n📋 Migration Steps:`);
        migrationPlan.steps.forEach((step, index) => {
          console.log(`   ${index + 1}. ${step.description}`);
          if (step.notes) console.log(`      Note: ${step.notes}`);
        });

        // Confirm before proceeding
        console.log(`\n🚨 This will generate a Chiral configuration from your Pulumi project.`);
        console.log(`   Ensure you have backups and understand the migration process.`);

        // Import and migrate
        const config = await importIaC(sourcePath, provider, 'migrated-infrastructure');

        // Add migration settings
        config.migration = {
          strategy: strategy,
          sourceState: sourcePath,
          validateCompliance: true,
          rollbackPlan: migrationPlan.rollbackSteps
        };

        writeChiralConfig(config, outputPath);

        console.log(`\n✅ Migration completed!`);
        console.log(`   Config written to: ${outputPath}`);
        console.log(`   Next steps:`);
        console.log(`   1. Review the generated config for accuracy`);
        console.log(`   2. Test with 'chiral validate --config ${outputPath}'`);
        console.log(`   3. Generate artifacts with 'chiral --config ${outputPath}'`);
        console.log(`   4. Deploy using cloud-native tools (no Pulumi state required)`);

        if (migrationPlan.postMigration.length > 0) {
          console.log(`\n📋 Post-Migration Tasks:`);
          migrationPlan.postMigration.forEach(task => console.log(`   • ${task}`));
        }
      }

    } catch (error) {
      console.error(`❌ Migration failed: ${error}`);
      console.error(`\n💡 Troubleshooting:`);
      if (iacTool === 'terraform') {
        console.error(`   1. Check that your Terraform state files are not corrupted`);
        console.error(`   2. Ensure you have the correct provider specified`);
        console.error(`   3. Try running 'chiral analyze --source ${sourcePath} --provider ${provider}' first`);
      } else if (iacTool === 'pulumi') {
        console.error(`   1. Check that your Pulumi.yaml file is valid`);
        console.error(`   2. Ensure you have the correct provider specified`);
        console.error(`   3. Try running 'chiral analyze --source ${sourcePath} --provider ${provider}' first`);
      }
      process.exit(1);
    }
  });

// Analyze command
program
  .command('analyze')
  .description('Analyze current IaC setup for state management risks and costs')
  .requiredOption('-s, --source <path>', 'Path to IaC source (Terraform .tfstate, Pulumi directory)')
  .requiredOption('-p, --provider <provider>', 'Cloud provider: aws, azure, gcp')
  .option('--iac-tool <tool>', 'IaC tool to analyze: terraform, pulumi', 'terraform')
  .option('--cost-comparison', 'Show detailed cost comparison with Chiral', false)
  .action(async (options) => {
    const sourcePath = path.resolve(options.source);
    const provider = options.provider as 'aws' | 'azure' | 'gcp';
    const iacTool = options.iacTool as 'terraform' | 'pulumi';

    console.log(`\n🔍 Analyzing ${iacTool.charAt(0).toUpperCase() + iacTool.slice(1)} Setup`);
    console.log(`   Source: ${sourcePath}`);
    console.log(`   Provider: ${provider}`);

    try {
      if (iacTool === 'terraform') {
        await analyzeTerraformSetup(sourcePath, provider, options.costComparison);
      } else if (iacTool === 'pulumi') {
        await analyzePulumiSetup(sourcePath, provider, options.costComparison);
      }
    } catch (error) {
      console.error(`❌ Analysis failed: ${error}`);
      process.exit(1);
    }
  });

// Cost Estimate command
program
  .command('cost-estimate')
  .description('Estimate infrastructure costs for all cloud providers')
  .requiredOption('-c, --config <path>', 'Path to chiral config file')
  .option('-p, --provider <provider>', 'Specific provider to analyze (aws, azure, gcp)')
  .option('--detailed', 'Show detailed cost breakdown', false)
  .option('--region <region>', 'Target region for pricing')
  .action(async (options) => {
    const configPath = path.resolve(options.config);
    const provider = options.provider as 'aws' | 'azure' | 'gcp' | undefined;

    console.log(`\n💰 Cost Estimation Analysis`);
    console.log(`   Config: ${configPath}`);
    if (provider) console.log(`   Provider: ${provider.toUpperCase()}`);
    if (options.region) console.log(`   Region: ${options.region}`);

    try {
      // Load config
      const config = require(configPath).config || require(configPath);
      
      // Import cost analysis modules
      const { CostAnalyzer, AzureCostAnalyzer, AWSCostAnalyzer, GCPCostAnalyzer } = await import('./cost-analysis');
      
      if (provider) {
        // Single provider analysis
        let estimate;
        switch (provider) {
          case 'azure':
            estimate = await AzureCostAnalyzer.getAzurePricing(config, {
              region: options.region,
              detailed: options.detailed
            });
            break;
          case 'aws':
            estimate = await AWSCostAnalyzer.getAWSPricing(config, {
              region: options.region,
              detailed: options.detailed
            });
            break;
          case 'gcp':
            estimate = await GCPCostAnalyzer.getGCPPricing(config, {
              region: options.region,
              detailed: options.detailed
            });
            break;
        }
        
        console.log(`\n📊 ${provider.toUpperCase()} Cost Estimate:`);
        console.log(`   Monthly Cost: $${estimate.totalMonthlyCost.toFixed(2)} ${estimate.currency}`);
        
        if (options.detailed) {
          console.log(`\n📈 Detailed Breakdown:`);
          console.log(`   Compute: $${estimate.breakdown.compute.total.toFixed(2)}`);
          console.log(`   Storage: $${estimate.breakdown.storage.total.toFixed(2)}`);
          console.log(`   Network: $${estimate.breakdown.network.total.toFixed(2)}`);
          console.log(`   Other: $${estimate.breakdown.other.total.toFixed(2)}`);
        }
        
        if (estimate.recommendations.length > 0) {
          console.log(`\n💡 Recommendations:`);
          estimate.recommendations.forEach(rec => console.log(`   • ${rec}`));
        }
        
        if (estimate.warnings.length > 0) {
          console.log(`\n⚠️  Warnings:`);
          estimate.warnings.forEach(warn => console.log(`   • ${warn}`));
        }
      } else {
        // Multi-cloud comparison
        const comparison = await CostAnalyzer.compareCosts(config, {
          region: options.region,
          detailed: options.detailed
        });
        
        const report = CostAnalyzer.generateCostReport(comparison, { detailed: options.detailed });
        console.log(report);
      }
      
    } catch (error) {
      console.error(`❌ Cost estimation failed: ${error}`);
      process.exit(1);
    }
  });

// Cost Analyze command
program
  .command('cost-analyze')
  .description('Analyze existing infrastructure costs')
  .option('-p, --provider <provider>', 'Cloud provider: aws, azure, gcp')
  .option('--subscription <subscription>', 'Azure subscription ID')
  .option('--project <project>', 'GCP project ID')
  .option('--account <account>', 'AWS account ID')
  .action(async (options) => {
    const provider = options.provider as 'aws' | 'azure' | 'gcp';

    console.log(`\n💰 Existing Infrastructure Cost Analysis`);
    console.log(`   Provider: ${provider?.toUpperCase() || 'All providers'}`);
    
    if (options.subscription) console.log(`   Subscription: ${options.subscription}`);
    if (options.project) console.log(`   Project: ${options.project}`);
    if (options.account) console.log(`   Account: ${options.account}`);

    try {
      // Import cost analysis modules
      const { AzureCostAnalyzer, AWSCostAnalyzer, GCPCostAnalyzer, CostAnalyzer } = await import('./cost-analysis');
      
      let costEstimate: any = null;
      
      if (provider === 'azure' && options.subscription) {
        console.log(`\n🔍 Analyzing Azure costs using azure-cost-cli...`);
        if (AzureCostAnalyzer.isAvailable()) {
          costEstimate = await AzureCostAnalyzer.analyzeAzureCosts(options.subscription, {});
          console.log(`\n📊 Azure Cost Analysis Results:`);
          console.log(`   Total Monthly Cost: $${costEstimate.totalMonthlyCost.toFixed(2)} ${costEstimate.currency}`);
          console.log(`   Compute: $${costEstimate.breakdown.compute.total.toFixed(2)}`);
          console.log(`   Storage: $${costEstimate.breakdown.storage.total.toFixed(2)}`);
          console.log(`   Network: $${costEstimate.breakdown.network.total.toFixed(2)}`);
          console.log(`   Other: $${costEstimate.breakdown.other.total.toFixed(2)}`);
          
          if (costEstimate.recommendations.length > 0) {
            console.log(`\n💡 Recommendations:`);
            costEstimate.recommendations.forEach((rec: string) => console.log(`   • ${rec}`));
          }
          
          if (costEstimate.warnings.length > 0) {
            console.log(`\n⚠️  Warnings:`);
            costEstimate.warnings.forEach((warn: string) => console.log(`   • ${warn}`));
          }
        } else {
          console.log(`   ⚠️  Install azure-cost-cli for detailed Azure cost analysis`);
          console.log(`   📦 Install from: https://github.com/mivano/azure-cost-cli`);
        }
      } else if (provider === 'aws' && options.account) {
        console.log(`\n🔍 Analyzing AWS costs using aws-cost-cli...`);
        if (AWSCostAnalyzer.isAWSCostCliAvailable()) {
          costEstimate = await AWSCostAnalyzer.analyzeAWSCosts(options.account, {});
          console.log(`\n📊 AWS Cost Analysis Results:`);
          console.log(`   Total Monthly Cost: $${costEstimate.totalMonthlyCost.toFixed(2)} ${costEstimate.currency}`);
          console.log(`   Compute: $${costEstimate.breakdown.compute.total.toFixed(2)}`);
          console.log(`   Storage: $${costEstimate.breakdown.storage.total.toFixed(2)}`);
          console.log(`   Network: $${costEstimate.breakdown.network.total.toFixed(2)}`);
          console.log(`   Other: $${costEstimate.breakdown.other.total.toFixed(2)}`);
          
          if (costEstimate.recommendations.length > 0) {
            console.log(`\n💡 Recommendations:`);
            costEstimate.recommendations.forEach((rec: string) => console.log(`   • ${rec}`));
          }
          
          if (costEstimate.warnings.length > 0) {
            console.log(`\n⚠️  Warnings:`);
            costEstimate.warnings.forEach((warn: string) => console.log(`   • ${warn}`));
          }
        } else {
          console.log(`   ⚠️  Install aws-cost-cli for detailed AWS cost analysis`);
          console.log(`   📦 Install from: npm install -g aws-cost-cli`);
        }
      } else if (provider === 'gcp' && options.project) {
        console.log(`\n🔍 Analyzing GCP costs using gcp-cost-cli...`);
        if (GCPCostAnalyzer.isGCPCostCliAvailable()) {
          costEstimate = await GCPCostAnalyzer.analyzeGCPCosts(options.project, {});
          console.log(`\n📊 GCP Cost Analysis Results:`);
          console.log(`   Total Monthly Cost: $${costEstimate.totalMonthlyCost.toFixed(2)} ${costEstimate.currency}`);
          console.log(`   Compute: $${costEstimate.breakdown.compute.total.toFixed(2)}`);
          console.log(`   Storage: $${costEstimate.breakdown.storage.total.toFixed(2)}`);
          console.log(`   Network: $${costEstimate.breakdown.network.total.toFixed(2)}`);
          console.log(`   Other: $${costEstimate.breakdown.other.total.toFixed(2)}`);
          
          if (costEstimate.recommendations.length > 0) {
            console.log(`\n💡 Recommendations:`);
            costEstimate.recommendations.forEach((rec: string) => console.log(`   • ${rec}`));
          }
          
          if (costEstimate.warnings.length > 0) {
            console.log(`\n⚠️  Warnings:`);
            costEstimate.warnings.forEach((warn: string) => console.log(`   • ${warn}`));
          }
        } else {
          console.log(`   ⚠️  Install gcp-cost-cli for detailed GCP cost analysis`);
          console.log(`   📦 Install from: npm install -g gcp-cost-cli`);
        }
      } else {
        console.log(`\n📊 Cost Analysis Results:`);
        console.log(`   Note: This feature requires integration with cloud provider billing APIs`);
        
        if (provider === 'azure' && !options.subscription) {
          console.log(`   💡 For Azure, provide --subscription <subscription-id>`);
        }
        if (provider === 'aws' && !options.account) {
          console.log(`   💡 For AWS, provide --account <account-id>`);
        }
        if (provider === 'gcp' && !options.project) {
          console.log(`   💡 For GCP, provide --project <project-id>`);
        }
        
        if (provider === 'azure' && AzureCostAnalyzer.isAvailable()) {
          console.log(`   ✅ azure-cost-cli is available for detailed Azure cost analysis`);
        } else if (provider === 'azure') {
          console.log(`   ⚠️  Install azure-cost-cli for detailed Azure cost analysis`);
          console.log(`   � Install from: https://github.com/mivano/azure-cost-cli`);
        }
        
        if (provider === 'aws' && AWSCostAnalyzer.isAvailable()) {
          console.log(`   ✅ AWS cost analysis tools available (infracost or AWS CLI)`);
        } else if (provider === 'aws') {
          console.log(`   ⚠️  Install infracost or AWS CLI for detailed AWS cost analysis`);
        }
        
        if (provider === 'gcp' && GCPCostAnalyzer.isAvailable()) {
          console.log(`   ✅ GCP cost analysis tools available (infracost or gcloud CLI)`);
        } else if (provider === 'gcp') {
          console.log(`   ⚠️  Install infracost or gcloud CLI for detailed GCP cost analysis`);
        }
        
        console.log(`\n🔍 Integration Points:`);
        console.log(`   AWS: Cost Explorer API + aws-cost-cli`);
        console.log(`   Azure: Cost Management API + azure-cost-cli`);
        console.log(`   GCP: Cloud Billing API + gcp-cost-cli`);
      }
    } catch (error) {
      console.error(`❌ Cost analysis failed: ${error}`);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate Chiral configuration for deployment readiness')
  .requiredOption('-c, --config <path>', 'Path to chiral config file')
  .option('--compliance <framework>', 'Compliance framework to check (soc2, iso27001, hipaa, fedramp-low, fedramp-moderate, fedramp-high, govramp-low, govramp-moderate, govramp-high, hitrust-low, hitrust-moderate, hitrust-high, hitech-low, hitech-moderate, hitech-high, hipaa-low, hipaa-moderate, hipaa-high, nist-low, nist-moderate, nist-high)', 'none')
  .action(async (options) => {
    const configPath = path.resolve(options.config);
    const framework = options.compliance as 'soc2' | 'iso27001' | 'hipaa' | 'fedramp-low' | 'fedramp-moderate' | 'fedramp-high' | 'govramp-low' | 'govramp-moderate' | 'govramp-high' | 'hitrust-low' | 'hitrust-moderate' | 'hitrust-high' | 'hitech-low' | 'hitech-moderate' | 'hitech-high' | 'hipaa-low' | 'hipaa-moderate' | 'hipaa-high' | 'nist-low' | 'nist-moderate' | 'nist-high' | 'dod-il2' | 'dod-il4' | 'dod-il5' | 'dod-il6' | 'none';

    console.log(`\n🔍 Validating Chiral Configuration`);
    console.log(`   Config: ${configPath}`);
    console.log(`   Compliance Framework: ${framework}`);

    try {
      // Load config
      const config = require(configPath).config || require(configPath);
      
      // Basic validation
      console.log(`\n📋 Basic Validation:`);
      const validationResult = validateChiralConfig(config);
      
      if (validationResult.valid) {
        console.log(`   ✅ Configuration is valid`);
      } else {
        console.log(`   ❌ Configuration has errors:`);
        validationResult.errors.forEach((error: string) => console.log(`     • ${error}`));
      }
      
      if (validationResult.warnings.length > 0) {
        console.log(`   ⚠️  Warnings:`);
        validationResult.warnings.forEach((warning: string) => console.log(`     • ${warning}`));
      }
      
      if (validationResult.recommendations.length > 0) {
        console.log(`   💡 Recommendations:`);
        validationResult.recommendations.forEach((rec: string) => console.log(`     • ${rec}`));
      }

      // Deployment readiness
      console.log(`\n🚀 Deployment Readiness:`);
      const readiness = await checkDeploymentReadiness(config);
      
      if (readiness.ready) {
        console.log(`   ✅ Ready for deployment`);
      } else {
        console.log(`   ❌ Not ready for deployment:`);
        readiness.blockers.forEach((blocker: string) => console.log(`     • ${blocker}`));
      }
      
      if (readiness.warnings.length > 0) {
        console.log(`   ⚠️  Deployment warnings:`);
        readiness.warnings.forEach((warning: string) => console.log(`     • ${warning}`));
      }

      // Compliance check
      let compliance: any = { compliant: true };
      if (framework !== 'none') {
        console.log(`\n🛡️  Compliance Check (${framework}):`);
        compliance = checkCompliance(config, framework);
        
        if (compliance.compliant) {
          console.log(`   ✅ Compliant with ${framework.toUpperCase()}`);
        } else {
          console.log(`   ❌ Not compliant with ${framework.toUpperCase()}:`);
          compliance.violations.forEach((violation: string) => console.log(`     • ${violation}`));
        }
        
        if (compliance.recommendations.length > 0) {
          console.log(`   💡 Compliance recommendations:`);
          compliance.recommendations.forEach((rec: string) => console.log(`     • ${rec}`));
        }
      }

      // Summary
      console.log(`\n📊 Validation Summary:`);
      console.log(`   Valid Configuration: ${validationResult.valid ? 'YES' : 'NO'}`);
      console.log(`   Deployment Ready: ${readiness.ready ? 'YES' : 'NO'}`);
      console.log(`   Compliance (${framework}): ${framework === 'none' ? 'N/A' : (compliance.compliant ? 'YES' : 'NO')}`);
      
      if (validationResult.valid && readiness.ready) {
        console.log(`\n🎉 Configuration is ready for deployment!`);
        console.log(`   Next step: Run 'chiral --config ${configPath}' to generate artifacts`);
      } else {
        console.log(`\n⚠️  Address the issues above before deployment.`);
      }
      
    } catch (error) {
      console.error(`❌ Validation failed: ${error}`);
      process.exit(1);
    }
  });

// Compare command
program
  .command('compare')
  .description('Compare Terraform vs Chiral approaches for your infrastructure')
  .option('--resources <number>', 'Number of resources in your Terraform setup', '100')
  .option('--team-size <number>', 'Size of your infrastructure team', '5')
  .option('--complexity <level>', 'Infrastructure complexity: simple, medium, complex', 'medium')
  .action(async (options) => {
    const resourceCount = parseInt(options.resources);
    const teamSize = parseInt(options.teamSize);
    const complexity = options.complexity as 'simple' | 'medium' | 'complex';

    console.log(`\n📊 Terraform vs Chiral Comparison`);
    console.log(`   Resources: ${resourceCount}`);
    console.log(`   Team Size: ${teamSize}`);
    console.log(`   Complexity: ${complexity}`);

    try {
      await compareApproaches(resourceCount, teamSize, complexity);
    } catch (error) {
      console.error(`❌ Comparison failed: ${error}`);
      process.exit(1);
    }
  });

// Helper functions for new commands
async function analyzeTerraformSetup(sourcePath: string, provider: string, detailedCosts: boolean = false) {
  console.log(`\n📋 Terraform Setup Analysis`);

  // Check if it's a directory or file
  const stats = fs.statSync(sourcePath);
  let stateFiles: string[] = [];

  if (stats.isDirectory()) {
    // Find all .tfstate files in directory
    stateFiles = fs.readdirSync(sourcePath)
      .filter(file => file.endsWith('.tfstate'))
      .map(file => path.join(sourcePath, file));
  } else if (sourcePath.endsWith('.tfstate')) {
    stateFiles = [sourcePath];
  }

  if (stateFiles.length === 0) {
    console.log(`⚠️  No Terraform state files found at ${sourcePath}`);
    return;
  }

  let totalResources = 0;
  let hasBackend = false;
  let backendType = 'local';
  let corruptionIssues: string[] = [];
  let securityRisks: string[] = [];
  let dependencyIssues: string[] = [];

  for (const stateFile of stateFiles) {
    try {
      const stateContent = fs.readFileSync(stateFile, 'utf8');
      const state = JSON.parse(stateContent);
      const resourceCount = state.resources?.length || 0;
      totalResources += resourceCount;

      console.log(`   📄 ${path.basename(stateFile)}: ${resourceCount} resources`);

      // Advanced state file analysis
      const analysis = analyzeStateFile(state, stateContent, stateFile);
      corruptionIssues.push(...analysis.corruptionIssues);
      securityRisks.push(...analysis.securityRisks);
      dependencyIssues.push(...analysis.dependencyIssues);

      // Check for backend configuration
      if (state.terraform) {
        hasBackend = true;
        backendType = state.terraform.backend?.type || 'unknown';
      }
    } catch (error) {
      corruptionIssues.push(`${path.basename(stateFile)}: Unable to parse state file - ${error instanceof Error ? error.message : String(error)}`);
      console.log(`   ❌ ${path.basename(stateFile)}: Unable to parse state file`);
    }
  }

  console.log(`\n📊 Analysis Results:`);
  console.log(`   Total Resources: ${totalResources}`);
  console.log(`   State Files: ${stateFiles.length}`);
  console.log(`   Backend Type: ${backendType}`);
  console.log(`   Provider: ${provider}`);

  // Enhanced risk assessment
  console.log(`\n⚠️  Risk Assessment:`);

  // Corruption risks
  if (corruptionIssues.length > 0) {
    console.log(`   🔴 CRITICAL ISSUES DETECTED:`);
    corruptionIssues.forEach(issue => console.log(`     • ${issue}`));
  }

  // Backend risks
  if (backendType === 'local') {
    console.log(`   🔴 HIGH RISK: Local state files are single points of failure`);
  } else if (backendType === 'unknown') {
    console.log(`   🟡 MEDIUM RISK: Backend configuration unclear`);
  } else {
    console.log(`   🟡 MEDIUM RISK: Remote backends still vulnerable to corruption and locking issues`);
  }

  if (totalResources > 100) {
    console.log(`   🔴 HIGH RISK: Large resource count increases state management complexity`);
  }

  if (stateFiles.length > 1) {
    console.log(`   🟡 MEDIUM RISK: Multiple state files increase coordination overhead`);
  }

  // Security risks
  if (securityRisks.length > 0) {
    console.log(`   🔴 SECURITY RISKS DETECTED:`);
    securityRisks.forEach(risk => console.log(`     • ${risk}`));
  }

  // Dependency issues
  if (dependencyIssues.length > 0) {
    console.log(`   🟡 DEPENDENCY CONCERNS:`);
    dependencyIssues.forEach(issue => console.log(`     • ${issue}`));
  }

  // Migration recommendations
  console.log(`\n🚀 Migration Recommendations:`);
  if (corruptionIssues.length === 0) {
    console.log(`   ✅ State files appear healthy - safe to proceed with migration`);
  } else {
    console.log(`   ⚠️  Address corruption issues before migration`);
  }

  if (securityRisks.length === 0) {
    console.log(`   ✅ No immediate security risks detected in state files`);
  } else {
    console.log(`   ⚠️  Clean sensitive data from state files before migration`);
  }

  console.log(`   💡 Use 'chiral migrate --source ${sourcePath} --provider ${provider}' to begin migration`);

  // Cost analysis
  if (detailedCosts) {
    console.log(`\n💰 Cost Analysis:`);
    const terraformCost = totalResources * 0.99; // $0.99 per resource per month
    const annualTerraformCost = terraformCost * 12;

    console.log(`   Terraform Premium: $${terraformCost.toFixed(2)}/month`);
    console.log(`   Annual Terraform Cost: $${annualTerraformCost.toFixed(2)}`);
    console.log(`   Chiral Cost: $0/month (no state management fees)`);
    console.log(`   Annual Savings: $${annualTerraformCost.toFixed(2)}`);
  }
}

async function analyzePulumiSetup(sourcePath: string, provider: string, detailedCosts: boolean = false) {
  console.log(`\n📋 Pulumi Setup Analysis`);

  // Check if it's a directory containing Pulumi.yaml
  const stats = fs.statSync(sourcePath);
  if (!stats.isDirectory()) {
    console.log(`⚠️  Pulumi analysis requires a directory containing Pulumi.yaml`);
    return;
  }

  const pulumiYamlPath = path.join(sourcePath, 'Pulumi.yaml');
  if (!fs.existsSync(pulumiYamlPath)) {
    console.log(`⚠️  No Pulumi.yaml found at ${pulumiYamlPath}`);
    return;
  }

  let totalResources = 0;
  let projectConfig: any = {};
  let hasBackend = false;
  let backendType = 'local';
  let language = 'unknown';
  let stateCorruptionIssues: string[] = [];
  let securityRisks: string[] = [];
  let complexityIssues: string[] = [];

  try {
    // Parse Pulumi.yaml
    const yamlContent = fs.readFileSync(pulumiYamlPath, 'utf8');
    projectConfig = yaml.load(yamlContent);

    console.log(`   📄 Pulumi.yaml found`);
    console.log(`   📄 Project: ${projectConfig.name || 'unnamed'}`);
    console.log(`   📄 Runtime: ${projectConfig.runtime || 'unknown'}`);

    language = projectConfig.runtime || 'unknown';

    // Check for backend configuration
    if (projectConfig.backend?.url) {
      hasBackend = true;
      backendType = projectConfig.backend.url.includes('s3://') ? 's3' :
                   projectConfig.backend.url.includes('azblob://') ? 'azblob' :
                   projectConfig.backend.url.includes('gs://') ? 'gcs' : 'custom';
    }

    // Look for Pulumi program files
    const programFiles = fs.readdirSync(sourcePath).filter(file => {
      if (language === 'python') return file.endsWith('__main__.py') || file.endsWith('.py');
      if (language === 'typescript' || language === 'nodejs') return file.endsWith('.ts') || file.endsWith('.js');
      if (language === 'go') return file.endsWith('.go');
      if (language === 'csharp' || language === 'dotnet') return file.endsWith('.cs');
      return file.endsWith('.yaml') || file.endsWith('.yml');
    });

    console.log(`   📄 Program files: ${programFiles.join(', ')}`);

    // Analyze YAML resources if present
    if (projectConfig.resources) {
      totalResources = Object.keys(projectConfig.resources).length;
      console.log(`   📄 YAML Resources: ${totalResources}`);

      // Analyze resource types
      const resourceTypes = Object.values(projectConfig.resources).map((r: any) => r.type);
      const uniqueTypes = [...new Set(resourceTypes)];
      console.log(`   📄 Resource Types: ${uniqueTypes.join(', ')}`);
    } else {
      // Try to analyze program files for resource count estimation
      console.log(`   📄 Analyzing program files for resource estimation...`);

      for (const file of programFiles) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          try {
            const content = fs.readFileSync(path.join(sourcePath, file), 'utf8');
            const yamlData = yaml.load(content);
            if (yamlData && typeof yamlData === 'object' && 'resources' in yamlData && yamlData.resources && typeof yamlData.resources === 'object') {
              totalResources += Object.keys(yamlData.resources).length;
            }
          } catch (error) {
            // Skip unparseable files
          }
        }
      }
    }

    // Check for Pulumi state files
    const stateFiles = fs.readdirSync(sourcePath).filter(file =>
      file.startsWith('.pulumi/stacks/') || file.includes('stacks')
    );

    if (stateFiles.length > 0) {
      console.log(`   📄 State files detected: ${stateFiles.length}`);
      stateCorruptionIssues.push('Pulumi state files present - state management still applies');
    }

    // Check for sensitive data in YAML
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /api[_-]?key/i,
      /token/i,
      /certificate/i,
      /private[_-]?key/i,
      /access[_-]?key/i,
      /connection[_-]?string/i
    ];

    sensitivePatterns.forEach(pattern => {
      if (pattern.test(yamlContent)) {
        securityRisks.push(`Sensitive data pattern detected in Pulumi.yaml: ${pattern.source}`);
      }
    });

    // Complexity analysis
    if (programFiles.length > 5) {
      complexityIssues.push('Large number of program files suggests complex setup');
    }

    if (totalResources > 50) {
      complexityIssues.push('High resource count may indicate complex migration');
    }

  } catch (error) {
    console.log(`   ❌ Unable to parse Pulumi.yaml: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  console.log(`\n📊 Analysis Results:`);
  console.log(`   Total Resources: ${totalResources}`);
  console.log(`   Language: ${language}`);
  console.log(`   Backend Type: ${backendType}`);
  console.log(`   Provider: ${provider}`);

  // Risk assessment for Pulumi
  console.log(`\n⚠️  Risk Assessment:`);

  // State management risks (Pulumi also has state!)
  if (stateCorruptionIssues.length > 0) {
    console.log(`   🔴 STATE MANAGEMENT ISSUES DETECTED:`);
    stateCorruptionIssues.forEach(issue => console.log(`     • ${issue}`));
  }

  console.log(`   🟡 MEDIUM RISK: Pulumi state management (similar to Terraform)`);
  console.log(`   🟡 MEDIUM RISK: Backend dependency for state storage`);

  if (backendType === 'local') {
    console.log(`   🔴 HIGH RISK: Local backend is single point of failure`);
  }

  if (totalResources > 100) {
    console.log(`   🔴 HIGH RISK: Large resource count increases complexity`);
  }

  // Security risks
  if (securityRisks.length > 0) {
    console.log(`   🔴 SECURITY RISKS DETECTED:`);
    securityRisks.forEach(risk => console.log(`     • ${risk}`));
  }

  // Complexity issues
  if (complexityIssues.length > 0) {
    console.log(`   🟡 COMPLEXITY CONCERNS:`);
    complexityIssues.forEach(issue => console.log(`     • ${issue}`));
  }

  // Migration recommendations
  console.log(`\n🚀 Migration Recommendations:`);
  if (stateCorruptionIssues.length === 0) {
    console.log(`   ✅ No immediate state corruption detected`);
  } else {
    console.log(`   ⚠️  Pulumi state management applies - consider state migration strategy`);
  }

  if (securityRisks.length === 0) {
    console.log(`   ✅ No immediate security risks detected in config`);
  } else {
    console.log(`   ⚠️  Clean sensitive data from Pulumi configuration`);
  }

  console.log(`   💡 Use 'chiral migrate --source ${sourcePath} --provider ${provider} --iac-tool pulumi' to begin migration`);

  // Cost analysis
  if (detailedCosts) {
    console.log(`\n💰 Cost Analysis:`);
    // Pulumi doesn't have the same premium pricing as Terraform, but there are operational costs
    const operationalCost = totalResources * 0.50; // Estimated operational overhead
    const annualOperationalCost = operationalCost * 12;

    console.log(`   Pulumi Operational Cost: $${operationalCost.toFixed(2)}/month (estimated)`);
    console.log(`   Annual Operational Cost: $${annualOperationalCost.toFixed(2)}`);
    console.log(`   Chiral Cost: $0/month (no state management fees)`);
    console.log(`   Annual Savings: $${annualOperationalCost.toFixed(2)}`);
  }
}

// Advanced state file analysis helper
function analyzeStateFile(state: any, stateContent: string, filePath: string): {
  corruptionIssues: string[];
  securityRisks: string[];
  dependencyIssues: string[];
} {
  const corruptionIssues: string[] = [];
  const securityRisks: string[] = [];
  const dependencyIssues: string[] = [];

  const fileName = path.basename(filePath);

  // Corruption detection
  if (!state.version || !state.serial || !state.lineage) {
    corruptionIssues.push(`${fileName}: Missing required fields (version, serial, lineage) - file may be corrupted`);
  }

  if (stateContent.includes('null') && stateContent.includes('undefined')) {
    corruptionIssues.push(`${fileName}: Contains null/undefined values - possible corruption detected`);
  }

  // Security analysis
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /api[_-]?key/i,
    /token/i,
    /certificate/i,
    /private[_-]?key/i,
    /access[_-]?key/i,
    /connection[_-]?string/i
  ];

  sensitivePatterns.forEach(pattern => {
    if (pattern.test(stateContent)) {
      securityRisks.push(`${fileName}: Contains sensitive data (${pattern.source}) - should be sanitized before migration`);
    }
  });

  // IP address exposure check
  const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  const ips = stateContent.match(ipPattern);
  if (ips && ips.length > 0) {
    securityRisks.push(`${fileName}: Contains ${ips.length} IP addresses - may expose internal network topology`);
  }

  // Dependency analysis
  if (state.resources) {
    const resources = state.resources;
    const resourceMap = new Map<string, any>();

    // Build resource map
    resources.forEach((resource: any) => {
      const key = `${resource.type}.${resource.name}`;
      resourceMap.set(key, resource);
    });

    // Check for cross-references
    resources.forEach((resource: any) => {
      const resourceKey = `${resource.type}.${resource.name}`;

      // Check instances for references
      if (resource.instances) {
        resource.instances.forEach((instance: any) => {
          if (instance.attributes) {
            Object.values(instance.attributes).forEach((attr: any) => {
              if (typeof attr === 'string') {
                // Look for references to other resources
                resourceMap.forEach((otherResource, otherKey) => {
                  if (otherKey !== resourceKey && attr.includes(otherResource.name)) {
                    dependencyIssues.push(`${resourceKey} references ${otherKey} - ensure dependencies are maintained in migration`);
                  }
                });
              }
            });
          }
        });
      }
    });

    // Check for complex dependencies
    const complexResources = resources.filter((r: any) =>
      r.type.includes('kubernetes') || r.type.includes('network') || r.type.includes('security')
    );
    if (complexResources.length > resources.length * 0.3) {
      dependencyIssues.push(`High number of complex resources (${complexResources.length}) - migration may require careful dependency ordering`);
    }
  }

  // State size analysis
  const fileSizeMB = Buffer.byteLength(stateContent, 'utf8') / (1024 * 1024);
  if (fileSizeMB > 50) {
    corruptionIssues.push(`${fileName}: State file is very large (${fileSizeMB.toFixed(1)}MB) - may indicate excessive state or corruption`);
  }

  return {
    corruptionIssues,
    securityRisks,
    dependencyIssues
  };
}

async function compareApproaches(resourceCount: number, teamSize: number, complexity: 'simple' | 'medium' | 'complex') {
  console.log(`\n📊 Detailed Comparison:`);
  
  // Terraform costs
  const terraformPremiumCost = resourceCount * 0.99; // per month
  const complexityMultiplier = complexity === 'simple' ? 1 : complexity === 'medium' ? 1.5 : 2;
  const operationalOverhead = teamSize * 40 * complexityMultiplier; // hours per month
  const operationalCost = operationalOverhead * 150; // $150/hour
  const totalTerraformCost = terraformPremiumCost + operationalCost;
  
  // Chiral costs
  const chiralOperationalOverhead = teamSize * 10 * complexityMultiplier; // much lower overhead
  const chiralOperationalCost = chiralOperationalOverhead * 150;
  const totalChiralCost = chiralOperationalCost; // no state management fees
  
  console.log(`\n💰 Monthly Cost Comparison:`);
  console.log(`\nTerraform Approach:`);
  console.log(`   Premium Fees: $${terraformPremiumCost.toFixed(2)}`);
  console.log(`   Operational Overhead: $${operationalCost.toFixed(2)} (${operationalOverhead} hours)`);
  console.log(`   Total Monthly Cost: $${totalTerraformCost.toFixed(2)}`);
  
  console.log(`\nChiral Approach:`);
  console.log(`   Premium Fees: $0.00`);
  console.log(`   Operational Overhead: $${chiralOperationalCost.toFixed(2)} (${chiralOperationalOverhead} hours)`);
  console.log(`   Chiral Cost: $${totalChiralCost.toFixed(2)}`);
  
  const monthlySavings = totalTerraformCost - totalChiralCost;
  const annualSavings = monthlySavings * 12;
  const savingsPercentage = (monthlySavings / totalTerraformCost) * 100;
  
  console.log(`\n💸 Savings Analysis:`);
  console.log(`   Monthly Savings: $${monthlySavings.toFixed(2)}`);
  console.log(`   Annual Savings: $${annualSavings.toFixed(2)}`);
  console.log(`   Cost Reduction: ${savingsPercentage.toFixed(1)}%`);
  
  console.log(`\n🛡️  Risk Comparison:`);
  console.log(`\nTerraform Risks:`);
  console.log(`   ❌ State corruption from concurrent modifications`);
  console.log(`   ❌ Lock contention and orphaned locks`);
  console.log(`   ❌ Backend management complexity`);
  console.log(`   ❌ Security risks from state file exposure`);
  console.log(`   ❌ Manual recovery procedures`);
  
  console.log(`\nChiral Benefits:`);
  console.log(`   ✅ Zero state architecture (no corruption possible)`);
  console.log(`   ✅ Native cloud concurrency controls`);
  console.log(`   ✅ No backend configuration required`);
  console.log(`   ✅ Built-in security and compliance`);
  console.log(`   ✅ Automatic rollback and recovery`);
}

// Migration helper functions
function getMigrationStrategyInfo(strategy: 'greenfield' | 'progressive' | 'parallel'): string {
  switch (strategy) {
    case 'greenfield':
      return `
Greenfield Migration:
- Complete migration in one go
- Lowest risk for new projects
- Requires full infrastructure recreation
- Best for simple setups or new environments`;

    case 'progressive':
      return `
Progressive Migration:
- Migrate resources incrementally
- Can run Terraform and Chiral in parallel during transition
- Higher complexity but lower risk
- Best for production environments with uptime requirements`;

    case 'parallel':
      return `
Parallel Migration:
- Deploy Chiral infrastructure alongside existing Terraform
- Use load balancer or DNS to switch traffic
- Highest safety but most complex
- Best for mission-critical systems`;
  }
}

async function generateMigrationPlan(sourcePath: string, provider: string, strategy: 'greenfield' | 'progressive' | 'parallel'): Promise<{
  estimatedDuration: string;
  riskLevel: string;
  preRequisites: string[];
  steps: Array<{ description: string; notes?: string }>;
  rollbackSteps: Array<{ description: string; notes?: string }>;
  postMigration: string[];
}> {
  // Analyze the source to determine complexity
  let resourceCount = 0;
  let hasComplexResources = false;

  try {
    const stats = fs.statSync(sourcePath);
    let stateFiles: string[] = [];

    if (stats.isDirectory()) {
      stateFiles = fs.readdirSync(sourcePath).filter(file => file.endsWith('.tfstate'));
    } else if (sourcePath.endsWith('.tfstate')) {
      stateFiles = [sourcePath];
    }

    for (const stateFile of stateFiles) {
      try {
        const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
        resourceCount += state.resources?.length || 0;

        // Check for complex resources
        if (state.resources?.some((r: any) =>
          r.type.includes('kubernetes') || r.type.includes('database') || r.type.includes('network')
        )) {
          hasComplexResources = true;
        }
      } catch (error) {
        // Skip corrupted files
      }
    }
  } catch (error) {
    // Default values if analysis fails
    resourceCount = 50;
    hasComplexResources = true;
  }

  // Generate plan based on strategy and complexity
  const basePlan = {
    estimatedDuration: resourceCount < 20 ? '1-2 days' : resourceCount < 100 ? '1-2 weeks' : '2-4 weeks',
    riskLevel: resourceCount < 20 ? 'Low' : resourceCount < 100 ? 'Medium' : 'High',
    preRequisites: [
      'Backup all Terraform state files',
      'Document critical resource dependencies',
      'Test Chiral configuration generation',
      'Set up monitoring for migration period',
      'Ensure team has Chiral training'
    ],
    postMigration: [
      'Monitor system for 24-48 hours',
      'Update CI/CD pipelines to use Chiral',
      'Archive Terraform configuration (do not delete)',
      'Update documentation and runbooks',
      'Conduct post-mortem review'
    ]
  };

  let steps: Array<{ description: string; notes?: string }> = [];
  let rollbackSteps: Array<{ description: string; notes?: string }> = [];

  switch (strategy) {
    case 'greenfield':
      steps = [
        { description: 'Generate Chiral configuration from Terraform state' },
        { description: 'Review and validate generated configuration' },
        { description: 'Create backup of current infrastructure state' },
        { description: 'Deploy Chiral infrastructure to new environment' },
        { description: 'Test functionality in new environment' },
        { description: 'Switch traffic to new infrastructure' },
        { description: 'Decommission old Terraform-managed resources' }
      ];
      rollbackSteps = [
        { description: 'Switch traffic back to original infrastructure' },
        { description: 'Destroy Chiral-deployed resources if needed' },
        { description: 'Restore from backups if necessary' }
      ];
      break;

    case 'progressive':
      steps = [
        { description: 'Analyze resource dependencies and create migration groups' },
        { description: 'Start with least critical resources (monitoring, logging)' },
        { description: 'Migrate network resources (VPC, subnets, security groups)' },
        { description: 'Migrate storage resources (databases, file systems)' },
        { description: 'Migrate compute resources (VMs, containers)' },
        { description: 'Update DNS and load balancer configurations' },
        { description: 'Validate each migration step before proceeding' },
        { description: 'Gradually increase traffic to migrated resources' }
      ];
      rollbackSteps = [
        { description: 'Identify and isolate problematic resources' },
        { description: 'Switch traffic back to Terraform-managed resources' },
        { description: 'Re-import resources back into Terraform if needed' },
        { description: 'Restore from backups for critical components' }
      ];
      break;

    case 'parallel':
      steps = [
        { description: 'Deploy Chiral infrastructure alongside existing Terraform' },
        { description: 'Configure load balancer for traffic splitting' },
        { description: 'Start with read-only traffic to test Chiral deployment' },
        { description: 'Gradually increase traffic percentage to Chiral (10%, 25%, 50%, 100%)' },
        { description: 'Monitor performance and error rates throughout' },
        { description: 'Complete full traffic switch when confident' },
        { description: 'Monitor for extended period before decommissioning Terraform' }
      ];
      rollbackSteps = [
        { description: 'Immediately switch all traffic back to Terraform infrastructure' },
        { description: 'Scale down Chiral infrastructure but keep running' },
        { description: 'Analyze root cause and fix issues' },
        { description: 'Gradually reintroduce traffic to Chiral after fixes' }
      ];
      break;
  }

  // Add complexity-based notes
  if (hasComplexResources) {
    steps.forEach(step => {
      if (step.description.includes('network') || step.description.includes('database')) {
        step.notes = 'High complexity - plan extra time for testing';
      }
    });
  }

  if (resourceCount > 100) {
    basePlan.preRequisites.push('Consider breaking migration into multiple phases');
    basePlan.postMigration.push('Schedule extended monitoring period (1-2 weeks)');
  }

  return {
    ...basePlan,
    steps,
    rollbackSteps
  };
}

// Export helper functions for testing
export { analyzeTerraformSetup, analyzePulumiSetup, compareApproaches, getMigrationStrategyInfo, generateMigrationPlan };

// Migration Wizard command
program
  .command('migration-wizard')
  .description('Interactive migration wizard for complex Terraform/Pulumi setups')
  .action(async () => {
    try {
      const wizard = new MigrationWizard();
      const config = await wizard.start();

      console.log('\n🎯 Migration Configuration Summary:');
      console.log(`   Source: ${config.sourcePath}`);
      console.log(`   Provider: ${config.provider}`);
      console.log(`   Output: ${config.outputPath}`);
      console.log(`   Strategy: ${config.strategy}`);

      // Generate migration plan
      const plan = MigrationWizard.generateMigrationPlan(config);
      console.log('\n📋 Generated Migration Plan:');
      console.log(plan);

      // Ask if user wants to proceed
      console.log('\n🚀 Ready to start migration?');
      console.log('   Run: chiral migrate -s <source> -p <provider> --strategy <strategy>');

    } catch (error) {
      console.error(`❌ Migration wizard failed: ${error}`);
      process.exit(1);
    }
  });

// Migration Playbooks command
program
  .command('migration-playbook')
  .description('Generate detailed migration playbooks with step-by-step instructions')
  .requiredOption('-s, --source <path>', 'Path to IaC source')
  .requiredOption('-p, --provider <provider>', 'Cloud provider: aws, azure, gcp')
  .option('--strategy <strategy>', 'Migration strategy: greenfield, progressive, parallel', 'progressive')
  .option('--iac-tool <tool>', 'IaC tool: terraform, pulumi', 'terraform')
  .option('-o, --output <path>', 'Output path for playbook file')
  .action(async (options) => {
    const sourcePath = path.resolve(options.source);
    const provider = options.provider as 'aws' | 'azure' | 'gcp';
    const strategy = options.strategy as 'greenfield' | 'progressive' | 'parallel';
    const iacTool = options.iacTool as 'terraform' | 'pulumi';

    console.log(`\n📚 Generating Migration Playbook`);
    console.log(`   Tool: ${iacTool.charAt(0).toUpperCase() + iacTool.slice(1)}`);
    console.log(`   Provider: ${provider}`);
    console.log(`   Strategy: ${strategy}`);

    try {
      const playbook = MigrationPlaybookGenerator.generateTerraformToChiralPlaybook({
        provider,
        strategy,
        sourcePath,
        outputPath: options.output || 'migration-playbook.md',
        includeAdvanced: true
      });

      // Display playbook
      console.log('\n' + '='.repeat(60));
      console.log(`📋 ${playbook.title}`);
      console.log('='.repeat(60));
      console.log(`Description: ${playbook.description}`);
      console.log(`Duration: ${playbook.estimatedDuration}`);
      console.log(`Difficulty: ${playbook.difficulty}`);
      console.log(`Steps: ${playbook.steps.length}`);

      console.log('\n⚠️ Prerequisites:');
      playbook.prerequisites.forEach(prereq => console.log(`   • ${prereq}`));

      console.log('\n📋 Migration Steps:');
      playbook.steps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step.title}`);
        console.log(`      ${step.description}`);
        if (step.estimatedTime) console.log(`      ⏱️  ${step.estimatedTime}`);
        if (step.critical) console.log(`      🚨 Critical step`);
      });

      console.log('\n🛟 Rollback Plan:');
      playbook.rollbackPlan.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step.title}`);
        console.log(`      ${step.description}`);
      });

      console.log('\n✅ Validation Steps:');
      playbook.validationSteps.forEach(step => console.log(`   • ${step}`));

      // Write playbook to file if requested
      if (options.output) {
        const playbookContent = `# ${playbook.title}

${playbook.description}

## Overview
- **Duration**: ${playbook.estimatedDuration}
- **Difficulty**: ${playbook.difficulty}
- **Steps**: ${playbook.steps.length}

## Prerequisites
${playbook.prerequisites.map(p => `- ${p}`).join('\n')}

## Migration Steps
${playbook.steps.map((step, index) =>
  `### ${index + 1}. ${step.title}
${step.description}
- **Time**: ${step.estimatedTime}
- **Critical**: ${step.critical ? 'Yes' : 'No'}`
).join('\n\n')}

## Rollback Plan
${playbook.rollbackPlan.map((step, index) =>
  `### ${index + 1}. ${step.title}
${step.description}
- **Time**: ${step.estimatedTime}`
).join('\n\n')}

## Validation Steps
${playbook.validationSteps.map(step => `- ${step}`).join('\n')}

## Troubleshooting
${playbook.troubleshooting.map(guide =>
  `### ${guide.issue}
**Symptoms:**
${guide.symptoms.map(s => `- ${s}`).join('\n')}

**Solution:** ${guide.solution}

${guide.commands ? `**Commands:**
${guide.commands.map(c => `\`\`\`bash\n${c}\n\`\`\``).join('\n')}` : ''}`
).join('\n\n')}

---
*Generated by Chiral Migration Playbook Generator*
`;

        fs.writeFileSync(options.output, playbookContent);
        console.log(`\n💾 Playbook saved to: ${options.output}`);
      }

    } catch (error) {
      console.error(`❌ Playbook generation failed: ${error}`);
      process.exit(1);
    }
  });

// Validation Scripts command
program
  .command('validation-scripts')
  .description('Generate post-migration validation scripts')
  .requiredOption('-p, --provider <provider>', 'Cloud provider: aws, azure, gcp')
  .requiredOption('-n, --project-name <name>', 'Project name')
  .option('-e, --environment <env>', 'Environment (dev/prod)', 'prod')
  .option('--include-connectivity', 'Include connectivity tests', true)
  .option('--include-performance', 'Include performance tests', false)
  .option('--include-security', 'Include security tests', true)
  .option('-o, --output <path>', 'Output path for validation script', 'migration-validation.sh')
  .action(async (options) => {
    const provider = options.provider as 'aws' | 'azure' | 'gcp';
    const projectName = options.projectName;
    const environment = options.environment;

    console.log(`\n🔍 Generating Validation Scripts`);
    console.log(`   Provider: ${provider}`);
    console.log(`   Project: ${projectName}`);
    console.log(`   Environment: ${environment}`);

    try {
      const scriptConfig = {
        provider,
        projectName,
        environment,
        includeConnectivityTests: options.includeConnectivity,
        includePerformanceTests: options.includePerformance,
        includeSecurityTests: options.includeSecurity
      };

      const validationScript = ValidationScriptGenerator.generateValidationScript(scriptConfig);

      // Write script to file
      fs.writeFileSync(options.output, validationScript);
      console.log(`\n✅ Validation script generated: ${options.output}`);
      console.log(`   Run with: chmod +x ${options.output} && ./${options.output}`);

      // Also display key sections
      console.log('\n📋 Script includes:');
      if (scriptConfig.includeConnectivityTests) console.log('   ✅ Connectivity tests');
      if (scriptConfig.includePerformanceTests) console.log('   ✅ Performance tests');
      if (scriptConfig.includeSecurityTests) console.log('   ✅ Security tests');
      console.log('   ✅ Resource validation');
      console.log('   ✅ Summary reporting');

    } catch (error) {
      console.error(`❌ Validation script generation failed: ${error}`);
      process.exit(1);
    }
  });

// Migration Templates command
program
  .command('migration-templates')
  .description('Show available migration templates and examples')
  .option('--list', 'List all available templates', false)
  .option('--generate <template>', 'Generate specific template (aws-eks-postgres)')
  .option('-o, --output <path>', 'Output path for generated template')
  .action(async (options) => {
    if (options.list) {
      console.log('\n📋 Available Migration Templates:');
      console.log('');
      console.log('AWS Templates:');
      console.log('  • aws-eks-postgres - Complete AWS EKS + PostgreSQL setup');
      console.log('    Includes: EKS cluster, RDS PostgreSQL, VPC networking, ADFS');
      console.log('');
      console.log('Azure Templates:');
      console.log('  • azure-aks-postgres - AKS + PostgreSQL flexible server');
      console.log('  • azure-vm-adfs - Azure VM with ADFS');
      console.log('');
      console.log('GCP Templates:');
      console.log('  • gcp-gke-postgres - GKE + Cloud SQL PostgreSQL');
      console.log('  • gcp-compute-adfs - Compute Engine VM with ADFS');
      console.log('');
      console.log('Usage:');
      console.log('  chiral migration-templates --generate aws-eks-postgres -o my-config.ts');
      return;
    }

    if (options.generate) {
      const template = options.generate;
      let templateContent: string;

      switch (template) {
        case 'aws-eks-postgres':
          templateContent = `import { ChiralSystem } from './src/intent';

export const config: ChiralSystem = ${JSON.stringify(awsEksPostgresTemplate, null, 2)};`;
          break;
        default:
          console.error(`❌ Unknown template: ${template}`);
          console.log('   Run "chiral migration-templates --list" to see available templates');
          process.exit(1);
      }

      const outputPath = options.output || `${template}-config.ts`;
      fs.writeFileSync(outputPath, templateContent);

      console.log(`\n✅ Template generated: ${outputPath}`);
      console.log(`   Template: ${template}`);
      console.log(`   Next steps:`);
      console.log(`   1. Review and customize the configuration`);
      console.log(`   2. Test with: chiral validate -c ${outputPath}`);
      console.log(`   3. Generate artifacts: chiral compile -c ${outputPath}`);

      return;
    }

    // Default: show usage
    console.log('\n📚 Chiral Migration Templates');
    console.log('');
    console.log('Templates provide starting configurations for common infrastructure patterns.');
    console.log('They include migration metadata and best practices.');
    console.log('');
    console.log('Commands:');
    console.log('  chiral migration-templates --list          # List all templates');
    console.log('  chiral migration-templates --generate <name> # Generate specific template');
    console.log('');
    console.log('Examples:');
    console.log('  chiral migration-templates --generate aws-eks-postgres -o my-aws-config.ts');
  });

// Only parse CLI if not in test environment
if (require.main === module && !process.env.JEST_WORKER_ID) {
  program.parse();
}
