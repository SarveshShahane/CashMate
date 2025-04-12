/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'neon-purple': '#b026ff',
        'dark': {
          DEFAULT: '#121212',
          'lighter': '#1e1e1e',
          'card': '#252525'
        }
      },
      boxShadow: {
        'neon': '0 0 5px theme(colors.neon-purple), 0 0 20px theme(colors.neon-purple)',
      },
    },
  },
  plugins: [],
};