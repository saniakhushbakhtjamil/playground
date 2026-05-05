import { createContext, useContext, useEffect, useState } from 'react';
import { type Theme, DARK, THEMES } from '../lib/themes';

interface ThemeCtx {
  theme: Theme;
  setThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeCtx>({ theme: DARK, setThemeId: () => {} });

export const useTheme = () => useContext(ThemeContext).theme;
export const useThemeSwitcher = () => useContext(ThemeContext).setThemeId;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return THEMES.find(t => t.id === saved) ?? DARK;
  });

  const setThemeId = (id: string) => {
    const t = THEMES.find(t => t.id === id) ?? DARK;
    setTheme(t);
    localStorage.setItem('theme', t.id);
  };

  useEffect(() => {
    document.body.style.background = theme.bg;
    document.body.style.color = theme.fg;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}
