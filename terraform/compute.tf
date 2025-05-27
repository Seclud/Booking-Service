# Compute Instances for Application Servers

# Service account for compute instances
resource "yandex_iam_service_account" "compute_sa" {
  name        = "${local.name_prefix}-compute-sa"
  description = "Service account for compute instances"
}

# IAM bindings for compute service account
resource "yandex_resourcemanager_folder_iam_binding" "compute_viewer" {
  folder_id = var.folder_id
  role      = "viewer"
  
  members = [
    "serviceAccount:${yandex_iam_service_account.compute_sa.id}",
  ]
}

resource "yandex_resourcemanager_folder_iam_binding" "monitoring_writer" {
  folder_id = var.folder_id
  role      = "monitoring.editor"
  
  members = [
    "serviceAccount:${yandex_iam_service_account.compute_sa.id}",
  ]
}

# Add VPC user role to allow using network resources
resource "yandex_resourcemanager_folder_iam_binding" "compute_vpc_user" {
  folder_id = var.folder_id
  role      = "vpc.user"
  
  members = [
    "serviceAccount:${yandex_iam_service_account.compute_sa.id}",
  ]
}

# Add compute admin role for instance group management
resource "yandex_resourcemanager_folder_iam_binding" "compute_admin" {
  folder_id = var.folder_id
  role      = "compute.admin"
  
  members = [
    "serviceAccount:${yandex_iam_service_account.compute_sa.id}",
  ]
}

# Add IAM service account user role (needed for instance groups)
resource "yandex_resourcemanager_folder_iam_binding" "compute_sa_user" {
  folder_id = var.folder_id
  role      = "iam.serviceAccounts.user"
  
  members = [
    "serviceAccount:${yandex_iam_service_account.compute_sa.id}",
  ]
}

# Add container registry puller role for pulling images
resource "yandex_resourcemanager_folder_iam_binding" "compute_registry_puller" {
  folder_id = var.folder_id
  role      = "container-registry.images.puller"
  
  members = [
    "serviceAccount:${yandex_iam_service_account.compute_sa.id}",
  ]
}

# Instance group for backend API servers
resource "yandex_compute_instance_group" "backend" {
  name               = "${local.name_prefix}-backend-ig"
  folder_id          = var.folder_id
  service_account_id = yandex_iam_service_account.compute_sa.id
  max_checking_health_duration = 900
  
  instance_template {
    platform_id = "standard-v3"
    
    resources {
      cores         = 2
      memory        = 4
      core_fraction = 100
    }
    
    boot_disk {
      mode = "READ_WRITE"
      initialize_params {
        image_id = data.yandex_compute_image.ubuntu.id
        size     = 30
        type     = "network-hdd"
      }
    }
      network_interface {
      network_id         = yandex_vpc_network.main.id
      subnet_ids         = yandex_vpc_subnet.private[*].id
      security_group_ids = [yandex_vpc_security_group.backend.id]      
      nat                = false
    }          
    metadata = {
      ssh-keys = "ubuntu:ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMiwRFwl1O4xMGFLyAMg2suK/aLNyz8S2ezsbr0ZZCOc tihan@Seclud-Laptop"
      user-data = file("${path.module}/cloud-init/backend-container-fixed.yml")
    }
    
    service_account_id = yandex_iam_service_account.compute_sa.id
    
    labels = merge(local.common_tags, {
      "user-data-hash" = filemd5("${path.module}/cloud-init/backend-container-fixed.yml")
    })
  }
  
  scale_policy {
    fixed_scale {
      size = var.app_instance_count
    }
  }
  
  allocation_policy {
    zones = ["ru-central1-a", "ru-central1-b"]
  }
    deploy_policy {
    max_unavailable = 1
    max_creating    = 2
    max_expansion   = 1    
    max_deleting    = 1    
    startup_duration = 120    
    }    
    health_check {
    http_options {
      port = 8000
      path = "/health"
    }
    
    interval            = 30    # Check every 30 seconds
    timeout             = 20    # 20 second timeout
    unhealthy_threshold = 3     # 3 failures = unhealthy  
    healthy_threshold   = 2     # 2 successes = healthy
  }
}

# Instance group for frontend servers
resource "yandex_compute_instance_group" "frontend" {
  name               = "${local.name_prefix}-frontend-ig"
  folder_id          = var.folder_id
  service_account_id = yandex_iam_service_account.compute_sa.id
  max_checking_health_duration = 900
  
  instance_template {
    platform_id = "standard-v3"
    
    resources {
      cores         = 2
      memory        = 2
      core_fraction = 100
    }
    
    boot_disk {
      mode = "READ_WRITE"
      initialize_params {
        image_id = data.yandex_compute_image.ubuntu.id
        size     = 20
        type     = "network-hdd"
      }
    }
    
    network_interface {
      network_id         = yandex_vpc_network.main.id
      subnet_ids         = yandex_vpc_subnet.private[*].id
      security_group_ids = [yandex_vpc_security_group.frontend.id]      
      nat                = false    
      }          
      metadata = {
      ssh-keys = "ubuntu:ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMiwRFwl1O4xMGFLyAMg2suK/aLNyz8S2ezsbr0ZZCOc tihan@Seclud-Laptop"
      user-data = file("${path.module}/cloud-init/frontend-container-fixed.yml")
    }
    
    service_account_id = yandex_iam_service_account.compute_sa.id
    
    labels = merge(local.common_tags, {
      "user-data-hash" = filemd5("${path.module}/cloud-init/frontend-container-fixed.yml")
    })
  }
  
  scale_policy {
    fixed_scale {
      size = var.app_instance_count
    }
  }
  
  allocation_policy {
    zones = ["ru-central1-a", "ru-central1-b"]
  }
    deploy_policy {
    max_unavailable = 1
    max_creating    = 2
    max_expansion   = 1
    max_deleting    = 1
    startup_duration = 120
    }      
    health_check {
    http_options {
      port = 80
      path = "/"
    }
    
    interval            = 30    # Check every 30 seconds
    timeout             = 20    # 20 second timeout  
    unhealthy_threshold = 3     # 3 failures = unhealthy
    healthy_threshold   = 2     # 2 successes = healthy
  }
}

# Data source for Ubuntu image
data "yandex_compute_image" "ubuntu" {
  family = "ubuntu-2004-lts"
}
