variable "AWS_REGION" {
  type        = string
  description = "AWS region for resources"
}

variable "AWS_ACCOUNT_ID" {
  type        = string
  description = "AWS account ID"
}

variable "environment" {
  type        = string
  description = "Environment name (test, prod)"
  validation {
    condition     = contains(["test", "prod"], var.environment)
    error_message = "Environment must be either 'test' or 'prod'."
  }
}

variable "backend_image_tag" {
  type        = string
  default     = "latest"
  description = "Docker image tag for backend"
}

variable "frontend_image_tag" {
  type        = string
  default     = "latest"
  description = "Docker image tag for frontend"
}

variable "backend_repo_name" {
  type        = string
  description = "ECR repository name for backend"
}

variable "frontend_repo_name" {
  type        = string
  description = "ECR repository name for frontend"
}

variable "desired_count_backend" {
  type        = number
  default     = 1
  description = "Desired number of backend tasks"
}

variable "desired_count_frontend" {
  type        = number
  default     = 1
  description = "Desired number of frontend tasks"
}

variable "backend_cpu" {
  type        = string
  default     = "512"
  description = "CPU units for backend task (256, 512, 1024, etc.)"
}

variable "backend_memory" {
  type        = string
  default     = "1024"
  description = "Memory (MB) for backend task"
}

variable "frontend_cpu" {
  type        = string
  default     = "256"
  description = "CPU units for frontend task (256, 512, 1024, etc.)"
}

variable "frontend_memory" {
  type        = string
  default     = "512"
  description = "Memory (MB) for frontend task"
}
variable "OPENAI_API_KEY" {
  type        = string
  description = "OpenAI API Key"
  sensitive   = true
}

variable "AWS_EXTERNAL_ID" {
  type        = string
  description = "AWS External ID"
}

variable "AWS_ROLE_ARN" {
  type        = string
  description = "AWS Role ARN"
}

variable "NEXT_PUBLIC_API_URL" {
  type        = string
  description = "Next Public API URL"
}

variable "CORS_ORIGINS" {
  type        = string
  description = "CORS Origins"
  default     = "http://localhost:3000"
}
