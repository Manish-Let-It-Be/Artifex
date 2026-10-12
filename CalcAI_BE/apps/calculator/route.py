from fastapi import APIRouter
from fastapi.responses import JSONResponse
import base64
from io import BytesIO
from apps.calculator.utils import analyze_image
from schema import ImageData
from PIL import Image
from google.genai import errors

router = APIRouter()

@router.post('')
async def run(data: ImageData):
    image_data = base64.b64decode(data.image.split(",")[1])
    image_bytes = BytesIO(image_data)
    image = Image.open(image_bytes)
    try:
        responses = analyze_image(image, dict_of_vars=data.dict_of_vars)
    except errors.ClientError as e:
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            return JSONResponse(status_code=429, content={"message": "API quota exceeded. Please try again later.", "status": "error"})
        return JSONResponse(status_code=400, content={"message": f"Gemini API Error: {str(e)}", "status": "error"})
    except errors.ServerError:
        return JSONResponse(status_code=503, content={"message": "AI model is temporarily unavailable. Please try again in a moment.", "status": "error"})
    data = [response for response in responses]
    print('response in route: ', data)
    return {"message": "Image processed", "data": data, "status": "success"}
