from pydantic import BaseModel
from typing import Optional

class ImageData(BaseModel):
    image: str
    dict_of_vars: dict
    model_id: Optional[str] = "gemini-2.0-flash"
    api_key: Optional[str] = None
