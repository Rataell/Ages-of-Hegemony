import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './style.css';

export const metadata: Metadata = { title: 'Ages of Hegemony', description: 'Fundação técnica de um jogo original de estratégia 4X.' };
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
