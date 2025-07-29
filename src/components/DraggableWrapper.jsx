import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Draggable Wrapper Component
 * Makes any child component draggable with proper constraints and visual feedback
 */
const DraggableWrapper = ({
  children,
  initialPosition = { x: 0, y: 0 },
  className = '',
  dragHandleClassName = '',
  showDragHandle = true,
  constrainToViewport = true,
  onDragStart,
  onDragEnd,
  onDrag,
  disabled = false,
  zIndex = 1000
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const dragRef = useRef(null);

  /**
   * Calculate viewport constraints for dragging
   */
  const getConstraints = () => {
    if (!constrainToViewport || !dragRef.current) {
      return {};
    }

    const element = dragRef.current;
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    return {
      left: -rect.width / 2,
      right: viewportWidth - rect.width / 2,
      top: -rect.height / 2,
      bottom: viewportHeight - rect.height / 2
    };
  };

  /**
   * Handle drag start
   */
  const handleDragStart = (event, info) => {
    setIsDragging(true);
    onDragStart?.(event, info);
  };

  /**
   * Handle drag
   */
  const handleDrag = (event, info) => {
    setPosition({ x: info.point.x, y: info.point.y });
    onDrag?.(event, info);
  };

  /**
   * Handle drag end
   */
  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    setPosition({ x: info.point.x, y: info.point.y });
    onDragEnd?.(event, info);
  };

  return (
    <motion.div
      ref={dragRef}
      drag={!disabled}
      dragConstraints={getConstraints()}
      dragElastic={0.1}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      initial={{ x: initialPosition.x, y: initialPosition.y }}
      className={`draggable-wrapper ${className}`}
      style={{
        position: 'fixed',
        zIndex: isDragging ? zIndex + 100 : zIndex,
        cursor: isDragging ? 'grabbing' : disabled ? 'default' : 'grab',
        opacity: isDragging ? 0.9 : 1,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease, opacity 0.2s ease'
      }}
      whileDrag={{
        scale: 1.02,
        opacity: 0.9,
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}
    >
      {/* Drag Handle */}
      {showDragHandle && !disabled && (
        <div
          className={`drag-handle ${dragHandleClassName}`}
          style={{
            position: 'absolute',
            top: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '30px',
            height: '6px',
            backgroundColor: isDragging ? '#3b82f6' : '#6b7280',
            borderRadius: '3px',
            cursor: 'grab',
            opacity: isDragging ? 1 : 0.6,
            transition: 'all 0.2s ease',
            zIndex: 1
          }}
        />
      )}

      {/* Drag Indicator Dots */}
      {showDragHandle && !disabled && (
        <div
          className="drag-dots"
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            display: 'flex',
            gap: '2px',
            opacity: isDragging ? 1 : 0.4,
            transition: 'opacity 0.2s ease'
          }}
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              style={{
                width: '2px',
                height: '2px',
                backgroundColor: '#6b7280',
                borderRadius: '50%'
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div
        className="draggable-content"
        style={{
          position: 'relative',
          pointerEvents: isDragging ? 'none' : 'auto'
        }}
      >
        {children}
      </div>

      {/* Drag Status Indicator */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          style={{
            position: 'absolute',
            bottom: '-25px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1f2937',
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          Dragging...
        </motion.div>
      )}
    </motion.div>
  );
};

export default DraggableWrapper;
