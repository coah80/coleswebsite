/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f3f1ff',
          100: '#ebe5ff',
          200: '#d9ceff',
          300: '#bea6ff',
          400: '#9f75ff',
          500: '#843dff',
          600: '#7916ff',
          700: '#6b04fd',
          800: '#5a03d4',
          900: '#4c05ad',
          950: '#2e0276',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-left': 'slide-left 60s linear infinite',
        'slide-right': 'slide-right 60s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(132, 61, 255, 0.4)' },
          '100%': { boxShadow: '0 0 30px rgba(132, 61, 255, 0.8)' },
        },
        'slide-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'slide-right': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0)' },
        },
      }
      },
      borderColor: {
        border: '#334155',
    },
  },
  plugins: [],
}