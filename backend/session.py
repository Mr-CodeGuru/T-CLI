"""
Session state: holds the in-process conversation history per request.
The Node frontend sends full history with every request, so this module
is a lightweight pass-through with optional truncation.
"""

from typing import List, Dict


def build_messages(
    history: List[Dict[str, str]],
    new_content: str,
    max_messages: int = 40,
) -> List[Dict[str, str]]:
    """
    Combine history + new user message, truncating if needed.
    Always keeps the system message (if any) as the first item.
    """
    messages = list(history)

    # Separate system message
    system = None
    if messages and messages[0]["role"] == "system":
        system = messages.pop(0)

    # Truncate to max_messages most recent
    if len(messages) > max_messages - 1:
        messages = messages[-(max_messages - 1):]

    # Add new user turn
    messages.append({"role": "user", "content": new_content})

    # Re-prepend system
    if system:
        messages.insert(0, system)

    return messages
