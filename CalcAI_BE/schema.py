from pydantic import BaseModel
from typing import Optional, Dict, Any

class ImageData(BaseModel):
    image: str
    dict_of_vars: dict
    provider: Optional[str] = "gemini"  # "gemini" | "ollama" | "openai" | "anthropic" | "custom"
    model_id: Optional[str] = "gemini-3.5-flash-lite"
    api_key: Optional[str] = None
    base_url: Optional[str] = None
