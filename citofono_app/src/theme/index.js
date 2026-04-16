// src/theme/index.js
// Sistema de temas claro/oscuro completo

export const DARK = {
  mode: 'dark',
  // Fondos
  bg:       '#0f1117',
  surface:  '#1a1f2e',
  surface2: '#242938',
  surface3: '#2d3448',
  card:     '#1a1f2e',
  // Texto
  text:     '#e2e8f0',
  textSub:  '#94a3b8',
  textHint: '#64748b',
  // Acento principal
  accent:   '#f97316',
  accentBg: 'rgba(249,115,22,0.15)',
  // Colores semánticos
  green:    '#4ade80',
  greenBg:  'rgba(74,222,128,0.12)',
  red:      '#f87171',
  redBg:    'rgba(248,113,113,0.12)',
  blue:     '#38bdf8',
  blueBg:   'rgba(56,189,248,0.12)',
  amber:    '#fbbf24',
  amberBg:  'rgba(251,191,36,0.12)',
  // Bordes
  border:   '#2d3448',
  border2:  '#3d4458',
  // Sombra
  shadow:   '#000',
  // Botones
  btnPrimary:   '#f97316',
  btnPrimaryTxt:'#ffffff',
  btnSecondary: '#242938',
  btnSecTxt:    '#e2e8f0',
  btnDanger:    'rgba(248,113,113,0.15)',
  btnDangerTxt: '#f87171',
  // Input
  inputBg:    '#242938',
  inputBorder:'#3d4458',
  inputText:  '#e2e8f0',
  placeholder:'#64748b',
  // Navegación
  navBg:      '#1a1f2e',
  navBorder:  '#2d3448',
  navActive:  '#f97316',
  navInactive:'#64748b',
  // Status bar
  statusBar:  'light-content',
}

export const LIGHT = {
  mode: 'light',
  bg:       '#f8fafc',
  surface:  '#ffffff',
  surface2: '#f1f5f9',
  surface3: '#e2e8f0',
  card:     '#ffffff',
  text:     '#0f172a',
  textSub:  '#475569',
  textHint: '#94a3b8',
  accent:   '#1e40af',
  accentBg: 'rgba(30,64,175,0.1)',
  green:    '#16a34a',
  greenBg:  'rgba(22,163,74,0.1)',
  red:      '#dc2626',
  redBg:    'rgba(220,38,38,0.1)',
  blue:     '#0284c7',
  blueBg:   'rgba(2,132,199,0.1)',
  amber:    '#d97706',
  amberBg:  'rgba(217,119,6,0.1)',
  border:   '#e2e8f0',
  border2:  '#cbd5e1',
  shadow:   '#94a3b8',
  btnPrimary:   '#1e40af',
  btnPrimaryTxt:'#ffffff',
  btnSecondary: '#f1f5f9',
  btnSecTxt:    '#0f172a',
  btnDanger:    'rgba(220,38,38,0.1)',
  btnDangerTxt: '#dc2626',
  inputBg:    '#f8fafc',
  inputBorder:'#cbd5e1',
  inputText:  '#0f172a',
  placeholder:'#94a3b8',
  navBg:      '#ffffff',
  navBorder:  '#e2e8f0',
  navActive:  '#1e40af',
  navInactive:'#94a3b8',
  statusBar:  'dark-content',
}

// Espaciado y radios consistentes
export const SPACING = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
}

export const RADIUS = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 999,
}

export const FONT = {
  xs:   11, sm: 13, md: 15, lg: 18, xl: 22, xxl: 28, xxxl: 36,
  bold: '700', semibold: '600', medium: '500', regular: '400',
}

export const SHADOW = (theme) => ({
  shadowColor: theme.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: theme.mode === 'dark' ? 0.4 : 0.08,
  shadowRadius: 8,
  elevation: 4,
})
