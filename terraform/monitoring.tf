# Yandex Monitoring Configuration

# Service account for monitoring
resource "yandex_iam_service_account" "monitoring_sa" {
  name        = "${local.name_prefix}-monitoring-sa"
  description = "Service account for monitoring operations"
}

# IAM binding for monitoring writer role
resource "yandex_resourcemanager_folder_iam_binding" "monitoring_editor" {
  folder_id = var.folder_id
  role      = "monitoring.editor"
  
  members = [
    "serviceAccount:${yandex_iam_service_account.monitoring_sa.id}",
  ]
}

# Log group for application logs
resource "yandex_logging_group" "main" {
  name             = "${local.name_prefix}-logs"
  folder_id        = var.folder_id
  retention_period = "168h"  # 7 days
  
  labels = local.common_tags
}

# Function for custom metrics collection - DISABLED FOR INITIAL DEPLOYMENT
# resource "yandex_function" "metrics_collector" {
#   count = var.enable_monitoring ? 1 : 0
#   
#   name               = "${local.name_prefix}-metrics"
#   description        = "Custom metrics collector for booking service"
#   user_hash         = "metrics-v1"
#   runtime           = "python39"
#   entrypoint        = "index.handler"
#   memory            = "128"
#   execution_timeout = "30"
#   service_account_id = yandex_iam_service_account.monitoring_sa.id
#   
#   environment = {
#     DATABASE_URL = "postgresql://${var.db_username}:${var.db_password}@${yandex_mdb_postgresql_cluster.main.host[0].fqdn}:6432/${yandex_mdb_postgresql_database.booking_db.name}"
#     REDIS_URL    = "redis://:${var.redis_password}@${yandex_mdb_redis_cluster.main.host[0].fqdn}:6379"
#   }
#   
#   content {
#     zip_filename = "${path.module}/functions/metrics-collector.zip"
#   }
#   
#   labels = local.common_tags
# }

# Trigger for metrics collection every 5 minutes - DISABLED FOR INITIAL DEPLOYMENT
# resource "yandex_function_trigger" "metrics_timer" {
#   count = var.enable_monitoring ? 1 : 0
#   
#   name        = "${local.name_prefix}-metrics-timer"
#   description = "Timer trigger for metrics collection"
#   
#   timer {
#     cron_expression = "*/5 * * * ? *"  # Every 5 minutes
#   }
#   
#   function {
#     id                 = yandex_function.metrics_collector[0].id
#     service_account_id = yandex_iam_service_account.monitoring_sa.id
#   }
#   
#   labels = local.common_tags
# }

# Dashboard for application monitoring - DISABLED FOR INITIAL DEPLOYMENT  
# Will be enabled after core infrastructure is deployed successfully
# resource "yandex_monitoring_dashboard" "main" {
#   count = var.enable_monitoring ? 1 : 0
#   
#   name        = "${local.name_prefix}-dashboard"
#   description = "Main dashboard for booking service monitoring"
#   
#   labels = local.common_tags
# }
