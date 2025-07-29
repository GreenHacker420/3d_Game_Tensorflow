import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button, Tooltip, Progress, Spin, List, Typography } from 'antd';
import {
  MinusOutlined,
  ExpandOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ControlOutlined
} from '@ant-design/icons';
import { GESTURE_TYPES } from '../utils/gestureRecognition';
import DraggableWrapper from './DraggableWrapper.jsx';

const HandTrackingHUD = ({ 
  handState = {}, 
  isLoading = false, 
  objects = [], 
  selectedObject = null,
  isMinimized = false,
  onToggleMinimize = () => {}
}) => {
  const getGestureIcon = () => {
    if (!handState.isTracking) return '❌';
    
    const gestureIcons = {
      [GESTURE_TYPES.OPEN_HAND]: '✋',
      [GESTURE_TYPES.CLOSED_FIST]: '✊',
      [GESTURE_TYPES.PINCH]: '🤏',
      [GESTURE_TYPES.POINT]: '👆',
      [GESTURE_TYPES.VICTORY]: '✌️',
      [GESTURE_TYPES.THUMBS_UP]: '👍',
      [GESTURE_TYPES.ROCK_ON]: '🤘',
      [GESTURE_TYPES.OK_SIGN]: '👌',
      [GESTURE_TYPES.NO_HAND]: '❌'
    };
    
    return gestureIcons[handState.gesture] || '✋';
  };

  const getGestureText = () => {
    if (!handState.isTracking) return 'No Hand Detected';
    
    const gestureNames = {
      [GESTURE_TYPES.OPEN_HAND]: 'Open Hand - Move Objects',
      [GESTURE_TYPES.CLOSED_FIST]: 'Closed Fist - Grab Objects',
      [GESTURE_TYPES.PINCH]: 'Pinch - Resize Objects',
      [GESTURE_TYPES.POINT]: 'Point - Select Objects',
      [GESTURE_TYPES.VICTORY]: 'Victory - Special Effects',
      [GESTURE_TYPES.THUMBS_UP]: 'Thumbs Up - Activate',
      [GESTURE_TYPES.ROCK_ON]: 'Rock On - Transform',
      [GESTURE_TYPES.OK_SIGN]: 'OK Sign - Reset',
      [GESTURE_TYPES.NO_HAND]: 'No Gesture'
    };
    
    return gestureNames[handState.gesture] || 'Unknown Gesture';
  };

  const getStatusBadge = () => {
    if (!handState.isTracking) return { status: 'error', text: 'No Hand' };
    if (handState.gesture === GESTURE_TYPES.PINCH) return { status: 'warning', text: 'Pinching' };
    return { status: 'success', text: 'Tracking' };
  };

  const getConfidenceStatus = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'normal';
    if (confidence >= 0.4) return 'exception';
    return 'exception';
  };

  return (
    <DraggableWrapper
      initialPosition={{ x: 20, y: 100 }}
      zIndex={25}
      className="hand-tracking-hud-draggable"
    >
      <motion.div
        animate={{
          width: isMinimized ? '60px' : '380px',
          height: isMinimized ? '60px' : 'auto'
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <Card
          size="small"
          style={{
            width: isMinimized ? 60 : 380,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '2px solid #22c55e',
            borderRadius: isMinimized ? '50%' : '16px',
          }}
          title={
            !isMinimized && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ControlOutlined style={{ color: '#22c55e' }} />
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>Hand Tracking</span>
                </div>
                <Tooltip title={isMinimized ? 'Maximize HUD (H)' : 'Minimize HUD (H)'}>
                  <Button
                    type="text"
                    size="small"
                    icon={isMinimized ? <ExpandOutlined /> : <MinusOutlined />}
                    onClick={onToggleMinimize}
                    style={{ color: '#22c55e' }}
                  />
                </Tooltip>
              </div>
            )
          }
          extra={
            isMinimized && (
              <Tooltip title="Maximize HUD (H)">
                <Button
                  type="text"
                  size="small"
                  icon="👋"
                  onClick={onToggleMinimize}
                  style={{ color: '#22c55e', border: 'none', background: 'transparent' }}
                />
              </Tooltip>
            )
          }
        >

          {/* Loading Indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  zIndex: 10,
                }}
              >
                <Spin size="large" />
                <Typography.Title level={4} style={{ color: '#ffffff', marginTop: 16 }}>
                  Initializing Hand Detection...
                </Typography.Title>
                <Typography.Text style={{ color: '#9ca3af' }}>
                  Please ensure your webcam is enabled
                </Typography.Text>
              </motion.div>
            )}
          </AnimatePresence>

          {/* HUD Content - Hidden when minimized */}
          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{ padding: '16px' }}
              >
                {/* Hand Status Section */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <motion.span
                      style={{ fontSize: '24px' }}
                      animate={{ scale: handState.isTracking ? 1.1 : 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      {getGestureIcon()}
                    </motion.span>
                    <div>
                      <Badge
                        status={getStatusBadge().status}
                        text={getStatusBadge().text}
                        style={{ color: '#ffffff' }}
                      />
                      <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: 4 }}>
                        Position: ({Math.round(handState.position?.x || 0)}, {Math.round(handState.position?.y || 0)})
                      </div>
                    </div>
                  </div>

                  {/* Confidence Progress */}
                  {handState.isTracking && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ color: '#d1d5db', fontSize: '12px' }}>Tracking Quality</span>
                        <span style={{ color: '#d1d5db', fontSize: '12px' }}>
                          {Math.round((handState.confidence || 0.8) * 100)}%
                        </span>
                      </div>
                      <Progress
                        percent={Math.round((handState.confidence || 0.8) * 100)}
                        size="small"
                        status={getConfidenceStatus(handState.confidence || 0.8)}
                        strokeColor="#22c55e"
                        trailColor="rgba(255, 255, 255, 0.1)"
                        showInfo={false}
                      />
                    </div>
                  )}
                </div>

                {/* Objects Status */}
                {objects.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <Typography.Text strong style={{ color: '#d1d5db', fontSize: '14px' }}>
                      🎯 Objects ({objects.length})
                    </Typography.Text>
                    <List
                      size="small"
                      dataSource={objects}
                      renderItem={(obj) => (
                        <List.Item
                          style={{
                            padding: '8px 0',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                            <span style={{ fontSize: '16px' }}>
                              {obj.type === 'cube' && '🟧'}
                              {obj.type === 'sphere' && '🔴'}
                              {obj.type === 'pyramid' && '🔺'}
                              {obj.type === 'cylinder' && '🟡'}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={{ color: '#ffffff', fontSize: '12px', fontWeight: 500 }}>
                                {obj.type.charAt(0).toUpperCase() + obj.type.slice(1)}
                              </div>
                              <div style={{ color: '#9ca3af', fontSize: '11px' }}>
                                Scale: {obj.scale?.x?.toFixed(1) || '1.0'}x
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {obj.isSelected && (
                                <Badge status="success" text="Selected" style={{ fontSize: '10px' }} />
                              )}
                              {obj.isGrabbed && (
                                <Badge status="warning" text="Grabbed" style={{ fontSize: '10px' }} />
                              )}
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                )}

                {/* Gesture Instructions */}
                <div style={{ marginBottom: 16 }}>
                  <Typography.Text strong style={{ color: '#d1d5db', fontSize: '14px' }}>
                    🎮 Gesture Controls
                  </Typography.Text>
                  <List
                    size="small"
                    dataSource={[
                      { gesture: GESTURE_TYPES.OPEN_HAND, icon: '✋', name: 'Open Hand', desc: 'Move objects' },
                      { gesture: GESTURE_TYPES.CLOSED_FIST, icon: '✊', name: 'Fist', desc: 'Hold 1s: Grab' },
                      { gesture: GESTURE_TYPES.PINCH, icon: '🤏', name: 'Pinch', desc: 'Resize objects' },
                      { gesture: GESTURE_TYPES.POINT, icon: '👆', name: 'Point', desc: 'Hold 0.8s: Select' }
                    ]}
                    renderItem={({ gesture, icon, name, desc }) => (
                      <List.Item
                        style={{
                          padding: '6px 0',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                          opacity: handState.gesture === gesture ? 1 : 0.7,
                          transform: handState.gesture === gesture ? 'scale(1.02)' : 'scale(1)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '16px' }}>{icon}</span>
                          <div>
                            <div style={{ color: '#ffffff', fontSize: '12px', fontWeight: 500 }}>
                              {name}
                            </div>
                            <div style={{ color: '#9ca3af', fontSize: '11px' }}>
                              {desc}
                            </div>
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                </div>

                {/* Performance Metrics */}
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ color: '#9ca3af', fontSize: '11px' }}>FPS</div>
                    <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600 }}>60</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ color: '#9ca3af', fontSize: '11px' }}>Latency</div>
                    <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: 600 }}>~50ms</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </DraggableWrapper>
  );
};

export default HandTrackingHUD;
