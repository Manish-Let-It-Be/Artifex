import ast
import json
import base64
import re
from io import BytesIO
from PIL import Image
from constants import GEMINI_API_KEY

COMBINED_PROMPT = """You are a math solver and tutor. Analyze the image and solve any mathematical expression, equation, or problem you find.

IMPORTANT: The image may have a background grid or dots — ignore them completely. Focus only on the hand-drawn or written content.

Return your response as a JSON array (no markdown, no backticks). Each item must have:
- "expr": the expression or variable name
- "result": the calculated answer (as a string)
- "assign": true only if it is a variable assignment like x=4, otherwise false
- "steps": a clear numbered step-by-step explanation of how you solved it (plain text, no markdown)

Rules:
1. Simple math (2+2, 3*4): return [{{"expr": "2+2", "result": "4", "assign": false, "steps": "1. Add 2 and 2\\n2. Result is 4"}}]
2. Equations (x^2+2x+1=0): solve for each variable, set assign=true
3. Variable assignments (x=4): set assign=true
4. Word problems / graphical math: solve and explain
5. Abstract drawings: describe in expr, name concept in result

Use PEMDAS. Properly escape special characters.
User variables available: {dict_of_vars}

Return ONLY the JSON array. No other text."""


def _pil_to_base64(img: Image.Image) -> str:
    buf = BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


def _gemini_call(model_id: str, api_key: str, prompt: str, img: Image.Image) -> str:
    from google import genai
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(model=model_id, contents=[prompt, img])
    return response.text.strip()


def _openai_call(model_id: str, api_key: str, prompt: str, img: Image.Image) -> str:
    from openai import OpenAI
    client = OpenAI(api_key=api_key)
    b64 = _pil_to_base64(img)
    response = client.chat.completions.create(
        model=model_id,
        messages=[{"role": "user", "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}
        ]}],
        max_tokens=2048
    )
    return response.choices[0].message.content.strip()


def _anthropic_call(model_id: str, api_key: str, prompt: str, img: Image.Image) -> str:
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    b64 = _pil_to_base64(img)
    response = client.messages.create(
        model=model_id, max_tokens=2048,
        messages=[{"role": "user", "content": [
            {"type": "image", "source": {"type": "base64", "media_type": "image/png", "data": b64}},
            {"type": "text", "text": prompt}
        ]}]
    )
    return response.content[0].text.strip()


def _call_model(model_id: str, api_key: str, prompt: str, img: Image.Image) -> str:
    if model_id.startswith("gemini"):
        return _gemini_call(model_id, api_key or GEMINI_API_KEY, prompt, img)
    elif model_id.startswith(("gpt", "o1", "o3")):
        return _openai_call(model_id, api_key, prompt, img)
    elif model_id.startswith("claude"):
        return _anthropic_call(model_id, api_key, prompt, img)
    else:
        return _gemini_call(model_id, api_key or GEMINI_API_KEY, prompt, img)


def _is_quota_error(err: str) -> bool:
    return any(k in err for k in ["429", "RESOURCE_EXHAUSTED", "quota", "insufficient_quota", "billing"])


def _parse_response(raw: str) -> list:
    cleaned = re.sub(r"```(?:json)?", "", raw).strip().strip("`").strip()
    try:
        return json.loads(cleaned)
    except Exception:
        pass
    try:
        return ast.literal_eval(cleaned)
    except Exception:
        pass
    match = re.search(r'\[.*\]', cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except Exception:
            pass
    print("Could not parse response:", raw[:300])
    return []


def analyze_image(img: Image.Image, dict_of_vars: dict, model_id: str = "gemini-2.0-flash", api_key: str = None):
    used_key = api_key or GEMINI_API_KEY
    prompt = COMBINED_PROMPT.format(dict_of_vars=json.dumps(dict_of_vars, ensure_ascii=False))

    raw = _call_model(model_id, used_key, prompt, img)
    print("Raw response:", raw[:500])

    answers = _parse_response(raw)
    for answer in answers:
        answer['assign'] = bool(answer.get('assign', False))
        if 'steps' not in answer:
            answer['steps'] = ''

    print("Parsed answers:", answers)
    return answers
