from collections.abc import Callable

from providers.api.koleo import KoleoProvider
from providers.base import Provider

PROVIDERS: dict[str, Callable[[], Provider]] = {
    "koleo": KoleoProvider,
}


def get_provider(slug: str) -> Provider:
    return PROVIDERS[slug]()