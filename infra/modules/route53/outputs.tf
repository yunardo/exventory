output "zone_id" {
  value = aws_route53_zone.main.zone_id
}

output "domain_name" {
  value = aws_route53_zone.main.name
}