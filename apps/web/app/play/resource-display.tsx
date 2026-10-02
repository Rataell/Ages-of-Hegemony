import { label } from './presentation';
const paths: Record<string, string> = {
  food: 'M12 21V4M12 10C4 10 4 3 4 3C12 3 12 10 12 10M12 16C20 16 20 9 20 9C12 9 12 16 12 16',
  materials: 'M3 18L8 5L16 3L21 16L14 21Z M8 5L14 21M8 5L21 16',
  wood: 'M12 2L6 10H9L4 17H10V22H14V17H20L15 10H18Z',
  stone: 'M4 19L7 8L14 4L21 11L18 20Z M7 8L18 20M14 4L12 14',
  metal: 'M7 3H17L20 8L17 21H7L4 8Z M4 8H20M9 8L10 21M15 8L14 21',
  wealth: 'M12 2L22 12L12 22L2 12ZM12 7V17M8 12H16',
  knowledge: 'M12 6Q7 2 2 5V20Q7 17 12 21Q17 17 22 20V5Q17 2 12 6V21',
  influence: 'M12 22V3M4 5H20L17 13H7ZM7 20H17',
};
export function ResourceDisplay({ values, compact = false }: { values: Record<string, number>; compact?: boolean }) {
  return <div className={`resources ${compact ? 'compact' : ''}`}>{Object.entries(values).filter(([, n]) => !compact || n !== 0).map(([key, n]) => <span className={`resource ${key}`} key={key} title={label(key)}><svg aria-hidden="true" viewBox="0 0 24 24"><path d={paths[key]} /></svg><span>{!compact && <small>{label(key)}</small>}<b>{n}</b>{compact && ` ${label(key)}`}</span></span>)}</div>;
}
