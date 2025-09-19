# UrbanSynth City Simulator - Makefile
#
# Common development and deployment tasks

.PHONY: help dev build deploy clean install test lint format

# Default target
help:
	@echo "UrbanSynth City Simulator"
	@echo ""
	@echo "Available commands:"
	@echo "  make dev       - Start development server"
	@echo "  make build     - Build for production"
	@echo "  make deploy    - Build and deploy to GitHub Pages"
	@echo "  make install   - Install dependencies"
	@echo "  make test      - Run tests"
	@echo "  make lint      - Run linter"
	@echo "  make format    - Format code"
	@echo "  make clean     - Clean build artifacts"

# Development
dev:
	npm run dev

# Build for production
build:
	npm run build

# Deploy to GitHub Pages (builds first)
deploy:
	npm run deploy

# Install dependencies
install:
	npm install

# Run tests
test:
	npm test

# Run linter
lint:
	npm run lint

# Format code
format:
	npm run format

# Clean build artifacts
clean:
	rm -rf dist/
	rm -rf src/wasm/pkg/
	rm -rf public/model.pbf
	rm -rf public/model-terrain.json