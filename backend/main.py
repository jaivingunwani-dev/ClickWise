import os
import logging
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import HTTPException
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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

# Global exception handler for unhandled exceptions
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch all unhandled exceptions and return structured error response."""
    error_id = id(exc)  # Unique identifier for this error

    # Log full stack trace for debugging
    logger.error(f"[ERROR_ID: {error_id}] Unhandled exception on {request.method} {request.url.path}")
    logger.error(f"Exception type: {type(exc).__name__}")
    logger.error(f"Exception message: {str(exc)}")
    logger.error(f"Full traceback:\n{traceback.format_exc()}")

    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal server error. Error ID: {error_id}. Check server logs for details.",
            "error_id": error_id,
            "type": type(exc).__name__,
        }
    )

# Handler for HTTPException (explicit HTTP errors)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle explicit HTTP exceptions (e.g., 400, 404, 503)."""
    logger.warning(f"HTTP Exception on {request.method} {request.url.path}: {exc.status_code} - {exc.detail}")

    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(documents.router, prefix="/api", tags=["documents"])

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("BACKEND_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
