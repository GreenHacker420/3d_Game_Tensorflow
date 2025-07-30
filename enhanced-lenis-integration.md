# 🌊 Enhanced Lenis Smooth Scrolling Integration

## Current State Analysis

### Existing Implementation
```jsx
// src/hooks/useLenis.js - Basic setup
const useLenis = (options = {}) => {
  const defaultOptions = {
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    mouseMultiplier: 1,
    touchMultiplier: 2,
    smoothTouch: false, // Disabled to avoid conflicts with hand tracking
  };
};

// src/App.jsx - Limited usage
const { scrollTo, start: startLenis, stop: stopLenis } = useLenis({
  duration: 1.2,
  smooth: true,
  smoothTouch: false, // Prevent conflicts with hand tracking
});
```

## Enhanced Integration Strategy

### 1. Advanced Lenis Hook (4 hours)

```jsx
// src/hooks/useEnhancedLenis.js
import { useEffect, useRef, useCallback } from 'react';
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';

export const useEnhancedLenis = (options = {}) => {
  const lenisRef = useRef(null);
  const rafRef = useRef(null);
  const scrollTriggersRef = useRef([]);

  const defaultOptions = {
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false, // Keep disabled for hand tracking compatibility
    touchMultiplier: 2,
    infinite: false,
    autoResize: true,
    syncTouch: true,
    syncTouchLerp: 0.1,
    touchInertiaMultiplier: 35,
    ...options,
  };

  // Enhanced scroll-triggered animations
  const addScrollTrigger = useCallback((element, animation, options = {}) => {
    const trigger = {
      element,
      animation,
      options: {
        start: 0.1, // Start when 10% visible
        end: 0.9,   // End when 90% visible
        ...options
      },
      isActive: false
    };
    
    scrollTriggersRef.current.push(trigger);
    return trigger;
  }, []);

  // Smooth modal transitions
  const smoothModalTransition = useCallback((modalElement, isOpening) => {
    if (!lenisRef.current || !modalElement) return;

    if (isOpening) {
      // Pause Lenis during modal opening
      lenisRef.current.stop();
      
      // Smooth modal entrance
      gsap.fromTo(modalElement, 
        { 
          opacity: 0, 
          scale: 0.9,
          y: 50 
        },
        { 
          opacity: 1, 
          scale: 1,
          y: 0,
          duration: 0.4,
          ease: "power2.out"
        }
      );
    } else {
      // Smooth modal exit
      gsap.to(modalElement, {
        opacity: 0,
        scale: 0.9,
        y: -50,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          // Resume Lenis after modal closes
          lenisRef.current?.start();
        }
      });
    }
  }, []);

  // HUD smooth positioning
  const smoothHUDTransition = useCallback((hudElement, position, duration = 0.5) => {
    if (!hudElement) return;

    gsap.to(hudElement, {
      x: position.x,
      y: position.y,
      duration,
      ease: "power2.out"
    });
  }, []);

  // Game state transitions
  const smoothGameStateTransition = useCallback((fromState, toState, elements) => {
    const transitions = {
      'menu-to-playing': () => {
        // Fade out menu, slide in game HUDs
        gsap.timeline()
          .to(elements.menu, { opacity: 0, y: -50, duration: 0.3 })
          .fromTo(elements.gameHUDs, 
            { opacity: 0, y: 50 },
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 }
          );
      },
      'playing-to-paused': () => {
        // Blur background, show pause modal
        gsap.to(elements.gameContainer, {
          filter: 'blur(4px)',
          scale: 0.95,
          duration: 0.3
        });
      },
      'paused-to-playing': () => {
        // Remove blur, restore scale
        gsap.to(elements.gameContainer, {
          filter: 'blur(0px)',
          scale: 1,
          duration: 0.3
        });
      }
    };

    const transitionKey = `${fromState}-to-${toState}`;
    if (transitions[transitionKey]) {
      transitions[transitionKey]();
    }
  }, []);

  return {
    lenis: lenisRef.current,
    scrollTo,
    start,
    stop,
    resize,
    isScrolling,
    
    // Enhanced features
    addScrollTrigger,
    smoothModalTransition,
    smoothHUDTransition,
    smoothGameStateTransition,
    
    // Utility methods
    pauseForInteraction: () => lenisRef.current?.stop(),
    resumeAfterInteraction: () => lenisRef.current?.start(),
  };
};
```

### 2. Scroll-Triggered Animations (6 hours)

```jsx
// src/components/ScrollTriggeredHUD.jsx
import { useEffect, useRef } from 'react';
import { useEnhancedLenis } from '../hooks/useEnhancedLenis';
import { gsap } from 'gsap';

const ScrollTriggeredHUD = ({ children, triggerOptions = {} }) => {
  const elementRef = useRef(null);
  const { addScrollTrigger } = useEnhancedLenis();

  useEffect(() => {
    if (!elementRef.current) return;

    const animation = gsap.fromTo(elementRef.current,
      { 
        opacity: 0, 
        y: 30,
        scale: 0.95 
      },
      { 
        opacity: 1, 
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: "power2.out"
      }
    );

    const trigger = addScrollTrigger(elementRef.current, animation, {
      start: 0.2,
      end: 0.8,
      ...triggerOptions
    });

    return () => {
      animation.kill();
    };
  }, [addScrollTrigger, triggerOptions]);

  return (
    <div ref={elementRef}>
      {children}
    </div>
  );
};
```

### 3. Enhanced Modal Transitions (4 hours)

```jsx
// src/components/EnhancedModal.jsx
import { Modal } from 'antd';
import { useEffect, useRef } from 'react';
import { useEnhancedLenis } from '../hooks/useEnhancedLenis';

const EnhancedModal = ({ open, onCancel, children, ...props }) => {
  const modalRef = useRef(null);
  const { smoothModalTransition } = useEnhancedLenis();

  useEffect(() => {
    if (modalRef.current) {
      smoothModalTransition(modalRef.current, open);
    }
  }, [open, smoothModalTransition]);

  return (
    <Modal
      {...props}
      open={open}
      onCancel={onCancel}
      getContainer={() => {
        const container = document.createElement('div');
        container.ref = modalRef;
        return container;
      }}
      styles={{
        mask: { 
          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
          backdropFilter: 'blur(4px)',
          transition: 'all 0.3s ease'
        },
        content: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }
      }}
      maskTransitionName=""
      transitionName=""
    >
      {children}
    </Modal>
  );
};
```

### 4. Game State Smooth Transitions (6 hours)

```jsx
// src/hooks/useGameStateTransitions.js
import { useEffect, useRef } from 'react';
import { useEnhancedLenis } from './useEnhancedLenis';
import useGameStore from '../store/gameStore';

export const useGameStateTransitions = () => {
  const { smoothGameStateTransition } = useEnhancedLenis();
  const gameState = useGameStore(state => state.gameState);
  const prevGameState = useRef(gameState);
  
  const elementsRef = useRef({
    menu: null,
    gameHUDs: null,
    gameContainer: null,
    pauseModal: null
  });

  useEffect(() => {
    if (prevGameState.current !== gameState) {
      smoothGameStateTransition(
        prevGameState.current, 
        gameState, 
        elementsRef.current
      );
      prevGameState.current = gameState;
    }
  }, [gameState, smoothGameStateTransition]);

  const registerElement = (key, element) => {
    elementsRef.current[key] = element;
  };

  return { registerElement };
};
```

### 5. HUD Smooth Positioning (4 hours)

```jsx
// src/components/SmoothDraggableWrapper.jsx
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useEnhancedLenis } from '../hooks/useEnhancedLenis';

const SmoothDraggableWrapper = ({ 
  children, 
  initialPosition, 
  onPositionChange,
  ...props 
}) => {
  const elementRef = useRef(null);
  const { smoothHUDTransition, pauseForInteraction, resumeAfterInteraction } = useEnhancedLenis();

  const handleDragStart = () => {
    pauseForInteraction();
  };

  const handleDragEnd = (event, info) => {
    const newPosition = {
      x: info.point.x,
      y: info.point.y
    };
    
    // Smooth snap to position
    smoothHUDTransition(elementRef.current, newPosition, 0.3);
    onPositionChange?.(newPosition);
    
    setTimeout(() => {
      resumeAfterInteraction();
    }, 300);
  };

  return (
    <motion.div
      ref={elementRef}
      drag
      dragConstraints={{ left: 0, right: window.innerWidth - 200, top: 0, bottom: window.innerHeight - 100 }}
      dragElastic={0.1}
      dragMomentum={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      initial={{ x: initialPosition.x, y: initialPosition.y }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
```

## Integration Timeline

### Week 1: Core Enhancement (14 hours)
- **Day 1-2**: Enhanced Lenis Hook (4h)
- **Day 3-4**: Scroll-Triggered Animations (6h)  
- **Day 5**: Enhanced Modal Transitions (4h)

### Week 2: Game Integration (10 hours)
- **Day 1-3**: Game State Transitions (6h)
- **Day 4-5**: HUD Smooth Positioning (4h)

### Week 3: Testing & Optimization (6 hours)
- **Day 1-2**: Performance testing with 3D scenes (3h)
- **Day 3**: Hand tracking conflict resolution (2h)
- **Day 4**: Final optimization and documentation (1h)

## Performance Considerations

### 3D Scene Compatibility
```jsx
// Ensure Lenis doesn't interfere with 3D interactions
const Scene3DWrapper = ({ children }) => {
  return (
    <div data-lenis-prevent>
      {children}
    </div>
  );
};
```

### Hand Tracking Preservation
```jsx
// Pause Lenis during active hand tracking
useEffect(() => {
  if (handState.isTracking) {
    pauseForInteraction();
  } else {
    resumeAfterInteraction();
  }
}, [handState.isTracking]);
```

## Expected Benefits

1. **Smoother UI Transitions**: 60fps modal and HUD animations
2. **Better User Experience**: Seamless state changes
3. **Professional Feel**: Cinema-quality smooth scrolling
4. **Enhanced Accessibility**: Reduced motion support
5. **Performance Maintained**: No impact on 3D rendering or hand tracking
