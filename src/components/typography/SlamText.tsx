import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SlamTextProps {
  children: string;
  className?: string;
  delay?: number;
  stagger?: number;
  scrollTrigger?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
}

const SlamText = ({ 
  children, 
  className = '', 
  delay = 0, 
  stagger = 0.03,
  scrollTrigger = false,
  as: Component = 'div'
}: SlamTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!containerRef.current || hasAnimated.current) return;

    const letters = containerRef.current.querySelectorAll('.letter');
    
    // Set initial state
    gsap.set(letters, {
      y: 80,
      opacity: 0,
      rotateX: -90,
      transformOrigin: 'center bottom'
    });

    const animate = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;

      gsap.to(letters, {
        y: 0,
        opacity: 1,
        rotateX: 0,
        duration: 0.5,
        stagger: stagger,
        delay: delay,
        ease: 'back.out(1.7)'
      });
    };

    if (scrollTrigger) {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top 85%',
        onEnter: animate,
        once: true
      });
    } else {
      animate();
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [delay, stagger, scrollTrigger]);

  return (
    <Component 
      ref={containerRef as any}
      className={`inline-flex flex-wrap ${className}`}
      style={{ perspective: '1000px' }}
    >
      {children.split('').map((char, i) => (
        <span
          key={i}
          className="letter inline-block"
          style={{ 
            transformStyle: 'preserve-3d',
            whiteSpace: char === ' ' ? 'pre' : 'normal'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </Component>
  );
};

export default SlamText;
