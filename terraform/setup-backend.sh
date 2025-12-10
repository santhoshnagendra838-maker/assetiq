#!/bin/bash
set -e

# Configuration
AWS_REGION="TF_VAR_AWS_REGION"
AWS_ACCOUNT_ID="TF_VAR_AWS_ACCOUNT_ID"
BUCKET_NAME="assetiq-terraform-state-${AWS_ACCOUNT_ID}"
DYNAMODB_TABLE="assetiq-terraform-locks"

echo "🚀 Setting up Terraform remote backend..."
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

echo "📦 Creating S3 bucket: $BUCKET_NAME"

# Create S3 bucket
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "✅ S3 bucket already exists"
else
    aws s3api create-bucket \
      --bucket "$BUCKET_NAME" \
      --region "$AWS_REGION" \
      --create-bucket-configuration LocationConstraint="$AWS_REGION"
    echo "✅ S3 bucket created"
fi

# Enable versioning
echo "🔄 Enabling versioning..."
aws s3api put-bucket-versioning \
  --bucket "$BUCKET_NAME" \
  --versioning-configuration Status=Enabled
echo "✅ Versioning enabled"

# Enable encryption
echo "🔒 Enabling encryption..."
aws s3api put-bucket-encryption \
  --bucket "$BUCKET_NAME" \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
echo "✅ Encryption enabled"

# Block public access
echo "🚫 Blocking public access..."
aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
echo "✅ Public access blocked"

# Create DynamoDB table
echo ""
echo "🗄️  Creating DynamoDB table: $DYNAMODB_TABLE"

if aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION" &>/dev/null; then
    echo "✅ DynamoDB table already exists"
else
    aws dynamodb create-table \
      --table-name "$DYNAMODB_TABLE" \
      --attribute-definitions AttributeName=LockID,AttributeType=S \
      --key-schema AttributeName=LockID,KeyType=HASH \
      --billing-mode PAY_PER_REQUEST \
      --region "$AWS_REGION" \
      --no-cli-pager
    
    echo "⏳ Waiting for table to be active..."
    aws dynamodb wait table-exists --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION"
    echo "✅ DynamoDB table created"
fi

echo ""
echo "✨ Backend infrastructure setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Review backend.tf configuration"
echo "2. Run: terraform init -migrate-state"
echo "3. Verify: terraform state list"
echo ""
echo "📚 For more information, see BACKEND.md"
