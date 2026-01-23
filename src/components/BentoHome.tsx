import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Headphones, Gamepad2, Clock, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getPlatformVisuals } from '@/lib/social-platforms';
import SlamText from '@/components/typography/SlamText';
import TypewriterText from '@/components/typography/TypewriterText';
import WarpText from '@/components/typography/WarpText';
import FakeSearchBar from '@/components/decorations/FakeSearchBar';
import CursorIcon from '@/components/decorations/CursorIcon';
import AdminButton from '@/components/AdminButton';

interface LanyardData {
  discord_user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    global_name?: string;
  };
  discord_status: 'online' | 'idle' | 'dnd' | 'offline';
  activities: Array<{
    id: string;
    name: string;
    type: number;
    state?: string;
    details?: string;
    timestamps?: { start?: number; end?: number };
    assets?: { large_image?: string; large_text?: string; small_image?: string; small_text?: string };
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
  };
}

interface SocialLink {
  id: string;
  name: string;
  handle: string;
  url: string;
  description: string | null;
  display_order: number;
  is_published: boolean;
}

const BentoHome = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lanyardData, setLanyardData] = useState<LanyardData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [activeView, setActiveView] = useState<'home' | 'portfolio' | 'contact'>('home');

  const DISCORD_USER_ID = (import.meta.env.VITE_DISCORD_USER_ID && 
    typeof import.meta.env.VITE_DISCORD_USER_ID === 'string' && 
    import.meta.env.VITE_DISCORD_USER_ID.trim() !== '') 
    ? import.meta.env.VITE_DISCORD_USER_ID 
    : '761701756119547955';

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
  const isSpotifyActive = lanyardData?.spotify && lanyardData.spotify.timestamps.end > currentTime;

  // Animate tiles on mount
  useEffect(() => {
    if (!containerRef.current) return;
    const tiles = containerRef.current.querySelectorAll('.bento-tile');
    
    gsap.set(tiles, { opacity: 0, y: 30, scale: 0.95 });
    gsap.to(tiles, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.5,
      stagger: 0.08,
      ease: 'back.out(1.4)',
      delay: 0.2
    });
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 flex items-center justify-center">
      <AdminButton />
      
      {/* Floating decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-6 right-8 opacity-20 animate-float">
          <FakeSearchBar query="coah.dev" />
        </div>
        <div className="absolute bottom-10 left-10 opacity-15 animate-float-slow">
          <CursorIcon label="you" />
        </div>
        <div className="absolute top-[40%] left-[5%] opacity-5 text-8xl font-black animate-float-slow">
          &lt;/&gt;
        </div>
      </div>

      {/* Bento Grid */}
      <div 
        ref={containerRef}
        className="relative z-10 w-full max-w-6xl grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 auto-rows-[80px] md:auto-rows-[100px] gap-3 md:gap-4"
      >
        {/* ===== MAIN PROFILE TILE (Large) ===== */}
        <div className="bento-tile col-span-4 md:col-span-4 lg:col-span-7 row-span-4 bg-card/40 border border-border/20 rounded-2xl p-6 md:p-8 flex flex-col justify-between overflow-hidden relative group">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10">
            {/* Top row: Avatar + Status */}
            <div className="flex items-start gap-4 md:gap-6 mb-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-2xl overflow-hidden ring-2 ring-border/30">
                  {lanyardData?.discord_user ? (
                    <img 
                      src={getDiscordAvatarUrl()!} 
                      alt="coah" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted/50 animate-pulse" />
                  )}
                </div>
                {/* Status dot */}
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full border-4 border-card ${getStatusColor(lanyardData?.discord_status || 'offline')} ${lanyardData?.discord_status === 'online' ? 'animate-pulse' : ''}`} />
              </div>

              {/* Name + Status */}
              <div className="flex-1 min-w-0 pt-1">
                <SlamText 
                  as="h1"
                  className="text-5xl md:text-6xl lg:text-7xl font-black lowercase leading-none tracking-tight"
                  stagger={0.03}
                  delay={0.3}
                >
                  coah
                </SlamText>
                
                <div className="mt-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(lanyardData?.discord_status || 'offline')}`} />
                  <span className="text-sm font-mono text-muted-foreground">
                    {getStatusText(lanyardData?.discord_status || 'offline')}
                  </span>
                  {customStatus?.state && (
                    <>
                      <span className="text-muted-foreground/30">·</span>
                      <span className="text-sm text-foreground/60 italic truncate">"{customStatus.state}"</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="mb-4">
              <p className="text-muted-foreground font-mono text-sm md:text-base leading-relaxed">
                <TypewriterText delay={0.8} speed={25} cursor={false}>
                  video editor · content creator · bad coder
                </TypewriterText>
              </p>
            </div>
          </div>

          {/* Activity at bottom */}
          <div className="relative z-10 mt-auto">
            {isSpotifyActive && lanyardData?.spotify && (
              <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <img 
                  src={lanyardData.spotify.album_art_url}
                  alt={lanyardData.spotify.album}
                  className="w-12 h-12 rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Headphones className="w-3 h-3 text-green-400" />
                    <span className="text-xs font-mono text-green-400 uppercase">listening</span>
                  </div>
                  <p className="font-bold text-sm text-foreground truncate">{lanyardData.spotify.song}</p>
                  <p className="text-xs text-muted-foreground truncate">{lanyardData.spotify.artist}</p>
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  {formatSpotifyTime(currentTime - lanyardData.spotify.timestamps.start)}
                </div>
              </div>
            )}

            {!isSpotifyActive && gameActivity && (
              <div className="flex items-center gap-3 p-3 bg-accent/10 border border-accent/20 rounded-xl">
                <div className="w-12 h-12 rounded-lg bg-muted/30 flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-accent uppercase">playing</span>
                  </div>
                  <p className="font-bold text-sm text-foreground truncate">{gameActivity.name}</p>
                  {gameActivity.details && (
                    <p className="text-xs text-muted-foreground truncate">{gameActivity.details}</p>
                  )}
                </div>
                {gameActivity.timestamps?.start && (
                  <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatElapsedTime(gameActivity.timestamps.start)}
                  </div>
                )}
              </div>
            )}

            {!isSpotifyActive && !gameActivity && (
              <div className="p-3 bg-muted/10 border border-border/20 rounded-xl">
                <p className="text-sm font-mono text-muted-foreground/60 text-center">
                  not doing anything rn
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ===== SOCIAL LINKS (Right side stack) ===== */}
        {socialLinks.slice(0, 5).map((link, i) => {
          const { icon: IconComponent, gradient } = getPlatformVisuals(link.name, link.url);
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`bento-tile col-span-2 md:col-span-2 lg:col-span-5 row-span-1 bg-card/30 border border-border/20 rounded-xl p-4 flex items-center gap-3 group hover:bg-card/50 hover:border-border/40 transition-all duration-200 hover:scale-[1.02]`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} group-hover:scale-110 transition-transform`}>
                <IconComponent className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-sm text-foreground truncate block">{link.name}</span>
                <span className="text-xs font-mono text-muted-foreground truncate block">{link.handle}</span>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          );
        })}

        {/* ===== BOTTOM NAVIGATION TILES ===== */}
        <div 
          onClick={() => setActiveView('portfolio')}
          className="bento-tile col-span-2 md:col-span-3 lg:col-span-4 row-span-2 bg-card/30 border border-border/20 rounded-2xl p-5 flex flex-col justify-center cursor-pointer group hover:bg-card/50 hover:border-border/40 transition-all duration-200"
        >
          <WarpText className="text-2xl md:text-3xl font-black lowercase text-foreground group-hover:text-accent transition-colors">
            portfolio
          </WarpText>
          <p className="text-xs font-mono text-muted-foreground mt-2">my work & projects</p>
        </div>

        <div 
          onClick={() => setActiveView('contact')}
          className="bento-tile col-span-2 md:col-span-3 lg:col-span-4 row-span-2 bg-card/30 border border-border/20 rounded-2xl p-5 flex flex-col justify-center cursor-pointer group hover:bg-card/50 hover:border-border/40 transition-all duration-200"
        >
          <WarpText className="text-2xl md:text-3xl font-black lowercase text-foreground group-hover:text-accent transition-colors">
            say hi
          </WarpText>
          <p className="text-xs font-mono text-muted-foreground mt-2">send a message or drawing</p>
        </div>

        {/* ===== DECORATIVE TILE ===== */}
        <div className="bento-tile col-span-4 md:col-span-6 lg:col-span-4 row-span-2 bg-card/20 border border-border/10 rounded-2xl p-5 flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <p className="text-6xl md:text-7xl font-black text-foreground/5 select-none">
              2026
            </p>
            <p className="text-xs font-mono text-muted-foreground/40 mt-2">
              © coah
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BentoHome;
