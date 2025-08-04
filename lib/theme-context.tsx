'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-context';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);
  const { profile } = useAuth();

  // Handle hydration - only run after client mounts
  useEffect(() => {
    setMounted(true);
    
    // Get theme from profile or localStorage or system preference
    const getInitialTheme = (): Theme => {
      // First priority: user's profile theme
      if (profile?.theme) {
        return profile.theme as Theme;
      }
      
      // Second priority: localStorage
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          return savedTheme;
        }
      }
      
      // Third priority: system preference
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      // Default fallback
      return 'light';
    };

    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    
    // Apply theme to document
    document.documentElement.className = initialTheme;
    document.documentElement.style.colorScheme = initialTheme;
  }, [profile?.theme]);

  // Update theme function
  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      document.documentElement.className = newTheme;
      document.documentElement.style.colorScheme = newTheme;
    }
  };

  const value = {
    theme,
    setTheme: updateTheme,
    mounted,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}