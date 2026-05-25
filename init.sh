#!/usr/bin/env bash
set -euo pipefail

echo "=== init.sh: Reverse DCF Web App ==="

# 1. Install dependencies
echo "[1/4] Installing dependencies..."
npm install

# 2. Lint
echo "[2/4] Running lint..."
npm run lint

# 3. Type-check
echo "[3/4] Running type-check..."
npm run typecheck

# 4. Tests
echo "[4/4] Running tests..."
npm run test

echo "=== init.sh: All checks passed. Environment healthy. ==="
