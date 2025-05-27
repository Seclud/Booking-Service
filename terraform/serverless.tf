# Container Registry and Serverless Containers Configuration

# Container Registry
resource "yandex_container_registry" "main" {
  name      = "${local.name_prefix}-registry"
  folder_id = var.folder_id
  
  labels = local.common_tags
}

# Service account for Container Registry
resource "yandex_iam_service_account" "registry_sa" {
  name        = "${local.name_prefix}-registry-sa"
  description = "Service account for Container Registry operations"
}

# Service account key for Container Registry authentication
resource "yandex_iam_service_account_key" "registry_key" {
  service_account_id = yandex_iam_service_account.registry_sa.id
  description        = "Service account key for Container Registry access"
  key_algorithm      = "RSA_2048"
}

# IAM binding for container registry pusher role
resource "yandex_resourcemanager_folder_iam_binding" "registry_pusher" {
  folder_id = var.folder_id
  role      = "container-registry.images.pusher"
  
  members = [
    "serviceAccount:${yandex_iam_service_account.registry_sa.id}",
  ]
}

# Service account for serverless containers
resource "yandex_iam_service_account" "serverless_sa" {
  name        = "${local.name_prefix}-serverless-sa"
  description = "Service account for serverless containers"
}

# IAM bindings for serverless service account
resource "yandex_resourcemanager_folder_iam_binding" "serverless_invoker" {
  folder_id = var.folder_id
  role      = "serverless-containers.containerInvoker"
  
  members = [
    "serviceAccount:${yandex_iam_service_account.serverless_sa.id}",
  ]
}

resource "yandex_resourcemanager_folder_iam_binding" "vpc_user" {
  folder_id = var.folder_id
  role      = "vpc.user"
  
  members = [
    "serviceAccount:${yandex_iam_service_account.serverless_sa.id}",
  ]
}

# Serverless container for background tasks
resource "yandex_serverless_container" "worker" {
  name               = "${local.name_prefix}-worker"
  memory             = 1024
  execution_timeout  = "60s"
  cores              = 1
  core_fraction      = 100
  service_account_id = yandex_iam_service_account.serverless_sa.id
    connectivity {
    network_id = yandex_vpc_network.main.id
  }
  image {
    url = "cr.yandex/crpd0l8bb9kbi9j1gltv/ubuntu:latest"
    environment = {
      DATABASE_URL = "postgresql://${yandex_mdb_postgresql_user.app_user.name}:${var.db_password}@${yandex_mdb_postgresql_cluster.main.host[0].fqdn}:6432/${yandex_mdb_postgresql_database.booking_db.name}"
      # REDIS_URL disabled for initial deployment
      ENVIRONMENT  = var.environment
    }
  }
  
  labels = local.common_tags
}

# Message Queue for async processing - DISABLED FOR INITIAL DEPLOYMENT
# resource "yandex_message_queue" "tasks" {
#   name                      = "${local.name_prefix}-tasks"
#   visibility_timeout_seconds = 300
#   message_retention_seconds  = 1209600  # 14 days
#   max_message_size          = 262144    # 256 KB
#   delay_seconds             = 0
#   receive_wait_time_seconds = 0
#   
#   access_key = yandex_iam_service_account_static_access_key.queue_key.access_key
#   secret_key = yandex_iam_service_account_static_access_key.queue_key.secret_key
# }

# Service account for Message Queue
resource "yandex_iam_service_account" "queue_sa" {
  name        = "${local.name_prefix}-queue-sa"
  description = "Service account for Message Queue operations"
}

# Access key for Message Queue service account
resource "yandex_iam_service_account_static_access_key" "queue_key" {
  service_account_id = yandex_iam_service_account.queue_sa.id
  description        = "Static access key for Message Queue"
}

# IAM binding for message queue admin role
resource "yandex_resourcemanager_folder_iam_binding" "queue_admin" {
  folder_id = var.folder_id
  role      = "ymq.admin"
  
  members = [
    "serviceAccount:${yandex_iam_service_account.queue_sa.id}",
  ]
}
