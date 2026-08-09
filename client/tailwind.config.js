/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brandDark: '#1c3734',
        brandCard: '#244743',
        tealPrimary: '#346560',
        tealHover: '#2a534f',
        mintAccent: '#4ecdc4',
        mintHover: '#3dbbb3',
        primary: {
          50: '#f0f7f6',
          100: '#d5e9e7',
          200: '#add4d0',
          300: '#7cb7b1',
          400: '#519790',
          500: '#387c75',
          600: '#2b625d',
          700: '#234f4b',
          800: '#1e403d',
          900: '#1c3734',
        },
      },
    },
  },
  plugins: [],
};
