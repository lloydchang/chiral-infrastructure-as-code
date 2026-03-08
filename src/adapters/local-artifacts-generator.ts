// Local development artifacts generator for comprehensive bidirectional translation
import { ChiralSystem, WorkloadSize } from '../intent';
import * as yaml from 'js-yaml';

export interface LocalArtifactOptions {
  environment: 'docker-compose' | 'minikube' | 'kind' | 'k3s' | 'docker-desktop';
  includeMonitoring?: boolean;
  includeIngress?: boolean;
  includePersistence?: boolean;
  resourceLimits?: boolean;
}

export class LocalArtifactGenerator {
  private config: ChiralSystem;
  private options: LocalArtifactOptions;

  constructor(config: ChiralSystem, options: LocalArtifactOptions) {
    this.config = config;
    this.options = options;
  }

  generateAllArtifacts(): { [filename: string]: string } {
    const artifacts: { [filename: string]: string } = {};

    // Core infrastructure files
    artifacts['docker-compose.yml'] = this.generateDockerCompose();
    artifacts['docker-compose.dev.yml'] = this.generateDockerComposeDev();
    artifacts['docker-compose.prod.yml'] = this.generateDockerComposeProd();
    
    // Kubernetes manifests
    artifacts['k8s/namespace.yaml'] = this.generateNamespace();
    artifacts['k8s/postgres.yaml'] = this.generatePostgresK8s();
    artifacts['k8s/adfs.yaml'] = this.generateAdfsK8s();
    artifacts['k8s/configmap.yaml'] = this.generateConfigMap();
    
    // KIND configuration
    artifacts['kind-config.yaml'] = this.generateKindConfig();
    
    // K3s configuration
    artifacts['k3s-config.yaml'] = this.generateK3sConfig();
    
    // Setup and utility scripts
    artifacts['setup-local.sh'] = this.generateSetupScript();
    artifacts['teardown-local.sh'] = this.generateTeardownScript();
    artifacts['health-check.sh'] = this.generateHealthCheck();
    
    // Development tools
    artifacts['Makefile'] = this.generateMakefile();
    artifacts['.env.example'] = this.generateEnvExample();
    
    // Monitoring and observability (if enabled)
    if (this.options.includeMonitoring) {
      artifacts['docker-compose.monitoring.yml'] = this.generateMonitoringStack();
      artifacts['k8s/monitoring/'] = this.generateK8sMonitoring();
    }
    
    // Ingress configuration (if enabled)
    if (this.options.includeIngress) {
      artifacts['k8s/ingress.yaml'] = this.generateIngress();
    }
    
    return artifacts;
  }

  private generateDockerCompose(): string {
    const cpuLimit = this.getCpuLimit();
    const memoryLimit = this.getMemoryLimit();
    
    return `version: '3.8'

services:
  postgres:
    image: postgres:${this.config.postgres.engineVersion}
    container_name: ${this.config.projectName}-postgres
    environment:
      POSTGRES_DB: ${this.config.projectName}
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-password123}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    ports:
      - "${this.getPostgresPort()}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/postgres-init:/docker-entrypoint-initdb.d
    networks:
      - ${this.config.projectName}-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '${cpuLimit}'
          memory: '${memoryLimit}M'
        reservations:
          cpus: '0.25'
          memory: '256M'

  adfs:
    image: mcr.microsoft.com/windows/servercore:ltsc2022
    container_name: ${this.config.projectName}-adfs
    ports:
      - "80:80"
      - "443:443"
    environment:
      - ACCEPT_EULA=Y
    networks:
      - ${this.config.projectName}-network
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: '4G'
        reservations:
          cpus: '1'
          memory: '2G'
    volumes:
      - adfs_data:/c/data
    profiles:
      - windows

  redis:
    image: redis:7-alpine
    container_name: ${this.config.projectName}-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - ${this.config.projectName}-network
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass \${REDIS_PASSWORD:-redis123}

  nginx:
    image: nginx:alpine
    container_name: ${this.config.projectName}-nginx
    ports:
      - "8080:80"
      - "8443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    networks:
      - ${this.config.projectName}-network
    depends_on:
      - postgres
      - adfs
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  adfs_data:
    driver: local

networks:
  ${this.config.projectName}-network:
    driver: bridge
    ipam:
      config:
        - subnet: ${this.config.networkCidr}
          gateway: ${this.getGateway()}
`;
  }

  private generateDockerComposeDev(): string {
    return `# Development override for ${this.config.projectName}
version: '3.8'
services:
  postgres:
    extends:
      file: docker-compose.yml
      service: postgres
    environment:
      - POSTGRES_DB=${this.config.projectName}_dev
      - POSTGRES_PASSWORD=dev_password
    ports:
      - "5433:5432"  # Different port for dev

  adfs:
    extends:
      file: docker-compose.yml
      service: adfs
    profiles: []  # Disable ADFS in dev unless needed

  # Development tools
  adminer:
    image: adminer:latest
    container_name: ${this.config.projectName}-adminer
    ports:
      - "8081:8080"
    networks:
      - ${this.config.projectName}-network
    environment:
      ADMINER_DEFAULT_SERVER: postgres
    profiles:
      - tools

  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: ${this.config.projectName}-redis-commander
    ports:
      - "8082:8081"
    networks:
      - ${this.config.projectName}-network
    environment:
      REDIS_HOSTS: local:redis:6379:0:redis123
    profiles:
      - tools
`;
  }

  private generateDockerComposeProd(): string {
    return `# Production override for ${this.config.projectName}
version: '3.8'
services:
  postgres:
    extends:
      file: docker-compose.yml
      service: postgres
    environment:
      - POSTGRES_DB=${this.config.projectName}
      - POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: '8G'
        reservations:
          cpus: '2'
          memory: '4G'
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data

  adfs:
    extends:
      file: docker-compose.yml
      service: adfs
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: '8G'
        reservations:
          cpus: '2'
          memory: '4G'

volumes:
  postgres_prod_data:
    driver: local
`;
  }

  private generateNamespace(): string {
    return yaml.dump({
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: this.config.projectName,
        labels: {
          'name': this.config.projectName,
          'environment': this.config.environment
        }
      }
    });
  }

  private generatePostgresK8s(): string {
    const storageClass = this.config.environment === 'prod' ? 'standard' : 'standard';
    
    const postgresManifest = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: 'postgres',
        namespace: this.config.projectName,
        labels: {
          app: 'postgres',
          version: this.config.postgres.engineVersion
        }
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: 'postgres'
          }
        },
        template: {
          metadata: {
            labels: {
              app: 'postgres'
            }
          },
          spec: {
            containers: [{
              name: 'postgres',
              image: `postgres:${this.config.postgres.engineVersion}`,
              env: [
                { name: 'POSTGRES_DB', value: this.config.projectName },
                { name: 'POSTGRES_USER', value: 'admin' },
                { name: 'POSTGRES_PASSWORD', valueFrom: { secretKeyRef: { name: 'postgres-secret', key: 'password' } } },
                { name: 'PGDATA', value: '/var/lib/postgresql/data/pgdata' }
              ],
              ports: [{ containerPort: 5432 }],
              volumeMounts: [{
                name: 'postgres-storage',
                mountPath: '/var/lib/postgresql/data'
              }],
              resources: {
                requests: {
                  cpu: this.getCpuRequest(),
                  memory: this.getMemoryRequest()
                },
                limits: {
                  cpu: this.getCpuLimit(),
                  memory: this.getMemoryLimit()
                }
              }
            }]
          }
        }
      }
    };

    const serviceManifest = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: 'postgres',
        namespace: this.config.projectName,
        labels: {
          app: 'postgres'
        }
      },
      spec: {
        selector: {
          app: 'postgres'
        },
        ports: [{
          port: 5432,
          targetPort: 5432,
          protocol: 'TCP'
        }],
        type: 'ClusterIP'
      }
    };

    const pvcManifest = {
      apiVersion: 'v1',
      kind: 'PersistentVolumeClaim',
      metadata: {
        name: 'postgres-pvc',
        namespace: this.config.projectName
      },
      spec: {
        accessModes: ['ReadWriteOnce'],
        storageClassName: storageClass,
        resources: {
          requests: {
            storage: `${this.config.postgres.storageGb}Gi`
          }
        }
      }
    };

    const secretManifest = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: 'postgres-secret',
        namespace: this.config.projectName
      },
      type: 'Opaque',
      data: {
        password: Buffer.from('password123').toString('base64')
      }
    };

    return `---
${yaml.dump(postgresManifest)}
---
${yaml.dump(serviceManifest)}
---
${yaml.dump(pvcManifest)}
---
${yaml.dump(secretManifest)}`;
  }

  private generateAdfsK8s(): string {
    const adfsManifest = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: 'adfs',
        namespace: this.config.projectName,
        labels: {
          app: 'adfs'
        }
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: 'adfs'
          }
        },
        template: {
          metadata: {
            labels: {
              app: 'adfs'
            }
          },
          spec: {
            containers: [{
              name: 'adfs',
              image: 'mcr.microsoft.com/windows/servercore:ltsc2022',
              ports: [
                { containerPort: 80 },
                { containerPort: 443 }
              ],
              resources: {
                requests: {
                  cpu: '1',
                  memory: '2Gi'
                },
                limits: {
                  cpu: '2',
                  memory: '4Gi'
                }
              }
            }]
          }
        }
      }
    };

    const serviceManifest = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: 'adfs',
        namespace: this.config.projectName,
        labels: {
          app: 'adfs'
        }
      },
      spec: {
        selector: {
          app: 'adfs'
        },
        ports: [
          { port: 80, targetPort: 80, protocol: 'TCP' },
          { port: 443, targetPort: 443, protocol: 'TCP' }
        ],
        type: 'LoadBalancer'
      }
    };

    return `---
${yaml.dump(adfsManifest)}
---
${yaml.dump(serviceManifest)}`;
  }

  private generateConfigMap(): string {
    const configMap = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: `${this.config.projectName}-config`,
        namespace: this.config.projectName
      },
      data: {
        'NODE_ENV': this.config.environment,
        'PROJECT_NAME': this.config.projectName,
        'NETWORK_CIDR': this.config.networkCidr,
        'POSTGRES_HOST': 'postgres',
        'POSTGRES_PORT': '5432',
        'POSTGRES_DB': this.config.projectName,
        'ADFS_HOST': 'adfs'
      }
    };

    return yaml.dump(configMap);
  }

  private generateKindConfig(): string {
    const kindConfig = {
      kind: 'Cluster',
      apiVersion: 'kind.x-k8s.io/v1alpha4',
      name: `${this.config.projectName}-cluster`,
      nodes: [
        {
          role: 'control-plane',
          kubeadmConfigPatches: [
            {
              kind: 'InitConfiguration',
              nodeRegistration: {
                kubeletExtraArgs: {
                  'node-labels': 'ingress-ready=true'
                }
              }
            }
          ],
          extraPortMappings: [
            { containerPort: 80, hostPort: 80, protocol: 'TCP' },
            { containerPort: 443, hostPort: 443, protocol: 'TCP' },
            { containerPort: this.getPostgresPort(), hostPort: this.getPostgresPort(), protocol: 'TCP' }
          ]
        }
      ]
    };

    return yaml.dump(kindConfig);
  }

  private generateK3sConfig(): string {
    return `# K3s configuration for ${this.config.projectName}
# Installation: curl -sfL https://get.k3s.io | sh -s - --config k3s-config.yaml

write-kubeconfig-mode: "0644"
tls-san:
  - "127.0.0.1"
  - "localhost"
  - "${this.config.projectName}.local"
cluster-cidr: "${this.config.networkCidr}"
service-cidr: "10.43.0.0/16"
cluster-domain: "${this.config.projectName}.local"

# Datastore configuration
datastore-endpoint: "/var/lib/rancher/k3s/server/db"
datastore-cafile: "/var/lib/rancher/k3s/server/tls/client-ca.crt"
datastore-certfile: "/var/lib/rancher/k3s/server/tls/client-ca.crt"

# Network configuration
flannel-backend: "vxlan"
cluster-dns: "10.43.0.10"

# Disable unnecessary components for local development
disable:
  - traefik
  - servicelb
  - local-storage
  - metrics-server

# Enable necessary components
enable:
  - ingress
`;
  }

  private generateSetupScript(): string {
    return `#!/bin/bash
# Local development setup script for ${this.config.projectName}
# Generated by Chiral Local Provider

set -e

echo "🚀 Setting up local Chiral development environment for ${this.config.projectName}..."

# Check prerequisites
check_prerequisite() {
    if ! command -v $1 >/dev/null 2>&1; then
        echo "❌ $1 is required but not installed. Please install $1 first."
        exit 1
    else
        echo "✅ $1 found"
    fi
}

echo "📋 Checking prerequisites..."
check_prerequisite "docker"
check_prerequisite "docker-compose"

# Install kubectl if not present
if ! command -v kubectl >/dev/null 2>&1; then
    echo "📦 Installing kubectl..."
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/$(uname -s | tr '[:upper:]' '[:lower:]')/$(uname -m | sed -e 's/x86_64/amd64/' -e 's/arm64/arm64/')/kubectl"
    chmod +x kubectl
    sudo mv kubectl /usr/local/bin/
fi

# Setup based on environment type
case "${this.options.environment}" in
    "minikube")
        if ! command -v minikube >/dev/null 2>&1; then
            echo "📦 Installing minikube..."
            curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m | sed -e 's/x86_64/amd64/' -e 's/arm64/arm64/')
            chmod +x minikube
            sudo mv minikube /usr/local/bin/
        fi
        echo "🔧 Starting minikube..."
        minikube start --cpus=$(this.getCpuLimit()) --memory=$(this.getMemoryLimit())m --disk-size=20g
        ;;
    "kind")
        if ! command -v kind >/dev/null 2>&1; then
            echo "📦 Installing kind..."
            curl -Lo ./kind $(curl -sL https://kind.sigs.k8s.io/dl/v0.20.0/kind-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m | sed -e 's/x86_64/amd64/' -e 's/arm64/arm64/'))
            chmod +x ./kind
            sudo mv ./kind /usr/local/bin/
        fi
        echo "🔧 Creating kind cluster..."
        kind create cluster --config kind-config.yaml
        ;;
    "k3s")
        echo "🔧 Installing k3s..."
        curl -sfL https://get.k3s.io | sh -s - --config k3s-config.yaml
        sudo chmod 644 /etc/rancher/k3s/k3s.yaml
        mkdir -p ~/.kube
        cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
        ;;
esac

# Create environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your specific configuration"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p nginx/ssl
mkdir -p scripts/postgres-init
mkdir -p logs

# Set up permissions
echo "🔐 Setting permissions..."
chmod +x *.sh
chmod 600 .env

echo "✅ Local environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start services: docker-compose up -d"
echo "3. Check status: docker-compose ps"
echo "4. View logs: docker-compose logs -f"
echo "5. Stop services: docker-compose down"
echo ""
echo "🔗 Access points:"
echo "- PostgreSQL: localhost:${this.getPostgresPort()}"
echo "- ADFS: http://localhost (if enabled)"
echo "- Nginx: http://localhost:8080"
`;
  }

  private generateTeardownScript(): string {
    return `#!/bin/bash
# Local development teardown script for ${this.config.projectName}
# Generated by Chiral Local Provider

set -e

echo "🛑 Tearing down local Chiral development environment..."

# Stop and remove containers
echo "📦 Stopping Docker containers..."
docker-compose down --volumes --remove-orphans

# Remove kind cluster if exists
if command -v kind >/dev/null 2>&1 && kind get clusters | grep -q "${this.config.projectName}-cluster"; then
    echo "🗑️  Removing kind cluster..."
    kind delete cluster --name ${this.config.projectName}-cluster
fi

# Stop minikube if running
if command -v minikube >/dev/null 2>&1 && minikube status | grep -q "Running"; then
    echo "🗑️  Stopping minikube..."
    minikube stop
fi

# Stop k3s if installed
if [ -f /etc/systemd/system/k3s.service ]; then
    echo "🗑️  Stopping k3s..."
    sudo systemctl stop k3s
    sudo systemctl disable k3s
fi

# Clean up volumes (optional)
read -p "🧹 Remove all Docker volumes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing Docker volumes..."
    docker volume prune -f
fi

# Clean up networks
echo "🧹 Cleaning up Docker networks..."
docker network prune -f

echo "✅ Teardown complete!"
`;
  }

  private generateHealthCheck(): string {
    return `#!/bin/bash
# Health check script for ${this.config.projectName}
# Generated by Chiral Local Provider

echo "🏥 Checking health of local services..."

# Check PostgreSQL
echo "📊 Checking PostgreSQL..."
if docker-compose exec -T postgres pg_isready -U admin -d ${this.config.projectName} >/dev/null 2>&1; then
    echo "✅ PostgreSQL is healthy"
else
    echo "❌ PostgreSQL is not responding"
fi

# Check ADFS (if running)
if docker-compose ps | grep -q adfs; then
    echo "🔐 Checking ADFS..."
    if curl -f http://localhost >/dev/null 2>&1; then
        echo "✅ ADFS is responding"
    else
        echo "❌ ADFS is not responding"
    fi
fi

# Check Nginx
echo "🌐 Checking Nginx..."
if curl -f http://localhost:8080 >/dev/null 2>&1; then
    echo "✅ Nginx is responding"
else
    echo "❌ Nginx is not responding"
fi

# Check Redis
echo "🗄️  Checking Redis..."
if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
    echo "✅ Redis is responding"
else
    echo "❌ Redis is not responding"
fi

# Show overall status
echo ""
echo "📋 Overall service status:"
docker-compose ps
`;
  }

  private generateMakefile(): string {
    return `# Makefile for ${this.config.projectName} local development
# Generated by Chiral Local Provider

.PHONY: help setup start stop restart logs health clean test deploy

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\\033[36m%-20s\\033[0m %s\\n", $$1, $$2}'

setup: ## Set up local development environment
	@echo "🚀 Setting up local environment..."
	./setup-local.sh

start: ## Start all services
	@echo "🚀 Starting services..."
	docker-compose up -d

stop: ## Stop all services
	@echo "🛑 Stopping services..."
	docker-compose down

restart: ## Restart all services
	@echo "🔄 Restarting services..."
	docker-compose restart

logs: ## Show logs for all services
	docker-compose logs -f

logs-postgres: ## Show PostgreSQL logs
	docker-compose logs -f postgres

logs-adfs: ## Show ADFS logs
	docker-compose logs -f adfs

health: ## Check health of all services
	@echo "🏥 Checking service health..."
	./health-check.sh

clean: ## Clean up all resources
	@echo "🧹 Cleaning up..."
	./teardown-local.sh

test: ## Run tests
	@echo "🧪 Running tests..."
	docker-compose -f docker-compose.test.yml up --abort-on-container-exit

dev: ## Start development environment with tools
	@echo "🛠️  Starting development environment..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

prod: ## Start production environment
	@echo "🏭 Starting production environment..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

shell-postgres: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U admin -d ${this.config.projectName}

shell-redis: ## Open Redis CLI
	docker-compose exec redis redis-cli

backup: ## Backup PostgreSQL database
	@echo "💾 Backing up database..."
	docker-compose exec postgres pg_dump -U admin ${this.config.projectName} > backup_$(date +%Y%m%d_%H%M%S).sql

restore: ## Restore PostgreSQL database (usage: make restore FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then echo "Usage: make restore FILE=backup.sql"; exit 1; fi
	@echo "📥 Restoring database from $(FILE)..."
	docker-compose exec -T postgres psql -U admin ${this.config.projectName} < $(FILE)

k8s-apply: ## Apply Kubernetes manifests
	@echo "☸️  Applying Kubernetes manifests..."
	kubectl apply -f k8s/

k8s-delete: ## Delete Kubernetes resources
	@echo "🗑️  Deleting Kubernetes resources..."
	kubectl delete -f k8s/

k8s-logs: ## Show Kubernetes logs
	kubectl logs -n ${this.config.projectName} -f --all-containers=true

k8s-shell: ## Open shell in Kubernetes pod
	@echo "Opening shell in pod..."
	kubectl exec -n ${this.config.projectName} -it $$(kubectl get pods -n ${this.config.projectName} -o jsonpath='{.items[0].metadata.name}') -- /bin/bash
`;
  }

  private generateEnvExample(): string {
    return `# Environment variables for ${this.config.projectName}
# Copy this file to .env and modify as needed

# Database configuration
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=${this.config.projectName}
POSTGRES_USER=admin

# Redis configuration
REDIS_PASSWORD=your_redis_password_here

# Application configuration
NODE_ENV=${this.config.environment}
PROJECT_NAME=${this.config.projectName}
NETWORK_CIDR=${this.config.networkCidr}

# External service URLs (if applicable)
EXTERNAL_API_URL=https://api.example.com
WEBHOOK_URL=https://webhook.example.com

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# Monitoring (if enabled)
PROMETHEUS_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3000

# Development settings
DEBUG=false
LOG_LEVEL=info
`;
  }

  private generateMonitoringStack(): string {
    return `# Monitoring stack for ${this.config.projectName}
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: ${this.config.projectName}-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    networks:
      - ${this.config.projectName}-network

  grafana:
    image: grafana/grafana:latest
    container_name: ${this.config.projectName}-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources
    networks:
      - ${this.config.projectName}-network

  node-exporter:
    image: prom/node-exporter:latest
    container_name: ${this.config.projectName}-node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - ${this.config.projectName}-network

volumes:
  prometheus_data:
  grafana_data:

networks:
  ${this.config.projectName}-network:
    external: true
`;
  }

  private generateK8sMonitoring(): string {
    return `# Kubernetes monitoring manifests
# This would contain Prometheus, Grafana, and other monitoring resources
# Generated by Chiral Local Provider
`;
  }

  private generateIngress(): string {
    return yaml.dump({
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: {
        name: `${this.config.projectName}-ingress`,
        namespace: this.config.projectName,
        annotations: {
          'nginx.ingress.kubernetes.io/rewrite-target': '/',
          'nginx.ingress.kubernetes.io/ssl-redirect': 'false'
        }
      },
      spec: {
        rules: [
          {
            host: `${this.config.projectName}.local`,
            http: {
              paths: [
                {
                  path: '/',
                  pathType: 'Prefix',
                  backend: {
                    service: {
                      name: 'postgres',
                      port: { number: 5432 }
                    }
                  }
                }
              ]
            }
          }
        ]
      }
    });
  }

  // Helper methods for resource calculation
  private getCpuLimit(): string {
    switch (this.config.k8s.size) {
      case 'small': return '1';
      case 'medium': return '2';
      case 'large': return '4';
      default: return '1';
    }
  }

  private getCpuRequest(): string {
    switch (this.config.k8s.size) {
      case 'small': return '0.25';
      case 'medium': return '0.5';
      case 'large': return '1';
      default: return '0.25';
    }
  }

  private getMemoryLimit(): number {
    switch (this.config.k8s.size) {
      case 'small': return 1024; // 1GB
      case 'medium': return 2048; // 2GB
      case 'large': return 4096; // 4GB
      default: return 1024;
    }
  }

  private getMemoryRequest(): string {
    switch (this.config.k8s.size) {
      case 'small': return '256Mi';
      case 'medium': return '512Mi';
      case 'large': return '1Gi';
      default: return '256Mi';
    }
  }

  private getPostgresPort(): string {
    // Use different base ports to avoid conflicts
    return this.config.environment === 'prod' ? '5432' : '5433';
  }

  private getGateway(): string {
    const cidr = this.config.networkCidr;
    const parts = cidr.split('.');
    return `${parts[0]}.${parts[1]}.${parts[2]}.1`;
  }
}
