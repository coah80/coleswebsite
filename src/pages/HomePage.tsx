import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, Gamepad2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const igdbCache = new Map<string, string>();
import { getPlatformVisuals } from '@/lib/social-platforms';
import PageLayout from '@/components/PageLayout';
import RainbowJumpText from '@/components/typography/RainbowJumpText';
import { useLanyard } from '@/hooks/useLanyard';

interface SocialLink {
  id: string;
  name: string;
  handle: string;
  url: string;
  description: string | null;
  display_order: number;
}

const HomePage = () => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [gameCoverUrl, setGameCoverUrl] = useState<string | null>(null);

  const {
    data: lanyardData,
    gameActivity,
    customStatus,
    isSpotifyActive,
    spotify,
    status,
    getAvatarUrl,
    getStatusText,
    getActivityAssetUrl,
  } = useLanyard();

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

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!gameActivity?.name) {
      setGameCoverUrl(null);
      return;
    }

    const discordAsset = getActivityAssetUrl(gameActivity, 'large');
    if (discordAsset) {
      setGameCoverUrl(discordAsset);
      return;
    }

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

  const statusColorMap: Record<string, string> = {
    online: 'bg-ctp-green',
    idle: 'bg-ctp-yellow',
    dnd: 'bg-ctp-red',
    offline: 'bg-ctp-overlay1',
  };

  const getCtpStatusColor = () => statusColorMap[status || 'offline'] || 'bg-ctp-overlay1';

  const skills = [
    { name: 'HTML', icon: 'https://cdn.simpleicons.org/html5/E34F26' },
    { name: 'CSS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg' },
    { name: 'Java', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg' },
    { name: 'C#', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg' },
    { name: 'C++', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg' },
    { name: 'JavaScript', icon: 'https://cdn.simpleicons.org/javascript/F7DF1E' },
    { name: 'After Effects', icon: '/icons/aftereffects.svg' },
    { name: 'Premiere Pro', icon: '/icons/premierepro.svg' },
    { name: 'Git', icon: 'https://cdn.simpleicons.org/git/F05032' },
  ];

  return (
    <PageLayout title="home" showTransition={true} allowScroll={true}>
      <div className="mx-auto w-full max-w-xl flex flex-col gap-5 sm:gap-6 pb-8">


        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center gap-3"
        >

          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-2 ring-ctp-surface1/30">
              {lanyardData?.discord_user ? (
                <img src={getAvatarUrl(256) || ''} alt="coah" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-ctp-surface0/50 animate-pulse" />
              )}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-ctp-base ${getCtpStatusColor()}`} />
          </div>


          <div>
            <h1 className="text-4xl sm:text-5xl font-heading font-extrabold lowercase leading-none tracking-tight text-ctp-text">
              <RainbowJumpText className="inline">coah</RainbowJumpText><span className="text-ctp-mauve">.</span>
            </h1>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getCtpStatusColor()}`} />
              <span className="text-xs font-data text-ctp-overlay1">{getStatusText()}</span>
              {customStatus?.state && (
                <>
                  <span className="text-ctp-overlay1/30">·</span>
                  <span className="text-xs text-ctp-subtext1/60 italic">"{customStatus.state}"</span>
                </>
              )}
            </div>
          </div>

          <p className="text-ctp-overlay2 font-body text-sm">
            video editor · content creator · bad coder
          </p>
        </motion.div>


        <div className="w-full h-px bg-gradient-to-r from-transparent via-ctp-mauve/40 to-transparent" />


        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-ctp-surface1/50 bg-ctp-surface0/40 p-5 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-ctp-blue" />
            <span className="text-[0.6875rem] font-heading font-bold uppercase tracking-widest text-ctp-overlay1">Local Time</span>
          </div>
          <p className="text-3xl font-data font-bold text-ctp-text">{formatLocalTime()}</p>
          <p className="text-sm text-ctp-subtext1 mt-1">{formatLocalDate()}</p>
        </motion.div>


        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-ctp-surface1/50 bg-ctp-surface0/40 p-5"
          >
            <span className="text-[0.6875rem] font-heading font-bold uppercase tracking-widest text-ctp-overlay1">Skills</span>
            <div className="flex flex-wrap gap-2 mt-3">
              {skills.map((skill) => (
                <div
                  key={skill.name}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-ctp-surface0/60 border border-ctp-surface1/40 rounded-lg hover:bg-ctp-surface1/40 transition-colors"
                  title={skill.name}
                >
                  <img src={skill.icon} alt={skill.name} className="w-3.5 h-3.5" />
                  <span className="text-[0.6875rem] font-body text-ctp-overlay1">{skill.name}</span>
                </div>
              ))}
            </div>
          </motion.div>


          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-ctp-surface1/50 bg-ctp-surface0/40 p-5 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-3">
              <Gamepad2 className="w-4 h-4 text-ctp-mauve" />
              <span className="text-[0.6875rem] font-heading font-bold uppercase tracking-widest text-ctp-overlay1">Activities</span>
            </div>

            <AnimatePresence mode="wait">
              {isSpotifyActive && spotify && (
                <motion.div
                  key={`spotify-${spotify.song}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col gap-2 flex-1"
                >
                  <div className="flex items-center gap-3">
                    <img src={spotify.album_art_url} alt={spotify.album} className="w-12 h-12 rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Headphones className="w-3.5 h-3.5 text-ctp-green" />
                        <span className="text-[0.625rem] font-data text-ctp-green uppercase">listening</span>
                      </div>
                      <p className="font-heading font-bold text-sm text-ctp-text truncate">{spotify.song}</p>
                      <p className="text-xs text-ctp-overlay1 truncate">{spotify.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[0.625rem] font-data text-ctp-overlay1 w-7 text-right">
                      {formatSpotifyTime(currentTime - spotify.timestamps.start)}
                    </span>
                    <div className="flex-1 h-1 bg-ctp-surface1/30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-ctp-green rounded-full"
                        animate={{
                          width: `${Math.min(100, ((currentTime - spotify.timestamps.start) / (spotify.timestamps.end - spotify.timestamps.start)) * 100)}%`
                        }}
                        transition={{ duration: 0.5, ease: "linear" }}
                      />
                    </div>
                    <span className="text-[0.625rem] font-data text-ctp-overlay1 w-7">
                      {formatSpotifyTime(spotify.timestamps.end - spotify.timestamps.start)}
                    </span>
                  </div>
                </motion.div>
              )}

              {!isSpotifyActive && gameActivity && (
                <motion.div
                  key={`game-${gameActivity.name}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="flex gap-3 flex-1"
                >
                  {gameCoverUrl ? (
                    <div className="relative flex-shrink-0">
                      <img
                        src={gameCoverUrl}
                        alt={gameActivity.name}
                        className="w-16 h-[5.5rem] rounded-xl object-cover ring-1 ring-ctp-surface1/50"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                  ) : (
                    <div className="w-16 h-[5.5rem] rounded-xl bg-ctp-surface1/30 flex items-center justify-center flex-shrink-0">
                      <Gamepad2 className="w-7 h-7 text-ctp-mauve" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-ctp-green animate-pulse" />
                      <span className="text-[0.625rem] font-data text-ctp-mauve uppercase font-bold">Now Playing</span>
                    </div>
                    <p className="font-heading font-bold text-sm text-ctp-text leading-tight line-clamp-2">{gameActivity.name}</p>
                    {gameActivity.details && (
                      <p className="text-[0.6875rem] text-ctp-overlay1 mt-0.5 truncate">{gameActivity.details}</p>
                    )}
                    {gameActivity.timestamps?.start && (
                      <div className="flex items-center gap-1 mt-1.5 text-[0.6875rem] font-data text-ctp-overlay1">
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
                  className="flex items-center justify-center flex-1 py-4"
                >
                  <p className="text-sm font-data text-ctp-overlay1/50">not doing anything rn</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>


        <div className="w-full h-px bg-gradient-to-r from-transparent via-ctp-surface1 to-transparent" />


        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-[0.6875rem] font-heading font-bold uppercase tracking-widest text-ctp-overlay1 pl-1"
        >
          Socials
        </motion.span>


        <div className="flex flex-col gap-2.5">
          {socialLinks.map((link, index) => {
            const { icon: IconComponent, gradient } = getPlatformVisuals(link.name, link.url);

            return (
              <motion.a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 + index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3.5 px-4 py-3 rounded-xl border border-ctp-surface1/50 bg-ctp-surface0/40 hover:border-ctp-surface2 hover:bg-ctp-surface0/65 hover:translate-x-1 transition-all duration-150 ease-out group"
              >
                <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} flex-shrink-0`}>
                  <IconComponent className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-data font-bold text-[0.9375rem] text-ctp-text leading-tight">{link.name}</p>
                  {link.description && (
                    <p className="text-xs text-ctp-overlay1 truncate mt-0.5">{link.description}</p>
                  )}
                </div>
                <span className="text-ctp-overlay0 text-sm font-data group-hover:text-ctp-mauve group-hover:translate-x-0.5 transition-all duration-150">&rarr;</span>
              </motion.a>
            );
          })}
        </div>


        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center gap-1.5 pt-2 pb-4"
        >
          <span className="block w-[3px] h-[3px] rounded-[1px] bg-ctp-surface1 rotate-45" />
          <span className="block w-[3px] h-[3px] rounded-[1px] bg-ctp-mauve/60 rotate-45" />
          <span className="block w-[3px] h-[3px] rounded-[1px] bg-ctp-surface1 rotate-45" />
        </motion.div>

      </div>
    </PageLayout>
  );
};

export default HomePage;
