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
          base:     '#0d0f14',
          surface:  '#151821',
          elevated: '#1e2231',
          border:   '#2a2f42',
          primary:  '#e8ecf4',
          muted:    '#6b7494',
          accent:   '#00c2a8',
          danger:   '#e03c3c',
          ok:       '#2eb87e',
          warning:  '#e09b3c',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
