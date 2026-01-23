import { useRef, useCallback } from 'react';
import { gsap } from 'gsap';

interface WarpTextProps {
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

const WarpText = ({ 
  children, 
  className = '',
  as: Component = 'div'
}: WarpTextProps) => {
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const animationRef = useRef<gsap.core.Timeline | null>(null);

  const handleMouseEnter = useCallback(() => {
    // Kill any existing animation
    if (animationRef.current) animationRef.current.kill();

    const letters = lettersRef.current.filter(Boolean);
    
    // Create wavy animation - each letter moves up/down in sequence
    animationRef.current = gsap.timeline();
    
    letters.forEach((letter, i) => {
      animationRef.current!.to(letter, {
        y: -8,
        duration: 0.15,
        ease: 'power2.out'
      }, i * 0.04);
      
      animationRef.current!.to(letter, {
        y: 0,
        duration: 0.3,
        ease: 'elastic.out(1, 0.4)'
      }, i * 0.04 + 0.15);
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    const letters = lettersRef.current.filter(Boolean);
    gsap.to(letters, {
      y: 0,
      duration: 0.2,
      ease: 'power2.out'
    });
  }, []);

  return (
    <Component 
      className={`inline-flex cursor-pointer ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children.split('').map((char, i) => (
        <span
          key={i}
          ref={(el) => { lettersRef.current[i] = el; }}
          className="inline-block"
          style={{ display: char === ' ' ? 'inline' : 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </Component>
  );
};

export default WarpText;
