import type { FC } from 'react';
import {
  ExternalLink,
  Globe,
  Instagram,
  Linkedin,
  Facebook,
  Youtube,
  Twitter,
  Github,
  Music,
  MessageCircle,
  Mail,
  Gamepad2,
  Coffee,
  DollarSign,
  Twitch
} from 'lucide-react';

type IconComponent = FC<{ className?: string }>;

interface PlatformVisuals {
  icon: IconComponent;
  gradient: string;
  hoverBg: string; // Subtle background tint on hover
}

const createVisuals = (icon: IconComponent, gradient: string, hoverBg: string): PlatformVisuals => ({
  icon,
  gradient,
  hoverBg
});

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const TikTokIcon: IconComponent = ({ className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    className={className}
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
    />
  </svg>
);

const SteamIcon: IconComponent = ({ className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    className={className}
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"
    />
  </svg>
);

const DiscordIcon: IconComponent = ({ className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    className={className}
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"
    />
  </svg>
);

const KoFiIcon: IconComponent = ({ className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    className={className}
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M11.351 2.715c-2.7 0-4.986.025-6.83.26C2.078 3.285 0 5.154 0 8.61c0 3.506.182 6.13 1.585 8.493 1.584 2.701 4.233 4.182 7.662 4.182h.83c4.209 0 6.494-2.234 7.637-4a9.5 9.5 0 0 0 1.091-2.338C21.792 14.688 24 12.22 24 9.208v-.415c0-3.247-2.13-5.507-5.792-5.87-1.558-.156-2.65-.208-6.857-.208m0 1.947c4.208 0 5.09.052 6.571.182 2.624.311 4.13 1.584 4.13 4v.39c0 2.156-1.792 3.844-3.87 3.844h-.935l-.156.649c-.208 1.013-.597 1.818-1.039 2.546-.909 1.428-2.545 3.064-5.922 3.064h-.805c-2.571 0-4.831-.883-6.078-3.195-1.09-2-1.298-4.155-1.298-7.506 0-2.181.857-3.402 3.012-3.714 1.533-.233 3.559-.26 6.39-.26m6.547 2.287c-.416 0-.65.234-.65.546v2.935c0 .311.234.545.65.545 1.324 0 2.051-.754 2.051-2s-.727-2.026-2.052-2.026m-10.39.182c-1.818 0-3.013 1.48-3.013 3.142 0 1.533.858 2.857 1.949 3.897.727.701 1.87 1.429 2.649 1.896a1.47 1.47 0 0 0 1.507 0c.78-.467 1.922-1.195 2.623-1.896 1.117-1.039 1.974-2.364 1.974-3.897 0-1.662-1.247-3.142-3.039-3.142-1.065 0-1.792.545-2.338 1.298-.493-.753-1.246-1.298-2.312-1.298"
    />
  </svg>
);

const FALLBACK_VISUALS = createVisuals(ExternalLink, 'from-slate-500 to-slate-700', 'hover:bg-slate-500/10');

const PLATFORM_ENTRIES: Array<{
  matchers: string[];
  visuals: PlatformVisuals;
}> = [
  // Major socials
  { matchers: ['youtube', 'youtu.be'], visuals: createVisuals(Youtube, 'from-red-600 to-red-500', 'hover:bg-red-500/10') },
  { matchers: ['twitter', 'x.com'], visuals: createVisuals(Twitter, 'from-sky-400 to-sky-500', 'hover:bg-sky-400/10') },
  { matchers: ['facebook', 'fb.com'], visuals: createVisuals(Facebook, 'from-blue-600 to-blue-700', 'hover:bg-blue-600/10') },
  { matchers: ['linkedin'], visuals: createVisuals(Linkedin, 'from-blue-600 to-indigo-600', 'hover:bg-blue-600/10') },
  { matchers: ['github'], visuals: createVisuals(Github, 'from-slate-600 to-slate-800', 'hover:bg-slate-500/10') },
  { matchers: ['spotify', 'open.spotify'], visuals: createVisuals(Music, 'from-green-500 to-green-600', 'hover:bg-green-500/10') },
  { matchers: ['twitch'], visuals: createVisuals(Twitch, 'from-purple-500 to-indigo-500', 'hover:bg-purple-500/10') },
  { matchers: ['discord', 'discord.gg'], visuals: createVisuals(DiscordIcon, 'from-indigo-500 to-violet-500', 'hover:bg-indigo-500/10') },
  { matchers: ['steam'], visuals: createVisuals(SteamIcon, 'from-slate-600 to-slate-700', 'hover:bg-slate-500/10') },
  { matchers: ['soundcloud'], visuals: createVisuals(Music, 'from-orange-500 to-yellow-500', 'hover:bg-orange-500/10') },
  { matchers: ['bandcamp'], visuals: createVisuals(Music, 'from-teal-500 to-cyan-500', 'hover:bg-teal-500/10') },
  { matchers: ['applemusic', 'music.apple.com'], visuals: createVisuals(Music, 'from-pink-500 to-red-500', 'hover:bg-pink-500/10') },
  { matchers: ['instagram', 'instagr'], visuals: createVisuals(Instagram, 'from-pink-500 to-purple-500', 'hover:bg-pink-500/10') },
  { matchers: ['tiktok'], visuals: createVisuals(TikTokIcon, 'from-gray-900 to-rose-500', 'hover:bg-rose-500/10') },
  // Reddit icon is not available in some lucide-react versions; use chat bubble
  { matchers: ['reddit'], visuals: createVisuals(MessageCircle, 'from-orange-500 to-red-500', 'hover:bg-orange-500/10') },
  { matchers: ['telegram', 't.me'], visuals: createVisuals(MessageCircle, 'from-sky-400 to-sky-500', 'hover:bg-sky-400/10') },
  { matchers: ['whatsapp', 'wa.me'], visuals: createVisuals(MessageCircle, 'from-green-400 to-green-500', 'hover:bg-green-400/10') },
  { matchers: ['kofi', 'ko-fi', 'buymeacoffee'], visuals: createVisuals(KoFiIcon, 'from-sky-400 to-sky-500', 'hover:bg-sky-400/10') },
  { matchers: ['patreon'], visuals: createVisuals(Coffee, 'from-orange-500 to-red-500', 'hover:bg-orange-500/10') },
  { matchers: ['paypal'], visuals: createVisuals(DollarSign, 'from-blue-500 to-blue-600', 'hover:bg-blue-500/10') },
  { matchers: ['venmo'], visuals: createVisuals(DollarSign, 'from-sky-500 to-blue-500', 'hover:bg-sky-500/10') },
  { matchers: ['cashapp', 'cash.app'], visuals: createVisuals(DollarSign, 'from-green-500 to-green-600', 'hover:bg-green-500/10') },
  { matchers: ['linktree'], visuals: createVisuals(Globe, 'from-emerald-500 to-green-500', 'hover:bg-emerald-500/10') },
  { matchers: ['portfolio', 'website', 'site'], visuals: createVisuals(Globe, 'from-purple-500 to-indigo-500', 'hover:bg-purple-500/10') },
  { matchers: ['mail', 'email', 'contact'], visuals: createVisuals(Mail, 'from-sky-500 to-blue-500', 'hover:bg-sky-500/10') }
];

export const getPlatformVisuals = (name: string, url: string): PlatformVisuals => {
  const normalizedName = normalize(name ?? '');
  const normalizedUrl = url?.toLowerCase() ?? '';

  for (const entry of PLATFORM_ENTRIES) {
    if (
      entry.matchers.some(
        (matcher) =>
          normalizedName.includes(normalize(matcher)) || normalizedUrl.includes(matcher.toLowerCase())
      )
    ) {
      return entry.visuals;
    }
  }

  return FALLBACK_VISUALS;
};
