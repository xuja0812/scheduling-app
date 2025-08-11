variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "database_url" {
  description = "Supabase database URL"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "session_secret" {
  description = "Session secret key"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
}

variable "frontend_url" {
  description = "Prod frontend URL"
  type        = string
  sensitive   = true
}