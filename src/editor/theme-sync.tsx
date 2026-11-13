'use client';

import { useWorkflowBuilderActions } from '@workflowbuilder/sdk';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';

import { THEME_STORAGE_KEY } from '@/components/theme/theme-provider';

/**
 * Keeps the editor's theme and the app's theme in step, in both directions:
 * the editor opens in the app's theme, and the editor's own sun/moon button
 * switches the app too. Both store the choice under the same key.
 */
export function ThemeSync() {
  const { setTheme: setEditorTheme } = useWorkflowBuilderActions();
  const { resolvedTheme, setTheme: setAppTheme } = useTheme();

  // App -> editor
  useEffect(() => {
    if (resolvedTheme === 'light' || resolvedTheme === 'dark') setEditorTheme(resolvedTheme);
  }, [resolvedTheme, setEditorTheme]);

  // Editor -> app: the editor writes <html data-theme> directly. A change the
  // user made with the editor's button is also saved to storage; any other
  // change (the editor applying its default on start) is put back.
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const editorTheme = root.dataset.theme;
      if (!resolvedTheme || editorTheme === resolvedTheme) return;
      if ((editorTheme === 'light' || editorTheme === 'dark') && readStoredTheme() === editorTheme) {
        setAppTheme(editorTheme);
      } else {
        root.dataset.theme = resolvedTheme;
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [resolvedTheme, setAppTheme]);

  return null;
}

function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}
