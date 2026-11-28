/**
 * Symbole für das Instagram-Bild (oben rechts). Linienzeichnungen, gezeichnet in der Symbolfarbe des Designs.
 *
 * Zwei Raster:
 * - `grid: 100` – eigene Zeichnungen mit leicht getönten Flächen (Mond, Palme, Camper …)
 * - `grid: 24`  – Strich-Icons; ein Teil stammt aus Tabler Icons (MIT-Lizenz, © Paweł Kuna,
 *   https://github.com/tabler/tabler-icons), der Rest ist im selben Stil selbst gezeichnet.
 */

export interface SymbolDef {
  grid: 24 | 100
  /** Pfade mit getönter Fläche und Strich */
  fill?: string[]
  /** Pfade nur mit Strich */
  line?: string[]
}

export type SymbolGroup = 'unterwegs' | 'tiere' | 'aktiv' | 'essen'

export const SYMBOL_GROUPS: { key: SymbolGroup; label: string }[] = [
  { key: 'unterwegs', label: 'Unterwegs' },
  { key: 'tiere', label: 'Tiere' },
  { key: 'aktiv', label: 'Aktivitäten' },
  { key: 'essen', label: 'Essen & Trinken' },
]

/** Reihenfolge und Beschriftung in der Auswahl; `sonne` und `keins` zeichnet shareImage.ts selbst. */
export const SYMBOL_LIST = [
  { key: 'sonne', label: 'Sonne', group: 'unterwegs' },
  { key: 'mond', label: 'Mond', group: 'unterwegs' },
  { key: 'palme', label: 'Palme', group: 'unterwegs' },
  { key: 'camper', label: 'Camper', group: 'unterwegs' },
  { key: 'haus', label: 'Häuschen', group: 'unterwegs' },
  { key: 'zelt', label: 'Zelt', group: 'unterwegs' },
  { key: 'fahrrad', label: 'Fahrrad', group: 'unterwegs' },
  { key: 'berge', label: 'Berge', group: 'unterwegs' },
  { key: 'welle', label: 'Welle', group: 'unterwegs' },
  { key: 'segelboot', label: 'Segelboot', group: 'unterwegs' },
  { key: 'keins', label: 'Keins', group: 'unterwegs' },

  { key: 'elefant', label: 'Elefant', group: 'tiere' },
  { key: 'giraffe', label: 'Giraffe', group: 'tiere' },
  { key: 'loewe', label: 'Löwe', group: 'tiere' },
  { key: 'vogel', label: 'Vogel', group: 'tiere' },
  { key: 'wal', label: 'Wal', group: 'tiere' },
  { key: 'delfin', label: 'Delfin', group: 'tiere' },
  { key: 'pinguin', label: 'Pinguin', group: 'tiere' },
  { key: 'krokodil', label: 'Krokodil', group: 'tiere' },
  { key: 'schildkroete', label: 'Schildkröte', group: 'tiere' },

  { key: 'ski', label: 'Skifahren', group: 'aktiv' },
  { key: 'velo', label: 'Biken', group: 'aktiv' },
  { key: 'wandern', label: 'Wandern', group: 'aktiv' },
  { key: 'schwimmen', label: 'Schwimmen', group: 'aktiv' },
  { key: 'surfen', label: 'Surfen', group: 'aktiv' },
  { key: 'tennis', label: 'Tennis', group: 'aktiv' },
  { key: 'kajak', label: 'Kajak', group: 'aktiv' },
  { key: 'tauchen', label: 'Tauchen', group: 'aktiv' },

  { key: 'steak', label: 'Fleisch', group: 'essen' },
  { key: 'fisch', label: 'Fisch', group: 'essen' },
  { key: 'pommes', label: 'Pommes', group: 'essen' },
  { key: 'pizza', label: 'Pizza', group: 'essen' },
  { key: 'glace', label: 'Glace', group: 'essen' },
  { key: 'kaffee', label: 'Kaffee', group: 'essen' },
  { key: 'drink', label: 'Drink', group: 'essen' },
  { key: 'bier', label: 'Bier', group: 'essen' },
  { key: 'wein', label: 'Wein', group: 'essen' },
] as const satisfies readonly { key: string; label: string; group: SymbolGroup }[]

export type ShareImageSymbol = (typeof SYMBOL_LIST)[number]['key']

export const SYMBOLS: Record<Exclude<ShareImageSymbol, 'sonne' | 'keins'>, SymbolDef> = {
  // ---- eigene Zeichnungen, Raster 100 ----
  mond: { grid: 100, fill: ['M60 14 A36 36 0 1 0 86 68 A30 30 0 1 1 60 14 Z'], line: ['M78 22 l0 8 M74 26 l8 0', 'M86 40 l0 6 M83 43 l6 0'] },
  palme: {
    grid: 100,
    line: [
      'M52 92 C54 72 56 54 50 34',
      'M50 34 C38 22 22 24 14 36',
      'M50 34 C40 32 30 40 26 52',
      'M50 34 C62 22 78 24 86 36',
      'M50 34 C60 32 70 40 74 52',
      'M50 34 C48 22 54 12 64 8',
      'M30 92 H74',
    ],
    fill: ['M44 38 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 Z'],
  },
  camper: {
    grid: 100,
    fill: ['M14 70 V46 C14 38 20 32 28 32 H70 C78 32 84 38 84 46 V70 Z'],
    line: ['M22 40 h18 v12 h-18 Z', 'M50 40 h12 v24 h-12 Z', 'M84 64 H94', 'M30 78 a8 8 0 1 0 0.1 0', 'M68 78 a8 8 0 1 0 0.1 0', 'M8 86 H94'],
  },
  haus: {
    grid: 100,
    fill: ['M26 46 V84 H74 V46 L50 26 Z'],
    line: ['M16 52 L50 22 L84 52', 'M44 84 V64 H56 V84', 'M60 54 h10 v10 h-10 Z', 'M66 34 V22 H74 V40', 'M10 84 H90'],
  },
  zelt: { grid: 100, fill: ['M14 82 L50 22 L86 82 Z'], line: ['M42 82 L50 58 L58 82', 'M50 22 L44 12 M50 22 L56 12', 'M6 82 H94'] },
  fahrrad: {
    grid: 100,
    line: [
      'M26 66 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0',
      'M76 66 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0',
      'M26 66 L42 40 H64 L76 66',
      'M42 40 L52 66 L64 40',
      'M52 66 H26',
      'M38 32 H50',
      'M62 40 L60 28 H70',
    ],
  },
  berge: { grid: 100, fill: ['M6 82 L36 34 L52 58 L66 40 L94 82 Z'], line: ['M29 45 L36 34 L43 45 L39 42 L33 46 Z', 'M2 82 H98'] },
  welle: {
    grid: 100,
    line: [
      'M8 44 C18 34 28 34 38 44 S58 54 68 44 S86 34 94 40',
      'M8 62 C18 52 28 52 38 62 S58 72 68 62 S86 52 94 58',
      'M8 80 C18 70 28 70 38 80 S58 90 68 80 S86 70 94 76',
    ],
  },

  // ---- Tabler Icons (MIT), Raster 24 ----
  segelboot: {
    grid: 24,
    line: [
      'M2 20a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1',
      'M4 18l-1 -3h18l-1 3',
      'M8 7l-2 5',
    ],
    fill: ['M11 12h7l-7 -9v9'],
  },
  ski: {
    grid: 24,
    line: [
      'M17 17.5l-5 -4.5v-6l5 4',
      'M7 17.5l5 -4.5',
      'M15.103 21.58l6.762 -14.502a2 2 0 0 0 -.968 -2.657',
      'M8.897 21.58l-6.762 -14.503a2 2 0 0 1 .968 -2.657',
      'M7 11l5 -4',
      'M10.007 4a2 2 0 1 0 4 0a2 2 0 1 0 -4 0',
    ],
  },
  velo: {
    grid: 24,
    line: ['M2 18a3 3 0 1 0 6 0a3 3 0 0 0 -6 0', 'M16 18a3 3 0 1 0 6 0a3 3 0 0 0 -6 0', 'M12 19v-4l-3 -3l5 -4l2 3h3', 'M13.007 5a2 2 0 1 0 4 0a2 2 0 1 0 -4 0'],
  },
  wandern: {
    grid: 24,
    line: [
      'M11 4a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
      'M7 21l2 -4',
      'M13 21v-4l-3 -3l1 -6l3 4l3 2',
      'M10 14l-1.827 -1.218a2 2 0 0 1 -.831 -2.15l.28 -1.117a2 2 0 0 1 1.939 -1.515h1.439l4 1l3 -2',
      'M17 12v9',
      'M16 20h2',
    ],
  },
  schwimmen: {
    grid: 24,
    line: [
      'M15 9a1 1 0 1 0 2 0a1 1 0 1 0 -2 0',
      'M6 11l4 -2l3.5 3l-1.5 2',
      'M3 16.75a2.4 2.4 0 0 0 1 .25a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 1 -.25',
    ],
  },
  tennis: { grid: 24, line: ['M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0', 'M6 5.3a9 9 0 0 1 0 13.4', 'M18 5.3a9 9 0 0 0 0 13.4'] },
  kajak: {
    grid: 24,
    line: [
      'M6.414 6.414a2 2 0 0 0 0 -2.828l-1.414 -1.414l-2.828 2.828l1.414 1.414a2 2 0 0 0 2.828 0',
      'M17.586 17.586a2 2 0 0 0 0 2.828l1.414 1.414l2.828 -2.828l-1.414 -1.414a2 2 0 0 0 -2.828 0',
      'M6.5 6.5l11 11',
      'M22 2.5c-9.983 2.601 -17.627 7.952 -20 19.5c9.983 -2.601 17.627 -7.952 20 -19.5',
      'M6.5 12.5l5 5',
      'M12.5 6.5l5 5',
    ],
  },
  tauchen: {
    grid: 24,
    line: [
      'M4 7h12a1 1 0 0 1 1 1v4.5a2.5 2.5 0 0 1 -2.5 2.5h-.5a2 2 0 0 1 -2 -2a2 2 0 1 0 -4 0a2 2 0 0 1 -2 2h-.5a2.5 2.5 0 0 1 -2.5 -2.5v-4.5a1 1 0 0 1 1 -1',
      'M10 17a2 2 0 0 0 2 2h3.5a5.5 5.5 0 0 0 5.5 -5.5v-9.5',
    ],
  },
  fisch: {
    grid: 24,
    line: [
      'M16.69 7.44a6.973 6.973 0 0 0 -1.69 4.56c0 1.747 .64 3.345 1.699 4.571',
      'M2 9.504c7.715 8.647 14.75 10.265 20 2.498c-5.25 -7.761 -12.285 -6.142 -20 2.504',
      'M18 11v.01',
      'M11.5 10.5c-.667 1 -.667 2 0 3',
    ],
  },
  pizza: {
    grid: 24,
    line: [
      'M12 21.5c-3.04 0 -5.952 -.714 -8.5 -1.983l8.5 -16.517l8.5 16.517a19.09 19.09 0 0 1 -8.5 1.983',
      'M5.38 15.866a14.94 14.94 0 0 0 6.815 1.634a14.944 14.944 0 0 0 6.502 -1.479',
      'M13 11.01v-.01',
    ],
  },
  glace: { grid: 24, line: ['M12 21.5v-4.5', 'M8 17h8v-10a4 4 0 1 0 -8 0v10', 'M8 10.5l8 -3.5', 'M8 14.5l8 -3.5'] },
  kaffee: {
    grid: 24,
    line: [
      'M3 14c.83 .642 2.077 1.017 3.5 1c1.423 .017 2.67 -.358 3.5 -1c.83 -.642 2.077 -1.017 3.5 -1c1.423 -.017 2.67 .358 3.5 1',
      'M8 3a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2',
      'M12 3a2.4 2.4 0 0 0 -1 2a2.4 2.4 0 0 0 1 2',
      'M3 10h14v5a6 6 0 0 1 -6 6h-2a6 6 0 0 1 -6 -6v-5',
      'M16.746 16.726a3 3 0 1 0 .252 -5.555',
    ],
  },
  drink: {
    grid: 24,
    line: [
      'M8 21h8',
      'M12 15v6',
      'M5 5a7 2 0 1 0 14 0a7 2 0 1 0 -14 0',
      'M5 5v.388c0 .432 .126 .853 .362 1.206l5 7.509c.633 .951 1.88 1.183 2.785 .517c.191 -.141 .358 -.316 .491 -.517l5 -7.509c.236 -.353 .362 -.774 .362 -1.206v-.388',
    ],
  },
  bier: {
    grid: 24,
    line: [
      'M9 21h6a1 1 0 0 0 1 -1v-3.625c0 -1.397 .29 -2.775 .845 -4.025l.31 -.7c.556 -1.25 .845 -2.253 .845 -3.65v-4a1 1 0 0 0 -1 -1h-10a1 1 0 0 0 -1 1v4c0 1.397 .29 2.4 .845 3.65l.31 .7a9.931 9.931 0 0 1 .845 4.025v3.625a1 1 0 0 0 1 1',
      'M6 8h12',
    ],
  },
  wein: {
    grid: 24,
    line: ['M8 21l8 0', 'M12 15l0 6', 'M17 3l1 7c0 3.012 -2.686 5 -6 5s-6 -1.988 -6 -5l1 -7h10', 'M6 10a5 5 0 0 1 6 0a5 5 0 0 0 6 0'],
  },

  // ---- eigene Zeichnungen im Tabler-Stil, Raster 24 ----
  elefant: {
    grid: 24,
    line: [
      // Rücken, Kopf und Rüssel
      'M20 18v-6.5a5.5 5.5 0 0 0 -5.5 -5.5h-5a4.5 4.5 0 0 0 -4.5 4.5v6c0 1 -.5 1.5 -1.3 1.5',
      // Beine und Bauch
      'M20 18h-3v-3h-5v3h-3v-4.5',
      // Ohr und Stosszahn
      'M10.5 7.2c-2.2 .4 -3.3 2.4 -2.6 4.3c.5 1.4 1.8 2.1 3.6 2',
      'M5 13.8l2 1',
      // Auge und Schwanz
      'M7.3 9.6v.01',
      'M20 12.5l1.5 1.5',
    ],
  },
  giraffe: {
    grid: 24,
    line: [
      'M3.5 6.5a2.5 1.6 0 1 0 5 0a2.5 1.6 0 1 0 -5 0',
      'M6.5 5v-2.2 M8 5.2v-2.2',
      'M7.5 7.8l4 5.2 M9.3 6.4l4.2 6.1',
      'M11.5 13v1.5a1 1 0 0 0 1 1h7a1 1 0 0 0 1 -1v-1a1.5 1.5 0 0 0 -1.5 -1.5h-6',
      'M12.5 15.5v5.5 M14.5 15.5v5.5 M18 15.5v5.5 M19.8 15.3v5.7',
      'M20.5 13.2l1.5 2',
      'M5 6.3v.01 M10.5 9.8v.01 M15.5 13.6v.01 M18.2 13.6v.01',
    ],
  },
  loewe: {
    grid: 24,
    line: [
      // Mähne
      'M12 2.5l1.6 1.4l2 -.6l.7 2l2 .6l-.3 2.1l1.5 1.5l-1.1 1.8l.9 1.9l-1.7 1.3l.2 2.1l-2.1 .4l-.7 2l-2 -.7l-1.6 1.4l-1.6 -1.4l-2 .7l-.7 -2l-2.1 -.4l.2 -2.1l-1.7 -1.3l.9 -1.9l-1.1 -1.8l1.5 -1.5l-.3 -2.1l2 -.6l.7 -2l2 .6z',
      // Gesicht
      'M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
      'M10.5 11v.01 M13.5 11v.01',
      'M11 13.5h2l-1 1z',
    ],
  },
  vogel: {
    grid: 24,
    line: [
      'M4 15c3 0 4.5 -1 6 -3.5c1.2 -2 2.5 -4.5 5 -4.5a3 3 0 0 1 3 3v.5l3 1l-3 1c0 4 -3 7 -8 7h-3l2 -2',
      'M10 13c1 1.5 2.5 2.2 4.5 2.2',
      'M15.5 9.5v.01',
    ],
  },
  wal: {
    grid: 24,
    line: [
      'M3 13c0 3.3 3.4 5.5 8 5.5c4.5 0 7.5 -2.5 8.5 -6l2 -2.5l-.5 3.5l-1.5 -1',
      'M3 13c0 -2.5 2.5 -4.5 6.5 -4.5c3.5 0 6.5 1.6 10 4',
      'M7 12.5v.01',
      'M5 15.5c2 .8 5 .8 7 0',
      'M9 7c0 -1.5 -1 -2.5 -2 -3 M9 7c0 -1.5 1 -2.5 2 -3',
    ],
  },
  delfin: {
    grid: 24,
    line: [
      'M21 9.5c-1.5 -1.6 -3.8 -2.5 -6.3 -2.5c-5 0 -8.7 3.5 -10.2 8.5l-2.5 .8l1.8 1.2l.4 2.5l1.6 -2.3c2.7 -3.6 6.6 -6.2 11.2 -6.7c1.2 0 2.3 .2 3 .6z',
      'M12.3 7.6l1.4 -2.8l1.8 2.4',
      'M11.5 11.8l-1.2 2.6',
      'M17.6 9.2v.01',
    ],
  },
  pinguin: {
    grid: 24,
    line: [
      'M12 2.5c-2.8 0 -4.5 2.5 -4.5 6v7c0 2.8 2 4.5 4.5 4.5s4.5 -1.7 4.5 -4.5v-7c0 -3.5 -1.7 -6 -4.5 -6z',
      'M12 8.5c-1.6 0 -2.5 1.5 -2.5 3.5v3.5c0 1.6 1 2.5 2.5 2.5s2.5 -.9 2.5 -2.5v-3.5c0 -2 -.9 -3.5 -2.5 -3.5z',
      'M10.5 5.8v.01 M13.5 5.8v.01',
      'M11 7h2l-1 1z',
      'M7.5 10l-2.5 4.5l2.5 .5 M16.5 10l2.5 4.5l-2.5 .5',
      'M10.5 20l-2 1.5h3 M13.5 20l2 1.5h-3',
    ],
  },
  krokodil: {
    grid: 24,
    line: [
      'M2 14c3 -.5 5 -1.5 7 -2.5l1 -1l1 1h2l1 -1l1 1h2.5l1.2 -1.2h1.3l.5 1.2l3.5 .8',
      'M2 14c3 .8 6 1 9 1h6l5 -1.5',
      'M17 13h4.5',
      'M18 13l.5 .8l.5 -.8l.5 .8l.5 -.8',
      'M18.6 11.4v.01',
      'M8 14.8l-1 2.5h1.6 M14 15l-.5 2.5h1.6',
    ],
  },
  schildkroete: {
    grid: 24,
    line: [
      'M4 15a7 6 0 0 1 14 0z',
      'M7.5 15l1.5 -4h5l1.5 4 M9 11l2 -1.5l2 1.5',
      'M18 13.5h1.5a2 2 0 0 0 0 -4h-.5l-1.5 2',
      'M6 15v2.5 M15.5 15v2.5',
      'M4 15l-1.5 1',
    ],
  },
  steak: {
    // Tabler «meat» (MIT)
    grid: 24,
    line: [
      'M13.62 8.382l1.966 -1.967a2 2 0 1 1 3.414 -1.415a2 2 0 1 1 -1.413 3.414l-1.82 1.821',
      'M5.904 18.596c2.733 2.734 5.9 4 7.07 2.829c1.172 -1.172 -.094 -4.338 -2.828 -7.071c-2.733 -2.734 -5.9 -4 -7.07 -2.829c-1.172 1.172 .094 4.338 2.828 7.071',
      'M7.5 16l1 1',
      'M12.975 21.425c3.905 -3.906 4.855 -9.288 2.121 -12.021c-2.733 -2.734 -8.115 -1.784 -12.02 2.121',
    ],
  },
  pommes: {
    grid: 24,
    line: [
      'M6 11h12l-1.5 10h-9z',
      'M8 11l-1 -6.5 M10.5 11v-8 M13.5 11v-7 M16 11l1 -6',
      'M9 11.2v-6.5 M15 11.2v-6.5',
      'M9.5 15.5a2.5 1.5 0 0 0 5 0',
    ],
  },
  surfen: {
    grid: 24,
    line: [
      // Brett
      'M4 21c3.5 -4.5 9 -11 16 -17c-1 7 -6.5 13 -16 17z',
      'M8 17.5l6.5 -7.5',
      // Welle
      'M2 21c2 0 3 -1 4.5 -1s2.5 1 4 1s2.5 -1 4 -1s2.5 1 4 1s2.5 -1 3.5 -1',
    ],
  },
}
