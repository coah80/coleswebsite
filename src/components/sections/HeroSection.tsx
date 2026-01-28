import { useState, useEffect, useRef } from 'react';
import { Headphones, Gamepad2, Clock } from 'lucide-react';
import SlamText from '@/components/typography/SlamText';
import TypewriterText from '@/components/typography/TypewriterText';
import BrowserFrame from '@/components/decorations/BrowserFrame';

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
    timestamps?: {
      start?: number;
      end?: number;
    };
    assets?: {
      large_image?: string;
      large_text?: string;
      small_image?: string;
      small_text?: string;
    };
    application_id?: string;
    emoji?: {
      name: string;
      id?: string;
      animated?: boolean;
    };
  }>;
  spotify?: {
    track_id: string;
    timestamps: {
      start: number;
      end: number;
    };
    song: string;
    artist: string;
    album_art_url: string;
    album: string;
  };
}

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [lanyardData, setLanyardData] = useState<LanyardData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const DISCORD_USER_ID = (import.meta.env.VITE_DISCORD_USER_ID && 
    typeof import.meta.env.VITE_DISCORD_USER_ID === 'string' && 
    import.meta.env.VITE_DISCORD_USER_ID.trim() !== '') 
    ? import.meta.env.VITE_DISCORD_USER_ID 
    : '761701756119547955';

  // Update current time every second for Spotify progress
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Lanyard WebSocket connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let heartbeatInterval: NodeJS.Timeout;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;

    const connect = () => {
      try {
        if (!DISCORD_USER_ID || !/^\d{17,19}$/.test(DISCORD_USER_ID)) {
          setIsConnected(false);
          return;
        }
        
        ws = new WebSocket('wss://api.lanyard.rest/socket');
        
        ws.onopen = () => {
          setIsConnected(true);
          reconnectAttempts = 0;
          
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              op: 2,
              d: { subscribe_to_id: DISCORD_USER_ID }
            }));
          }
        };

        ws.onmessage = (event) => {
          try {
            if (!event.data || ws?.readyState !== WebSocket.OPEN) return;
            const message = JSON.parse(event.data);
            
            if (message.op === 0 && message.d) {
              setLanyardData(message.d);
            } else if (message.op === 1) {
              if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ op: 3 }));
              }
              
              if (heartbeatInterval) clearInterval(heartbeatInterval);
              if (message.d?.heartbeat_interval) {
                heartbeatInterval = setInterval(() => {
                  if (ws?.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ op: 3 }));
                  }
                }, message.d.heartbeat_interval);
              }
            }
          } catch (error) {
            console.error('Error parsing Lanyard message:', error);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            reconnectTimeout = setTimeout(connect, Math.min(5000 * reconnectAttempts, 30000));
          }
        };

        ws.onerror = () => {
          setIsConnected(false);
          if (ws) ws.close();
        };

      } catch (error) {
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [DISCORD_USER_ID]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-muted-foreground';
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

  const gameActivity = lanyardData?.activities?.find(activity => activity.type === 0);
  const customStatus = lanyardData?.activities?.find(activity => activity.type === 4);
  const isSpotifyActive = lanyardData?.spotify && lanyardData.spotify.timestamps.end > currentTime;

  return (
    <section 
      ref={sectionRef}
      className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative"
    >
      {/* Main hero content */}
      <div className="text-center mb-16">
        {/* Big kinetic name */}
        <div className="mb-8">
          <SlamText 
            as="h1"
            className="text-[15vw] md:text-[12vw] lg:text-[10vw] font-black lowercase leading-none tracking-tight justify-center"
            stagger={0.04}
            delay={0.2}
          >
            coah
          </SlamText>
        </div>

        {/* Tagline with typewriter */}
        <div className="text-lg md:text-xl lg:text-2xl text-muted-foreground font-mono lowercase">
          <TypewriterText delay={1.2} speed={40} cursor={true}>
            video editor · content creator · bad coder
          </TypewriterText>
        </div>

        {/* Status badge */}
        <div className="mt-8 inline-flex items-center gap-3 px-4 py-2 bg-card/50 border border-border/30 rounded-full">
          <div className={`w-2.5 h-2.5 rounded-full ${lanyardData ? getStatusColor(lanyardData.discord_status) : 'bg-muted-foreground'} ${lanyardData?.discord_status === 'online' ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-mono text-muted-foreground">
            {lanyardData ? getStatusText(lanyardData.discord_status) : 'connecting...'}
          </span>
          {customStatus?.state && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span className="text-sm text-foreground/70 italic">"{customStatus.state}"</span>
            </>
          )}
        </div>
      </div>

      {/* Activity cards in brutalist browser frames */}
      <div className="w-full max-w-2xl space-y-4">
        {/* Spotify */}
        {isSpotifyActive && lanyardData?.spotify && (
          <BrowserFrame title="spotify://now-playing" className="animate-float-slow">
            <div className="flex items-center gap-4">
              <img 
                src={lanyardData.spotify.album_art_url}
                alt={lanyardData.spotify.album}
                className="w-16 h-16 rounded"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Headphones className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-mono text-green-400 uppercase tracking-wider">listening</span>
                </div>
                <p className="font-bold text-foreground truncate">{lanyardData.spotify.song}</p>
                <p className="text-sm text-muted-foreground truncate">{lanyardData.spotify.artist}</p>
                
                {/* Progress bar */}
                <div className="mt-2 space-y-1">
                  <div className="w-full bg-muted/30 rounded-full h-1">
                    <div 
                      className="bg-green-400 h-1 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, Math.max(0, 
                          ((currentTime - lanyardData.spotify.timestamps.start) / 
                          (lanyardData.spotify.timestamps.end - lanyardData.spotify.timestamps.start)) * 100
                        ))}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-mono text-muted-foreground">
                    <span>{formatSpotifyTime(currentTime - lanyardData.spotify.timestamps.start)}</span>
                    <span>{formatSpotifyTime(lanyardData.spotify.timestamps.end - lanyardData.spotify.timestamps.start)}</span>
                  </div>
                </div>
              </div>
            </div>
          </BrowserFrame>
        )}

        {/* Game Activity */}
        {gameActivity && (
          <BrowserFrame title={`playing://${gameActivity.name.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="flex items-center gap-4">
              {gameActivity.application_id && (
                <img 
                  src={`https://dcdn.dstn.to/app-icons/${gameActivity.application_id}?size=128`}
                  alt={gameActivity.name}
                  className="w-16 h-16 rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Gamepad2 className="w-4 h-4 text-accent" />
                  <span className="text-xs font-mono text-accent uppercase tracking-wider">playing</span>
                </div>
                <p className="font-bold text-foreground truncate">{gameActivity.name}</p>
                {gameActivity.details && (
                  <p className="text-sm text-muted-foreground truncate">{gameActivity.details}</p>
                )}
                {gameActivity.state && (
                  <p className="text-sm text-muted-foreground truncate">{gameActivity.state}</p>
                )}
                {gameActivity.timestamps?.start && (
                  <div className="flex items-center gap-1 mt-2 text-xs font-mono text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatElapsedTime(gameActivity.timestamps.start)}</span>
                  </div>
                )}
              </div>
            </div>
          </BrowserFrame>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-muted-foreground to-transparent" />
      </div>
    </section>
  );
};

export default HeroSection;
