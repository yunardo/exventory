resource "aws_ecs_cluster" "main" {
  name = var.cluster_name

  configuration {
    execute_command_configuration {
      logging = "DEFAULT"
    }
  }

  tags = {
    Name = var.cluster_name
  }
}

resource "aws_ecs_task_definition" "api" {
  family                   = "saas-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "512"
  memory                   = "1024"

  execution_role_arn = var.execution_role_arn
  task_role_arn      = var.task_role_arn

  container_definitions = jsonencode([
    {
      name      = "saas_api"
      image     = var.image_uri
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
          valueFrom = "${var.ssm_parameter_prefix}/DJANGO_SECRET_KEY"
        },
        {
          name      = "DJANGO_ALLOWED_HOSTS"
          valueFrom = "${var.ssm_parameter_prefix}/DJANGO_ALLOWED_HOSTS"
        },
        {
          name      = "DJANGO_CSRF_TRUSTED_ORIGINS"
          valueFrom = "${var.ssm_parameter_prefix}/DJANGO_CSRF_TRUSTED_ORIGINS"
        },
        {
          name      = "POSTGRES_DB"
          valueFrom = "${var.ssm_parameter_prefix}/POSTGRES_DB"
        },
        {
          name      = "POSTGRES_USER"
          valueFrom = "${var.ssm_parameter_prefix}/POSTGRES_USER"
        },
        {
          name      = "POSTGRES_PASSWORD"
          valueFrom = "${var.ssm_parameter_prefix}/POSTGRES_PASSWORD"
        },
        {
          name      = "POSTGRES_HOST"
          valueFrom = "${var.ssm_parameter_prefix}/POSTGRES_HOST"
        },
        {
          name      = "POSTGRES_PORT"
          valueFrom = "${var.ssm_parameter_prefix}/POSTGRES_PORT"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = var.log_group_name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "api" {
  name            = var.service_name
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  enable_execute_command        = false
  enable_ecs_managed_tags       = true
  availability_zone_rebalancing = "ENABLED"

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = "saas_api"
    container_port   = 8000
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
}