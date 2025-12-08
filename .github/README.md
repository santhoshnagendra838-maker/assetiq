# Docker Build and Push Workflow

This workflow automatically builds and pushes Docker images for the backend and frontend. The workflow currently supports pushing to **AWS Elastic Container Registry (ECR)**, but can also be configured to push to **GitHub Container Registry (ghcr.io)**.

## Triggers

The workflow runs on:
- **Push** to `main` or `docker_containers` branches when changes are made to:
  - `backend/**`
  - `frontend/**`
  - `docker-compose.yml`
  - The workflow file itself
- **Pull requests** to `main` branch with the same path filters
- **Manual trigger** via workflow_dispatch

## Jobs

### build-backend
Builds and pushes the backend Docker image

### build-frontend
Builds and pushes the frontend Docker image

## Features

- ✅ **Parallel builds** - Backend and frontend build simultaneously
- ✅ **GitHub Actions cache** - Speeds up builds using layer caching
- ✅ **PR safety** - Images are built but not pushed for pull requests
- ✅ **Path filtering** - Only triggers when relevant files change

---

## Option 1: AWS ECR Setup (Current Configuration)

The workflow is currently configured to push to AWS ECR using GitHub OIDC federation for secure authentication.

### Image Tags

Images are tagged with:
- Git commit SHA (first 7 characters) - e.g., `abc1234`
- `latest` tag for the most recent build

Example: `<account-id>.dkr.ecr.us-east-1.amazonaws.com/assetiq-backend:abc1234`

### Prerequisites
- AWS Account with appropriate permissions
- GitHub repository with Actions enabled
- AWS CLI installed locally (for setup)

### Step 1: Create GitHub OIDC Provider in AWS

First, create an OIDC identity provider in AWS IAM to trust GitHub Actions:

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### Step 2: Create IAM Role with Trust Policy

Create a trust policy file (`trust-policy.json`) that allows GitHub Actions to assume the role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_ORG/YOUR_REPO:*"
        }
      }
    }
  ]
}
```

**Note:** Replace `${AWS_ACCOUNT_ID}` with your AWS account ID and update the repository path in the `sub` field.

Create the IAM role:

```bash
aws iam create-role \
  --role-name github_oidc_role \
  --assume-role-policy-document file://trust-policy.json
```

### Step 3: Attach ECR Permissions to the Role

Attach the Amazon ECR Full Access policy to allow pushing images:

```bash
aws iam attach-role-policy \
  --role-name github_oidc_role \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess
```

### Step 4: Create ECR Repositories

Create two ECR repositories for backend and frontend:

```bash
# Create backend repository
aws ecr create-repository \
  --repository-name assetiq-backend \
  --region us-east-1

# Create frontend repository
aws ecr create-repository \
  --repository-name assetiq-frontend \
  --region us-east-1
```

### Step 5: Configure GitHub Secrets

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `AWS_ACCESS_KEY_ID` - Your AWS IAM user access key ID
- `AWS_SECRET_ACCESS_KEY` - Your AWS IAM user secret access key

**Alternative (OIDC - Recommended):** If using OIDC authentication, you can skip adding AWS credentials and instead configure the workflow to use the IAM role ARN.

### Step 6: Update Workflow Configuration

The workflow is already configured for ECR. Verify these environment variables in `.github/workflows/docker-build-push.yml`:

```yaml
env:
  AWS_REGION: us-east-1  # Change to your AWS region
  ECR_BACKEND_REPOSITORY: assetiq-backend
  ECR_FRONTEND_REPOSITORY: assetiq-frontend
```

### Pulling Images from ECR

```bash
# Login to AWS ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Pull backend image
docker pull <account-id>.dkr.ecr.us-east-1.amazonaws.com/assetiq-backend:latest

# Pull frontend image
docker pull <account-id>.dkr.ecr.us-east-1.amazonaws.com/assetiq-frontend:latest
```

### Using ECR Images in Production

```yaml
services:
  backend:
    image: <account-id>.dkr.ecr.us-east-1.amazonaws.com/assetiq-backend:latest
    # ... rest of config

  frontend:
    image: <account-id>.dkr.ecr.us-east-1.amazonaws.com/assetiq-frontend:latest
    # ... rest of config
```

---

## Option 2: GitHub Container Registry Setup

If you prefer to use GitHub Packages instead of AWS ECR, follow these instructions to modify the workflow.

### Image Tags

Images are tagged with:
- Branch name (e.g., `main`, `docker_containers`)
- PR number (for pull requests)
- Git SHA with branch prefix (e.g., `main-abc1234`)
- `latest` tag (only for default branch)
- Semantic version tags (if using semver)

Example: `ghcr.io/<owner>/assetiq/backend:latest`

### Required Workflow Changes

Replace the authentication and push steps in `.github/workflows/docker-build-push.yml`:

```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-backend:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata for Backend
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Backend image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Permissions

The workflow requires:
- `contents: read` - To checkout the repository
- `packages: write` - To push images to GitHub Container Registry

### Pulling Images from GitHub Packages

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull backend image
docker pull ghcr.io/<owner>/assetiq/backend:latest

# Pull frontend image
docker pull ghcr.io/<owner>/assetiq/frontend:latest
```

### Using GitHub Packages Images in Production

```yaml
services:
  backend:
    image: ghcr.io/<owner>/assetiq/backend:latest
    # ... rest of config

  frontend:
    image: ghcr.io/<owner>/assetiq/frontend:latest
    # ... rest of config
```

### Making Images Public/Private

- By default, images pushed to GitHub Packages are private
- To make them public: Go to the package page → Package settings → Change visibility

---

## Troubleshooting

### AWS ECR Issues

1. **Authentication Failed**
   - Verify AWS credentials are correctly set in GitHub Secrets
   - Check that the IAM role has the correct permissions
   - Ensure the OIDC provider is properly configured

2. **Repository Not Found**
   - Verify ECR repositories exist in the correct region
   - Check repository names match the workflow configuration

3. **Permission Denied**
   - Ensure the IAM role has `AmazonEC2ContainerRegistryFullAccess` policy attached
   - Verify the trust policy allows your GitHub repository

### GitHub Packages Issues

1. **Authentication Failed**
   - Ensure `GITHUB_TOKEN` has `packages: write` permission
   - Verify the workflow has correct permissions set

2. **Package Not Found**
   - Check that the image was successfully pushed
   - Verify the package name matches your repository structure

## Security Best Practices

### For AWS ECR
- ✅ Use OIDC federation instead of long-lived AWS credentials when possible
- ✅ Limit IAM role permissions to only what's needed (principle of least privilege)
- ✅ Use specific repository conditions in the trust policy
- ✅ Enable ECR image scanning for vulnerability detection
- ✅ Implement lifecycle policies to manage image retention

### For GitHub Packages
- ✅ Use the built-in `GITHUB_TOKEN` (automatically rotated)
- ✅ Set appropriate package visibility (public/private)
- ✅ Use GitHub's vulnerability scanning
- ✅ Implement proper access controls for private packages

## Notes

- **ECR**: Images are private by default, stored in your AWS account
- **GitHub Packages**: Images are private by default, stored with your repository
- Build cache is stored in GitHub Actions cache to speed up subsequent builds
- The workflow uses Docker Buildx for improved build performance
- Images are only pushed on successful builds to `main` and `docker_containers` branches
