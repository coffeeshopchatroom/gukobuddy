'use client';

import * as React from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const PRESET_THEMES = {
  'classic': { primary: '#A7C4A0', bg: '#FFFFFF', accent: '#FFF0F0', foreground: '#1a1c19' },
  'midnight': { primary: '#3B82F6', bg: '#0F172A', accent: '#1E293B', foreground: '#F8FAFC' },
  'sunset': { primary: '#F97316', bg: '#FFF7ED', accent: '#FFEDD5', foreground: '#431407' },
  'matcha': { primary: '#4D7C0F', bg: '#F7FEE7', accent: '#ECFCCB', foreground: '#14532D' },
  'lavender': { primary: '#8B5CF6', bg: '#F5F3FF', accent: '#EDE9FE', foreground: '#2E1065' },
};

/**
 * A hidden component that applies theme settings (colors, fonts, backgrounds) 
 * globally by injecting CSS variables and styles into the document.
 */
export function ThemeApplier() {
  const { user } = useUser();
  const db = useFirestore();
  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid, 'profile', 'settings') : null, [user, db]);
  const { data: profile } = useDoc(profileRef);

  React.useEffect(() => {
    if (!profile?.theme) return;

    const theme = profile.theme;
    const root = document.documentElement;

    // Helper to convert Hex to HSL for Tailwind compatibility (Space-separated H S L)
    const hexToHsl = (hex: string) => {
      let r = 0, g = 0, b = 0;
      if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
      } else if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
      }
      r /= 255; g /= 255; b /= 255;
      let max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s, l = (max + min) / 2;
      if (max === min) { h = s = 0; } 
      else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    // 1. Determine Colors (Custom vs Preset)
    let colors = theme.customColors;
    if (theme.activeTheme !== 'custom' && PRESET_THEMES[theme.activeTheme as keyof typeof PRESET_THEMES]) {
      colors = PRESET_THEMES[theme.activeTheme as keyof typeof PRESET_THEMES];
    }

    // 2. Apply Colors
    if (colors) {
      if (colors.primary) root.style.setProperty('--primary', hexToHsl(colors.primary));
      if (colors.background) {
        root.style.setProperty('--background', hexToHsl(colors.background));
        root.style.setProperty('--card', hexToHsl(colors.background));
        root.style.setProperty('--popover', hexToHsl(colors.background));
        root.style.setProperty('--sidebar-background', hexToHsl(colors.background));
      }
      if (colors.accent) {
        root.style.setProperty('--accent', hexToHsl(colors.accent));
        root.style.setProperty('--secondary', hexToHsl(colors.accent));
      }
      if (colors.foreground) {
        root.style.setProperty('--foreground', hexToHsl(colors.foreground));
        root.style.setProperty('--card-foreground', hexToHsl(colors.foreground));
        root.style.setProperty('--popover-foreground', hexToHsl(colors.foreground));
        root.style.setProperty('--sidebar-foreground', hexToHsl(colors.foreground));
      }
    }

    // 3. Apply Fonts
    if (theme.fontFamily) {
      root.style.setProperty('--font-body', theme.fontFamily);
      root.style.setProperty('--font-headline', theme.fontFamily);
    }

    // 4. Apply Font Size
    const sizeMap: Record<string, string> = {
      'sm': '14px',
      'base': '16px',
      'lg': '18px',
      'xl': '20px'
    };
    if (theme.fontSize) {
      root.style.fontSize = sizeMap[theme.fontSize] || '16px';
    }

    // 5. Apply Background Image
    const bgContainer = document.getElementById('global-theme-bg');
    if (bgContainer) {
      if (theme.backgroundImage) {
        bgContainer.style.backgroundImage = `url(${theme.backgroundImage})`;
        bgContainer.style.opacity = (theme.bgOpacity || 20) / 100 + '';
      } else {
        bgContainer.style.backgroundImage = 'none';
      }
    }

  }, [profile?.theme]);

  return (
    <div 
      id="global-theme-bg" 
      className="fixed inset-0 pointer-events-none -z-10 bg-cover bg-center transition-all duration-700 ease-in-out"
    />
  );
}
