'use client';

import { useEffect } from 'react';

export default function ThemeInit() {
  useEffect(() => {
    // Determine the theme
    const theme = localStorage.getItem('theme') || 'dark';
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return null;
}
