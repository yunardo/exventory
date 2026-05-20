data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

module "network" {
  source = "../../modules/network"

  vpc_cidr = "10.0.0.0/16"
}

module "security" {
  source = "../../modules/security"

  vpc_id = module.network.vpc_id
}

module "alb" {
  source = "../../modules/alb"

  vpc_id = module.network.vpc_id
  public_subnet_ids = [
    module.network.public_subnet_a_id,
    module.network.public_subnet_b_id
  ]
  alb_security_group_id = module.security.alb_security_group_id
  certificate_arn       = aws_acm_certificate.main.arn
}

module "ecs" {
  source = "../../modules/ecs"

  cluster_name         = "exventory-prod-cluster"
  service_name         = "saas-api-service-9dxkhprv"
  image_uri            = "316777659644.dkr.ecr.us-east-1.amazonaws.com/saas-api:latest"
  aws_region           = var.aws_region
  log_group_name       = "/exventory/prod/api"
  ssm_parameter_prefix = "arn:aws:ssm:us-east-1:316777659644:parameter/saas/prod"

  private_subnet_ids = [
    module.network.private_app_a_id,
    module.network.private_app_b_id
  ]

  ecs_security_group_id = module.security.ecs_security_group_id
  target_group_arn      = module.alb.ecs_target_group_arn

  execution_role_arn = "arn:aws:iam::316777659644:role/ecsTaskExecutionRole"
  task_role_arn      = "arn:aws:iam::316777659644:role/ecsSaasApiTaskRole"
}

module "rds" {
  source = "../../modules/rds"

  db_identifier        = "saas-postgres-prod-1"
  db_subnet_group_name = "saas-db-subnet-group"

  db_subnet_ids = [
    module.network.private_db_a_id,
    module.network.private_db_b_id
  ]

  rds_security_group_id = module.security.rds_security_group_id
}

module "route53" {
  source = "../../modules/route53"

  domain_name  = "exventory.com"
  alb_dns_name = module.alb.alb_dns_name
  alb_zone_id  = module.alb.alb_zone_id
}

module "monitoring" {
  source = "../../modules/monitoring"

  log_group_name     = "/exventory/prod/api"
  log_retention_days = 7

  sns_topic_arn = "arn:aws:sns:us-east-1:316777659644:exventory-prod-alerts"

  alb_arn_suffix          = module.alb.alb_arn_suffix
  target_group_arn_suffix = module.alb.ecs_target_group_arn_suffix

  db_instance_identifier = module.rds.db_instance_identifier

  ecs_cluster_name = module.ecs.cluster_name
  ecs_service_name = module.ecs.service_name
}