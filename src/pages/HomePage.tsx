import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Headphones, Gamepad2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getPlatformVisuals } from '@/lib/social-platforms';
import PageLayout from '@/components/PageLayout';
import WarpText from '@/components/typography/WarpText';
import RainbowJumpText from '@/components/typography/RainbowJumpText';

interface LanyardData {
  discord_user: {
    id: string;
    username: string;
    avatar: string;
    global_name?: string;
  };
  discord_status: 'online' | 'idle' | 'dnd' | 'offline';
  listening_to_spotify: boolean;
  activities: Array<{
    id: string;
    name: string;
    type: number;
    state?: string;
    details?: string;
    timestamps?: { start?: number; end?: number };
    assets?: { large_image?: string };
    application_id?: string;
    emoji?: { name: string; id?: string; animated?: boolean };
  }>;
  spotify?: {
    track_id: string;
    timestamps: { start: number; end: number };
    song: string;
    artist: string;
    album_art_url: string;
    album: string;
  } | null;
}

interface SocialLink {
  id: string;
  name: string;
  handle: string;
  url: string;
  display_order: number;
}

const HomePage = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [lanyardData, setLanyardData] = useState<LanyardData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  const DISCORD_USER_ID = (import.meta.env.VITE_DISCORD_USER_ID && 
    typeof import.meta.env.VITE_DISCORD_USER_ID === 'string' && 
    import.meta.env.VITE_DISCORD_USER_ID.trim() !== '') 
    ? import.meta.env.VITE_DISCORD_USER_ID 
    : '761701756119547955';

  // Handle viewport resize
  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch social links
  useEffect(() => {
    const fetchLinks = async () => {
      const { data } = await supabase
        .from('social_links')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true });
      setSocialLinks(data || []);
    };
    fetchLinks();
  }, []);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Lanyard WebSocket
  useEffect(() => {
    let ws: WebSocket | null = null;
    let heartbeatInterval: NodeJS.Timeout;

    const connect = () => {
      if (!DISCORD_USER_ID || !/^\d{17,19}$/.test(DISCORD_USER_ID)) return;
      
      ws = new WebSocket('wss://api.lanyard.rest/socket');
      
      ws.onopen = () => {
        setIsConnected(true);
        ws?.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_USER_ID } }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.op === 0 && message.d) setLanyardData(message.d);
        if (message.op === 1) {
          ws?.send(JSON.stringify({ op: 3 }));
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          heartbeatInterval = setInterval(() => ws?.send(JSON.stringify({ op: 3 })), message.d?.heartbeat_interval || 30000);
        }
      };

      ws.onclose = () => setIsConnected(false);
      ws.onerror = () => { setIsConnected(false); ws?.close(); };
    };

    connect();
    return () => { ws?.close(); clearInterval(heartbeatInterval); };
  }, [DISCORD_USER_ID]);

  // Animate tiles
  useEffect(() => {
    if (!gridRef.current) return;
    const tiles = gridRef.current.querySelectorAll('.bento-tile');
    
    gsap.set(tiles, { opacity: 0, y: 20, scale: 0.97 });
    gsap.to(tiles, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.4,
      stagger: 0.06,
      ease: 'back.out(1.4)',
      delay: 0.2 // Small delay after intro completes
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-muted-foreground/50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'online';
      case 'idle': return 'away';
      case 'dnd': return 'busy';
      default: return 'offline';
    }
  };

  const formatSpotifyTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatElapsedTime = (startTime: number) => {
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const getDiscordAvatarUrl = () => {
    if (!lanyardData?.discord_user) return null;
    const { id, avatar } = lanyardData.discord_user;
    return `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=256`;
  };

  const gameActivity = lanyardData?.activities?.find(a => a.type === 0);
  const customStatus = lanyardData?.activities?.find(a => a.type === 4);
  // Use listening_to_spotify flag AND check spotify object exists
  const isSpotifyActive = lanyardData?.listening_to_spotify && lanyardData?.spotify;

  // Calculate social rows needed
  // 1-3: 1 per row, 4-6: 2 per row, 7+: 4 per row
  const getSocialsPerRow = () => {
    if (socialLinks.length <= 3) return 1;
    if (socialLinks.length <= 6) return 2;
    return 4; // 4 per row for 7+ socials
  };
  const getSocialRows = () => Math.max(2, Math.ceil(socialLinks.length / getSocialsPerRow()));

  // Dynamic row height based on social count - fill the screen exactly
  const getRowHeight = () => {
    // Header is h-14 on mobile, h-16 on desktop (64px)
    // Main has py-4 on mobile, py-5 on desktop (20px * 2 = 40px)
    // Plus gap between rows (4 * (rows - 1))
    const headerHeight = 64;
    const paddingY = 40;
    const socialRows = getSocialRows();
    const gapSize = 16; // gap-4
    const totalGapHeight = gapSize * (socialRows - 1);
    const availableHeight = viewportHeight - headerHeight - paddingY - totalGapHeight;
    return Math.floor(availableHeight / socialRows);
  };

  // Profile spans same number of rows as socials
  const getProfileRowSpan = () => getSocialRows();

  return (
    <PageLayout title="home" showTransition={true}>
      <div 
        ref={gridRef}
        className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 sm:gap-3 md:gap-4 h-full overflow-y-auto lg:overflow-hidden pb-4 lg:pb-0"
        style={{ 
          gridAutoRows: window.innerWidth >= 1024 ? `${getRowHeight()}px` : 'auto',
        }}
      >
        {/* ===== PROFILE TILE ===== */}
        <div 
          className="bento-tile col-span-2 sm:col-span-4 md:col-span-3 lg:col-span-4 bg-card/40 border border-border/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 flex flex-col overflow-hidden relative group"
          style={{ gridRow: window.innerWidth >= 1024 ? `span ${getProfileRowSpan()}` : 'auto' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10 flex items-start gap-3 sm:gap-4 mb-2 sm:mb-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl overflow-hidden ring-2 ring-border/30">
                {lanyardData?.discord_user ? (
                  <img src={getDiscordAvatarUrl()!} alt="coah" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted/50 animate-pulse" />
                )}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border-2 sm:border-4 border-card ${getStatusColor(lanyardData?.discord_status || 'offline')} ${lanyardData?.discord_status === 'online' ? 'animate-pulse' : ''}`} />
            </div>

            {/* Name + Status */}
            <div className="flex-1 min-w-0">
              <WarpText className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black lowercase leading-none tracking-tight text-foreground">
                coah
              </WarpText>
              
              <div className="mt-1 sm:mt-2 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${getStatusColor(lanyardData?.discord_status || 'offline')}`} />
                <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">
                  {getStatusText(lanyardData?.discord_status || 'offline')}
                </span>
                {customStatus?.state && (
                  <>
                    <span className="text-muted-foreground/30 hidden sm:inline">·</span>
                    <span className="text-[10px] sm:text-xs text-foreground/60 italic hidden sm:inline">"{customStatus.state}"</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          <p className="text-muted-foreground font-mono text-[10px] sm:text-xs md:text-sm leading-relaxed mb-2 sm:mb-3">
            video editor · content creator · bad coder
          </p>

          {/* Activity */}
          <div className="relative z-10 mt-auto">
              {isSpotifyActive && lanyardData?.spotify && (
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-green-500/10 border border-green-500/20 rounded-lg sm:rounded-xl">
                  <img src={lanyardData.spotify.album_art_url} alt={lanyardData.spotify.album} className="w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
                      <Headphones className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400" />
                      <span className="text-[8px] sm:text-[10px] font-mono text-green-400 uppercase">listening</span>
                    </div>
                    <p className="font-bold text-[10px] sm:text-xs text-foreground truncate">{lanyardData.spotify.song}</p>
                    <p className="text-[8px] sm:text-[10px] text-muted-foreground truncate">{lanyardData.spotify.artist}</p>
                  </div>
                  <div className="text-[8px] sm:text-[10px] font-mono text-muted-foreground hidden sm:block">
                    {formatSpotifyTime(currentTime - lanyardData.spotify.timestamps.start)}
                  </div>
                </div>
              )}

              {!isSpotifyActive && gameActivity && (
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-accent/10 border border-accent/20 rounded-lg sm:rounded-xl">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg bg-muted/30 flex items-center justify-center">
                    <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
                      <span className="text-[8px] sm:text-[10px] font-mono text-accent uppercase">playing</span>
                    </div>
                    <p className="font-bold text-[10px] sm:text-xs text-foreground truncate">{gameActivity.name}</p>
                    {gameActivity.details && <p className="text-[8px] sm:text-[10px] text-muted-foreground truncate">{gameActivity.details}</p>}
                  </div>
                  {gameActivity.timestamps?.start && (
                    <div className="items-center gap-1 text-[8px] sm:text-[10px] font-mono text-muted-foreground hidden sm:flex">
                      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {formatElapsedTime(gameActivity.timestamps.start)}
                    </div>
                  )}
                </div>
              )}

              {!isSpotifyActive && !gameActivity && (
                <div className="p-2 sm:p-3 bg-muted/10 border border-border/20 rounded-lg sm:rounded-xl">
                  <p className="text-[10px] sm:text-xs font-mono text-muted-foreground/60 text-center">not doing anything rn</p>
                </div>
              )}
            </div>
        </div>

        {/* ===== SOCIAL LINKS ===== */}
        {socialLinks.map((link) => {
          const { icon: IconComponent, gradient, hoverBg } = getPlatformVisuals(link.name, link.url);
          const count = socialLinks.length;
          
          // Dynamic sizing - responsive for all screen sizes
          let colSpan = 'col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-8';
          
          if (count <= 3) {
            colSpan = 'col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-8';
          } else if (count <= 6) {
            colSpan = 'col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4';
          } else {
            colSpan = 'col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2';
          }
          
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`bento-tile ${colSpan} row-span-1 bg-card/30 border border-border/20 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 flex flex-col items-center justify-center gap-1 sm:gap-2 group ${hoverBg} hover:border-border/40 transition-all duration-200 hover:scale-[1.02]`}
            >
              {/* Icon */}
              <div className={`p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br ${gradient} group-hover:scale-110 transition-transform`}>
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              
              {/* Platform name - rainbow on hover */}
              <RainbowJumpText className="font-black text-xs sm:text-sm md:text-lg text-foreground text-center leading-tight" triggerOnParentHover>{link.name}</RainbowJumpText>
              
              {/* Handle - hidden on very small screens */}
              <span className="text-[8px] sm:text-[10px] md:text-xs font-mono text-muted-foreground truncate max-w-full hidden sm:block">{link.handle}</span>
            </a>
          );
        })}

      </div>
    </PageLayout>
  );
};

export default HomePage;
