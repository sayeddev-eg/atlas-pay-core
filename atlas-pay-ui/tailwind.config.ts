import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          bg: '#090D16',
          card: '#0F1523',
          border: '#1E293B',
          accent: '#3B82F6',
          success: '#10B981',
          danger: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans Arabic', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
