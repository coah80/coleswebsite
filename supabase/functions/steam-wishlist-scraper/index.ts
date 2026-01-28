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
  { appid: 1849900, name: "Among Us 3D: VR", priority: 4 },
  { appid: 1859270, name: "Perfect Partner", priority: 5 },
  { appid: 1583230, name: "High On Life", priority: 6 },
  { appid: 1947500, name: "The Walking Dead: Saints & Sinners - Chapter 2: Retribution", priority: 7 },
  { appid: 1868140, name: "DAVE THE DIVER", priority: 8 },
  { appid: 1607680, name: "Bread & Fred", priority: 9 },
  { appid: 2231450, name: "Pizza Tower", priority: 10 },
  { appid: 1817230, name: "Hi-Fi RUSH", priority: 11 },
  { appid: 2018960, name: "Neolithic Dawn", priority: 12 },
  { appid: 1575520, name: "Fruit Ninja VR 2", priority: 13 },
  { appid: 1059550, name: "Valve Index Controllers", priority: 14 },
  { appid: 2420570, name: "Portal BAGLEY", priority: 15 },
  { appid: 1703340, name: "The Stanley Parable: Ultra Deluxe", priority: 16 },
  { appid: 1030300, name: "Hollow Knight: Silksong", priority: 17 },
  { appid: 2074360, name: "The Obsessive Shadow", priority: 18 },
  { appid: 506500, name: "Party Panic", priority: 19 },
  { appid: 2381520, name: "Unrecord", priority: 20 },
  { appid: 2166060, name: "Amanda the Adventurer", priority: 21 },
  { appid: 1784650, name: "BOSS FIGHTERS", priority: 22 },
  { appid: 1922010, name: "Breachers", priority: 23 },
  { appid: 2257770, name: "Not For Broadcast VR", priority: 24 },
  { appid: 1957780, name: "Ghosts of Tabor", priority: 25 },
  { appid: 1388550, name: "Human Fall Flat 2", priority: 26 },
  { appid: 1408230, name: "Walkabout Mini Golf VR", priority: 27 },
  { appid: 1451810, name: "LEGO 2K Drive", priority: 28 },
  { appid: 1324350, name: "Turbo Golf Racing", priority: 29 },
  { appid: 2195400, name: "Shave & Stuff", priority: 30 },
  { appid: 1597080, name: "Killer Bean", priority: 31 },
  { appid: 2300840, name: "Subliminal", priority: 32 },
  { appid: 1810070, name: "Aperture: Salt Mines", priority: 33 },
  { appid: 2078350, name: "Bluey: The Videogame", priority: 34 },
  { appid: 2497900, name: "DON'T SCREAM", priority: 35 },
  { appid: 2663960, name: "Bendy: The Cage", priority: 36 },
  { appid: 1522160, name: "Disney Epic Mickey: Rebrushed", priority: 37 },
  { appid: 1456940, name: "Level Zero: Extraction", priority: 38 },
  { appid: 2878270, name: "Metal: Hellsinger VR", priority: 39 },
  { appid: 2406770, name: "Bodycam", priority: 40 },
  { appid: 3078140, name: "Five Laps at Freddy's", priority: 41 },
  { appid: 2638370, name: "Five Nights at Freddy's: Into the Pit", priority: 42 },
  { appid: 636190, name: "The Foglands", priority: 43 },
  { appid: 2280350, name: "Turbo Dismount 2", priority: 44 },
  { appid: 2920570, name: "Dale & Dawson Stationery Supplies", priority: 45 },
  { appid: 794840, name: "Voicemod", priority: 46 },
  { appid: 3070070, name: "TCG Card Shop Simulator", priority: 47 },
  { appid: 2780980, name: "LOCKDOWN Protocol", priority: 48 },
  { appid: 3209660, name: "Golf With Your Friends 2", priority: 49 },
  { appid: 3130340, name: "Bean There, Won That", priority: 50 },
  { appid: 3059070, name: "The Headliners", priority: 51 },
  { appid: 1211020, name: "Wobbly Life", priority: 52 },
  { appid: 1635450, name: "Longvinter", priority: 53 },
  { appid: 2790330, name: "Blood Typers", priority: 54 },
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
