import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Timeline, Progress, Badge, Typography, Space, Button, Statistic } from 'antd';
import { TrophyOutlined, CheckCircleOutlined, ClockCircleOutlined, MinusOutlined, ExpandOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

/**
 * Enhanced HUD component to display game objectives and progress using Ant Design
 */
const ObjectivesHUD = ({
  objectives = [],
  progress = {},
  completionRate = 0,
  isActive = false,
  className = '',
  position = 'bottom-left',
  minimized = false,
  onToggleMinimize
}) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getObjectiveIcon = (type) => {
    const icons = {
      count: '🎯',
      combo: '🔥',
      interaction: '🤝',
      time: '⏱️',
      accuracy: '🎪'
    };
    return icons[type] || '📋';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive || objectives.length === 0) {
    return null;
  }

  return (
    <motion.div
      className={`fixed ${positionClasses[position]} z-20 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: 1,
        width: minimized ? '60px' : '320px',
        height: minimized ? '60px' : 'auto'
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <Card
        size="small"
        title={
          !minimized && (
            <Space>
              <TrophyOutlined style={{ color: '#22c55e', fontSize: '16px' }} />
              <Title level={5} style={{ margin: 0, color: '#ffffff' }}>
                Objectives
              </Title>
              <Badge
                count={`${Math.round(completionRate)}%`}
                style={{ backgroundColor: '#22c55e' }}
              />
            </Space>
          )
        }
        extra={
          onToggleMinimize && (
            <Button
              type="text"
              size="small"
              icon={minimized ? <ExpandOutlined /> : <MinusOutlined />}
              onClick={onToggleMinimize}
              style={{ color: '#22c55e' }}
            />
          )
        }
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: minimized ? '50%' : '12px',
        }}
        styles={{
          body: {
            padding: minimized ? 0 : 16,
            display: minimized ? 'flex' : 'block',
            alignItems: minimized ? 'center' : 'stretch',
            justifyContent: minimized ? 'center' : 'flex-start'
          }
        }}
      >
        {minimized ? (
          <TrophyOutlined style={{ color: '#22c55e', fontSize: '20px' }} />
        ) : (
          <Timeline>
            {objectives.map((objective, index) => {
              const objProgress = progress[objective.id] || objective.progress || 0;
              const isCompleted = objective.completed || objProgress >= 100;

              return (
                <Timeline.Item
                  key={objective.id}
                  dot={
                    isCompleted ? (
                      <CheckCircleOutlined style={{ color: '#22c55e' }} />
                    ) : (
                      <ClockCircleOutlined style={{ color: '#9ca3af' }} />
                    )
                  }
                  color={isCompleted ? '#22c55e' : '#9ca3af'}
                >
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text style={{
                      color: isCompleted ? '#22c55e' : '#ffffff',
                      fontSize: '12px',
                      fontWeight: isCompleted ? 'bold' : 'normal'
                    }}>
                      {getObjectiveIcon(objective.type)} {objective.name || objective.description}
                    </Text>

                    {objective.description && objective.name && (
                      <Text style={{ color: '#9ca3af', fontSize: '10px' }}>
                        {objective.description}
                      </Text>
                    )}

                    {objective.target && (
                      <Text style={{ color: '#9ca3af', fontSize: '10px' }}>
                        {objective.type === 'time' ? (
                          `${formatTime(objProgress)} / ${formatTime(objective.target)}`
                        ) : (
                          `${Math.floor(objProgress)} / ${objective.target}`
                        )}
                      </Text>
                    )}

                    <Progress
                      percent={Math.min(objProgress, 100)}
                      size="small"
                      status={isCompleted ? 'success' : 'active'}
                      strokeColor="#22c55e"
                      trailColor="rgba(255, 255, 255, 0.1)"
                      showInfo={false}
                    />
                  </Space>
                </Timeline.Item>
              );
            })}
          </Timeline>
        )}
      </Card>
    </motion.div>
  );
};

export default ObjectivesHUD;
