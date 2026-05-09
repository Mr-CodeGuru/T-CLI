"""
Router: maps provider names to provider instances and dispatches requests.
Providers are instantiated lazily on first use and cached.
"""

import sys
from typing import Dict, AsyncGenerator, List, Any

from providers.base import BaseProvider
from providers.openrouter import OpenRouterProvider
from providers.local import LocalProvider

_PROVIDER_CLASSES = {
    "openrouter": OpenRouterProvider,
    "local": LocalProvider,
}

_cache: Dict[str, BaseProvider] = {}


def get_provider(name: str) -> BaseProvider:
    """Get or create a provider instance by name."""
    if name not in _cache:
        cls = _PROVIDER_CLASSES.get(name)
        if cls is None:
            raise ValueError(f"Unknown provider: {name}")
        _cache[name] = cls()
    return _cache[name]


def clear_provider_cache() -> None:
    """Clear cached provider instances so they reinitialize with new env vars."""
    _cache.clear()


async def route(
    provider_name: str,
    model: str,
    messages: List[Dict[str, str]],
) -> AsyncGenerator[Any, None]:
    """Route a chat request to the appropriate provider and yield chunks."""
    provider = get_provider(provider_name)
    async for chunk in provider.stream(messages, model):
        yield chunk


async def list_models(provider_name: str) -> List[Dict[str, Any]]:
    """Get list of models for a provider."""
    provider = get_provider(provider_name)
    return await provider.list_models()
