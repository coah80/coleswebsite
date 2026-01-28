import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface WarpTextProps {
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  triggerOnParentHover?: boolean;
}

const WarpText = ({ 
  children, 
  className = '',
  as: Component = 'div',
  triggerOnParentHover = false
}: WarpTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // For parent hover trigger
  useEffect(() => {
    if (!triggerOnParentHover || !containerRef.current) return;
    
    const groupParent = containerRef.current.closest('.group');
    if (!groupParent) return;
    
    const handleEnter = () => setIsHovered(true);
    const handleLeave = () => setIsHovered(false);
    
    groupParent.addEventListener('mouseenter', handleEnter);
    groupParent.addEventListener('mouseleave', handleLeave);
    return () => {
      groupParent.removeEventListener('mouseenter', handleEnter);
      groupParent.removeEventListener('mouseleave', handleLeave);
    };
  }, [triggerOnParentHover]);

  return (
    <Component 
      ref={containerRef as any}
      className={`inline-flex cursor-pointer ${className}`}
      onMouseEnter={!triggerOnParentHover ? () => setIsHovered(true) : undefined}
      onMouseLeave={!triggerOnParentHover ? () => setIsHovered(false) : undefined}
    >
      {children.split('').map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
          animate={isHovered ? {
            y: [0, -8, 0],
            transition: {
              duration: 0.4,
              delay: i * 0.03,
              ease: [0.25, 0.46, 0.45, 0.94]
            }
          } : { y: 0 }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </Component>
  );
};

export default WarpText;
