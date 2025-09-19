import { beforeAll, vi } from 'vitest';

// Mock Web APIs that might not be available in test environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock WebGL context for deck.gl
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: vi.fn().mockImplementation((contextType: string) => {
    if (contextType === 'webgl' || contextType === 'webgl2') {
      return {
        canvas: {},
        drawingBufferWidth: 1024,
        drawingBufferHeight: 768,
        getExtension: vi.fn(),
        getParameter: vi.fn(),
        createShader: vi.fn(),
        shaderSource: vi.fn(),
        compileShader: vi.fn(),
        createProgram: vi.fn(),
        attachShader: vi.fn(),
        linkProgram: vi.fn(),
        useProgram: vi.fn(),
        createBuffer: vi.fn(),
        bindBuffer: vi.fn(),
        bufferData: vi.fn(),
        enableVertexAttribArray: vi.fn(),
        vertexAttribPointer: vi.fn(),
        drawArrays: vi.fn(),
        clear: vi.fn(),
        clearColor: vi.fn(),
        enable: vi.fn(),
        depthFunc: vi.fn(),
        viewport: vi.fn(),
      };
    }
    return null;
  }),
});

beforeAll(() => {
  // Setup global test environment
  console.log('Test environment initialized');
});
