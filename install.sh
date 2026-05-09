#!/bin/bash
set -e

# T-CLI One-Liner Installer
echo "🚀 Installing T-CLI source files..."
INSTALL_DIR="$HOME/.t-cli-app"

# 1. Clone or update the repository
if [ -d "$INSTALL_DIR" ]; then
  echo "Updating existing installation..."
  cd "$INSTALL_DIR" && git pull origin main
else
  git clone https://github.com/Mr-CodeGuru/T-CLI.git "$INSTALL_DIR"
fi

# 2. Make the runner script executable
chmod +x "$INSTALL_DIR/run.sh"

# 3. Create symlink in a standard bin directory
BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"
ln -sf "$INSTALL_DIR/run.sh" "$BIN_DIR/t-cli"

echo ""
echo "✅ Source files downloaded successfully!"
echo "The command 't-cli' has been added to $BIN_DIR"
echo ""
echo "⚠️  Make sure $BIN_DIR is in your system PATH:"
echo "   export PATH=\"\$HOME/.local/bin:\$PATH\""
echo ""
echo "Type 't-cli' to launch the app! (Dependencies will be installed automatically on the first run)."
