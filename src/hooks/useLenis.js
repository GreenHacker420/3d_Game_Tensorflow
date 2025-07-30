import { useEffect, useRef, useCallback } from 'react';
import Lenis from 'lenis';

/**
 * Enhanced Lenis hook for 3D Hand Pose Game
 * Provides advanced smooth scrolling with game-specific features
 */
export const useLenis = (options = {}) => {
  const lenisRef = useRef(null);
  const rafRef = useRef(null);
  const scrollTriggersRef = useRef([]);

  const defaultOptions = {
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
    autoResize: true,
    ...options,
  };

  useEffect(() => {
    // Initialize Lenis
    lenisRef.current = new Lenis(defaultOptions);

    // Set up the animation loop
    const raf = (time) => {
      lenisRef.current?.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    };

    rafRef.current = requestAnimationFrame(raf);

    // Add event listeners for debugging (optional)
    if (process.env.NODE_ENV === 'development') {
      lenisRef.current.on('scroll', ({ scroll, limit, velocity, direction, progress }) => {
        // console.log({ scroll, limit, velocity, direction, progress });
      });
    }

    // Cleanup function
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
    };
  }, []);

  // Provide methods to control Lenis
  const scrollTo = (target, options = {}) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, options);
    }
  };

  const start = () => {
    if (lenisRef.current) {
      lenisRef.current.start();
    }
  };

  const stop = () => {
    if (lenisRef.current) {
      lenisRef.current.stop();
    }
  };

  const resize = () => {
    if (lenisRef.current) {
      lenisRef.current.resize();
    }
  };

  const isScrolling = () => {
    return lenisRef.current?.isScrolling || false;
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
    } else {
      // Resume Lenis after modal closes
      setTimeout(() => {
        lenisRef.current?.start();
      }, 300);
    }
  }, []);

  // Game state transitions
  const smoothGameStateTransition = useCallback((fromState, toState) => {
    // Smooth transitions between game states
    if (fromState === 'playing' && toState === 'paused') {
      lenisRef.current?.stop();
    } else if (fromState === 'paused' && toState === 'playing') {
      lenisRef.current?.start();
    }
  }, []);

  // Utility methods for hand tracking integration
  const pauseForInteraction = useCallback(() => {
    lenisRef.current?.stop();
  }, []);

  const resumeAfterInteraction = useCallback(() => {
    lenisRef.current?.start();
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
    smoothGameStateTransition,

    // Game-specific
    pauseForInteraction,
    resumeAfterInteraction,
  };
};

export default useLenis;
