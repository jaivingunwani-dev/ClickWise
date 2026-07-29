import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from api.routes import health, documents

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Click Wise Backend Starting...")
    yield
    print("🛑 Click Wise Backend Shutting Down...")

app = FastAPI(
    title="Click Wise API",
    description="AI-powered legal document analysis for digital agreements",
    version="0.1.0",
    lifespan=lifespan
)

cors_origins = os.getenv("CORS_ORIGINS", "[]")
if cors_origins.startswith("["):
    import json
    cors_origins = json.loads(cors_origins)
else:
    cors_origins = [cors_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(documents.router, prefix="/api", tags=["documents"])

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
