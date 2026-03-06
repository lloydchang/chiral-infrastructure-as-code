// File: src/agents/iac-generator.ts

import { BaseAgent } from './base-agent';
import { ChiralSystem } from '../intent';
import { IaCPlan } from './iac-planner';
import { ResourceDesign } from './storage-designer';

export interface GeneratedIaC {
  provider: 'aws' | 'azure' | 'gcp';
  code: string;
  language: 'typescript' | 'hcl' | 'bicep';
  artifacts: { [filename: string]: string };
}

export class IaCGeneratorAgent extends BaseAgent {
  constructor(cloudAgent: any) {
    super('IaCGenerator', cloudAgent);
  }

  async process(config: ChiralSystem, plan: IaCPlan, design?: ResourceDesign): Promise<GeneratedIaC> {
    console.log(`[${this.name}] Generating IaC code for ${plan.provider}`);

    // Receive message from IaCPlanner
    const messages = this.getMessages();
    const planMessage = messages.find(m => m.type === 'plan');
    if (planMessage) {
      plan = { ...plan, ...planMessage.payload };
    }

    // Merge design if available
    const fullDesign = design || this.extractDesignFromPlan(plan);

    // Generate IaC code using LLM
    const generated = await this.generateWithLLM(config, plan, fullDesign);

    console.log(`[${this.name}] IaC generation complete: ${generated.language} code for ${generated.provider}`);

    // Send message to IaCOptimizer
    this.sendMessage('IaCOptimizer', 'generation', generated);

    return generated;
  }

  private extractDesignFromPlan(plan: IaCPlan): ResourceDesign {
    // Extract design info from plan if not provided separately
    // This is a fallback; ideally design is passed
    return {
      provider: plan.provider,
      k8s: { nodeCount: 3, storageType: 'ssd' },
      postgres: { storageGb: 100, storageType: 'ssd' },
      adfs: { storageType: 'ssd' },
      optimizations: { columnarEncoding: false, compression: false, caching: false }
    };
  }

  private async generateWithLLM(config: ChiralSystem, plan: IaCPlan, design: ResourceDesign): Promise<GeneratedIaC> {
    const provider = plan.provider;

    let language: 'typescript' | 'hcl' | 'bicep';
    let framework: string;

    if (provider === 'aws') {
      language = 'typescript';
      framework = 'AWS CDK';
    } else if (provider === 'azure') {
      language = 'bicep';
      framework = 'Azure Bicep';
    } else {
      language = 'hcl';
      framework = 'Google Cloud Terraform';
    }

    const prompt = `
Generate optimized IaC code for this Chiral infrastructure configuration using ${framework}:

Configuration: ${JSON.stringify(config, null, 2)}
Execution Plan: ${JSON.stringify(plan, null, 2)}
Resource Design: ${JSON.stringify(design, null, 2)}

Requirements:
- Use ${language} syntax
- Implement all steps from the execution plan
- Use the specified instance types and configurations from design
- Include proper dependencies and resource references
- Add security best practices (encryption, access controls)
- Optimize for cost and performance
- Include monitoring and logging where appropriate

Generate complete, runnable ${framework} code that deploys the full Chiral infrastructure (K8s cluster, PostgreSQL database, ADFS VM).

Return the generated code as a string, properly formatted and commented.
`;

    try {
      const code = await this.invokeLLM(prompt);

      // Validate and format the code
      const validatedCode = this.validateAndFormatCode(code, language);

      return {
        provider,
        code: validatedCode,
        language,
        artifacts: {
          [`main.${language === 'typescript' ? 'ts' : language === 'hcl' ? 'tf' : 'bicep'}`]: validatedCode
        }
      };
    } catch (error) {
      console.warn(`[${this.name}] IaC generation failed:`, error);
      // Fallback to deterministic generation
      const fallbackCode = this.generateFallback(config, plan, design);
      return {
        provider,
        code: fallbackCode,
        language,
        artifacts: {
          [`main.${language === 'typescript' ? 'ts' : language === 'hcl' ? 'tf' : 'bicep'}`]: fallbackCode
        }
      };
    }
  }

  private validateAndFormatCode(code: string, language: string): string {
    // Basic validation - in production, use linters/formatters
    if (!code || code.length < 100) {
      throw new Error('Generated code too short or empty');
    }

    // Basic formatting
    return code.trim();
  }

  private generateFallback(config: ChiralSystem, plan: IaCPlan, design: ResourceDesign): string {
    // Fallback to existing adapters if LLM fails
    console.log(`[${this.name}] Using fallback generation`);

    if (plan.provider === 'aws') {
      // Use existing AwsCdkAdapter logic
      return `// Fallback CDK code for ${config.projectName}
// Generated deterministically due to LLM failure
import * as cdk from 'aws-cdk-lib';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class ${config.projectName}Stack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'Vpc', {
      cidr: '${config.networkCidr}',
      maxAzs: 2
    });

    // EKS Cluster
    new eks.Cluster(this, 'EksCluster', {
      vpc,
      version: '${config.k8s.version}',
      defaultCapacity: ${config.k8s.maxNodes}
    });

    // RDS Database
    new rds.DatabaseInstance(this, 'Database', {
      vpc,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.${config.postgres.engineVersion.replace('.', '')}
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.${config.postgres.size === 'small' ? 'T3' : config.postgres.size === 'medium' ? 'T3' : 'M5'}, ec2.InstanceSize.${config.postgres.size === 'small' ? 'SMALL' : config.postgres.size === 'medium' ? 'MEDIUM' : 'LARGE'}),
      allocatedStorage: ${config.postgres.storageGb}
    });
  }
}`;
    } else if (plan.provider === 'azure') {
      // Use existing AzureBicepAdapter logic
      return `// Fallback Bicep code for ${config.projectName}
// Generated deterministically due to LLM failure
@description('Generated Chiral infrastructure for ${config.projectName}')
param location string = resourceGroup().location
param projectPrefix string = '${config.projectName}'

// Virtual Network
resource vnet 'Microsoft.Network/virtualNetworks@2021-02-01' = {
  name: '\${projectPrefix}-vnet'
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: [
        '${config.networkCidr}'
      ]
    }
  }
}

// AKS Cluster
resource aks 'Microsoft.ContainerService/managedClusters@2021-05-01' = {
  name: '\${projectPrefix}-aks'
  location: location
  properties: {
    kubernetesVersion: '${config.k8s.version}'
    agentPoolProfiles: [
      {
        name: 'default'
        count: ${config.k8s.maxNodes}
        vmSize: '${config.k8s.size === 'small' ? 'Standard_B2s' : config.k8s.size === 'medium' ? 'Standard_D2s_v3' : 'Standard_D4s_v3'}'
        mode: 'System'
      }
    ]
  }
}

// PostgreSQL Server
resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: '\${projectPrefix}-postgres'
  location: location
  properties: {
    version: '${config.postgres.engineVersion}'
    storage: {
      storageSizeGB: ${config.postgres.storageGb}
    }
  }
}`;
    } else {
      // Use existing GcpTerraformAdapter logic
      return `# Fallback Terraform code for ${config.projectName}
# Generated deterministically due to LLM failure
terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  region = "us-central1"
}

# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "${config.projectName}-vpc"
  auto_create_subnetworks = false
}

# Subnet
resource "google_compute_subnetwork" "subnet" {
  name          = "${config.projectName}-subnet"
  ip_cidr_range = "${config.networkCidr}"
  region        = "us-central1"
  network       = google_compute_network.vpc.id
}

# GKE Cluster
resource "google_container_cluster" "gke" {
  name     = "${config.projectName}-gke"
  location = "us-central1"
  
  node_pool {
    name = "default-pool"
    node_count = ${config.k8s.maxNodes}
    
    node_config {
      machine_type = "${config.k8s.size === 'small' ? 'e2-small' : config.k8s.size === 'medium' ? 'e2-medium' : 'n1-standard-2'}"
    }
  }
}

# Cloud SQL PostgreSQL
resource "google_sql_database_instance" "postgres" {
  name             = "${config.projectName}-postgres"
  database_version = "POSTGRES_${config.postgres.engineVersion}"
  region           = "us-central1"
  
  settings {
    tier = "${config.postgres.size === 'small' ? 'db-g1-small' : config.postgres.size === 'medium' ? 'db-custom-2-4096' : 'db-custom-4-8192'}"
    disk_size = ${config.postgres.storageGb}
  }
}`;
    }
  }
}
