# Docker Build and Push Workflow

This workflow automatically builds and pushes Docker images for the backend and frontend to GitHub Container Registry (ghcr.io).

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
Builds and pushes the backend Docker image to `ghcr.io/<owner>/assetiq/backend`

### build-frontend
Builds and pushes the frontend Docker image to `ghcr.io/<owner>/assetiq/frontend`

## Image Tags

Images are tagged with:
- Branch name (e.g., `main`, `docker_containers`)
- PR number (for pull requests)
- Git SHA with branch prefix (e.g., `main-abc1234`)
- `latest` tag (only for default branch)
- Semantic version tags (if using semver)

## Features

- ✅ **Parallel builds** - Backend and frontend build simultaneously
- ✅ **GitHub Actions cache** - Speeds up builds using layer caching
- ✅ **Automatic authentication** - Uses `GITHUB_TOKEN` for registry access
- ✅ **PR safety** - Images are built but not pushed for pull requests
- ✅ **Path filtering** - Only triggers when relevant files change

## Permissions

The workflow requires:
- `contents: read` - To checkout the repository
- `packages: write` - To push images to GitHub Container Registry

## Usage

### Pulling Images

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull backend image
docker pull ghcr.io/<owner>/assetiq/backend:latest

# Pull frontend image
docker pull ghcr.io/<owner>/assetiq/frontend:latest
```

### Using in Production

Update your `docker-compose.yml` to use the published images:

```yaml
services:
  backend:
    image: ghcr.io/<owner>/assetiq/backend:latest
    # ... rest of config

  frontend:
    image: ghcr.io/<owner>/assetiq/frontend:latest
    # ... rest of config
```

## Notes

- Images are public by default. To make them private, update repository settings.
- The `GITHUB_TOKEN` is automatically provided by GitHub Actions.
- Build cache is stored in GitHub Actions cache to speed up subsequent builds.
