import './PageSpinner.css'

/** Gezeichnete Szene: Camper auf der Strasse (Animation per CSS, Klassen cl-*). */
export const CamperScene = ({ width = 220 }: { width?: number }) => (
  <svg viewBox="0 0 240 120" width={width} height={width / 2} aria-hidden="true">
    {/* Sonne, Hügel, Wolken */}
    <circle cx="196" cy="30" r="12" className="cl-sun" />
    <g className="cl-hills">
      <path d="M-20 88 Q 30 52 80 88 T 180 88 T 280 88 V 96 H -20 Z" />
    </g>
    <g className="cl-clouds">
      <path d="M40 30 a7 7 0 0 1 13 -3 a9 9 0 0 1 16 4 a6 6 0 0 1 0 12 h-27 a7 7 0 0 1 -2 -13z" />
      <path d="M150 18 a5 5 0 0 1 9 -2 a7 7 0 0 1 12 3 a5 5 0 0 1 0 9 h-20 a5 5 0 0 1 -1 -10z" />
    </g>

    {/* Strasse mit ziehendem Mittelstreifen */}
    <rect x="0" y="94" width="240" height="18" rx="2" className="cl-road" />
    <line x1="4" y1="103" x2="236" y2="103" className="cl-lane" />

    {/* Camper (wippt leicht) */}
    <g className="cl-van">
      {/* Karosserie unten mint, oben creme */}
      <path d="M70 92 V64 q0 -14 14 -14 h56 q12 0 16 10 l8 18 q3 6 3 12 v6 z" className="cl-body" />
      <path d="M70 72 V64 q0 -14 14 -14 h56 q12 0 16 10 l5 12 z" className="cl-top" />
      {/* Fenster */}
      <rect x="80" y="56" width="18" height="12" rx="3" className="cl-window" />
      <rect x="102" y="56" width="18" height="12" rx="3" className="cl-window" />
      <path d="M126 56 h12 q6 0 9 6 l3 6 h-24 z" className="cl-window" />
      {/* Dachbox und Surfbrett */}
      <rect x="88" y="44" width="40" height="6" rx="3" className="cl-roof" />
      {/* Zierlinie, Scheinwerfer, Stossstange */}
      <path d="M70 78 h96" className="cl-stripe" />
      <circle cx="164" cy="84" r="2.6" className="cl-light" />
      <rect x="66" y="88" width="104" height="5" rx="2.5" className="cl-bumper" />
      {/* Räder */}
      <g className="cl-wheel" style={{ transformOrigin: '92px 94px' }}>
        <circle cx="92" cy="94" r="9" className="cl-tire" />
        <circle cx="92" cy="94" r="4" className="cl-hub" />
        <path d="M92 86 V102 M84 94 H100" className="cl-spoke" />
      </g>
      <g className="cl-wheel" style={{ transformOrigin: '148px 94px' }}>
        <circle cx="148" cy="94" r="9" className="cl-tire" />
        <circle cx="148" cy="94" r="4" className="cl-hub" />
        <path d="M148 86 V102 M140 94 H156" className="cl-spoke" />
      </g>
    </g>
    {/* Abgaswölkchen */}
    <circle cx="60" cy="88" r="3" className="cl-puff" />
  </svg>
)

/**
 * Ladeanzeige: ein gezeichneter Camper fährt auf einer Strasse (Räder drehen, Mittelstreifen ziehen vorbei,
 * Wolken und Hügel im Hintergrund). Respektiert «Bewegung reduzieren».
 */
const PageSpinner = ({ label = 'Unterwegs …' }: { label?: string }) => (
  <div className="page-spinner" role="status" aria-label="Wird geladen">
    <div className="camper-loader">
      <CamperScene />
      <span className="camper-loader__label">{label}</span>
    </div>
  </div>
)

export default PageSpinner
