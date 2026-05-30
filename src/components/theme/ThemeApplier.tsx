
'use client';

import * as React from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const PRESET_THEMES = {
  'classic': { primary: '#A7C4A0', bg: '#FFFFFF', accent: '#FFF0F0', foreground: '#1a1c19', muted: '#71717a' },
  'midnight': { primary: '#3B82F6', bg: '#0F172A', accent: '#1E293B', foreground: '#F8FAFC', muted: '#94A3B8' },
  'sunset': { primary: '#F97316', bg: '#FFF7ED', accent: '#FFEDD5', foreground: '#431407', muted: '#9A3412' },
  'matcha': { primary: '#4D7C0F', bg: '#F7FEE7', accent: '#ECFCCB', foreground: '#14532D', muted: '#3F6212' },
  'lavender': { primary: '#8B5CF6', bg: '#F5F3FF', accent: '#EDE9FE', foreground: '#2E1065', muted: '#6D28D9' },
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
    const theme = profile?.theme;
    const root = document.documentElement;

    // Helper to convert Hex to HSL for Tailwind compatibility (Space-separated H S L)
    const hexToHsl = (hex: string) => {
      if (!hex) return '0 0% 0%';
      let r = 0, g = 0, b = 0;
      const cleanHex = hex.replace('#', '');
      if (cleanHex.length === 3) {
        r = parseInt(cleanHex[0] + cleanHex[0], 16);
        g = parseInt(cleanHex[1] + cleanHex[1], 16);
        b = parseInt(cleanHex[2] + cleanHex[2], 16);
      } else if (cleanHex.length === 6) {
        r = parseInt(cleanHex.slice(0, 2), 16);
        g = parseInt(cleanHex.slice(2, 4), 16);
        b = parseInt(cleanHex.slice(4, 6), 16);
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

    if (theme) {
      // 1. Determine Colors (Custom vs Preset)
      let colors = theme.customColors || { primary: '#A7C4A0', background: '#FFFFFF', accent: '#FFF0F0', foreground: '#1a1c19', muted: '#71717a' };
      if (theme.activeTheme !== 'custom' && PRESET_THEMES[theme.activeTheme as keyof typeof PRESET_THEMES]) {
        const preset = PRESET_THEMES[theme.activeTheme as keyof typeof PRESET_THEMES];
        colors = {
          primary: preset.primary,
          background: preset.bg,
          accent: preset.accent,
          foreground: preset.foreground,
          muted: preset.muted
        };
      }

      // 2. Apply Colors
      if (colors.primary) root.style.setProperty('--primary', hexToHsl(colors.primary));
      if (colors.background) {
        const hslBg = hexToHsl(colors.background);
        root.style.setProperty('--background', hslBg);
        root.style.setProperty('--card', hslBg);
        root.style.setProperty('--popover', hslBg);
        root.style.setProperty('--sidebar-background', hslBg);
      }
      if (colors.accent) {
        const hslAccent = hexToHsl(colors.accent);
        root.style.setProperty('--accent', hslAccent);
        root.style.setProperty('--secondary', hslAccent);
      }
      if (colors.foreground) {
        const hslFg = hexToHsl(colors.foreground);
        root.style.setProperty('--foreground', hslFg);
        root.style.setProperty('--card-foreground', hslFg);
        root.style.setProperty('--popover-foreground', hslFg);
        root.style.setProperty('--sidebar-foreground', hslFg);
      }
      if (colors.muted) {
        const hslMuted = hexToHsl(colors.muted);
        root.style.setProperty('--muted-foreground', hslMuted);
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

      // 5. Apply Background Image & Blur
      const bgContainer = document.getElementById('global-theme-bg');
      if (bgContainer) {
        if (theme.backgroundImage) {
          bgContainer.style.backgroundImage = `url(${theme.backgroundImage})`;
          bgContainer.style.opacity = (theme.bgOpacity || 20) / 100 + '';
          bgContainer.style.filter = `blur(${theme.bgBlur || 0}px)`;
        } else {
          bgContainer.style.backgroundImage = 'none';
          bgContainer.style.filter = 'none';
        }
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
