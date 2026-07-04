/**
 * Taskflow Multi-Theme System
 * ===========================
 * Centralized theme registry. Each theme is identified by an `id` that maps
 * 1:1 with a CSS selector `[data-theme="<id>"]` in globals.css.
 *
 * HOW TO ADD A NEW THEME
 * ----------------------
 * 1. Add an entry to the THEMES array below.
 * 2. Add a `[data-theme="your-id"] { ... }` block in globals.css defining
 *    the full set of CSS custom property tokens listed in the Token Reference.
 * That's it — no other files need to change.
 *
 * TOKEN REFERENCE (all required vars per theme)
 * -----------------------------------------------
 * --bg-base          Root page background
 * --bg-subtle        Slightly elevated background (e.g., section backgrounds)
 * --surface          Card / panel background
 * --surface-elevated Elevated card (e.g., dropdowns, popovers)
 * --border           Default border color
 * --border-subtle    Softer / lighter border
 * --text-primary     Primary body text
 * --text-secondary   Secondary / dimmed text
 * --text-muted       Placeholder / caption text
 * --primary          Brand primary action color
 * --primary-fg       Foreground on primary bg (button label)
 * --secondary        Secondary action color
 * --accent           Highlight / decoration color
 * --hover-bg         Generic hover background
 * --active-bg        Pressed / active state background
 * --focus-ring       Focus outline color
 * --disabled-bg      Disabled element background
 * --disabled-text    Disabled element text
 * --success          Success semantic color
 * --warning          Warning semantic color
 * --error            Error / danger semantic color
 * --info             Informational semantic color
 * --shadow-sm        Small shadow
 * --shadow-md        Medium shadow
 * --shadow-lg        Large shadow
 * --overlay          Modal / drawer backdrop
 * --scrollbar-thumb  Scrollbar thumb color
 * --selection-bg     Text selection background
 * --selection-text   Text selection foreground
 * --glass-bg         Glass morphism background
 * --glass-border     Glass morphism border
 * --chart-1..6       Data visualization palette
 */

export interface ThemeDefinition {
  id: string;
  name: string;
  emoji: string;
  /** 3 representative swatch colors shown in the picker */
  swatches: [string, string, string];
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'light',
    name: 'Light',
    emoji: '🌞',
    swatches: ['#ffffff', '#6d28d9', '#14b8a6'],
  },
  {
    id: 'dark',
    name: 'Dark',
    emoji: '🌙',
    swatches: ['#09090b', '#a78bfa', '#2dd4bf'],
  },
  {
    id: 'liquid-glass',
    name: 'Liquid Glass',
    emoji: '💎',
    swatches: ['#e8eaf6', '#818cf8', '#c084fc'],
  },
  {
    id: 'galaxy',
    name: 'Galaxy',
    emoji: '🌌',
    swatches: ['#08061a', '#7c3aed', '#6366f1'],
  },
  {
    id: 'jungle',
    name: 'Jungle',
    emoji: '🌿',
    swatches: ['#0a1a0a', '#16a34a', '#4ade80'],
  },
  {
    id: 'beach',
    name: 'Beach',
    emoji: '🏖️',
    swatches: ['#fdf6e3', '#0891b2', '#f97316'],
  },
  {
    id: 'wild-west',
    name: 'Wild West',
    emoji: '🤠',
    swatches: ['#1a100a', '#d97706', '#92400e'],
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    emoji: '⚡',
    swatches: ['#020008', '#06b6d4', '#d946ef'],
  },
  {
    id: 'retro',
    name: 'Retro',
    emoji: '📼',
    swatches: ['#2a1f14', '#d97706', '#0d9488'],
  },
];

/** Theme IDs that are considered "light" (for system preference matching) */
const LIGHT_THEMES = new Set(['light', 'liquid-glass', 'beach']);

export const DEFAULT_THEME = 'dark';

/**
 * Resolves the initial theme to apply on first visit.
 * Order of precedence:
 *  1. localStorage value (user's explicit choice)
 *  2. System preference — maps prefers-color-scheme to 'light' or 'dark'
 *  3. DEFAULT_THEME fallback
 */
export function getInitialTheme(): string {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem('theme');
    if (stored && THEMES.some((t) => t.id === stored)) return stored;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  } catch {
    return DEFAULT_THEME;
  }
}

/**
 * Applies a theme by setting `data-theme` on <html> and persisting to localStorage.
 * Safe to call at any time — changes are instant via CSS variable cascade.
 */
export function applyTheme(themeId: string): void {
  if (!THEMES.some((t) => t.id === themeId)) {
    console.warn(`[Taskflow Themes] Unknown theme "${themeId}", falling back to "${DEFAULT_THEME}"`);
    themeId = DEFAULT_THEME;
  }
  document.documentElement.setAttribute('data-theme', themeId);
  try {
    localStorage.setItem('theme', themeId);
  } catch {
    // localStorage may be unavailable in certain browser modes
  }
}

/**
 * Returns the ThemeDefinition for a given ID, or the dark theme as fallback.
 */
export function getTheme(id: string): ThemeDefinition {
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME)!;
}

/**
 * Returns true if the given theme ID is a "light" theme (non-dark background).
 * Useful for adapting icons or overlays that need to know overall luminance.
 */
export function isLightTheme(id: string): boolean {
  return LIGHT_THEMES.has(id);
}
