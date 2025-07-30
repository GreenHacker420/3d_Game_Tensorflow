/**
 * Utility functions for safe formatting of numeric values
 * Provides consistent formatting across the application with proper error handling
 */

/**
 * Safely format a numeric value with fallback
 * @param {any} value - Value to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @param {string} fallback - Fallback value if not a number (default: '0.0')
 * @returns {string} Formatted value
 */
export const safeFormatNumber = (value, decimals = 1, fallback = '0.0') => {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value.toFixed(decimals);
  }
  return fallback;
};

/**
 * Safely format a coordinate value (typically 1 decimal place)
 * @param {any} value - Coordinate value to format
 * @param {string} fallback - Fallback value (default: '0.0')
 * @returns {string} Formatted coordinate
 */
export const safeFormatCoordinate = (value, fallback = '0.0') => {
  return safeFormatNumber(value, 1, fallback);
};

/**
 * Safely format a scale value (typically 2 decimal places)
 * @param {any} value - Scale value to format
 * @param {string} fallback - Fallback value (default: '1.00')
 * @returns {string} Formatted scale
 */
export const safeFormatScale = (value, fallback = '1.00') => {
  return safeFormatNumber(value, 2, fallback);
};

/**
 * Safely format an integer value
 * @param {any} value - Value to format
 * @param {string} fallback - Fallback value (default: '0')
 * @returns {string} Formatted integer
 */
export const safeFormatInteger = (value, fallback = '0') => {
  return safeFormatNumber(value, 0, fallback);
};

/**
 * Safely format a percentage value
 * @param {any} value - Value to format (0-100)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @param {string} fallback - Fallback value (default: '0.0')
 * @returns {string} Formatted percentage with % symbol
 */
export const safeFormatPercentage = (value, decimals = 1, fallback = '0.0') => {
  const formatted = safeFormatNumber(value, decimals, fallback);
  return `${formatted}%`;
};

/**
 * Safely extract and format Vector3 position object
 * @param {Object|Vector3} position - Position object or Vector3
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {Object} Formatted position object {x, y, z}
 */
export const safeFormatPosition = (position, decimals = 1) => {
  if (!position) {
    return {
      x: safeFormatNumber(0, decimals),
      y: safeFormatNumber(0, decimals),
      z: safeFormatNumber(0, decimals)
    };
  }

  return {
    x: safeFormatNumber(position.x, decimals),
    y: safeFormatNumber(position.y, decimals),
    z: safeFormatNumber(position.z, decimals)
  };
};

/**
 * Safely extract and format Vector3 scale object to a single numeric value
 * Assumes uniform scaling and uses the x component
 * @param {Object|Vector3|number} scale - Scale object, Vector3, or number
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted scale value
 */
export const safeFormatScaleValue = (scale, decimals = 2) => {
  if (typeof scale === 'number') {
    return safeFormatNumber(scale, decimals, '1.00');
  }
  
  if (scale && typeof scale === 'object' && typeof scale.x === 'number') {
    return safeFormatNumber(scale.x, decimals, '1.00');
  }
  
  return '1.00';
};

/**
 * Safely format time in seconds to MM:SS format
 * @param {any} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export const safeFormatTime = (seconds) => {
  const numSeconds = typeof seconds === 'number' && !isNaN(seconds) ? seconds : 0;
  const mins = Math.floor(numSeconds / 60);
  const secs = Math.floor(numSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Validate and sanitize numeric input
 * @param {any} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {number} defaultValue - Default value if invalid
 * @returns {number} Validated numeric value
 */
export const validateNumericValue = (value, min = -Infinity, max = Infinity, defaultValue = 0) => {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return defaultValue;
  }
  
  return Math.max(min, Math.min(max, value));
};

/**
 * Check if a value is a valid numeric value
 * @param {any} value - Value to check
 * @returns {boolean} True if value is a valid number
 */
export const isValidNumber = (value) => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

/**
 * Format object information for display with safe handling
 * @param {Object} obj - Object with position, scale, rotation properties
 * @returns {Object} Formatted object information
 */
export const formatObjectInfo = (obj) => {
  if (!obj) {
    return {
      position: { x: '0.0', y: '0.0', z: '0.0' },
      scale: '1.00',
      rotation: { x: '0.0', y: '0.0', z: '0.0' }
    };
  }

  return {
    position: safeFormatPosition(obj.position),
    scale: safeFormatScaleValue(obj.scale),
    rotation: safeFormatPosition(obj.rotation)
  };
};
