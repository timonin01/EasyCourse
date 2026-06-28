/** Semantic design tokens for JS-driven UI (toasts, charts, etc.) */
export const tokens = {
  colors: {
    primary: '#22c55e',
    primaryMuted: '#16a34a',
    surface: '#0f172a',
    surfaceRaised: '#172033',
    surfaceOverlay: '#172033',
    border: 'rgba(148, 163, 184, 0.14)',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    accentAi: '#a855f7',
  },
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.625rem',
    xl: '0.75rem',
  },
  shadow: {
    brand: '0 1px 2px rgba(0, 0, 0, 0.2)',
    brandSm: '0 1px 1px rgba(0, 0, 0, 0.15)',
  },
  font: {
    sans: '"IBM Plex Sans", system-ui, sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, monospace',
  },
} as const;
