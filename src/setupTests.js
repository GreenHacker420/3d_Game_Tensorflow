import '@testing-library/jest-dom';

// Mock WebGL context for Babylon.js tests
const mockWebGLContext = {
  canvas: document.createElement('canvas'),
  getExtension: () => null,
  getParameter: () => null,
  createShader: () => null,
  shaderSource: () => null,
  compileShader: () => null,
  createProgram: () => null,
  attachShader: () => null,
  linkProgram: () => null,
  useProgram: () => null,
  createBuffer: () => null,
  bindBuffer: () => null,
  bufferData: () => null,
  enableVertexAttribArray: () => null,
  vertexAttribPointer: () => null,
  drawArrays: () => null,
  clear: () => null,
  clearColor: () => null,
  enable: () => null,
  disable: () => null,
  depthFunc: () => null,
  viewport: () => null,
  getUniformLocation: () => null,
  uniformMatrix4fv: () => null,
  uniform1f: () => null,
  uniform3fv: () => null,
  activeTexture: () => null,
  bindTexture: () => null,
  createTexture: () => null,
  texImage2D: () => null,
  texParameteri: () => null,
  generateMipmap: () => null
};

// Mock WebGL context creation
HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return mockWebGLContext;
  }
  return null;
});

// Mock MediaDevices for webcam access
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn(() => Promise.resolve({
      getTracks: () => [],
      getVideoTracks: () => [],
      getAudioTracks: () => []
    }))
  }
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock performance.now
global.performance = {
  now: jest.fn(() => Date.now())
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Suppress console warnings for tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    args[0]?.includes?.('WebGL') ||
    args[0]?.includes?.('TensorFlow') ||
    args[0]?.includes?.('Babylon')
  ) {
    return;
  }
  originalWarn(...args);
};

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
