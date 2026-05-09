# T-CLI

A minimal, extremely fast, terminal-based AI chat interface. 

T-CLI operates entirely in your terminal, acting as a direct bridge to **OpenRouter** and **Local LLMs (via llama.cpp)**. It is built with a Node.js (Ink) frontend for a beautiful, responsive UI, and a Python backend for fast, robust LLM inference and streaming.

## 🚀 Installation (One-Liner)

To install T-CLI on your machine, simply run the following command in your terminal:

```bash
curl -sSL https://raw.githubusercontent.com/Mr-CodeGuru/T-CLI/main/install.sh | bash
```

### What this does:
1. Downloads the lightweight source code to `~/.t-cli-app`
2. Sets up `t-cli` as a global command in your `~/.local/bin` folder. 
*(No heavy dependencies are installed during this step!)*

### First Run (Auto-Setup)
Once installed, just type `t-cli` in your terminal to start the app. 

On the **very first run**, the app will automatically bootstrap itself by:
- Installing Node.js dependencies
- Compiling the user interface
- Setting up an isolated Python virtual environment for the backend

After the initial setup, it will launch the interface. Future runs will boot instantly.

## ⚙️ Configuration
On your first run, the CLI will guide you through a Setup Wizard to configure:
1. **OpenRouter**: Enter your API key from [openrouter.ai](https://openrouter.ai)
2. **Local LLM**: Provide the **absolute path** to your `.gguf` file (e.g., `/Users/yourname/Downloads/model.gguf`).

All configuration, logs, and session history are saved securely in `~/.mycli/`.
