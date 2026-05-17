/**
 * GlassCard
 *
 * A frosted-glass card with a traveling shimmer while pending.
 * On fulfilled → shimmer stops, card "fills in" with a soft glow + check label.
 * On rejected  → card border turns red and shakes, error label appears.
 *
 * Perfect for full-section loaders (replacing a content card while loading).
 * Width/height are fully configurable.
 */

import { useEffect } from 'react';
import type { PromiseStatus } from '@/types';
import { injectStyles } from '../../styles/keyframes';

export interface GlassCardProps {
  status: PromiseStatus;
  width?: number | string;
  height?: number | string;
  color?: string;
  errorColor?: string;
  successMessage?: string;
  errorMessage?: string;
  /** Show fake skeleton lines inside card while pending */
  showSkeletonLines?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function s(obj: Record<string, string | number | undefined>): React.CSSProperties {
  return obj as React.CSSProperties;
}

export function GlassCard({
  status,
  width = 280,
  height = 160,
  color = '#6C63FF',
  errorColor = '#EF4444',
  successMessage = 'Loaded',
  errorMessage = 'Failed to load',
  showSkeletonLines = true,
  className = '',
  style = {},
}: GlassCardProps) {
  useEffect(() => { injectStyles(); }, []);

  const isPending   = status === 'pending';
  const isFulfilled = status === 'fulfilled';
  const isRejected  = status === 'rejected';
  const isIdle      = status === 'idle';

  // Derived colors
  const borderColor = isRejected ? errorColor : isFulfilled ? color : 'rgba(120,120,150,0.25)';
  const bgColor     = isRejected
    ? `${errorColor}10`
    : isFulfilled
    ? `${color}10`
    : 'rgba(255,255,255,0.04)';

  const skeletonLines = [
    { w: '75%', delay: 0 },
    { w: '55%', delay: 0.1 },
    { w: '85%', delay: 0.2 },
    { w: '45%', delay: 0.15 },
  ];

  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      aria-label={
        isPending ? 'Loading content…'
        : isFulfilled ? successMessage
        : isRejected ? errorMessage
        : ''
      }
      style={{
        position: 'relative',
        width,
        height,
        borderRadius: 16,
        border: `1.5px solid ${borderColor}`,
        background: bgColor,
        backdropFilter: 'blur(12px)',
        overflow: 'hidden',
        transition: [
          'border-color 0.4s ease',
          'background 0.4s ease',
          'box-shadow 0.4s ease',
        ].join(', '),
        boxShadow: isFulfilled
          ? `0 0 0 3px ${color}22, 0 8px 32px ${color}18`
          : isRejected
          ? `0 0 0 3px ${errorColor}22`
          : '0 4px 24px rgba(0,0,0,0.12)',
        animation: isRejected
          ? 'tsl-error-shake 0.5s var(--tsl-ease-smooth) 0.1s'
          : 'none',
        ...style,
      }}
    >
      {/* ── Shimmer sweep (pending only) ── */}
      {(isPending || isIdle) && (
        <div
          style={s({
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(
              105deg,
              transparent 30%,
              rgba(255,255,255,0.12) 50%,
              transparent 70%
            )`,
            animation: isPending
              ? 'tsl-shimmer 1.6s ease-in-out infinite'
              : 'none',
            pointerEvents: 'none',
          })}
        />
      )}

      {/* ── Skeleton lines (pending) ── */}
      {showSkeletonLines && (isPending || isIdle) && (
        <div style={s({
          position: 'absolute',
          inset: 0,
          padding: '20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          justifyContent: 'center',
        })}>
          {/* Avatar circle placeholder */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 6,
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(120,120,150,0.18)',
              flexShrink: 0,
            }} />
            <div style={{
              height: 10,
              borderRadius: 5,
              width: '40%',
              background: 'rgba(120,120,150,0.18)',
            }} />
          </div>
          {skeletonLines.map((line, i) => (
            <div
              key={i}
              style={{
                height: 9,
                borderRadius: 5,
                width: line.w,
                background: 'rgba(120,120,150,0.15)',
                animationDelay: `${line.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Success state ── */}
      {isFulfilled && (
        <div
          style={s({
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            animation: 'tsl-glass-success-bg 0.4s ease forwards',
          })}
        >
          {/* Check circle */}
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'tsl-center-pop 0.5s var(--tsl-ease-spring) 0.1s both',
            boxShadow: `0 4px 16px ${color}55`,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <polyline
                points="4,13 9,18 20,6"
                stroke="white"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="50"
                strokeDashoffset="50"
                style={s({
                  animation: 'tsl-check-draw 0.3s var(--tsl-ease-spring) 0.45s forwards',
                })}
              />
            </svg>
          </div>
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: color,
            letterSpacing: '0.02em',
            animation: 'tsl-glass-success-bg 0.4s ease 0.5s both',
            opacity: 0,
          }}>
            {successMessage}
          </span>
        </div>
      )}

      {/* ── Error state ── */}
      {isRejected && (
        <div style={s({
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          animation: 'tsl-glass-success-bg 0.3s ease forwards',
        })}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: errorColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'tsl-center-pop 0.4s var(--tsl-ease-spring) 0.05s both',
            boxShadow: `0 4px 16px ${errorColor}44`,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <line x1="6" y1="6" x2="18" y2="18"
                stroke="white" strokeWidth={2.5} strokeLinecap="round"
                strokeDasharray="20" strokeDashoffset="20"
                style={s({ animation: 'tsl-cross-draw 0.2s ease 0.3s forwards' })}
              />
              <line x1="18" y1="6" x2="6" y2="18"
                stroke="white" strokeWidth={2.5} strokeLinecap="round"
                strokeDasharray="20" strokeDashoffset="20"
                style={s({ animation: 'tsl-cross-draw 0.2s ease 0.38s forwards' })}
              />
            </svg>
          </div>
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: errorColor,
            letterSpacing: '0.02em',
            animation: 'tsl-glass-success-bg 0.3s ease 0.45s both',
            opacity: 0,
          }}>
            {errorMessage}
          </span>
        </div>
      )}
    </div>
  );
}