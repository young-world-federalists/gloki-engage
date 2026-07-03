#!/bin/sh
# grep-gates.sh — Gloki banned-pattern regression gates (read-only).
# Run from the repo root:  sh .claude/skills/gloki-verification-and-qa/scripts/grep-gates.sh
# Exit 0 = all gates clean. Exit 1 = at least one violation (lines printed).
#
# Calibrated against HEAD c26cdc4 (2026-07-02): all three gates were CLEAN at
# that commit, so any hit after your change was introduced by your change.
# Uses POSIX grep/awk only (macOS BSD-safe: no \s, no \b).

set -u
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" || exit 2
fail=0

# ── Gate 1: $gray-400 used as TEXT colour ─────────────────────────────────
# DESIGN_SYSTEM.md: $gray-400 (#9ca3af, 2.54:1 on white) is below the AA floor
# for text; allowed ONLY for decorative/border/background/::placeholder use.
# Matches `color: $gray-400` NOT preceded by a hyphen (so border-color:/
# background-color: pass), then drops lines self-declared decorative/placeholder.
g1=$(grep -rnE '(^|[^-])color: \$gray-400' src --include='*.module.scss' 2>/dev/null \
     | grep -viE 'placeholder|decorative')
if [ -n "$g1" ]; then
  echo "GATE 1 FAIL — \$gray-400 used as text colour (use \$gray-500; see DESIGN_SYSTEM.md Caption gate):"
  echo "$g1"
  fail=1
else
  echo "GATE 1 OK — no \$gray-400 text colour"
fi

# ── Gate 2: raw hex colour in a *.module.scss property value ──────────────
# DESIGN_SYSTEM.md one rule: every colour comes from a token in
# src/styles/variables.scss — never a raw hex in component styles.
# Strips // comments per line first (hexes in comments are fine), then flags
# `<prop>: ... #abc` value positions (id selectors like `#root {` don't match).
g2=$(find src -name '*.module.scss' -exec awk '
  { line=$0; sub(/\/\/.*/, "", line);
    if (line ~ /:[^;{]*#[0-9a-fA-F]{3}/) print FILENAME ":" FNR ": " $0 }
' {} + 2>/dev/null)
if [ -n "$g2" ]; then
  echo "GATE 2 FAIL — raw hex in component SCSS (use a token from src/styles/variables.scss):"
  echo "$g2"
  fail=1
else
  echo "GATE 2 OK — no raw hex in *.module.scss values"
fi

# ── Gate 3: network escape hatch outside src/services ─────────────────────
# The seam rule (CLAUDE.md): components read/write ONLY through
# src/services/api.ts. fetch/EventSource/XHR/axios belong in src/services
# alone (ai.ts, eventStream.ts are the legitimate baseline hits there).
# `(^|[^A-Za-z_])fetch\(` catches fetch( and window.fetch( but not refetch(.
g3=$(grep -rnE '(^|[^A-Za-z_])fetch\(|axios|new EventSource|XMLHttpRequest' src \
     --include='*.ts' --include='*.tsx' 2>/dev/null \
     | grep -v '^src/services/')
if [ -n "$g3" ]; then
  echo "GATE 3 FAIL — network call outside src/services (seam rule; go through src/services/api.ts):"
  echo "$g3"
  fail=1
else
  echo "GATE 3 OK — no network calls outside src/services"
fi

[ "$fail" -eq 0 ] && echo "ALL GATES CLEAN"
exit "$fail"
