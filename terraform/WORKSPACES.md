# Terraform Workspaces Guide

This guide explains how to use Terraform workspaces to manage multiple environments (test and prod) for the AssetIQ infrastructure.

## What are Terraform Workspaces?

Workspaces allow you to manage multiple distinct sets of infrastructure resources using the same Terraform configuration. Each workspace has its own state file, keeping environments completely isolated.

## Available Environments

- **test**: Development/testing environment with smaller resources
- **prod**: Production environment with production-grade resources and high availability

## Quick Start

### 1. Initialize Terraform

```bash
cd terraform
terraform init
```

### 2. Create Workspaces

```bash
# Create test workspace
terraform workspace new test

# Create prod workspace
terraform workspace new prod
```

### 3. List Workspaces

```bash
terraform workspace list
```

Output:
```
  default
* prod
  test
```

The `*` indicates the currently selected workspace.

### 4. Switch Between Workspaces

```bash
# Switch to test
terraform workspace select test

# Switch to prod
terraform workspace select prod
```

## Deploying Environments

### Deploy Test Environment

```bash
# Switch to test workspace
terraform workspace select test

# Review the plan
terraform plan -var-file="test.tfvars"

# Apply the configuration
terraform apply -var-file="test.tfvars"
```

**Test Environment Specifications:**
- Backend: 256 CPU, 512 MB memory, 1 instance
- Frontend: 256 CPU, 512 MB memory, 1 instance
- ECR repos: `test/assetiq-backend`, `test/assetiq-frontend`
- Resource names: `assetiq-test-*`

### Deploy Production Environment

```bash
# Switch to prod workspace
terraform workspace select prod

# Review the plan
terraform plan -var-file="prod.tfvars"

# Apply the configuration
terraform apply -var-file="prod.tfvars"
```

**Production Environment Specifications:**
- Backend: 512 CPU, 1024 MB memory, 2 instances
- Frontend: 512 CPU, 1024 MB memory, 2 instances
- ECR repos: `prod/assetiq-backend`, `prod/assetiq-frontend`
- Resource names: `assetiq-prod-*`

## Workspace State Files

### With Remote Backend (S3)

When using the S3 remote backend (recommended), each workspace stores its state in S3:

```
S3 Bucket: assetiq-terraform-state-696637901688
├── assetiq/terraform.tfstate                    # Default workspace
├── assetiq/env:/test/terraform.tfstate          # Test workspace
└── assetiq/env:/prod/terraform.tfstate          # Prod workspace
```

State is automatically synchronized and locked via DynamoDB.

📖 **See [BACKEND.md](./BACKEND.md) for remote backend setup**

### With Local State (Legacy)

If not using remote backend, local state files are stored in:

```
terraform.tfstate.d/
├── test/
│   └── terraform.tfstate
└── prod/
    └── terraform.tfstate
```

**Important**: Never manually edit or delete these files!

## Common Workflows

### Check Current Workspace

```bash
terraform workspace show
```

### View Resources in Current Workspace

```bash
terraform state list
```

### Get Outputs for Current Environment

```bash
terraform output
```

### Update an Environment

```bash
# Switch to the environment
terraform workspace select test

# Make changes to test.tfvars or code

# Apply changes
terraform apply -var-file="test.tfvars"
```

### Destroy an Environment

```bash
# Switch to the environment
terraform workspace select test

# Destroy all resources
terraform destroy -var-file="test.tfvars"
```

**Warning**: This will delete ALL resources in that environment!

## Environment-Specific Configurations

### test.tfvars

```hcl
environment          = "test"
backend_repo_name    = "test/assetiq-backend"
frontend_repo_name   = "test/assetiq-frontend"
desired_count_backend  = 1
desired_count_frontend = 1
backend_cpu          = "256"
backend_memory       = "512"
frontend_cpu         = "256"
frontend_memory      = "512"
```

### prod.tfvars

```hcl
environment          = "prod"
backend_repo_name    = "prod/assetiq-backend"
frontend_repo_name   = "prod/assetiq-frontend"
desired_count_backend  = 2
desired_count_frontend = 2
backend_cpu          = "512"
backend_memory       = "1024"
frontend_cpu         = "512"
frontend_memory      = "1024"
```

## Resource Naming Convention

All resources are automatically named with the environment prefix:

| Resource Type | Test Name | Prod Name |
|--------------|-----------|-----------|
| VPC | `assetiq-test-vpc` | `assetiq-prod-vpc` |
| ECS Cluster | `assetiq-test-cluster` | `assetiq-prod-cluster` |
| ALB | `assetiq-test-alb` | `assetiq-prod-alb` |
| Backend Service | `assetiq-test-backend-svc` | `assetiq-prod-backend-svc` |
| Frontend Service | `assetiq-test-frontend-svc` | `assetiq-prod-frontend-svc` |

## Best Practices

### 1. Always Specify the Correct tfvars File

```bash
# ✅ Correct
terraform apply -var-file="test.tfvars"

# ❌ Wrong - might use wrong configuration
terraform apply
```

### 2. Verify Workspace Before Applying

```bash
# Check current workspace
terraform workspace show

# If wrong, switch
terraform workspace select test
```

### 3. Use Separate ECR Repositories

Test and prod use different ECR repository paths to avoid accidentally deploying test images to production.

### 4. Tag Resources Appropriately

All resources are automatically tagged with:
- `Environment`: test or prod
- `Project`: assetiq
- `ManagedBy`: terraform

### 5. Review Plans Carefully

Always run `terraform plan` before `apply`, especially in production:

```bash
terraform plan -var-file="prod.tfvars" -out=prod.tfplan
# Review the plan carefully
terraform apply prod.tfplan
```

## Troubleshooting

### Issue: Wrong Environment Deployed

**Symptom**: Resources have wrong environment name

**Solution**:
1. Check current workspace: `terraform workspace show`
2. Verify you used correct tfvars file
3. If needed, destroy and redeploy with correct settings

### Issue: State Lock Error

**Symptom**: `Error acquiring the state lock`

**Cause**: Another terraform operation is running, or a previous operation didn't release the lock

**Solution**:

1. **Wait for other operations to complete** (if someone else is running terraform)

2. **Check DynamoDB for lock info** (if using remote backend):
   ```bash
   aws dynamodb get-item \
     --table-name assetiq-terraform-locks \
     --key '{"LockID":{"S":"assetiq-terraform-state-696637901688/assetiq/env:/prod/terraform.tfstate-md5"}}'
   ```

3. **Force unlock** (use with caution!):
   ```bash
   terraform force-unlock <LOCK_ID>
   ```

**Warning**: Only force unlock if you're certain no other operation is running!

### Issue: Workspace Already Exists

**Symptom**: `Workspace "test" already exists`

**Solution**:
```bash
# Just select the existing workspace
terraform workspace select test
```

### Issue: Cannot Delete Workspace

**Symptom**: `Workspace "test" is not empty`

**Solution**:
```bash
# First destroy all resources
terraform destroy -var-file="test.tfvars"

# Then delete the workspace
terraform workspace select default
terraform workspace delete test
```

## Migrating Between Environments

### Promote Test to Production

1. **Test thoroughly in test environment**
2. **Update prod.tfvars with desired image tags**
3. **Deploy to production**:
   ```bash
   terraform workspace select prod
   terraform apply -var-file="prod.tfvars"
   ```

### Blue-Green Deployment

For zero-downtime deployments:

1. Deploy new version to test
2. Verify functionality
3. Update prod image tags
4. Apply to production (ECS will perform rolling update)

## Advanced Usage

### Using Different AWS Regions

Modify the tfvars file:

```hcl
aws_region = "us-east-1"  # Change region
```

### Custom Resource Sizing

Override in tfvars:

```hcl
backend_cpu    = "1024"  # 1 vCPU
backend_memory = "2048"  # 2 GB
```

### Environment-Specific Variables

Add new variables to `variables.tf` and set them in environment-specific tfvars files.

## Cleanup

### Delete Test Environment

```bash
terraform workspace select test
terraform destroy -var-file="test.tfvars"
terraform workspace select default
terraform workspace delete test
```

### Delete Production Environment

```bash
terraform workspace select prod
terraform destroy -var-file="prod.tfvars"
terraform workspace select default
terraform workspace delete prod
```

## Summary Commands

```bash
# Setup
terraform init
terraform workspace new test
terraform workspace new prod

# Deploy test
terraform workspace select test
terraform apply -var-file="test.tfvars"

# Deploy prod
terraform workspace select prod
terraform apply -var-file="prod.tfvars"

# Check status
terraform workspace show
terraform state list
terraform output

# Cleanup
terraform destroy -var-file="<env>.tfvars"
```

## Next Steps

1. ✅ ~~Set up remote state backend (S3 + DynamoDB)~~ - **Complete!** See [BACKEND.md](./BACKEND.md)
2. Implement CI/CD pipeline for automated deployments
3. Add monitoring and alerting
4. Configure auto-scaling policies
5. Set up backup and disaster recovery
