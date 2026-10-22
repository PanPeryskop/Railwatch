from typing import Protocol

from models import Connection, Query, Station


class Provider(Protocol):
    async def find_stations(self, name: str) -> list[Station]: ...

    async def search(self, query: Query) -> list[Connection]: ...

    async def close(self) -> None: ...