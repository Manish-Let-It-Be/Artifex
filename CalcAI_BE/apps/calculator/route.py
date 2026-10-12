from fastapi import APIRouter
from fastapi.responses import JSONResponse
import base64
from io import BytesIO
from typing import Optional
from apps.calculator.utils import analyze_image, check_ollama_status
from schema import ImageData
from PIL import Image
from google.genai import errors

router = APIRouter()

@router.get('/ollama-status')
async def get_ollama_status(url: Optional[str] = "http://localhost:11434"):
    return check_ollama_status(url)

@router.post('')
async def run(data: ImageData):
    image_data = base64.b64decode(data.image.split(",")[1])
    image_bytes = BytesIO(image_data)
    image = Image.open(image_bytes)
    try:
        responses = analyze_image(
            image,
            dict_of_vars=data.dict_of_vars,
            provider=data.provider or "gemini",
            model_id=data.model_id or "gemini-3.5-flash-lite",
            api_key=data.api_key,
            base_url=data.base_url
        )
    except errors.ClientError as e:
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            return JSONResponse(
                status_code=429,
                content={"message": "Gemini API quota exceeded. Please switch to Ollama Local model or provide your own API key in Model Settings.", "status": "error"}
            )
        return JSONResponse(status_code=400, content={"message": f"Gemini API Error: {str(e)}", "status": "error"})
    except errors.ServerError:
        return JSONResponse(status_code=503, content={"message": "AI model is temporarily unavailable. Please try again in a moment.", "status": "error"})
    except RuntimeError as e:
        return JSONResponse(status_code=400, content={"message": str(e), "status": "error"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Processing error: {str(e)}", "status": "error"})

    data = [response for response in responses]
    print('response in route: ', data)
    return {"message": "Image processed", "data": data, "status": "success"}
