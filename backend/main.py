import os
from typing import List, Literal
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from dotenv import load_dotenv
from groq import Groq

# .env file load karo
load_dotenv()

# API key environment se uthao
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

# Agar key nahi hai to error throw karo
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in .env file")

# Groq client banao
client = Groq(api_key=GROQ_API_KEY)
MODEL_NAME = "llama-3.3-70b-versatile"

# System prompt (AI ki personality)
SYSTEM_PROMPT = """You are a helpful, friendly AI assistant. 
Reply concisely and clearly. 
You can converse in English, Urdu, or Hinglish based on user's language."""

# FastAPI app
app = FastAPI(title="AI Chatbot API")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Single message structure
class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=5000)


# Chat request: array of messages
class ChatRequest(BaseModel):
    messages: List[Message] = Field(..., min_length=1, max_length=50)

    @field_validator("messages")
    @classmethod
    def validate_messages(cls, v):
        if not v:
            raise ValueError("Messages cannot be empty")
        # Last message user ki honi chahiye
        if v[-1].role != "user":
            raise ValueError("Last message must be from user")
        return v


# Title generation request
class TitleRequest(BaseModel):
    first_message: str = Field(..., min_length=1, max_length=2000)


# Root endpoint
@app.get("/")
def root():
    return {"status": "ok", "service": "AI Chatbot API"}


# Health check
@app.get("/api/health")
def health():
    return {"status": "healthy"}


# Main chat endpoint (context-aware)
@app.post("/api/chat")
def chat(payload: ChatRequest):
    try:
        # System prompt + user messages combine karo
        full_messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # User ki saari messages add karo
        for msg in payload.messages:
            full_messages.append({"role": msg.role, "content": msg.content})

        # Groq ko poori conversation bhejo
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=full_messages,
            temperature=0.7,
            max_tokens=1024,
        )

        reply = completion.choices[0].message.content

        return {
            "bot_reply": reply,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


# Auto-generate chat title from first message
@app.post("/api/generate-title")
def generate_title(payload: TitleRequest):
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",  # Smaller, faster model for titles
            messages=[
                {
                    "role": "system",
                    "content": "Generate a very short title (max 5 words) for a chat that starts with the user's message. Reply with ONLY the title, no quotes, no punctuation at the end. Be concise.",
                },
                {"role": "user", "content": payload.first_message},
            ],
            temperature=0.5,
            max_tokens=20,
        )

        title = completion.choices[0].message.content.strip()
        # Clean up title (remove quotes, periods at end)
        title = title.strip("\"'.,!?").strip()
        # Truncate if too long
        if len(title) > 40:
            title = title[:37] + "..."

        return {"title": title}

    except Exception as e:
        # Fallback: use first 30 chars of message
        fallback = payload.first_message[:30] + (
            "..." if len(payload.first_message) > 30 else ""
        )
        return {"title": fallback}


# Local development run karne ke liye
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
