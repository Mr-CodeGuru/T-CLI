#!/usr/bin/env python3
"""
T-CLI Python Backend — main.py
================================
Single persistent process that reads JSON requests from stdin (one per line)
and writes JSON response chunks to stdout (one per line, flushed immediately).

Message protocol:
  Request  → {"id": "uuid", "type": "chat|command|system", "content": "...", "meta": {...}}
  Response → {"id": "uuid", "type": "stream|final|error|ack", "content": "...", "usage"?: {...}}
"""

import asyncio
import json
import sys
import os
from pathlib import Path

# Load ~/.mycli/.env if it exists
_env_path = Path.home() / ".mycli" / ".env"
if _env_path.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(dotenv_path=str(_env_path))
    except ImportError:
        pass

from router import route
from session import build_messages
from quota import QuotaTracker


def write(obj: dict) -> None:
    """Write a JSON object to stdout and flush immediately."""
    sys.stdout.write(json.dumps(obj) + "\n")
    sys.stdout.flush()


def write_error(req_id: str, message: str) -> None:
    write({"id": req_id, "type": "error", "content": message})


async def handle_chat(req: dict) -> None:
    """Handle a chat request: stream chunks, then write final with usage."""
    req_id = req.get("id", "unknown")
    content = req.get("content", "")
    meta = req.get("meta", {})

    provider = meta.get("provider", "openrouter")
    model = meta.get("model", "meta-llama/llama-3.3-70b-instruct")
    history = meta.get("history", [])

    # Build message list
    messages = build_messages(history, content)

    tracker = QuotaTracker()
    tracker.start(messages)

    try:
        async for chunk in route(provider, model, messages):
            if isinstance(chunk, str):
                tracker.add_chunk(chunk)
                write({"id": req_id, "type": "stream", "content": chunk})
            elif isinstance(chunk, dict) and "__usage__" in chunk:
                tracker.set_usage(chunk["__usage__"])

        usage = tracker.finalize()
        write({"id": req_id, "type": "final", "content": "", "usage": usage})

    except EnvironmentError as e:
        write_error(req_id, f"Config error: {e}")
    except Exception as e:
        import openai
        msg = str(e)
        
        # Aggressive parsing for nested JSON errors (common in OpenRouter/OpenAI)
        try:
            if hasattr(e, 'body') and isinstance(e.body, dict):
                # Try to find the deepest 'message' or 'raw' field
                err_data = e.body.get('error', e.body)
                if isinstance(err_data, dict):
                    msg = err_data.get('message', msg)
                    # OpenRouter often nests further in 'metadata' -> 'raw'
                    meta = err_data.get('metadata', {})
                    if isinstance(meta, dict) and 'raw' in meta:
                        msg = meta['raw']
            elif "{" in msg and "}" in msg:
                # If it's a stringified dict, try to extract the message
                import re
                match = re.search(r"['\"]message['\"]: ['\"]([^'\"]+)['\"]", msg)
                if match:
                    msg = match.group(1)
                else:
                    match = re.search(r"['\"]raw['\"]: ['\"]([^'\"]+)['\"]", msg)
                    if match:
                        msg = match.group(1)
        except:
            pass
            
        write_error(req_id, msg)


async def handle_system(req: dict) -> None:
    """Handle system messages (shutdown, setenv, reload)."""
    req_id = req.get("id", "unknown")
    content = req.get("content", "")
    meta = req.get("meta", {})

    if content == "shutdown":
        sys.exit(0)

    elif content in ["setenv", "set_env"]:
        # Inject a new env var into this process and clear provider cache
        k = meta.get("key", "").strip()
        v = meta.get("value", "").strip()
        if k and v:
            os.environ[k] = v
            # Also write to debug log
            try:
                with open("debug_backend.log", "a") as f:
                    f.write(f"SYSTEM: Set env {k} to value starting with {v[:4]}\n")
            except:
                pass
            try:
                from router import clear_provider_cache
                clear_provider_cache()
            except Exception:
                pass
        write({"id": req_id, "type": "ack", "content": "Environment updated"})

    elif content == "ping":
        write({"id": req_id, "type": "ack", "content": "pong"})

    elif content == "list_models":
        provider_name = meta.get("provider", "")
        if provider_name:
            try:
                from router import list_models
                models = await list_models(provider_name)
                write({"id": req_id, "type": "ack", "content": json.dumps(models)})
            except Exception as e:
                write_error(req_id, f"Failed to list models: {e}")
        else:
            write_error(req_id, "Provider name missing for list_models")


async def main_loop() -> None:
    """Read stdin line-by-line and dispatch requests."""
    # Signal ready to the Node frontend
    write({"id": "init", "type": "ack", "content": "ready"})

    loop = asyncio.get_event_loop()

    while True:
        try:
            line = await loop.run_in_executor(None, sys.stdin.readline)
        except (EOFError, KeyboardInterrupt):
            break

        if not line:
            break

        line = line.strip()
        if not line:
            continue

        try:
            req = json.loads(line)
        except json.JSONDecodeError as e:
            write_error("parse-error", f"Invalid JSON: {e}")
            continue

        msg_type = req.get("type", "")
        req_id = req.get("id", "unknown")

        try:
            if msg_type == "chat":
                await handle_chat(req)
            elif msg_type == "system":
                await handle_system(req)
            elif msg_type == "command":
                # Future: handle CLI commands that need backend processing
                write({"id": req_id, "type": "ack", "content": "command received"})
            else:
                write_error(req_id, f"Unknown message type: {msg_type}")
        except Exception as e:
            write_error(req_id, f"Unhandled error: {type(e).__name__}: {e}")


if __name__ == "__main__":
    # Ensure stdout is unbuffered
    sys.stdout.reconfigure(line_buffering=True)  # type: ignore[attr-defined]
    asyncio.run(main_loop())
