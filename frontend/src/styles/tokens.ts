/** Semantic design tokens for JS-driven UI (toasts, charts, etc.) */
export const tokens = {
  colors: {
    primary: '#22c55e',
    primaryMuted: '#16a34a',
    surface: '#0f172a',
    surfaceRaised: '#1e293b',
    surfaceOverlay: 'rgba(30, 41, 59, 0.7)',
    border: 'rgba(148, 163, 184, 0.12)',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    accentAi: '#a855f7',
  },
  radius: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.25rem',
  },
  shadow: {
    brand: '0 10px 25px -5px rgba(34, 197, 94, 0.25)',
    brandSm: '0 4px 14px -4px rgba(34, 197, 94, 0.2)',
  },
  font: {
    sans: "'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
} as const;
