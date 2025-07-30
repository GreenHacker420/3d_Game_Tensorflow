import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Statistic, Badge, List, Space, Typography, Row, Col } from 'antd';
import { TrophyOutlined, FireOutlined, StarOutlined, ThunderboltOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * HUD component to display active rewards, combo streaks, and special effects
 */
const RewardsHUD = ({
  activeRewards = [],
  comboStreak = 0,
  maxComboStreak = 0,
  streakMultiplier = 1.0,
  totalPoints = 0,
  recentRewards = [],
  className = '',
  position = 'top-center',
  minimized = false,
  onToggleMinimize
}) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  const getStreakColor = (streak) => {
    if (streak >= 10) return 'text-purple-400 bg-purple-900/20';
    if (streak >= 5) return 'text-yellow-400 bg-yellow-900/20';
    if (streak >= 3) return 'text-orange-400 bg-orange-900/20';
    return 'text-green-400 bg-green-900/20';
  };

  const getMultiplierDisplay = (multiplier) => {
    if (multiplier >= 2.0) return '🔥🔥🔥';
    if (multiplier >= 1.5) return '🔥🔥';
    if (multiplier >= 1.2) return '🔥';
    return '';
  };

  return (
    <motion.div
      className={`fixed ${positionClasses[position]} z-30 ${className}`}
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
        styles={{
          body: { padding: '12px' }
        }}
      >
        <Row gutter={[16, 8]} justify="center" align="middle">
          {/* Total Points */}
          <Col>
            <Statistic
              title={<Text style={{ color: '#9ca3af', fontSize: '10px' }}>Total Points</Text>}
              value={totalPoints}
              valueStyle={{ color: '#ffd700', fontSize: '20px', fontWeight: 'bold' }}
              prefix={<TrophyOutlined />}
            />
          </Col>

          {/* Combo Streak */}
          {comboStreak > 0 && (
            <Col>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Statistic
                  title={<Text style={{ color: '#9ca3af', fontSize: '10px' }}>Combo Streak</Text>}
                  value={`${comboStreak}x`}
                  valueStyle={{ color: '#ff6b35', fontSize: '18px', fontWeight: 'bold' }}
                  prefix={<FireOutlined />}
                  suffix={
                    streakMultiplier > 1.0 && (
                      <Badge
                        count={`${streakMultiplier.toFixed(1)}x`}
                        style={{ backgroundColor: '#ff6b35', fontSize: '10px' }}
                      />
                    )
                  }
                />
                {maxComboStreak > 0 && comboStreak === maxComboStreak && (
                  <Text style={{ color: '#a855f7', fontSize: '10px', display: 'block', textAlign: 'center' }}>
                    🏆 New Record!
                  </Text>
                )}
              </motion.div>
            </Col>
          )}

          {/* Streak Multiplier Visual */}
          {streakMultiplier > 1.0 && (
            <Col>
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
              >
                <ThunderboltOutlined
                  style={{
                    color: '#ffd700',
                    fontSize: '24px',
                    filter: 'drop-shadow(0 0 8px #ffd700)'
                  }}
                />
              </motion.div>
            </Col>
          )}
        </Row>

        {/* Active Rewards List */}
        {activeRewards.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <List
              size="small"
              dataSource={activeRewards.slice(0, 3)}
              renderItem={(reward) => (
                <motion.div
                  key={reward.id}
                  initial={{ x: -100, opacity: 0, scale: 0.8 }}
                  animate={{ x: 0, opacity: 1, scale: 1 }}
                  exit={{ x: 100, opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                  <List.Item style={{ padding: '4px 0', border: 'none' }}>
                    <Space>
                      <StarOutlined style={{ color: '#22c55e' }} />
                      <Text style={{ color: '#22c55e', fontSize: '11px', fontWeight: 'bold' }}>
                        +{reward.points}
                      </Text>
                      <Text style={{ color: '#ffffff', fontSize: '11px' }}>
                        {reward.comboName || reward.name}
                      </Text>
                      {reward.bonusPoints > 0 && (
                        <Badge
                          count={`+${reward.bonusPoints}`}
                          style={{ backgroundColor: '#22c55e', fontSize: '9px' }}
                        />
                      )}
                    </Space>
                  </List.Item>
                </motion.div>
              )}
            />
          </div>
        )}
      </Card>
    </motion.div>
  );
};

/**
 * Floating reward notification component for immediate feedback
 */
export const RewardNotification = ({ reward, onComplete }) => {
  if (!reward) return null;

  return (
    <motion.div
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
      initial={{ scale: 0, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: -50 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 20,
        duration: 0.6
      }}
      onAnimationComplete={() => {
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 2000);
      }}
    >
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-lg p-4 shadow-2xl border-2 border-yellow-300">
        <div className="text-center">
          <div className="text-3xl mb-2">{reward.emoji}</div>
          <div className="text-lg font-bold">{reward.comboName}</div>
          <div className="text-2xl font-bold text-green-800">+{reward.points}</div>
          {reward.streakCount > 1 && (
            <div className="text-sm font-semibold">
              🔥 {reward.streakCount} Combo Streak!
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default RewardsHUD;
