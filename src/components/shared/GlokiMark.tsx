import React from 'react';

/**
 * GlokiMark — Gloki's app icon: a person broadcasting (civic voice).
 *
 * A faithful SVG recreation of the brand mark (approved over a PNG, Batch 17):
 * a brand-blue rounded square holding a white person (head + shoulders) with
 * two broadcast arcs rising above them. Self-coloured (not `currentColor`) so
 * the logo reads the same in light and dark; decorative, so the root <svg> is
 * `aria-hidden` — it sits beside the "Gloki" wordmark which carries the name.
 */
interface GlokiMarkProps {
  size?: number;
  className?: string;
}

// Brand colours — intrinsic to the logo, not theme tokens.
const BRAND_BLUE = '#1b63b0';

const GlokiMark: React.FC<GlokiMarkProps> = ({ size = 24, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Rounded-square tile */}
    <rect x="2" y="2" width="44" height="44" rx="12" ry="12" fill={BRAND_BLUE} />

    {/* Broadcast arcs rising above the person */}
    <path
      d="M11 18 Q24 6 37 18"
      stroke="#ffffff"
      strokeWidth="2.4"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M16 18.5 Q24 11 32 18.5"
      stroke="#ffffff"
      strokeWidth="2.4"
      strokeLinecap="round"
      fill="none"
    />

    {/* Person — head + shoulders */}
    <circle cx="24" cy="27" r="5.5" fill="#ffffff" />
    <path d="M14 41 C14 32.5 34 32.5 34 41 Z" fill="#ffffff" />
  </svg>
);

export default GlokiMark;
