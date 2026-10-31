from datetime import date

from models import Connection, Query, WatchJob
from providers import get_provider


async def run_job(job: WatchJob, today: date) -> list[Connection]:
    provider = get_provider(job.provider)
    try:
        connections = []
        for travel_date in job.travel_dates(today):
            query = Query(origin=job.origin, destination=job.destination, travel_date=travel_date, filters=job.filters)
            connections += await provider.search(query)
        return connections
    finally:
        await provider.close()