# Application Load Balancer Configuration

# Target groups for backend and frontend
resource "yandex_alb_target_group" "backend" {
  name = "${local.name_prefix}-backend-tg"
  
  dynamic "target" {
    for_each = yandex_compute_instance_group.backend.instances
    content {
      subnet_id    = target.value.network_interface[0].subnet_id
      ip_address   = target.value.network_interface[0].ip_address
    }
  }
  
  labels = local.common_tags
}

resource "yandex_alb_target_group" "frontend" {
  name = "${local.name_prefix}-frontend-tg"
  
  dynamic "target" {
    for_each = yandex_compute_instance_group.frontend.instances
    content {
      subnet_id    = target.value.network_interface[0].subnet_id
      ip_address   = target.value.network_interface[0].ip_address
    }
  }
  
  labels = local.common_tags
}

# Backend group for API
resource "yandex_alb_backend_group" "backend" {
  name = "${local.name_prefix}-backend-bg"
  
  http_backend {
    name                   = "backend-http"
    weight                 = 1
    port                   = 8000
    target_group_ids       = [yandex_alb_target_group.backend.id]
    load_balancing_config {
      panic_threshold      = 50
    }
    healthcheck {
      timeout              = "10s"
      interval             = "2s"
      healthy_threshold    = 2
      unhealthy_threshold  = 3
      healthcheck_port     = 8000
      http_healthcheck {
        host               = "localhost"
        path               = "/api/health" # Corrected health check path
      }
    }
  }
  
  labels = local.common_tags
}

# Backend group for frontend
resource "yandex_alb_backend_group" "frontend" {
  name = "${local.name_prefix}-frontend-bg"
  
  http_backend {
    name                   = "frontend-http"
    weight                 = 1
    port                   = 80
    target_group_ids       = [yandex_alb_target_group.frontend.id]
    load_balancing_config {
      panic_threshold      = 50
    }
    healthcheck {
      timeout              = "10s"
      interval             = "2s"
      healthy_threshold    = 2
      unhealthy_threshold  = 3
      healthcheck_port     = 80
      http_healthcheck {
        host               = "localhost"
        path               = "/"
      }
    }
  }
  
  labels = local.common_tags
}

# HTTP router
resource "yandex_alb_http_router" "main" {
  name = "${local.name_prefix}-router"
  
  labels = local.common_tags
}

# Virtual host for the application
resource "yandex_alb_virtual_host" "main" {
  name           = "${local.name_prefix}-vh"
  http_router_id = yandex_alb_http_router.main.id
    # API routes
  route {
    name = "api"
    http_route {
      http_match {
        path {
          prefix = "/api"
        }
      }
      http_route_action {
        backend_group_id = yandex_alb_backend_group.backend.id
        prefix_rewrite   = "" # Corrected prefix_rewrite to strip /api
        timeout          = "60s"
      }
    }
  }
  
  # Health check route
  route {
    name = "health"
    http_route {
      http_match {
        path {
          exact = "/health"
        }
      }
      http_route_action {
        backend_group_id = yandex_alb_backend_group.backend.id
        timeout          = "10s"
      }
    }
  }
  
  # Frontend routes (catch-all)
  route {
    name = "frontend"
    http_route {
      http_match {
        path {
          prefix = "/"
        }
      }
      http_route_action {
        backend_group_id = yandex_alb_backend_group.frontend.id
        timeout          = "30s"
      }
    }
  }
}

# Application Load Balancer
resource "yandex_alb_load_balancer" "main" {
  name       = "${local.name_prefix}-alb"
  network_id = yandex_vpc_network.main.id
  
  allocation_policy {
    dynamic "location" {
      for_each = yandex_vpc_subnet.public
      content {
        zone_id   = location.value.zone
        subnet_id = location.value.id
      }
    }
  }
  
  listener {
    name = "http-listener"
    endpoint {
      address {
        external_ipv4_address {
        }
      }
      ports = [80]
    }
    
    http {
      handler {
        http_router_id = yandex_alb_http_router.main.id
      }
    }
  }
  
  # HTTPS listener (if SSL certificate is provided)
  dynamic "listener" {
    for_each = var.ssl_certificate_id != "" ? [1] : []
    content {
      name = "https-listener"
      endpoint {
        address {
          external_ipv4_address {
          }
        }
        ports = [443]
      }
      
      tls {
        default_handler {
          certificate_ids = [var.ssl_certificate_id]
          http_handler {
            http_router_id = yandex_alb_http_router.main.id
          }
        }
      }
    }
  }
  
  security_group_ids = [yandex_vpc_security_group.alb.id]
  
  labels = local.common_tags
}
