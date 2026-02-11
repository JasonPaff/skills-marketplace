import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  description: 'Internal skills marketplace for Detergent Software',
  title: 'Detergent Skills Marketplace',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
