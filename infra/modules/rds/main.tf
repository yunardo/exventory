resource "aws_db_subnet_group" "main" {
  name        = var.db_subnet_group_name
  description = "Subnet group for SaaS RDS"

  subnet_ids = var.db_subnet_ids

  tags = {
    Name = var.db_subnet_group_name
  }
}

resource "aws_db_instance" "postgres" {
  identifier = var.db_identifier

  engine         = "postgres"
  instance_class = "db.m7g.large"

  allocated_storage = 20
  storage_type      = "gp2"

  username = "saas_admin"

  storage_encrypted     = true
  multi_az              = true
  copy_tags_to_snapshot = true
  skip_final_snapshot   = true

  db_subnet_group_name = "default-vpc-012cf15e79e99c982"

  vpc_security_group_ids = [
    var.rds_security_group_id
  ]

  publicly_accessible = false

  tags = {
    Name = var.db_identifier
  }

  lifecycle {
    ignore_changes = [
      password,
      engine_version,
    ]
  }
}