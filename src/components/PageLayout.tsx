import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AdminButton from '@/components/AdminButton';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  showTransition?: boolean;
  allowScroll?: boolean;
}

const tabs = [
  { id: 'home', label: 'home', path: '/' },
  { id: 'info', label: 'info', path: '/info' },
  { id: 'portfolio', label: 'portfolio', path: '/portfolio' },
  { id: 'contact', label: 'say hi', path: '/contact' },
];

const letterVariants = {
  hidden: { y: 100, opacity: 0, rotateX: -90 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.4,
      ease: [0.34, 1.56, 0.64, 1], // back.out equivalent
    },
  }),
};

const PageLayout = ({ children, title, showTransition = true, allowScroll = false }: PageLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(showTransition);
  const [showContent, setShowContent] = useState(!showTransition);

  const currentTab = tabs.find(t => t.path === location.pathname)?.id || 'home';

  useEffect(() => {
    if (!showTransition) {
      setIsTransitioning(false);
      setShowContent(true);
      return;
    }

    setIsTransitioning(true);
    setShowContent(false);
    
    // Start showing content after title animation
    const timer = setTimeout(() => {
      setIsTransitioning(false);
      setShowContent(true);
    }, title.length * 40 + 800); // letters + hold + fly away

    return () => clearTimeout(timer);
  }, [title, showTransition]);

  const handleTabClick = (path: string) => {
    if (path === location.pathname) return;
    navigate(path);
  };

  return (
    <div className="min-h-screen h-screen bg-background flex flex-col overflow-hidden">
      <AdminButton />

      {/* Fullscreen title transition overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <>
            {/* Static background layer */}
            <motion.div 
              className="fixed inset-0 z-50 bg-background"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}
            />
            {/* Animated title layer */}
            <motion.div 
              className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
              style={{ perspective: '1000px' }}
              initial={{ opacity: 1 }}
              exit={{ 
                scale: 0.15,
                x: '-35vw',
                y: '-40vh',
                opacity: 0,
                transition: { duration: 0.4, ease: [0.32, 0, 0.67, 0] }
              }}
            >
              <div className="flex" style={{ transformStyle: 'preserve-3d' }}>
                {title.split('').map((char, i) => (
                  <motion.span
                    key={i}
                    custom={i}
                    variants={letterVariants}
                    initial="hidden"
                    animate="visible"
                    className="inline-block text-[12vw] sm:text-[15vw] md:text-[18vw] font-black lowercase leading-none tracking-tight text-foreground"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header with tabs - all in top left */}
      <header className="relative z-20 border-b border-border/20 bg-background/80 backdrop-blur-sm flex-shrink-0">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4 md:gap-8 h-12 sm:h-14 md:h-16">
            {/* Page title */}
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-lg sm:text-xl md:text-2xl font-black lowercase tracking-tight text-foreground flex-shrink-0"
            >
              {title}
            </motion.h1>

            {/* Navigation tabs - next to title */}
            <nav className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: (showTransition ? 1.2 : 0) + index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTabClick(tab.path)}
                  className={`px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs md:text-sm font-mono lowercase rounded-md sm:rounded-lg transition-colors duration-200 whitespace-nowrap ${
                    currentTab === tab.id
                      ? 'bg-foreground text-background font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main content - fills remaining space */}
      <motion.main 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 30 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`relative z-10 flex-1 w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 ${allowScroll ? 'overflow-y-auto' : 'overflow-y-auto lg:overflow-hidden'}`}
      >
        {children}
      </motion.main>
    </div>
  );
};

export default PageLayout;
