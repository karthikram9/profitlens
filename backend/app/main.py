from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.errors import (
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler
)
from app.ml.predictor import model_loaded, load_error

from app.api.auth import router as auth_router
from app.api.uploads import router as uploads_router
from app.api.analytics import router as analytics_router

app = FastAPI(title="ProfitLens API", version="1.0.0")

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(uploads_router, prefix="/uploads", tags=["uploads"])
app.include_router(analytics_router, prefix="/analytics", tags=["analytics"])


# CORS middleware configuration to allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Bind custom error serialization handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/health/model")
def health_model_check():
    if model_loaded:
        return {"status": "ok", "model_loaded": True}
    else:
        raise HTTPException(
            status_code=500,
            detail=f"Model failed to load: {load_error}"
        )

@app.get("/health/error-test")
def health_error_test():
    # Force a ValueError to test that the generic exception handler formats it correctly
    raise ValueError("This is a deliberately triggered server exception for verifying the API error envelope.")
