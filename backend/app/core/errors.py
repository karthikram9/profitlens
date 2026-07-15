from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import traceback

def error_response(code: str, message: str, details: any = None, status_code: int = 400):
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details
            }
        }
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return error_response(
        code=f"HTTP_{exc.status_code}",
        message=exc.detail,
        status_code=exc.status_code
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return error_response(
        code="VALIDATION_ERROR",
        message="Request validation failed",
        details=exc.errors(),
        status_code=422
    )

async def generic_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    return error_response(
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred",
        details=str(exc),
        status_code=500
    )
