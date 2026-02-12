import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { ThemeToggle } from '@/components/layout/theme-toggle';

import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  description: 'Internal skills marketplace for Detergent Software',
  title: 'Detergent Skills Marketplace',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var c = localStorage.getItem('accent-color');
                if (c && c !== 'blue') document.documentElement.dataset.accent = c;
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-surface text-text-primary antialiased">
        <Providers>
          {children}
          <ThemeToggle />
        </Providers>
      </body>
    </html>
  );
}
