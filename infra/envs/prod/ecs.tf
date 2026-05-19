resource "aws_ecs_cluster" "main" {
  name = "exventory-prod-cluster"

  configuration {
    execute_command_configuration {
      logging = "DEFAULT"
    }
  }

  tags = {
    Name = "exventory-prod-cluster"
  }
}

resource "aws_ecs_task_definition" "api" {
  family                   = "saas-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"

  execution_role_arn = "arn:aws:iam::316777659644:role/ecsTaskExecutionRole"
  task_role_arn      = "arn:aws:iam::316777659644:role/ecsSaasApiTaskRole"

  container_definitions = jsonencode([
    {
      name      = "saas_api"
      image     = "316777659644.dkr.ecr.us-east-1.amazonaws.com/saas-api:latest"
      essential = true

      portMappings = [
        {
          containerPort = 8000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "DJANGO_SETTINGS_MODULE"
          value = "config.settings.prod"
        },
        {
          name  = "DJANGO_DEBUG"
          value = "0"
        }
      ]

      secrets = [
        {
          name      = "DJANGO_SECRET_KEY"
          valueFrom = "arn:aws:ssm:us-east-1:316777659644:parameter/saas/prod/DJANGO_SECRET_KEY"
        },
        {
          name      = "DJANGO_ALLOWED_HOSTS"
          valueFrom = "arn:aws:ssm:us-east-1:316777659644:parameter/saas/prod/DJANGO_ALLOWED_HOSTS"
        },
        {
          name      = "DJANGO_CSRF_TRUSTED_ORIGINS"
          valueFrom = "arn:aws:ssm:us-east-1:316777659644:parameter/saas/prod/DJANGO_CSRF_TRUSTED_ORIGINS"
        },
        {
          name      = "POSTGRES_DB"
          valueFrom = "arn:aws:ssm:us-east-1:316777659644:parameter/saas/prod/POSTGRES_DB"
        },
        {
          name      = "POSTGRES_USER"
          valueFrom = "arn:aws:ssm:us-east-1:316777659644:parameter/saas/prod/POSTGRES_USER"
        },
        {
          name      = "POSTGRES_PASSWORD"
          valueFrom = "arn:aws:ssm:us-east-1:316777659644:parameter/saas/prod/POSTGRES_PASSWORD"
        },
        {
          name      = "POSTGRES_HOST"
          valueFrom = "arn:aws:ssm:us-east-1:316777659644:parameter/saas/prod/POSTGRES_HOST"
        },
        {
          name      = "POSTGRES_PORT"
          valueFrom = "arn:aws:ssm:us-east-1:316777659644:parameter/saas/prod/POSTGRES_PORT"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/exventory/prod/api"
          awslogs-region        = "us-east-1"
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "api" {
  name            = "saas-api-service-9dxkhprv"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  enable_execute_command       = false
  enable_ecs_managed_tags      = true
  availability_zone_rebalancing = "ENABLED"

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets = [
      aws_subnet.private_app_a.id,
      aws_subnet.private_app_b.id
    ]

    security_groups = [
      aws_security_group.ecs.id
    ]

    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.ecs_api.arn
    container_name   = "saas_api"
    container_port   = 8000
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
}