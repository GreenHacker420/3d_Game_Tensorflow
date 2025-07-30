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

// Mock window.scrollTo for framer-motion
global.scrollTo = jest.fn();

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

// Mock Lenis smooth scrolling library
jest.mock('lenis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    off: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    destroy: jest.fn(),
    scrollTo: jest.fn(),
    raf: jest.fn(),
    resize: jest.fn()
  }));
});

// Mock Babylon.js modules
jest.mock('@babylonjs/core', () => ({
  Engine: jest.fn().mockImplementation(() => ({
    dispose: jest.fn(),
    runRenderLoop: jest.fn(),
    stopRenderLoop: jest.fn(),
    resize: jest.fn()
  })),
  Scene: jest.fn().mockImplementation(() => ({
    dispose: jest.fn(),
    render: jest.fn(),
    registerBeforeRender: jest.fn()
  })),
  Vector3: {
    Zero: jest.fn(() => ({ x: 0, y: 0, z: 0 })),
    One: jest.fn(() => ({ x: 1, y: 1, z: 1 }))
  },
  Color3: {
    FromHexString: jest.fn(() => ({ r: 0, g: 0, b: 0 }))
  },
  UniversalCamera: jest.fn(),
  HemisphericLight: jest.fn(),
  DirectionalLight: jest.fn(),
  SpotLight: jest.fn(),
  MeshBuilder: {
    CreateBox: jest.fn(() => ({
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scaling: { x: 1, y: 1, z: 1 },
      dispose: jest.fn()
    })),
    CreateGround: jest.fn(),
    CreateSphere: jest.fn()
  },
  StandardMaterial: jest.fn(),
  PBRMaterial: jest.fn(),
  ActionManager: jest.fn()
}));

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => ({
  setBackend: jest.fn(() => Promise.resolve()),
  ready: jest.fn(() => Promise.resolve()),
  browser: {
    fromPixels: jest.fn(() => ({
      dispose: jest.fn()
    }))
  }
}));

// Mock HandPose model
jest.mock('@tensorflow-models/handpose', () => ({
  load: jest.fn(() => Promise.resolve({
    estimateHands: jest.fn(() => Promise.resolve([]))
  }))
}));
