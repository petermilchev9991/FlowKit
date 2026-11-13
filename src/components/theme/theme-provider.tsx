'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Light and dark theme for the whole app. The choice is stored under the same
 * key and attribute the Workflow Builder editor uses ("wb-theme" and
 * <html data-theme>), so switching in either place switches both.
 */
export const THEME_STORAGE_KEY = 'wb-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      storageKey={THEME_STORAGE_KEY}
      themes={['light', 'dark']}
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
