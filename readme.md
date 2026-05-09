# T-CLI 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-blue.svg)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/python-3.x-blue.svg)](https://www.python.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

**T-CLI** is a high-performance, minimalist terminal-based AI chat interface designed for power users. It provides a distraction-free environment to interact with state-of-the-art LLMs via **OpenRouter** or entirely **Offline/Local** using `llama.cpp`.

---

## ✨ Key Features

- 🏎️ **Blazing Fast**: Persistent backend process with zero startup latency.
- 🏠 **Local-First**: Built-in support for GGUF models via `llama.cpp` — no internet required.
- 🌌 **Universal Access**: Direct integration with OpenRouter for 100+ models (GPT-4, Claude 3.5, Gemini Pro).
- 🎨 **Dynamic Themes**: Sleek Dracula, Matrix, Nord, and Minimalist themes.
- 📂 **Smart Sessions**: Automatic session persistence and searchable chat history.
- ⚡ **Zero-Config Install**: Automated bootstrap for dependencies and environments.

---

## 🚀 Instant Installation

Get up and running with a single command:

```bash
curl -sSL https://raw.githubusercontent.com/Mr-CodeGuru/T-CLI/main/install.sh | bash
```

### 🛠 How it Works
1. **Lightweight Clone**: Downloads only the core source files to `~/.t-cli-app`.
2. **Global Command**: Automatically registers the `t-cli` command to your system path.
3. **Lazy Bootstrap**: Heavy dependencies (Node modules and Python venv) are installed **automatically** during your first run.

---

## 📖 Getting Started

Once installed, simply type:

```bash
t-cli
```

### Initial Setup
The first time you launch T-CLI, the **Setup Wizard** will help you configure:
- **API Keys**: Securely store your OpenRouter credentials.
- **Local Models**: Map your local `.gguf` files for private inference.

### Slash Commands
Control the interface directly from the input bar:
- `/help` — View all available commands.
- `/theme` — Switch UI color schemes on the fly.
- `/provider` — Toggle between OpenRouter and Local LLM.
- `/model` — Select your active inference model.
- `/memory` — View current conversation token usage.

---

## 🛠 Tech Stack

- **Frontend**: [Ink](https://github.com/vadimdemedes/ink) (React-based CLI UI)
- **Language**: TypeScript & Python 3
- **Inference**: [llama-cpp-python](https://github.com/abetlen/llama-cpp-python)
- **Database**: SQLite (via `better-sqlite3`) for session persistence

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Built with ❤️ by [Mr-CodeGuru](https://github.com/Mr-CodeGuru)
