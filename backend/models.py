from datetime import date, datetime, time, timedelta
from decimal import Decimal

from pydantic import BaseModel


class Station(BaseModel):
    external_id: str
    name: str


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


class WatchJob(BaseModel):
    provider: str
    origin: Station
    destination: Station
    fixed_date: date | None = None
    offset_days: int = 0
    date_range_days: int = 1
    filters: Filters = Filters()

    def travel_dates(self, today: date) -> list[date]:
        first = self.fixed_date or today + timedelta(days=self.offset_days)
        return [first + timedelta(days=i) for i in range(self.date_range_days)]


class Train(BaseModel):
    category: str
    number: str


class Connection(BaseModel):
    travel_date: date
    departure: datetime
    arrival: datetime
    duration_min: int
    transfers: int
    trains: list[Train]
    price: Decimal | None