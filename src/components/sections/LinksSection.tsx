import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getPlatformVisuals } from '@/lib/social-platforms';
import SlamText from '@/components/typography/SlamText';

gsap.registerPlugin(ScrollTrigger);

interface SocialLink {
  id: string;
  name: string;
  handle: string;
  url: string;
  description: string | null;
  display_order: number;
  is_published: boolean;
}

const LinksSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasAnimated = useRef(false);

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  useEffect(() => {
    if (!linksRef.current || isLoading || hasAnimated.current) return;

    const links = linksRef.current.querySelectorAll('.social-link');
    
    gsap.set(links, {
      x: -100,
      opacity: 0,
      rotateY: -15
    });

    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 70%',
      onEnter: () => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;

        gsap.to(links, {
          x: 0,
          opacity: 1,
          rotateY: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'back.out(1.2)'
        });
      },
      once: true
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [isLoading]);

  const fetchSocialLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSocialLinks(data || []);
    } catch (error) {
      console.error('Error fetching social links:', error);
    }
    setIsLoading(false);
  };

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
    >
      {/* Section header */}
      <div className="text-center mb-16">
        <SlamText 
          as="h2"
          className="text-[10vw] md:text-[8vw] lg:text-[6vw] font-black lowercase leading-none tracking-tight justify-center"
          scrollTrigger={true}
        >
          find me
        </SlamText>
        <p className="mt-4 text-muted-foreground font-mono text-sm md:text-base">
          links to everywhere i exist online
        </p>
      </div>

      {/* Links grid */}
      <div 
        ref={linksRef}
        className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-card/30 rounded-lg animate-pulse" />
          ))
        ) : (
          socialLinks.map((link) => {
            const { icon: IconComponent, gradient } = getPlatformVisuals(link.name, link.url);
            
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link group block"
              >
                <div className="flex items-center gap-4 p-4 bg-card/30 border border-border/20 rounded-lg transition-all duration-200 hover:bg-card/60 hover:border-border/40 hover:scale-[1.02] hover:-translate-y-0.5">
                  {/* Icon */}
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${gradient} group-hover:scale-110 transition-transform duration-200`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground group-hover:text-foreground/90 truncate">
                        {link.name}
                      </span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-sm font-mono text-muted-foreground truncate block">
                      {link.handle}
                    </span>
                  </div>
                </div>
              </a>
            );
          })
        )}
      </div>

      {socialLinks.length === 0 && !isLoading && (
        <p className="text-muted-foreground font-mono text-sm">no links available</p>
      )}
    </section>
  );
};

export default LinksSection;
