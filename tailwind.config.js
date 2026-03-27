/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#f4f5f7',
        ink: '#0b1016',
        steel: '#5f6874',
        line: '#d8dde4',
        chrome: '#bec6d0',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
      },
      boxShadow: {
        cinema:
          '0 42px 86px -44px rgba(5, 10, 20, 0.65), 0 22px 48px -36px rgba(16, 24, 38, 0.55)',
      },
    },
  },
  plugins: [],
}
