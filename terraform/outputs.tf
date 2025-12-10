output "alb_dns_name" {
  value = aws_lb.alb.dns_name
  description = "DNS name of the Application Load Balancer"
}

output "backend_service_name" {
  value = aws_ecs_service.backend.name
  description = "Name of the backend ECS service"
}

output "frontend_service_name" {
  value = aws_ecs_service.frontend.name
  description = "Name of the frontend ECS service"
}

output "ecr_backend_repository_url" {
  value = aws_ecr_repository.backend.repository_url
  description = "URL of the backend ECR repository"
}

output "ecr_frontend_repository_url" {
  value = aws_ecr_repository.frontend.repository_url
  description = "URL of the frontend ECR repository"
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.this.name
  description = "Name of the ECS cluster"
}