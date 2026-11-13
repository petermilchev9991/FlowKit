import type { Metadata } from 'next';

import { ThemeProvider } from '@/components/theme/theme-provider';
import { siteConfig } from '@/config/site';

import './globals.css';

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // The theme script sets data-theme before React loads, hence suppressHydrationWarning.
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
