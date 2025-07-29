import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

/**
 * Custom hook for Lenis smooth scrolling
 * Integrates with framer-motion and provides smooth scrolling functionality
 */
export const useLenis = (options = {}) => {
  const lenisRef = useRef(null);
  const rafRef = useRef(null);

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

  return {
    lenis: lenisRef.current,
    scrollTo,
    start,
    stop,
    resize,
    isScrolling,
  };
};

export default useLenis;
