// File: src/cli/traffic-commands.ts

import { Command } from 'commander';
import { TrafficEnforcer, TrafficEnforcementConfig } from '../migration/traffic-enforcer';
import * as fs from 'fs';
import * as path from 'path';

/**
 * CLI commands for traffic enforcement
 */
export function setupTrafficCommands(program: Command): void {
  const trafficCmd = program
    .command('traffic')
    .description('Traffic enforcement and migration commands');

  // Start traffic enforcement
  trafficCmd
    .command('enforce')
    .description('Start traffic enforcement with 100% consistency requirement')
    .option('-c, --config <path>', 'Traffic enforcement configuration file')
    .option('-p, --provider <provider>', 'Cloud provider (aws|azure|gcp)', 'aws')
    .option('-n, --project <name>', 'Project name')
    .option('-e, --environment <env>', 'Environment (dev|staging|prod)', 'staging')
    .option('-m, --mode <mode>', 'Enforcement mode (gradual|immediate|scheduled)', 'gradual')
    .option('-s, --steps <numbers>', 'Traffic percentage steps (comma-separated)', '10,25,50,75,100')
    .option('-d, --duration <minutes>', 'Duration between steps in minutes', '15')
    .option('-t, --threshold <percentage>', 'Health check threshold percentage', '5')
    .option('-r, --region <region>', 'Cloud provider region')
    .option('--no-rollback', 'Disable automatic rollback on failure')
    .option('--monitoring-window <minutes>', 'Health monitoring window in minutes', '10')
    .action(async (options) => {
      try {
        const config = await buildTrafficConfig(options);
        const enforcer = new TrafficEnforcer(config);
        
        console.log('🚦 Starting Traffic Enforcement');
        console.log(`📊 Target: 100% traffic migration`);
        console.log(`⚙️  Mode: ${config.enforcementMode}`);
        console.log(`📈 Steps: ${config.trafficSteps.join('%')}`);
        
        const result = await enforcer.startEnforcement();
        
        console.log('\n📋 Enforcement Results:');
        console.log(`✅ Completed Steps: ${result.completedSteps}/${result.totalSteps}`);
        console.log(`🎯 Current Traffic: ${result.currentPercentage}%`);
        console.log(`⏱️  Duration: ${Date.now() - result.startTime.getTime()}ms`);
        
        if (result.rollbackTriggered) {
          console.log(`🚨 Rollback Triggered: ${result.rollbackReason}`);
        }
        
        // Generate report
        const report = enforcer.generateReport();
        const reportPath = path.join(process.cwd(), 'traffic-enforcement-report.md');
        fs.writeFileSync(reportPath, report);
        console.log(`📄 Report saved: ${reportPath}`);
        
      } catch (error) {
        console.error(`❌ Traffic enforcement failed: ${error}`);
        process.exit(1);
      }
    });

  // Get traffic enforcement status
  trafficCmd
    .command('status')
    .description('Get current traffic enforcement status')
    .option('-c, --config <path>', 'Traffic enforcement configuration file')
    .action(async (options) => {
      try {
        const config = await buildTrafficConfig(options);
        const enforcer = new TrafficEnforcer(config);
        
        const status = enforcer.getStatus();
        
        if (!status) {
          console.log('ℹ️  No traffic enforcement currently in progress');
          return;
        }
        
        console.log('📊 Traffic Enforcement Status:');
        console.log(`Current Step: ${status.currentStep}/${status.totalSteps}`);
        console.log(`Current Traffic: ${status.currentPercentage}%`);
        console.log(`Progress: ${Math.round((status.completedSteps / status.totalSteps) * 100)}%`);
        console.log(`Error Rate: ${status.healthMetrics.averageErrorRate.toFixed(2)}%`);
        console.log(`Response Time: ${status.healthMetrics.averageResponseTime}ms`);
        
        if (status.rollbackTriggered) {
          console.log(`🚨 Rollback: ${status.rollbackReason}`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to get status: ${error}`);
        process.exit(1);
      }
    });

  // Stop traffic enforcement
  trafficCmd
    .command('stop')
    .description('Stop current traffic enforcement and revert traffic')
    .option('-c, --config <path>', 'Traffic enforcement configuration file')
    .action(async (options) => {
      try {
        const config = await buildTrafficConfig(options);
        const enforcer = new TrafficEnforcer(config);
        
        console.log('🛑 Stopping traffic enforcement...');
        await enforcer.stopEnforcement();
        console.log('✅ Traffic enforcement stopped - traffic reverted to original infrastructure');
        
      } catch (error) {
        console.error(`❌ Failed to stop enforcement: ${error}`);
        process.exit(1);
      }
    });

  // Generate traffic enforcement configuration template
  trafficCmd
    .command('init')
    .description('Generate traffic enforcement configuration template')
    .option('-o, --output <path>', 'Output file path', 'traffic-config.json')
    .action(async (options) => {
      try {
        const template: TrafficEnforcementConfig = {
          provider: 'aws',
          projectName: 'my-project',
          environment: 'staging',
          region: 'us-east-1',
          enforcementMode: 'gradual',
          trafficSteps: [10, 25, 50, 75, 100],
          stepDurationMinutes: 15,
          rollbackOnFailure: true,
          healthCheckThreshold: 5,
          monitoringWindowMinutes: 10
        };
        
        fs.writeFileSync(options.output, JSON.stringify(template, null, 2));
        console.log(`✅ Traffic configuration template created: ${options.output}`);
        console.log('📝 Edit the configuration and run: chiral traffic enforce -c ' + options.output);
        
      } catch (error) {
        console.error(`❌ Failed to create template: ${error}`);
        process.exit(1);
      }
    });

  // Validate traffic configuration
  trafficCmd
    .command('validate')
    .description('Validate traffic enforcement configuration')
    .option('-c, --config <path>', 'Traffic enforcement configuration file')
    .action(async (options) => {
      try {
        const config = await buildTrafficConfig(options);
        
        console.log('✅ Traffic configuration is valid');
        console.log(`Provider: ${config.provider}`);
        console.log(`Project: ${config.projectName}`);
        console.log(`Environment: ${config.environment}`);
        console.log(`Mode: ${config.enforcementMode}`);
        console.log(`Steps: ${config.trafficSteps.join('%')}`);
        console.log(`Duration: ${config.stepDurationMinutes} minutes`);
        console.log(`Rollback: ${config.rollbackOnFailure ? 'Enabled' : 'Disabled'}`);
        console.log(`Health Threshold: ${config.healthCheckThreshold}%`);
        
      } catch (error) {
        console.error(`❌ Configuration validation failed: ${error}`);
        process.exit(1);
      }
    });
}

/**
 * Build traffic enforcement configuration from CLI options
 */
async function buildTrafficConfig(options: any): Promise<TrafficEnforcementConfig> {
  let config: TrafficEnforcementConfig;

  // Load from config file if provided
  if (options.config) {
    if (!fs.existsSync(options.config)) {
      throw new Error(`Configuration file not found: ${options.config}`);
    }
    
    const configContent = fs.readFileSync(options.config, 'utf8');
    config = JSON.parse(configContent);
  } else {
    // Build from CLI options
    config = {
      provider: options.provider,
      projectName: options.project || process.env.PROJECT_NAME || 'my-project',
      environment: options.environment,
      region: options.region || getDefaultRegion(options.provider),
      enforcementMode: options.mode,
      trafficSteps: options.steps.split(',').map((s: string) => parseInt(s.trim())),
      stepDurationMinutes: parseInt(options.duration),
      rollbackOnFailure: options.rollback !== false,
      healthCheckThreshold: parseFloat(options.threshold),
      monitoringWindowMinutes: parseInt(options.monitoringWindow)
    };
  }

  // Validate configuration
  validateTrafficConfig(config);
  
  return config;
}

/**
 * Validate traffic enforcement configuration
 */
function validateTrafficConfig(config: TrafficEnforcementConfig): void {
  const errors: string[] = [];

  // Validate provider
  if (!['aws', 'azure', 'gcp'].includes(config.provider)) {
    errors.push(`Invalid provider: ${config.provider}. Must be aws, azure, or gcp`);
  }

  // Validate traffic steps
  if (!Array.isArray(config.trafficSteps) || config.trafficSteps.length === 0) {
    errors.push('Traffic steps must be a non-empty array');
  } else {
    const lastStep = config.trafficSteps[config.trafficSteps.length - 1];
    if (lastStep !== 100) {
      errors.push(`Last traffic step must be 100%, got ${lastStep}%`);
    }
    
    for (let i = 0; i < config.trafficSteps.length; i++) {
      const step = config.trafficSteps[i];
      if (step < 0 || step > 100) {
        errors.push(`Traffic step ${i} must be between 0 and 100, got ${step}`);
      }
      
      if (i > 0 && step <= config.trafficSteps[i - 1]) {
        errors.push(`Traffic step ${i} (${step}%) must be greater than previous step (${config.trafficSteps[i - 1]}%)`);
      }
    }
  }

  // Validate durations
  if (config.stepDurationMinutes < 1) {
    errors.push('Step duration must be at least 1 minute');
  }

  if (config.monitoringWindowMinutes < 1) {
    errors.push('Monitoring window must be at least 1 minute');
  }

  // Validate health threshold
  if (config.healthCheckThreshold < 0 || config.healthCheckThreshold > 100) {
    errors.push('Health check threshold must be between 0 and 100');
  }

  // Validate enforcement mode
  if (!['gradual', 'immediate', 'scheduled'].includes(config.enforcementMode)) {
    errors.push(`Invalid enforcement mode: ${config.enforcementMode}`);
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Get default region for provider
 */
function getDefaultRegion(provider: string): string {
  const defaults = {
    aws: 'us-east-1',
    azure: 'eastus',
    gcp: 'us-central1'
  };
  
  return defaults[provider as keyof typeof defaults] || 'us-east-1';
}
