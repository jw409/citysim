# UrbanSynth - Interactive City Simulator

A 3D city visualization and simulation platform built with DeckGL, React, and WebGL.

## 🚀 Live Demo

**[Try the live demo here →](https://jw409.github.io/citysim/)**

## Features

- **3D City Visualization**: Realistic 3D buildings with proper lighting and materials
- **Rich Metadata**: Street names, building addresses, types, and capacities
- **Interactive Tooltips**: Hover over buildings and roads for detailed information
- **Real-time Simulation**: Agent movement and traffic simulation
- **Multi-layer Rendering**: Buildings, roads, agents, and terrain layers
- **Performance Optimized**: WebGL-powered rendering with adaptive performance

## Technology Stack

- React + TypeScript
- DeckGL for 3D visualization
- WebGL/WebGPU rendering
- Protocol Buffers for data serialization
- WASM for performance-critical computations

## Development

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

## Building

```bash
npm run build
```

This creates a static build in the `dist/` directory that can be deployed anywhere.