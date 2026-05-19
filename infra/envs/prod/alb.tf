resource "aws_lb" "main" {
  name               = "alb-saas-app"
  load_balancer_type = "application"
  internal           = false
  security_groups    = [aws_security_group.alb.id]

  subnets = [
    aws_subnet.public_a.id,
    aws_subnet.public_b.id
  ]

  tags = {
    Name = "alb-saas-app"
  }
}

resource "aws_lb_target_group" "ecs_api" {
  name                               = "tg-saas-api-ecs"
  port                               = 8000
  protocol                           = "HTTP"
  target_type                        = "ip"
  vpc_id                             = aws_vpc.main.id
  lambda_multi_value_headers_enabled = false
  proxy_protocol_v2                  = false

  health_check {
    path                = "/health/"
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name = "tg-saas-api-ecs"
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"

  ssl_policy      = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn = aws_acm_certificate.main.arn

  default_action {
    type = "forward"
    target_group_arn = aws_lb_target_group.ecs_api.arn

    forward {
      target_group {
        arn    = aws_lb_target_group.ecs_api.arn
        weight = 1
      }

      stickiness {
        enabled  = false
        duration = 3600
      }
    }
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}