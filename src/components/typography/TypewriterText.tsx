import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface TypewriterTextProps {
  children: string;
  className?: string;
  delay?: number;
  speed?: number;
  cursor?: boolean;
  scrollTrigger?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  onComplete?: () => void;
}

const TypewriterText = ({ 
  children, 
  className = '', 
  delay = 0,
  speed = 50,
  cursor = true,
  scrollTrigger = false,
  as: Component = 'div',
  onComplete
}: TypewriterTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const hasAnimated = useRef(false);
  const isInView = useInView(containerRef, { once: true, margin: '-15%' });

  useEffect(() => {
    if (hasAnimated.current) return;
    if (scrollTrigger && !isInView) return;

    hasAnimated.current = true;
    let currentIndex = 0;
    
    const timeout = setTimeout(() => {
      const typeInterval = setInterval(() => {
        if (currentIndex <= children.length) {
          setDisplayText(children.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          onComplete?.();
        }
      }, speed);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [children, delay, speed, scrollTrigger, isInView, onComplete]);

  // Cursor blink
  useEffect(() => {
    if (!cursor) return;
    const blinkInterval = setInterval(() => setShowCursor(prev => !prev), 530);
    return () => clearInterval(blinkInterval);
  }, [cursor]);

  return (
    <Component 
      ref={containerRef as any}
      className={`inline-block ${className}`}
    >
      {displayText}
      {cursor && (
        <motion.span 
          animate={{ opacity: showCursor ? 1 : 0 }}
          className="inline-block w-[3px] h-[1em] bg-current ml-1 align-middle"
        />
      )}
    </Component>
  );
};

export default TypewriterText;
