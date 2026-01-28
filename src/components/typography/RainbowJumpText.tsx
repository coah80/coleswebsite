import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface RainbowJumpTextProps {
  children: string;
  className?: string;
  triggerOnParentHover?: boolean;
}

const rainbowColors = [
  '#ff6b6b', // red
  '#ffa94d', // orange
  '#ffd43b', // yellow
  '#69db7c', // green
  '#4dabf7', // blue
  '#9775fa', // purple
  '#f783ac', // pink
];

const RainbowJumpText = ({ children, className = '', triggerOnParentHover = false }: RainbowJumpTextProps) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [animationKey, setAnimationKey] = useState(0);

  const runAnimation = useCallback(() => {
    setAnimationKey(prev => prev + 1);
  }, []);

  // For parent hover trigger
  useEffect(() => {
    if (!triggerOnParentHover || !containerRef.current) return;
    
    const groupParent = containerRef.current.closest('.group');
    if (!groupParent) return;
    
    const handleEnter = () => runAnimation();
    
    groupParent.addEventListener('mouseenter', handleEnter);
    return () => groupParent.removeEventListener('mouseenter', handleEnter);
  }, [triggerOnParentHover, runAnimation]);

  return (
    <span
      ref={containerRef}
      className={`inline-flex ${className}`}
      onMouseEnter={!triggerOnParentHover ? runAnimation : undefined}
      style={{ color: 'inherit' }}
    >
      {children.split('').map((char, i) => {
        const color = rainbowColors[i % rainbowColors.length];
        
        return (
          <motion.span
            key={`${i}-${animationKey}`}
            style={{ 
              display: 'inline-block',
              whiteSpace: char === ' ' ? 'pre' : 'normal',
              color: 'inherit',
            }}
            animate={{
              y: [0, -8, 0],
              color: ['hsl(0, 0%, 95%)', color, 'hsl(0, 0%, 95%)'],
              textShadow: ['none', `0 0 12px ${color}`, 'none'],
            }}
            transition={{
              duration: 0.35,
              delay: i * 0.02,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        );
      })}
    </span>
  );
};

export default RainbowJumpText;
