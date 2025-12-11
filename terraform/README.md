# AssetIQ Terraform Infrastructure

This Terraform configuration deploys the AssetIQ application on AWS using ECS Fargate with an Application Load Balancer.

## Architecture Overview

```
Internet → ALB → ECS Fargate Services (Frontend + Backend) → ECR
                      ↓
                  CloudWatch Logs
```

### Components

- **VPC**: Custom VPC with public and private subnets across 2 availability zones
- **ECR**: Container registries for backend and frontend images
- **ECS Cluster**: Fargate cluster running containerized services
- **Application Load Balancer**: Routes traffic to frontend and backend services
- **CloudWatch**: Log groups for application monitoring
- **Security Groups**: Network access control for ALB and ECS tasks

## Prerequisites

1. **AWS CLI** configured with credentials
   ```bash
   aws configure
   ```

2. **Terraform** installed (>= 1.2.0)
   ```bash
   terraform --version
   ```

3. **Remote Backend Setup** (recommended for team collaboration)
   ```bash
   cd terraform
   ./setup-backend.sh
   ```
   
   This creates:
   - S3 bucket for state storage with encryption and versioning
   - DynamoDB table for state locking
   
   📖 **See [BACKEND.md](./BACKEND.md) for detailed backend setup guide**

4. **Docker images** pushed to ECR repositories
   - Backend: `test/assetiq-backend`
   - Frontend: `test/assetiq-frontend`

## Configuration

### Environment Variables

Set these before running Terraform:

```bash
export AWS_REGION=$TF_VAR_AWS_REGION
export AWS_ACCOUNT_ID=$TF_VAR_AWS_ACCOUNT_ID
```

### Multi-Environment Support

This configuration supports multiple environments (test and prod) using Terraform workspaces. Each environment has its own:
- State file (isolated infrastructure)
- Resource sizing (test uses smaller instances)
- ECR repositories (separate image storage)
- Resource naming (environment prefix)

**Quick Start:**
```bash
# Create and switch to test workspace
terraform workspace new test
terraform apply -var-file="test.tfvars"

# Create and switch to prod workspace
terraform workspace new prod
terraform apply -var-file="prod.tfvars"
```

📖 **See [WORKSPACES.md](./WORKSPACES.md) for complete workspace management guide**

### Environment-Specific Variables

#### Test Environment (`test.tfvars`)
```hcl
environment          = "test"
backend_repo_name    = "test/assetiq-backend"
frontend_repo_name   = "test/assetiq-frontend"
backend_cpu          = "256"
backend_memory       = "512"
desired_count_backend  = 1
```

#### Production Environment (`prod.tfvars`)
```hcl
environment          = "prod"
backend_repo_name    = "prod/assetiq-backend"
frontend_repo_name   = "prod/assetiq-frontend"
backend_cpu          = "512"
backend_memory       = "1024"
desired_count_backend  = 2
```


## Deployment Steps

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

This downloads the AWS provider and initializes the backend.

**If migrating from local state:**
```bash
terraform init -migrate-state
```

This will migrate your existing local state to the S3 backend.

### 2. Create and Select Workspace

```bash
# For test environment
terraform workspace new test

# For production environment
terraform workspace new prod
```

### 3. Review the Plan

```bash
# For test environment
terraform plan -var-file="test.tfvars"

# For production environment
terraform plan -var-file="prod.tfvars"
```

Review the resources that will be created:
- 1 VPC
- 2 Public subnets + 2 Private subnets
- 1 Internet Gateway
- 2 ECR repositories
- 1 ECS Cluster
- 2 ECS Task Definitions
- 2 ECS Services
- 1 Application Load Balancer
- 2 Target Groups
- Security Groups
- IAM roles and policies
- CloudWatch Log Groups

### 4. Apply the Configuration

```bash
# For test environment
terraform apply -var-file="test.tfvars"

# For production environment
terraform apply -var-file="prod.tfvars"
```

Type `yes` when prompted to confirm.

**Deployment time**: ~5-10 minutes

### 5. Get Outputs

After successful deployment:

```bash
terraform output
```

You'll see:
- `alb_dns_name`: The URL to access your application
- `backend_service_name`: ECS backend service name
- `frontend_service_name`: ECS frontend service name
- `ecr_backend_repository_url`: Backend ECR repository URL
- `ecr_frontend_repository_url`: Frontend ECR repository URL
- `ecs_cluster_name`: ECS cluster name

## Accessing the Application

Once deployed, access your application at:

```
http://<alb_dns_name>
```

- **Frontend**: `http://<alb_dns_name>/`
- **Backend API**: `http://<alb_dns_name>/api/*`

## Infrastructure Details

### Networking

- **VPC CIDR**: `10.0.0.0/16`
- **Public Subnets**: `10.0.0.0/20`, `10.0.1.0/20`
- **Private Subnets**: `10.0.8.0/20`, `10.0.9.0/20`

### ECS Services

#### Backend Service
- **CPU**: 512 (0.5 vCPU)
- **Memory**: 1024 MB
- **Port**: 8080
- **Health Check**: `/health`

#### Frontend Service
- **CPU**: 256 (0.25 vCPU)
- **Memory**: 512 MB
- **Port**: 80
- **Health Check**: `/`

### Load Balancer Routing

- **Default**: Routes to frontend (port 80)
- **Path `/api/*`**: Routes to backend (port 8080)

## Updating the Application

### Update Docker Images

1. Push new images to ECR with updated tags
2. Update variables:
   ```bash
   terraform apply -var="backend_image_tag=v1.2.3"
   ```

### Force New Deployment

To force ECS to pull new images:

```bash
aws ecs update-service \
  --cluster assetiq-cluster \
  --service assetiq-backend-svc \
  --force-new-deployment \
  --region ap-south-1
```

## Scaling

### Manual Scaling

Update desired count in `variables.tf`:

```hcl
desired_count_backend  = 2
desired_count_frontend = 2
```

Then apply:
```bash
terraform apply
```

### Auto Scaling (Future Enhancement)

Add auto-scaling policies based on CPU/memory utilization.

## Monitoring

### CloudWatch Logs

View logs in AWS Console:
- Backend: `/ecs/assetiq-backend`
- Frontend: `/ecs/assetiq-frontend`

Or via CLI:
```bash
aws logs tail /ecs/assetiq-backend --follow --region ap-south-1
```

### ECS Service Status

```bash
aws ecs describe-services \
  --cluster assetiq-cluster \
  --services assetiq-backend-svc assetiq-frontend-svc \
  --region ap-south-1
```

## Cost Estimation

Approximate monthly costs (us-east-1 pricing):

- **ECS Fargate**: ~$30-50/month (1 backend + 1 frontend)
- **Application Load Balancer**: ~$20/month
- **ECR Storage**: ~$1-5/month
- **Data Transfer**: Variable
- **CloudWatch Logs**: ~$1-5/month

**Total**: ~$50-80/month

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

Type `yes` when prompted.

**Note**: This will delete all resources including ECR repositories. Make sure to backup any important data.

## Troubleshooting

### Issue: ECS Tasks Not Starting

**Check**:
1. ECR images exist and are accessible
2. Task execution role has ECR permissions
3. Security groups allow traffic

**Debug**:
```bash
aws ecs describe-tasks \
  --cluster assetiq-cluster \
  --tasks <task-id> \
  --region ap-south-1
```

### Issue: ALB Health Checks Failing

**Check**:
1. Container is listening on correct port
2. Health check path exists
3. Security groups allow ALB → ECS traffic

**View Target Health**:
```bash
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn> \
  --region ap-south-1
```

### Issue: Cannot Access Application

**Check**:
1. ALB security group allows inbound HTTP (port 80)
2. DNS name is correct
3. Services are running

## Security Considerations

- ✅ ECS tasks run in private subnets (no direct internet access)
- ✅ Only ALB is publicly accessible
- ✅ Security groups restrict traffic flow
- ⚠️ Currently using HTTP (consider adding HTTPS/SSL)
- ⚠️ No WAF configured (consider adding for production)

## Next Steps

1. **Add HTTPS**: Configure ACM certificate and HTTPS listener
2. **Custom Domain**: Add Route53 DNS records
3. **Auto Scaling**: Implement ECS auto-scaling policies
4. **CI/CD**: Integrate with GitHub Actions for automated deployments
5. **Monitoring**: Set up CloudWatch alarms and dashboards
6. **Backup**: Implement backup strategy for stateful data

## File Structure

```
terraform/
├── backend.tf          # Remote backend configuration (S3 + DynamoDB)
├── main.tf             # Main infrastructure configuration
├── variables.tf        # Input variables
├── outputs.tf          # Output values
├── test.tfvars         # Test environment configuration
├── prod.tfvars         # Production environment configuration
├── setup-backend.sh    # Automated backend setup script
├── BACKEND.md          # Backend setup and management guide
├── WORKSPACES.md       # Workspace management guide
└── README.md           # This file
```


## Support

For issues or questions, refer to:
- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS Fargate Documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
