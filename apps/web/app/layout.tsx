import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './design/tokens.css';
import './design/aoh.css';
import './style.css';

export const metadata: Metadata = { title: 'Ages of Hegemony', description: 'Governe sua civilização. Primeira experiência local jogável de Ages of Hegemony.' };
export default function RootLayout({ children }: { children: ReactNode }) {
  // The design system's three families (display, body, chronicle), loaded once; system fallbacks apply offline.
  return <html lang="pt-BR"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Source+Sans+3:wght@400;600;700&display=swap"/></head><body>{children}</body></html>;
}
