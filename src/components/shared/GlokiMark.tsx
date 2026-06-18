import React from 'react';
import glokiIcon from '../../assets/gloki-icon.png';

/**
 * GlokiMark — Gloki's app icon (Eston's brand PNG: a blue rounded square with a
 * white person + broadcast arc). Rendered via <img> from a Vite asset so the URL
 * resolves correctly under the GitHub Pages base path. Decorative — `aria-hidden`,
 * empty alt — it sits beside the "Gloki" wordmark, which carries the name.
 */
interface GlokiMarkProps {
  size?: number;
  className?: string;
}

const GlokiMark: React.FC<GlokiMarkProps> = ({ size = 24, className }) => (
  <img
    src={glokiIcon}
    width={size}
    height={size}
    alt=""
    aria-hidden="true"
    className={className}
    style={{ display: 'block' }}
  />
);

export default GlokiMark;
