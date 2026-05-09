import os
import asyncio
from typing import AsyncGenerator, List, Dict, Any
from .base import BaseProvider

class LocalProvider(BaseProvider):
    """
    Local LLM provider via llama-cpp-python.
    Loads a GGUF file from LOCAL_MODEL_PATH.
    """

    name = "local"

    def __init__(self) -> None:
        self._llm = None
        self._last_path = None

    def _get_llm(self, path: str):
        # Lazy load and cache the model instance
        if self._llm and self._last_path == path:
            return self._llm
        
        from llama_cpp import Llama
        if not os.path.exists(path):
            raise FileNotFoundError(f"GGUF model file not found at: {path}")
        
        # Load model (2048 context, silent)
        self._llm = Llama(model_path=path, n_ctx=2048, verbose=False)
        self._last_path = path
        return self._llm

    async def stream(
        self,
        messages: List[Dict[str, str]],
        model: str = "local-gguf",
        **kwargs: Any,
    ) -> AsyncGenerator[str, None]:
        path = os.getenv("LOCAL_MODEL_PATH")
        if not path:
            yield "Error: LOCAL_MODEL_PATH not set. Please set it in /providers or the setup wizard."
            return

        try:
            # Run blocking load in executor
            loop = asyncio.get_event_loop()
            llm = await loop.run_in_executor(None, self._get_llm, path)

            # Matching logic from real/cli.py with a trailing space for initiation
            prompt = ""
            has_system = any(m.get("role") == "system" for m in messages)
            
            if not has_system:
                system_prompt = (
                    "You are a highly advanced AI assistant, which can relate to it's history"
                    "Provide creative, insightful, and brilliant answers. Be concise but impactful."
                )
                prompt += f"System: {system_prompt}\n"

            for m in messages:
                role = m["role"].lower()
                if role == "system":
                    prompt += f"System: {m['content'].strip()}\n"
                elif role == "user":
                    prompt += f"User: {m['content'].strip()}\n"
                elif role == "assistant":
                    prompt += f"Assistant: {m['content'].strip()}\n"
            prompt += "Assistant: "

            # Streaming generation in executor with stop tokens from real/cli.py
            def generate():
                return llm(
                    prompt, 
                    stream=True, 
                    max_tokens=1024,
                    stop=["User:", "\nUser", "System:"]
                )

            output = await loop.run_in_executor(None, generate)
            
            for chunk in output:
                text = chunk['choices'][0]['text']
                if text:
                    yield text
                await asyncio.sleep(0) # Yield control
                
        except Exception as e:
            yield f"Error: {str(e)}"
