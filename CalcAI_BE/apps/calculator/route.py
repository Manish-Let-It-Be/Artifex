from fastapi import APIRouter, HTTPException
import base64
from io import BytesIO
from apps.calculator.utils import analyze_image
from schema import ImageData
from PIL import Image

router = APIRouter()

@router.post('')
async def run(data: ImageData):
    try:
        image_data = base64.b64decode(data.image.split(",")[1])
        image = Image.open(BytesIO(image_data))
        responses = analyze_image(
            image,
            dict_of_vars=data.dict_of_vars,
            model_id=data.model_id or "gemini-2.0-flash",
            api_key=data.api_key
        )
        print('response in route:', responses)
        return {"message": "Image processed", "data": responses, "status": "success"}
    except Exception as e:
        print(f"Route error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
