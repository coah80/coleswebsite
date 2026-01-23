import { useRef, useCallback, useEffect } from 'react';
import { gsap } from 'gsap';

interface RainbowJumpTextProps {
  children: string;
  className?: string;
  triggerOnParentHover?: boolean; // If true, parent must add group class and this responds to group-hover
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
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const isAnimatingRef = useRef(false);

  const runAnimation = useCallback(() => {
    // Don't interrupt ongoing animation
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const letters = lettersRef.current.filter(Boolean);
    
    // Create jump + rainbow animation
    animationRef.current = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;
      }
    });
    
    letters.forEach((letter, i) => {
      if (!letter) return;
      
      const color = rainbowColors[i % rainbowColors.length];
      
      // Jump up with color change
      animationRef.current!.to(letter, {
        y: -8,
        color: color,
        textShadow: `0 0 8px ${color}80`,
        duration: 0.12,
        ease: 'power2.out'
      }, i * 0.025);
      
      // Bounce back down
      animationRef.current!.to(letter, {
        y: 0,
        duration: 0.2,
        ease: 'bounce.out'
      }, i * 0.025 + 0.12);
      
      // Fade color back
      animationRef.current!.to(letter, {
        color: 'inherit',
        textShadow: 'none',
        duration: 0.25,
        ease: 'power2.out'
      }, i * 0.025 + 0.25);
    });
  }, []);

  // For parent hover trigger - watch for mouseenter on closest .group ancestor
  useEffect(() => {
    if (!triggerOnParentHover || !containerRef.current) return;
    
    const groupParent = containerRef.current.closest('.group');
    if (!groupParent) return;
    
    const handleEnter = () => runAnimation();
    
    groupParent.addEventListener('mouseenter', handleEnter);
    
    return () => {
      groupParent.removeEventListener('mouseenter', handleEnter);
    };
  }, [triggerOnParentHover, runAnimation]);

  return (
    <span
      ref={containerRef}
      className={`inline-flex ${className}`}
      onMouseEnter={!triggerOnParentHover ? runAnimation : undefined}
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
    </span>
  );
};

export default RainbowJumpText;
