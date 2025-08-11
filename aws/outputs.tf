output "load_balancer_url" {
  description = "URL of the load balancer"
  value       = "http://${aws_lb.scheduling_alb.dns_name}"
}

output "ecr_backend_repository_url" {
  description = "URL of the backend ECR repository"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_nginx_repository_url" {
  description = "URL of the nginx ECR repository"
  value       = aws_ecr_repository.nginx.repository_url
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.scheduling_cluster.name
}