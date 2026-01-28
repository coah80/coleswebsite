import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Headphones, 
  Gamepad2, 
  Clock, 
  ExternalLink,
  Music2,
  Play,
  Disc3,
  TrendingUp,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useLanyard, LanyardActivity } from '@/hooks/useLanyard';
import PageLayout from '@/components/PageLayout';
import WarpText from '@/components/typography/WarpText';
import { supabase } from '@/integrations/supabase/client';

interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  playtime_2weeks?: number;
  img_icon_url: string;
}

interface WishlistItem {
  appid: number;
  name: string;
  capsule?: string;
  priority: number;
  added?: number;
  release_string?: string;
}

interface SteamData {
  recentlyPlayed: SteamGame[];
  mostPlayed: SteamGame[];
  wishlist: WishlistItem[];
  totalGames: number;
}

interface GameItem {
  id: string;
  name: string;
  source: 'steam' | 'discord';
  playtime?: number; // minutes
  recentPlaytime?: number; // minutes in last 2 weeks
  imageUrl?: string;
  storeUrl?: string;
  isPlaying?: boolean;
}

const STEAM_PROFILE_URL = 'https://steamcommunity.com/profiles/76561199229763710';

// Cache for IGDB covers
const igdbCache = new Map<string, string>();

const InfoPage = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [songLinks, setSongLinks] = useState<Record<string, string> | null>(null);
  const [steamData, setSteamData] = useState<SteamData | null>(null);
  const [steamLoading, setSteamLoading] = useState(true);
  const [gameImages, setGameImages] = useState<Record<string, string>>({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [wishlistPage, setWishlistPage] = useState(0);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  
  const {
    data,
    isConnected,
    error: lanyardError,
    gameActivity,
    customStatus,
    isSpotifyActive,
    spotify,
    status,
    user,
    activities,
    getAvatarUrl,
    getAvatarDecorationUrl,
    getBannerUrl,
    getBannerColor,
    getStatusColor,
    getStatusText,
    getActivityAssetUrl,
  } = useLanyard();

  // Debug log for Lanyard data
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[InfoPage] Lanyard state:', { 
        isConnected, 
        lanyardError, 
        hasData: !!data,
        banner: data?.discord_user?.banner,
        bannerColor: data?.discord_user?.banner_color,
        gameActivity: gameActivity?.name,
        spotify: spotify?.song,
        activities: activities.map(a => ({ name: a.name, type: a.type }))
      });
    }
  }, [isConnected, lanyardError, data, gameActivity, spotify, activities]);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Steam data
  useEffect(() => {
    const fetchSteamData = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('steam-games');
        if (error) throw error;
        
        console.log('[InfoPage] Steam data received:', data);
        setSteamData(data);
      } catch (err) {
        console.error('Failed to fetch Steam data:', err);
      } finally {
        setSteamLoading(false);
      }
    };
    fetchSteamData();
  }, []);

  // Fetch Steam wishlist using scraper edge function
  useEffect(() => {
    const fetchWishlist = async () => {
      // Fallback wishlist in case scraping fails
      const FALLBACK_WISHLIST: WishlistItem[] = [
        { appid: 726830, name: 'Vacation Simulator', priority: 1 },
        { appid: 448880, name: "Spells 'n' Stuff", priority: 2 },
        { appid: 1332010, name: 'Stray', priority: 3 },
        { appid: 1849900, name: 'Among Us 3D: VR', priority: 4 },
        { appid: 1859270, name: 'Perfect Partner', priority: 5 },
        { appid: 1583230, name: 'High On Life', priority: 6 },
        { appid: 1947500, name: 'The Walking Dead: Saints & Sinners - Chapter 2: Retribution', priority: 7 },
        { appid: 1868140, name: 'DAVE THE DIVER', priority: 8 },
        { appid: 1607680, name: 'Bread & Fred', priority: 9 },
        { appid: 2231450, name: 'Pizza Tower', priority: 10 },
        { appid: 1817230, name: 'Hi-Fi RUSH', priority: 11 },
        { appid: 2018960, name: 'Neolithic Dawn', priority: 12 },
        { appid: 1575520, name: 'Fruit Ninja VR 2', priority: 13 },
      ];

      try {
        // Try the scraper edge function first
        console.log('[Wishlist] Trying scraper...');
        const { data, error } = await supabase.functions.invoke('steam-wishlist-scraper');
        
        if (!error && data?.wishlist && data.wishlist.length > 0) {
          console.log('[Wishlist] Scraper returned', data.wishlist.length, 'items');
          setWishlist(data.wishlist);
          return;
        }
        
        if (error) {
          console.log('[Wishlist] Scraper error:', error);
        }

        // If scraper failed, check steam-games API response
        if (steamData?.wishlist && steamData.wishlist.length > 0) {
          console.log('[Wishlist] Using Steam API data:', steamData.wishlist.length, 'items');
          setWishlist(steamData.wishlist);
          return;
        }

        // Fall back to hardcoded list
        console.log('[Wishlist] Using fallback list');
        setWishlist(FALLBACK_WISHLIST);
      } catch (err) {
        console.error('[Wishlist] Error:', err);
        setWishlist(FALLBACK_WISHLIST);
      }
    };

    // Wait for steamData to be loaded first
    if (!steamLoading) {
      fetchWishlist();
    }
  }, [steamLoading, steamData]);

  // Fetch IGDB cover for a game
  const fetchIGDBCover = useCallback(async (gameName: string): Promise<string | null> => {
    const cacheKey = gameName.toLowerCase().trim();
    if (igdbCache.has(cacheKey)) {
      return igdbCache.get(cacheKey) || null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('igdb-cover', {
        body: { gameName }
      });
      if (error) throw error;
      if (data?.coverUrl) {
        igdbCache.set(cacheKey, data.coverUrl);
        return data.coverUrl;
      }
    } catch (err) {
      console.error(`[IGDB] Failed to fetch cover for ${gameName}:`, err);
    }
    return null;
  }, []);

  // Fetch song.link data
  useEffect(() => {
    if (spotify?.track_id) {
      const fetchSongLinks = async () => {
        try {
          const response = await fetch(
            `https://api.song.link/v1-alpha.1/links?url=spotify%3Atrack%3A${spotify.track_id}&userCountry=US`
          );
          const data = await response.json();
          setSongLinks({
            spotify: data.linksByPlatform?.spotify?.url,
            appleMusic: data.linksByPlatform?.appleMusic?.url,
            youtubeMusic: data.linksByPlatform?.youtubeMusic?.url,
          });
        } catch (err) {
          console.error('Failed to fetch song links:', err);
          setSongLinks(null);
        }
      };
      fetchSongLinks();
    } else {
      setSongLinks(null);
    }
  }, [spotify?.track_id]);

  // Get game activities from Discord (type 0 = Playing)
  const discordGames = activities.filter(a => a.type === 0 && a.name !== 'Spotify');

  // Check if a Discord game matches a Steam game (by name similarity)
  const findSteamMatch = useCallback((gameName: string): SteamGame | null => {
    if (!steamData?.recentlyPlayed && !steamData?.mostPlayed) return null;
    
    const normalizedName = gameName.toLowerCase().trim();
    
    // Check recently played first
    const recentMatch = steamData.recentlyPlayed?.find(g => 
      g.name.toLowerCase().trim() === normalizedName ||
      g.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(g.name.toLowerCase())
    );
    if (recentMatch) return recentMatch;
    
    // Check most played
    const mostMatch = steamData.mostPlayed?.find(g => 
      g.name.toLowerCase().trim() === normalizedName ||
      g.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(g.name.toLowerCase())
    );
    return mostMatch || null;
  }, [steamData]);

  // Merge Steam and Discord games for "In Rotation"
  const getInRotationGames = useCallback((): GameItem[] => {
    const games: GameItem[] = [];
    const seen = new Set<string>();

    // Add current Discord activity first (if playing)
    if (gameActivity) {
      const key = gameActivity.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        
        // Check if this Discord game is on Steam
        const steamMatch = findSteamMatch(gameActivity.name);
        
        if (steamMatch) {
          // Use Steam data for hours and image
          games.push({
            id: `steam-${steamMatch.appid}`,
            name: steamMatch.name,
            source: 'steam',
            playtime: steamMatch.playtime_forever,
            recentPlaytime: steamMatch.playtime_2weeks,
            imageUrl: getSteamGameImage(steamMatch.appid),
            storeUrl: `https://store.steampowered.com/app/${steamMatch.appid}`,
            isPlaying: true,
          });
          // Also mark the steam key as seen
          seen.add(steamMatch.name.toLowerCase());
        } else {
          // Not on Steam - use Discord data, will fetch IGDB image
          games.push({
            id: `discord-${gameActivity.id}`,
            name: gameActivity.name,
            source: 'discord',
            imageUrl: getActivityAssetUrl(gameActivity) || undefined,
            isPlaying: true,
          });
        }
      }
    }

    // Add Steam recently played (that aren't already added)
    if (steamData?.recentlyPlayed) {
      for (const game of steamData.recentlyPlayed) {
        const key = game.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          games.push({
            id: `steam-${game.appid}`,
            name: game.name,
            source: 'steam',
            playtime: game.playtime_forever,
            recentPlaytime: game.playtime_2weeks,
            imageUrl: getSteamGameImage(game.appid),
            storeUrl: `https://store.steampowered.com/app/${game.appid}`,
          });
        }
      }
    }

    return games.slice(0, 8);
  }, [gameActivity, steamData, getActivityAssetUrl, findSteamMatch]);

  // Get most played games (Steam + detected Discord games)
  const getMostPlayedGames = useCallback((): GameItem[] => {
    const games: GameItem[] = [];
    const seen = new Set<string>();

    // Add Steam most played
    if (steamData?.mostPlayed) {
      for (const game of steamData.mostPlayed) {
        const key = game.name.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          games.push({
            id: `steam-${game.appid}`,
            name: game.name,
            source: 'steam',
            playtime: game.playtime_forever,
            imageUrl: getSteamGameImage(game.appid),
            storeUrl: `https://store.steampowered.com/app/${game.appid}`,
          });
        }
      }
    }

    return games.slice(0, 10);
  }, [steamData]);

  // Fetch IGDB images for non-Steam games OR failed Steam images
  useEffect(() => {
    const gamesNeedingImages: string[] = [];
    
    // Check in rotation games - fetch IGDB for non-Steam games OR Steam games with failed images
    const inRotation = getInRotationGames();
    
    for (const game of inRotation) {
      // Fetch IGDB if:
      // 1. Discord game without image, or
      // 2. Any game with failed Steam image (that we don't already have IGDB for)
      const needsIGDB = (game.source === 'discord' && !game.imageUrl) || 
                        (failedImages.has(game.name) && !gameImages[game.name]);
      
      if (needsIGDB && !gameImages[game.name]) {
        gamesNeedingImages.push(game.name);
      }
    }

    // Also check most played games for failed images
    const mostPlayed = getMostPlayedGames();
    for (const game of mostPlayed) {
      if (failedImages.has(game.name) && !gameImages[game.name]) {
        if (!gamesNeedingImages.includes(game.name)) {
          gamesNeedingImages.push(game.name);
        }
      }
    }

    // Fetch missing images from IGDB
    const fetchMissing = async () => {
      for (const name of gamesNeedingImages) {
        const url = await fetchIGDBCover(name);
        if (url) {
          setGameImages(prev => ({ ...prev, [name]: url }));
        }
      }
    };

    if (gamesNeedingImages.length > 0) {
      fetchMissing();
    }
  }, [getInRotationGames, getMostPlayedGames, fetchIGDBCover, gameImages, failedImages]);

  // Fetch IGDB covers for Steam wishlist
  useEffect(() => {
    const wishlistNames = wishlist.map(g => g.name).filter(Boolean);

    const fetchWishlistCovers = async () => {
      for (const name of wishlistNames) {
        if (!gameImages[name] && !failedImages.has(name)) {
          const url = await fetchIGDBCover(name);
          if (url) {
            setGameImages(prev => ({ ...prev, [name]: url }));
          }
        }
      }
    };

    if (wishlistNames.length > 0) {
      fetchWishlistCovers();
    }
  }, [wishlist, fetchIGDBCover, gameImages, failedImages]);


  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
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

  const formatPlaytime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    if (hours >= 1000) return `${(hours / 1000).toFixed(1)}k hrs`;
    return `${hours} hrs`;
  };

  const getSteamGameImage = (appId: number) => {
    return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
  };

  const getGameImage = (game: GameItem): string | null => {
    // If Steam image failed, use IGDB
    if (failedImages.has(game.name) && gameImages[game.name]) {
      return gameImages[game.name];
    }
    // Otherwise try the game's imageUrl first
    if (game.imageUrl && !failedImages.has(game.name)) return game.imageUrl;
    // Then try IGDB cache
    if (gameImages[game.name]) return gameImages[game.name];
    return null;
  };

  const handleImageError = (gameName: string) => {
    console.log('[IGDB] Image failed to load, will fetch from IGDB:', gameName);
    setFailedImages(prev => new Set([...prev, gameName]));
  };

  const inRotationGames = getInRotationGames();
  const mostPlayedGames = getMostPlayedGames();

  return (
    <PageLayout title="info" allowScroll={true}>
      <div 
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8 max-w-6xl mx-auto"
      >
        {/* ===== DISCORD PROFILE ===== */}
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-1 lg:col-span-1 bg-card/50 border border-border/30 rounded-2xl overflow-hidden"
        >
          {getBannerUrl() ? (
            <img 
              src={getBannerUrl(600)!} 
              alt="Profile banner" 
              className="h-20 w-full object-cover" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : getBannerColor() ? (
            <div className="h-20 w-full" style={{ backgroundColor: getBannerColor()! }} />
          ) : (
            <div className="h-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500" />
          )}
          <div className="px-5 pb-5 -mt-8 relative">
            <div className="relative inline-block">
              <div className="w-16 h-16 rounded-full border-4 border-card overflow-hidden bg-card">
                {user ? (
                  <img src={getAvatarUrl(128) || ''} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted animate-pulse" />
                )}
              </div>
              {getAvatarDecorationUrl() && (
                <img 
                  src={getAvatarDecorationUrl()!} 
                  alt="" 
                  className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] pointer-events-none" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-[3px] border-card ${getStatusColor()}`} />
            </div>

            <div className="mt-2">
              <WarpText className="text-2xl font-black text-foreground">
                {user?.global_name || user?.username || 'Loading...'}
              </WarpText>
              <p className="text-sm text-muted-foreground font-mono">@{user?.username}</p>
              
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                <span className="text-sm text-muted-foreground">{getStatusText()}</span>
              </div>

              {customStatus?.state && (
                <p className="mt-2 text-sm text-foreground/80 italic">"{customStatus.state}"</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* ===== LOCAL TIME ===== */}
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="bg-card/50 border border-border/30 rounded-2xl p-5 flex flex-col justify-center"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono text-muted-foreground uppercase">Local Time</span>
          </div>
          <p className="text-3xl font-mono font-bold text-foreground">
            {formatTime(currentTime)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(currentTime)}
          </p>
        </motion.div>

        {/* ===== CURRENT ACTIVITY ===== */}
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`rounded-2xl p-5 transition-all ${
          gameActivity 
            ? 'bg-gradient-to-br from-purple-500/20 to-indigo-600/5 border border-purple-500/30' 
            : 'bg-card/50 border border-border/30'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <Gamepad2 className={`w-4 h-4 ${gameActivity ? 'text-purple-400' : 'text-muted-foreground'}`} />
            <span className="text-xs font-mono text-muted-foreground uppercase">Activities</span>
          </div>

          {gameActivity ? (
            <div className="flex gap-4">
              {getActivityAssetUrl(gameActivity) || gameImages[gameActivity.name] ? (
                <div className="relative flex-shrink-0">
                  <img 
                    src={getActivityAssetUrl(gameActivity) || gameImages[gameActivity.name]} 
                    alt={gameActivity.name} 
                    className="w-24 h-32 rounded-xl object-cover shadow-lg ring-1 ring-white/10"
                    onError={(e) => {
                      if (!gameImages[gameActivity.name]) {
                        fetchIGDBCover(gameActivity.name).then(url => {
                          if (url) setGameImages(prev => ({ ...prev, [gameActivity.name]: url }));
                        });
                      }
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/40 to-transparent" />
                </div>
              ) : (
                <div className="w-24 h-32 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 ring-1 ring-white/10">
                  <Gamepad2 className="w-10 h-10 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-mono text-purple-400 uppercase font-bold">Now Playing</span>
                </div>
                <p className="font-black text-lg text-foreground leading-tight line-clamp-2">{gameActivity.name}</p>
                {gameActivity.details && <p className="text-xs text-muted-foreground mt-1 truncate">{gameActivity.details}</p>}
                {gameActivity.state && <p className="text-xs text-muted-foreground/70 italic truncate">{gameActivity.state}</p>}
                {gameActivity.timestamps?.start && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatElapsedTime(gameActivity.timestamps.start)} played</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Gamepad2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Not playing anything</p>
            </div>
          )}
        </motion.div>

        {/* ===== SPOTIFY ===== */}
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`md:col-span-2 lg:col-span-3 rounded-2xl p-5 transition-all ${
          isSpotifyActive 
            ? 'bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/30' 
            : 'bg-card/50 border border-border/30'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <Headphones className={`w-4 h-4 ${isSpotifyActive ? 'text-green-400' : 'text-muted-foreground'}`} />
            <span className="text-xs font-mono text-muted-foreground uppercase">Spotify</span>
            {isSpotifyActive && <Disc3 className="w-4 h-4 text-green-400 animate-spin" style={{ animationDuration: '3s' }} />}
          </div>

          {isSpotifyActive && spotify ? (
            <div className="flex gap-4">
              <img src={spotify.album_art_url} alt={spotify.album} className="w-20 h-20 rounded-xl shadow-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg text-foreground truncate">{spotify.song}</p>
                <p className="text-sm text-muted-foreground truncate">{spotify.artist}</p>
                <p className="text-xs text-muted-foreground/60 truncate">{spotify.album}</p>
                
                <div className="mt-2 flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <span>{formatSpotifyTime(currentTime.getTime() - spotify.timestamps.start)}</span>
                  <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden max-w-xs">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.min(100, ((currentTime.getTime() - spotify.timestamps.start) / (spotify.timestamps.end - spotify.timestamps.start)) * 100)}%` }}
                    />
                  </div>
                  <span>{formatSpotifyTime(spotify.timestamps.end - spotify.timestamps.start)}</span>
                </div>

                {songLinks && (
                  <div className="mt-3 flex gap-2">
                    {songLinks.spotify && (
                      <a href={songLinks.spotify} target="_blank" rel="noopener noreferrer" 
                         className="flex items-center gap-1 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 px-2 py-1 rounded transition-colors">
                        <Music2 className="w-3 h-3" /> Open
                      </a>
                    )}
                    {songLinks.appleMusic && (
                      <a href={songLinks.appleMusic} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-1 text-xs bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 px-2 py-1 rounded transition-colors">
                        <Music2 className="w-3 h-3" /> Apple
                      </a>
                    )}
                    {songLinks.youtubeMusic && (
                      <a href={songLinks.youtubeMusic} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 py-1 rounded transition-colors">
                        <Play className="w-3 h-3" /> YouTube
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Headphones className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Not listening to anything</p>
            </div>
          )}
        </motion.div>

        {/* ===== IN ROTATION ===== */}
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-2 lg:col-span-3 bg-card/50 border border-border/30 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-mono text-muted-foreground uppercase">In Rotation</span>
            </div>
            <a href={STEAM_PROFILE_URL} target="_blank" rel="noopener noreferrer" 
               className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors">
              Steam <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {steamLoading && !gameActivity ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-muted/20 rounded-lg aspect-[460/215]" />
              ))}
            </div>
          ) : inRotationGames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {inRotationGames.map((game) => {
                const imageUrl = getGameImage(game);
                return (
                  <a
                    key={game.id}
                    href={game.storeUrl || '#'}
                    target={game.storeUrl ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="group relative rounded-lg overflow-hidden aspect-[460/215] bg-muted/20"
                  >
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={game.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={() => handleImageError(game.name)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-indigo-600/30 flex items-center justify-center">
                        <Gamepad2 className="w-8 h-8 text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {game.isPlaying && (
                      <div className="absolute top-1 right-1 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                        LIVE
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-xs font-medium text-white truncate">{game.name}</p>
                      {game.recentPlaytime && (
                        <p className="text-[10px] text-white/60">{formatPlaytime(game.recentPlaytime)} recently</p>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No recent games</p>
          )}
        </motion.div>

        {/* ===== MOST PLAYED ===== */}
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="md:col-span-2 lg:col-span-3 bg-card/50 border border-border/30 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono text-muted-foreground uppercase">Most Played</span>
              {steamData && <span className="text-[10px] text-muted-foreground/60">({steamData.totalGames} games)</span>}
            </div>
          </div>

          {steamLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-muted/20 rounded-lg aspect-[460/215]" />
              ))}
            </div>
          ) : mostPlayedGames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {mostPlayedGames.map((game, index) => {
                const imageUrl = getGameImage(game);
                return (
                  <a
                    key={game.id}
                    href={game.storeUrl || '#'}
                    target={game.storeUrl ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="group relative rounded-lg overflow-hidden aspect-[460/215] bg-muted/20"
                  >
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={game.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={() => handleImageError(game.name)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-500/30 to-orange-600/30 flex items-center justify-center">
                        <Gamepad2 className="w-8 h-8 text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">{index + 1}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-xs font-medium text-white truncate">{game.name}</p>
                      {game.playtime && <p className="text-[10px] text-white/60">{formatPlaytime(game.playtime)}</p>}
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No games found</p>
          )}
        </motion.div>

        {/* ===== STEAM WISHLIST ===== */}
        {wishlist.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-2 lg:col-span-4 bg-gradient-to-br from-blue-500/10 to-indigo-600/5 border border-blue-500/20 rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-mono text-muted-foreground uppercase">Steam Wishlist</span>
                <span className="text-[10px] text-muted-foreground/50">({wishlist.length} games)</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Carousel Navigation */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setWishlistPage(Math.max(0, wishlistPage - 1))}
                    disabled={wishlistPage === 0}
                    className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] text-muted-foreground min-w-[40px] text-center">
                    {wishlistPage + 1} / {Math.ceil(wishlist.length / 5)}
                  </span>
                  <button
                    onClick={() => setWishlistPage(Math.min(Math.ceil(wishlist.length / 5) - 1, wishlistPage + 1))}
                    disabled={wishlistPage >= Math.ceil(wishlist.length / 5) - 1}
                    className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <a 
                  href={`${STEAM_PROFILE_URL}/wishlist`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  View All <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <AnimatePresence mode="popLayout">
                {wishlist.slice(wishlistPage * 5, wishlistPage * 5 + 5).map((game) => {
                  // Use capsule from scraper, or fallback to Steam library image
                  const capsuleUrl = (game as any).capsule || `https://steamcdn-a.akamaihd.net/steam/apps/${game.appid}/library_600x900.jpg`;
                  const steamHeaderUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
                  const igdbUrl = gameImages[game.name];
                  
                  return (
                    <motion.a
                      key={game.appid}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      href={`https://store.steampowered.com/app/${game.appid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative rounded-xl overflow-hidden aspect-[3/4] bg-muted/20 shadow-lg ring-1 ring-white/10"
                    >
                      <img 
                        src={capsuleUrl} 
                        alt={game.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (img.src === capsuleUrl) {
                            // Try IGDB cover next
                            if (igdbUrl) {
                              img.src = igdbUrl;
                            } else {
                              // Fall back to Steam header
                              img.src = steamHeaderUrl;
                            }
                          } else if (img.src === igdbUrl && steamHeaderUrl) {
                            img.src = steamHeaderUrl;
                          } else {
                            // Hide if all fail
                            img.style.display = 'none';
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">#{game.priority}</span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-xs font-medium text-white truncate">{game.name}</p>
                      </div>
                    </motion.a>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

      </div>
    </PageLayout>
  );
};

export default InfoPage;
