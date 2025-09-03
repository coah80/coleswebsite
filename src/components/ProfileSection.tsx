import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Coffee, Music, Gamepad2, Headphones, Clock, Zap } from 'lucide-react';

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

const ProfileSection = () => {
  const [lanyardData, setLanyardData] = useState<LanyardData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSeen, setLastSeen] = useState<string>('');
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

  useEffect(() => {
    let ws: WebSocket | null = null;
    let heartbeatInterval: NodeJS.Timeout;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;

    const connect = () => {
      try {
        console.log('Attempting to connect to Lanyard with Discord ID:', DISCORD_USER_ID);
        
        // Validate Discord User ID format
        if (!DISCORD_USER_ID || !/^\d{17,19}$/.test(DISCORD_USER_ID)) {
          console.warn('Invalid Discord User ID format:', DISCORD_USER_ID);
          setIsConnected(false);
          return;
        }
        
        ws = new WebSocket('wss://api.lanyard.rest/socket');
        
        ws.onopen = () => {
          console.log('Lanyard WebSocket connected');
          setIsConnected(true);
          reconnectAttempts = 0;
          
          // Subscribe to user
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            op: 2,
            d: {
              subscribe_to_id: DISCORD_USER_ID
            }
          }));
        }
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.op === 0) {
              // Initial data or update
              console.log('Lanyard data received:', message.d);
              setLanyardData(message.d);
              if (message.d?.discord_status !== 'offline') {
                setLastSeen('');
              }
            } else if (message.op === 1) {
              // Heartbeat request
              const heartbeatData = { op: 3 };
              ws?.send(JSON.stringify(heartbeatData));
              
              // Set up heartbeat interval
              if (heartbeatInterval) clearInterval(heartbeatInterval);
              heartbeatInterval = setInterval(() => {
                if (ws?.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ op: 3 }));
                }
              }, message.d.heartbeat_interval);
            }
          } catch (error) {
            console.error('Error parsing Lanyard message:', error);
          }
        };

        ws.onclose = () => {
          console.log('Lanyard WebSocket disconnected');
          setIsConnected(false);
          if (lanyardData?.discord_status !== 'offline') {
            setLastSeen(new Date().toLocaleTimeString());
          }
          
          // Only reconnect if we haven't exceeded max attempts
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(5000 * reconnectAttempts, 30000);
            console.log(`Attempting reconnect ${reconnectAttempts}/${maxReconnectAttempts} in ${delay}ms`);
            reconnectTimeout = setTimeout(connect, delay);
          } else {
            console.log('Max reconnection attempts reached. Lanyard connection disabled.');
          }
        };

        ws.onerror = (error) => {
          console.error('Lanyard WebSocket error:', error);
          console.warn('Lanyard connection failed. This might be due to:');
          console.warn('1. Invalid Discord User ID:', DISCORD_USER_ID);
          console.warn('2. Lanyard service issues');
          console.warn('3. Network connectivity problems');
          setIsConnected(false);
          
          // Only reconnect on error if we haven't exceeded max attempts
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(10000 * reconnectAttempts, 60000);
            console.log(`Error reconnect attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${delay}ms`);
            reconnectTimeout = setTimeout(connect, delay);
          } else {
            console.log('Max error reconnection attempts reached. Lanyard connection disabled.');
          }
        };

      } catch (error) {
        console.error('Failed to connect to Lanyard:', error);
        setIsConnected(false);
      }
    };

    // Initial connection
    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
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

  const formatElapsedTime = (startTime: number) => {
    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatSpotifyTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDiscordAvatarUrl = () => {
    if (!lanyardData?.discord_user) return null;
    const { id, avatar } = lanyardData.discord_user;
    return `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=256`;
  };

  const gameActivity = lanyardData?.activities?.find(activity => activity.type === 0);
  const customStatus = lanyardData?.activities?.find(activity => activity.type === 4);

  // Check if Spotify song has ended
  const isSpotifyActive = lanyardData?.spotify && 
    lanyardData.spotify.timestamps.end > currentTime;

  return (
    <div className="h-full">
      {/* Main Profile Card */}
      <Card className="p-4 lg:p-6 xl:p-8 2xl:p-12 bg-card/50 border-border/30 h-full flex flex-col">
        <div className="flex items-start gap-4 lg:gap-6 xl:gap-8 mb-4 xl:mb-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 2xl:w-32 2xl:h-32 rounded-full overflow-hidden ring-2 lg:ring-4 xl:ring-6 ring-primary/20 shadow-link">
              {lanyardData?.discord_user ? (
                <img 
                  src={getDiscordAvatarUrl()!} 
                  alt="coah" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to default avatar if Discord avatar fails
                    (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=400';
                  }}
                />
              ) : (
                <img 
                  src="https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=400" 
                  alt="coah" 
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {/* Status Indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 rounded-full border-2 lg:border-4 border-background">
              <div className={`w-full h-full rounded-full ${
                lanyardData ? getStatusColor(lanyardData.discord_status) : 'bg-gray-500'
              } ${lanyardData?.discord_status === 'online' ? 'animate-pulse' : ''}`}></div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 lg:gap-3 mb-2 xl:mb-3">
              <h1 className="text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold font-display bg-gradient-primary bg-clip-text text-transparent">
                coah
              </h1>
              <Badge 
                variant="secondary" 
                className={`text-xs lg:text-sm px-2 py-1 ${
                  lanyardData ? 
                    lanyardData.discord_status === 'online' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    lanyardData.discord_status === 'idle' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                    lanyardData.discord_status === 'dnd' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  lanyardData ? getStatusColor(lanyardData.discord_status) : 'bg-gray-500'
                }`}></div>
                {lanyardData ? getStatusText(lanyardData.discord_status) : 'connecting...'}
              </Badge>
            </div>
            
            <p className="text-xs lg:text-sm xl:text-base text-muted-foreground font-code mb-1">
              {lanyardData?.discord_user ? 
                `@${lanyardData.discord_user.username}` : 
                '@coahh'
              }
            </p>
            
            <p className="text-muted-foreground mb-3 lg:mb-4 xl:mb-6 leading-relaxed text-sm lg:text-base xl:text-lg 2xl:text-xl font-code font-light italic">
              video editor • makes content • bad coder
            </p>

            {/* Custom Status */}
            {customStatus?.state && (
              <p className="text-xs lg:text-sm text-primary/80 italic font-rounded mb-2 flex items-center gap-1">
                {customStatus.emoji?.name && (
                  <span className="text-sm">
                    {customStatus.emoji.id ? 
                      <img 
                        src={`https://cdn.discordapp.com/emojis/${customStatus.emoji.id}.${customStatus.emoji.animated ? 'gif' : 'png'}?size=16`}
                        alt={customStatus.emoji.name}
                        className="w-4 h-4 inline"
                      /> : 
                      customStatus.emoji.name
                    }
                  </span>
                )}
                <span>"{customStatus.state}"</span>
              </p>
            )}
          </div>
        </div>

        {/* Activity Cards */}
        <div className="space-y-3 mb-4">
          {/* Spotify */}
          {isSpotifyActive && (
            <Card className="p-3 bg-green-500/10 border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded overflow-hidden flex-shrink-0">
                  <img 
                    src={lanyardData.spotify.album_art_url}
                    alt={lanyardData.spotify.album}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Headphones className="h-3 w-3 lg:h-4 lg:w-4 text-green-400" />
                    <span className="text-xs lg:text-sm font-medium text-green-400 font-rounded">listening to spotify</span>
                  </div>
                  <div className="text-xs lg:text-sm font-medium text-foreground truncate font-code">
                    {lanyardData.spotify.song}
                  </div>
                  <div className="text-xs text-muted-foreground truncate font-code">
                    by {lanyardData.spotify.artist}
                  </div>
                  <div className="text-xs text-muted-foreground/70 truncate font-code mb-2">
                    {lanyardData.spotify.album}
                  </div>
                  
                  {/* Progress Bar and Timestamps */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-code">
                      <span>{formatSpotifyTime(currentTime - lanyardData.spotify.timestamps.start)}</span>
                      <span>{formatSpotifyTime(lanyardData.spotify.timestamps.end - lanyardData.spotify.timestamps.start)}</span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-1">
                      <div 
                        className="bg-green-400 h-1 rounded-full transition-all duration-1000 ease-linear"
                        style={{
                          width: `${Math.min(100, Math.max(0, 
                            ((currentTime - lanyardData.spotify.timestamps.start) / 
                            (lanyardData.spotify.timestamps.end - lanyardData.spotify.timestamps.start)) * 100
                          ))}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Game Activity */}
          {gameActivity && (
            <Card className="p-3 bg-primary/10 border-primary/20">
              <div className="flex items-center gap-3">
                {gameActivity.application_id && (
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded overflow-hidden flex-shrink-0">
                    <img 
                      src={`https://dcdn.dstn.to/app-icons/${gameActivity.application_id}?size=128`}
                      alt={gameActivity.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to rich presence asset if game icon fails
                        const img = e.target as HTMLImageElement;
                        if (gameActivity.assets?.large_image && !img.src.includes('app-assets')) {
                          img.src = gameActivity.assets.large_image.startsWith('mp:') 
                            ? `https://media.discordapp.net/${gameActivity.assets.large_image.slice(3)}`
                            : `https://cdn.discordapp.com/app-assets/${gameActivity.application_id}/${gameActivity.assets.large_image}.png`;
                        } else {
                          img.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Gamepad2 className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
                    <span className="text-xs lg:text-sm font-medium text-primary font-rounded">playing</span>
                  </div>
                  <div className="text-xs lg:text-sm font-medium text-foreground truncate font-code">
                    {gameActivity.name}
                  </div>
                  {gameActivity.details && (
                    <div className="text-xs text-muted-foreground truncate font-code">
                      {gameActivity.details}
                    </div>
                  )}
                  {gameActivity.state && (
                    <div className="text-xs text-muted-foreground truncate font-code">
                      {gameActivity.state}
                    </div>
                  )}
                  {gameActivity.timestamps?.start && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-2 w-2 lg:h-3 lg:w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground font-code">
                        {formatElapsedTime(gameActivity.timestamps.start)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Bio */}
        <div className="mt-auto">
          <h3 className="font-medium mb-2 xl:mb-3 text-foreground text-sm lg:text-base xl:text-lg 2xl:text-xl font-rounded">about me</h3>
          <p className="text-xs lg:text-sm xl:text-base 2xl:text-lg text-muted-foreground leading-relaxed xl:leading-8 font-rounded">
            hey im cole! im a video editor, tech enthusiast, and bad coder. check out the{' '}
            <button 
              onClick={() => {
                const event = new CustomEvent('changeTab', { detail: 'portfolio' });
                window.dispatchEvent(event);
              }}
              className="text-primary hover:text-primary/80 underline cursor-pointer"
            >
              portfolio tab
            </button>{' '}
            and check out some of my stuff, or follow me on{' '}
            <button 
              onClick={() => {
                // Just scroll to the social links section instead of DOM manipulation
                const socialSection = document.querySelector('[data-section="social"]');
                if (socialSection) {
                  socialSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-primary hover:text-primary/80 underline cursor-pointer"
            >
              other platforms
            </button>
          </p>
        </div>

        {/* Status Footer */}
        <div className="mt-4 lg:mt-6 pt-3 lg:pt-4 border-t border-border/30">
          <div className="flex items-center justify-between text-xs lg:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                lanyardData ? getStatusColor(lanyardData.discord_status) : 'bg-gray-500'
              }`}></div>
              <span className="text-xs text-muted-foreground font-code">
                {lanyardData ? getStatusText(lanyardData.discord_status) : 'connecting...'}
                {lastSeen && ` • last seen ${lastSeen}`}
              </span>
            </div>
            <span className="font-code">
              discord: coahh
            </span>
          </div>
          
          {/* Connection Status */}
          <div className="mt-2 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-muted-foreground font-code">
              {isConnected ? 'live status' : 'reconnecting...'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfileSection;