import { useState, useEffect, useCallback, useRef } from 'react';

// Raw API types (tags can be string or array)
interface RawDiscordGame {
  game_id: string;
  comment: string | null;
  tags: string | string[];
}

// Normalized types (tags always array)
export interface DiscordGame {
  game_id: string;
  comment: string | null;
  tags: string[];
}

// Helper to normalize tags
const normalizeTags = (tags: string | string[] | undefined | null): string[] => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') return tags.split(' ').filter(t => t.length > 0);
  return [];
};

export interface DiscordGameWidget {
  id: string;
  updated_at: string;
  data: {
    type: 'favorite_games' | 'played_games' | 'want_to_play_games' | 'current_games';
    games: DiscordGame[];
  };
}

export interface DiscordGameDetails {
  id: string;
  name: string;
  icon: string | null;
  splash: string | null;
  cover_image?: string;
}

export interface DiscordProfileData {
  user: {
    id: string;
    username: string;
    global_name: string;
    avatar: string;
    banner: string | null;
    bio: string | null;
  };
  widgets: DiscordGameWidget[];
  connected_accounts: Array<{
    type: string;
    id: string;
    name: string;
    verified: boolean;
  }>;
}

export interface GameWithDetails extends DiscordGame {
  details: DiscordGameDetails | null;
}

const DEFAULT_USER_ID = '761701756119547955';

export function useDiscordProfile(userId: string = DEFAULT_USER_ID) {
  const [profile, setProfile] = useState<DiscordProfileData | null>(null);
  const [gameDetails, setGameDetails] = useState<Record<string, DiscordGameDetails>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedGameIds = useRef<Set<string>>(new Set());

  // Fetch the profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`https://dcdn.dstn.to/profile/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data: DiscordProfileData = await response.json();
        console.log('[DiscordProfile] Fetched profile:', data);
        console.log('[DiscordProfile] Widgets:', data.widgets?.length, data.widgets?.map(w => w.data.type));
        setProfile(data);
        setError(null);
      } catch (err) {
        console.error('[DiscordProfile] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Fetch game details for all games in widgets
  useEffect(() => {
    if (!profile?.widgets) return;

    const allGameIds = new Set<string>();
    profile.widgets.forEach(widget => {
      widget.data.games.forEach(game => {
        allGameIds.add(game.game_id);
      });
    });

    const fetchGameDetail = async (gameId: string) => {
      if (fetchedGameIds.current.has(gameId)) return;
      fetchedGameIds.current.add(gameId);
      
      try {
        const response = await fetch(`https://dcdn.dstn.to/app/${gameId}`);
        if (!response.ok) return null;
        const data = await response.json();
        console.log('[DiscordProfile] Game details:', gameId, data);
        setGameDetails(prev => ({ ...prev, [gameId]: data as DiscordGameDetails }));
      } catch (err) {
        console.error('[DiscordProfile] Failed to fetch game:', gameId, err);
      }
    };

    // Fetch all game details
    Array.from(allGameIds).forEach(gameId => {
      fetchGameDetail(gameId);
    });
  }, [profile]);

  // Helper to get games by type with normalized tags
  const getGamesByType = useCallback((type: DiscordGameWidget['data']['type']): GameWithDetails[] => {
    const widget = profile?.widgets?.find(w => w.data.type === type);
    if (!widget) return [];
    return widget.data.games.map((game: any) => ({
      game_id: game.game_id,
      comment: game.comment,
      tags: normalizeTags(game.tags),
      details: gameDetails[game.game_id] || null,
    }));
  }, [profile, gameDetails]);

  // Get game icon URL
  const getGameIconUrl = useCallback((gameId: string, size = 128) => {
    const details = gameDetails[gameId];
    if (!details?.icon) return null;
    return `https://cdn.discordapp.com/app-icons/${gameId}/${details.icon}.png?size=${size}`;
  }, [gameDetails]);

  // Get game cover URL
  const getGameCoverUrl = useCallback((gameId: string, size = 256) => {
    const details = gameDetails[gameId];
    if (!details?.cover_image) return null;
    return `https://cdn.discordapp.com/app-assets/${gameId}/store/${details.cover_image}.png?size=${size}`;
  }, [gameDetails]);

  // Get game splash URL
  const getGameSplashUrl = useCallback((gameId: string, size = 512) => {
    const details = gameDetails[gameId];
    if (!details?.splash) return null;
    return `https://cdn.discordapp.com/app-assets/${gameId}/${details.splash}.png?size=${size}`;
  }, [gameDetails]);

  return {
    profile,
    isLoading,
    error,
    gameDetails,
    favoriteGames: getGamesByType('favorite_games'),
    playedGames: getGamesByType('played_games'),
    wantToPlayGames: getGamesByType('want_to_play_games'),
    currentGames: getGamesByType('current_games'),
    getGameIconUrl,
    getGameCoverUrl,
    getGameSplashUrl,
  };
}
