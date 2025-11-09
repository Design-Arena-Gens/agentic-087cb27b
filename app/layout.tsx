import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { QueryClientProvider } from '@/components/query-client-provider';

export const metadata: Metadata = {
  title: 'Nifty 50 AI Trading Agent',
  description: 'Dynamic support/resistance with RSI confluence analytics for Nifty 50.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider>{children}</QueryClientProvider>
      </body>
    </html>
  );
}
