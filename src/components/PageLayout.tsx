import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import AdminButton from '@/components/AdminButton';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  showTransition?: boolean;
}

const tabs = [
  { id: 'home', label: 'home', path: '/' },
  { id: 'portfolio', label: 'portfolio', path: '/portfolio' },
  { id: 'contact', label: 'say hi', path: '/contact' },
];

const PageLayout = ({ children, title, showTransition = true }: PageLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(showTransition);
  const [displayTitle, setDisplayTitle] = useState(title);
  const titleRef = useRef<HTMLDivElement>(null);
  const headerTitleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentTab = tabs.find(t => t.path === location.pathname)?.id || 'home';

  useEffect(() => {
    if (!showTransition) {
      setIsTransitioning(false);
      return;
    }

    setDisplayTitle(title);
    setIsTransitioning(true);

    const tl = gsap.timeline();

    // Initial state - title centered and huge
    gsap.set(titleRef.current, {
      opacity: 1,
      scale: 1,
      y: 0
    });

    gsap.set(contentRef.current, {
      opacity: 0,
      y: 30
    });

    gsap.set(headerTitleRef.current, {
      opacity: 0
    });

    // Animate title letters
    const letters = titleRef.current?.querySelectorAll('.letter');
    if (letters) {
      gsap.set(letters, {
        y: 100,
        opacity: 0,
        rotateX: -90
      });

      tl.to(letters, {
        y: 0,
        opacity: 1,
        rotateX: 0,
        duration: 0.4,
        stagger: 0.04,
        ease: 'back.out(1.7)'
      });
    }

    // Hold, then throw to top-left where header is
    tl.to({}, { duration: 0.3 });

    tl.to(titleRef.current, {
      scale: 0.15,
      x: '-35vw',
      y: '-40vh',
      opacity: 0,
      duration: 0.4,
      ease: 'power3.in'
    });

    // Show header title and content
    tl.to(headerTitleRef.current, {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out'
    }, '-=0.2');

    tl.to(contentRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: 'power2.out',
      onComplete: () => setIsTransitioning(false)
    }, '-=0.2');

  }, [title, showTransition]);

  const handleTabClick = (path: string) => {
    if (path === location.pathname) return;
    navigate(path);
  };

  return (
    <div className="min-h-screen h-screen bg-background flex flex-col overflow-hidden">
      <AdminButton />

      {/* Fullscreen title transition overlay */}
      {isTransitioning && (
        <div 
          ref={titleRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background px-4"
          style={{ perspective: '1000px' }}
        >
          <div className="flex">
            {displayTitle.split('').map((char, i) => (
              <span
                key={i}
                className="letter inline-block text-[12vw] sm:text-[15vw] md:text-[18vw] font-black lowercase leading-none tracking-tight text-foreground"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Header with tabs - all in top left */}
      <header className="relative z-20 border-b border-border/20 bg-background/80 backdrop-blur-sm flex-shrink-0">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4 md:gap-8 h-12 sm:h-14 md:h-16">
            {/* Page title */}
            <h1 
              ref={headerTitleRef}
              className="text-lg sm:text-xl md:text-2xl font-black lowercase tracking-tight text-foreground flex-shrink-0"
            >
              {title}
            </h1>

            {/* Navigation tabs - next to title */}
            <nav className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.path)}
                  className={`px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs md:text-sm font-mono lowercase rounded-md sm:rounded-lg transition-all duration-200 whitespace-nowrap ${
                    currentTab === tab.id
                      ? 'bg-foreground text-background font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main content - fills remaining space */}
      <main 
        ref={contentRef}
        className="relative z-10 flex-1 w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 overflow-y-auto lg:overflow-hidden"
      >
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
