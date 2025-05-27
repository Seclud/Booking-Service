from contextlib import asynccontextmanager
from typing import AsyncIterator

import redis.asyncio as redis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from sqlmodel import select

from app.api import users, login, carservice, lifts, bookings, services, files
from app.api.deps import SessionDep
from app.models import Services
from .core.config import settings


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    client = redis.from_url(f"redis://{settings.REDIS_HOST}")
    FastAPICache.init(RedisBackend(client), prefix="fastapi-cache")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    root_path='/api'
    # swagger_ui_parameters will use FastAPI defaults based on the above
)

origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost",
    "http://158.160.134.40",
    "http://84.201.170.127",
    settings.server_host,
]

# Add load balancer URL if available
if hasattr(settings, 'LOAD_BALANCER_URL') and settings.LOAD_BALANCER_URL:
    origins.append(settings.LOAD_BALANCER_URL)

# Add frontend host if different
if settings.FRONTEND_HOST and settings.FRONTEND_HOST not in origins:
    frontend_url = f"http://{settings.FRONTEND_HOST}"
    if settings.FRONTEND_PORT and settings.FRONTEND_PORT != "80":
        frontend_url += f":{settings.FRONTEND_PORT}"
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for load balancer and monitoring"""
    # try:
    #     # Test Redis connection
    #     client = redis.from_url(f"redis://{settings.REDIS_HOST}:{getattr(settings, 'REDIS_PORT', 6379)}")
    #     await client.ping()
    #     await client.close()
    #     redis_status = "healthy"
    # except Exception as e:
    #     redis_status = f"unhealthy: {str(e)}"
    
    # Test database connection
    try:
        from app.core.database import engine
        from sqlmodel import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "healthy" if  db_status == "healthy" else "unhealthy",
        "database": db_status,
        "version": "1.0.0"
    }

app.include_router(users.router, prefix="/users", tags=["user"])
app.include_router(login.router, tags=["login"])
app.include_router(carservice.router, prefix="/carservices", tags=["carservices"])
app.include_router(lifts.router, prefix="/lifts", tags=["lifts"])
app.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
app.include_router(services.router, prefix="/services", tags=["services"])
app.include_router(files.router, prefix="/files", tags=["files"])

