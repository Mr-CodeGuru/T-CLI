from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Any


class BaseProvider(ABC):
    """Abstract base class for all AI providers."""

    @abstractmethod
    async def stream(
        self,
        messages: List[Dict[str, str]],
        model: str,
        **kwargs: Any,
    ) -> AsyncGenerator[Any, None]:
        """Yield text chunks (str) or usage metadata (dict)."""
        yield ""

    async def list_models(self) -> List[Dict[str, Any]]:
        """Optional: Return a list of available models for this provider."""
        return []

    @property
    @abstractmethod
    def name(self) -> str:
        ...
