# Object Storage Configuration for Static Files

# Get current client config
data "yandex_client_config" "client" {}

# Service account for Object Storage
resource "yandex_iam_service_account" "storage_sa" {
  name        = "${local.name_prefix}-storage-sa"
  description = "Service account for Object Storage operations"
}

# Access key for Object Storage service account
resource "yandex_iam_service_account_static_access_key" "storage_key" {
  service_account_id = yandex_iam_service_account.storage_sa.id
  description        = "Static access key for Object Storage"
}

# IAM member for storage admin role (better than binding)
resource "yandex_resourcemanager_folder_iam_member" "storage_admin" {
  folder_id  = data.yandex_client_config.client.folder_id
  role       = "storage.admin"
  member     = "serviceAccount:${yandex_iam_service_account.storage_sa.id}"
  depends_on = [yandex_iam_service_account_static_access_key.storage_key]
}

# Object Storage bucket for application static files
resource "yandex_storage_bucket" "static_files" {
  bucket     = "${local.name_prefix}-static-files"
  access_key = yandex_iam_service_account_static_access_key.storage_key.access_key
  secret_key = yandex_iam_service_account_static_access_key.storage_key.secret_key
  
  depends_on = [yandex_resourcemanager_folder_iam_member.storage_admin]
}

# Object Storage bucket for user uploads  
resource "yandex_storage_bucket" "user_uploads" {
  bucket     = "${local.name_prefix}-user-uploads"
  access_key = yandex_iam_service_account_static_access_key.storage_key.access_key
  secret_key = yandex_iam_service_account_static_access_key.storage_key.secret_key
  
  depends_on = [yandex_resourcemanager_folder_iam_member.storage_admin]
}

# Object Storage bucket for backups
resource "yandex_storage_bucket" "backups" {
  bucket     = "${local.name_prefix}-backups"
  access_key = yandex_iam_service_account_static_access_key.storage_key.access_key
  secret_key = yandex_iam_service_account_static_access_key.storage_key.secret_key
  
  depends_on = [yandex_resourcemanager_folder_iam_member.storage_admin]
}
