import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentWord, setCurrentWord] = useState(0);
  
  const words = ['hey', 'im', 'coah!'];

  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => {
        // Fade out the whole intro (FAST)
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.15,
          ease: 'power2.inOut',
          onComplete: onComplete
        });
      }
    });

    // Animate each word in sequence
    words.forEach((word, wordIndex) => {
      const wordSelector = `.word-${wordIndex}`;
      const letterSelector = `${wordSelector} .letter`;

      // Set initial state - letters start below and invisible
      tl.set(letterSelector, {
        y: 100,
        opacity: 0,
        rotateX: -90,
        transformOrigin: 'center bottom'
      });

      // Show the word container
      tl.call(() => setCurrentWord(wordIndex));

      // Letters rotate up and slam in - staccato style (FASTER)
      tl.to(letterSelector, {
        y: 0,
        opacity: 1,
        rotateX: 0,
        duration: 0.25,
        stagger: 0.03,
        ease: 'back.out(1.7)'
      });

      // Hold for a beat (SHORTER)
      tl.to({}, { duration: 0.15 });

      // Break apart - letters scatter/explode (FASTER)
      tl.to(letterSelector, {
        y: () => gsap.utils.random(-200, -400),
        x: () => gsap.utils.random(-150, 150),
        rotateZ: () => gsap.utils.random(-45, 45),
        rotateX: () => gsap.utils.random(-90, 90),
        opacity: 0,
        scale: () => gsap.utils.random(0.5, 1.5),
        duration: 0.2,
        stagger: 0.015,
        ease: 'power2.in'
      });
    });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-background flex items-center justify-center overflow-hidden"
    >
      {words.map((word, wordIndex) => (
        <div
          key={word}
          className={`word-${wordIndex} absolute ${currentWord === wordIndex ? 'block' : 'hidden'}`}
        >
          <div className="flex items-center justify-center px-4">
            {word.split('').map((letter, letterIndex) => (
              <span
                key={letterIndex}
                className="letter inline-block text-[15vw] sm:text-[18vw] md:text-[20vw] font-montserrat font-black text-foreground lowercase select-none"
                style={{ 
                  perspective: '1000px',
                  transformStyle: 'preserve-3d'
                }}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>
      ))}
      
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-glow opacity-30 pointer-events-none" />
    </div>
  );
};

export default IntroAnimation;
