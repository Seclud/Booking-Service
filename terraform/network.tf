# Virtual Private Cloud and Network Configuration

# Available zones
locals {
  availability_zones = ["ru-central1-a", "ru-central1-b"]
}

# VPC
resource "yandex_vpc_network" "main" {
  name        = "${local.name_prefix}-vpc"
  description = "Main VPC for booking service"
  
  labels = local.common_tags
}

# Public subnets for load balancer and NAT gateway
resource "yandex_vpc_subnet" "public" {
  count = length(var.public_subnet_cidrs)
  
  name           = "${local.name_prefix}-public-${count.index + 1}"
  zone           = local.availability_zones[count.index]
  network_id     = yandex_vpc_network.main.id
  v4_cidr_blocks = [var.public_subnet_cidrs[count.index]]
  
  labels = local.common_tags
}

# Private subnets for application servers and database
resource "yandex_vpc_subnet" "private" {
  count = length(var.private_subnet_cidrs)
  
  name           = "${local.name_prefix}-private-${count.index + 1}"
  zone           = local.availability_zones[count.index]
  network_id     = yandex_vpc_network.main.id
  v4_cidr_blocks = [var.private_subnet_cidrs[count.index]]
  route_table_id = yandex_vpc_route_table.private[count.index].id
  
  labels = local.common_tags
}

# NAT Gateway for private subnets
resource "yandex_compute_instance" "nat" {
  count = length(var.public_subnet_cidrs)
    name        = "${local.name_prefix}-nat-${count.index + 1}"
  platform_id = "standard-v3"
  zone        = local.availability_zones[count.index]
  
  resources {
    cores  = 2
    memory = 2
  }
  
  boot_disk {
    initialize_params {
      image_id = data.yandex_compute_image.nat.id
      size     = 20
    }
  }
  
  network_interface {
    subnet_id  = yandex_vpc_subnet.public[count.index].id
    nat        = true
    ip_address = "10.0.${count.index + 1}.10"
  }
    metadata = {
    ssh-keys = "ubuntu:ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMiwRFwl1O4xMGFLyAMg2suK/aLNyz8S2ezsbr0ZZCOc tihan@Seclud-Laptop"
  }
  
  labels = local.common_tags
}

# Route tables for private subnets
resource "yandex_vpc_route_table" "private" {
  count = length(var.private_subnet_cidrs)
  
  name       = "${local.name_prefix}-rt-private-${count.index + 1}"
  network_id = yandex_vpc_network.main.id
  
  static_route {
    destination_prefix = "0.0.0.0/0"
    next_hop_address   = yandex_compute_instance.nat[count.index].network_interface.0.ip_address
  }
  
  labels = local.common_tags
}

# Data source for NAT image
data "yandex_compute_image" "nat" {
  family = "nat-instance-ubuntu"
}
