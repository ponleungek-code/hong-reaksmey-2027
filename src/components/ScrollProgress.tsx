import React, { useState, useEffect } from 'react';

export const ScrollProgress: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (scrollHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(scrollProgress)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 inset-x-0 z-50 h-[3px] bg-stone-200/20 dark:bg-stone-800/30 pointer-events-none transition-opacity duration-300"
    >
      <div
        className="h-full bg-gradient-to-r from-[#C5A880] via-[#D4AF37] to-[#E6C687] shadow-[0_0_8px_rgba(212,175,55,0.6)] transition-[width] duration-150 ease-out relative"
        style={{ width: `${scrollProgress}%` }}
      >
        {scrollProgress > 1 && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#FFF8ED] rounded-full shadow-[0_0_6px_rgba(255,248,237,0.9)] opacity-90" />
        )}
      </div>
    </div>
  );
};
