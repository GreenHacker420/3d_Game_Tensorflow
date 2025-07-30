# 🔄 Component Migration Examples

## 1. GameModeSelector Migration

### Before (Custom CSS + Framer Motion)
```jsx
// GameModeSelector.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './GameModeSelector.css';

const GameModeSelector = ({ onModeSelect, onClose, isVisible }) => {
  return (
    <motion.div className="game-mode-overlay">
      <div className="modes-container">
        <div className="modes-grid">
          {modes.map((mode) => (
            <motion.div
              key={mode.id}
              className="mode-card"
              whileHover={{ scale: 1.05, y: -5 }}
              onClick={() => handleModeClick(mode)}
            >
              <div className="mode-icon">{mode.icon}</div>
              <h3 className="mode-name">{mode.name}</h3>
              <p className="mode-description">{mode.description}</p>
              <button className="start-mode-btn">
                Start {mode.name}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
```

### After (Ant Design + Framer Motion)
```jsx
// GameModeSelector.jsx
import React, { useState } from 'react';
import { Modal, Card, Button, Row, Col, Typography, Badge, Space } from 'antd';
import { motion } from 'framer-motion';
import { PlayCircleOutlined, TrophyOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const GameModeSelector = ({ onModeSelect, onClose, isVisible }) => {
  return (
    <Modal
      title={
        <Space>
          <TrophyOutlined style={{ color: '#22c55e' }} />
          <Title level={3} style={{ margin: 0, color: '#ffffff' }}>
            Select Game Mode
          </Title>
        </Space>
      }
      open={isVisible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      styles={{
        mask: { backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)' }
      }}
    >
      <Row gutter={[16, 16]}>
        {modes.map((mode) => (
          <Col span={12} key={mode.id}>
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                hoverable
                cover={
                  <div style={{ 
                    fontSize: '48px', 
                    textAlign: 'center', 
                    padding: '20px',
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))'
                  }}>
                    {mode.icon}
                  </div>
                }
                actions={[
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => onModeSelect(mode.id)}
                    disabled={currentMode === mode.id}
                  >
                    {currentMode === mode.id ? 'Currently Playing' : `Start ${mode.name}`}
                  </Button>
                ]}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: currentMode === mode.id ? '2px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Card.Meta
                  title={
                    <Space>
                      <Title level={4} style={{ margin: 0, color: '#ffffff' }}>
                        {mode.name}
                      </Title>
                      {currentMode === mode.id && (
                        <Badge status="processing" text="Active" />
                      )}
                    </Space>
                  }
                  description={
                    <Text style={{ color: '#9ca3af' }}>
                      {mode.description}
                    </Text>
                  }
                />
                <div style={{ marginTop: 12 }}>
                  <Space wrap>
                    {mode.features?.slice(0, 3).map((feature, index) => (
                      <Badge key={index} count={feature} style={{ backgroundColor: '#22c55e' }} />
                    ))}
                  </Space>
                </div>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>
    </Modal>
  );
};
```

## 2. ObjectivesHUD Migration

### Before (Tailwind + Framer Motion)
```jsx
// ObjectivesHUD.jsx
const ObjectivesHUD = ({ objectives, progress, completionRate }) => {
  return (
    <motion.div className="absolute bottom-4 left-4 z-10">
      <div className="bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium">Objectives</h3>
          <span className="text-green-400 text-sm">{completionRate}%</span>
        </div>
        
        <div className="space-y-2">
          {objectives.map((obj) => (
            <div key={obj.id} className="flex items-center gap-2">
              <span className="text-lg">{getObjectiveIcon(obj.type)}</span>
              <div className="flex-1">
                <div className="text-white text-xs">{obj.description}</div>
                <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                  <div 
                    className="bg-green-500 h-1 rounded-full transition-all"
                    style={{ width: `${obj.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
```

### After (Ant Design + Framer Motion)
```jsx
// ObjectivesHUD.jsx
import { Card, Timeline, Progress, Badge, Typography, Space } from 'antd';
import { TrophyOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const ObjectivesHUD = ({ objectives, progress, completionRate, minimized, onToggleMinimize }) => {
  return (
    <motion.div
      className="absolute bottom-4 left-4 z-10"
      animate={{
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
              <TrophyOutlined style={{ color: '#22c55e' }} />
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
          <Button
            type="text"
            size="small"
            icon={minimized ? <ExpandOutlined /> : <MinusOutlined />}
            onClick={onToggleMinimize}
            style={{ color: '#22c55e' }}
          />
        }
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: minimized ? '50%' : '12px',
        }}
        bodyStyle={{
          padding: minimized ? 0 : 16,
          display: minimized ? 'flex' : 'block',
          alignItems: minimized ? 'center' : 'stretch',
          justifyContent: minimized ? 'center' : 'flex-start'
        }}
      >
        {minimized ? (
          <TrophyOutlined style={{ color: '#22c55e', fontSize: '20px' }} />
        ) : (
          <Timeline>
            {objectives.map((obj) => (
              <Timeline.Item
                key={obj.id}
                dot={
                  obj.completed ? (
                    <CheckCircleOutlined style={{ color: '#22c55e' }} />
                  ) : (
                    <ClockCircleOutlined style={{ color: '#9ca3af' }} />
                  )
                }
                color={obj.completed ? '#22c55e' : '#9ca3af'}
              >
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Text style={{ color: '#ffffff', fontSize: '12px' }}>
                    {getObjectiveIcon(obj.type)} {obj.description}
                  </Text>
                  <Progress
                    percent={obj.progress}
                    size="small"
                    status={obj.completed ? 'success' : 'active'}
                    strokeColor="#22c55e"
                    trailColor="rgba(255, 255, 255, 0.1)"
                    showInfo={false}
                  />
                </Space>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Card>
    </motion.div>
  );
};
```

## 3. RewardsHUD Migration

### Before (Tailwind + Framer Motion)
```jsx
// RewardsHUD.jsx
const RewardsHUD = ({ activeRewards, comboStreak, totalPoints }) => {
  return (
    <motion.div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20">
      <div className="bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-yellow-400 text-2xl font-bold">{totalPoints}</div>
            <div className="text-white text-xs">Points</div>
          </div>
          
          {comboStreak > 0 && (
            <div className="text-center">
              <div className="text-orange-400 text-xl font-bold">{comboStreak}x</div>
              <div className="text-white text-xs">Combo</div>
            </div>
          )}
        </div>
        
        <div className="mt-3 space-y-1">
          {activeRewards.map((reward) => (
            <div key={reward.id} className="flex items-center gap-2 text-xs">
              <span className="text-green-400">+{reward.points}</span>
              <span className="text-white">{reward.name}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
```

### After (Ant Design + Framer Motion)
```jsx
// RewardsHUD.jsx
import { Card, Statistic, Badge, List, Space, Typography } from 'antd';
import { TrophyOutlined, FireOutlined, StarOutlined } from '@ant-design/icons';

const { Text } = Typography;

const RewardsHUD = ({ activeRewards, comboStreak, totalPoints, streakMultiplier }) => {
  return (
    <motion.div 
      className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        size="small"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          minWidth: '280px'
        }}
        bodyStyle={{ padding: '12px' }}
      >
        <Space direction="horizontal" size={16} style={{ width: '100%', justifyContent: 'center' }}>
          <Statistic
            title={<Text style={{ color: '#9ca3af', fontSize: '10px' }}>Total Points</Text>}
            value={totalPoints}
            valueStyle={{ color: '#ffd700', fontSize: '20px', fontWeight: 'bold' }}
            prefix={<TrophyOutlined />}
          />
          
          {comboStreak > 0 && (
            <Statistic
              title={<Text style={{ color: '#9ca3af', fontSize: '10px' }}>Combo Streak</Text>}
              value={`${comboStreak}x`}
              valueStyle={{ color: '#ff6b35', fontSize: '18px', fontWeight: 'bold' }}
              prefix={<FireOutlined />}
              suffix={
                <Badge 
                  count={`${streakMultiplier.toFixed(1)}x`} 
                  style={{ backgroundColor: '#ff6b35', fontSize: '10px' }} 
                />
              }
            />
          )}
        </Space>
        
        {activeRewards.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <List
              size="small"
              dataSource={activeRewards.slice(0, 3)}
              renderItem={(reward) => (
                <List.Item style={{ padding: '4px 0', border: 'none' }}>
                  <Space>
                    <StarOutlined style={{ color: '#22c55e' }} />
                    <Text style={{ color: '#22c55e', fontSize: '11px', fontWeight: 'bold' }}>
                      +{reward.points}
                    </Text>
                    <Text style={{ color: '#ffffff', fontSize: '11px' }}>
                      {reward.name}
                    </Text>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        )}
      </Card>
    </motion.div>
  );
};
```
