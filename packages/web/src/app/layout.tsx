import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import Link from 'next/link';

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
          <header className="
            sticky top-0 z-40 border-b border-border bg-surface
          ">
            <nav className="
              mx-auto flex h-14 max-w-7xl items-center justify-between px-4
              sm:px-6
              lg:px-8
            ">
              <div className="flex items-center gap-8">
                <Link
                  className="
                    text-lg font-semibold text-text-primary transition
                    hover:text-accent
                  "
                  href="/"
                >
                  Skills Marketplace
                </Link>
                <div className="flex items-center gap-1">
                  <Link
                    className="
                      rounded-md px-3 py-1.5 text-sm font-medium
                      text-text-secondary transition
                      hover:bg-surface-secondary hover:text-text-primary
                    "
                    href="/"
                  >
                    Browse
                  </Link>
                  <Link
                    className="
                      rounded-md px-3 py-1.5 text-sm font-medium
                      text-text-secondary transition
                      hover:bg-surface-secondary hover:text-text-primary
                    "
                    href="/upload"
                  >
                    Upload
                  </Link>
                </div>
              </div>
              <ThemeToggle />
            </nav>
          </header>
          <main className="
            mx-auto max-w-7xl px-4 py-8
            sm:px-6
            lg:px-8
          ">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
