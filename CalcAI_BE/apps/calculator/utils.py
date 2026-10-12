import io
import base64
import ast
import json
import re
import time
import requests
from PIL import Image
from google import genai
from google.genai import types, errors
from constants import GEMINI_API_KEY

gemini_client = genai.Client(api_key=GEMINI_API_KEY)


def _pil_to_base64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def _gemini_call(model_id: str, api_key: str, prompt: str, img: Image.Image) -> str:
    client = genai.Client(api_key=api_key or GEMINI_API_KEY)
    target_model = model_id or "gemini-3.5-flash-lite"
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model=target_model,
                contents=[prompt, img]
            )
            return response.text or ""
        except errors.ServerError:
            if attempt < 2:
                time.sleep(2 ** attempt)
            else:
                raise


def _ollama_call(model_id: str, prompt: str, img: Image.Image, base_url: str = None) -> str:
    url = (base_url or "http://localhost:11434").rstrip("/")
    img_b64 = _pil_to_base64(img)
    target_model = model_id or "llava"

    ollama_prompt = (
        f"{prompt}\n\n"
        f"CRITICAL: Respond ONLY with a valid JSON array of dict objects, e.g. [{{'expr': '2 + 2', 'result': 4}}]. "
        f"Do NOT include any explanations, greetings, or markdown outside the JSON."
    )

    try:
        resp = requests.post(
            f"{url}/api/generate",
            json={
                "model": target_model,
                "prompt": ollama_prompt,
                "images": [img_b64],
                "stream": False,
                "options": {
                    "temperature": 0.1
                }
            },
            timeout=180
        )
    except requests.exceptions.ConnectionError:
        raise RuntimeError(
            f"Could not connect to Ollama at {url}. "
            f"Please make sure the Ollama application is running on your computer."
        )
    except requests.exceptions.Timeout:
        raise RuntimeError("Ollama request timed out. Please try again.")

    if resp.status_code == 404:
        err_msg = ""
        try:
            err_msg = resp.json().get("error", "")
        except Exception:
            err_msg = resp.text
        if "not found" in err_msg.lower():
            raise RuntimeError(
                f"Ollama model '{target_model}' is not downloaded yet.\n"
                f"Please open your terminal and run:\n  ollama run {target_model}"
            )
        raise RuntimeError(f"Ollama error: {err_msg}")
    elif resp.status_code != 200:
        raise RuntimeError(f"Ollama returned HTTP {resp.status_code}: {resp.text}")

    data = resp.json()
    return data.get("response", "")


def _openai_call(model_id: str, api_key: str, prompt: str, img: Image.Image, base_url: str = None) -> str:
    from openai import OpenAI
    if not api_key and not base_url:
        raise RuntimeError("OpenAI API key is required. Please provide your API key in the Model Picker.")
    client = OpenAI(api_key=api_key or "no-key-required", base_url=base_url)
    img_b64 = _pil_to_base64(img)
    target_model = model_id or "gpt-4o"
    response = client.chat.completions.create(
        model=target_model,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}}
                ]
            }
        ],
        max_tokens=2048,
        temperature=0.2
    )
    return response.choices[0].message.content or ""


def _anthropic_call(model_id: str, api_key: str, prompt: str, img: Image.Image) -> str:
    from anthropic import Anthropic
    if not api_key:
        raise RuntimeError("Anthropic API key is required. Please provide your API key in the Model Picker.")
    client = Anthropic(api_key=api_key)
    img_b64 = _pil_to_base64(img)
    target_model = model_id or "claude-3-5-sonnet-20241022"
    response = client.messages.create(
        model=target_model,
        max_tokens=2048,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": img_b64}},
                    {"type": "text", "text": prompt}
                ]
            }
        ]
    )
    return response.content[0].text or ""


def _call_model(
    model_id: str = "gemini-3.5-flash-lite",
    api_key: str = None,
    prompt: str = "",
    img: Image.Image = None,
    provider: str = "gemini",
    base_url: str = None
) -> str:
    p = (provider or "").lower()
    if p == "ollama":
        return _ollama_call(model_id, prompt, img, base_url)
    elif p == "openai":
        return _openai_call(model_id, api_key, prompt, img, base_url)
    elif p == "anthropic":
        return _anthropic_call(model_id, api_key, prompt, img)
    elif p == "custom":
        return _openai_call(model_id, api_key, prompt, img, base_url)
    else:
        m = (model_id or "").lower()
        if m.startswith(("gpt", "o1", "o3")):
            return _openai_call(model_id, api_key, prompt, img, base_url)
        elif m.startswith("claude"):
            return _anthropic_call(model_id, api_key, prompt, img)
        elif any(m.startswith(v) for v in ["llava", "llama3.2-vision", "minicpm", "qwen2.5-vl", "bakllava"]):
            return _ollama_call(model_id, prompt, img, base_url)
        return _gemini_call(model_id, api_key, prompt, img)


def check_ollama_status(base_url: str = "http://localhost:11434") -> dict:
    url = (base_url or "http://localhost:11434").rstrip("/")
    try:
        resp = requests.get(f"{url}/api/tags", timeout=3)
        if resp.status_code == 200:
            data = resp.json()
            models = [m.get("name") for m in data.get("models", []) if m.get("name")]
            vision_keywords = ["llava", "vision", "vl", "minicpm", "bakllava"]
            vision_models = [
                m for m in models
                if any(k in m.lower() for k in vision_keywords)
            ]
            return {
                "connected": True,
                "url": url,
                "models": models,
                "vision_models": vision_models,
                "has_vision": len(vision_models) > 0,
                "recommended_model": vision_models[0] if vision_models else "llava"
            }
        return {"connected": False, "error": f"Ollama HTTP {resp.status_code}", "models": [], "has_vision": False}
    except Exception as e:
        return {"connected": False, "error": str(e), "models": [], "has_vision": False}


def _clean_and_parse_response(text: str):
    raw = text.strip()
    if raw.startswith("```"):
        lines = raw.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        raw = "\n".join(lines).strip()

    try:
        return ast.literal_eval(raw)
    except Exception:
        pass

    try:
        return json.loads(raw)
    except Exception:
        pass

    match = re.search(r'\[.*\]', raw, re.DOTALL)
    if match:
        matched_str = match.group(0)
        try:
            return json.loads(matched_str)
        except Exception:
            pass
        try:
            return ast.literal_eval(matched_str)
        except Exception:
            pass

    return []


def analyze_image(
    img: Image.Image,
    dict_of_vars: dict,
    provider: str = "gemini",
    model_id: str = "gemini-3.5-flash-lite",
    api_key: str = None,
    base_url: str = None
):
    dict_of_vars_str = json.dumps(dict_of_vars, ensure_ascii=False)
    prompt = (
        f"Analyze the equation or expression in this image and return the answer according to the given rules: "
        f"Note: The image may contain a background grid or dots; IGNORE the grid completely and focus only on the hand drawn content."
        f"Format your response with proper spacing and punctuation. "
        f"For example, instead of 'Areaofsquarewithside2is4squareunits', "
        f"write 'Area of square with side 2 is 4 square units'. "
        f"Use proper mathematical notation and formatting. "
        f"You have been given an image with some mathematical expressions, equations, or graphical problems, and you need to solve them. "
        f"Note: Use the PEMDAS rule for solving mathematical expressions. PEMDAS stands for the Priority Order: Parentheses, Exponents, Multiplication and Division (from left to right), Addition and Subtraction (from left to right). Parentheses have the highest priority, followed by Exponents, then Multiplication and Division, and lastly Addition and Subtraction. "
        f"For example: "
        f"Q. 2 + 3 * 4 "
        f"(3 * 4) => 12, 2 + 12 = 14. "
        f"Q. 2 + 3 + 5 * 4 - 8 / 2 "
        f"5 * 4 => 20, 8 / 2 => 4, 2 + 3 => 5, 5 + 20 => 25, 25 - 4 => 21. "
        f"YOU CAN HAVE FIVE TYPES OF EQUATIONS/EXPRESSIONS IN THIS IMAGE, AND ONLY ONE CASE SHALL APPLY EVERY TIME: "
        f"Following are the cases: "
        f"1. Simple mathematical expressions like 2 + 2, 3 * 4, 5 / 6, 7 - 8, etc.: In this case, solve and return the answer in the format of a LIST OF ONE DICT [{{'expr': given expression, 'result': calculated answer}}]. "
        f"2. Set of Equations like x^2 + 2x + 1 = 0, 3y + 4x = 0, 5x^2 + 6y + 7 = 12, etc.: In this case, solve for the given variable, and the format should be a COMMA SEPARATED LIST OF DICTS, with dict 1 as {{'expr': 'x', 'result': 2, 'assign': True}} and dict 2 as {{'expr': 'y', 'result': 5, 'assign': True}}. This example assumes x was calculated as 2, and y as 5. Include as many dicts as there are variables. "
        f"3. Assigning values to variables like x = 4, y = 5, z = 6, etc.: In this case, assign values to variables and return another key in the dict called {{'assign': True}}, keeping the variable as 'expr' and the value as 'result' in the original dictionary. RETURN AS A LIST OF DICTS. "
        f"4. Analyzing Graphical Math problems, which are word problems represented in drawing form, such as cars colliding, trigonometric problems, problems on the Pythagorean theorem, adding runs from a cricket wagon wheel, etc. These will have a drawing representing some scenario and accompanying information with the image. PAY CLOSE ATTENTION TO DIFFERENT COLORS FOR THESE PROBLEMS. You need to return the answer in the format of a LIST OF ONE DICT [{{'expr': given expression, 'result': calculated answer}}]. "
        f"5. Detecting Abstract Concepts that a drawing might show, such as love, hate, jealousy, patriotism, or a historic reference to war, invention, discovery, quote, etc. USE THE SAME FORMAT AS OTHERS TO RETURN THE ANSWER, where 'expr' will be the explanation of the drawing, and 'result' will be the abstract concept. "
        f"Make sure to use extra backslashes for escape characters like \\f -> \\\\f, \\n -> \\\\n, etc. "
        f"Here is a dictionary of user-assigned variables. If the given expression has any of these variables, use its actual value from this dictionary accordingly: {dict_of_vars_str}. "
        f"DO NOT USE BACKTICKS OR MARKDOWN FORMATTING. "
        f"PROPERLY QUOTE THE KEYS AND VALUES IN THE DICTIONARY FOR EASIER PARSING WITH Python's ast.literal_eval."
    )

    raw_text = _call_model(
        model_id=model_id,
        api_key=api_key,
        prompt=prompt,
        img=img,
        provider=provider,
        base_url=base_url
    )

    print("Model response:", raw_text)
    answers = _clean_and_parse_response(raw_text)
    print("Parsed answers:", answers)

    for answer in answers:
        if isinstance(answer, dict):
            if 'assign' in answer:
                answer['assign'] = bool(answer['assign'])
            else:
                answer['assign'] = False
    return answers
