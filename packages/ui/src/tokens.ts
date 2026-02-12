// Design Tokens for ApniGully
// Clean, minimal, modern design system

export const colors = {
  // Primary - Warm teal/green for trust and community
  primary: {
    50: '#E6F7F5',
    100: '#C2EBE6',
    200: '#99DDD4',
    300: '#70CFC2',
    400: '#4DC3B3',
    500: '#2AB7A4', // Main
    600: '#24A393',
    700: '#1E8F82',
    800: '#187B71',
    900: '#125D55',
  },

  // Neutral - Clean grays
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Semantic colors
  success: {
    light: '#D1FAE5',
    main: '#10B981',
    dark: '#065F46',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#92400E',
  },
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#991B1B',
  },
  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#1E40AF',
  },

  // Special purpose
  safety: {
    light: '#FEE2E2',
    main: '#DC2626',
    dark: '#7F1D1D',
  },
  verified: {
    light: '#DBEAFE',
    main: '#2563EB',
    dark: '#1E40AF',
  },
  trusted: {
    light: '#D1FAE5',
    main: '#059669',
    dark: '#064E3B',
  },
};

export const typography = {
  // Font families
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },

  // Font sizes (rem based for accessibility)
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

export const spacing = {
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  10: '2.5rem',    // 40px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
};

export const zIndex = {
  dropdown: 1000,
  sticky: 1100,
  modal: 1200,
  popover: 1300,
  toast: 1400,
};

export const animation = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// CSS Variables for easy theming
export const cssVariables = `
:root {
  --color-primary: ${colors.primary[500]};
  --color-primary-light: ${colors.primary[100]};
  --color-primary-dark: ${colors.primary[700]};

  --color-bg: ${colors.neutral[0]};
  --color-bg-secondary: ${colors.neutral[50]};
  --color-bg-tertiary: ${colors.neutral[100]};

  --color-text: ${colors.neutral[900]};
  --color-text-secondary: ${colors.neutral[600]};
  --color-text-tertiary: ${colors.neutral[400]};

  --color-border: ${colors.neutral[200]};
  --color-border-strong: ${colors.neutral[300]};

  --color-success: ${colors.success.main};
  --color-warning: ${colors.warning.main};
  --color-error: ${colors.error.main};
  --color-info: ${colors.info.main};

  --font-sans: ${typography.fontFamily.sans};
  --font-mono: ${typography.fontFamily.mono};

  --shadow-sm: ${shadows.sm};
  --shadow-md: ${shadows.md};
  --shadow-lg: ${shadows.lg};

  --radius-sm: ${borderRadius.sm};
  --radius-md: ${borderRadius.md};
  --radius-lg: ${borderRadius.lg};
  --radius-xl: ${borderRadius.xl};

  --transition: ${animation.duration.normal} ${animation.easing.default};
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: ${colors.neutral[900]};
    --color-bg-secondary: ${colors.neutral[800]};
    --color-bg-tertiary: ${colors.neutral[700]};

    --color-text: ${colors.neutral[50]};
    --color-text-secondary: ${colors.neutral[300]};
    --color-text-tertiary: ${colors.neutral[500]};

    --color-border: ${colors.neutral[700]};
    --color-border-strong: ${colors.neutral[600]};
  }
}
`;
