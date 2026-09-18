import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './style.css';

export const metadata: Metadata = { title: 'Ages of Hegemony', description: 'Governe sua civilização. Primeira experiência local jogável de Ages of Hegemony.' };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
