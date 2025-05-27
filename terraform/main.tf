# Yandex Cloud Booking Service Infrastructure
# This Terraform configuration deploys a complete FastAPI + React application
# with PostgreSQL cluster, Redis, load balancer, and monitoring

terraform {
  required_providers {
    yandex = {
      source  = "yandex-cloud/yandex"
      version = "~> 0.120"
    }
    random = {
      source  = "hashicorp/random"
      version = "> 3.5"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "> 5.1"
    }
  }
  required_version = ">= 1.3.0"
}

# Provider configuration
provider "yandex" {
  token     = "y0_AgAAAAAOeqkqAATuwQAAAAEHz_6qAABIURvrKwxK9Iwsbu4zXgzAQkuuEw"
  cloud_id  = var.cloud_id
  folder_id = var.folder_id
  zone      = var.default_zone
}

# AWS provider for S3 compatibility (required for Yandex Object Storage)
provider "aws" {
  region                      = "us-east-1"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
  access_key                  = "mock_access_key"
  secret_key                  = "mock_secret_key"
}

# Local values for common tags and naming
locals {
  project_name = "booking-service"
  environment  = var.environment
    common_tags = {
    project     = local.project_name
    environment = local.environment
    terraform   = "true"
  }
  
  # Naming convention
  name_prefix = "${local.project_name}-${local.environment}"
}
