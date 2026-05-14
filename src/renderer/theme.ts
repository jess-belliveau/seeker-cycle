// California 8-bit color palette
export const C = {
  // Backgrounds
  bgDark:    '#1a0a2e',
  bgMid:     '#2d1b4e',
  bgLight:   '#3d2a5e',

  // Sunset / primary
  orange:    '#ff6b35',
  orangeDim: '#cc4400',
  amber:     '#ffaa00',
  yellow:    '#ffee10',

  // Neon accents
  pink:      '#ff2d78',
  cyan:      '#00e5ff',
  green:     '#39ff14',
  purple:    '#9b5de5',

  // Ocean
  ocean:     '#1a6bff',
  oceanDark: '#0d3d99',

  // Text
  white:     '#f0e8d0',
  dim:       '#a090b0',
  muted:     '#605070',

  // UI chrome
  border:    '#ff6b35',
  borderDim: '#604030',
  black:     '#000000',
  shadow:    '#000000',
} as const

// Pixel-raised card  — pass a border colour
export function pixelBox(borderColor: string = C.border, bg: string = C.bgMid): React.CSSProperties {
  return {
    background: bg,
    border: `3px solid ${borderColor}`,
    boxShadow: `4px 4px 0 ${C.black}`,
    borderRadius: 0,
  }
}

// Pixel raised button
export function pixelBtn(color: string = C.orange): React.CSSProperties {
  return {
    background: color,
    border: `3px solid ${C.black}`,
    boxShadow: `4px 4px 0 ${C.black}`,
    borderRadius: 0,
    color: C.black,
    fontFamily: "'Press Start 2P', monospace",
    cursor: 'pointer',
    outline: 'none',
  }
}

// Dithered sunset sky background
export const sunsetBg: React.CSSProperties = {
  background: `
    linear-gradient(
      180deg,
      #0d0221 0%,
      #1a0a2e 25%,
      #3d1c5e 45%,
      #7b2d4e 60%,
      #c45c35 75%,
      #ff8c20 88%,
      #ffcc44 100%
    )
  `
}

// Needed for the type annotation above
import type React from 'react'
