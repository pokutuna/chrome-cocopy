// naming like Tailwindcss
export const theme = {
  space: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
  },
  size: {
    xs: '.75rem',
    sm: '.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '4rem',
  },
  font: {
    hairline: 100,
    thin: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  color: {
    gray: '#666',
  },
  fontFamily: {
    default: 'inherit',
    monospace: 'Menlo, Consolas, monospace',
  },
  constants: {
    popupWidth: '360px',
    functionHeight: '32px',
  },
} as const;
