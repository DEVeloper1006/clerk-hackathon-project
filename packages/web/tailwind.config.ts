import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          500: '#0070e0',
          600: '#005ea6',
          700: '#003087',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
