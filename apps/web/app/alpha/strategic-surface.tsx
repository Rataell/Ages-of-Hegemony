'use client';
import { useEffect, type ReactNode } from 'react';

/**
 * Interaction Model V2 · DETAIL level. Strategic systems (Teia, Ressonância, Tabuleiro, Governo, Livro) are big surfaces, but they are a
 * translucent LAYER over the Mesa: dark glass, soft blur, the map still perceptible behind. Esc closes wherever the focus is (a button that
 * just became disabled must not trap the key); no page scroll is ever involved.
 */
export function StrategicSurface({ className = '', label, onClose, children }: { className?: string; label: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return <section className={`strategic-surface aoh-sheet ${className}`} role="dialog" aria-label={label}>{children}</section>;
}
