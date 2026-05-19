resource "aws_acm_certificate" "main" {
  domain_name = "exventory.com"

  subject_alternative_names = [
    "*.exventory.com"
  ]

  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "exventory.com"
  }
}