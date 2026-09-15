#!/usr/bin/env bash
set -e

# Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Only build the ml env if you actually have an environment.yml
if [ -f "environment.yml" ]; then
  micromamba env create -y -n ml -f environment.yml
  echo 'micromamba activate ml' >> ~/.bashrc
else
  echo "No environment.yml found — skipping ML env creation."
fi

# Frontend app (React)
if [ -f "app/package.json" ]; then
  echo "Installing frontend dependencies (./app)..."
  cd app
  npm install
  cd ..
else
  echo "No package.json found in ./app — skipping."
fi

# Backend (Node)
if [ -f "backend/package.json" ]; then
  echo "Installing backend dependencies (./backend)..."
  cd backend
  npm install
  cd ..
else
  echo "No package.json found in ./backend — skipping."
fi