import type { ComponentType } from 'react';
import { ExternalLink, Globe, Mail, MapPin, Phone } from 'lucide-react';
import {
  SiAdobe,
  SiAmazon,
  SiAnchor,
  SiApplemusic,
  SiArtstation,
  SiBandcamp,
  SiBehance,
  SiBeacons,
  SiBluesky,
  SiBumble,
  SiBuymeacoffee,
  SiCalendly,
  SiCameo,
  SiCarrd,
  SiCashapp,
  SiClubhouse,
  SiDeezer,
  SiDeviantart,
  SiDiscord,
  SiDribbble,
  SiEbay,
  SiEpicgames,
  SiEtsy,
  SiFacebook,
  SiFansly,
  SiFigma,
  SiGithub,
  SiGofundme,
  SiHinge,
  SiIndiegogo,
  SiInstagram,
  SiKickstarter,
  SiKofi,
  SiLastdotfm,
  SiLinkedin,
  SiLinktree,
  SiMastodon,
  SiNintendo,
  SiOnlyfans,
  SiPatreon,
  SiPaypal,
  SiPlaystation,
  SiReddit,
  SiRumble,
  SiShopify,
  SiSignal,
  SiSnapchat,
  SiSoundcloud,
  SiSpotify,
  SiSteam,
  SiTelegram,
  SiThreads,
  SiTiktok,
  SiTinder,
  SiTwitch,
  SiTwitter,
  SiVenmo,
  SiVimeo,
  SiWhatsapp,
  SiX,
  SiYoutube
} from 'react-icons/si';

type IconComponent = ComponentType<{ className?: string }>;

interface PlatformVisuals {
  icon: IconComponent;
  gradient: string;
}

const createVisuals = (icon: IconComponent, gradient: string): PlatformVisuals => ({
  icon,
  gradient
});

const PLATFORM_ICON_MAP: Record<string, PlatformVisuals> = {
  // Core social platforms
  instagram: createVisuals(SiInstagram, 'from-pink-500 to-purple-500'),
  tiktok: createVisuals(SiTiktok, 'from-gray-900 to-pink-500'),
  youtube: createVisuals(SiYoutube, 'from-red-500 to-red-600'),
  twitter: createVisuals(SiTwitter, 'from-sky-500 to-blue-500'),
  x: createVisuals(SiX, 'from-slate-600 to-gray-900'),
  github: createVisuals(SiGithub, 'from-gray-700 to-neutral-900'),
  linkedin: createVisuals(SiLinkedin, 'from-blue-600 to-blue-700'),
  facebook: createVisuals(SiFacebook, 'from-blue-500 to-blue-600'),
  discord: createVisuals(SiDiscord, 'from-indigo-500 to-purple-500'),
  twitch: createVisuals(SiTwitch, 'from-purple-600 to-purple-700'),
  snapchat: createVisuals(SiSnapchat, 'from-yellow-400 to-yellow-500'),
  reddit: createVisuals(SiReddit, 'from-orange-500 to-red-500'),
  telegram: createVisuals(SiTelegram, 'from-sky-400 to-sky-500'),
  whatsapp: createVisuals(SiWhatsapp, 'from-green-400 to-green-500'),
  signal: createVisuals(SiSignal, 'from-blue-500 to-blue-600'),
  mastodon: createVisuals(SiMastodon, 'from-purple-500 to-blue-500'),
  threads: createVisuals(SiThreads, 'from-gray-700 to-black'),
  bluesky: createVisuals(SiBluesky, 'from-sky-400 to-sky-500'),

  // Gaming
  steam: createVisuals(SiSteam, 'from-slate-700 to-slate-900'),
  epicgames: createVisuals(SiEpicgames, 'from-gray-800 to-black'),
  playstation: createVisuals(SiPlaystation, 'from-blue-600 to-blue-700'),
  xbox: createVisuals(SiXbox, 'from-green-500 to-green-600'),
  nintendo: createVisuals(SiNintendo, 'from-red-500 to-red-600'),

  // Music & audio
  spotify: createVisuals(SiSpotify, 'from-green-500 to-green-600'),
  applemusic: createVisuals(SiApplemusic, 'from-pink-500 to-red-500'),
  soundcloud: createVisuals(SiSoundcloud, 'from-orange-500 to-orange-600'),
  bandcamp: createVisuals(SiBandcamp, 'from-blue-400 to-teal-500'),
  lastfm: createVisuals(SiLastdotfm, 'from-red-500 to-red-600'),
  deezer: createVisuals(SiDeezer, 'from-purple-500 to-pink-500'),
  anchor: createVisuals(SiAnchor, 'from-purple-500 to-purple-600'),
  clubhouse: createVisuals(SiClubhouse, 'from-orange-400 to-yellow-500'),

  // Creative tools
  behance: createVisuals(SiBehance, 'from-blue-500 to-indigo-500'),
  dribbble: createVisuals(SiDribbble, 'from-pink-500 to-red-500'),
  deviantart: createVisuals(SiDeviantart, 'from-green-500 to-emerald-500'),
  artstation: createVisuals(SiArtstation, 'from-blue-500 to-indigo-600'),
  figma: createVisuals(SiFigma, 'from-purple-500 to-pink-500'),
  adobe: createVisuals(SiAdobe, 'from-red-500 to-orange-500'),

  // Creator economy
  onlyfans: createVisuals(SiOnlyfans, 'from-sky-500 to-cyan-500'),
  fansly: createVisuals(SiFansly, 'from-purple-500 to-blue-500'),
  cameo: createVisuals(SiCameo, 'from-pink-500 to-sky-500'),
  rumble: createVisuals(SiRumble, 'from-green-500 to-emerald-500'),
  vimeo: createVisuals(SiVimeo, 'from-blue-400 to-blue-500'),
  dailymotion: createVisuals(SiDailymotion, 'from-blue-500 to-yellow-500'),

  // Support & donations
  kofi: createVisuals(SiKofi, 'from-sky-400 to-sky-500'),
  'ko-fi': createVisuals(SiKofi, 'from-sky-400 to-sky-500'),
  patreon: createVisuals(SiPatreon, 'from-orange-500 to-red-500'),
  paypal: createVisuals(SiPaypal, 'from-blue-500 to-blue-600'),
  venmo: createVisuals(SiVenmo, 'from-blue-400 to-blue-500'),
  cashapp: createVisuals(SiCashapp, 'from-green-500 to-green-600'),
  buymeacoffee: createVisuals(SiBuymeacoffee, 'from-amber-400 to-orange-500'),
  gofundme: createVisuals(SiGofundme, 'from-green-500 to-teal-500'),
  kickstarter: createVisuals(SiKickstarter, 'from-emerald-500 to-blue-500'),
  indiegogo: createVisuals(SiIndiegogo, 'from-pink-500 to-purple-500'),

  // Link hubs / scheduling
  calendly: createVisuals(SiCalendly, 'from-blue-500 to-blue-600'),
  linktree: createVisuals(SiLinktree, 'from-green-400 to-green-500'),
  beacons: createVisuals(SiBeacons, 'from-purple-500 to-pink-500'),
  carrd: createVisuals(SiCarrd, 'from-blue-500 to-purple-500'),

  // Commerce
  etsy: createVisuals(SiEtsy, 'from-orange-500 to-red-500'),
  amazon: createVisuals(SiAmazon, 'from-orange-400 to-amber-500'),
  ebay: createVisuals(SiEbay, 'from-blue-500 to-amber-500'),
  shopify: createVisuals(SiShopify, 'from-green-500 to-green-600'),

  // Social / community extras
  tinder: createVisuals(SiTinder, 'from-red-500 to-pink-500'),
  bumble: createVisuals(SiBumble, 'from-yellow-400 to-amber-500'),
  hinge: createVisuals(SiHinge, 'from-slate-500 to-slate-700'),

  // General contact
  email: createVisuals(Mail, 'from-sky-500 to-blue-600'),
  mail: createVisuals(Mail, 'from-sky-500 to-blue-600'),
  contact: createVisuals(Mail, 'from-sky-500 to-blue-600'),
  phone: createVisuals(Phone, 'from-green-500 to-emerald-600'),
  call: createVisuals(Phone, 'from-green-500 to-emerald-600'),
  website: createVisuals(Globe, 'from-purple-500 to-indigo-500'),
  site: createVisuals(Globe, 'from-purple-500 to-indigo-500'),
  portfolio: createVisuals(Globe, 'from-purple-500 to-indigo-500'),
  address: createVisuals(MapPin, 'from-rose-500 to-orange-500'),
  location: createVisuals(MapPin, 'from-rose-500 to-orange-500')
};

const aliasGroups: Array<[string, string[]]> = [
  ['youtube', ['youtu.be', 'music.youtube']],
  ['twitter', ['tweetdeck']],
  ['instagram', ['instagr.am']],
  ['tiktok', ['vm.tiktok']],
  ['discord', ['discord.gg']],
  ['telegram', ['t.me']],
  ['whatsapp', ['wa.me']],
  ['mastodon', ['mstdn']],
  ['bluesky', ['bsky.app']],
  ['playstation', ['ps4', 'ps5']],
  ['nintendo', ['switch']],
  ['steam', ['steampowered']],
  ['soundcloud', ['sndcdn']],
  ['kofi', ['ko-fi', 'buymeacoffee']],
  ['paypal', ['paypal.me']],
  ['venmo', ['venmo.com']],
  ['cashapp', ['cash.app']],
  ['linktree', ['linktr.ee']],
  ['calendly', ['cal.com']],
  ['shopify', ['myshopify']],
  ['amazon', ['amzn']],
  ['gofundme', ['gofund.me']],
  ['indiegogo', ['igg']],
  ['rumble', ['rumble.com']]
];

aliasGroups.forEach(([key, aliases]) => {
  const visuals = PLATFORM_ICON_MAP[key];
  if (!visuals) return;
  aliases.forEach((alias) => {
    const normalizedAlias = alias.replace(/[^a-z0-9]/gi, '').toLowerCase();
    if (!PLATFORM_ICON_MAP[normalizedAlias]) {
      PLATFORM_ICON_MAP[normalizedAlias] = visuals;
    }
  });
});

const PLATFORM_ENTRIES = Object.entries(PLATFORM_ICON_MAP).sort(
  (a, b) => b[0].length - a[0].length
);

const FALLBACK_VISUALS = createVisuals(ExternalLink, 'from-slate-500 to-slate-700');

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const getPlatformVisuals = (name: string, url: string): PlatformVisuals => {
  const normalizedName = normalize(name);
  if (normalizedName && PLATFORM_ICON_MAP[normalizedName]) {
    return PLATFORM_ICON_MAP[normalizedName];
  }

  const normalizedUrl = url.toLowerCase();
  for (const [key, visuals] of PLATFORM_ENTRIES) {
    if (key && normalizedUrl.includes(key)) {
      return visuals;
    }
  }

  return FALLBACK_VISUALS;
};
