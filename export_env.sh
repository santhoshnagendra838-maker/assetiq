#!/bin/bash
# Load environment variables from .env file
if [ -f .env ]; then
  set -a
  [ -f .env ] && . .env
  set +a
  
  # Auto-map to Terraform variables
  export TF_VAR_AWS_REGION=${AWS_REGION:-${DEFAULT_AWS_REGION}}
  export TF_VAR_AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}
  export TF_VAR_AWS_EXTERNAL_ID=${AWS_EXTERNAL_ID}
  export TF_VAR_AWS_ROLE_ARN=${AWS_ROLE_ARN}
  export TF_VAR_NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
  export TF_VAR_CORS_ORIGINS=${CORS_ORIGINS}
  export TF_VAR_OPENAI_API_KEY=${OPENAI_API_KEY}

  echo "✅ Environment variables loaded and mapped for Terraform"
else
  echo "❌ .env file not found. Please copy env.example to .env and fill in the values."
fi
