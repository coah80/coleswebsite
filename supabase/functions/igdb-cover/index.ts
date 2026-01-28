import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const imageCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TWITCH_CLIENT_ID = Deno.env.get('TWITCH_CLIENT_ID');
    const TWITCH_CLIENT_SECRET = Deno.env.get('TWITCH_CLIENT_SECRET');

    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
      throw new Error('Missing Twitch/IGDB credentials. Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET.');
    }

    const { gameName } = await req.json();
    
    if (!gameName) {
      return new Response(
        JSON.stringify({ error: 'gameName is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const cacheKey = gameName.toLowerCase().trim();
    const cached = imageCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new Response(
        JSON.stringify({ coverUrl: cached.url, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenResponse = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
      { method: 'POST' }
    );
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('Failed to get Twitch access token');
    }

    const igdbResponse = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain',
      },
      body: `search "${gameName}"; fields name,cover.url,cover.image_id; limit 10;`,
    });

    const games = await igdbResponse.json();

    if (!games || games.length === 0) {
      return new Response(
        JSON.stringify({ coverUrl: null, error: 'Game not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchNameLower = gameName.toLowerCase().trim();
    let bestMatch = null;
    let bestScore = -1;
    
    for (const game of games) {
      if (!game.cover) continue;
      const gameNameLower = game.name.toLowerCase().trim();
      
      // Exact match is perfect
      if (gameNameLower === searchNameLower) {
        bestMatch = game;
        bestScore = 100;
        break;
      }
      
      // Calculate similarity score
      let score = 0;
      
      // Exact match at start is very good
      if (gameNameLower.startsWith(searchNameLower + ' ') || gameNameLower.startsWith(searchNameLower + ':')) {
        score = 90;
      } else if (gameNameLower === searchNameLower) {
        score = 100;
      } else if (gameNameLower.startsWith(searchNameLower)) {
        score = 80;
      } else if (searchNameLower.startsWith(gameNameLower)) {
        // Search term contains the game name (e.g., searching "Stray Cat" for game "Stray")
        score = 70;
      } else if (gameNameLower.includes(searchNameLower)) {
        // Penalize if it's in the middle (likely wrong game)
        score = 30;
      }
      
      // Prefer shorter names (more likely to be exact match)
      if (score > 0) {
        const lengthDiff = Math.abs(gameNameLower.length - searchNameLower.length);
        score -= lengthDiff * 0.5;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = game;
      }
    }

    // If no good match found, use first result with cover
    if (!bestMatch) {
      bestMatch = games.find((g: any) => g.cover) || games[0];
    }

    if (!bestMatch.cover) {
      return new Response(
        JSON.stringify({ coverUrl: null, error: 'Game cover not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let coverUrl = bestMatch.cover.url;
    if (coverUrl) {
      coverUrl = coverUrl.replace('t_thumb', 't_cover_big');
      if (!coverUrl.startsWith('https:')) {
        coverUrl = 'https:' + coverUrl;
      }
    }

    imageCache.set(cacheKey, { url: coverUrl, timestamp: Date.now() });

    return new Response(
      JSON.stringify({ 
        coverUrl,
        gameName: bestMatch.name,
        imageId: bestMatch.cover.image_id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('IGDB API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch game data' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
