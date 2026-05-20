output "alb_arn" {
  value = aws_lb.main.arn
}

output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "alb_zone_id" {
  value = aws_lb.main.zone_id
}

output "alb_arn_suffix" {
  value = aws_lb.main.arn_suffix
}

output "ecs_target_group_arn" {
  value = aws_lb_target_group.ecs_api.arn
}

output "ecs_target_group_arn_suffix" {
  value = aws_lb_target_group.ecs_api.arn_suffix
}