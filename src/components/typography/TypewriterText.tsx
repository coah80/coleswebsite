import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface TypewriterTextProps {
  children: string;
  className?: string;
  delay?: number;
  speed?: number; // ms per character
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

  useEffect(() => {
    if (hasAnimated.current) return;

    const animate = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;

      let currentIndex = 0;
      
      const typeInterval = setInterval(() => {
        if (currentIndex <= children.length) {
          setDisplayText(children.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
          onComplete?.();
        }
      }, speed);

      return () => clearInterval(typeInterval);
    };

    if (scrollTrigger && containerRef.current) {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top 85%',
        onEnter: () => {
          setTimeout(animate, delay * 1000);
        },
        once: true
      });
    } else {
      const timeout = setTimeout(animate, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [children, delay, speed, scrollTrigger, onComplete]);

  // Cursor blink
  useEffect(() => {
    if (!cursor) return;
    
    const blinkInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    return () => clearInterval(blinkInterval);
  }, [cursor]);

  return (
    <Component 
      ref={containerRef as any}
      className={`inline-block ${className}`}
    >
      {displayText}
      {cursor && (
        <span 
          className={`inline-block w-[3px] h-[1em] bg-current ml-1 align-middle transition-opacity ${
            showCursor ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </Component>
  );
};

export default TypewriterText;
