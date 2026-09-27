/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0C0F1A',
        surface: '#141828',
        'surface-elevated': '#1C2035',
        'surface-hover': '#252A40',
        primary: '#E2B340',
        'primary-light': '#F0D060',
        'primary-dark': '#C9982E',
        secondary: '#8B8CF8',
        accent: '#8B8CF8',
        textPrimary: '#F5F5F0',
        textSecondary: '#94A3B8',
        textMuted: '#6B7280',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#F87171',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
