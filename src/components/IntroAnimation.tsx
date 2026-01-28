import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [currentWord, setCurrentWord] = useState(0);
  const [phase, setPhase] = useState<'entering' | 'exiting' | 'done'>('entering');
  const [isVisible, setIsVisible] = useState(true);

  const words = ['hey', 'im', 'coah!'];

  // Generate random exit positions for each word's letters
  const randomExitPositions = useMemo(() => 
    words.map(word => 
      word.split('').map(() => ({
        y: -200 - Math.random() * 200,
        x: (Math.random() - 0.5) * 300,
        rotateZ: (Math.random() - 0.5) * 90,
        rotateX: (Math.random() - 0.5) * 180,
        scale: 0.5 + Math.random(),
      }))
    ),
    []
  );

  useEffect(() => {
    const timings = { enter: 400, hold: 150, exit: 200 };
    let timeout: NodeJS.Timeout;

    const animateWord = (wordIndex: number) => {
      if (wordIndex >= words.length) {
        // All words done, fade out container
        setIsVisible(false);
        setTimeout(onComplete, 150);
        return;
      }

      setCurrentWord(wordIndex);
      setPhase('entering');

      // After entering, hold
      timeout = setTimeout(() => {
        setPhase('exiting');
        // After exiting, move to next word
        timeout = setTimeout(() => {
          animateWord(wordIndex + 1);
        }, timings.exit);
      }, timings.enter + timings.hold);
    };

    animateWord(0);

    return () => clearTimeout(timeout);
  }, [onComplete]);

  const letterVariants = {
    hidden: { y: 100, opacity: 0, rotateX: -90 },
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      rotateX: 0,
      transition: {
        delay: i * 0.03,
        duration: 0.25,
        ease: [0.34, 1.56, 0.64, 1],
      },
    }),
    exit: (i: number) => ({
      y: randomExitPositions[currentWord]?.[i]?.y ?? -300,
      x: randomExitPositions[currentWord]?.[i]?.x ?? 0,
      rotateZ: randomExitPositions[currentWord]?.[i]?.rotateZ ?? 0,
      rotateX: randomExitPositions[currentWord]?.[i]?.rotateX ?? 0,
      scale: randomExitPositions[currentWord]?.[i]?.scale ?? 1,
      opacity: 0,
      transition: {
        delay: i * 0.015,
        duration: 0.2,
        ease: 'easeIn',
      },
    }),
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-background flex items-center justify-center overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentWord}
              className="absolute flex items-center justify-center px-4"
              style={{ perspective: '1000px' }}
            >
              {words[currentWord].split('').map((letter, letterIndex) => (
                <motion.span
                  key={letterIndex}
                  custom={letterIndex}
                  variants={letterVariants}
                  initial="hidden"
                  animate={phase === 'entering' ? 'visible' : 'exit'}
                  className="inline-block text-[15vw] sm:text-[18vw] md:text-[20vw] font-montserrat font-black text-foreground lowercase select-none"
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transformOrigin: 'center bottom',
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.div>
          </AnimatePresence>
          
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-glow opacity-30 pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntroAnimation;
