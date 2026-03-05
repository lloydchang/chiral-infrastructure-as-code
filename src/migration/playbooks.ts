// File: src/migration/playbooks.ts

// Migration Playbooks with Step-by-Step Instructions
// Generate detailed migration guides for different scenarios

export interface MigrationPlaybook {
  title: string;
  description: string;
  estimatedDuration: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prerequisites: string[];
  steps: MigrationStep[];
  rollbackPlan: RollbackStep[];
  validationSteps: string[];
  troubleshooting: TroubleshootingGuide[];
}

export interface MigrationStep {
  id: string;
  title: string;
  description: string;
  commands?: string[];
  manualSteps?: string[];
  estimatedTime: string;
  critical: boolean;
  validation?: string;
}

export interface RollbackStep {
  id: string;
  title: string;
  description: string;
  commands?: string[];
  estimatedTime: string;
}

export interface TroubleshootingGuide {
  issue: string;
  symptoms: string[];
  solution: string;
  commands?: string[];
}

export class MigrationPlaybookGenerator {
  static generateTerraformToChiralPlaybook(config: {
    provider: 'aws' | 'azure' | 'gcp';
    strategy: 'greenfield' | 'progressive' | 'parallel';
    sourcePath: string;
    outputPath: string;
    includeAdvanced: boolean;
  }): MigrationPlaybook {
    const basePlaybook: MigrationPlaybook = {
      title: `Terraform to Chiral Migration (${config.provider.toUpperCase()})`,
      description: `Complete migration guide from Terraform to Chiral Infrastructure as Code using ${config.strategy} strategy`,
      estimatedDuration: this.getEstimatedDuration(config.strategy),
      difficulty: this.getDifficulty(config.strategy),
      prerequisites: this.getPrerequisites(config.provider),
      steps: this.generateSteps(config),
      rollbackPlan: this.generateRollbackPlan(config),
      validationSteps: this.getValidationSteps(config.provider),
      troubleshooting: this.getTroubleshootingGuides(config.provider)
    };

    return basePlaybook;
  }

  private static getEstimatedDuration(strategy: string): string {
    switch (strategy) {
      case 'greenfield': return '2-4 hours';
      case 'progressive': return '1-2 weeks';
      case 'parallel': return '2-4 weeks';
      default: return '1 week';
    }
  }

  private static getDifficulty(strategy: string): 'easy' | 'medium' | 'hard' {
    switch (strategy) {
      case 'greenfield': return 'easy';
      case 'progressive': return 'medium';
      case 'parallel': return 'hard';
      default: return 'medium';
    }
  }

  private static getPrerequisites(provider: string): string[] {
    const common = [
      'Node.js 18+ installed',
      'Cloud provider CLI configured',
      'Terraform state files accessible',
      'Backup of current infrastructure',
      'Team approval for migration'
    ];

    const providerSpecific = {
      aws: ['AWS CLI configured with appropriate permissions', 'CloudFormation deploy permissions'],
      azure: ['Azure CLI configured', 'ARM deployment permissions'],
      gcp: ['Google Cloud CLI configured', 'Infrastructure Manager permissions']
    };

    return [...common, ...providerSpecific[provider as keyof typeof providerSpecific]];
  }

  private static generateSteps(config: {
    provider: 'aws' | 'azure' | 'gcp';
    strategy: 'greenfield' | 'progressive' | 'parallel';
    sourcePath: string;
    outputPath: string;
    includeAdvanced: boolean;
  }): MigrationStep[] {
    const steps: MigrationStep[] = [
      {
        id: 'analysis',
        title: 'Infrastructure Analysis',
        description: 'Analyze current Terraform setup for migration risks and compatibility',
        commands: [
          `chiral migrate -s ${config.sourcePath} -p ${config.provider} --iac-tool terraform --analyze-only`,
          `chiral cost-compare -c ${config.outputPath}  # Preview cost savings`
        ],
        estimatedTime: '30 minutes',
        critical: true,
        validation: 'Review analysis report for high-risk items'
      },
      {
        id: 'backup',
        title: 'Create Infrastructure Backup',
        description: 'Ensure all critical data and configurations are backed up',
        manualSteps: [
          'Backup Terraform state files',
          'Document critical resource dependencies',
          'Create database backups if applicable',
          'Document business requirements and SLAs'
        ],
        estimatedTime: '1 hour',
        critical: true,
        validation: 'Verify backups are restorable'
      },
      {
        id: 'import',
        title: 'Import Terraform Configuration',
        description: 'Convert Terraform resources to Chiral intent schema',
        commands: [
          `chiral import -s ${config.sourcePath} -p ${config.provider} -o ${config.outputPath}`
        ],
        estimatedTime: '15 minutes',
        critical: true,
        validation: 'Review generated Chiral configuration for accuracy'
      }
    ];

    // Add strategy-specific steps
    switch (config.strategy) {
      case 'greenfield':
        steps.push(...this.getGreenfieldSteps(config));
        break;
      case 'progressive':
        steps.push(...this.getProgressiveSteps(config));
        break;
      case 'parallel':
        steps.push(...this.getParallelSteps(config));
        break;
    }

    // Add common final steps
    steps.push(
      {
        id: 'validate',
        title: 'Post-Migration Validation',
        description: 'Run validation of migrated infrastructure',
        commands: [
          `chiral validate -c ${config.outputPath} --compliance soc2`,
          `# Run generated validation script`,
          `chmod +x migration-validation.sh && ./migration-validation.sh`
        ],
        estimatedTime: '2 hours',
        critical: true,
        validation: 'All validation checks pass'
      },
      {
        id: 'monitor',
        title: 'Monitoring and Optimization',
        description: 'Monitor migrated infrastructure and optimize as needed',
        manualSteps: [
          'Monitor application performance for 24-48 hours',
          'Review cost reports and optimize resource sizing',
          'Update documentation and runbooks',
          'Train team on Chiral workflows'
        ],
        estimatedTime: '1 week',
        critical: false,
        validation: 'Performance meets or exceeds pre-migration levels'
      }
    );

    return steps;
  }

  private static getGreenfieldSteps(config: {
    provider: 'aws' | 'azure' | 'gcp';
    sourcePath: string;
    outputPath: string;
  }): MigrationStep[] {
    return [
      {
        id: 'deploy-chiral',
        title: 'Deploy Chiral Infrastructure',
        description: 'Deploy new infrastructure using Chiral-generated artifacts',
        commands: [
          `chiral compile -c ${config.outputPath} -o dist`,
          this.getDeployCommand(config.provider, 'dist')
        ],
        estimatedTime: '1 hour',
        critical: true,
        validation: 'All resources deploy successfully'
      },
      {
        id: 'migrate-data',
        title: 'Migrate Application Data',
        description: 'Migrate databases and application data to new infrastructure',
        manualSteps: [
          'Create database backups',
          'Migrate data using appropriate tools (DMS, pg_dump/pg_restore, etc.)',
          'Update application configurations',
          'Test data integrity and application functionality'
        ],
        estimatedTime: '4 hours',
        critical: true,
        validation: 'Data migration completes successfully'
      },
      {
        id: 'cutover',
        title: 'Traffic Cutover',
        description: 'Switch traffic from old infrastructure to new Chiral infrastructure',
        manualSteps: [
          'Update DNS records or load balancer configurations',
          'Monitor traffic flow during cutover',
          'Verify application functionality',
          'Prepare rollback procedures'
        ],
        estimatedTime: '30 minutes',
        critical: true,
        validation: 'Application accessible and functional'
      }
    ];
  }

  private static getProgressiveSteps(config: {
    provider: 'aws' | 'azure' | 'gcp';
    sourcePath: string;
    outputPath: string;
  }): MigrationStep[] {
    return [
      {
        id: 'phase-networking',
        title: 'Phase 1: Network Infrastructure',
        description: 'Migrate VPC, subnets, security groups, and networking components',
        commands: [
          `chiral compile -c ${config.outputPath} -o dist --resources networking`,
          this.getDeployCommand(config.provider, 'dist')
        ],
        estimatedTime: '1 hour',
        critical: false,
        validation: 'Network connectivity established'
      },
      {
        id: 'phase-database',
        title: 'Phase 2: Database Migration',
        description: 'Migrate database infrastructure and data',
        commands: [
          `chiral compile -c ${config.outputPath} -o dist --resources database`,
          this.getDeployCommand(config.provider, 'dist')
        ],
        estimatedTime: '2 hours',
        critical: true,
        validation: 'Database accessible and data migrated'
      },
      {
        id: 'phase-kubernetes',
        title: 'Phase 3: Kubernetes Migration',
        description: 'Migrate container orchestration infrastructure',
        commands: [
          `chiral compile -c ${config.outputPath} -o dist --resources kubernetes`,
          this.getDeployCommand(config.provider, 'dist')
        ],
        estimatedTime: '1 hour',
        critical: true,
        validation: 'Kubernetes cluster operational'
      },
      {
        id: 'phase-applications',
        title: 'Phase 4: Application Migration',
        description: 'Migrate application workloads and configurations',
        manualSteps: [
          'Deploy applications to new Kubernetes cluster',
          'Update service discovery and load balancing',
          'Test application functionality',
          'Gradually shift traffic using load balancer weights'
        ],
        estimatedTime: '4 hours',
        critical: true,
        validation: 'Applications running and accessible'
      }
    ];
  }

  private static getParallelSteps(config: {
    provider: 'aws' | 'azure' | 'gcp';
    sourcePath: string;
    outputPath: string;
  }): MigrationStep[] {
    return [
      {
        id: 'deploy-parallel',
        title: 'Deploy Parallel Infrastructure',
        description: 'Deploy Chiral infrastructure alongside existing Terraform resources',
        commands: [
          `chiral compile -c ${config.outputPath} -o dist`,
          this.getDeployCommand(config.provider, 'dist')
        ],
        estimatedTime: '2 hours',
        critical: false,
        validation: 'Parallel infrastructure operational'
      },
      {
        id: 'load-balancer-setup',
        title: 'Configure Load Balancing',
        description: 'Set up load balancing for traffic splitting between old and new infrastructure',
        manualSteps: [
          'Configure load balancer with traffic weights',
          'Set up health checks for both infrastructures',
          'Configure session persistence if required',
          'Test traffic distribution'
        ],
        estimatedTime: '2 hours',
        critical: true,
        validation: 'Traffic splitting working correctly'
      },
      {
        id: 'gradual-cutover',
        title: 'Gradual Traffic Migration',
        description: 'Gradually shift traffic from Terraform to Chiral infrastructure',
        manualSteps: [
          'Start with 10% traffic to Chiral infrastructure',
          'Monitor performance and error rates',
          'Gradually increase traffic percentage',
          'Complete cutover when confidence is high'
        ],
        estimatedTime: '1 week',
        critical: true,
        validation: '100% traffic successfully migrated'
      }
    ];
  }

  private static generateRollbackPlan(config: {
    provider: 'aws' | 'azure' | 'gcp';
    strategy: 'greenfield' | 'progressive' | 'parallel';
  }): RollbackStep[] {
    const rollbackSteps: RollbackStep[] = [
      {
        id: 'stop-traffic',
        title: 'Stop Traffic to Chiral Infrastructure',
        description: 'Immediately redirect all traffic back to original infrastructure',
        commands: [
          '# Update load balancer weights to 0% for Chiral infrastructure',
          this.getRollbackTrafficCommand(config.provider)
        ],
        estimatedTime: '5 minutes'
      },
      {
        id: 'verify-original',
        title: 'Verify Original Infrastructure Health',
        description: 'Ensure original Terraform infrastructure is still operational',
        commands: [
          '# Check original infrastructure status',
          this.getHealthCheckCommand(config.provider)
        ],
        estimatedTime: '10 minutes'
      },
      {
        id: 'cleanup-chiral',
        title: 'Clean Up Chiral Resources',
        description: 'Remove Chiral-generated resources to avoid cost accumulation',
        commands: [
          '# Delete Chiral infrastructure',
          this.getCleanupCommand(config.provider)
        ],
        estimatedTime: '30 minutes'
      }
    ];

    return rollbackSteps;
  }

  private static getDeployCommand(provider: string, outputDir: string): string {
    switch (provider) {
      case 'aws': return `cd ${outputDir} && cdk deploy`;
      case 'azure': return `az deployment group create --resource-group my-rg --template-file ${outputDir}/azure-deployment.bicep`;
      case 'gcp': return `gcloud infra-manager deployments apply --git-source-repo=https://github.com/my-org/my-repo --git-source-directory=${outputDir}`;
      default: return '# Deploy command depends on provider';
    }
  }

  private static getRollbackTrafficCommand(provider: string): string {
    // Provider-specific rollback traffic commands
    return '# Rollback traffic command - implement based on load balancer setup';
  }

  private static getHealthCheckCommand(provider: string): string {
    // Provider-specific health check commands
    return '# Health check command - implement based on infrastructure setup';
  }

  private static getCleanupCommand(provider: string): string {
    switch (provider) {
      case 'aws': return 'cd dist && cdk destroy';
      case 'azure': return 'az deployment group delete --resource-group my-rg --name my-deployment';
      case 'gcp': return 'gcloud infra-manager deployments delete my-deployment';
      default: return '# Cleanup command depends on provider';
    }
  }

  private static getValidationSteps(provider: string): string[] {
    return [
      'Verify all resources are deployed and healthy',
      'Test application functionality end-to-end',
      'Validate monitoring and alerting are working',
      'Check cost reports for unexpected charges',
      'Perform security scans and compliance checks',
      'Test backup and recovery procedures',
      'Validate performance meets SLAs',
      'Confirm team access and permissions are correct'
    ];
  }

  private static getTroubleshootingGuides(provider: string): TroubleshootingGuide[] {
    return [
      {
        issue: 'Resource deployment failures',
        symptoms: ['Cloud provider API errors', 'Resource quota exceeded', 'Permission denied'],
        solution: 'Check cloud provider permissions, increase quotas if needed, verify resource configurations',
        commands: ['# Check provider permissions', '# Verify resource limits', '# Review error logs']
      },
      {
        issue: 'Connectivity issues',
        symptoms: ['Cannot reach applications', 'Network timeouts', 'DNS resolution failures'],
        solution: 'Verify security groups, network ACLs, and DNS configurations',
        commands: ['# Test network connectivity', '# Check security group rules', '# Validate DNS settings']
      },
      {
        issue: 'Performance degradation',
        symptoms: ['Slow response times', 'High latency', 'Resource saturation'],
        solution: 'Scale resources up, optimize configurations, check for bottlenecks',
        commands: ['# Monitor resource utilization', '# Check performance metrics', '# Scale resources as needed']
      },
      {
        issue: 'Data migration issues',
        symptoms: ['Data corruption', 'Missing records', 'Migration timeouts'],
        solution: 'Verify migration scripts, check data integrity, use smaller batches',
        commands: ['# Validate data integrity', '# Check migration logs', '# Test with smaller datasets']
      }
    ];
  }
}
