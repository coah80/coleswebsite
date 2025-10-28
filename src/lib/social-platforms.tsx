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
  Twitch,
  Spotify
} from 'lucide-react';

type IconComponent = FC<{ className?: string }>;

interface PlatformVisuals {
  icon: IconComponent;
  gradient: string;
}

const createVisuals = (icon: IconComponent, gradient: string): PlatformVisuals => ({
  icon,
  gradient
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
      d="M21.54 8.35a5.5 5.5 0 01-3.26-1.08v5.02c0 4.14-3.34 7.5-7.48 7.5-2.6 0-4.91-1.33-6.24-3.36a4.97 4.97 0 005.24 4.51c3.14 0 5.71-2.57 5.71-5.71V9.2c1.03.74 2.29 1.18 3.65 1.18V8.35zM9.96 5.03v9.15a2.24 2.24 0 11-1.68-2.17V9.15c-2.6.27-4.63 2.45-4.63 5.11 0 2.85 2.32 5.17 5.17 5.17 3.14 0 5.7-2.56 5.7-5.7V2.5h-3.22v5.32c-.68-.5-1.35-.79-2.34-.79z"
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
      d="M12 0a12 12 0 00-11.21 7.7l4.2 1.73a3.72 3.72 0 014.67 2.63l3.66 1.5a2.64 2.64 0 012.16-.63 2.67 2.67 0 11-1.52 5.13 2.67 2.67 0 01-1.86-3.14l-3.59-1.47a3.73 3.73 0 01-3.65.59 3.73 3.73 0 01-2.12-4.14L0 8.43A12 12 0 1012 0zm3.82 10.88a1.62 1.62 0 100 3.24 1.62 1.62 0 000-3.24z"
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
      d="M20.32 4.37A19.86 19.86 0 0016.56 3a13.38 13.38 0 00-.67 1.38 18.53 18.53 0 00-5.79 0A13.24 13.24 0 009.43 3a19.71 19.71 0 00-3.76 1.37C2.41 9.05 1.48 13.58 1.82 18.06a19.9 19.9 0 004.63 2.36 15.03 15.03 0 001.23-2.02 12.89 12.89 0 01-1.95-.94l.47-.34c3.76 1.76 7.82 1.76 11.57 0l.47.34c-.6.38-1.27.7-1.96.94.35.7.75 1.38 1.22 2.03a19.88 19.88 0 004.64-2.37c.39-4.8-.63-9.3-3.95-13.69zM9.25 15.57c-1.13 0-2.05-1.04-2.05-2.31s.9-2.31 2.05-2.31c1.17 0 2.07 1.04 2.05 2.31 0 1.27-.9 2.31-2.05 2.31zm5.5 0c-1.13 0-2.05-1.04-2.05-2.31s.9-2.31 2.05-2.31c1.16 0 2.07 1.04 2.05 2.31 0 1.27-.9 2.31-2.05 2.31z"
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
      d="M4.27 3.5H17a3.5 3.5 0 013.5 3.5v1.1c1.57.4 2.75 1.8 2.75 3.5 0 2-1.63 3.64-3.63 3.64H17.5c-.38 2.24-2.34 4-4.75 4H6.87a1.19 1.19 0 01-1.2-1.19V4.69c0-.66.54-1.19 1.2-1.19zM13.45 7a2.43 2.43 0 00-1.96.99 2.43 2.43 0 00-1.96-.99 2.48 2.48 0 00-2.47 2.47c0 2.02 1.76 3.4 4.43 5.97 2.67-2.57 4.43-3.95 4.43-5.97A2.48 2.48 0 0013.45 7zm7.05 2.79V9.5a1.5 1.5 0 00-1.5-1.5h-.75v4.5h.75a1.5 1.5 0 001.5-1.5z"
    />
  </svg>
);

const FALLBACK_VISUALS = createVisuals(ExternalLink, 'from-slate-500 to-slate-700');

const PLATFORM_ENTRIES: Array<{
  matchers: string[];
  visuals: PlatformVisuals;
}> = [
  { matchers: ['instagram', 'instagr'], visuals: createVisuals(Instagram, 'from-pink-500 to-purple-500') },
  { matchers: ['tiktok'], visuals: createVisuals(TikTokIcon, 'from-gray-900 to-rose-500') },
  { matchers: ['reddit'], visuals: createVisuals(MessageCircle, 'from-orange-500 to-red-500') },
  { matchers: ['telegram', 't.me'], visuals: createVisuals(MessageCircle, 'from-sky-400 to-sky-500') },
  { matchers: ['whatsapp', 'wa.me'], visuals: createVisuals(MessageCircle, 'from-green-400 to-green-500') },
  { matchers: ['kofi', 'ko-fi', 'buymeacoffee'], visuals: createVisuals(KoFiIcon, 'from-sky-400 to-sky-500') },
  { matchers: ['patreon'], visuals: createVisuals(Coffee, 'from-orange-500 to-red-500') },
  { matchers: ['paypal'], visuals: createVisuals(DollarSign, 'from-blue-500 to-blue-600') },
  { matchers: ['venmo'], visuals: createVisuals(DollarSign, 'from-sky-500 to-blue-500') },
  { matchers: ['cashapp', 'cash.app'], visuals: createVisuals(DollarSign, 'from-green-500 to-green-600') },
  { matchers: ['linktree'], visuals: createVisuals(Globe, 'from-emerald-500 to-green-500') },
  { matchers: ['portfolio', 'website', 'site'], visuals: createVisuals(Globe, 'from-purple-500 to-indigo-500') },
  { matchers: ['mail', 'email', 'contact'], visuals: createVisuals(Mail, 'from-sky-500 to-blue-500') }
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
