import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Card, Button, Row, Col, Typography, Badge, Space, Tag, Divider } from 'antd';
import { PlayCircleOutlined, TrophyOutlined, ArrowLeftOutlined, CloseOutlined } from '@ant-design/icons';
import { getAllModes } from '../utils/GameModes';

const { Title, Text, Paragraph } = Typography;

const GameModeSelector = ({ 
  onModeSelect = () => {},
  onClose = () => {},
  currentMode = null,
  isVisible = false 
}) => {
  const [selectedMode, setSelectedMode] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const modes = getAllModes();

  const handleModeClick = (mode) => {
    setSelectedMode(mode);
    setShowDetails(true);
  };

  const handleStartMode = () => {
    if (selectedMode) {
      onModeSelect(selectedMode.id);
      onClose();
    }
  };

  const getModeFeaturesList = (mode) => {
    const features = [];
    if (mode.features.timeLimit) features.push('⏱️ Time Limit');
    if (mode.features.scoring) features.push('🏆 Scoring');
    if (mode.features.objectives) features.push('🎯 Objectives');
    if (mode.features.physicsEnabled) features.push('⚡ Physics');
    if (mode.features.comboSystem) features.push('🔗 Combos');
    return features;
  };

  const getModeSettings = (mode) => {
    const settings = [];
    if (mode.settings.timeLimit) settings.push(`Time: ${mode.settings.timeLimit}s`);
    if (mode.settings.objectSpawnRate) settings.push(`Spawn Rate: ${mode.settings.objectSpawnRate}s`);
    if (mode.settings.speedMultiplier) settings.push(`Speed: ${mode.settings.speedMultiplier}x`);
    if (mode.settings.sequenceLength) settings.push(`Sequence: ${mode.settings.sequenceLength}`);
    return settings;
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <Modal
          title={
            <Space>
              <TrophyOutlined style={{ color: '#22c55e', fontSize: '20px' }} />
              <Title level={3} style={{ margin: 0, color: '#ffffff' }}>
                Select Game Mode
              </Title>
            </Space>
          }
          open={isVisible}
          onCancel={onClose}
          footer={null}
          width={900}
          centered
          closeIcon={<CloseOutlined style={{ color: '#ffffff' }} />}
          styles={{
            mask: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)'
            },
            content: {
              backgroundColor: 'rgba(20, 20, 30, 0.95)',
              border: '2px solid #22c55e',
              borderRadius: '20px',
            },
            header: {
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderBottom: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '20px 20px 0 0',
            }
          }}
        >

          {!showDetails ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ padding: '20px' }}
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
                            key="select"
                            type="primary"
                            icon={<PlayCircleOutlined />}
                            onClick={() => handleModeClick(mode)}
                            disabled={currentMode === mode.id}
                            style={{
                              backgroundColor: currentMode === mode.id ? '#6b7280' : '#22c55e',
                              borderColor: currentMode === mode.id ? '#6b7280' : '#22c55e'
                            }}
                          >
                            {currentMode === mode.id ? 'Currently Playing' : 'Select Mode'}
                          </Button>
                        ]}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: currentMode === mode.id ? '2px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px'
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
                            {getModeFeaturesList(mode).slice(0, 3).map((feature, index) => (
                              <Tag key={index} color="green" style={{
                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                borderColor: 'rgba(34, 197, 94, 0.3)',
                                color: '#22c55e'
                              }}>
                                {feature}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      </Card>
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ padding: '20px' }}
            >
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => setShowDetails(false)}
                style={{
                  marginBottom: '20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff'
                }}
              >
                Back to Modes
              </Button>

              <Card
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '64px' }}>{selectedMode.icon}</div>
                  <div>
                    <Title level={2} style={{ margin: 0, color: '#ffffff' }}>
                      {selectedMode.name}
                    </Title>
                    <Paragraph style={{ color: '#9ca3af', fontSize: '16px', margin: '8px 0 0 0' }}>
                      {selectedMode.description}
                    </Paragraph>
                  </div>
                </div>

                <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Title level={4} style={{ color: '#22c55e', margin: '0 0 12px 0' }}>
                      🎯 Features
                    </Title>
                    <Space direction="vertical" size={8}>
                      {getModeFeaturesList(selectedMode).map((feature, index) => (
                        <Tag key={index} color="green" style={{
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                          borderColor: 'rgba(34, 197, 94, 0.3)',
                          color: '#22c55e',
                          padding: '4px 8px'
                        }}>
                          {feature}
                        </Tag>
                      ))}
                    </Space>
                  </Col>

                  <Col span={8}>
                    <Title level={4} style={{ color: '#22c55e', margin: '0 0 12px 0' }}>
                      ⚙️ Settings
                    </Title>
                    <Space direction="vertical" size={8}>
                      {getModeSettings(selectedMode).map((setting, index) => (
                        <Text key={index} style={{ color: '#d1d5db', display: 'block' }}>
                          {setting}
                        </Text>
                      ))}
                    </Space>
                  </Col>

                  {selectedMode.settings.gestureRequirements && selectedMode.settings.gestureRequirements.length > 0 && (
                    <Col span={8}>
                      <Title level={4} style={{ color: '#22c55e', margin: '0 0 12px 0' }}>
                        ✋ Required Gestures
                      </Title>
                      <Space direction="vertical" size={8}>
                        {selectedMode.settings.gestureRequirements.map((gesture, index) => (
                          <Text key={index} style={{ color: '#ffffff', display: 'block' }}>
                            {getGestureEmoji(gesture)} {gesture.replace('_', ' ')}
                          </Text>
                        ))}
                      </Space>
                    </Col>
                  )}
                </Row>

                <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                <div>
                  <Title level={4} style={{ color: '#22c55e', margin: '0 0 12px 0' }}>
                    📋 How to Play
                  </Title>
                  <div style={{ color: '#d1d5db' }}>
                    {getInstructions(selectedMode).map((instruction, index) => (
                      <Paragraph key={index} style={{ color: '#d1d5db', margin: '4px 0' }}>
                        {instruction}
                      </Paragraph>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlayCircleOutlined />}
                    onClick={handleStartMode}
                    disabled={currentMode === selectedMode.id}
                    style={{
                      backgroundColor: currentMode === selectedMode.id ? '#6b7280' : '#22c55e',
                      borderColor: currentMode === selectedMode.id ? '#6b7280' : '#22c55e',
                      height: '48px',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    {currentMode === selectedMode.id ? 'Currently Playing' : `Start ${selectedMode.name}`}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </Modal>
      )}
    </AnimatePresence>
  );
};

// Helper functions
const getGestureEmoji = (gesture) => {
  const gestureEmojis = {
    'open_hand': '✋',
    'closed_fist': '✊',
    'pinch': '🤏',
    'point': '👆',
    'victory': '✌️',
    'thumbs_up': '👍',
    'rock_on': '🤘',
    'ok_sign': '👌'
  };
  return gestureEmojis[gesture] || '❓';
};

const getInstructions = (mode) => {
  const instructions = {
    creative: [
      "• Use any gesture to interact with objects",
      "• Experiment with physics and combos",
      "• No time limits or objectives",
      "• Perfect for learning and exploration"
    ],
    challenge: [
      "• Complete all objectives within the time limit",
      "• Use specific gestures to interact with objects",
      "• Earn points for accuracy and combos",
      "• Difficulty increases over time"
    ],
    speed: [
      "• Perform gestures as quickly as possible",
      "• Maintain high accuracy for bonus points",
      "• Limited gesture set for faster recognition",
      "• Beat your best time and score"
    ],
    memory: [
      "• Watch the gesture sequence carefully",
      "• Repeat the sequence exactly as shown",
      "• Sequences get longer as you progress",
      "• Test your memory and precision"
    ]
  };

  return instructions[mode.id] || ["• Follow on-screen instructions"];
};

export default GameModeSelector;
