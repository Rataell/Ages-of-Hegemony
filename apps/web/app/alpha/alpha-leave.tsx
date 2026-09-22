'use client';
import { useState } from 'react';

/** Leaving only forgets the match in this browser. The saved match, the seat and the session are untouched, so the invite code brings the person back. */
export function LeaveGame({ joinCode, onLeave }: { joinCode: string; onLeave: () => void }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) return <button type="button" className="alpha-leave" onClick={() => setConfirming(true)}>Sair da partida</button>;
  return <span className="alpha-leave-confirm" role="group" aria-label="Confirmar saída">
    <small>Sair só deste navegador. Para voltar, use o código <code>{joinCode}</code>.</small>
    <button type="button" onClick={onLeave}>Sair agora</button>
    <button type="button" onClick={() => setConfirming(false)}>Ficar</button>
  </span>;
}
