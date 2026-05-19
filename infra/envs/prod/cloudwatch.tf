resource "aws_cloudwatch_log_group" "api" {
  name              = "/exventory/prod/api"
  retention_in_days = 7

  tags = {
    Name = "exventory-prod-api-logs"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_targets" {
  alarm_name          = "exventory-prod-alb-unhealthy-targets"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  datapoints_to_alarm = 1
  threshold           = 1
  period              = 60
  statistic           = "Maximum"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "UnHealthyHostCount"

  dimensions = {
    TargetGroup      = aws_lb_target_group.ecs_api.arn_suffix
    LoadBalancer     = aws_lb.main.arn_suffix
    AvailabilityZone = "us-east-1a"
  }

  alarm_actions = [
    "arn:aws:sns:us-east-1:316777659644:exventory-prod-alerts"
  ]

  treat_missing_data = "missing"
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "exventory-prod-alb-5xx-errors"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  datapoints_to_alarm = 1
  threshold           = 5
  period              = 300
  statistic           = "Sum"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_ELB_5XX_Count"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_actions = [
    "arn:aws:sns:us-east-1:316777659644:exventory-prod-alerts"
  ]

  treat_missing_data = "missing"
}

resource "aws_cloudwatch_metric_alarm" "rds_high_cpu" {
  alarm_name          = "exventory-prod-rds-high-cpu"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  datapoints_to_alarm = 1
  threshold           = 80
  period              = 300
  statistic           = "Average"
  namespace           = "AWS/RDS"
  metric_name         = "CPUUtilization"

  dimensions = {
    DBInstanceIdentifier = "saas-postgres-prod-1"
  }

  alarm_actions = [
    "arn:aws:sns:us-east-1:316777659644:exventory-prod-alerts"
  ]

  treat_missing_data = "missing"
}

resource "aws_cloudwatch_metric_alarm" "ecs_service_high_cpu" {
  alarm_name          = "exventory-prod-ecs-service-cpu-high"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  datapoints_to_alarm = 1
  threshold           = 80
  period              = 300
  statistic           = "Average"
  namespace           = "AWS/ECS"
  metric_name         = "CPUUtilization"

  dimensions = {
    ClusterName = "exventory-prod-cluster"
    ServiceName = "saas-api-service-9dxkhprv"
  }

  alarm_actions = [
    "arn:aws:sns:us-east-1:316777659644:exventory-prod-alerts"
  ]

  treat_missing_data = "missing"
}

resource "aws_cloudwatch_metric_alarm" "ecs_service_high_memory" {
  alarm_name          = "exventory-prod-ecs-service-memory-high"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  datapoints_to_alarm = 1
  threshold           = 80
  period              = 300
  statistic           = "Average"
  namespace           = "AWS/ECS"
  metric_name         = "MemoryUtilization"

  dimensions = {
    ClusterName = "exventory-prod-cluster"
    ServiceName = "saas-api-service-9dxkhprv"
  }

  alarm_actions = [
    "arn:aws:sns:us-east-1:316777659644:exventory-prod-alerts"
  ]

  treat_missing_data = "missing"
}