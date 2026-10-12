from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import base64
from io import BytesIO
from PIL import Image
from apps.ask.utils import ask_ai

router = APIRouter()

class Message(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class AskData(BaseModel):
    question: str
    image: Optional[str] = None
    history: Optional[List[Message]] = []
    provider: Optional[str] = "gemini"
    model_id: Optional[str] = "gemini-3.5-flash-lite"
    api_key: Optional[str] = None
    base_url: Optional[str] = None

@router.post('')
async def ask(data: AskData):
    try:
        img = None
        if data.image:
            image_data = base64.b64decode(data.image.split(",")[1])
            img = Image.open(BytesIO(image_data))

        result = ask_ai(
            question=data.question,
            img=img,
            history=[(m.role, m.content) for m in (data.history or [])],
            provider=data.provider or "gemini",
            model_id=data.model_id or "gemini-3.5-flash-lite",
            api_key=data.api_key,
            base_url=data.base_url
        )
        return {"answer": result, "status": "success"}
    except Exception as e:
        print(f"Ask route error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
