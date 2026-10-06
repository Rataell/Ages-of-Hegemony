'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { audioManager } from './audio-manager';
import { useAudioSettings } from './use-alpha-audio';

/** Compact 'ÁUDIO' popover. Music starts only when the player turns it on here. */
export function AudioControls({ className = '' }: { className?: string }) {
  const s = useAudioSettings();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  const pct = (v: number) => Math.round(v * 100);
  return <div className={`audio-controls ${className}`.trim()} ref={root}>
    <button type="button" className="aoh-btn audio-toggle" aria-expanded={open} aria-controls={id} onClick={() => { audioManager.resume(); setOpen(o => !o); }}>
      <span aria-hidden="true">{s.muted ? '×' : '♪'}</span> Áudio
    </button>
    {!s.musicEnabled && !open && <button type="button" className="audio-music-hint" onClick={() => audioManager.setMusicEnabled(true)}>Ativar música</button>}
    {open && <section id={id} className="audio-popover" role="group" aria-label="Áudio">
      <h3>ÁUDIO</h3>
      <div className="audio-row">
        <button type="button" className={`audio-switch${s.musicEnabled ? ' on' : ''}`} role="switch" aria-checked={s.musicEnabled} onClick={() => audioManager.setMusicEnabled(!s.musicEnabled)}>Música <b>{s.musicEnabled ? 'ligada' : 'desligada'}</b></button>
        <input type="range" min={0} max={100} step={5} value={pct(s.musicVolume)} aria-label="Volume da música" onChange={e => audioManager.setMusicVolume(Number(e.target.value) / 100)} />
      </div>
      <div className="audio-row">
        <button type="button" className={`audio-switch${s.sfxEnabled ? ' on' : ''}`} role="switch" aria-checked={s.sfxEnabled} onClick={() => audioManager.setSfxEnabled(!s.sfxEnabled)}>Efeitos <b>{s.sfxEnabled ? 'ligados' : 'desligados'}</b></button>
        <input type="range" min={0} max={100} step={5} value={pct(s.sfxVolume)} aria-label="Volume dos efeitos" onChange={e => { audioManager.setSfxVolume(Number(e.target.value) / 100); }} onPointerUp={() => audioManager.playSfx('UI_SELECT')} />
      </div>
      <button type="button" className="aoh-btn audio-mute" aria-pressed={s.muted} onClick={() => (s.muted ? audioManager.unmuteAll() : audioManager.muteAll())}>{s.muted ? 'Reativar som' : 'Silenciar tudo'}</button>
    </section>}
  </div>;
}
