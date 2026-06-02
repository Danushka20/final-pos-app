/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          400: '#A3A3A3',
          600: '#525252',
          900: '#0A0A0A',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#FAFAFA',
          card: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['System', 'Roboto', 'sans-serif'],
        medium: ['System', 'Roboto', 'sans-serif-medium'],
        semibold: ['System', 'Roboto', 'sans-serif-medium'],
        bold: ['System', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
