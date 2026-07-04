'use client';

import { useEffect } from 'react';
import { getInitialTheme, applyTheme } from '@/lib/themes';

/**
 * ThemeInit — runs client-side on mount to ensure the correct theme
 * attribute is set after hydration (in case the inline script in layout.tsx
 * ran before localStorage was populated on first paint).
 *
 * The inline flash-prevention script in layout.tsx handles the initial
 * render; this component handles subsequent client-side hydration correctness.
 */
export default function ThemeInit() {
  useEffect(() => {
    const theme = getInitialTheme();
    applyTheme(theme);
  }, []);

  return null;
}
