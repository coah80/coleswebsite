import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface SlamTextProps {
  children: string;
  className?: string;
  delay?: number;
  stagger?: number;
  scrollTrigger?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

const letterVariants = {
  hidden: { 
    y: 80, 
    opacity: 0, 
    rotateX: -90,
  },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1], // back.out equivalent
    },
  }),
};

const SlamText = ({ 
  children, 
  className = '', 
  delay = 0, 
  stagger = 0.03,
  scrollTrigger = false,
  as: Component = 'div'
}: SlamTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-15%' });

  const shouldAnimate = scrollTrigger ? isInView : true;

  return (
    <Component 
      ref={containerRef as any}
      className={`inline-flex flex-wrap ${className}`}
      style={{ perspective: '1000px' }}
    >
      {children.split('').map((char, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={letterVariants}
          initial="hidden"
          animate={shouldAnimate ? "visible" : "hidden"}
          style={{ 
            transformStyle: 'preserve-3d',
            transformOrigin: 'center bottom',
            display: 'inline-block',
            whiteSpace: char === ' ' ? 'pre' : 'normal'
          }}
          transition={{ delay: delay + i * stagger }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </Component>
  );
};

export default SlamText;
