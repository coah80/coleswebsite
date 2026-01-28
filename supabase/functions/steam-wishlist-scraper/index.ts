import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WishlistGame {
  appid: number;
  name: string;
  priority: number;
  capsule?: string;
}

// Hardcoded wishlist from manual scrape - update this when adding new games
// This is necessary because Steam's wishlist page requires JavaScript rendering
const FALLBACK_WISHLIST: WishlistGame[] = [
  { appid: 726830, name: "Vacation Simulator", priority: 1 },
  { appid: 448880, name: "Spells 'n' Stuff", priority: 2 },
  { appid: 1332010, name: "Stray", priority: 3 },
  { appid: 1849900, name: "Among Us VR", priority: 4 },
  { appid: 1859270, name: "Perfect Partner", priority: 5 },
  { appid: 1583230, name: "High On Life", priority: 6 },
  { appid: 1947500, name: "TWD Saints & Sinners Ch 2", priority: 7 },
  { appid: 1868140, name: "DAVE THE DIVER", priority: 8 },
  { appid: 1607680, name: "Bread & Fred", priority: 9 },
  { appid: 2231450, name: "Pizza Tower", priority: 10 },
  { appid: 1817230, name: "Hi-Fi RUSH", priority: 11 },
  { appid: 2018960, name: "Neolithic Dawn", priority: 12 },
  { appid: 1575520, name: "Fruit Ninja VR 2", priority: 13 },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STEAM_ID = '76561199229763710';
    
    console.log('[Scraper] Attempting Steam API methods...');

    // Try the old wishlistdata API endpoint (sometimes works)
    try {
      const apiUrl = `https://store.steampowered.com/wishlist/profiles/${STEAM_ID}/wishlistdata/?p=0`;
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        }
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          if (data && typeof data === 'object' && !data.success?.toString().includes('false')) {
            const games: WishlistGame[] = [];
            for (const [appid, info] of Object.entries(data)) {
              if (appid !== 'success' && !isNaN(parseInt(appid))) {
                const gameInfo = info as any;
                games.push({
                  appid: parseInt(appid),
                  name: gameInfo.name || `Game ${appid}`,
                  priority: gameInfo.priority || 999,
                  capsule: gameInfo.capsule,
                });
              }
            }
            
            if (games.length > 0) {
              console.log('[Scraper] Got', games.length, 'games from API');
              games.sort((a, b) => a.priority - b.priority);
              return new Response(
                JSON.stringify({ 
                  wishlist: games,
                  count: games.length,
                  source: 'steam_api',
                  timestamp: new Date().toISOString(),
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }
        }
      }
    } catch (e) {
      console.log('[Scraper] API method failed:', e);
    }

    // Fallback to hardcoded list
    console.log('[Scraper] Using fallback wishlist with', FALLBACK_WISHLIST.length, 'games');
    
    // Add Steam library capsule URLs to fallback
    const gamesWithCapsules = FALLBACK_WISHLIST.map(g => ({
      ...g,
      capsule: `https://steamcdn-a.akamaihd.net/steam/apps/${g.appid}/library_600x900.jpg`,
    }));

    return new Response(
      JSON.stringify({ 
        wishlist: gamesWithCapsules,
        count: gamesWithCapsules.length,
        source: 'fallback',
        message: 'Steam API blocked - using cached wishlist. To update, edit the FALLBACK_WISHLIST in the function.',
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Scraper] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Scraping failed', wishlist: FALLBACK_WISHLIST }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
