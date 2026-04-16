/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#080a0d',
        surface: '#12151a',
        elevated: '#1a1f27',
        accent: {
          DEFAULT: '#38bdf8',
          dim: 'rgba(56,189,248,0.15)',
          glow: 'rgba(56,189,248,0.4)',
        },
        danger: '#fb7185',
        vault: {
          fg: '#f4f6f8',
          muted: '#9aa3af',
          subtle: '#6b7280',
        },
        brand: {
          DEFAULT: '#38bdf8',
          dark: '#0ea5e9',
          muted: 'rgba(56,189,248,0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        vault: '0 8px 32px rgba(0,0,0,0.45)',
        knob: '0 0 0 1px rgba(56,189,248,0.5), 0 4px 24px rgba(56,189,248,0.25)',
      },
    },
  },
  plugins: [],
};
