import os
import json
import httpx
from typing import AsyncGenerator, List, Dict, Any

from .base import BaseProvider

OPENROUTER_BASE = "https://openrouter.ai/api/v1"
DEBUG_LOG_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "debug_backend.log"))


class OpenRouterProvider(BaseProvider):
    """OpenRouter provider (routes to many models via OpenAI-compatible API)."""

    name = "openrouter"

    def __init__(self) -> None:
        self._client_instance = None

    def _get_client(self):
        if self._client_instance:
            return self._client_instance
            
        from openai import AsyncOpenAI
            
        api_key = os.getenv("OPENROUTER_API_KEY")
        
        # DEBUG LOG
        with open(DEBUG_LOG_PATH, "a") as f:
            f.write(f"Initializing OpenRouter client... Key found: {'Yes (starts with ' + api_key[:4] + ')' if api_key else 'No'}\n")

        if not api_key:
            raise EnvironmentError(
                "OPENROUTER_API_KEY not set. Please enter it in the setup wizard.\n"
                "Get a free key at https://openrouter.ai/keys"
            )
            
        self._client_instance = AsyncOpenAI(
            api_key=api_key,
            base_url=OPENROUTER_BASE,
            default_headers={
                "HTTP-Referer": "https://github.com/t-cli",
                "X-Title": "T-CLI",
            },
        )
        return self._client_instance

    async def stream(
        self,
        messages: List[Dict[str, str]],
        model: str = "openrouter/free",
        **kwargs: Any,
    ) -> AsyncGenerator[Any, None]:
        client = self._get_client()
        response = await client.chat.completions.create(
            model=model,
            messages=messages,  # type: ignore[arg-type]
            stream=True,
            stream_options={"include_usage": True},
        )
        async for chunk in response:
            # Handle text delta
            if chunk.choices:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
            
            # Handle usage info (usually in the last chunk)
            if hasattr(chunk, "usage") and chunk.usage:
                # Map to a format main.py can recognize as usage
                usage = {
                    "prompt_tokens": chunk.usage.prompt_tokens,
                    "completion_tokens": chunk.usage.completion_tokens,
                }
                # Include reasoning tokens if available (OpenRouter/OpenAI specific)
                if hasattr(chunk.usage, "reasoning_tokens") and chunk.usage.reasoning_tokens:
                    usage["reasoning_tokens"] = chunk.usage.reasoning_tokens
                elif "reasoning_tokens" in chunk.usage: # dict-like access
                    usage["reasoning_tokens"] = chunk.usage["reasoning_tokens"]
                
                yield {"__usage__": usage}

    async def list_models(self) -> List[Dict[str, Any]]:
        """Fetch models from OpenRouter and return details."""
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(f"{OPENROUTER_BASE}/models")
                resp.raise_for_status()
                data = resp.json()
                models = data.get("data", [])
                
                res = []
                for m in models:
                    model_id = m.get("id", "")
                    pricing = m.get("pricing", {})
                    
                    # Be extra robust: check for :free in ID OR pricing being 0
                    is_free_by_id = ":free" in model_id.lower()
                    is_free_by_price = (
                        float(pricing.get("prompt", 1)) == 0 and 
                        float(pricing.get("completion", 1)) == 0
                    )
                    
                    if is_free_by_id or is_free_by_price:
                        res.append({
                            "id": model_id,
                            "name": m.get("name") or model_id,
                            "is_free": True,
                            "context_window": m.get("context_window"),
                            "description": m.get("description", "")
                        })
                # DEBUG LOGGING
                with open(DEBUG_LOG_PATH, "a") as f:
                    f.write(f"\n--- OpenRouter Fetch ---\n")
                    f.write(f"Total models from API: {len(models)}\n")
                    f.write(f"Filtered free models: {len(res)}\n")
                    f.write(f"Free IDs: {[m['id'] for m in res]}\n")
                
                return res
            except Exception as e:
                with open(DEBUG_LOG_PATH, "a") as f:
                    f.write(f"ERROR: {str(e)}\n")
                return [{"error": str(e)}]
