import React, { useState, useEffect, useRef } from 'react';

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  threshold?: number;
}

/**
 * RevealOnScroll component:
 * Gently fades in and floats up sections as they enter the viewport during scrolling.
 * - Hardware accelerated CSS transform & opacity
 * - Immediate appearance for elements already in view
 * - Respects prefers-reduced-motion
 */
export const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
  children,
  className = '',
  delayMs = 0,
  threshold = 0.08,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If IntersectionObserver is unavailable, fallback to visible immediately
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const el = ref.current;
    if (el) {
      // If already in viewport on mount, reveal right away
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setIsVisible(true);
        return;
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (el) observer.unobserve(el);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -30px 0px',
      }
    );

    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [threshold]);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delayMs}ms`,
      }}
      className={`w-full flex flex-col items-center transition-all duration-700 ease-out transform ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-8 scale-[0.99] pointer-events-none'
      } motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100 ${className}`}
    >
      {children}
    </div>
  );
};
