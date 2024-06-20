from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncIterator

import jwt
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import select
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.api import users, login, carservice, lifts, bookings
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
import redis.asyncio as redis
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine
from app.models import User, CarService, Lift, Booking, Services
from .core.config import settings
from app.api.deps import SessionDep


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    client = redis.from_url(f"redis://{settings.REDIS_HOST}")
    FastAPICache.init(RedisBackend(client), prefix="fastapi-cache")
    yield


app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost",
    "http://158.160.134.40",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/users", tags=["user"])
app.include_router(login.router, tags=["login"])
app.include_router(carservice.router, prefix="/carservices", tags=["carservices"])
app.include_router(lifts.router, prefix="/lifts", tags=["lifts"])
app.include_router(bookings.router, prefix="/bookings", tags=["bookings"])


@app.get("/services")
def get_services(session: SessionDep):
    statement = select(Services)
    services = session.exec(statement).all()
    return services
