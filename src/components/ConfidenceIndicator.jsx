import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Progress, Badge, Button, Tooltip } from 'antd';
import { BarChartOutlined, LineChartOutlined } from '@ant-design/icons';
import DraggableWrapper from './DraggableWrapper.jsx';

/**
 * Real-time Confidence Indicator Component
 * Shows detection confidence, quality metrics, and adaptive mapping status
 */
const ConfidenceIndicator = ({
  handState,
  qualityMetrics,
  adaptiveMapping = null,
  position = 'top-right',
  minimized = false,
  onToggleMinimize = null,
  className = ''
}) => {
  const getConfidenceStatus = (confidence) => {
    if (confidence >= 0.8) return { status: 'success', color: '#22c55e' };
    if (confidence >= 0.6) return { status: 'normal', color: '#eab308' };
    if (confidence >= 0.4) return { status: 'exception', color: '#f97316' };
    return { status: 'exception', color: '#ef4444' };
  };

  const getTrackingBadgeStatus = (isTracking) => {
    return isTracking ? 'success' : 'error';
  };

  const getTrackingBadgeText = (isTracking) => {
    return isTracking ? 'Tracking' : 'No Hand';
  };

  if (!handState) {
    return null;
  }

  return (
    <DraggableWrapper
      initialPosition={{ x: 20, y: 20 }}
      zIndex={30}
      className="confidence-indicator-draggable"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          size="small"
          style={{
            minWidth: 200,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge
                  status={getTrackingBadgeStatus(handState.isTracking)}
                  text={getTrackingBadgeText(handState.isTracking)}
                  style={{ color: '#ffffff' }}
                />
              </div>
              {onToggleMinimize && (
                <Tooltip title={minimized ? 'Expand' : 'Minimize'}>
                  <Button
                    type="text"
                    size="small"
                    icon={minimized ? <BarChartOutlined /> : <LineChartOutlined />}
                    onClick={onToggleMinimize}
                    style={{ color: '#9ca3af' }}
                  />
                </Tooltip>
              )}
            </div>
          }
        >

          <AnimatePresence>
            {!minimized && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Main Confidence */}
                  {handState.isTracking && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: '#d1d5db' }}>Detection Confidence</span>
                        <span className="text-xs font-medium" style={{ color: getConfidenceStatus(handState.confidence).color }}>
                          {Math.round(handState.confidence * 100)}%
                        </span>
                      </div>

                      {/* Confidence Progress Bar */}
                      <Progress
                        percent={Math.round(handState.confidence * 100)}
                        size="small"
                        status={getConfidenceStatus(handState.confidence).status}
                        strokeColor={getConfidenceStatus(handState.confidence).color}
                        trailColor="rgba(255, 255, 255, 0.1)"
                        showInfo={false}
                      />
                    </div>
                  )}

                {/* Quality Metrics */}
                {/* {qualityMetrics && (
                  <div className="space-y-2"> */}
                    {/* <span className="text-xs text-gray-300">Quality Metrics</span> */}
                    
                    {/* Stability */}
                    {/* <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Stability</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full ${getQualityColor(qualityMetrics.stability)}`}
                            style={{ width: `${qualityMetrics.stability * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-300 w-8">
                          {Math.round(qualityMetrics.stability * 100)}%
                        </span>
                      </div>
                    </div> */}

                    {/* Accuracy */}
                    {/* <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Accuracy</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full ${getQualityColor(qualityMetrics.accuracy)}`}
                            style={{ width: `${qualityMetrics.accuracy * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-300 w-8">
                          {Math.round(qualityMetrics.accuracy * 100)}%
                        </span>
                      </div>
                    </div> */}

                    {/* Responsiveness */}
                    {/* <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Response</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full ${getQualityColor(qualityMetrics.responsiveness)}`}
                            style={{ width: `${qualityMetrics.responsiveness * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-300 w-8">
                          {Math.round(qualityMetrics.responsiveness * 100)}%
                        </span>
                      </div>
                    </div> */}

                    {/* Overall Quality */}
                    {/* <div className="flex items-center justify-between pt-1 border-t border-gray-700">
                      <span className="text-xs font-medium text-gray-300">Overall</span>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${getConfidenceColor(qualityMetrics.overallQuality)}`}>
                        {Math.round(qualityMetrics.overallQuality * 100)}%
                      </span>
                    </div> */}
                  {/* </div> 
                  
                  )} */}
                

                  {/* Adaptive Mapping Status */}
                  {adaptiveMapping && (
                    <div className="space-y-2 pt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <span className="text-xs" style={{ color: '#d1d5db' }}>Adaptive Mapping</span>

                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: '#9ca3af' }}>Status</span>
                        <div className="flex items-center gap-1">
                          <Badge
                            status={adaptiveMapping.isActive ? 'success' : 'default'}
                            text={adaptiveMapping.isActive ? 'Active' : 'Inactive'}
                            style={{ color: '#d1d5db' }}
                          />
                        </div>
                      </div>

                      {adaptiveMapping.isActive && (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-xs" style={{ color: '#9ca3af' }}>Calibrated</span>
                            <span className="text-xs" style={{ color: '#d1d5db' }}>
                              {adaptiveMapping.isCalibrated ? '✅' : '❌'}
                            </span>
                          </div>

                          {adaptiveMapping.boundaryViolations !== undefined && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs" style={{ color: '#9ca3af' }}>Violations</span>
                              <span className="text-xs" style={{ color: '#d1d5db' }}>
                                {adaptiveMapping.boundaryViolations}
                              </span>
                            </div>
                          )}

                          {adaptiveMapping.latency !== undefined && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs" style={{ color: '#9ca3af' }}>Latency</span>
                              <span className="text-xs" style={{ color: '#d1d5db' }}>
                                {adaptiveMapping.latency.toFixed(1)}ms
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Current Gesture */}
                  {handState.gesture && handState.gesture !== 'NO_HAND' && (
                    <div className="pt-2" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: '#d1d5db' }}>Gesture</span>
                        <Badge
                          color="#3b82f6"
                          text={handState.gesture.replace('_', ' ')}
                          style={{ color: '#93c5fd' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </DraggableWrapper>
  );
};

export default ConfidenceIndicator;
