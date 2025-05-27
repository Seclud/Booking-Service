# PostgreSQL Managed Database Cluster Configuration

# PostgreSQL cluster with high availability
resource "yandex_mdb_postgresql_cluster" "main" {
  name        = "${local.name_prefix}-postgres"
  environment = var.environment == "prod" ? "PRODUCTION" : "PRESTABLE"
  network_id  = yandex_vpc_network.main.id
    config {
    version = "17"
    resources {
      resource_preset_id = "s2.micro"
      disk_type_id       = "network-ssd"
      disk_size          =  50
    }
    
    postgresql_config = {
      max_connections                   = 200
      enable_parallel_hash              = true
      vacuum_cleanup_index_scale_factor = 0.2
      autovacuum_vacuum_scale_factor    = 0.34
      default_transaction_isolation     = "TRANSACTION_ISOLATION_READ_COMMITTED"
      shared_preload_libraries          = "SHARED_PRELOAD_LIBRARIES_AUTO_EXPLAIN,SHARED_PRELOAD_LIBRARIES_PG_HINT_PLAN"
    }
      pooler_config {
      pool_discard = false
      pooling_mode = "TRANSACTION"
    }
    
    backup_window_start {
      hours   = 2
      minutes = 0
    }
    
    backup_retain_period_days = 7
      access {
      data_lens     = false
      web_sql       = false
      serverless    = true
    }
  }

  host {
    zone             = "ru-central1-a"
    subnet_id        = yandex_vpc_subnet.private[0].id
    assign_public_ip = false
  }

  host {
    zone                    = "ru-central1-b"
    subnet_id              = yandex_vpc_subnet.private[1].id
    assign_public_ip       = false
    replication_source_name = "${local.name_prefix}-postgres-1"
  }

  security_group_ids = [yandex_vpc_security_group.postgres.id]

  labels = local.common_tags
}

# Application database user
resource "yandex_mdb_postgresql_user" "app_user" {
  cluster_id = yandex_mdb_postgresql_cluster.main.id
  name       = var.db_username
  password   = var.db_password
  
  conn_limit = 50
}

# Database for the booking service
resource "yandex_mdb_postgresql_database" "booking_db" {
  cluster_id = yandex_mdb_postgresql_cluster.main.id
  name       = "booking_service"
  owner      = yandex_mdb_postgresql_user.app_user.name
  
  extension {
    name = "uuid-ossp"
  }
  
  extension {
    name = "pg_trgm"
  }
  
  depends_on = [yandex_mdb_postgresql_user.app_user]
}

# Read-only user for analytics
resource "yandex_mdb_postgresql_user" "readonly_user" {
  cluster_id = yandex_mdb_postgresql_cluster.main.id
  name       = "readonly"
  password   = var.db_password
  
  permission {
    database_name = yandex_mdb_postgresql_database.booking_db.name
  }
  
  conn_limit = 10
  
  depends_on = [yandex_mdb_postgresql_database.booking_db]
}
