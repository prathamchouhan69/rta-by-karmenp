import { VISUAL_FAMILIES } from '@/lib/library-inventory';

interface LibraryVisualProps {
  title: string;
  category: string;
  index: number;
}

export function LibraryVisual({ title, category, index }: LibraryVisualProps) {
  const familyIndex = index % VISUAL_FAMILIES.length;
  const family = VISUAL_FAMILIES[familyIndex];
  const headingId = `visual-title-${index}`;
  const descriptionId = `visual-description-${index}`;
  const variation = [...title, ...category].reduce((value, character) => (value * 31 + character.charCodeAt(0)) % 13, 0);

  return (
    <figure className={`library-visual visual-family-${familyIndex + 1}`} aria-labelledby={headingId} aria-describedby={descriptionId}>
      <figcaption className="visual-caption">
        <strong id={headingId}>{family}</strong>
        <span className="visual-subject">{title} <span>· {category}</span></span>
        <span id={descriptionId}>A decorative visual direction, not scientific or business data.</span>
      </figcaption>
      <svg className="visual-art" viewBox="0 0 360 170" role="img" aria-label={`${family} visual for ${title}, ${category}`}>
        <defs>
          <radialGradient id={`visual-glow-${index}`}>
            <stop offset="0" stopColor="var(--teal)" stopOpacity=".78" />
            <stop offset="1" stopColor="var(--teal)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`visual-line-${index}`} x1="0" x2="1">
            <stop stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--teal)" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="358" height="168" rx="14" className="visual-backdrop" />
        <circle cx="180" cy="84" r="63" fill={`url(#visual-glow-${index})`} className="visual-glow" />
        {familyIndex === 0 ? (
          <g className="visual-reveal">
            <circle cx="180" cy="84" r="40" className="visual-orbit" />
            <circle cx="180" cy="84" r={16 + variation} className="visual-core" />
            <path d="M75 132 153 54M285 38l-74 74" className="visual-streak" />
          </g>
        ) : null}
        {familyIndex === 1 ? (
          <g className="visual-model">
            <circle cx="180" cy="84" r={48 + variation} className="visual-ring" />
            <circle cx="180" cy="84" r={32 + variation} className="visual-ring secondary" />
            <circle cx="180" cy="84" r="18" className="visual-core" />
            <path d="M180 30v28m54 26h-28m-26 54v-28m-54-26h28" className="visual-streak" />
          </g>
        ) : null}
        {familyIndex === 2 ? (
          <g className="visual-loop">
            <ellipse cx="180" cy="84" rx={80 + variation} ry="35" className="visual-track" />
            <ellipse cx="180" cy="84" rx="59" ry={54 + variation} className="visual-track secondary" />
            <circle cx="91" cy="84" r="6" className="visual-node orbit-node" />
            <circle cx="239" cy="35" r="6" className="visual-node orbit-node delay" />
          </g>
        ) : null}
        {familyIndex === 3 ? (
          <g className="visual-infographic">
            <path d={`M60 129h240M78 129V${96 - variation}h32v${33 + variation}m16 0V${70 + variation}h32v${59 - variation}m16 0V50h32v79m16 0V${81 - variation}h32v${48 + variation}`} className="visual-bars" />
            <path d="m75 78 53-18 46 12 57-28 50 11" className="visual-streak" />
          </g>
        ) : null}
        {familyIndex === 4 ? (
          <g className="visual-ui">
            <rect x="93" y="43" width="174" height="82" rx="10" className="visual-panel" />
            <path d="M111 64h70m-70 15h121m-121 15h48" className="visual-streak" />
            <circle cx="239" cy="102" r="10" className="visual-node" />
            <path d="M247 110l10 10" className="visual-streak" />
          </g>
        ) : null}
      </svg>
    </figure>
  );
}
