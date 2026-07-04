# Taskflow Theme System — Developer Guide

## Architecture Overview

Taskflow uses a **CSS custom properties (CSS variables)** approach to theming. A single `data-theme` attribute on `<html>` controls every component's appearance through a cascade of CSS variable overrides.

```
localStorage("theme") → data-theme="galaxy" on <html>
                              ↓
[data-theme="galaxy"] { --bg-base: #04020e; --primary: #818cf8; ... }
                              ↓
Components read: background: var(--bg-base); color: var(--primary);
```

**No JavaScript color values live in components.** All colors flow through the CSS token system.

---

## Available Themes

| ID | Name | Emoji | Style |
|---|---|---|---|
| `light` | Light | 🌞 | Clean bright neutrals, subtle shadows |
| `dark` | Dark | 🌙 | Elegant dark gray/black, balanced contrast |
| `liquid-glass` | Liquid Glass | 💎 | Frosted glass, translucent, blur effects |
| `galaxy` | Galaxy | 🌌 | Deep space, navy/indigo/violet, stars |
| `jungle` | Jungle | 🌿 | Rich greens, earthy browns, foliage |
| `beach` | Beach | 🏖️ | Sand, turquoise, coral, sunlight |
| `wild-west` | Wild West | 🤠 | Leather, desert beige, burnt orange, antique gold |
| `cyberpunk` | Cyberpunk | ⚡ | Neon cyan, magenta, dark futurism |
| `retro` | Retro | 📼 | Vintage mustard, teal, burnt orange, 70s/80s |

---

## How to Add a New Theme

Adding a new theme requires changes to **exactly 2 files**:

### 1. `src/app/globals.css`

Add a new `[data-theme="your-id"]` block with the full token set:

```css
/* ============================================================
   🎨 MY NEW THEME
   One-line description of the aesthetic direction.
   ============================================================ */
[data-theme="my-new-theme"] {
  /* ── Backgrounds ── */
  --bg-base:          #...;   /* Root page background */
  --bg-subtle:        #...;   /* Slightly elevated bg */
  --surface:          #...;   /* Card / panel background */
  --surface-elevated: #...;   /* Dropdowns, popovers */

  /* ── Borders ── */
  --border:           #...;   /* Default border */
  --border-subtle:    #...;   /* Soft / light border */

  /* ── Text ── */
  --text-primary:     #...;   /* Main body text */
  --text-secondary:   #...;   /* Dimmed / secondary text */
  --text-muted:       #...;   /* Placeholders, captions */

  /* ── Brand Actions ── */
  --primary:          #...;   /* Primary action / links */
  --primary-fg:       #...;   /* Text on primary bg */
  --secondary:        #...;   /* Secondary actions */
  --accent:           #...;   /* Highlights, decorations */

  /* ── Interactive States ── */
  --hover-bg:         #...;   /* Hover background */
  --active-bg:        #...;   /* Pressed / active state */
  --focus-ring:       #...;   /* Focus outline color */
  --disabled-bg:      #...;   /* Disabled elements bg */
  --disabled-text:    #...;   /* Disabled elements text */

  /* ── Semantic Colors ── */
  --success:          #...;
  --warning:          #...;
  --error:            #...;
  --info:             #...;

  /* ── Shadows ── */
  --shadow-sm:        ...;    /* box-shadow value */
  --shadow-md:        ...;
  --shadow-lg:        ...;

  /* ── Overlays & Effects ── */
  --overlay:          rgba(...);  /* Modal backdrop */
  --scrollbar-thumb:  rgba(...);  /* Scrollbar color */
  --selection-bg:     #...;       /* Text selection bg */
  --selection-text:   #...;       /* Text selection fg */
  --glass-bg:         rgba(...);  /* .glass background */
  --glass-border:     rgba(...);  /* .glass border */

  /* ── Chart Colors (data visualization) ── */
  --chart-1: #...;
  --chart-2: #...;
  --chart-3: #...;
  --chart-4: #...;
  --chart-5: #...;
  --chart-6: #...;
}
```

### 2. `src/lib/themes.ts`

Add an entry to the `THEMES` array:

```typescript
{
  id: 'my-new-theme',        // must match CSS selector
  name: 'My New Theme',      // displayed in the picker
  emoji: '🎨',               // shown next to name
  swatches: ['#hex1', '#hex2', '#hex3'],  // 3 preview colors
},
```

**That's it.** The theme selector, persistence logic, and flash prevention script all work automatically.

---

## Applying a Theme Programmatically

```typescript
import { applyTheme } from '@/lib/themes';

// Switch to any theme by ID
applyTheme('galaxy');

// Reads localStorage first, falls back to system preference
import { getInitialTheme } from '@/lib/themes';
const theme = getInitialTheme();
```

---

## Token Reference

| Token | Purpose |
|---|---|
| `--bg-base` | Root page / body background |
| `--bg-subtle` | Section backgrounds, slightly elevated |
| `--surface` | Card and panel backgrounds |
| `--surface-elevated` | Dropdowns, popovers, input backgrounds |
| `--border` | Default border color |
| `--border-subtle` | Softer, lighter borders |
| `--text-primary` | Primary readable text |
| `--text-secondary` | Labels, descriptions, secondary content |
| `--text-muted` | Timestamps, placeholders, captions |
| `--primary` | Main brand/action color |
| `--primary-fg` | Text color on primary-colored backgrounds |
| `--secondary` | Secondary action color (e.g., teal) |
| `--accent` | Highlight / decoration color |
| `--hover-bg` | Background shown on element hover |
| `--active-bg` | Background when element is pressed |
| `--focus-ring` | Focus outline / ring color |
| `--disabled-bg` | Background of disabled elements |
| `--disabled-text` | Text color of disabled elements |
| `--success` | Positive / success semantic |
| `--warning` | Warning semantic |
| `--error` | Error / danger semantic |
| `--info` | Informational semantic |
| `--shadow-sm/md/lg` | Box shadow values |
| `--overlay` | Modal/drawer backdrop color |
| `--scrollbar-thumb` | Custom scrollbar thumb |
| `--selection-bg/text` | Browser text selection colors |
| `--glass-bg` | `.glass` class background |
| `--glass-border` | `.glass` class border |
| `--chart-1..6` | Data visualization palette entries |

---

## Architecture Files

| File | Role |
|---|---|
| `src/lib/themes.ts` | Theme registry, `applyTheme()`, `getInitialTheme()` |
| `src/app/globals.css` | All CSS variable token blocks per theme |
| `src/app/layout.tsx` | Inline flash-prevention script |
| `src/components/ThemeInit.tsx` | Client hydration theme application |
| `src/app/dashboard/page.tsx` | Theme selector UI + `handleThemeSelect()` |

---

## Design Principles

1. **Single source of truth**: Every color in the app flows from a CSS variable — no inline hex values in components.
2. **Zero-JS switching**: Theme changes happen entirely via CSS variable cascade. JavaScript only sets the `data-theme` attribute.
3. **Smooth transitions**: A `transition` rule in `globals.css` ensures all background/border/color changes animate at 300ms.
4. **Flash-free**: The inline script in `layout.tsx` runs before first paint — no flicker ever.
5. **Progressive enhancement**: If CSS variables aren't supported (very old browsers), the `:root` defaults (dark theme) still render correctly.
6. **Brand color independence**: The four brand colors (`--color-brand-purple/coral/teal/amber`) in `@theme` are preserved across ALL themes for visual consistency of key UI elements.
