---
name: easycourse-design
description: Visual design rules for EasyCourse frontend. Use when styling UI, creating components, redesigning pages, or choosing colors, typography, and layout.
---

# EasyCourse Design System

## Product context

B2B authoring tool for Stepik course creators. The UI should feel like a **workspace** (Linear, Notion), not an AI product landing page.

## Anti-patterns (never use)

- Glass morphism (`backdrop-blur`, translucent panels)
- Gradient text on headings or logos
- Pulse/glow animations on logos or cards
- Green + purple as the primary brand combo
- Icon-in-colored-box for every list row
- Stagger/fade-in on every page load
- Emoji in UI copy
- `hover:-translate-y-*` lift on cards
- Gradient buttons with colored drop shadows
- Inter as the primary font

## Do use

- **Surfaces**: flat `bg-dark-850` or `bg-dark-900` + `border border-dark-700/60`
- **Primary green** (`primary-500/600`) only on: primary CTA, active nav, success/sync states
- **Purple** only inside `/ai-generator` and AI-specific UI
- **Typography**: IBM Plex Sans; hierarchy via size/weight, not color boxes
- **Spacing**: 4px grid; workspace layouts denser than marketing pages
- **Radius**: `rounded-lg` (8px) default; `rounded-xl` for cards max
- **Motion**: transitions on hover/focus only; no page-enter stagger unless explicitly requested

## Tokens

Source of truth: `frontend/src/styles/tokens.ts` and `frontend/src/index.css` CSS variables.

## Component patterns

- **Sidebar**: flat surface, compact nav (`py-2`), active = `bg-dark-800 text-dark-100`
- **Cards**: `.surface` class, subtle hover = border brighten only
- **Buttons**: flat `bg-primary-600`, no gradient
- **Stat blocks**: number + label, optional thin left accent — no icon-in-box template
- **Page headers**: `text-title` / `text-workspace-title`, no gradient names

## References

Linear (density, restraint), Notion (content hierarchy), Stepik (ed-tech calm).
