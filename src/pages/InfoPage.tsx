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
  playtime?: number;
  recentPlaytime?: number;
  imageUrl?: string;
  storeUrl?: string;
  isPlaying?: boolean;
}

const STEAM_PROFILE_URL = 'https://steamcommunity.com/profiles/76561199229763710';

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
    getStatusColor,
    getStatusText,
    getActivityAssetUrl,
  } = useLanyard();

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

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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

  useEffect(() => {
    const fetchWishlist = async () => {
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
        { appid: 1059550, name: 'Valve Index Controllers', priority: 14 },
        { appid: 2420570, name: 'Portal BAGLEY', priority: 15 },
        { appid: 1703340, name: 'The Stanley Parable: Ultra Deluxe', priority: 16 },
        { appid: 1030300, name: 'Hollow Knight: Silksong', priority: 17 },
        { appid: 2074360, name: 'The Obsessive Shadow', priority: 18 },
        { appid: 506500, name: 'Party Panic', priority: 19 },
        { appid: 2381520, name: 'Unrecord', priority: 20 },
        { appid: 2166060, name: 'Amanda the Adventurer', priority: 21 },
        { appid: 1784650, name: 'BOSS FIGHTERS', priority: 22 },
        { appid: 1922010, name: 'Breachers', priority: 23 },
        { appid: 2257770, name: 'Not For Broadcast VR', priority: 24 },
        { appid: 1957780, name: 'Ghosts of Tabor', priority: 25 },
        { appid: 1388550, name: 'Human Fall Flat 2', priority: 26 },
        { appid: 1408230, name: 'Walkabout Mini Golf VR', priority: 27 },
        { appid: 1451810, name: 'LEGO 2K Drive', priority: 28 },
        { appid: 1324350, name: 'Turbo Golf Racing', priority: 29 },
        { appid: 2195400, name: 'Shave & Stuff', priority: 30 },
        { appid: 1597080, name: 'Killer Bean', priority: 31 },
        { appid: 2300840, name: 'Subliminal', priority: 32 },
        { appid: 1810070, name: 'Aperture: Salt Mines', priority: 33 },
        { appid: 2078350, name: 'Bluey: The Videogame', priority: 34 },
        { appid: 2497900, name: "DON'T SCREAM", priority: 35 },
        { appid: 2663960, name: 'Bendy: The Cage', priority: 36 },
        { appid: 1522160, name: 'Disney Epic Mickey: Rebrushed', priority: 37 },
        { appid: 1456940, name: 'Level Zero: Extraction', priority: 38 },
        { appid: 2878270, name: 'Metal: Hellsinger VR', priority: 39 },
        { appid: 2406770, name: 'Bodycam', priority: 40 },
        { appid: 3078140, name: "Five Laps at Freddy's", priority: 41 },
        { appid: 2638370, name: "Five Nights at Freddy's: Into the Pit", priority: 42 },
        { appid: 636190, name: 'The Foglands', priority: 43 },
        { appid: 2280350, name: 'Turbo Dismount 2', priority: 44 },
        { appid: 2920570, name: 'Dale & Dawson Stationery Supplies', priority: 45 },
        { appid: 794840, name: 'Voicemod', priority: 46 },
        { appid: 3070070, name: 'TCG Card Shop Simulator', priority: 47 },
        { appid: 2780980, name: 'LOCKDOWN Protocol', priority: 48 },
        { appid: 3209660, name: 'Golf With Your Friends 2', priority: 49 },
        { appid: 3130340, name: 'Bean There, Won That', priority: 50 },
        { appid: 3059070, name: 'The Headliners', priority: 51 },
        { appid: 1211020, name: 'Wobbly Life', priority: 52 },
        { appid: 1635450, name: 'Longvinter', priority: 53 },
        { appid: 2790330, name: 'Blood Typers', priority: 54 },
      ];

      try {
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

        if (steamData?.wishlist && steamData.wishlist.length > 0) {
          console.log('[Wishlist] Using Steam API data:', steamData.wishlist.length, 'items');
          setWishlist(steamData.wishlist);
          return;
        }

        console.log('[Wishlist] Using fallback list');
        setWishlist(FALLBACK_WISHLIST);
      } catch (err) {
        console.error('[Wishlist] Error:', err);
        setWishlist(FALLBACK_WISHLIST);
      }
    };

    if (!steamLoading) {
      fetchWishlist();
    }
  }, [steamLoading, steamData]);

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

  const discordGames = activities.filter(a => a.type === 0 && a.name !== 'Spotify');

  const findSteamMatch = useCallback((gameName: string): SteamGame | null => {
    if (!steamData?.recentlyPlayed && !steamData?.mostPlayed) return null;

    const normalizedName = gameName.toLowerCase().trim();

    const recentMatch = steamData.recentlyPlayed?.find(g =>
      g.name.toLowerCase().trim() === normalizedName ||
      g.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(g.name.toLowerCase())
    );
    if (recentMatch) return recentMatch;

    const mostMatch = steamData.mostPlayed?.find(g =>
      g.name.toLowerCase().trim() === normalizedName ||
      g.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(g.name.toLowerCase())
    );
    return mostMatch || null;
  }, [steamData]);

  const getInRotationGames = useCallback((): GameItem[] => {
    const games: GameItem[] = [];
    const seen = new Set<string>();

    if (gameActivity) {
      const key = gameActivity.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);

        const steamMatch = findSteamMatch(gameActivity.name);

        if (steamMatch) {
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
          seen.add(steamMatch.name.toLowerCase());
        } else {
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

  const getMostPlayedGames = useCallback((): GameItem[] => {
    const games: GameItem[] = [];
    const seen = new Set<string>();

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

  useEffect(() => {
    const gamesNeedingImages: string[] = [];

    const inRotation = getInRotationGames();

    for (const game of inRotation) {
      const needsIGDB = (game.source === 'discord' && !game.imageUrl) ||
                        (failedImages.has(game.name) && !gameImages[game.name]);

      if (needsIGDB && !gameImages[game.name]) {
        gamesNeedingImages.push(game.name);
      }
    }

    const mostPlayed = getMostPlayedGames();
    for (const game of mostPlayed) {
      if (failedImages.has(game.name) && !gameImages[game.name]) {
        if (!gamesNeedingImages.includes(game.name)) {
          gamesNeedingImages.push(game.name);
        }
      }
    }

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
    if (failedImages.has(game.name) && gameImages[game.name]) {
      return gameImages[game.name];
    }
    if (game.imageUrl && !failedImages.has(game.name)) return game.imageUrl;
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
        className="mx-auto w-full max-w-3xl flex flex-col gap-5 sm:gap-6 pb-8"
      >

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center gap-3"
        >
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-2 ring-ctp-surface1/30">
              {user ? (
                <img src={getAvatarUrl(256) || ''} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-ctp-surface0/50 animate-pulse" />
              )}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-ctp-base ${getStatusColor()}`} />
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold lowercase tracking-tight text-ctp-text">
              {user?.global_name || user?.username || 'Loading...'}<span className="text-ctp-mauve">.</span>
            </h2>
            <p className="text-sm text-ctp-overlay1 font-data mt-1">@{user?.username}</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              <span className="text-xs font-data text-ctp-overlay1">{getStatusText()}</span>
              {customStatus?.state && (
                <>
                  <span className="text-ctp-overlay1/30">·</span>
                  <span className="text-xs text-ctp-subtext1/60 italic">"{customStatus.state}"</span>
                </>
              )}
            </div>
          </div>
        </motion.div>

        <div className="w-full h-px bg-gradient-to-r from-transparent via-ctp-mauve/40 to-transparent" />


        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-ctp-surface1/50 bg-ctp-surface0/40 p-5 flex flex-col justify-center"
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-ctp-mauve" />
            <span className="text-xs font-data font-bold text-ctp-overlay1 uppercase">Local Time</span>
          </div>
          <p className="text-3xl font-data font-bold text-ctp-text">
            {formatTime(currentTime)}
          </p>
          <p className="text-sm text-ctp-subtext1 mt-1">
            {formatDate(currentTime)}
          </p>
        </motion.div>


        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`rounded-2xl p-5 transition-all ${
          gameActivity
            ? 'bg-ctp-mauve/10 border border-ctp-mauve/20'
            : 'border border-ctp-surface1/50 bg-ctp-surface0/40'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <Gamepad2 className={`w-4 h-4 ${gameActivity ? 'text-ctp-mauve' : 'text-ctp-overlay1'}`} />
            <span className="text-xs font-data font-bold text-ctp-overlay1 uppercase">Activities</span>
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
                <div className="w-24 h-32 rounded-xl bg-ctp-mauve/20 flex items-center justify-center flex-shrink-0 ring-1 ring-white/10">
                  <Gamepad2 className="w-10 h-10 text-ctp-mauve" />
                </div>
              )}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-ctp-green animate-pulse" />
                  <span className="text-xs font-data text-ctp-mauve uppercase font-bold">Now Playing</span>
                </div>
                <p className="font-heading font-bold text-lg text-ctp-text leading-tight line-clamp-2">{gameActivity.name}</p>
                {gameActivity.details && <p className="text-xs text-ctp-subtext1 mt-1 truncate">{gameActivity.details}</p>}
                {gameActivity.state && <p className="text-xs text-ctp-overlay1/70 italic truncate">{gameActivity.state}</p>}
                {gameActivity.timestamps?.start && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-data text-ctp-overlay1">
                    <Clock className="w-3 h-3" />
                    <span>{formatElapsedTime(gameActivity.timestamps.start)} played</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-ctp-overlay1">
              <Gamepad2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Not playing anything</p>
            </div>
          )}
        </motion.div>


        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`rounded-2xl p-5 transition-all ${
          isSpotifyActive
            ? 'bg-ctp-green/10 border border-ctp-green/20'
            : 'border border-ctp-surface1/50 bg-ctp-surface0/40'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <Headphones className={`w-4 h-4 ${isSpotifyActive ? 'text-ctp-green' : 'text-ctp-overlay1'}`} />
            <span className="text-xs font-data font-bold text-ctp-overlay1 uppercase">Spotify</span>
            {isSpotifyActive && <Disc3 className="w-4 h-4 text-ctp-green animate-spin" style={{ animationDuration: '3s' }} />}
          </div>

          {isSpotifyActive && spotify ? (
            <div className="flex gap-4">
              <img src={spotify.album_art_url} alt={spotify.album} className="w-20 h-20 rounded-xl shadow-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg text-ctp-text truncate">{spotify.song}</p>
                <p className="text-sm text-ctp-subtext1 truncate">{spotify.artist}</p>
                <p className="text-xs text-ctp-overlay1/60 truncate">{spotify.album}</p>

                <div className="mt-2 flex items-center gap-2 text-xs font-data text-ctp-overlay1">
                  <span>{formatSpotifyTime(currentTime.getTime() - spotify.timestamps.start)}</span>
                  <div className="flex-1 h-1 bg-ctp-surface0/30 rounded-full overflow-hidden max-w-xs">
                    <div
                      className="h-full bg-ctp-green rounded-full"
                      style={{ width: `${Math.min(100, ((currentTime.getTime() - spotify.timestamps.start) / (spotify.timestamps.end - spotify.timestamps.start)) * 100)}%` }}
                    />
                  </div>
                  <span>{formatSpotifyTime(spotify.timestamps.end - spotify.timestamps.start)}</span>
                </div>

                {songLinks && (
                  <div className="mt-3 flex gap-2">
                    {songLinks.spotify && (
                      <a href={songLinks.spotify} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-1 text-xs bg-ctp-green/20 hover:bg-ctp-green/30 text-ctp-green px-2 py-1 rounded transition-colors">
                        <Music2 className="w-3 h-3" /> Open
                      </a>
                    )}
                    {songLinks.appleMusic && (
                      <a href={songLinks.appleMusic} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-1 text-xs bg-ctp-pink/20 hover:bg-ctp-pink/30 text-ctp-pink px-2 py-1 rounded transition-colors">
                        <Music2 className="w-3 h-3" /> Apple
                      </a>
                    )}
                    {songLinks.youtubeMusic && (
                      <a href={songLinks.youtubeMusic} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-1 text-xs bg-ctp-red/20 hover:bg-ctp-red/30 text-ctp-red px-2 py-1 rounded transition-colors">
                        <Play className="w-3 h-3" /> YouTube
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-ctp-overlay1">
              <Headphones className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Not listening to anything</p>
            </div>
          )}
        </motion.div>


        <div className="w-full h-px bg-gradient-to-r from-transparent via-ctp-surface1 to-transparent" />


        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-ctp-surface1/50 bg-ctp-surface0/40 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-ctp-blue" />
              <span className="text-xs font-data font-bold text-ctp-overlay1 uppercase">In Rotation</span>
            </div>
            <a href={STEAM_PROFILE_URL} target="_blank" rel="noopener noreferrer"
               className="flex items-center gap-1 text-xs text-ctp-mauve hover:text-ctp-mauve/80 transition-colors">
              Steam <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {steamLoading && !gameActivity ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-ctp-surface0/20 rounded-lg aspect-[460/215]" />
              ))}
            </div>
          ) : inRotationGames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {inRotationGames.map((game) => {
                const imageUrl = getGameImage(game);
                return (
                  <a
                    key={game.id}
                    href={game.storeUrl || '#'}
                    target={game.storeUrl ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="group relative rounded-lg overflow-hidden aspect-[460/215] bg-ctp-surface0/20"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={game.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={() => handleImageError(game.name)}
                      />
                    ) : (
                      <div className="w-full h-full bg-ctp-mauve/20 flex items-center justify-center">
                        <Gamepad2 className="w-8 h-8 text-white/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {game.isPlaying && (
                      <div className="absolute top-1 right-1 bg-ctp-green text-ctp-base text-[8px] font-bold px-1.5 py-0.5 rounded">
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
            <p className="text-sm text-ctp-overlay1 text-center py-4">No recent games</p>
          )}
        </motion.div>


        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-ctp-surface1/50 bg-ctp-surface0/40 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-ctp-peach" />
              <span className="text-xs font-data font-bold text-ctp-overlay1 uppercase">Most Played</span>
              {steamData && <span className="text-[10px] text-ctp-overlay1/60">({steamData.totalGames} games)</span>}
            </div>
          </div>

          {steamLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-ctp-surface0/20 rounded-lg aspect-[460/215]" />
              ))}
            </div>
          ) : mostPlayedGames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {mostPlayedGames.map((game, index) => {
                const imageUrl = getGameImage(game);
                return (
                  <a
                    key={game.id}
                    href={game.storeUrl || '#'}
                    target={game.storeUrl ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className="group relative rounded-lg overflow-hidden aspect-[460/215] bg-ctp-surface0/20"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={game.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={() => handleImageError(game.name)}
                      />
                    ) : (
                      <div className="w-full h-full bg-ctp-peach/20 flex items-center justify-center">
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
            <p className="text-sm text-ctp-overlay1 text-center py-4">No games found</p>
          )}
        </motion.div>


        {wishlist.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="bg-ctp-blue/10 border border-ctp-blue/20 rounded-2xl p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-ctp-blue" />
                <span className="text-xs font-data font-bold text-ctp-overlay1 uppercase">Steam Wishlist</span>
                <span className="text-[10px] text-ctp-overlay1/50">({wishlist.length} games)</span>
              </div>
              <div className="flex items-center gap-2">

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setWishlistPage(Math.max(0, wishlistPage - 1))}
                    disabled={wishlistPage === 0}
                    className="w-9 h-9 sm:w-7 sm:h-7 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] text-ctp-overlay1 min-w-[40px] text-center">
                    {wishlistPage + 1} / {Math.ceil(wishlist.length / 5)}
                  </span>
                  <button
                    onClick={() => setWishlistPage(Math.min(Math.ceil(wishlist.length / 5) - 1, wishlistPage + 1))}
                    disabled={wishlistPage >= Math.ceil(wishlist.length / 5) - 1}
                    className="w-9 h-9 sm:w-7 sm:h-7 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <a
                  href={`${STEAM_PROFILE_URL}/wishlist`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-ctp-overlay1 hover:text-ctp-text flex items-center gap-1 transition-colors"
                >
                  View All <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <AnimatePresence mode="popLayout">
                {wishlist.slice(wishlistPage * 5, wishlistPage * 5 + 5).map((game) => {
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
                      className="group relative rounded-xl overflow-hidden aspect-[3/4] bg-ctp-surface0/20 shadow-lg ring-1 ring-white/10"
                    >
                      <img
                        src={capsuleUrl}
                        alt={game.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (img.src === capsuleUrl) {
                            if (igdbUrl) {
                              img.src = igdbUrl;
                            } else {
                              img.src = steamHeaderUrl;
                            }
                          } else if (img.src === igdbUrl && steamHeaderUrl) {
                            img.src = steamHeaderUrl;
                          } else {
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
