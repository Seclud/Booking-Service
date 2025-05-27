# Security Groups Configuration

# Security group for Application Load Balancer
resource "yandex_vpc_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for Application Load Balancer"
  network_id  = yandex_vpc_network.main.id

  ingress {
    description    = "HTTP"
    protocol       = "TCP"
    port           = 80
    v4_cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description    = "HTTPS"
    protocol       = "TCP"
    port           = 443
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  # Health check ingress rules from Yandex Cloud health checkers
  ingress {
    description    = "Health checks from Yandex Cloud"
    protocol       = "TCP"
    port           = 30080
    v4_cidr_blocks = ["198.18.235.0/24", "198.18.248.0/24"]
  }

  egress {
    description    = "All outbound traffic"
    protocol       = "ANY"
    from_port      = 0
    to_port        = 65535
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  labels = local.common_tags
}

# Security group for Backend API servers
resource "yandex_vpc_security_group" "backend" {
  name        = "${local.name_prefix}-backend-sg"
  description = "Security group for FastAPI backend servers"
  network_id  = yandex_vpc_network.main.id
  ingress {
    description       = "FastAPI from ALB"
    protocol          = "TCP"
    port              = 8000
    security_group_id = yandex_vpc_security_group.alb.id
  }

  # Health check ingress rules from Yandex Cloud health checkers
  ingress {
    description    = "Health checks from Yandex Cloud"
    protocol       = "TCP"
    port           = 8000
    v4_cidr_blocks = ["198.18.235.0/24", "198.18.248.0/24"]
  }

  ingress {
    description    = "SSH"
    protocol       = "TCP"
    port           = 22
    v4_cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description    = "Monitoring"
    protocol       = "TCP"
    port           = 9090
    v4_cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description    = "All outbound traffic"
    protocol       = "ANY"
    from_port      = 0
    to_port        = 65535
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  labels = local.common_tags
}

# Security group for Frontend servers
resource "yandex_vpc_security_group" "frontend" {
  name        = "${local.name_prefix}-frontend-sg"
  description = "Security group for React frontend servers"
  network_id  = yandex_vpc_network.main.id
  ingress {
    description       = "Frontend from ALB"
    protocol          = "TCP"
    port              = 80
    security_group_id = yandex_vpc_security_group.alb.id
  }

  # Health check ingress rules from Yandex Cloud health checkers
  ingress {
    description    = "Health checks from Yandex Cloud"
    protocol       = "TCP"
    port           = 80
    v4_cidr_blocks = ["198.18.235.0/24", "198.18.248.0/24"]
  }

  ingress {
    description    = "SSH"
    protocol       = "TCP"
    port           = 22
    v4_cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description    = "All outbound traffic"
    protocol       = "ANY"
    from_port      = 0
    to_port        = 65535
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  labels = local.common_tags
}

# Security group for PostgreSQL cluster
resource "yandex_vpc_security_group" "postgres" {
  name        = "${local.name_prefix}-postgres-sg"
  description = "Security group for PostgreSQL cluster"
  network_id  = yandex_vpc_network.main.id

  ingress {
    description       = "PostgreSQL from backend"
    protocol          = "TCP"
    port              = 6432
    security_group_id = yandex_vpc_security_group.backend.id
  }

  ingress {
    description       = "PostgreSQL from serverless"
    protocol          = "TCP"
    port              = 6432
    security_group_id = yandex_vpc_security_group.serverless.id
  }

  labels = local.common_tags
}

# Security group for Redis cluster - DISABLED FOR INITIAL DEPLOYMENT
# resource "yandex_vpc_security_group" "redis" {
#   name        = "${local.name_prefix}-redis-sg"
#   description = "Security group for Redis cluster"
#   network_id  = yandex_vpc_network.main.id

#   ingress {
#     description       = "Redis from backend"
#     protocol          = "TCP"
#     port              = 6379
#     security_group_id = yandex_vpc_security_group.backend.id
#   }

#   ingress {
#     description       = "Redis from serverless"
#     protocol          = "TCP"
#     port              = 6379
#     security_group_id = yandex_vpc_security_group.serverless.id
#   }

#   labels = local.common_tags
# }

# Security group for Serverless containers
resource "yandex_vpc_security_group" "serverless" {
  name        = "${local.name_prefix}-serverless-sg"
  description = "Security group for serverless containers"
  network_id  = yandex_vpc_network.main.id

  ingress {
    description    = "HTTP from ALB"
    protocol       = "TCP"
    port           = 8080
    v4_cidr_blocks = [var.vpc_cidr]
  }

  egress {
    description    = "All outbound traffic"
    protocol       = "ANY"
    from_port      = 0
    to_port        = 65535
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  labels = local.common_tags
}
