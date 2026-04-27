// frontend/src/theme.ts 

export const theme = {
  colors: {
    // Sidebar
    sidebarBg: '#0d2b1a',
    sidebarText: '#a8c5b5',
    sidebarTextActive: '#ffffff',
    sidebarAccent: '#1a7a4a',
    sidebarHover: '#162e1e',
    sidebarBorder: '#1a3d25',

    
    // Main
    pageBg: '#f4f5f2',
    surface: '#ffffff',
    surfaceHover: '#f9faf7',
    border: '#e4e7e1',
    borderLight: '#eef0eb',

    // Brand
    primary: '#1a7a4a',
    primaryHover: '#156040',
    primaryLight: '#e8f4ee',

    // Text
    textPrimary: '#1a1f1c',
    textSecondary: '#5a6b62',
    textMuted: '#8fa398',

    // Status
    sinFacturar: { bg: '#fef9ec', text: '#92660a', dot: '#f0b429' },
    facturada:   { bg: '#eaf4ff', text: '#0c5a9e', dot: '#3b9ede' },
    pagada:      { bg: '#e8f4ee', text: '#1a5c35', dot: '#1a7a4a' },

    // Fletero 
    fletero: { bg: '#f0eaff', text: '#5b21b6' },

    // Cliente
    cliente: { bg: '#eaf4ff', text: '#0c5a9e' },

    // Danger
    danger: '#c0392b',
    dangerLight: '#fdf0ef',
    dangerHover: '#a93226',
  },
  font: {
    family: '"DM Sans", sans-serif',
    size: {
      xs: '11px',
      sm: '13px',
      base: '14px',
      md: '15px',
      lg: '18px',
      xl: '22px',
      xxl: '28px',
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  shadow: {
    sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    md: '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
    lg: '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.04)',
  },
  sidebar: {
    width: '200px',
    widthCollapsed: '64px',
  },
}