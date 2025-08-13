terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "scheduling-app-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "scheduling-app-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "scheduling-app-public-1"
  }
}

resource "aws_subnet" "public_2" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "${var.aws_region}b"
  map_public_ip_on_launch = true

  tags = {
    Name = "scheduling-app-public-2"
  }
}

# Private Subnets
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "scheduling-app-private-1"
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.20.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name = "scheduling-app-private-2"
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "scheduling-app-public-rt"
  }
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

# Security Groups
resource "aws_security_group" "alb_sg" {
  name_prefix = "scheduling-alb-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "scheduling-app-alb-sg"
  }
}

resource "aws_security_group" "ecs_sg" {
  name_prefix = "scheduling-ecs-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "scheduling-app-ecs-sg"
  }
}

resource "aws_security_group" "redis_sg" {
  name_prefix = "scheduling-redis-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_sg.id]
  }

  tags = {
    Name = "scheduling-app-redis-sg"
  }
}

# Application Load Balancer
resource "aws_lb" "scheduling_alb" {
  name               = "scheduling-app-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_1.id, aws_subnet.public_2.id]

  tags = {
    Name = "scheduling-app-alb"
  }
}

resource "aws_lb_target_group" "scheduling_tg" {
  name        = "scheduling-app-tg"
  port        = 4000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  tags = {
    Name = "scheduling-app-tg"
  }
}

resource "aws_lb_listener" "scheduling_listener" {
  load_balancer_arn = aws_lb.scheduling_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.scheduling_tg.arn
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "scheduling_cluster" {
  name = "scheduling-app-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "scheduling-app-cluster"
  }
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "redis_subnet_group" {
  name       = "scheduling-redis-subnet-group"
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "scheduling-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnet_group.name
  security_group_ids   = [aws_security_group.redis_sg.id]

  tags = {
    Name = "scheduling-app-redis"
  }
}

# Secrets
resource "aws_ssm_parameter" "database_url" {
  name  = "/scheduling/DATABASE_URL"
  type  = "SecureString"
  value = var.database_url
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/scheduling/JWT_SECRET"
  type  = "SecureString"
  value = var.jwt_secret
}

resource "aws_ssm_parameter" "session_secret" {
  name  = "/scheduling/SESSION_SECRET"
  type  = "SecureString"
  value = var.session_secret
}

resource "aws_ssm_parameter" "google_client_id" {
  name  = "/scheduling/GOOGLE_CLIENT_ID"
  type  = "String"
  value = var.google_client_id
}

resource "aws_ssm_parameter" "google_client_secret" {
  name  = "/scheduling/GOOGLE_CLIENT_SECRET"
  type  = "SecureString"
  value = var.google_client_secret
}

resource "aws_ssm_parameter" "frontend_url" {
  name  = "/scheduling/FRONTEND_URL"
  type  = "SecureString"
  value = var.frontend_url
}


# ECS Task Definition
resource "aws_ecs_task_definition" "scheduling_task" {
  family                   = "scheduling-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 1024
  memory                   = 2048
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "backend"
      image = "777786711870.dkr.ecr.us-east-1.amazonaws.com/backend:latest"
      portMappings = [
        {
          containerPort = 4000
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "FRONTEND_URL"
          value = "https://scheduler-two-rho.vercel.app"
        },
        {
          name  = "REDIS_HOST"
          value = aws_elasticache_cluster.redis.cache_nodes[0].address
        },
        {
          name  = "GOOGLE_CALLBACK_URL"
          value = "https://api.xuja0812.online/auth/google/callback"
        }
      ]
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_ssm_parameter.database_url.arn
        },
        {
          name      = "JWT_SECRET"
          valueFrom = aws_ssm_parameter.jwt_secret.arn
        },
        {
          name      = "SESSION_SECRET"
          valueFrom = aws_ssm_parameter.session_secret.arn
        },
        {
          name      = "GOOGLE_CLIENT_ID"
          valueFrom = aws_ssm_parameter.google_client_id.arn
        },
        {
          name      = "GOOGLE_CLIENT_SECRET"
          valueFrom = aws_ssm_parameter.google_client_secret.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs_logs.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "backend"
        }
      }

      essential = true
    }
  ])
}

# Request SSL certificate for your domain
resource "aws_acm_certificate" "ssl_cert" {
  domain_name       = "xuja0812.online"
  validation_method = "DNS"
  
  lifecycle {
    create_before_destroy = true
  }
}

# Add HTTPS listener to ALB
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.scheduling_alb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.ssl_cert.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.scheduling_tg.arn
  }
}

# ECS Service
resource "aws_ecs_service" "scheduling_service" {
  name            = "scheduling-app-service"
  cluster         = aws_ecs_cluster.scheduling_cluster.id
  task_definition = aws_ecs_task_definition.scheduling_task.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100

  network_configuration {
    security_groups  = [aws_security_group.ecs_sg.id]
    subnets          = [aws_subnet.private_1.id, aws_subnet.private_2.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.scheduling_tg.arn
    container_name   = "backend"
    container_port   = 4000
  }


  depends_on = [aws_lb_listener.scheduling_listener]

  tags = {
    Name = "scheduling-app-service"
  }
}

# ECR Repositories
resource "aws_ecr_repository" "backend" {
  name = "scheduling-backend"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "nginx" {
  name = "scheduling-nginx"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "ecs_logs" {
  name              = "/ecs/scheduling-app"
  retention_in_days = 7
}

# IAM Roles
resource "aws_iam_role" "ecs_execution_role" {
  name = "scheduling-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task_role" {
  name = "scheduling-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}
