import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: 'var(--ink-900)',
          870: 'var(--ink-870)',
          850: 'var(--ink-850)',
          820: 'var(--ink-820)',
          800: 'var(--ink-800)',
          760: 'var(--ink-760)',
          720: 'var(--ink-720)',
          680: 'var(--ink-680)',
        },
        'cl-amber': {
          DEFAULT: 'var(--amber)',
          bright: 'var(--amber-bright)',
          deep: 'var(--amber-deep)',
        },
        'cl-red': {
          DEFAULT: 'var(--red)',
          bright: 'var(--red-bright)',
        },
        'cl-copper': 'var(--copper)',
        accent: {
          DEFAULT: 'var(--accent)',
          bright: 'var(--accent-bright)',
          deep: 'var(--accent-deep)',
        },
        star: 'var(--star)',
        'cl-text': {
          DEFAULT: 'var(--text)',
          dim: 'var(--text-dim)',
          faint: 'var(--text-faint)',
          ghost: 'var(--text-ghost)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        xs: 'var(--r-xs)',
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        '2xl': 'var(--r-2xl)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        poster: 'var(--shadow-poster)',
        pop: 'var(--shadow-pop)',
      },
      transitionTimingFunction: {
        'ease-out-custom': 'var(--ease-out)',
        spring: 'var(--ease-spring)',
      },
      transitionDuration: {
        fast: 'var(--dur-fast)',
        normal: 'var(--dur)',
        slow: 'var(--dur-slow)',
      },
    },
  },
  plugins: [],
} satisfies Config;
