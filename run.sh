#!/bin/bash
set -e

# Resolve the absolute directory of this script
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# 1. Check & Install Node.js Dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 First run detected: Installing Node.js dependencies..."
    npm install --silent
    echo "✅ Node dependencies installed."
fi

# 2. Check & Build Frontend
if [ ! -d "dist" ]; then
    echo "🔨 Building frontend..."
    npm run build --silent
    echo "✅ Frontend built."
fi

# 3. Check & Setup Python Backend Environment
if [ ! -d "backend/.venv" ]; then
    echo "🐍 First run detected: Setting up Python backend environment..."
    python3 -m venv backend/.venv
    source backend/.venv/bin/activate
    pip install -r backend/requirements.txt --quiet
    deactivate
    echo "✅ Python backend ready."
fi

# 4. Launch the application
node dist/cli.js "$@"
