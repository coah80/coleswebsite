import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number; // minutes
  playtime_2weeks?: number; // minutes
  img_icon_url: string;
  has_community_visible_stats?: boolean;
  rtime_last_played?: number; // unix timestamp
}

interface WishlistItem {
  appid: number;
  name: string;
  capsule: string;
  review_score: number;
  review_desc: string;
  reviews_total: string;
  reviews_percent: number;
  release_date: string;
  release_string: string;
  platform_icons: string;
  subs: Array<{ price: string }>;
  type: string;
  screenshots: string[];
  review_css: string;
  priority: number;
  added: number;
  background: string;
  rank: number;
  tags: string[];
  is_free_game: boolean;
  win: number;
  mac: number;
  linux: number;
}

interface SteamResponse {
  recentlyPlayed: SteamGame[];
  mostPlayed: SteamGame[];
  wishlist: WishlistItem[];
  totalGames: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STEAM_API_KEY = Deno.env.get('STEAM_API_KEY');
    const STEAM_ID = Deno.env.get('STEAM_ID');

    if (!STEAM_API_KEY || !STEAM_ID) {
      throw new Error('Missing Steam configuration. Set STEAM_API_KEY and STEAM_ID in Supabase secrets.');
    }

    // Fetch recently played games (last 2 weeks)
    const recentlyPlayedUrl = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&format=json`;
    const recentResponse = await fetch(recentlyPlayedUrl);
    const recentData = await recentResponse.json();

    // Fetch all owned games with playtime
    const ownedGamesUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&include_appinfo=1&include_played_free_games=1&format=json`;
    const ownedResponse = await fetch(ownedGamesUrl);
    const ownedData = await ownedResponse.json();

    // Fetch wishlist - try multiple pages using vanity URL (coah80)
    let wishlist: WishlistItem[] = [];
    const VANITY_URL = 'coah80';
    try {
      // Try fetching multiple pages (Steam returns ~100 items per page)
      for (let page = 0; page < 5; page++) {
        // Try vanity URL first, which sometimes works better
        const wishlistUrl = `https://store.steampowered.com/wishlist/id/${VANITY_URL}/wishlistdata/?p=${page}`;
        console.log(`[Steam] Fetching wishlist page ${page}: ${wishlistUrl}`);
        
        const wishlistResponse = await fetch(wishlistUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://store.steampowered.com/',
            'Cookie': '' // Empty cookie to avoid auth issues
          }
        });

        // Check if we got JSON or HTML
        const contentType = wishlistResponse.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          console.log(`[Steam] Page ${page} returned non-JSON (${contentType})`);
          break;
        }

        if (wishlistResponse.ok) {
          const text = await wishlistResponse.text();
          
          // Check if it's an HTML error page
          if (text.startsWith('<!') || text.includes('<html')) {
            console.log(`[Steam] Page ${page} returned HTML, stopping`);
            break;
          }

          const wishlistData = JSON.parse(text);
          
          // Check if empty (signals end of pages)
          if (!wishlistData || Object.keys(wishlistData).length === 0) {
            console.log(`[Steam] Page ${page} is empty, stopping`);
            break;
          }

          // Convert object to array
          const pageItems = Object.entries(wishlistData).map(([appid, data]: [string, any]) => ({
            appid: parseInt(appid),
            name: data.name,
            capsule: data.capsule,
            priority: data.priority || 999,
            added: data.added,
            release_string: data.release_string,
            ...data,
          }));

          console.log(`[Steam] Page ${page} returned ${pageItems.length} items`);
          wishlist.push(...pageItems);

          // If less than 100 items, we've reached the end
          if (pageItems.length < 50) {
            break;
          }
        } else {
          console.log(`[Steam] Wishlist page ${page} failed: ${wishlistResponse.status}`);
          break;
        }
      }

      // Sort by priority
      wishlist.sort((a, b) => (a.priority || 999) - (b.priority || 999));
      console.log(`[Steam] Total wishlist items: ${wishlist.length}`);
    } catch (wishlistError) {
      console.error('[Steam] Failed to fetch wishlist:', wishlistError);
    }

    const recentlyPlayed: SteamGame[] = recentData.response?.games || [];
    const ownedGames: SteamGame[] = ownedData.response?.games || [];
    const totalGames = ownedData.response?.game_count || 0;

    // Sort by playtime and get top 10 most played
    const mostPlayed = [...ownedGames]
      .filter(game => game.playtime_forever > 0)
      .sort((a, b) => b.playtime_forever - a.playtime_forever)
      .slice(0, 10);

    const response: SteamResponse = {
      recentlyPlayed: recentlyPlayed.slice(0, 6),
      mostPlayed,
      wishlist, // Return all wishlist items
      totalGames,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Steam API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch Steam data' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
