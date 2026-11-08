from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from models import Connection, Query, Station
from providers.api.koleo import KoleoProvider

koleo = KoleoProvider()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    yield
    await koleo.close()


app = FastAPI(title="Railwatch", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/stations")
async def stations(q: str) -> list[Station]:
    return (await koleo.find_stations(q))[:8]


@app.post("/search")
async def search(query: Query) -> list[Connection]:
    return await koleo.search(query)
