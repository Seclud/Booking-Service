# Additional variables for new components

variable "smtp_username" {
  description = "SMTP username for email notifications"
  type        = string
  default     = ""
}

variable "smtp_password" {
  description = "SMTP password for email notifications"
  type        = string
  sensitive   = true
  default     = ""
}

variable "from_email" {
  description = "From email address for notifications"
  type        = string
  default     = "noreply@booking-service.com"
}

variable "enable_auto_scaling" {
  description = "Enable auto-scaling for instance groups"
  type        = bool
  default     = true
}

variable "min_instance_count" {
  description = "Minimum number of instances in auto-scaling group"
  type        = number
  default     = 2
}

variable "max_instance_count" {
  description = "Maximum number of instances in auto-scaling group"
  type        = number
  default     = 10
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "enable_cdn" {
  description = "Enable CDN for static files"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Number of days to retain logs"
  type        = number
  default     = 30
}
