terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# Variables
variable "db_administrator_login" {
  description = "PostgreSQL administrator login"
  type        = string
  default     = "demo_admin"
}

variable "db_administrator_password" {
  description = "PostgreSQL administrator password - CHANGE THIS IN PRODUCTION"
  type        = string
  sensitive   = true
}

variable "vm_admin_username" {
  description = "Virtual machine admin username"
  type        = string
  default     = "demo_admin"
}

variable "vm_admin_password" {
  description = "Virtual machine admin password - CHANGE THIS IN PRODUCTION"
  type        = string
  sensitive   = true
}

# Resource Group
resource "azurerm_resource_group" "demo" {
  name     = "demo-rg"
  location = "East US"
}

# Virtual Network
resource "azurerm_virtual_network" "demo" {
  name                = "demo-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.demo.location
  resource_group_name = azurerm_resource_group.demo.name
}

# Subnet
resource "azurerm_subnet" "demo" {
  name                 = "demo-subnet"
  resource_group_name  = azurerm_resource_group.demo.name
  virtual_network_name = azurerm_virtual_network.demo.name
  address_prefixes     = ["10.0.1.0/24"]
}

# AKS Cluster
resource "azurerm_kubernetes_cluster" "demo" {
  name                = "demo-aks"
  location            = azurerm_resource_group.demo.location
  resource_group_name = azurerm_resource_group.demo.name
  dns_prefix          = "demo-aks"
  kubernetes_version  = "1.35.0"

  default_node_pool {
    name                = "default"
    node_count          = 2
    vm_size             = "Standard_D2s_v3"
    enable_auto_scaling = true
    min_count           = 1
    max_count           = 5
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    Environment = "Demo"
  }
}

# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "demo" {
  name                   = "demo-postgres"
  resource_group_name    = azurerm_resource_group.demo.name
  location               = azurerm_resource_group.demo.location
  version                = "15"
  sku_name               = "Standard_D2s_v3"
  storage_mb             = 32768
  backup_retention_days  = 7

  administrator_login    = var.db_administrator_login
  administrator_password = var.db_administrator_password

  zone = "1"

  tags = {
    Environment = "Demo"
  }
}

# PostgreSQL Database
resource "azurerm_postgresql_flexible_server_database" "demo" {
  name      = "demo"
  server_id = azurerm_postgresql_flexible_server.demo.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Windows Virtual Machine for ADFS
resource "azurerm_windows_virtual_machine" "adfs" {
  name                = "demo-adfs"
  resource_group_name = azurerm_resource_group.demo.name
  location            = azurerm_resource_group.demo.location
  size                = "Standard_D2s_v3"
  admin_username      = var.vm_admin_username
  admin_password      = var.vm_admin_password

  network_interface_ids = [
    azurerm_network_interface.adfs.id,
  ]

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "MicrosoftWindowsServer"
    offer     = "WindowsServer"
    sku       = "2022-Datacenter"
    version   = "latest"
  }

  tags = {
    Environment = "Demo"
  }
}

# Network Interface for ADFS VM
resource "azurerm_network_interface" "adfs" {
  name                = "demo-adfs-nic"
  location            = azurerm_resource_group.demo.location
  resource_group_name = azurerm_resource_group.demo.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.demo.id
    private_ip_address_allocation = "Dynamic"
  }
}
