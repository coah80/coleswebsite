import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!containerRef.current || hasAnimated.current) return;

    const letters = containerRef.current.querySelectorAll('.letter');
    
    // Set initial state - scattered
    gsap.set(letters, {
      x: () => gsap.utils.random(-200, 200),
      y: () => gsap.utils.random(-150, 150),
      rotation: () => gsap.utils.random(-180, 180),
      scale: 0,
      opacity: 0
    });

    const animate = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;

      gsap.to(letters, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        opacity: 1,
        duration: 0.6,
        stagger: {
          each: 0.04,
          from: 'random'
        },
        delay: delay,
        ease: 'back.out(1.2)'
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
  }, [delay, scrollTrigger]);

  return (
    <Component 
      ref={containerRef as any}
      className={`inline-flex flex-wrap justify-center ${className}`}
    >
      {children.split('').map((char, i) => (
        <span
          key={i}
          className="letter inline-block"
          style={{ 
            whiteSpace: char === ' ' ? 'pre' : 'normal'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </Component>
  );
};

export default ScatterText;
