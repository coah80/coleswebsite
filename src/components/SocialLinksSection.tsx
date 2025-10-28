import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getPlatformVisuals } from '@/lib/social-platforms';

interface SocialLink {
  id: string;
  name: string;
  handle: string;
  url: string;
  description: string | null;
  display_order: number;
  is_published: boolean;
}

interface SocialLinksSectionProps {
  isLandscape: boolean;
}

const SocialLinksSection = ({ isLandscape }: SocialLinksSectionProps) => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  const fetchSocialLinks = async () => {
    setError(null);
    console.log('Fetching social links...');
    try {
      const { data, error } = await supabase
        .from('social_links')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true });

      console.log('Social links query result:', { data, error });
      
      if (error) throw error;
      setSocialLinks(data || []);
      console.log('Social links set to:', data);
    } catch (error) {
      console.error('Error fetching social links:', error);
      setError('Unable to load social links. Please check your connection.');
    }
    setIsLoading(false);
  };

  // Calculate button height based on number of links and available space
  const getButtonHeight = () => {
    if (!isLandscape || socialLinks.length === 0) return 'auto';
    
    // Base calculation: divide available space by number of buttons
    // Account for gaps between buttons (4px each)
    const gapSpace = (socialLinks.length - 1) * 4;
    return `calc((100% - ${gapSpace}px) / ${socialLinks.length})`;
  };

  // Determine if we should show compact mode (icon only)
  const shouldShowCompact = () => {
    if (!isLandscape) return false;
    return socialLinks.length > 8 || window.innerHeight < 700;
  };

  const getButtonStyle = (linkCount: number, isLandscape: boolean) => {
    if (!isLandscape) return {};
    
    const gapSpace = (linkCount - 1) * 4;
    return {
      height: `calc((100% - ${gapSpace}px) / ${linkCount})`,
      minHeight: '45px',
      padding: '12px'
    };
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">{error}</p>
          <button 
            onClick={fetchSocialLinks}
            className="text-sm text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isLandscape ? 'h-full flex flex-col overflow-hidden' : 'flex flex-col'}`} data-section="social">
      {/* Main Socials */}
      <div className={`${isLandscape ? 'flex-1 flex flex-col min-h-0' : ''}`}>
        <h2 className={`text-base lg:text-lg xl:text-xl font-semibold text-foreground font-fun ${isLandscape ? 'mb-6 xl:mb-8 flex-shrink-0' : 'mb-2 lg:mb-3'}`}>find me here</h2>
        
        {/* Button Container */}
        <div className={`${isLandscape ? 'flex-1 min-h-0' : 'flex-1'}`}>
          {isLandscape ? (
            // Landscape: Vertical stack with equal heights
            <div className="h-full flex flex-col gap-1">
              {socialLinks.map((link, index) => {
                const { icon: IconComponent, gradient } = getPlatformVisuals(link.name, link.url);
                const isCompact = shouldShowCompact();
                
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                    style={{ 
                      height: getButtonHeight(),
                      minHeight: '45px',
                      animationDelay: `${index * 100}ms` 
                    }}
                  >
                    <Card className="h-full p-3 bg-card/50 border-border/30 hover:border-primary/50 transition-all duration-300 hover:shadow-link hover:-translate-y-1 group-hover:bg-gradient-card">
                      <div className={`flex items-center h-full ${isCompact ? 'justify-center' : 'gap-3'}`}>
                        {/* Icon */}
                        <div className={`p-2 rounded-full bg-gradient-to-r shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0 ${gradient}`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        
                        {/* Text Content - Hidden in compact mode */}
                        {!isCompact && (
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium group-hover:text-primary transition-colors font-rounded truncate text-sm">
                                {link.name}
                              </span>
                              <ExternalLink className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary/70 transition-colors flex-shrink-0" />
                            </div>
                            <div className="text-muted-foreground font-code truncate text-xs">
                              {link.handle}
                            </div>
                            {link.description && (
                              <div className="text-muted-foreground/80 text-xs font-rounded italic truncate">
                                {link.description}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  </a>
                );
              })}
            </div>
          ) : (
            // Portrait: Regular spacing
            <div className="space-y-2">
              {socialLinks.map((link, index) => {
                const { icon: IconComponent, gradient } = getPlatformVisuals(link.name, link.url);
                const isCompact = shouldShowCompact();
                
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Card 
                      className={`${isLandscape ? '' : 'p-1.5 sm:p-2 lg:p-2.5'} bg-card/50 border-border/30 hover:border-primary/50 transition-all duration-300 hover:shadow-link hover:-translate-y-1 group-hover:bg-gradient-card`} 
                      style={getButtonStyle(socialLinks.length, isLandscape)}
                    >
                      <div className={`flex items-center h-full ${isLandscape ? (isCompact ? 'justify-center' : 'gap-3') : 'gap-1.5 sm:gap-2 lg:gap-3'}`}>
                        <div className={`${isLandscape ? 'p-2 rounded-full bg-gradient-to-r shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0' : 'p-1 lg:p-1.5 rounded-full bg-gradient-to-r shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0'} ${gradient}`}>
                          <IconComponent className={`${isLandscape ? 'w-6 h-6 text-white' : 'w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-white'}`} />
                        </div>
                        {!isCompact && (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium group-hover:text-primary transition-colors font-rounded truncate text-sm">
                              {link.name}
                            </span>
                            <ExternalLink className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary/70 transition-colors flex-shrink-0" />
                          </div>
                          <div className="text-muted-foreground font-code truncate text-xs">
                            {link.handle}
                          </div>
                          {link.description && (
                            <div className={`text-muted-foreground/80 ${isLandscape ? 'block' : 'hidden md:block'} text-xs font-rounded italic truncate`}>
                              {link.description}
                            </div>
                          )}
                        </div>
                        )}
                      </div>
                    </Card>
                  </a>
                );
              })}
            </div>
          )}
        </div>
        
        {/* No links message */}
        {socialLinks.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No social links available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialLinksSection;
