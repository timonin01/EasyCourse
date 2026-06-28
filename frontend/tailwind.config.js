/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          850: '#172033',
          900: '#0f172a',
          950: '#020617',
        },
        brand: {
          ai: '#a855f7',
          'ai-muted': '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        display: ['2rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em', fontWeight: '600' }],
        title: ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em', fontWeight: '600' }],
        'workspace-title': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.015em', fontWeight: '600' }],
        heading: ['1.125rem', { lineHeight: '1.625rem', fontWeight: '600' }],
        body: ['0.9375rem', { lineHeight: '1.5rem' }],
        caption: ['0.8125rem', { lineHeight: '1.25rem' }],
        label: ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
      },
      borderRadius: {
        brand: '0.5rem',
        'brand-lg': '0.625rem',
        'brand-xl': '0.75rem',
      },
      boxShadow: {
        brand: '0 1px 2px rgba(0, 0, 0, 0.2)',
        'brand-sm': '0 1px 1px rgba(0, 0, 0, 0.15)',
        surface: 'none',
      },
      backgroundImage: {
        'page-gradient': 'none',
        'brand-gradient': 'none',
        'brand-gradient-subtle': 'none',
      },
    },
  },
  plugins: [],
}
