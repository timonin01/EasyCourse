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
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        display: ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        title: ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em', fontWeight: '700' }],
        'workspace-title': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.015em', fontWeight: '700' }],
        heading: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        body: ['1rem', { lineHeight: '1.5rem' }],
        caption: ['0.875rem', { lineHeight: '1.25rem' }],
        label: ['0.75rem', { lineHeight: '1rem', fontWeight: '500' }],
      },
      borderRadius: {
        brand: '0.75rem',
        'brand-lg': '1rem',
        'brand-xl': '1.25rem',
      },
      boxShadow: {
        brand: '0 10px 25px -5px rgba(34, 197, 94, 0.25)',
        'brand-sm': '0 4px 14px -4px rgba(34, 197, 94, 0.2)',
        surface: '0 1px 0 rgba(148, 163, 184, 0.08) inset',
      },
      backgroundImage: {
        'page-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        'brand-gradient': 'linear-gradient(135deg, #16a34a 0%, #4ade80 50%, #86efac 100%)',
        'brand-gradient-subtle': 'linear-gradient(135deg, rgba(22, 163, 74, 0.15) 0%, rgba(74, 222, 128, 0.05) 100%)',
      },
    },
  },
  plugins: [],
}
