import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#6c5ce7', light: '#a29bfe', dark: '#4834d4' },
        accent: { DEFAULT: '#00cec9', light: '#55efc4' },
        success: '#00b894',
        warning: '#fdcb6e',
        danger: { DEFAULT: '#e17055', light: '#fab1a0' },
        surface: { DEFAULT: '#16161f', hover: '#1e1e2a', elevated: '#1c1c28' },
        background: '#0a0a0f',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
export default config
