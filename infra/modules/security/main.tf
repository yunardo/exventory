resource "aws_security_group" "alb" {
  name                   = "saas-sg-alb"
  description            = "Saas ALB public access"
  vpc_id                 = var.vpc_id
  revoke_rules_on_delete = false

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
    Name = "saas-sg-alb"
  }
}

resource "aws_security_group" "ecs" {
  name                   = "ecs-sg-saas-api"
  description            = "sg-ecs-saas-api Security Group para ECS"
  vpc_id                 = var.vpc_id
  revoke_rules_on_delete = false

  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description = "just for testing. Deleteme!"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    self        = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ecs-sg-saas-api"
  }
}

resource "aws_security_group" "rds" {
  name                   = "saas-sg-rds-postgres"
  description            = "Postgres only from app (Sass)"
  vpc_id                 = var.vpc_id
  revoke_rules_on_delete = false

  ingress {
    from_port = 5432
    to_port   = 5432
    protocol  = "tcp"

    security_groups = [
      aws_security_group.ecs.id,
      "sg-0a77aa661003380ad"
    ]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "saas-sg-rds-postgres"
  }
}