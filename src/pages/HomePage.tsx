import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, Gamepad2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Cache for IGDB covers
const igdbCache = new Map<string, string>();
import { getPlatformVisuals } from '@/lib/social-platforms';
import PageLayout from '@/components/PageLayout';
import WarpText from '@/components/typography/WarpText';
import RainbowJumpText from '@/components/typography/RainbowJumpText';
import { useLanyard } from '@/hooks/useLanyard';

interface SocialLink {
  id: string;
  name: string;
  handle: string;
  url: string;
  display_order: number;
}

const HomePage = () => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [gameCoverUrl, setGameCoverUrl] = useState<string | null>(null);

  const {
    data: lanyardData,
    gameActivity,
    customStatus,
    isSpotifyActive,
    spotify,
    status,
    getAvatarUrl,
    getStatusColor,
    getStatusText,
    getActivityAssetUrl,
  } = useLanyard();

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

  // Fetch game cover - Discord asset first, then IGDB fallback
  useEffect(() => {
    if (!gameActivity?.name) {
      setGameCoverUrl(null);
      return;
    }

    // First try Discord's activity asset
    const discordAsset = getActivityAssetUrl(gameActivity, 'large');
    if (discordAsset) {
      setGameCoverUrl(discordAsset);
      return;
    }

    // Fall back to IGDB
    const gameName = gameActivity.name;
    const cacheKey = gameName.toLowerCase().trim();
    
    if (igdbCache.has(cacheKey)) {
      setGameCoverUrl(igdbCache.get(cacheKey) || null);
      return;
    }

    const fetchCover = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('igdb-cover', {
          body: { gameName }
        });
        if (error) throw error;
        if (data?.coverUrl) {
          igdbCache.set(cacheKey, data.coverUrl);
          setGameCoverUrl(data.coverUrl);
        }
      } catch (err) {
        console.error(`[IGDB] Failed to fetch cover for ${gameName}:`, err);
      }
    };

    fetchCover();
  }, [gameActivity?.name, gameActivity, getActivityAssetUrl]);

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

  const formatLocalTime = () => {
    return new Date(currentTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatLocalDate = () => {
    return new Date(currentTime).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate social rows needed
  const getSocialsPerRow = () => {
    if (socialLinks.length <= 3) return 1;
    if (socialLinks.length <= 6) return 2;
    return 4;
  };
  const getSocialRows = () => Math.max(2, Math.ceil(socialLinks.length / getSocialsPerRow()));

  const getRowHeight = () => {
    const headerHeight = 64;
    const paddingY = 40;
    const socialRows = getSocialRows();
    const gapSize = 16;
    const totalGapHeight = gapSize * (socialRows - 1);
    const availableHeight = viewportHeight - headerHeight - paddingY - totalGapHeight;
    return Math.floor(availableHeight / socialRows);
  };

  const getProfileRowSpan = () => getSocialRows();

  return (
    <PageLayout title="home" showTransition={true}>
      <div 
        className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 sm:gap-3 md:gap-4 h-full overflow-y-auto lg:overflow-hidden pb-4 lg:pb-0"
        style={{ 
          gridAutoRows: window.innerWidth >= 1024 ? `${getRowHeight()}px` : 'auto',
        }}
      >
        {/* ===== PROFILE TILE ===== */}
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="bento-tile col-span-2 sm:col-span-4 md:col-span-3 lg:col-span-4 bg-card/40 border border-border/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 flex flex-col overflow-hidden relative group"
          style={{ gridRow: window.innerWidth >= 1024 ? `span ${getProfileRowSpan()}` : 'auto' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10 flex items-start gap-3 sm:gap-4 mb-2 sm:mb-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl overflow-hidden ring-2 ring-border/30">
                {lanyardData?.discord_user ? (
                  <img src={getAvatarUrl(256) || ''} alt="coah" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted/50 animate-pulse" />
                )}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border-2 sm:border-4 border-card ${getStatusColor()} ${status === 'online' ? 'animate-pulse' : ''}`} />
            </div>

            {/* Name + Status */}
            <div className="flex-1 min-w-0">
              <RainbowJumpText className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black lowercase leading-none tracking-tight text-foreground" triggerOnParentHover>
                coah
              </RainbowJumpText>
              
              <div className="mt-1 sm:mt-2 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${getStatusColor()}`} />
                <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">
                  {getStatusText()}
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

          {/* Time, Languages & Activity - Desktop only */}
          <div className="hidden lg:flex flex-col gap-2 flex-1">
            {/* Time */}
            <div className="flex-1 p-4 bg-muted/10 border border-border/20 rounded-xl flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-mono text-muted-foreground uppercase">Local Time</span>
              </div>
              <p className="text-2xl font-mono font-bold text-foreground">{formatLocalTime()}</p>
              <p className="text-sm text-muted-foreground mt-1">{formatLocalDate()}</p>
            </div>

            {/* Languages */}
            <div className="flex-1 p-4 bg-muted/10 border border-border/20 rounded-xl flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Languages</span>
              </div>
              <div className="flex flex-wrap gap-2 content-start flex-1">
                {[
                  { name: 'HTML', icon: 'https://cdn.simpleicons.org/html5/E34F26' },
                  { name: 'CSS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg' },
                  { name: 'Java', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg' },
                  { name: 'C#', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg' },
                  { name: 'C++', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg' },
                  { name: 'JavaScript', icon: 'https://cdn.simpleicons.org/javascript/F7DF1E' },
                  { name: 'After Effects', icon: '/icons/aftereffects.svg' },
                  { name: 'Premiere Pro', icon: '/icons/premierepro.svg' },
                  { name: 'Git', icon: 'https://cdn.simpleicons.org/git/F05032' },
                ].map((skill) => (
                  <div
                    key={skill.name}
                    className="flex items-center gap-2 px-3 py-1.5 bg-muted/20 border border-border/30 rounded-lg hover:bg-muted/40 transition-colors group"
                    title={skill.name}
                  >
                    <img src={skill.icon} alt={skill.name} className="w-4 h-4" />
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{skill.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity - Desktop (shows both Spotify and Game if available) */}
            <div className="flex-1 p-4 bg-muted/10 border border-border/20 rounded-xl flex flex-col gap-3 overflow-hidden">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-accent" />
                <span className="text-xs font-mono text-muted-foreground uppercase">Activities</span>
              </div>
              <AnimatePresence mode="popLayout">
                {isSpotifyActive && spotify && (
                  <motion.div
                    key={`spotify-${spotify.song}`}
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    layout
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <img src={spotify.album_art_url} alt={spotify.album} className="w-12 h-12 rounded-lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Headphones className="w-4 h-4 text-green-400" />
                          <span className="text-xs font-mono text-green-400 uppercase">listening</span>
                        </div>
                        <p className="font-bold text-sm text-foreground truncate">{spotify.song}</p>
                        <p className="text-xs text-muted-foreground truncate">{spotify.artist}</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">
                        {formatSpotifyTime(currentTime - spotify.timestamps.start)}
                      </span>
                      <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-green-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${Math.min(100, ((currentTime - spotify.timestamps.start) / (spotify.timestamps.end - spotify.timestamps.start)) * 100)}%` 
                          }}
                          transition={{ duration: 0.5, ease: "linear" }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground w-8">
                        {formatSpotifyTime(spotify.timestamps.end - spotify.timestamps.start)}
                      </span>
                    </div>
                  </motion.div>
                )}

                {gameActivity && (
                  <motion.div
                    key={`game-${gameActivity.name}`}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    layout
                    className="flex gap-4 flex-1"
                  >
                    {/* IGDB-style cover */}
                    {gameCoverUrl ? (
                      <div className="relative flex-shrink-0">
                        <img 
                          src={gameCoverUrl} 
                          alt={gameActivity.name} 
                          className="w-20 h-28 rounded-xl object-cover shadow-lg ring-1 ring-white/10" 
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                    ) : (
                      <div className="w-20 h-28 rounded-xl bg-muted/30 flex items-center justify-center flex-shrink-0 ring-1 ring-white/10">
                        <Gamepad2 className="w-8 h-8 text-accent" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-mono text-accent uppercase font-bold">Now Playing</span>
                      </div>
                      <p className="font-black text-lg text-foreground leading-tight line-clamp-2">{gameActivity.name}</p>
                      {gameActivity.details && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{gameActivity.details}</p>
                      )}
                      {gameActivity.state && (
                        <p className="text-xs text-muted-foreground/70 italic truncate">{gameActivity.state}</p>
                      )}
                      {gameActivity.timestamps?.start && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatElapsedTime(gameActivity.timestamps.start)} played</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {!isSpotifyActive && !gameActivity && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center h-full"
                  >
                    <p className="text-sm font-mono text-muted-foreground/60">not doing anything rn</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Activity - Mobile only */}
          <div className="relative z-10 mt-auto lg:hidden overflow-hidden">
            <AnimatePresence mode="wait">
              {isSpotifyActive && spotify && (
                <motion.div
                  key={`mobile-spotify-${spotify.song}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-green-500/10 border border-green-500/20 rounded-lg sm:rounded-xl"
                >
                  <img src={spotify.album_art_url} alt={spotify.album} className="w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5">
                      <Headphones className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-400" />
                      <span className="text-[8px] sm:text-[10px] font-mono text-green-400 uppercase">listening</span>
                    </div>
                    <p className="font-bold text-[10px] sm:text-xs text-foreground truncate">{spotify.song}</p>
                    <p className="text-[8px] sm:text-[10px] text-muted-foreground truncate">{spotify.artist}</p>
                  </div>
                  <div className="text-[8px] sm:text-[10px] font-mono text-muted-foreground hidden sm:block">
                    {formatSpotifyTime(currentTime - spotify.timestamps.start)}
                  </div>
                </motion.div>
              )}

              {!isSpotifyActive && gameActivity && (
                <motion.div
                  key={`mobile-game-${gameActivity.name}`}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="flex gap-3 p-3 bg-accent/10 border border-accent/20 rounded-xl"
                >
                  {gameCoverUrl ? (
                    <div className="relative flex-shrink-0">
                      <img src={gameCoverUrl} alt={gameActivity.name} className="w-14 h-20 rounded-lg object-cover ring-1 ring-white/10" />
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/30 to-transparent" />
                    </div>
                  ) : (
                    <div className="w-14 h-20 rounded-lg bg-muted/30 flex items-center justify-center ring-1 ring-white/10">
                      <Gamepad2 className="w-6 h-6 text-accent" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-mono text-accent uppercase font-bold">Now Playing</span>
                    </div>
                    <p className="font-bold text-sm text-foreground leading-tight line-clamp-2">{gameActivity.name}</p>
                    {gameActivity.details && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{gameActivity.details}</p>}
                    {gameActivity.timestamps?.start && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-muted-foreground">
                        <Clock className="w-2.5 h-2.5" />
                        {formatElapsedTime(gameActivity.timestamps.start)}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {!isSpotifyActive && !gameActivity && (
                <motion.div
                  key="mobile-idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-2 sm:p-3 bg-muted/10 border border-border/20 rounded-lg sm:rounded-xl"
                >
                  <p className="text-[10px] sm:text-xs font-mono text-muted-foreground/60 text-center">not doing anything rn</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ===== SOCIAL LINKS ===== */}
        {socialLinks.map((link, index) => {
          const { icon: IconComponent, gradient, hoverBg } = getPlatformVisuals(link.name, link.url);
          const count = socialLinks.length;
          
          let colSpan = 'col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-8';
          
          if (count <= 3) {
            colSpan = 'col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-8';
          } else if (count <= 6) {
            colSpan = 'col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4';
          } else {
            colSpan = 'col-span-1 sm:col-span-2 md:col-span-2 lg:col-span-2';
          }
          
          return (
            <motion.a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.4, 
                delay: 0.2 + index * 0.05,
                ease: [0.16, 1, 0.3, 1]
              }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`bento-tile ${colSpan} row-span-1 bg-card/30 border border-border/20 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 flex flex-col items-center justify-center gap-1 sm:gap-2 group ${hoverBg} hover:border-border/40 transition-colors duration-200`}
            >
              <div className={`p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl md:rounded-2xl bg-gradient-to-br ${gradient} group-hover:scale-110 transition-transform`}>
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
              </div>
              
              <RainbowJumpText className="font-black text-xs sm:text-sm md:text-lg text-foreground text-center leading-tight" triggerOnParentHover>{link.name}</RainbowJumpText>
              
              <span className="text-[8px] sm:text-[10px] md:text-xs font-mono text-muted-foreground truncate max-w-full hidden sm:block">{link.handle}</span>
            </motion.a>
          );
        })}

      </div>
    </PageLayout>
  );
};

export default HomePage;
