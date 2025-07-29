/**
 * Memory Pool Manager
 * Manages object pools to reduce garbage collection and improve performance
 */

export class MemoryPoolManager {
  constructor() {
    this.pools = new Map();
    this.stats = {
      totalAllocations: 0,
      totalReuses: 0,
      poolHits: 0,
      poolMisses: 0,
      memoryFreed: 0
    };

    // Initialize common object pools
    this.initializeCommonPools();

    console.log('🔧 MemoryPoolManager initialized');
  }

  /**
   * Initialize commonly used object pools
   */
  initializeCommonPools() {
    // Vector3 pool for 3D positions
    this.createPool('Vector3', () => ({ x: 0, y: 0, z: 0 }), 50);

    // Vector2 pool for 2D positions
    this.createPool('Vector2', () => ({ x: 0, y: 0 }), 100);

    // Hand state pool
    this.createPool('HandState', () => ({
      isTracking: false,
      landmarks: null,
      gesture: 'NONE',
      confidence: 0,
      position: { x: 0, y: 0, z: 0 },
      fingerSpread: 0,
      pinchData: { isPinched: false, distance: 0 },
      handOrientation: { pitch: 0, yaw: 0, roll: 0 },
      timestamp: 0
    }), 20);

    // Landmark array pool
    this.createPool('LandmarkArray', () => new Array(21).fill(null).map(() => [0, 0, 0]), 10);

    // Prediction result pool
    this.createPool('PredictionResult', () => ({
      landmarks: [],
      handInViewConfidence: 0,
      boundingBox: { topLeft: [0, 0], bottomRight: [0, 0] }
    }), 15);

    // Matrix pool for transformations
    this.createPool('Matrix3x3', () => [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ], 10);

    // Performance metrics pool
    this.createPool('PerformanceMetrics', () => ({
      fps: 0,
      latency: 0,
      processingTime: 0,
      memoryUsage: 0,
      timestamp: 0
    }), 30);

    // Gesture result pool
    this.createPool('GestureResult', () => ({
      gesture: 'NONE',
      confidence: 0,
      metadata: {}
    }), 25);

    // Bounding box pool
    this.createPool('BoundingBox', () => ({
      x: 0, y: 0, width: 0, height: 0,
      topLeft: [0, 0],
      bottomRight: [0, 0]
    }), 20);
  }

  /**
   * Create a new object pool
   * @param {string} poolName - Name of the pool
   * @param {Function} factory - Factory function to create new objects
   * @param {number} initialSize - Initial pool size
   * @param {number} maxSize - Maximum pool size
   */
  createPool(poolName, factory, initialSize = 10, maxSize = 100) {
    const pool = {
      factory: factory,
      available: [],
      inUse: new Set(),
      maxSize: maxSize,
      stats: {
        created: 0,
        reused: 0,
        disposed: 0
      }
    };

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      const obj = factory();
      obj._poolName = poolName;
      obj._poolId = this.generateId();
      pool.available.push(obj);
      pool.stats.created++;
    }

    this.pools.set(poolName, pool);
    console.log(`📦 Created pool '${poolName}' with ${initialSize} objects`);
  }

  /**
   * Get an object from the pool
   * @param {string} poolName - Name of the pool
   * @param {Function} resetFn - Optional reset function
   * @returns {Object} Pooled object
   */
  get(poolName, resetFn = null) {
    const pool = this.pools.get(poolName);
    if (!pool) {
      console.warn(`⚠️ Pool '${poolName}' not found`);
      this.stats.poolMisses++;
      return pool.factory();
    }

    let obj;

    if (pool.available.length > 0) {
      // Reuse existing object
      obj = pool.available.pop();
      pool.stats.reused++;
      this.stats.totalReuses++;
      this.stats.poolHits++;
    } else {
      // Create new object if pool is empty and under max size
      if (pool.inUse.size < pool.maxSize) {
        obj = pool.factory();
        obj._poolName = poolName;
        obj._poolId = this.generateId();
        pool.stats.created++;
        this.stats.totalAllocations++;
      } else {
        console.warn(`⚠️ Pool '${poolName}' at maximum capacity`);
        this.stats.poolMisses++;
        return pool.factory();
      }
    }

    // Reset object if reset function provided
    if (resetFn && typeof resetFn === 'function') {
      resetFn(obj);
    } else {
      this.resetObject(obj, poolName);
    }

    pool.inUse.add(obj);
    return obj;
  }

  /**
   * Return an object to the pool
   * @param {Object} obj - Object to return
   */
  release(obj) {
    if (!obj || !obj._poolName) {
      return; // Not a pooled object
    }

    const pool = this.pools.get(obj._poolName);
    if (!pool) {
      return;
    }

    // Remove from in-use set
    pool.inUse.delete(obj);

    // Add back to available pool if there's space
    if (pool.available.length < pool.maxSize) {
      pool.available.push(obj);
    } else {
      // Pool is full, dispose object
      pool.stats.disposed++;
      this.stats.memoryFreed++;
    }
  }

  /**
   * Reset object to default state
   * @param {Object} obj - Object to reset
   * @param {string} poolName - Pool name for type-specific reset
   */
  resetObject(obj, poolName) {
    switch (poolName) {
      case 'Vector3':
        obj.x = 0;
        obj.y = 0;
        obj.z = 0;
        break;

      case 'Vector2':
        obj.x = 0;
        obj.y = 0;
        break;

      case 'HandState':
        obj.isTracking = false;
        obj.landmarks = null;
        obj.gesture = 'NONE';
        obj.confidence = 0;
        obj.position.x = 0;
        obj.position.y = 0;
        obj.position.z = 0;
        obj.fingerSpread = 0;
        obj.pinchData.isPinched = false;
        obj.pinchData.distance = 0;
        obj.handOrientation.pitch = 0;
        obj.handOrientation.yaw = 0;
        obj.handOrientation.roll = 0;
        obj.timestamp = 0;
        break;

      case 'LandmarkArray':
        for (let i = 0; i < obj.length; i++) {
          if (obj[i]) {
            obj[i][0] = 0;
            obj[i][1] = 0;
            obj[i][2] = 0;
          }
        }
        break;

      case 'PredictionResult':
        obj.landmarks = [];
        obj.handInViewConfidence = 0;
        obj.boundingBox.topLeft[0] = 0;
        obj.boundingBox.topLeft[1] = 0;
        obj.boundingBox.bottomRight[0] = 0;
        obj.boundingBox.bottomRight[1] = 0;
        break;

      case 'Matrix3x3':
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            obj[i][j] = (i === j) ? 1 : 0;
          }
        }
        break;

      case 'PerformanceMetrics':
        obj.fps = 0;
        obj.latency = 0;
        obj.processingTime = 0;
        obj.memoryUsage = 0;
        obj.timestamp = 0;
        break;

      case 'GestureResult':
        obj.gesture = 'NONE';
        obj.confidence = 0;
        obj.metadata = {};
        break;

      case 'BoundingBox':
        obj.x = 0;
        obj.y = 0;
        obj.width = 0;
        obj.height = 0;
        obj.topLeft[0] = 0;
        obj.topLeft[1] = 0;
        obj.bottomRight[0] = 0;
        obj.bottomRight[1] = 0;
        break;

      default:
        // Generic reset - clear all enumerable properties
        for (const key in obj) {
          if (obj.hasOwnProperty(key) && !key.startsWith('_pool')) {
            if (typeof obj[key] === 'number') {
              obj[key] = 0;
            } else if (typeof obj[key] === 'string') {
              obj[key] = '';
            } else if (typeof obj[key] === 'boolean') {
              obj[key] = false;
            } else if (Array.isArray(obj[key])) {
              obj[key].length = 0;
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              // Don't reset nested objects to avoid breaking references
            }
          }
        }
    }
  }

  /**
   * Create a scoped pool manager for temporary objects
   * @returns {Object} Scoped manager with automatic cleanup
   */
  createScope() {
    const scopedObjects = [];

    return {
      get: (poolName, resetFn) => {
        const obj = this.get(poolName, resetFn);
        scopedObjects.push(obj);
        return obj;
      },

      release: () => {
        scopedObjects.forEach(obj => this.release(obj));
        scopedObjects.length = 0;
      }
    };
  }

  /**
   * Get pool statistics
   * @param {string} poolName - Optional specific pool name
   * @returns {Object} Pool statistics
   */
  getStats(poolName = null) {
    if (poolName) {
      const pool = this.pools.get(poolName);
      if (!pool) {
        return null;
      }

      return {
        poolName: poolName,
        available: pool.available.length,
        inUse: pool.inUse.size,
        maxSize: pool.maxSize,
        ...pool.stats
      };
    }

    // Return overall stats
    const poolStats = {};
    for (const [name, pool] of this.pools) {
      poolStats[name] = {
        available: pool.available.length,
        inUse: pool.inUse.size,
        maxSize: pool.maxSize,
        ...pool.stats
      };
    }

    return {
      overall: this.stats,
      pools: poolStats,
      totalPools: this.pools.size
    };
  }

  /**
   * Clear a specific pool or all pools
   * @param {string} poolName - Optional specific pool name
   */
  clear(poolName = null) {
    if (poolName) {
      const pool = this.pools.get(poolName);
      if (pool) {
        pool.available.length = 0;
        pool.inUse.clear();
        pool.stats.disposed += pool.stats.created;
        pool.stats.created = 0;
        pool.stats.reused = 0;
        console.log(`🧹 Cleared pool '${poolName}'`);
      }
    } else {
      // Clear all pools
      for (const [name, pool] of this.pools) {
        pool.available.length = 0;
        pool.inUse.clear();
        pool.stats.disposed += pool.stats.created;
        pool.stats.created = 0;
        pool.stats.reused = 0;
      }
      console.log('🧹 Cleared all pools');
    }
  }

  /**
   * Generate unique ID for pooled objects
   * @returns {string} Unique ID
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Dispose the memory pool manager
   */
  dispose() {
    this.clear();
    this.pools.clear();
    console.log('🔄 MemoryPoolManager disposed');
  }
}

// Singleton instance
let memoryPoolManager = null;

/**
 * Get the singleton memory pool manager instance
 * @returns {MemoryPoolManager} Memory pool manager instance
 */
export function getMemoryPoolManager() {
  if (!memoryPoolManager) {
    memoryPoolManager = new MemoryPoolManager();
  }
  return memoryPoolManager;
}

export default MemoryPoolManager;
