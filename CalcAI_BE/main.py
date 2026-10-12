from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from apps.calculator.route import router as calculator_router
from apps.ask.route import router as ask_router
from apps.calculator.utils import check_ollama_status
from constants import SERVER_URL, PORT, ENV

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
async def root():
    return {"message": "Server is running"}

@app.get('/ollama/status')
async def get_status(url: str = "http://localhost:11434"):
    return check_ollama_status(url)

app.include_router(calculator_router, prefix="/calculate", tags=["calculate"])
app.include_router(ask_router, prefix="/ask", tags=["ask"])

if __name__ == "__main__":
    uvicorn.run("main:app", host=SERVER_URL, port=int(PORT), reload=(ENV == "dev"))
