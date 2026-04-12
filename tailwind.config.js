/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // All tokens driven by CSS custom properties so light/dark toggle
        // works without adding dark: to every class in the codebase.
        galenic: {
          base:    'rgb(var(--gc-base)    / <alpha-value>)',
          surface: 'rgb(var(--gc-surface) / <alpha-value>)',
          elevated:'rgb(var(--gc-elevated)/ <alpha-value>)',
          border:  'rgb(var(--gc-border)  / <alpha-value>)',
          primary: 'rgb(var(--gc-primary) / <alpha-value>)',
          muted:   'rgb(var(--gc-muted)   / <alpha-value>)',
          accent:  'rgb(var(--gc-accent)  / <alpha-value>)',
          danger:  'rgb(var(--gc-danger)  / <alpha-value>)',
          ok:      'rgb(var(--gc-ok)      / <alpha-value>)',
          warning: 'rgb(var(--gc-warning) / <alpha-value>)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow':    'var(--shadow-glow)',
        'glow-sm': 'var(--shadow-glow-sm)',
        'dark':    'var(--shadow-dark)',
        'card':    'var(--shadow-card)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-3px)' },
          '40%, 80%': { transform: 'translateX(3px)' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
}
