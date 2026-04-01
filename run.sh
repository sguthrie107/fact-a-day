#!/usr/bin/env bash
# run.sh — Shell launcher for fact-a-day research paper generator
# Usage:  ./run.sh
# Requires: Node.js, GEMINI_API_KEY environment variable

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check Node.js is installed
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed. Download it from https://nodejs.org" >&2
  exit 1
fi

# Check for API key
if [ -z "$GEMINI_API_KEY" ]; then
  echo "ERROR: GEMINI_API_KEY is not set." >&2
  echo "Set it with:  export GEMINI_API_KEY=AIza..." >&2
  exit 1
fi

# Install dependencies if needed
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
  echo "Installing dependencies..."
  (cd "$SCRIPT_DIR" && npm install)
fi

# Run the generator
node "$SCRIPT_DIR/research-paper.js"
