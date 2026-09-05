/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // App-wide display face (bold, geometric, tech/SaaS feel) - used for
        // headings across the landing page, admin dashboard, and shop; body
        // copy stays on `sans` (Inter).
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Single app-wide palette (landing, admin, and customer shop all
        // share this now - see docs/design-system notes in each component).
        midnight: '#07111F',
        deepBlue: '#0D1B2A',
        electricBlue: '#3B82F6',
        cyanAccent: '#22D3EE',
        lavender: '#8B5CF6',
        landingOffWhite: '#F8FAFC',
        landingGray: '#94A3B8',
        // Color-agnostic semantic tokens - names don't assert a specific
        // hue, so their values can move with the brand without becoming
        // misleading.
        brandDark: '#07111F',
        brandCard: '#0D1B2A',
        // Renamed (not just repointed) from the old tealPrimary/tealHover/
        // mintAccent/mintHover - those names asserted "teal"/"mint", which
        // would have become a permanent lie once repointed to blue/cyan.
        brandPrimary: '#3B82F6',
        brandPrimaryHover: '#2563EB',
        accentCyan: '#22D3EE',
        accentCyanHover: '#0891B2',
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        canvas: '#F8FAFC',
        ink: {
          DEFAULT: '#1e293b',
          soft: '#64748b',
          faint: '#94a3b8',
        },
        // Semantic stock-status colors - deliberately kept restrained
        // (green/amber/slate), not replaced with the new accent palette.
        stock: {
          in: '#0f9960',
          low: '#b45309',
          out: '#64748b',
        },
      },
      boxShadow: {
        brand: '0 10px 25px -5px rgb(59 130 246 / 0.25)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        float: 'float 6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.5s cubic-bezier(0.2,0.6,0.4,1) infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
      },
    },
  },
  plugins: [],
};
