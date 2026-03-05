// File: src/adapters/gcp-right.ts

// 5. The Adapters (Logic)

// The GCP Right Enantiomer: Terraform HCL Generator.

import { ChiralSystem } from '../../intent';
import { getRegionalHardwareMap, validateRegionalCapabilities } from '../../translation/hardware-map';

// =================================================================
// GCP RIGHT ENANTIOMER (GCP Adapter)
// -----------------------------------------------------------------
// This class acts as a "Printer". It takes the abstract Chiral DNA
// and injects it into raw Terraform HCL string.
//
// It does NOT validate Terraform syntax (that happens in deployment).
// It ONLY ensures the configuration values are mapped correctly.
// =================================================================

export class GcpTerraformAdapter {
  static generate(intent: ChiralSystem): string {
    // Validate regional capabilities
    const gcpRegion = intent.region?.gcp || 'us-central1';
    const regionalValidation = validateRegionalCapabilities('gcp', gcpRegion, ['kubernetes', 'postgresql', 'activeDirectory']);

    if (!regionalValidation.valid) {
      throw new Error(`GCP region ${gcpRegion} missing required services: ${regionalValidation.missingServices.join(', ')}`);
    }

    // Get region-aware hardware mappings
    const regionalHardware = getRegionalHardwareMap('gcp', gcpRegion);

    // 1. TRANSLATION (Hardware Mapping)
    // ------------------------------------------------
    // Convert abstract sizes (small/large) into GCP machine types
    const dbMachine = regionalHardware.db[intent.postgres.size];
    const vmMachine = regionalHardware.vm[intent.adfs.size];
    const k8sMachine = regionalHardware.k8s[intent.k8s.size];

    // 2. CONFIGURABLE SETTINGS
    // ------------------------------------------------
    const gcpZone = `${gcpRegion}-a`; // Default to first zone in region

    // 3. TERRAFORM HCL TEMPLATE GENERATION ("Mad Libs")
    // ------------------------------------------------
    // The content inside the backticks (`) IS Terraform HCL.
    // We use ${variable} to inject the strict configuration.

    return `
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
${intent.terraform?.backend ? `
  backend "gcs" {
    bucket = "${intent.terraform.backend.bucket}"
    prefix = "${intent.terraform.backend.prefix || `${intent.projectName}-terraform-state`}"
  }
` : ''}
}

# =================================================================
# IMPORTANT: Terraform State Management Warnings
# =================================================================
# WARNING: Terraform state files can contain sensitive information (secrets, IPs, metadata).
# - Always use remote backends (e.g., GCS) to avoid local state files.
# - Encrypt backend storage and restrict access via IAM.
# - Be aware of state corruption risks from concurrent modifications or partial applies.
# - Consider managed Terraform services (e.g., Google Cloud Infrastructure Manager, IBM Terraform Premium) for enterprise deployments.
# - Deploy via Google Cloud Infrastructure Manager to leverage GCP's native state management and avoid self-hosted Terraform issues.
# - See docs/CHALLENGES.md for detailed state management challenges.
# =================================================================

# =================================================================
# 1. NETWORKING
# =================================================================
resource "google_compute_network" "vpc" {
  name                    = "${intent.projectName}-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "${intent.projectName}-subnet"
  network       = google_compute_network.vpc.self_link
  ip_cidr_range = "${intent.networkCidr}"
  region        = "${gcpRegion}"
}

# =================================================================
# 2. KUBERNETES (GKE) - With Auto-scaling Support
# =================================================================
resource "google_container_cluster" "gke" {
  name     = "${intent.projectName}-gke"
  location = "${gcpRegion}"

  network    = google_compute_network.vpc.self_link
  subnetwork = google_compute_subnetwork.subnet.self_link

  node_config {
    machine_type = "${k8sMachine}"
    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring"
    ]
  }

  initial_node_count = ${intent.k8s.minNodes}

  # Remove default node pool
  remove_default_node_pool = true
}

resource "google_container_node_pool" "primary_nodes" {
  name       = "primary-node-pool"
  cluster    = google_container_cluster.gke.name
  node_count = ${intent.k8s.minNodes}

  autoscaling {
    min_node_count = ${intent.k8s.minNodes}
    max_node_count = ${intent.k8s.maxNodes}
  }

  node_config {
    machine_type = "${k8sMachine}"

    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring"
    ]
  }
}

# =================================================================
# 3. DATABASE (Cloud SQL PostgreSQL)
# =================================================================
resource "google_sql_database_instance" "postgres" {
  name             = "${intent.projectName}-pg"
  database_version = "POSTGRES_${intent.postgres.engineVersion}"
  region           = "${gcpRegion}"

  settings {
    tier = "${dbMachine}"

    disk_size = ${intent.postgres.storageGb}

    backup_configuration {
      enabled = ${intent.environment === 'prod'}
      start_time = "02:00"
    }
  }

  deletion_protection = ${intent.environment === 'prod'}
}

resource "google_sql_database" "app_db" {
  name     = "appdb"
  instance = google_sql_database_instance.postgres.name
}

# =================================================================
# 4. ACTIVE DIRECTORY FEDERATION SERVICES (Compute Engine VM)
# =================================================================
resource "google_compute_instance" "adfs" {
  name         = "${intent.projectName}-adfs"
  machine_type = "${vmMachine}"
  zone         = "${gcpZone}"

  boot_disk {
    initialize_params {
      image = "windows-cloud/windows-${intent.adfs.windowsVersion}"
      size  = 50
    }
  }

  network_interface {
    network    = google_compute_network.vpc.self_link
    subnetwork = google_compute_subnetwork.subnet.self_link

    access_config {
      // Ephemeral public IP
    }
  }

  metadata_startup_script = <<-EOT
    <powershell>
    Install-WindowsFeature -Name ADFS-Federation -IncludeManagementTools
    </powershell>
  EOT
}
    `.trim();
  }
}
