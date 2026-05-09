"""
Token counting utilities for quota tracking.
Uses tiktoken for OpenAI-compatible counting; falls back to word count for others.
"""

import time
from typing import List, Dict

try:
    import tiktoken
    _enc = tiktoken.get_encoding("cl100k_base")
    _has_tiktoken = True
except Exception:
    _has_tiktoken = False


def count_tokens(text: str) -> int:
    """Estimate token count for a piece of text."""
    if _has_tiktoken:
        return len(_enc.encode(text))
    # Fallback: ~4 chars per token
    return max(1, len(text) // 4)


def count_messages(messages: List[Dict[str, str]]) -> int:
    """Count tokens across a message list."""
    total = 0
    for m in messages:
        total += count_tokens(m.get("content", ""))
        total += 4  # overhead per message
    return total


class QuotaTracker:
    """Tracks per-request token usage and latency."""

    def __init__(self) -> None:
        self._start: float = 0.0
        self.prompt_tokens: int = 0
        self.completion_tokens: int = 0
        self._chunks: List[str] = []

    def start(self, prompt_messages: List[Dict[str, str]]) -> None:
        self.prompt_tokens = count_messages(prompt_messages)
        self._chunks = []
        self._start = time.monotonic()

    def add_chunk(self, chunk: str) -> None:
        self._chunks.append(chunk)

    def set_usage(self, usage: Dict[str, int]) -> None:
        """Manually set usage from provider (overrides internal estimation)."""
        if "prompt_tokens" in usage:
            self.prompt_tokens = usage["prompt_tokens"]
        if "completion_tokens" in usage:
            self.completion_tokens = usage["completion_tokens"]
        # Track reasoning tokens if provided
        if "reasoning_tokens" in usage:
            self.reasoning_tokens = usage["reasoning_tokens"]

    def finalize(self) -> Dict[str, int]:
        # Only estimate if not already set by provider
        if self.completion_tokens == 0:
            full = "".join(self._chunks)
            self.completion_tokens = count_tokens(full)
        
        latency_ms = int((time.monotonic() - self._start) * 1000)
        res = {
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "latency_ms": latency_ms,
        }
        if hasattr(self, "reasoning_tokens"):
            res["reasoning_tokens"] = self.reasoning_tokens
        return res
