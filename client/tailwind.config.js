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
        canvas: '#f6f8f8',
        ink: {
          DEFAULT: '#1e2a28',
          soft: '#55655f',
          faint: '#8b9a95',
        },
        stock: {
          in: '#0f9960',
          low: '#b45309',
          out: '#64748b',
        },
      },
      boxShadow: {
        brand: '0 10px 25px -5px rgb(52 101 96 / 0.25)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};
