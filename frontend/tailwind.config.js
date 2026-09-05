/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        surface: '#FFFFFF',
        'surface-subtle': '#F1F5F9',
        border: '#E2E8F0',
        'border-focus': '#6366F1',
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          DEFAULT: '#4F46E5',
        },
        cyber: {
          cyan: '#06B6D4',
          blue: '#0284C7',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
          purple: '#8B5CF6',
        },
        text: {
          main: '#0F172A',
          muted: '#64748B',
          subtle: '#94A3B8',
          inverse: '#FFFFFF',
        },
        /* Dark theme surface colors — for use in components */
        dark: {
          base: '#06080D',
          surface: '#0C1017',
          elevated: '#111827',
          overlay: '#1A2332',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        'glass': '0 4px 24px -4px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(148, 163, 184, 0.05)',
        'glass-hover': '0 12px 40px -8px rgba(99, 102, 241, 0.15), 0 4px 16px -4px rgba(0, 0, 0, 0.3)',
        'glow-indigo': '0 0 20px rgba(99, 102, 241, 0.25)',
        'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.25)',
        'glow-emerald': '0 0 20px rgba(52, 211, 153, 0.25)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'border-glow': 'border-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 4px rgba(99, 102, 241, 0.3)' },
          '50%': { boxShadow: '0 0 12px rgba(99, 102, 241, 0.5)' },
        },
        'border-glow': {
          '0%, 100%': { borderColor: 'rgba(99, 102, 241, 0.15)' },
          '50%': { borderColor: 'rgba(99, 102, 241, 0.35)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '20px',
      },
    },
  },
  plugins: [],
};
