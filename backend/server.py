from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
from typing import Optional
import uuid

# Load environment variables
load_dotenv(override=True)

app = FastAPI()

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
client = OpenAI()


# Load personality details
def load_context():
    with open("assetiq.txt", "r", encoding="utf-8") as f:
        return f.read().strip()


CONTEXT = load_context()


# Request/Response models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str


@app.get("/api/")
async def root():
    return {"message": "AI research companion inside the FinMatrix platform"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())

        # Create system message with CONTEXT
        # NOTE: No memory - each request is independent!
        messages = [
            {"role": "system", "content": CONTEXT},
            {"role": "user", "content": request.message},
        ]

        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o-mini", 
            messages=messages
        )

        return ChatResponse(
            response=response.choices[0].message.content, 
            session_id=session_id
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)