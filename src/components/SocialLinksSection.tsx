import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { 
  Instagram, Youtube, Twitter, Github, Mail, MessageCircle, Coffee,
  Gamepad2, Music, Camera, Linkedin, Facebook, Twitch, ExternalLink,
  Phone, MapPin, Globe, Heart, Star, Bookmark, Video, Mic, Radio,
  Users, Zap, Play, Headphones, Monitor, Smartphone, Tv, Film, Calendar as CalendarIcon,
  Share, Link, Hash, AtSign, DollarSign, Gift, ShoppingCart, Edit
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
  tiktok: { icon: Video, color: 'from-black to-pink-500' },
  youtube: { icon: Youtube, color: 'from-red-500 to-red-600' },
  twitter: { icon: Twitter, color: 'from-blue-400 to-blue-500' },
  x: { icon: Twitter, color: 'from-blue-400 to-blue-500' },
  github: { icon: Github, color: 'from-gray-600 to-gray-700' },
  linkedin: { icon: Linkedin, color: 'from-blue-600 to-blue-700' },
  facebook: { icon: Facebook, color: 'from-blue-500 to-blue-600' },
  discord: { icon: MessageCircle, color: 'from-indigo-500 to-purple-500' },
  twitch: { icon: Twitch, color: 'from-purple-500 to-purple-600' },
  snapchat: { icon: Camera, color: 'from-yellow-400 to-yellow-500' },
  reddit: { icon: MessageCircle, color: 'from-orange-500 to-red-500' },
  telegram: { icon: MessageCircle, color: 'from-blue-400 to-blue-500' },
  whatsapp: { icon: MessageCircle, color: 'from-green-400 to-green-500' },
  signal: { icon: MessageCircle, color: 'from-blue-500 to-blue-600' },
  mastodon: { icon: Share, color: 'from-purple-500 to-blue-500' },
  threads: { icon: AtSign, color: 'from-black to-gray-700' },
  bluesky: { icon: Twitter, color: 'from-blue-400 to-sky-500' },
  
  // Gaming
  steam: { icon: Gamepad2, color: 'from-slate-600 to-slate-700' },
  epic: { icon: Gamepad2, color: 'from-gray-800 to-black' },
  epicgames: { icon: Gamepad2, color: 'from-gray-800 to-black' },
  playstation: { icon: Gamepad2, color: 'from-blue-600 to-blue-700' },
  ps4: { icon: Gamepad2, color: 'from-blue-600 to-blue-700' },
  ps5: { icon: Gamepad2, color: 'from-blue-600 to-blue-700' },
  xbox: { icon: Gamepad2, color: 'from-green-500 to-green-600' },
  nintendo: { icon: Gamepad2, color: 'from-red-500 to-blue-500' },
  switch: { icon: Gamepad2, color: 'from-red-500 to-blue-500' },
  battlenet: { icon: Gamepad2, color: 'from-blue-500 to-blue-600' },
  origin: { icon: Gamepad2, color: 'from-orange-500 to-orange-600' },
  uplay: { icon: Gamepad2, color: 'from-blue-500 to-purple-500' },
  gog: { icon: Gamepad2, color: 'from-purple-500 to-pink-500' },
  itch: { icon: Gamepad2, color: 'from-red-500 to-pink-500' },
  itchio: { icon: Gamepad2, color: 'from-red-500 to-pink-500' },
  
  // Creative/Professional
  spotify: { icon: Music, color: 'from-green-500 to-green-600' },
  applemusic: { icon: Music, color: 'from-red-500 to-pink-500' },
  soundcloud: { icon: Music, color: 'from-orange-500 to-orange-600' },
  bandcamp: { icon: Music, color: 'from-blue-400 to-teal-500' },
  lastfm: { icon: Music, color: 'from-red-500 to-red-600' },
  deezer: { icon: Music, color: 'from-purple-500 to-pink-500' },
  behance: { icon: Camera, color: 'from-blue-500 to-purple-500' },
  dribbble: { icon: Camera, color: 'from-pink-500 to-red-500' },
  deviantart: { icon: Camera, color: 'from-green-500 to-teal-500' },
  artstation: { icon: Camera, color: 'from-blue-500 to-indigo-600' },
  figma: { icon: Monitor, color: 'from-purple-500 to-pink-500' },
  adobe: { icon: Camera, color: 'from-red-500 to-orange-500' },
  
  // Content Creation
  onlyfans: { icon: Heart, color: 'from-blue-500 to-cyan-500' },
  fansly: { icon: Heart, color: 'from-purple-500 to-pink-500' },
  cameo: { icon: Video, color: 'from-purple-500 to-blue-500' },
  
  // Streaming/Video
  kick: { icon: Video, color: 'from-green-400 to-green-500' },
  rumble: { icon: Video, color: 'from-green-500 to-green-600' },
  vimeo: { icon: Video, color: 'from-blue-400 to-blue-500' },
  dailymotion: { icon: Video, color: 'from-blue-500 to-orange-500' },
  
  // Audio/Podcasting
  podcast: { icon: Mic, color: 'from-purple-500 to-pink-500' },
  anchor: { icon: Mic, color: 'from-purple-500 to-purple-600' },
  clubhouse: { icon: Mic, color: 'from-orange-400 to-yellow-500' },
  spaces: { icon: Mic, color: 'from-blue-400 to-purple-500' },
  
  // Support/Donation
  'ko-fi': { icon: Coffee, color: 'from-orange-400 to-orange-500' },
  kofi: { icon: Coffee, color: 'from-orange-400 to-orange-500' },
  patreon: { icon: Heart, color: 'from-orange-500 to-red-500' },
  paypal: { icon: Heart, color: 'from-blue-500 to-blue-600' },
  venmo: { icon: DollarSign, color: 'from-blue-400 to-blue-500' },
  cashapp: { icon: DollarSign, color: 'from-green-500 to-green-600' },
  buymeacoffee: { icon: Coffee, color: 'from-yellow-400 to-orange-500' },
  gofundme: { icon: Heart, color: 'from-green-500 to-teal-500' },
  kickstarter: { icon: Gift, color: 'from-green-500 to-blue-500' },
  indiegogo: { icon: Gift, color: 'from-pink-500 to-purple-500' },
  
  // Professional/Business
  calendly: { icon: CalendarIcon, color: 'from-blue-500 to-blue-600' },
  linktree: { icon: Link, color: 'from-green-400 to-green-500' },
  beacons: { icon: Link, color: 'from-purple-500 to-pink-500' },
  carrd: { icon: Link, color: 'from-blue-500 to-purple-500' },
  
  // Shopping/Commerce
  etsy: { icon: ShoppingCart, color: 'from-orange-500 to-red-500' },
  amazon: { icon: ShoppingCart, color: 'from-orange-400 to-yellow-500' },
  ebay: { icon: ShoppingCart, color: 'from-blue-500 to-yellow-500' },
  shopify: { icon: ShoppingCart, color: 'from-green-500 to-green-600' },
  
  // Dating/Social
  tinder: { icon: Heart, color: 'from-red-500 to-pink-500' },
  bumble: { icon: Heart, color: 'from-yellow-400 to-orange-500' },
  hinge: { icon: Heart, color: 'from-purple-500 to-pink-500' },
  
  // Other Platforms
  medium: { icon: Edit, color: 'from-gray-700 to-black' },
  substack: { icon: Mail, color: 'from-orange-500 to-red-500' },
  hashnode: { icon: Hash, color: 'from-blue-500 to-purple-500' },
  devto: { icon: Monitor, color: 'from-black to-gray-700' },
  stackoverflow: { icon: Monitor, color: 'from-orange-500 to-orange-600' },
  codepen: { icon: Monitor, color: 'from-black to-gray-700' },
  replit: { icon: Monitor, color: 'from-orange-500 to-blue-500' },
  glitch: { icon: Zap, color: 'from-purple-500 to-pink-500' },
  netlify: { icon: Globe, color: 'from-teal-400 to-blue-500' },
  vercel: { icon: Globe, color: 'from-black to-gray-700' },
  
  // Messaging/Communication
  slack: { icon: MessageCircle, color: 'from-purple-500 to-pink-500' },
  teams: { icon: Users, color: 'from-blue-500 to-purple-500' },
  zoom: { icon: Video, color: 'from-blue-500 to-blue-600' },
  skype: { icon: Video, color: 'from-blue-400 to-blue-500' },
  
  // Contact
  email: { icon: Mail, color: 'from-green-500 to-green-600' },
  phone: { icon: Phone, color: 'from-green-500 to-green-600' },
  website: { icon: Globe, color: 'from-blue-500 to-purple-500' },
  blog: { icon: Edit, color: 'from-blue-500 to-purple-500' },
  portfolio: { icon: Bookmark, color: 'from-purple-500 to-pink-500' },
  
  // Default fallback
  default: { icon: ExternalLink, color: 'from-gray-500 to-gray-600' }
};

interface SocialLinksSectionProps {
  isLandscape: boolean;
}

const detectPlatform = (name: string, url: string): { icon: any; color: string } => {
  const nameKey = (name || '').toLowerCase().replace(/[^a-z]/g, '');
  const urlKey = (url || '').toLowerCase();
  
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
  const [screenHeight, setScreenHeight] = useState(window.innerHeight);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setScreenHeight(window.innerHeight);
      // Switch to icon-only mode when screen is very short or when there are many links
      setIsCompact(window.innerHeight < 600 || socialLinks.length > 8);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [socialLinks.length]);

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
        <div className={`${isLandscape ? 'flex-1 flex flex-col min-h-0' : 'flex-1'}`}>
          <div className={`${isLandscape ? 'flex flex-col h-full' : 'space-y-1.5 lg:space-y-2 pb-2 lg:pb-4'}`} style={isLandscape ? { 
            height: '100%',
            gap: '4px'
          } : {}}>
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
                  <Card className={`${isLandscape ? '' : 'p-1.5 sm:p-2 lg:p-2.5'} bg-card/50 border-border/30 hover:border-primary/50 transition-all duration-300 hover:shadow-link hover:-translate-y-1 group-hover:bg-gradient-card`} style={isLandscape ? { 
                    height: `calc((100% - ${(socialLinks.length - 1) * 4}px) / ${socialLinks.length})`,
                    minHeight: '50px',
                    padding: '8px'
                  } : {}}>
                    <div className={`flex items-center h-full ${isLandscape ? (isCompact ? 'justify-center' : 'gap-3') : 'gap-1.5 sm:gap-2 lg:gap-3'}`}>
                      <div className={`${isLandscape ? 'p-2 rounded-full bg-gradient-to-r shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0' : 'p-1 lg:p-1.5 rounded-full bg-gradient-to-r shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0'} ${color}`}>
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
        </div>
        
        {socialLinks.length === 0 && !isLandscape && (
          <div className="text-center py-2">
            <p className="text-muted-foreground">No social links available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialLinksSection;