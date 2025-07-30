# 🎮 3D Hand Pose Game - Ant Design Migration Roadmap

## 🚀 Phase 3A: High Priority Components (Week 1-2) - 52 hours

### 1. GameModeSelector → Ant Design Modal + Card System
**Current**: Custom CSS + Framer Motion  
**Target**: Modal + Card + Button + Grid  
**Effort**: 10 hours  
**Benefits**: Professional modal system, better accessibility, consistent styling

**Migration Steps**:
```jsx
// Before: Custom CSS classes
<div className="mode-card">
  <button className="start-mode-btn">

// After: Ant Design components
<Modal title="Select Game Mode" open={visible}>
  <Row gutter={[16, 16]}>
    <Col span={12}>
      <Card hoverable onClick={handleSelect}>
        <Button type="primary">Start Mode</Button>
```

### 2. ObjectivesHUD → Card + Timeline + Progress
**Current**: Tailwind + Framer Motion  
**Target**: Card + Timeline + Progress + Badge  
**Effort**: 8 hours  
**Benefits**: Better progress visualization, consistent spacing

**Migration Steps**:
```jsx
// Before: Custom progress bars
<div className="bg-gray-800 rounded-lg p-4">
  <div className="w-full bg-gray-700 rounded-full h-2">

// After: Ant Design Progress
<Card title="Objectives" extra={<Badge count={completed} />}>
  <Timeline>
    <Timeline.Item>
      <Progress percent={progress} status="active" />
```

### 3. GameController → Modal + Form + Button
**Current**: Tailwind + Framer Motion  
**Target**: Modal + Form + Button + Space  
**Effort**: 8 hours  
**Benefits**: Form validation, better UX patterns

### 4. RewardsHUD → Card + Notification + Badge
**Current**: Tailwind + Framer Motion  
**Target**: Card + Notification + Badge + List  
**Effort**: 6 hours  
**Benefits**: Better notification system, consistent badges

### 5. ObjectsHUD → Card + List + Button
**Current**: Tailwind + Framer Motion  
**Target**: Card + List + Button + Tag  
**Effort**: 6 hours  
**Benefits**: Better list management, consistent interactions

### 6. CalibrationModal → Modal + Steps + Progress
**Current**: Ant Design (partial)  
**Target**: Enhanced Modal + Steps + Progress + Button  
**Effort**: 6 hours  
**Benefits**: Better step navigation, progress tracking

### 7. MobileUI → Drawer + Button + Switch
**Current**: Tailwind + Framer Motion  
**Target**: Drawer + Button + Switch + Grid  
**Effort**: 8 hours  
**Benefits**: Better mobile patterns, consistent touch interactions

## 🎯 Phase 3B: Medium Priority Components (Week 3) - 31 hours

### 8. AudioControls → Card + Slider + Switch
**Current**: Tailwind + Framer Motion  
**Target**: Card + Slider + Switch + Space  
**Effort**: 5 hours

### 9. InteractiveCalibrationGuide → Steps + Card + Button
**Current**: Tailwind + Framer Motion  
**Target**: Steps + Card + Button + Alert  
**Effort**: 6 hours

### 10. 3DMotionToggle → Switch + Tooltip + Card
**Current**: Tailwind + Framer Motion  
**Target**: Switch + Tooltip + Card  
**Effort**: 4 hours

### 11. ComboDisplay → Card + Timeline + Badge
**Current**: Custom CSS + Framer Motion  
**Target**: Card + Timeline + Badge + Animation  
**Effort**: 5 hours

### 12. HandTrackingHUD → Enhanced Card + Progress + Switch
**Current**: Ant Design (partial)  
**Target**: Enhanced Card + Progress + Switch + Tooltip  
**Effort**: 4 hours

### 13. 3DTrackingHUD → Card + Progress + Badge
**Current**: Tailwind + Framer Motion  
**Target**: Card + Progress + Badge + Space  
**Effort**: 4 hours

### 14. PerformanceHUD → Card + Progress + Badge
**Current**: Tailwind + Framer Motion  
**Target**: Card + Progress + Badge + Statistic  
**Effort**: 4 hours

## 🔧 Phase 3C: Low Priority Components (Week 4) - 17 hours

### 15. StatusIndicator → Badge + Tooltip + Icon
**Current**: Tailwind + Framer Motion  
**Target**: Badge + Tooltip + Icon  
**Effort**: 2 hours

### 16. ConfidenceIndicator → Progress + Tooltip
**Current**: Tailwind + Framer Motion  
**Target**: Progress + Tooltip + Card  
**Effort**: 3 hours

### 17. ErrorBoundary → Alert + Button
**Current**: Tailwind  
**Target**: Alert + Button + Space  
**Effort**: 2 hours

### 18. SceneOverlay → Card + Overlay
**Current**: Custom CSS  
**Target**: Card + Overlay + Portal  
**Effort**: 3 hours

### 19. HandTracker → Card + Canvas (keep custom)
**Current**: Tailwind + Canvas  
**Target**: Card wrapper + Canvas (preserve WebGL)  
**Effort**: 3 hours

### 20. EnhancedHandVisualization → Card + Canvas (keep custom)
**Current**: Canvas + Tailwind  
**Target**: Card wrapper + Canvas (preserve visualization)  
**Effort**: 3 hours

### 21. DraggableWrapper → Enhanced with Ant Design styling
**Current**: Framer Motion  
**Target**: Keep Framer Motion + Ant Design visual consistency  
**Effort**: 2 hours

## 📊 Migration Statistics

**Total Components**: 21  
**Total Effort**: 100 hours (2.5 weeks)  
**High Priority**: 52 hours (13 days)  
**Medium Priority**: 31 hours (8 days)  
**Low Priority**: 17 hours (4 days)  

**Components to Skip**: 2 (Scene3D, WebcamHandOverlay - pure 3D/WebGL)
