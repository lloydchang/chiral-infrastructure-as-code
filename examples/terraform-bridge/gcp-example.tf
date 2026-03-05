terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

# VPC Network
resource "google_compute_network" "demo" {
  name                    = "demo-vpc"
  auto_create_subnetworks = false
}

# Subnet
resource "google_compute_subnetwork" "demo" {
  name          = "demo-subnet"
  network       = google_compute_network.demo.self_link
  ip_cidr_range = "10.0.1.0/24"
  region        = "us-central1"
}

# GKE Cluster
resource "google_container_cluster" "demo" {
  name               = "demo-gke"
  location           = "us-central1"
  min_master_version = "1.35.0"

  network    = google_compute_network.demo.self_link
  subnetwork = google_compute_subnetwork.demo.self_link

  initial_node_count = 2

  node_config {
    machine_type = "e2-medium"
    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
    ]
  }

  # Enable autoscaling
  cluster_autoscaling {
    enabled = true
    resource_limits {
      resource_type = "cpu"
      minimum       = 1
      maximum       = 10
    }
    resource_limits {
      resource_type = "memory"
      minimum       = 1
      maximum       = 40
    }
  }
}

# Cloud SQL PostgreSQL Instance
resource "google_sql_database_instance" "postgres" {
  name             = "demo-postgres"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-custom-2-4096"

    disk_size = 20

    backup_configuration {
      enabled = true
      start_time = "02:00"
    }

    ip_configuration {
      ipv4_enabled = true
    }
  }

  deletion_protection = false
}

# Cloud SQL Database
resource "google_sql_database" "demo" {
  name     = "demo"
  instance = google_sql_database_instance.postgres.name
}

# Compute Engine VM for ADFS
resource "google_compute_instance" "adfs" {
  name         = "demo-adfs"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = "windows-cloud/windows-2022"
      size  = 50
    }
  }

  network_interface {
    network    = google_compute_network.demo.self_link
    subnetwork = google_compute_subnetwork.demo.self_link

    access_config {
      // Ephemeral public IP
    }
  }

  metadata = {
    windows-startup-script-ps1 = <<-EOT
      # Install ADFS
      Install-WindowsFeature -Name ADFS-Federation -IncludeManagementTools

      # Configure basic ADFS setup
      $cert = New-SelfSignedCertificate -DnsName "demo-adfs.example.com" -CertStoreLocation "cert:\LocalMachine\My"
      Install-AdfsFarm -CertificateThumbprint $cert.Thumbprint -FederationServiceName "demo-adfs.example.com" -ServiceAccountCredential (New-Object System.Management.Automation.PSCredential("EXAMPLE\ADFSService", (ConvertTo-SecureString "P@ssw0rd123!" -AsPlainText -Force)))
    EOT
  }

  tags = ["adfs", "demo"]
}

# Firewall rule for ADFS
resource "google_compute_firewall" "adfs" {
  name    = "demo-adfs-firewall"
  network = google_compute_network.demo.self_link

  allow {
    protocol = "tcp"
    ports    = ["443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["adfs"]
}
