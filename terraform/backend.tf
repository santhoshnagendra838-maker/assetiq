terraform {
  backend "s3" {
    bucket         = "assetiq-terraform-state-696637901688"
    key            = "assetiq/terraform.tfstate"
    region         = "ap-south-1"
    encrypt        = true
    dynamodb_table = "assetiq-terraform-locks"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.2.0"
}

provider "aws" {
  region = var.AWS_REGION
}
