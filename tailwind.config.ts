import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          dim: '#EEF0FD',
        },
        accent: {
          coral: '#F472B6',
          mint: '#10B981',
          amber: '#F59E0B',
        },
        text: {
          hi: '#1E1B2E',
          mid: '#6B7280',
          low: '#A0A3B1',
        },
        bg: {
          app: '#F5F6FB',
          surface: '#FFFFFF',
        },
        surface: '#FFFFFF',
        border: {
          soft: '#EAEBF3',
        },
      },
  fontFamily: {
    display: ['"Space Grotesk"', 'sans-serif'],
    body: ['Inter', 'sans-serif'],
    mono: ['"JetBrains Mono"', 'monospace'],
  },
  animation: {
    'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
  },
  keyframes: {
    'pulse-dot': {
      '0%, 100%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.15)' },
    },
  },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config