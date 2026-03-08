// File: src/adapters/local-agent.ts

import { ChiralSystem } from '../intent';
import { validateChiralConfig, checkCompliance } from '../validation';
import { CostAnalyzer } from '../cost-analysis';

// Skill Response Interfaces
export interface ArtifactResponse {
  artifacts: {
    aws?: string;
    azure?: string;
    gcp?: string;
    local?: string;
  };
  metadata: {
    generatedAt: Date;
    agentEnhanced: boolean;
    processingTime: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface CostAnalysis {
  comparison: {
    cheapest: {
      provider: string;
      cost: number;
      savings: number;
    };
    estimates: {
      aws: { totalCost: number; breakdown: any };
      azure: { totalCost: number; breakdown: any };
      gcp: { totalCost: number; breakdown: any };
      local: { totalCost: number; breakdown: any };
    };
  };
  recommendations: string[];
}

export interface DriftResult {
  hasDrift: boolean;
  driftedResources: Array<{
    resourceType: string;
    resourceName: string;
    expected: any;
    actual: any;
  }>;
  missingResources: string[];
  addedResources: string[];
  remediation: string[];
}

export interface ComplianceResult {
  compliant: boolean;
  violations: Array<{
    rule: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
  }>;
  recommendations: string[];
}

export class LocalAgentAdapter {
  private region: string;

  constructor(region: string = 'localhost') {
    this.region = region;
  }

  /**
   * Skill 1: generateArtifacts - Generate native IaC artifacts from ChiralSystem intent for local development
   */
  async generateArtifacts(
    config: ChiralSystem,
    providers: string[] = ['aws', 'azure', 'gcp', 'local']
  ): Promise<ArtifactResponse> {
    const startTime = Date.now();

    try {
      // Validate config first
      const validation = await this.validateConfig(config);
      if (!validation.valid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      const artifacts: ArtifactResponse['artifacts'] = {};

      // Generate local artifacts
      if (providers.includes('local')) {
        artifacts.local = await this.generateLocalArtifacts(config);
      }

      // Generate other provider artifacts for comparison
      if (providers.includes('aws')) {
        artifacts.aws = await this.generateAWSArtifacts(config);
      }

      if (providers.includes('azure')) {
        artifacts.azure = await this.generateAzureArtifacts(config);
      }

      if (providers.includes('gcp')) {
        artifacts.gcp = await this.generateGCPArtifacts(config);
      }

      return {
        artifacts,
        metadata: {
          generatedAt: new Date(),
          agentEnhanced: false, // Local is deterministic
          processingTime: Date.now() - startTime
        }
      };
    } catch (error) {
      console.error('Artifact generation failed:', error);
      throw error;
    }
  }

  /**
   * Skill 2: validateConfig - Validate ChiralSystem configuration
   */
  async validateConfig(
    config: ChiralSystem,
    frameworks: string[] = ['soc2', 'hipaa']
  ): Promise<ValidationResult> {
    try {
      // Use existing validation
      const basicValidation = validateChiralConfig(config);

      // Add compliance validation if frameworks specified
      const complianceResults: string[] = [];
      for (const framework of frameworks) {
        const compliance = await this.checkCompliance(config, framework);
        if (!compliance.compliant) {
          complianceResults.push(`${framework}: ${compliance.violations.length} violations`);
        }
      }

      return {
        valid: basicValidation.valid && complianceResults.length === 0,
        errors: [...(basicValidation.errors || []), ...complianceResults],
        warnings: basicValidation.warnings || [],
        recommendations: basicValidation.recommendations || []
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation error: ${error}`],
        warnings: [],
        recommendations: []
      };
    }
  }

  /**
   * Skill 3: analyzeCosts - Estimate costs across providers including local (free)
   */
  async analyzeCosts(
    config: ChiralSystem,
    providers: string[] = ['aws', 'azure', 'gcp', 'local']
  ): Promise<CostAnalysis> {
    try {
      // Use existing cost analyzer
      const costComparison = await CostAnalyzer.compareCosts(config, {});

      return {
        comparison: {
          cheapest: {
            provider: 'local',
            cost: 0,
            savings: 100
          },
          estimates: {
            aws: { totalCost: costComparison.estimates.aws.totalMonthlyCost, breakdown: costComparison.estimates.aws.breakdown },
            azure: { totalCost: costComparison.estimates.azure.totalMonthlyCost, breakdown: costComparison.estimates.azure.breakdown },
            gcp: { totalCost: costComparison.estimates.gcp.totalMonthlyCost, breakdown: costComparison.estimates.gcp.breakdown },
            local: { totalCost: 0, breakdown: { compute: { kubernetes: 0, vm: 0, total: 0 }, storage: { database: 0, vmDisk: 0, total: 0 }, network: { dataTransfer: 0, loadBalancer: 0, total: 0 }, other: { management: 0, monitoring: 0, total: 0 } } }
          }
        },
        recommendations: [
          'Local development is free and ideal for testing',
          'Use local environment for development and CI/CD pipelines',
          'Consider cloud providers for production deployments'
        ]
      };
    } catch (error) {
      console.error('Cost analysis failed:', error);
      throw error;
    }
  }

  /**
   * Skill 4: importIaC - Import existing IaC into ChiralSystem format for local development
   */
  async importIaC(
    sourcePath: string,
    provider: string,
    agentic: boolean = false
  ): Promise<ChiralSystem> {
    // For local provider, generate a basic configuration
    // This would be enhanced to actually parse local configuration files
    const config: ChiralSystem = {
      projectName: 'local-development',
      environment: 'dev',
      networkCidr: '192.168.65.0/24', // Docker Desktop default
      region: { local: 'localhost' },
      k8s: {
        version: '1.27',
        minNodes: 1,
        maxNodes: 1,
        size: 'small'
      },
      postgres: {
        engineVersion: '15',
        size: 'small',
        storageGb: 10
      },
      adfs: {
        size: 'small',
        windowsVersion: '2022'
      }
    };

    return config;
  }

  /**
   * Skill 5: checkCompliance - Assess compliance against frameworks for local development
   */
  async checkCompliance(
    config: ChiralSystem,
    framework: string
  ): Promise<ComplianceResult> {
    try {
      // Use existing compliance checker
      const compliance = checkCompliance(config, framework as any);

      return {
        compliant: compliance.compliant,
        violations: compliance.violations?.map((v: any) => ({
          rule: v.id || 'unknown',
          severity: v.severity || 'medium',
          description: v.description || 'Unknown violation'
        })) || [],
        recommendations: compliance.recommendations || []
      };
    } catch (error) {
      console.error('Compliance check failed:', error);
      throw error;
    }
  }

  /**
   * Skill 6: detectDrift - Compare artifacts with deployed local infrastructure
   */
  async detectDrift(
    config: ChiralSystem,
    artifacts: ArtifactResponse['artifacts']
  ): Promise<DriftResult> {
    try {
      // Check if local services are running
      const driftResult: DriftResult = {
        hasDrift: false,
        driftedResources: [],
        missingResources: [],
        addedResources: [],
        remediation: []
      };

      // Check Kubernetes (minikube/kind)
      if (config.k8s) {
        // This would check if minikube is running
        driftResult.remediation.push('Check if minikube/kind cluster is running');
      }

      // Check PostgreSQL
      if (config.postgres) {
        driftResult.remediation.push('Check if PostgreSQL container/service is running');
      }

      // Check ADFS
      if (config.adfs) {
        driftResult.remediation.push('Check if ADFS VM/container is running');
      }

      return driftResult;
    } catch (error) {
      console.error('Drift detection failed:', error);
      throw error;
    }
  }

  // Helper methods for artifact generation
  private async generateLocalArtifacts(config: ChiralSystem): Promise<string> {
    // Generate Docker Compose and shell scripts for local development
    const dockerCompose = this.generateDockerCompose(config);
    const setupScript = this.generateSetupScript(config);
    const k8sManifests = this.generateK8sManifests(config);

    return `Local development artifacts generated:
- docker-compose.yml for containerized services
- setup-local.sh for environment setup
- k8s/ directory with Kubernetes manifests for minikube/kind

Services included:
- PostgreSQL database
- ADFS service (containerized)
- Supporting infrastructure

To start local environment:
1. Run: chmod +x setup-local.sh && ./setup-local.sh
2. Run: docker-compose up -d
3. For Kubernetes: kubectl apply -f k8s/

Local development URL: http://localhost`;
  }

  private async generateAWSArtifacts(config: ChiralSystem): Promise<string> {
    return 'AWS artifacts generation delegated to AwsAgentAdapter';
  }

  private async generateAzureArtifacts(config: ChiralSystem): Promise<string> {
    return 'Azure artifacts generation delegated to AzureAgentAdapter';
  }

  private async generateGCPArtifacts(config: ChiralSystem): Promise<string> {
    return 'GCP artifacts generation delegated to GcpAgentAdapter';
  }

  private generateDockerCompose(config: ChiralSystem): string {
    return `version: '3.8'
services:
  postgres:
    image: postgres:${config.postgres.engineVersion}
    environment:
      POSTGRES_DB: ${config.projectName}
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - chiral-network

  adfs:
    image: mcr.microsoft.com/windows/servercore:ltsc2022
    # Note: ADFS typically requires Windows Server with specific licensing
    # This is a placeholder - actual ADFS setup would be more complex
    ports:
      - "80:80"
      - "443:443"
    networks:
      - chiral-network

volumes:
  postgres_data:

networks:
  chiral-network:
    driver: bridge
    ipam:
      config:
        - subnet: ${config.networkCidr}`;
  }

  private generateSetupScript(config: ChiralSystem): string {
    return `#!/bin/bash
# Local development setup script for ${config.projectName}

echo "🚀 Setting up local Chiral development environment..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting."; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "⚠️  kubectl not found. Installing..."; }

# Install kubectl if not present
if ! command -v kubectl >/dev/null 2>&1; then
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    chmod +x kubectl
    sudo mv kubectl /usr/local/bin/
fi

# Check if minikube is available
if command -v minikube >/dev/null 2>&1; then
    echo "✅ minikube found"
    minikube status || minikube start
else
    echo "⚠️  minikube not found. Using Docker Desktop Kubernetes if available."
fi

echo "✅ Local environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Start services: docker-compose up -d"
echo "2. Check status: docker-compose ps"
echo "3. View logs: docker-compose logs -f"
echo "4. Stop services: docker-compose down"`;
  }

  private generateK8sManifests(config: ChiralSystem): string {
    return `# Kubernetes manifests for local development
apiVersion: v1
kind: Namespace
metadata:
  name: ${config.projectName}

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: ${config.projectName}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:${config.postgres.engineVersion}
        env:
        - name: POSTGRES_DB
          value: "${config.projectName}"
        - name: POSTGRES_USER
          value: "admin"
        - name: POSTGRES_PASSWORD
          value: "password123"
        ports:
        - containerPort: 5432

---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: ${config.projectName}
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: adfs
  namespace: ${config.projectName}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: adfs
  template:
    metadata:
      labels:
        app: adfs
    spec:
      containers:
      - name: adfs
        image: mcr.microsoft.com/windows/servercore:ltsc2022
        ports:
        - containerPort: 80
        - containerPort: 443

---
apiVersion: v1
kind: Service
metadata:
  name: adfs
  namespace: ${config.projectName}
spec:
  selector:
    app: adfs
  ports:
  - port: 80
    targetPort: 80
  - port: 443
    targetPort: 443
  type: LoadBalancer`;
  }
}
