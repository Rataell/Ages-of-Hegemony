/** Small stroke icons for the Table cloud. Always paired with a short label: an icon is never the only way to read an action. */
const PATHS = {
  produce: 'M12 21V9M12 13c-3 0-5-2-5-5 3 0 5 2 5 5ZM12 10c0-3 2-5 5-5 0 3-2 5-5 5ZM7 21h10',
  build: 'M4 20h16M6 20V10l6-5 6 5v10M10 20v-5h4v5',
  recruit: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3ZM12 8v8M9 11h6',
  govern: 'M5 18h14M6 18l-1-9 4 3 3-6 3 6 4-3-1 9',
  elevate: 'M12 20V6M6 12l6-6 6 6M5 20h14',
  research: 'M12 4a5 5 0 0 1 3 9v3H9v-3a5 5 0 0 1 3-9ZM10 19h4M10.5 21h3',
  explore: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM15.5 8.5l-2 5-5 2 2-5 5-2Z',
  move: 'M4 12h14M13 6l6 6-6 6',
  found: 'M6 21V4M6 5h11l-3 4 3 4H6',
  attack: 'M5 19L17 7M14 4h6v6M7 5l12 12M5 8L8 5',
  posture: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z',
  more: 'M6 12h.01M12 12h.01M18 12h.01',
  details: 'M12 8h.01M11 12h1v5h1M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z',
  claim: 'M5 20V5l14 0v10l-7 5-7 0ZM9 9h6M9 13h4',
  road: 'M8 21L10 3M16 21L14 3M12 6v2M12 11v2M12 16v2',
  improve: 'M14 6l4 4-9 9H5v-4l9-9ZM13 7l4 4',
  cancel: 'M6 6l12 12M18 6L6 18',
  back: 'M10 6l-6 6 6 6M4 12h16',
  trade: 'M7 8h12l-3-3M17 16H5l3 3',
  civic: 'M4 20h16M6 20V9l6-5 6 5v11M10 20v-6h4v6',
  fleet: 'M3 15h18l-2 5H5l-2-5ZM12 3v12M12 4l6 8h-6',
  people: 'M12 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM5 20c0-4 3-6 7-6s7 2 7 6',
  check: 'M5 12l5 5 9-10',
} as const;
export type IconName = keyof typeof PATHS;
export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg className="ctx-ico" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={PATHS[name]} /></svg>;
}
