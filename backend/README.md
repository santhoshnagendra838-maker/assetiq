# AssetIQ Backend

AI-powered financial instrument comparison API built with FastAPI and OpenAI.

## Overview

The AssetIQ backend provides a chat endpoint that enables AI-powered analysis and comparison of financial instruments (mutual funds, ETFs, stocks). It uses OpenAI's GPT-4o-mini model to generate detailed comparisons with key metrics.

## Features

- 🤖 **AI-Powered Analysis**: Uses OpenAI GPT-4o-mini for intelligent instrument comparison
- 🔄 **CORS Enabled**: Configured for cross-origin requests from the frontend
- 📊 **Structured Responses**: Returns formatted markdown with tables for easy rendering
- 🔒 **Environment-based Configuration**: Secure API key management with `.env` files
- ⚡ **Fast API**: Built with FastAPI for high performance and automatic API documentation

## Tech Stack

- **FastAPI** - Modern, fast web framework for building APIs
- **OpenAI API** - GPT-4o-mini for AI-powered analysis
- **Uvicorn** - ASGI server for running the application
- **Python-dotenv** - Environment variable management
- **Pydantic** - Data validation using Python type annotations

## Prerequisites

- Python 3.13 or higher
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- UV package manager (recommended) or pip

## Setup Instructions

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Create Environment File

Create a `.env` file in the `backend` directory:

```bash
touch .env
```

Add the following environment variables:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# CORS Configuration (optional, defaults to http://localhost:3000)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

> **Important**: Replace `your_openai_api_key_here` with your actual OpenAI API key.

### 3. Install Dependencies

#### Option A: Using UV (Recommended)

```bash
# Install UV if you haven't already
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -r requirements.txt
```

#### Option B: Using pip

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Run the Server

#### Development Mode (with auto-reload)

```bash
uv run uvicorn server:app --reload
```

Or with standard Python:

```bash
uvicorn server:app --reload
```

#### Production Mode

```bash
python server.py
```

The server will start on `http://localhost:8000`

## API Endpoints

### Health Check

```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy"
}
```

### Root

```bash
GET /
```

**Response:**
```json
{
  "message": "AI research companion inside the FinMatrix platform"
}
```

### Chat (Instrument Comparison)

```bash
POST /chat
```

**Request Body:**
```json
{
  "message": "Compare HDFC Bank and ICICI Bank on key metrics",
  "session_id": "optional-session-id"
}
```

**Response:**
```json
{
  "response": "Here's a comparison of HDFC Bank and ICICI Bank...",
  "session_id": "session-id-here"
}
```

## Example Usage

### Using cURL

```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-123",
    "message": "Compare HDFC Bank and ICICI Bank on key metrics"
  }'
```

### Using Python

```python
import requests

response = requests.post(
    "http://localhost:8000/chat",
    json={
        "message": "Compare NIFTY50 ETF and Gold ETF on key metrics",
        "session_id": "my-session"
    }
)

print(response.json())
```

## Project Structure

```
backend/
├── server.py           # Main FastAPI application
├── assetiq.txt         # AI context/personality configuration
├── pyproject.toml      # Project metadata and dependencies (UV)
├── requirements.txt    # Python dependencies (pip)
├── .env               # Environment variables (create this)
└── README.md          # This file
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | - | ✅ Yes |
| `CORS_ORIGINS` | Comma-separated list of allowed origins | `http://localhost:3000` | ❌ No |

### AI Context

The AI's behavior and knowledge base is defined in `assetiq.txt`. This file contains:
- System instructions for the AI
- Financial domain knowledge
- Response formatting guidelines

## API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Development

### Running Tests

```bash
# Add tests here when available
pytest
```

### Code Formatting

```bash
# Using black
black server.py

# Using ruff
ruff format server.py
```

## Troubleshooting

### Issue: "OpenAI API key not found"

**Solution**: Make sure you've created a `.env` file with your `OPENAI_API_KEY`.

### Issue: "CORS error from frontend"

**Solution**: Check that your frontend URL is included in the `CORS_ORIGINS` environment variable.

### Issue: "Module not found"

**Solution**: Ensure you've activated the virtual environment and installed all dependencies:
```bash
source .venv/bin/activate
uv pip install -r requirements.txt
```

## Notes

- The current implementation does **not** maintain conversation history between requests
- Each chat request is independent and stateless
- Session IDs are generated but not currently used for memory

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]
