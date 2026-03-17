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
      ease: [0.34, 1.56, 0.64, 1],
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

    const timer = setTimeout(() => {
      setIsTransitioning(false);
      setShowContent(true);
    }, title.length * 40 + 800);

    return () => clearTimeout(timer);
  }, [title, showTransition]);

  const handleTabClick = (path: string) => {
    if (path === location.pathname) return;
    navigate(path);
  };

  return (
    <div className="min-h-screen h-screen bg-ctp-base flex flex-col overflow-hidden">
      <AdminButton />


      <AnimatePresence>
        {isTransitioning && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-ctp-base"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}
            />
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
                    className="inline-block text-[12vw] sm:text-[15vw] md:text-[18vw] font-heading font-black lowercase leading-none tracking-tight text-ctp-text"
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


      <header className="relative z-20 border-b border-ctp-text/5 bg-ctp-base/90 backdrop-blur-xl flex-shrink-0">
        <div className="w-full px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 sm:gap-6 h-14">

            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-lg sm:text-xl font-heading font-bold lowercase tracking-tight text-ctp-text flex-shrink-0"
            >
              {title}<span className="text-ctp-mauve">.</span>
            </motion.h1>


            <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: (showTransition ? 1.2 : 0) + index * 0.05 }}
                  onClick={() => handleTabClick(tab.path)}
                  className={`px-3 py-2.5 sm:py-1.5 text-xs font-varia lowercase rounded-xl transition-all duration-150 ease-out whitespace-nowrap ${
                    currentTab === tab.id
                      ? 'bg-ctp-mauve text-ctp-crust font-bold'
                      : 'text-ctp-overlay1 hover:text-ctp-subtext1 hover:bg-ctp-surface0/40'
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </nav>
          </div>
        </div>
      </header>


      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`relative z-10 flex-1 min-h-0 w-full px-4 sm:px-6 py-4 sm:py-5 ${allowScroll ? 'overflow-y-auto' : 'overflow-hidden'}`}
      >
        {children}
      </motion.main>
    </div>
  );
};

export default PageLayout;
