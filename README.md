# AssetIQ

> AI-powered financial instrument comparison platform

AssetIQ is a full-stack web application that enables users to compare financial instruments (mutual funds, ETFs, and stocks) using AI-powered analysis. The platform provides detailed comparisons with key metrics, presented in beautifully formatted tables.

## 🌟 Features

- **AI-Powered Analysis**: Leverages OpenAI's GPT-4o-mini for intelligent instrument comparison
- **Interactive UI**: Modern, responsive interface built with Next.js and React
- **Real-time Comparisons**: Instant analysis of financial instruments across multiple categories
- **Formatted Results**: Markdown tables with proper styling for easy readability
- **Category Selection**: Compare instruments across Mutual Funds, ETFs, and Stocks
- **Loading States**: Smooth user experience with loading indicators and animations

## 🏗️ Architecture

AssetIQ is built as a monorepo with two main components:

### Frontend (`/frontend`)
- **Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS v4 with custom UI components
- **Features**:
  - Custom-built UI components (Card, Button, Select)
  - Markdown rendering with table support (react-markdown + remark-gfm)
  - Framer Motion animations
  - TypeScript for type safety
  - Responsive design

### Backend (`/backend`)
- **Framework**: FastAPI (Python)
- **AI Integration**: OpenAI API (GPT-4o-mini)
- **Features**:
  - RESTful API with `/api/chat` endpoint
  - CORS-enabled for cross-origin requests
  - Environment-based configuration
  - Automatic API documentation (Swagger/ReDoc)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.13+
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/assetiq.git
cd assetiq
```

### 2. Environment Setup

AssetIQ uses a centralized configuration managed by a root `.env` file.

```bash
# Copy example configuration to .env
cp env.example .env

# Edit .env and add your secrets (AWS keys, OpenAI Key, etc.)
# vim .env

# Load environment variables into your shell
source ./export_env.sh
```

### 3. Backend Setup

```bash
cd backend

# Create .env file
echo "OPENAI_API_KEY=your_api_key_here" > .env

# Install dependencies (using UV)
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt

# Start the server
uv run uvicorn server:app --reload
```

The backend will be available at `http://localhost:8000`

📖 **Detailed backend setup**: See [backend/README.md](./backend/README.md)

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

📖 **Detailed frontend setup**: See [frontend/README.md](./frontend/README.md)

## 📱 Usage

1. **Open the application** at http://localhost:3000
2. **Select a category** (Mutual Fund, ETF, or Stocks)
3. **Choose two instruments** to compare from the dropdowns
4. **Click "Compare"** to get AI-powered analysis
5. **View the results** in a beautifully formatted table with key metrics

## 🛠️ Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion
- react-markdown + remark-gfm

### Backend
- FastAPI
- OpenAI API
- Python 3.13+
- Uvicorn
- Pydantic

## 📁 Project Structure

```
assetiq/
├── frontend/              # Next.js frontend application
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   │   ├── assetiq.tsx  # Main comparison UI
│   │   └── ui/          # Reusable UI components
│   ├── lib/             # Utility functions
│   └── package.json     # Frontend dependencies
│
├── backend/              # FastAPI backend application
│   ├── server.py        # Main API server
│   ├── assetiq.txt      # AI context configuration
│   ├── pyproject.toml   # Python project config
│   └── requirements.txt # Python dependencies
│
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Frontend Environment Variables

The frontend automatically connects to `http://localhost:8000` for the backend API.

## 📡 API Endpoints

### `POST /chat`
Compare financial instruments using AI.

**Request:**
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
  "session_id": "session-id"
}
```

See [backend/README.md](./backend/README.md) for complete API documentation.

## 🧪 Development

### Running Tests

```bash
# Frontend
cd frontend
npm test

# Backend
cd backend
pytest
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
python server.py
```

## 📸 Screenshots

*Add screenshots of your application here*

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

[Add your license here]

## 👥 Authors

[Add author information here]

## 🙏 Acknowledgments

- OpenAI for the GPT-4o-mini API
- Next.js team for the amazing framework
- FastAPI for the high-performance backend framework

---

**Built with ❤️ for better financial decision-making**
