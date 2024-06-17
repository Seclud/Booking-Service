from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import select
from starlette.requests import Request
from starlette.responses import Response

from app.api import users, login, carservice, lifts, bookings
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
import redis.asyncio as redis
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine
from starlette_admin.contrib.sqla import Admin, ModelView
from app.models import User, CarService, Lift, Booking, Services
from .core.config import settings
from app.api.deps import SessionDep
def request_key_builder(
    func,
    namespace: str = "",
    *,
    request: Request = None,
    response: Response = None,
    **kwargs,
):
    return ":".join([
        namespace,
        request.method.lower(),
        request.url.path,
        repr(sorted(request.query_params.items()))
    ])

@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    client = redis.from_url(f"redis://{settings.REDIS_HOST}")
    FastAPICache.init(RedisBackend(client), prefix="fastapi-cache")
    yield

app = FastAPI(lifespan=lifespan)


origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost"
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

admin = Admin(engine, title="Example")
admin.add_view(ModelView(User))
admin.add_view(ModelView(CarService))
admin.add_view(ModelView(Lift))
admin.add_view(ModelView(Booking))
admin.add_view(ModelView(Services))
admin.mount_to(app)

# @app.on_event("startup")
# async def startup():
#     global redis_client
#     #pool = redis.ConnectionPool.from_url("redis://localhost:6379/0")
#     #client = redis.Redis(connection_pool=pool)
#     redis_client = redis.from_url("redis://localhost:6379/0")
#     FastAPICache.init(RedisBackend(redis_client), prefix="fastapi-cache", key_builder=request_key_builder)
#
#
