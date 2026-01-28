import { useRef, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';

interface ScatterTextProps {
  children: string;
  className?: string;
  delay?: number;
  scrollTrigger?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

const ScatterText = ({ 
  children, 
  className = '', 
  delay = 0,
  scrollTrigger = false,
  as: Component = 'div'
}: ScatterTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-15%' });

  const shouldAnimate = scrollTrigger ? isInView : true;

  // Generate random initial positions once
  const randomPositions = useMemo(() => 
    children.split('').map(() => ({
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 300,
      rotation: (Math.random() - 0.5) * 360,
    })),
    [children]
  );

  return (
    <Component 
      ref={containerRef as any}
      className={`inline-flex flex-wrap justify-center ${className}`}
    >
      {children.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ 
            x: randomPositions[i].x,
            y: randomPositions[i].y,
            rotate: randomPositions[i].rotation,
            scale: 0,
            opacity: 0
          }}
          animate={shouldAnimate ? {
            x: 0,
            y: 0,
            rotate: 0,
            scale: 1,
            opacity: 1
          } : {}}
          transition={{
            duration: 0.6,
            delay: delay + Math.random() * 0.3,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          style={{ 
            display: 'inline-block',
            whiteSpace: char === ' ' ? 'pre' : 'normal'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </Component>
  );
};

export default ScatterText;
