environment          = "test"

# ECR Repository Names
backend_repo_name    = "test/assetiq-backend"
frontend_repo_name   = "test/assetiq-frontend"

# Image Tags
backend_image_tag    = "latest"
frontend_image_tag   = "latest"

# Service Scaling - Test Environment (smaller resources)
desired_count_backend  = 1
desired_count_frontend = 1

# Resource Sizing - Test Environment
backend_cpu          = "256"
backend_memory       = "512"
frontend_cpu         = "256"
frontend_memory      = "512"
