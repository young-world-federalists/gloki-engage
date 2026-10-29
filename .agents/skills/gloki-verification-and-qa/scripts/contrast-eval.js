// WCAG contrast measurement for the Gloki preview — the ONE home of this snippet.
// Referenced by gloki-verification-and-qa and gloki-ui-review-campaign; do not fork copies.
//
// Usage (browser only — paste the IIFE into preview_eval; it is not a Node script):
//   sweep mode  : glokiContrast()            → up to 30 failing elements on the page
//   single mode : glokiContrast('.selector') → { fg, bg, ratio } for one element
// Run in BOTH color schemes (preview_resize colorScheme 'light' then 'dark').
//
// Thresholds: 4.5:1 normal text; 3:1 large text (>=24px, or >=18.66px bold) per WCAG 2.1 AA.
// Settled facts (do NOT file as defects — see gloki-verification-and-qa / gloki-change-control):
//   white on $primary #3b82f6 = 3.68:1 (locked brand blue), $gray-500 on white = 4.83:1 (AA caption token).
//
// Math self-test (no DOM): `node contrast-eval.js` prints the two settled ratios; expect 3.68 and 4.83.

const lum = (c) => {
  const [r, g, b] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratioOf = (fg, bg) => {
  const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
};

function glokiContrast(selector) {
  const bgOf = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const bg = getComputedStyle(e).backgroundColor;
      if (bg && !bg.includes('0)') && bg !== 'transparent') return bg; // ancestor walk: most elements are transparent
    }
    return 'rgb(255,255,255)';
  };
  if (selector) {
    const el = document.querySelector(selector);
    if (!el) return JSON.stringify({ error: 'no match: ' + selector });
    const cs = getComputedStyle(el);
    const bg = bgOf(el);
    return JSON.stringify({ fg: cs.color, bg, ratio: +ratioOf(cs.color, bg).toFixed(2) });
  }
  const bad = [];
  document.querySelectorAll('p,span,a,button,h1,h2,h3,h4,label,li,td,th,dt,dd,summary').forEach((el) => {
    if (!el.innerText?.trim() || !el.offsetParent) return;
    const cs = getComputedStyle(el);
    const r = ratioOf(cs.color, bgOf(el));
    const large = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
    if (r < (large ? 3 : 4.5)) bad.push({ t: el.innerText.slice(0, 40), c: cs.color, r: +r.toFixed(2) });
  });
  return JSON.stringify(bad.slice(0, 30));
}

// Node math self-test (harmless in the browser: document check)
if (typeof document === 'undefined') {
  console.log('white on #3b82f6 (expect 3.68):', ratioOf('rgb(255,255,255)', 'rgb(59,130,246)').toFixed(2));
  console.log('#6b7280 on white (expect 4.83):', ratioOf('rgb(107,114,128)', 'rgb(255,255,255)').toFixed(2));
}
