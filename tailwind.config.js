/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        galenic: {
          base:     '#0F172A',   // deep navy — page background
          surface:  '#1E293B',   // card surface
          elevated: '#263348',   // inputs / table headers
          border:   '#334155',   // visible dividers
          primary:  '#F8FAFC',   // near-white titles
          muted:    '#94A3B8',   // cold-gray secondary text
          accent:   '#2DD4BF',   // teal/mint — actions & active states
          danger:   '#EF4444',   // red alerts
          ok:       '#10B981',   // green success
          warning:  '#F59E0B',   // amber — pharmaceutical flacon yellow
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow':    '0 0 24px rgba(45, 212, 191, 0.18)',
        'glow-sm': '0 0 12px rgba(45, 212, 191, 0.12)',
        'dark':    '0 8px 32px rgba(0, 0, 0, 0.45)',
        'card':    '0 2px 12px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
