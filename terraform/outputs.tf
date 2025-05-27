# Output values for the infrastructure

# Network outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = yandex_vpc_network.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = yandex_vpc_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = yandex_vpc_subnet.private[*].id
}

# Database outputs
output "postgres_cluster_id" {
  description = "ID of the PostgreSQL cluster"
  value       = yandex_mdb_postgresql_cluster.main.id
}

output "postgres_host" {
  description = "FQDN of the PostgreSQL master host"
  value       = yandex_mdb_postgresql_cluster.main.host[0].fqdn
}

output "database_connection_string" {
  description = "Database connection string"
  value       = "postgresql://${var.db_username}:${var.db_password}@${yandex_mdb_postgresql_cluster.main.host[0].fqdn}:6432/${yandex_mdb_postgresql_database.booking_db.name}"
  sensitive   = true
}

# Redis outputs - DISABLED FOR INITIAL DEPLOYMENT
# output "redis_cluster_id" {
#   description = "ID of the Redis cluster"
#   value       = yandex_mdb_redis_cluster.main.id
# }

# output "redis_host" {
#   description = "FQDN of the Redis master host"
#   value       = yandex_mdb_redis_cluster.main.host[0].fqdn
# }

# output "redis_connection_string" {
#   description = "Redis connection string"
#   value       = "redis://:${var.redis_password}@${yandex_mdb_redis_cluster.main.host[0].fqdn}:6379"
#   sensitive   = true
# }

# Load balancer outputs
output "load_balancer_ip" {
  description = "External IP address of the load balancer"
  value       = yandex_alb_load_balancer.main.listener[0].endpoint[0].address[0].external_ipv4_address[0].address
}

output "application_url" {
  description = "URL of the deployed application"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "http://${yandex_alb_load_balancer.main.listener[0].endpoint[0].address[0].external_ipv4_address[0].address}"
}

# Storage outputs
output "static_files_bucket" {
  description = "Name of the static files bucket"
  value       = yandex_storage_bucket.static_files.bucket
}

output "user_uploads_bucket" {
  description = "Name of the user uploads bucket"
  value       = yandex_storage_bucket.user_uploads.bucket
}

output "storage_access_key" {
  description = "Access key for Object Storage"
  value       = yandex_iam_service_account_static_access_key.storage_key.access_key
}

output "storage_secret_key" {
  description = "Secret key for Object Storage"
  value       = yandex_iam_service_account_static_access_key.storage_key.secret_key
  sensitive   = true
}

# Container registry outputs
output "container_registry_id" {
  description = "ID of the Container Registry"
  value       = yandex_container_registry.main.id
}

output "container_registry_url" {
  description = "URL of the Container Registry"
  value       = "cr.yandex/${yandex_container_registry.main.id}"
}

output "container_registry_key" {
  description = "Service account key for Container Registry authentication (JSON)"
  value       = yandex_iam_service_account_key.registry_key.private_key
  sensitive   = true
}

# Serverless outputs
output "serverless_container_id" {
  description = "ID of the serverless container"
  value       = yandex_serverless_container.worker.id
}

# Message queue disabled for initial deployment
# output "message_queue_url" {
#   description = "URL of the Message Queue"
#   value       = yandex_message_queue.tasks.id
# }

# Monitoring outputs
# Monitoring dashboard disabled for initial deployment
# output "monitoring_dashboard_url" {
#   description = "URL of the monitoring dashboard" 
#   value       = var.enable_monitoring ? "https://monitoring.cloud.yandex.ru/dashboards/${yandex_monitoring_dashboard.main[0].id}" : null
# }

output "log_group_id" {
  description = "ID of the log group"
  value       = yandex_logging_group.main.id
}

# Service account outputs
output "compute_service_account_id" {
  description = "ID of the compute service account"
  value       = yandex_iam_service_account.compute_sa.id
}

output "storage_service_account_id" {
  description = "ID of the storage service account"
  value       = yandex_iam_service_account.storage_sa.id
}

# Instance group outputs
output "backend_instance_group_id" {
  description = "ID of the backend instance group"
  value       = yandex_compute_instance_group.backend.id
}

output "frontend_instance_group_id" {
  description = "ID of the frontend instance group"
  value       = yandex_compute_instance_group.frontend.id
}

# Cost estimation outputs
output "estimated_monthly_cost_usd" {
  description = "Estimated monthly cost in USD (approximate)"
  value = {
    minimum = {
      compute_instances = 50    # 2 backend + 2 frontend instances (s2.small)
      postgresql_cluster = 80   # s2.small with 50GB storage
      redis_cluster = 30        # hm3.small with 16GB storage
      load_balancer = 15        # ALB basic
      object_storage = 5        # 100GB storage + requests
      monitoring = 10           # Basic monitoring
      network = 5               # Data transfer
      total = 195
    }
    average = {
      compute_instances = 120   # Auto-scaling to 4-6 instances
      postgresql_cluster = 120  # s2.medium with 100GB storage
      redis_cluster = 50        # hm3.medium with 32GB storage
      load_balancer = 25        # ALB with higher traffic
      object_storage = 15       # 500GB storage + requests
      monitoring = 20           # Enhanced monitoring
      network = 15              # Higher data transfer
      total = 365
    }
    maximum = {
      compute_instances = 300   # Peak scaling to 10+ instances
      postgresql_cluster = 200  # s2.large with 200GB storage
      redis_cluster = 100       # hm3.large with 64GB storage
      load_balancer = 50        # ALB with high traffic
      object_storage = 40       # 2TB storage + high requests
      monitoring = 30           # Full monitoring suite
      network = 35              # High data transfer
      total = 755
    }
  }
}
