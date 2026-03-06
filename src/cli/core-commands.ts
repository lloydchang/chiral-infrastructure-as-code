// File: src/cli/core-commands.ts

// CHIRAL CORE CLI - Minimalist Infrastructure Commands
// =================================================================
// PURPOSE: CLI interface for pure Chiral core functionality
// PRINCIPLE: Core CLI works 100% without outer layer dependencies
// GUARANTEE: PERMANENT ARCHITECTURAL SEPARATION ENFORCED
// =================================================================

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { ChiralCoreEngine } from '../core';
import { ChiralSystem } from '../intent';

/**
 * Setup core-only CLI commands - NO AI, NO AGENTS, NO OUTER LAYER
 */
export function setupCoreCommands(program: Command): void {
  const coreCmd = program
    .command('core')
    .description('Chiral Core - Minimalist Infrastructure Engine (No AI Dependencies)')
    .alias('c');

  // Core compile command - PURE DETERMINISTIC
  coreCmd
    .command('compile')
    .description('Generate infrastructure artifacts deterministically (No AI enhancement)')
    .requiredOption('-c, --config <path>', 'Path to Chiral configuration file')
    .option('-o, --output <path>', 'Output directory', 'dist')
    .option('--providers <providers>', 'Cloud providers (comma-separated)', 'aws,azure,gcp')
    .action(async (options) => {
      try {
        console.log('🏗️  CHIRAL CORE - Deterministic Infrastructure Generation');
        console.log('🚫 No AI agents, No external dependencies');
        
        // Load configuration
        const configPath = path.resolve(options.config);
        if (!fs.existsSync(configPath)) {
          throw new Error(`Configuration file not found: ${configPath}`);
        }
        
        const config: ChiralSystem = require(configPath);
        
        // CORE VALIDATION - Infrastructure only
        console.log('🔍 Validating infrastructure configuration...');
        const validation = ChiralCoreEngine.validate(config);
        
        if (!validation.valid) {
          console.error('❌ Configuration validation failed:');
          validation.errors.forEach(error => console.error(`   - ${error}`));
          process.exit(1);
        }
        
        if (validation.warnings.length > 0) {
          console.log('⚠️  Warnings:');
          validation.warnings.forEach(warning => console.log(`   - ${warning}`));
        }
        
        // CORE GENERATION - Pure deterministic
        console.log('⚙️  Generating infrastructure artifacts...');
        const startTime = Date.now();
        
        const artifacts = await ChiralCoreEngine.generate(config);
        const duration = Date.now() - startTime;
        
        // Output results
        const outputDir = path.resolve(options.output);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Write artifacts
        if (artifacts.aws) {
          const awsPath = path.join(outputDir, 'aws-cloudformation.json');
          fs.writeFileSync(awsPath, artifacts.aws);
          console.log(`✅ AWS CloudFormation: ${path.relative(process.cwd(), awsPath)}`);
        }
        
        if (artifacts.azure) {
          const azurePath = path.join(outputDir, 'azure-bicep.bicep');
          fs.writeFileSync(azurePath, artifacts.azure);
          console.log(`✅ Azure Bicep: ${path.relative(process.cwd(), azurePath)}`);
        }
        
        if (artifacts.gcp) {
          const gcpPath = path.join(outputDir, 'gcp-terraform.tf');
          fs.writeFileSync(gcpPath, artifacts.gcp);
          console.log(`✅ GCP Terraform: ${path.relative(process.cwd(), gcpPath)}`);
        }
        
        console.log(`🎯 Core generation completed in ${duration}ms`);
        console.log('📊 Generated deterministic infrastructure artifacts');
        
      } catch (error) {
        console.error(`❌ Core compilation failed: ${error}`);
        process.exit(1);
      }
    });

  // Core validate command - INFRASTRUCTURE ONLY
  coreCmd
    .command('validate')
    .description('Validate infrastructure configuration (No AI validation)')
    .requiredOption('-c, --config <path>', 'Path to Chiral configuration file')
    .option('-f, --frameworks <frameworks>', 'Compliance frameworks (comma-separated)', 'soc2,hipaa')
    .action(async (options) => {
      try {
        console.log('🔍 CHIRAL CORE - Infrastructure Validation');
        console.log('🚫 No AI agents, No external dependencies');
        
        // Load configuration
        const configPath = path.resolve(options.config);
        const config: ChiralSystem = require(configPath);
        
        // CORE VALIDATION
        const validation = ChiralCoreEngine.validate(config);
        
        console.log('\n📋 Validation Results:');
        console.log(`Valid: ${validation.valid ? '✅ YES' : '❌ NO'}`);
        
        if (validation.errors.length > 0) {
          console.log('\n❌ Errors:');
          validation.errors.forEach(error => console.log(`   - ${error}`));
        }
        
        if (validation.warnings.length > 0) {
          console.log('\n⚠️  Warnings:');
          validation.warnings.forEach(warning => console.log(`   - ${warning}`));
        }
        
        if (validation.recommendations.length > 0) {
          console.log('\n💡 Recommendations:');
          validation.recommendations.forEach(rec => console.log(`   - ${rec}`));
        }
        
        // COMPLIANCE CHECKING (if frameworks specified)
        if (options.frameworks) {
          const frameworks = options.frameworks.split(',');
          console.log('\n🔒 Compliance Checking:');
          
          for (const framework of frameworks) {
            const compliance = ChiralCoreEngine.checkCompliance(config, framework);
            console.log(`\n${framework.toUpperCase()}: ${compliance.compliant ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
            
            if (compliance.violations.length > 0) {
              console.log('Violations:');
              compliance.violations.forEach(v => console.log(`   - ${v.description || v.id}`));
            }
            
            if (compliance.recommendations.length > 0) {
              console.log('Recommendations:');
              compliance.recommendations.forEach(rec => console.log(`   - ${rec}`));
            }
          }
        }
        
        // Exit with error code if validation failed
        process.exit(validation.valid ? 0 : 1);
        
      } catch (error) {
        console.error(`❌ Core validation failed: ${error}`);
        process.exit(1);
      }
    });

  // Core cost analysis command - INFRASTRUCTURE COSTS ONLY
  coreCmd
    .command('cost')
    .description('Analyze infrastructure costs (No AI optimization)')
    .requiredOption('-c, --config <path>', 'Path to Chiral configuration file')
    .option('--providers <providers>', 'Cloud providers (comma-separated)', 'aws,azure,gcp')
    .action(async (options) => {
      try {
        console.log('💰 CHIRAL CORE - Infrastructure Cost Analysis');
        console.log('🚫 No AI agents, No external dependencies');
        
        // Load configuration
        const configPath = path.resolve(options.config);
        const config: ChiralSystem = require(configPath);
        
        // CORE COST ANALYSIS
        const costAnalysis = ChiralCoreEngine.analyzeCosts(config);
        
        console.log('\n📊 Cost Analysis Results:');
        console.log(`Cheapest Provider: ${costAnalysis.cheapest.provider}`);
        console.log(`Lowest Cost: $${costAnalysis.cheapest.cost}/month`);
        console.log(`Savings: $${costAnalysis.cheapest.savings}/month`);
        
        console.log('\n💰 Provider Estimates:');
        Object.entries(costAnalysis.estimates).forEach(([provider, estimate]: [string, any]) => {
          console.log(`\n${provider.toUpperCase()}:`);
          console.log(`  Total Cost: $${estimate.totalCost}/month`);
          if (estimate.breakdown) {
            console.log('  Breakdown:');
            Object.entries(estimate.breakdown).forEach(([component, cost]) => {
              console.log(`    ${component}: $${cost}/month`);
            });
          }
        });
        
        if (costAnalysis.recommendations.length > 0) {
          console.log('\n💡 Cost Optimization Recommendations:');
          costAnalysis.recommendations.forEach(rec => console.log(`   - ${rec}`));
        }
        
      } catch (error) {
        console.error(`❌ Core cost analysis failed: ${error}`);
        process.exit(1);
      }
    });

  // Core drift detection command - INFRASTRUCTURE DRIFT ONLY
  coreCmd
    .command('drift')
    .description('Detect infrastructure drift (No AI analysis)')
    .requiredOption('-c, --config <path>', 'Path to Chiral configuration file')
    .option('-a, --artifacts <path>', 'Path to generated artifacts directory')
    .action(async (options) => {
      try {
        console.log('🔍 CHIRAL CORE - Infrastructure Drift Detection');
        console.log('🚫 No AI agents, No external dependencies');
        
        // Load configuration
        const configPath = path.resolve(options.config);
        const config: ChiralSystem = require(configPath);
        
        // Load artifacts
        const artifactsDir = path.resolve(options.artifacts);
        const artifacts: any = {};
        
        if (fs.existsSync(path.join(artifactsDir, 'aws-cloudformation.json'))) {
          artifacts.aws = fs.readFileSync(path.join(artifactsDir, 'aws-cloudformation.json'), 'utf8');
        }
        
        if (fs.existsSync(path.join(artifactsDir, 'azure-bicep.bicep'))) {
          artifacts.azure = fs.readFileSync(path.join(artifactsDir, 'azure-bicep.bicep'), 'utf8');
        }
        
        if (fs.existsSync(path.join(artifactsDir, 'gcp-terraform.tf'))) {
          artifacts.gcp = fs.readFileSync(path.join(artifactsDir, 'gcp-terraform.tf'), 'utf8');
        }
        
        // CORE DRIFT DETECTION
        const driftResult = ChiralCoreEngine.detectDrift(config, artifacts);
        
        console.log('\n🔍 Drift Detection Results:');
        console.log(`Drift Detected: ${driftResult.hasDrift ? '❌ YES' : '✅ NO'}`);
        
        if (driftResult.hasDrift) {
          console.log(`\n📋 Summary: ${driftResult.summary}`);
          
          if (driftResult.driftedResources.length > 0) {
            console.log('\n🔄 Drifted Resources:');
            driftResult.driftedResources.forEach(resource => console.log(`   - ${resource}`));
          }
          
          if (driftResult.missingResources.length > 0) {
            console.log('\n❌ Missing Resources:');
            driftResult.missingResources.forEach(resource => console.log(`   - ${resource}`));
          }
          
          if (driftResult.addedResources.length > 0) {
            console.log('\n➕ Added Resources:');
            driftResult.addedResources.forEach(resource => console.log(`   - ${resource}`));
          }
        } else {
          console.log('✅ Infrastructure is in sync with generated artifacts');
        }
        
      } catch (error) {
        console.error(`❌ Core drift detection failed: ${error}`);
        process.exit(1);
      }
    });

  // Core status command - ARCHITECTURAL GUARANTEES
  coreCmd
    .command('status')
    .description('Check core architectural guarantees (No AI dependencies)')
    .action(async () => {
      console.log('🏗️  CHIRAL CORE - Architectural Status');
      console.log('🚫 No AI agents, No external dependencies');
      
      console.log('\n🔒 Core Architectural Guarantees:');
      console.log(`✅ Core Isolation: ${ChiralCoreEngine.verifyIsolation() ? 'ENFORCED' : 'VIOLATION'}`);
      console.log(`✅ Deterministic Operation: ${ChiralCoreEngine.verifyDeterministic() ? 'ENFORCED' : 'VIOLATION'}`);
      console.log(`✅ Infrastructure Focus: ${ChiralCoreEngine.verifyInfrastructureFocus() ? 'ENFORCED' : 'VIOLATION'}`);
      
      console.log('\n📋 Core Principles:');
      console.log('  🚫 NO AI/AGENT DEPENDENCIES');
      console.log('  🚫 NO OUTER LAYER IMPORTS');
      console.log('  🚫 DETERMINISTIC ONLY');
      console.log('  🚫 INFRASTRUCTURE FOCUS');
      console.log('  🚫 STATELESS GENERATION');
      console.log('  🚫 MINIMAL DEPENDENCIES');
      
      console.log('\n💡 Core Usage:');
      console.log('  chiral core compile -c config.ts');
      console.log('  chiral core validate -c config.ts');
      console.log('  chiral core cost -c config.ts');
      console.log('  chiral core drift -c config.ts -a dist/');
    });
}
