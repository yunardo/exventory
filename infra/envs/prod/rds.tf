resource "aws_db_subnet_group" "main" {
  name        = "saas-db-subnet-group"
  description = "Subnet group for SaaS RDS"

  subnet_ids = [
    aws_subnet.private_db_a.id,
    aws_subnet.private_db_b.id
  ]

  tags = {
    Name = "saas-db-subnet-group"
  }
}

resource "aws_db_instance" "postgres" {
  identifier = "saas-postgres-prod-1"

  engine         = "postgres"
  instance_class = "db.m7g.large"

  allocated_storage = 20
  storage_type      = "gp2"

  username = "saas_admin"

  storage_encrypted    = true
  multi_az             = true
  copy_tags_to_snapshot = true
  skip_final_snapshot   = true

  db_subnet_group_name = "default-vpc-012cf15e79e99c982"

  vpc_security_group_ids = [
    aws_security_group.rds.id
  ]

  publicly_accessible = false

  tags = {
    Name = "saas-postgres-prod-1"
  }

  lifecycle {
    ignore_changes = [
      password,
      engine_version,
    ]
  }
}