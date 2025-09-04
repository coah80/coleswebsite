import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Instagram, Youtube, Twitter, Github, Mail, MessageCircle, Coffee,
  Gamepad2, Music, Camera, Linkedin, Facebook, Twitch,
  Phone, MapPin, Globe, Heart, Star, Bookmark, ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SocialLink {
  id: string;
  name: string;
  handle: string;
  url: string;
  description: string | null;
  display_order: number;
  is_published: boolean;
}

const PLATFORM_CONFIG: Record<string, { icon: any; color: string }> = {
  // Social Media
  instagram: { icon: Instagram, color: 'from-pink-500 to-purple-500' },
  youtube: { icon: Youtube, color: 'from-red-500 to-red-600' },
  twitter: { icon: Twitter, color: 'from-blue-400 to-blue-500' },
  x: { icon: Twitter, color: 'from-blue-400 to-blue-500' },
  github: { icon: Github, color: 'from-gray-600 to-gray-700' },
  linkedin: { icon: Linkedin, color: 'from-blue-600 to-blue-700' },
  facebook: { icon: Facebook, color: 'from-blue-500 to-blue-600' },
  discord: { icon: MessageCircle, color: 'from-indigo-500 to-purple-500' },
  twitch: { icon: Twitch, color: 'from-purple-500 to-purple-600' },
  
  // Gaming
  steam: { icon: Gamepad2, color: 'from-slate-600 to-slate-700' },
  epic: { icon: Gamepad2, color: 'from-gray-800 to-black' },
  playstation: { icon: Gamepad2, color: 'from-blue-600 to-blue-700' },
  xbox: { icon: Gamepad2, color: 'from-green-500 to-green-600' },
  nintendo: { icon: Gamepad2, color: 'from-red-500 to-blue-500' },
  
  // Creative/Professional
  spotify: { icon: Music, color: 'from-green-500 to-green-600' },
  soundcloud: { icon: Music, color: 'from-orange-500 to-orange-600' },
  behance: { icon: Camera, color: 'from-blue-500 to-purple-500' },
  dribbble: { icon: Camera, color: 'from-pink-500 to-red-500' },
  
  // Support/Donation
  'ko-fi': { icon: Coffee, color: 'from-orange-400 to-orange-500' },
  kofi: { icon: Coffee, color: 'from-orange-400 to-orange-500' },
  patreon: { icon: Heart, color: 'from-orange-500 to-red-500' },
  paypal: { icon: Heart, color: 'from-blue-500 to-blue-600' },
  
  // Contact
  email: { icon: Mail, color: 'from-green-500 to-green-600' },
  phone: { icon: Phone, color: 'from-green-500 to-green-600' },
  website: { icon: Globe, color: 'from-blue-500 to-purple-500' },
  
  // Default fallback
  default: { icon: ExternalLink, color: 'from-gray-500 to-gray-600' }
};

interface SocialLinksSectionProps {
  isLandscape: boolean;
}

const detectPlatform = (name: string, url: string): { icon: any; color: string } => {
  const nameKey = name.toLowerCase().replace(/[^a-z]/g, '');
  const urlKey = url.toLowerCase();
  
  // Check name first
  if (PLATFORM_CONFIG[nameKey]) {
    return PLATFORM_CONFIG[nameKey];
  }
  
  // Check URL for platform detection
  for (const [platform, config] of Object.entries(PLATFORM_CONFIG)) {
    if (urlKey.includes(platform) || urlKey.includes(platform.replace('-', ''))) {
      return config;
    }
  }
  
  return PLATFORM_CONFIG.default;
};

const SocialLinksSection = ({ isLandscape }: SocialLinksSectionProps) => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  const fetchSocialLinks = async () => {
    setError(null);
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
      setError('Unable to load social links. Please check your connection.');
    }
    setIsLoading(false);
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
    <div className={`${isLandscape ? 'h-full flex flex-col' : 'flex flex-col'}`} data-section="social">
      {/* Main Socials */}
      <div className={`${isLandscape ? 'h-full flex flex-col' : ''}`}>
        <h2 className={`text-base lg:text-lg xl:text-xl font-semibold text-foreground font-fun ${isLandscape ? 'mb-2 xl:mb-3 flex-shrink-0' : 'mb-2 lg:mb-3'}`}>find me here</h2>
        <div className={`${isLandscape ? 'flex-1 flex flex-col' : 'flex-1'}`}>
          <div className={`${isLandscape ? 'flex flex-col h-full' : 'space-y-1.5 lg:space-y-2 pb-2 lg:pb-4'}`}>
            {socialLinks.map((link, index) => {
              const { icon: IconComponent, color } = detectPlatform(link.name, link.url);
              
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className={`${isLandscape ? 'flex-1 p-2 xl:p-3 2xl:p-4' : 'p-1.5 sm:p-2 lg:p-2.5'} bg-card/50 border-border/30 hover:border-primary/50 transition-all duration-300 hover:shadow-link hover:-translate-y-1 group-hover:bg-gradient-card`}>
                    <div className={`flex items-center h-full ${isLandscape ? 'gap-2 xl:gap-3 2xl:gap-4' : 'gap-1.5 sm:gap-2 lg:gap-3'}`}>
                      <div className={`${isLandscape ? 'p-1 xl:p-1.5 2xl:p-2' : 'p-1 lg:p-1.5'} rounded-full bg-gradient-to-r ${color} shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                        <IconComponent className={`${isLandscape ? 'w-4 h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6' : 'w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4'} text-white`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium group-hover:text-primary transition-colors font-rounded ${isLandscape ? 'text-sm xl:text-base 2xl:text-lg' : 'text-xs sm:text-xs lg:text-sm'} truncate`}>
                            {link.name}
                          </span>
                          <ExternalLink className={`${isLandscape ? 'h-3 w-3 xl:h-3.5 xl:w-3.5 2xl:h-4 2xl:w-4' : 'h-1.5 w-1.5 sm:h-2 sm:w-2 lg:h-2.5 lg:w-2.5'} text-muted-foreground/50 group-hover:text-primary/70 transition-colors flex-shrink-0`} />
                        </div>
                        <div className={`${isLandscape ? 'text-xs xl:text-sm 2xl:text-base' : 'text-xs sm:text-xs'} text-muted-foreground font-code truncate`}>
                          {link.handle}
                        </div>
                        {link.description && (
                          <div className={`${isLandscape ? 'text-xs xl:text-sm 2xl:text-base' : 'text-xs'} text-muted-foreground/80 ${isLandscape ? 'block' : 'hidden md:block'} font-rounded italic truncate`}>
                            {link.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </a>
              );
            })}
          </div>
        </div>
        
        {socialLinks.length === 0 && (
          <div className="text-center py-2">
            <p className="text-muted-foreground">No social links available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialLinksSection;