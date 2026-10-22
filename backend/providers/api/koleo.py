from datetime import datetime, timedelta
from decimal import Decimal

from koleo.api import KoleoAPI, V3ConnectionResult

from models import Connection, Query, Station


class KoleoProvider:
    def __init__(self) -> None:
        self.api = KoleoAPI()
        self.stations: list[Station] = []
        self.brands: dict[int, str] = {}

    async def close(self) -> None:
        await self.api.close()

    async def find_stations(self, name: str) -> list[Station]:
        if not self.stations:
            raw = sorted(await self.api.get_stations(), key=lambda s: -s["hits"])
            self.stations = [Station(id=s["id"], name=s["name"], slug=s["name_slug"]) for s in raw]
        needle = name.lower()
        return [s for s in self.stations if needle in s.name.lower()]

    async def search(self, query: Query) -> list[Connection]:
        if not self.brands:
            self.brands = {b["id"]: b["name"] for b in await self.api.get_brands()}

        brand_ids = [id for id, name in self.brands.items() if name in query.filters.brands]
        start = datetime.combine(query.travel_date, query.filters.depart_after)
        end = datetime.combine(query.travel_date, query.filters.depart_before)

        connections = []
        while start <= end:
            results = await self.api.v3_connection_search(query.origin.id, query.destination.id, brand_ids, start)
            departures = [datetime.fromisoformat(r["departure"]).replace(tzinfo=None) for r in results]
            for result, departure in zip(results, departures):
                if departure > end:
                    continue
                if query.filters.max_transfers is not None and result["changes"] > query.filters.max_transfers:
                    continue
                connections.append(await self.connection(result))
            if not departures or max(departures) < start:
                break
            start = max(departures) + timedelta(minutes=1)
        return connections

    async def connection(self, result: V3ConnectionResult) -> Connection:
        departure = datetime.fromisoformat(result["departure"])
        arrival = datetime.fromisoformat(result["arrival"])
        return Connection(
            departure=departure,
            arrival=arrival,
            duration_min=int((arrival - departure).total_seconds() // 60),
            transfers=result["changes"],
            trains=self.trains(result),
            price=await self.price(result["uuid"]),
        )

    async def price(self, uuid: str) -> Decimal | None:
        price = await self.api.v3_get_price(uuid)
        return Decimal(price["price"].replace(",", ".")).quantize(Decimal("0.01")) if price else None

    def trains(self, result: V3ConnectionResult) -> list[str]:
        return [
            f"{self.brands.get(leg['commercial_brand_id'], '')} {leg['train_nr']}".strip()
            for leg in result["legs"]
            if leg["leg_type"] == "train_leg"
        ]