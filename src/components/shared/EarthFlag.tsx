import React from 'react';

/**
 * SVG of the International Flag of Planet Earth icon —
 * seven interlocking rings forming a "flower of life" pattern.
 * See: https://www.flagofplanetearth.com
 */
interface EarthFlagProps {
  size?: number;
  className?: string;
}

const EarthFlag: React.FC<EarthFlagProps> = ({ size = 24, className }) => {
  const r = 3.5; // ring radius
  const cx = 12; // center x
  const cy = 12; // center y
  const d = 3.5; // distance from center to outer ring centers

  // Center ring + 6 rings evenly spaced around it at 60° intervals
  const rings: Array<{ x: number; y: number }> = [
    { x: cx, y: cy },
  ];
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    rings.push({
      x: cx + d * Math.cos(angle),
      y: cy + d * Math.sin(angle),
    });
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {rings.map((ring, i) => (
        <circle
          key={i}
          cx={ring.x}
          cy={ring.y}
          r={r}
          stroke="currentColor"
          strokeWidth={1.2}
          fill="none"
        />
      ))}
    </svg>
  );
};

export default EarthFlag;
