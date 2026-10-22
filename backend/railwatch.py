import asyncio
import sys
from datetime import date, timedelta

from models import Filters, Query
from providers.api.koleo import KoleoProvider


async def run(origin: str, destination: str, days_ahead: int) -> None:
    provider = KoleoProvider()
    try:
        query = Query(
            origin=(await provider.find_stations(origin))[0],
            destination=(await provider.find_stations(destination))[0],
            travel_date=date.today() + timedelta(days=days_ahead),
            filters=Filters(brands=["EIP", "EIC", "IC", "TLK"]),
        )
        print(f"{query.origin.name} → {query.destination.name}, {query.travel_date}")
        for c in await provider.search(query):
            price = f"{c.price} zł" if c.price is not None else "-"
            print(f"{c.departure:%H:%M} → {c.arrival:%H:%M}  {c.duration_min} min  {', '.join(c.trains)}  {price}")
    finally:
        await provider.close()


def main() -> None:
    days = int(sys.argv[3]) if len(sys.argv) > 3 else 7
    asyncio.run(run(sys.argv[1], sys.argv[2], days))


if __name__ == "__main__":
    main()