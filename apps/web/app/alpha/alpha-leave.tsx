'use client';
import { useState } from 'react';

/**
 * Leaving is NOT abandoning and NOT ending the match: it only closes this session. The seat, the civilization and the match stay exactly as they were,
 * and the same browser (or the invite link) brings the person back to the same seat.
 */
export function LeaveGame({ joinCode, onLeave }: { joinCode: string; onLeave: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return <>
    <button type="button" className="alpha-leave" onClick={() => setConfirming(true)}>Sair da partida</button>
    {confirming && <div className="alpha-modal-backdrop"><section className="alpha-modal alpha-leave-modal" role="dialog" aria-modal="true" aria-labelledby="alpha-leave-title">
      <h2 id="alpha-leave-title">SAIR DESTA SESSÃO?</h2>
      <p>Sua civilização continua no lugar. Para voltar, abra o convite <code>/alpha/join/{joinCode}</code> neste navegador.</p>
      <div className="alpha-finale-actions"><button type="button" className="primary" onClick={onLeave}>Sair e poder voltar</button><button type="button" onClick={() => setConfirming(false)}>Cancelar</button></div>
    </section></div>}
  </>;
}
