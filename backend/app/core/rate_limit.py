import time
from collections import defaultdict
from fastapi import Request, HTTPException
from typing import Callable

# Simple in-memory rate limiting structure:
# { "ip": [timestamp1, timestamp2, ...] }
rate_limit_store = defaultdict(list)

def rate_limit(max_attempts: int = 5, window_minutes: int = 15) -> Callable:
    def dependency(request: Request):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window_seconds = window_minutes * 60
        
        # Cleanup old timestamps
        history = rate_limit_store[client_ip]
        history = [ts for ts in history if now - ts < window_seconds]
        
        if len(history) >= max_attempts:
            raise HTTPException(status_code=429, detail="Too many attempts. Please try again later.")
            
        history.append(now)
        rate_limit_store[client_ip] = history
        return True
    return dependency
