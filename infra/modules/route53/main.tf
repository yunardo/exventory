resource "aws_route53_zone" "main" {
  name          = var.domain_name
  comment       = "Managed by Terraform"
  force_destroy = false
}

resource "aws_route53_record" "root" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = "dualstack.${var.alb_dns_name}"
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "wildcard" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "*.${var.domain_name}"
  type    = "A"

  alias {
    name                   = "dualstack.${var.alb_dns_name}"
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}