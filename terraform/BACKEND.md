# Terraform Remote Backend Setup

This guide explains how to set up S3 remote backend with DynamoDB state locking for the AssetIQ Terraform configuration.

## Prerequisites

- AWS CLI configured with appropriate credentials
- Permissions to create S3 buckets and DynamoDB tables

## Quick Setup

Run the setup script to create the backend infrastructure:

```bash
cd terraform
./setup-backend.sh
```

This will create:
- S3 bucket for state storage
- DynamoDB table for state locking
- Configure backend in Terraform

## Manual Setup

### 1. Create S3 Bucket

```bash
# Set variables
AWS_REGION=$TF_VAR_AWS_REGION
AWS_ACCOUNT_ID=$TF_VAR_AWS_ACCOUNT_ID
BUCKET_NAME="assetiq-terraform-state-${AWS_ACCOUNT_ID}"

# Create bucket
aws s3api create-bucket \
  --bucket $BUCKET_NAME \
  --region $AWS_REGION \
  --create-bucket-configuration LocationConstraint=$AWS_REGION

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket $BUCKET_NAME \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket $BUCKET_NAME \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### 2. Create DynamoDB Table

```bash
aws dynamodb create-table \
  --table-name assetiq-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $AWS_REGION
```

### 3. Update Terraform Configuration

The `backend.tf` file has been created with the backend configuration. Initialize Terraform to migrate state:

```bash
terraform init -migrate-state
```

## Backend Configuration

The backend is configured in `backend.tf`:

```hcl
terraform {
  backend "s3" {
    bucket         = "assetiq-terraform-state-<AWS_ACCOUNT_ID>"
    key            = "assetiq/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "assetiq-terraform-locks"
  }
}
```

## Workspace State Keys

Each workspace stores its state at a different S3 key:

- **Default**: `assetiq/terraform.tfstate`
- **Test**: `assetiq/env:/test/terraform.tfstate`
- **Prod**: `assetiq/env:/prod/terraform.tfstate`

## State Locking

DynamoDB provides state locking to prevent concurrent modifications:

- Lock is automatically acquired when running `terraform apply` or `terraform plan`
- Lock is released when operation completes
- If lock is held, other operations will wait or fail

### Force Unlock (Emergency Only)

If a lock gets stuck:

```bash
terraform force-unlock <LOCK_ID>
```

**Warning**: Only use this if you're certain no other operation is running!

## Migrating Existing State

If you already have local state files:

```bash
# Backup existing state
cp terraform.tfstate terraform.tfstate.backup
cp -r terraform.tfstate.d terraform.tfstate.d.backup

# Initialize with backend
terraform init -migrate-state

# Verify migration
terraform state list
```

## Benefits

### 1. **Team Collaboration**
- Shared state accessible to all team members
- No need to manually sync state files

### 2. **State Locking**
- Prevents concurrent modifications
- Avoids state corruption

### 3. **State History**
- S3 versioning keeps history of all state changes
- Easy to rollback if needed

### 4. **Security**
- State encrypted at rest (AES256)
- Access controlled via IAM policies
- No public access

### 5. **Reliability**
- S3 provides 99.999999999% durability
- Automatic backups via versioning

## Accessing State History

View previous state versions:

```bash
# List all versions
aws s3api list-object-versions \
  --bucket assetiq-terraform-state-<AWS_ACCOUNT_ID> \
  --prefix assetiq/

# Download specific version
aws s3api get-object \
  --bucket assetiq-terraform-state-<AWS_ACCOUNT_ID> \
  --key assetiq/env:/prod/terraform.tfstate \
  --version-id <VERSION_ID> \
  old-state.tfstate
```

## Cleanup

To remove the backend infrastructure:

```bash
# Delete DynamoDB table
aws dynamodb delete-table \
  --table-name assetiq-terraform-locks \
  --region ap-south-1

# Delete all object versions
aws s3api delete-objects \
  --bucket assetiq-terraform-state-<AWS_ACCOUNT_ID> \
  --delete "$(aws s3api list-object-versions \
    --bucket assetiq-terraform-state-<AWS_ACCOUNT_ID> \
    --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' \
    --output json)"

# Delete bucket
aws s3 rb s3://assetiq-terraform-state-<AWS_ACCOUNT_ID> --force
```

## Troubleshooting

### Issue: Backend Configuration Changed

**Error**: `Backend configuration changed`

**Solution**:
```bash
terraform init -reconfigure
```

### Issue: State Lock Timeout

**Error**: `Error acquiring the state lock`

**Check who has the lock**:
```bash
aws dynamodb get-item \
  --table-name assetiq-terraform-locks \
  --key '{"LockID":{"S":"assetiq-terraform-state-<AWS_ACCOUNT_ID>/assetiq/env:/prod/terraform.tfstate-md5"}}'
```

### Issue: Access Denied

**Check IAM permissions**:
- S3: `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`
- DynamoDB: `dynamodb:GetItem`, `dynamodb:PutItem`, `dynamodb:DeleteItem`

## Best Practices

1. **Use separate buckets per environment** (optional)
2. **Enable MFA delete** for production state bucket
3. **Set up lifecycle policies** to manage old versions
4. **Monitor DynamoDB usage** (should be minimal cost)
5. **Restrict IAM access** to state bucket
6. **Enable CloudTrail** for audit logging

## Cost Estimation

- **S3 Storage**: ~$0.023/GB/month (state files are typically < 1 MB)
- **S3 Requests**: Minimal (only during terraform operations)
- **DynamoDB**: Pay-per-request, ~$0.000001 per request
- **Total**: < $1/month for typical usage

## Security Considerations

### Recommended IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::assetiq-terraform-state-<AWS_ACCOUNT_ID>/assetiq/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::assetiq-terraform-state-<AWS_ACCOUNT_ID>"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:ap-south-1:<AWS_ACCOUNT_ID>:table/assetiq-terraform-locks"
    }
  ]
}
```
