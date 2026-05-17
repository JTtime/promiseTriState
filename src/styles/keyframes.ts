/**
 * All CSS keyframes and shared CSS injected once into the document.
 * No external CSS files — fully self-contained for npm distribution.
 */

const STYLE_ID = 'tristate-loader-styles';

export const CSS = `
/* ── Base variables ─────────────────────────────────── */
:root {
  --tsl-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --tsl-ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --tsl-ease-snap:   cubic-bezier(0.2, 0, 0, 1);
  --tsl-dur-fast:    180ms;
  --tsl-dur-med:     360ms;
  --tsl-dur-slow:    600ms;
}

/* ── MorphSpinner keyframes ─────────────────────────── */
@keyframes tsl-spin {
  to { transform: rotate(360deg); }
}
@keyframes tsl-dash-pending {
  0%   { stroke-dashoffset: 251; }
  50%  { stroke-dashoffset: 70; }
  100% { stroke-dashoffset: 251; stroke-dasharray: 251; }
}
@keyframes tsl-scale-in {
  0%   { transform: scale(0) rotate(-45deg); opacity: 0; }
  60%  { transform: scale(1.15) rotate(3deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes tsl-bg-fill {
  0%   { r: 0; opacity: 0; }
  100% { r: 42; opacity: 1; }
}
@keyframes tsl-ring-shrink {
  0%   { stroke-dashoffset: 0; opacity: 1; }
  100% { stroke-dashoffset: -264; opacity: 0; }
}
@keyframes tsl-check-draw {
  0%   { stroke-dashoffset: 50; }
  100% { stroke-dashoffset: 0; }
}
@keyframes tsl-cross-draw {
  0%   { stroke-dashoffset: 30; }
  100% { stroke-dashoffset: 0; }
}
@keyframes tsl-error-shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-5px); }
  40%       { transform: translateX(5px); }
  60%       { transform: translateX(-3px); }
  80%       { transform: translateX(3px); }
}
@keyframes tsl-pulse-ring {
  0%   { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(1.5); opacity: 0; }
}

/* ── PulseWave keyframes ────────────────────────────── */
@keyframes tsl-wave-bar {
  0%, 100% { transform: scaleY(0.3); }
  50%       { transform: scaleY(1); }
}
@keyframes tsl-wave-success {
  0%   { transform: scaleY(1); }
  50%  { transform: scaleY(0.1) scaleX(1.6); opacity: 0.6; }
  100% { transform: scaleY(0) scaleX(0); opacity: 0; }
}
@keyframes tsl-wave-bar-in {
  0%   { transform: scaleY(0); opacity:0; }
  100% { transform: scaleY(1); opacity:1; }
}
@keyframes tsl-tick-pop {
  0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
  60%  { transform: scale(1.2) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes tsl-error-pop {
  0%   { transform: scale(0); opacity: 0; }
  50%  { transform: scale(1.25); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

/* ── OrbitDots keyframes ────────────────────────────── */
@keyframes tsl-orbit {
  to { transform: rotate(360deg); }
}
@keyframes tsl-dot-breathe {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50%       { transform: scale(0.5); opacity: 0.3; }
}
@keyframes tsl-orbit-collapse {
  0%   { transform: rotate(var(--angle)) translateX(var(--radius)) scale(1); opacity: 1; }
  100% { transform: rotate(var(--angle)) translateX(0px) scale(0); opacity: 0; }
}
@keyframes tsl-center-pop {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}

/* ── GlassCard keyframes ────────────────────────────── */
@keyframes tsl-shimmer {
  0%   { transform: translateX(-150%) skewX(-12deg); }
  100% { transform: translateX(250%) skewX(-12deg); }
}
@keyframes tsl-glass-bar {
  0%   { width: 0%; opacity: 0.9; }
  100% { width: var(--target-w, 70%); opacity: 1; }
}
@keyframes tsl-glass-success-bg {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes tsl-float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-4px); }
}

/* ── Reduced motion ─────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  *[class^="tsl-"] {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
`;

export function injectStyles(): void {
  if (typeof document === 'undefined') return; // SSR guard
  if (document.getElementById(STYLE_ID)) return; // already injected
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}