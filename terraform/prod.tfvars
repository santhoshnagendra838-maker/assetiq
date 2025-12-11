environment          = "prod"

# ECR Repository Names
backend_repo_name    = "assetiq-backend"
frontend_repo_name   = "assetiq-frontend"

# Image Tags
backend_image_tag    = "latest"
frontend_image_tag   = "latest"

# Service Scaling - Production Environment (high availability)
desired_count_backend  = 2
desired_count_frontend = 2

# Resource Sizing - Production Environment
backend_cpu          = "512"
backend_memory       = "1024"
frontend_cpu         = "512"
frontend_memory      = "1024"