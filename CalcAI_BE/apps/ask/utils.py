from typing import List, Tuple, Optional
from PIL import Image
from constants import GEMINI_API_KEY
from apps.calculator.utils import _call_model

SYSTEM_PROMPT = """You are a brilliant, friendly AI tutor and assistant. You can answer any question — math, science, history, English, coding, general knowledge, and more.

RESPONSE FORMATTING RULES:
- Use markdown formatting in your response
- For comparisons or data → use markdown tables
- For step-by-step processes → use numbered lists
- For multiple items → use bullet points
- For code → use fenced code blocks with language tag
- For explanations → use clear paragraphs with headers where helpful
- For short factual answers → answer directly and concisely
- If an image is provided, analyze it and answer based on what you see

If the user is not satisfied or asks to change the format/depth/style, adapt immediately.
Be conversational, clear, and helpful."""


def build_history_text(history: List[Tuple[str, str]]) -> str:
    if not history:
        return ""
    lines = ["Previous conversation:"]
    for role, content in history[-6:]:
        label = "User" if role == "user" else "Assistant"
        lines.append(f"{label}: {content}")
    return "\n".join(lines) + "\n\n"


def ask_ai(
    question: str,
    img: Optional[Image.Image],
    history: List[Tuple[str, str]],
    model_id: str = "gemini-3.5-flash-lite",
    api_key: str = None
) -> str:
    used_key = api_key or GEMINI_API_KEY
    history_text = build_history_text(history)
    prompt = f"{SYSTEM_PROMPT}\n\n{history_text}User question: {question}"

    if img is None:
        img = Image.new("RGB", (1, 1), color="white")

    return _call_model(model_id, used_key, prompt, img)
