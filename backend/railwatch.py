import asyncio
import sys
from datetime import date

from models import Filters, WatchJob
from providers import get_provider
from services.runner import run_job


async def run(origin: str, destination: str, offset_days: int, range_days: int) -> None:
    provider = get_provider("koleo")
    try:
        job = WatchJob(
            provider="koleo",
            origin=(await provider.find_stations(origin))[0],
            destination=(await provider.find_stations(destination))[0],
            offset_days=offset_days,
            date_range_days=range_days,
            filters=Filters(brands=["EIP", "EIC", "IC", "TLK"]),
        )
    finally:
        await provider.close()

    print(f"{job.origin.name} → {job.destination.name}")
    for c in await run_job(job, date.today()):
        trains = ", ".join(f"{t.category} {t.number}" for t in c.trains)
        price = f"{c.price} zł" if c.price is not None else "-"
        print(f"{c.travel_date}  {c.departure:%H:%M} → {c.arrival:%H:%M}  {c.duration_min} min  {trains}  {price}")


def main() -> None:
    offset_days = int(sys.argv[3]) if len(sys.argv) > 3 else 7
    range_days = int(sys.argv[4]) if len(sys.argv) > 4 else 1
    asyncio.run(run(sys.argv[1], sys.argv[2], offset_days, range_days))


if __name__ == "__main__":
    main()