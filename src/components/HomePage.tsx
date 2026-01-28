import { useRef } from 'react';

// Decorations
import FakeSearchBar from '@/components/decorations/FakeSearchBar';
import CursorIcon from '@/components/decorations/CursorIcon';

// Sections
import HeroSection from '@/components/sections/HeroSection';
import LinksSection from '@/components/sections/LinksSection';
import WorkSection from '@/components/sections/WorkSection';
import ContactSection from '@/components/sections/ContactSection';

import AdminButton from '@/components/AdminButton';

const HomePage = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground">
      <AdminButton />
      
      {/* Floating decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-20 left-10 opacity-30 animate-float">
          <FakeSearchBar query="searching..." />
        </div>
        <div className="absolute top-40 right-20 opacity-20 animate-float-slow" style={{ animationDelay: '1s' }}>
          <CursorIcon label="visitor" />
        </div>
        <div className="absolute bottom-40 left-[20%] opacity-10 text-6xl font-black animate-float" style={{ animationDelay: '2s' }}>
          404
        </div>
        <div className="absolute top-[60%] right-[15%] opacity-10 text-4xl font-black animate-float-slow" style={{ animationDelay: '0.5s' }}>
          &lt;/&gt;
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        <HeroSection />
        <LinksSection />
        <WorkSection />
        <ContactSection />
      </div>

      {/* Footer */}
      <footer className="py-12 text-center border-t border-border/20">
        <p className="text-sm text-muted-foreground font-mono">
          © {new Date().getFullYear()} coah · built with kinetic energy
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
