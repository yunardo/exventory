output "db_instance_identifier" {
  value = aws_db_instance.postgres.identifier
}

output "db_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "db_subnet_group_name" {
  value = aws_db_subnet_group.main.name
}