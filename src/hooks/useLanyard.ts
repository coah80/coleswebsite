import { useState, useEffect, useCallback } from 'react';

export interface LanyardActivity {
  id: string;
  name: string;
  type: number; // 0=Playing, 1=Streaming, 2=Listening, 3=Watching, 4=Custom, 5=Competing
  state?: string;
  details?: string;
  timestamps?: { start?: number; end?: number };
  assets?: { 
    large_image?: string; 
    large_text?: string;
    small_image?: string;
    small_text?: string;
  };
  application_id?: string;
  emoji?: { name: string; id?: string; animated?: boolean };
  created_at?: number;
}

export interface LanyardSpotify {
  track_id: string;
  timestamps: { start: number; end: number };
  song: string;
  artist: string;
  album_art_url: string;
  album: string;
}

export interface LanyardDiscordUser {
  id: string;
  username: string;
  avatar: string;
  global_name?: string;
  discriminator?: string;
  avatar_decoration_data?: {
    asset: string;
    sku_id: string;
  };
  banner?: string;
  banner_color?: string;
  clan?: {
    identity_guild_id: string;
    tag: string;
    badge: string;
  };
}

export interface LanyardData {
  discord_user: LanyardDiscordUser;
  discord_status: 'online' | 'idle' | 'dnd' | 'offline';
  listening_to_spotify: boolean;
  activities: LanyardActivity[];
  spotify: LanyardSpotify | null;
  active_on_discord_desktop: boolean;
  active_on_discord_mobile: boolean;
  active_on_discord_web: boolean;
  kv?: Record<string, string>;
}

interface LanyardMessage {
  op: number;
  t?: 'INIT_STATE' | 'PRESENCE_UPDATE';
  d?: LanyardData | { heartbeat_interval: number };
}

interface UseLanyardOptions {
  userId?: string;
}

const DEFAULT_USER_ID = '761701756119547955';

export function useLanyard(options: UseLanyardOptions = {}) {
  const userId = options.userId || 
    (import.meta.env.VITE_DISCORD_USER_ID && 
    typeof import.meta.env.VITE_DISCORD_USER_ID === 'string' && 
    import.meta.env.VITE_DISCORD_USER_ID.trim() !== '') 
      ? import.meta.env.VITE_DISCORD_USER_ID 
      : DEFAULT_USER_ID;

  const [data, setData] = useState<LanyardData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const log = useCallback((msg: string, logData?: unknown) => {
    if (import.meta.env.DEV) {
      console.log(`[Lanyard] ${msg}`, logData ?? '');
    }
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;
    const baseReconnectDelay = 1000;
    let isCleaningUp = false;

    const clearTimers = () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    };

    const scheduleReconnect = () => {
      if (isCleaningUp || reconnectAttempts >= maxReconnectAttempts) {
        log('Max reconnect attempts reached or cleaning up');
        setError('Connection failed after multiple attempts');
        return;
      }
      
      const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttempts), 30000);
      reconnectAttempts++;
      log(`Scheduling reconnect attempt ${reconnectAttempts} in ${delay}ms`);
      
      reconnectTimeout = setTimeout(() => {
        if (!isCleaningUp) connect();
      }, delay);
    };

    const connect = () => {
      if (isCleaningUp) return;
      if (!userId || !/^\d{17,19}$/.test(userId)) {
        log('Invalid Discord User ID', userId);
        setError('Invalid Discord User ID');
        return;
      }

      // Clean up existing connection
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      }
      clearTimers();
      setError(null);

      log('Connecting to Lanyard WebSocket...');
      ws = new WebSocket('wss://api.lanyard.rest/socket');

      const safeSend = (sendData: object) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(sendData));
          return true;
        }
        log('Cannot send - WebSocket not open', ws?.readyState);
        return false;
      };

      ws.onopen = () => {
        log('WebSocket connected, subscribing to user', userId);
        setIsConnected(true);
        reconnectAttempts = 0;
        safeSend({ op: 2, d: { subscribe_to_id: userId } });
      };

      ws.onmessage = (event) => {
        try {
          const message: LanyardMessage = JSON.parse(event.data);
          log('Received message', { op: message.op, t: message.t });

          switch (message.op) {
            case 0: // Event dispatch (INIT_STATE or PRESENCE_UPDATE)
              if (message.d && 'discord_user' in message.d) {
                const presenceData = message.d as LanyardData;
                log('Presence data received', {
                  status: presenceData.discord_status,
                  spotify: presenceData.listening_to_spotify,
                  spotifyData: presenceData.spotify,
                  activities: presenceData.activities?.map(a => ({ name: a.name, type: a.type })) || []
                });
                setData(presenceData);
              }
              break;

            case 1: // Hello - start heartbeating
              const helloData = message.d as { heartbeat_interval: number };
              const interval = helloData?.heartbeat_interval || 30000;
              log('Received Hello, heartbeat interval:', interval);
              
              // Send initial heartbeat
              safeSend({ op: 3 });
              
              // Set up heartbeat interval
              if (heartbeatInterval) clearInterval(heartbeatInterval);
              heartbeatInterval = setInterval(() => {
                if (!safeSend({ op: 3 })) {
                  clearTimers();
                }
              }, interval);
              break;
          }
        } catch (err) {
          log('Error parsing message', err);
        }
      };

      ws.onclose = (event) => {
        log('WebSocket closed', { code: event.code, reason: event.reason });
        setIsConnected(false);
        clearTimers();
        if (!isCleaningUp) scheduleReconnect();
      };

      ws.onerror = (wsError) => {
        log('WebSocket error', wsError);
        setIsConnected(false);
      };
    };

    connect();

    return () => {
      log('Cleaning up Lanyard connection');
      isCleaningUp = true;
      clearTimers();
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      }
    };
  }, [userId, log]);

  // Derived state
  const gameActivity = data?.activities?.find(
    a => (a.type === 0 || a.type === 1) && a.name !== 'Spotify'
  );
  const customStatus = data?.activities?.find(a => a.type === 4);
  const isSpotifyActive = Boolean(
    data?.listening_to_spotify && 
    data?.spotify && 
    data.spotify.song
  );

  // Helper functions
  const getAvatarUrl = (size = 256) => {
    if (!data?.discord_user) return null;
    const { id, avatar } = data.discord_user;
    const format = avatar?.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${id}/${avatar}.${format}?size=${size}`;
  };

  const getAvatarDecorationUrl = () => {
    if (!data?.discord_user?.avatar_decoration_data?.asset) return null;
    const asset = data.discord_user.avatar_decoration_data.asset;
    if (!asset) return null;
    const format = asset.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatar-decoration-presets/${asset}.${format}`;
  };

  const getBannerUrl = (size = 600) => {
    if (!data?.discord_user) return null;
    
    if (data.discord_user.banner) {
      const { id, banner } = data.discord_user;
      const format = banner.startsWith('a_') ? 'gif' : 'png';
      return `https://cdn.discordapp.com/banners/${id}/${banner}.${format}?size=${size}`;
    }
    
    const fallbackBanner = '26e7287bcd7922fee75dbe5b6b35ec48';
    const userId = data.discord_user.id;
    return `https://cdn.discordapp.com/banners/${userId}/${fallbackBanner}.png?size=${size}`;
  };

  const getBannerColor = () => {
    return data?.discord_user?.banner_color || null;
  };

  const getStatusColor = (status?: string) => {
    switch (status || data?.discord_status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'dnd': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status || data?.discord_status) {
      case 'online': return 'Online';
      case 'idle': return 'Away';
      case 'dnd': return 'Do Not Disturb';
      default: return 'Offline';
    }
  };

  const getActivityAssetUrl = (activity: LanyardActivity, type: 'large' | 'small' = 'large') => {
    const asset = type === 'large' ? activity.assets?.large_image : activity.assets?.small_image;
    if (!asset) return null;
    
    // Discord CDN assets
    if (asset.startsWith('mp:external/')) {
      return `https://media.discordapp.net/${asset.replace('mp:', '')}`;
    }
    // Application assets
    if (activity.application_id) {
      return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${asset}.png`;
    }
    return null;
  };

  return {
    data,
    isConnected,
    error,
    gameActivity,
    customStatus,
    isSpotifyActive,
    spotify: data?.spotify,
    status: data?.discord_status || 'offline',
    user: data?.discord_user,
    activities: data?.activities || [],
    getAvatarUrl,
    getAvatarDecorationUrl,
    getBannerUrl,
    getBannerColor,
    getStatusColor,
    getStatusText,
    getActivityAssetUrl,
  };
}
