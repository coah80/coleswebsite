import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ["'MintSans'", "system-ui", "sans-serif"],
				heading: ["'Montserrat Variable'", "system-ui", "sans-serif"],
				body: ["'MintSans'", "system-ui", "sans-serif"],
				data: ["'MN Varia'", "system-ui", "sans-serif"],
				varia: ["'MN Varia'", "system-ui", "sans-serif"],
				code: ["'MN Varia'", "system-ui", "sans-serif"],
				dancing: ['Dancing Script', 'cursive'],
				pacifico: ['Pacifico', 'cursive'],
				'great-vibes': ['Great Vibes', 'cursive'],
				caveat: ['Caveat', 'cursive'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				// Catppuccin Mocha direct colors
				ctp: {
					crust: '#11111b',
					mantle: '#181825',
					base: '#1e1e2e',
					surface0: '#313244',
					surface1: '#45475a',
					surface2: '#585b70',
					text: '#cdd6f4',
					subtext1: '#bac2de',
					subtext0: '#a6adc8',
					overlay2: '#9399b2',
					overlay1: '#7f849c',
					overlay0: '#6c7086',
					mauve: '#cba6f7',
					green: '#a6e3a1',
					red: '#f38ba8',
					blue: '#89b4fa',
					peach: '#fab387',
					yellow: '#f9e2af',
					teal: '#94e2d5',
					sky: '#89dceb',
					pink: '#f5c2e7',
					lavender: '#b4befe',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			},
			screens: {
				'portrait': { 'raw': '(orientation: portrait)' },
				'landscape': { 'raw': '(orientation: landscape)' },
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
