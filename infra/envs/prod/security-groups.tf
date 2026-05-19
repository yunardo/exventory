resource "aws_security_group" "alb" {
  name                   = "saas-sg-alb"
  description            = "Saas ALB public access"
  vpc_id                 = aws_vpc.main.id
  revoke_rules_on_delete = false

  tags = {
    Name = "saas-sg-alb"
  }
}

resource "aws_security_group" "ecs" {
  name                   = "ecs-sg-saas-api"
  description            = "sg-ecs-saas-api Security Group para ECS"
  vpc_id                 = aws_vpc.main.id
  revoke_rules_on_delete = false

  tags = {
    Name = "ecs-sg-saas-api"
  }
}

resource "aws_security_group" "rds" {
  name                   = "saas-sg-rds-postgres"
  description            = "Postgres only from app (Sass)"
  vpc_id                 = aws_vpc.main.id
  revoke_rules_on_delete = false

  tags = {
    Name = "saas-sg-rds-postgres"
  }
}