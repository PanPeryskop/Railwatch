from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel


class Station(BaseModel):
    id: int
    name: str
    slug: str


class Filters(BaseModel):
    depart_after: time = time(0, 0)
    depart_before: time = time(23, 59)
    max_transfers: int | None = None
    brands: list[str] = []


class Query(BaseModel):
    origin: Station
    destination: Station
    travel_date: date
    filters: Filters = Filters()


class Connection(BaseModel):
    departure: datetime
    arrival: datetime
    duration_min: int
    transfers: int
    trains: list[str]
    price: Decimal | None