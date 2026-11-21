/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        root: '#07090e',
        surface: '#0d121c',
        elevated: '#141c2b',
        primary: '#f0f4fa',
        secondary: '#94a3b8',
        muted: '#475569',
        karm: {
          cyan: '#00f2fe',
          violet: '#7000ff',
          magenta: '#ff007f',
          amber: '#f59e0b',
          crimson: '#ef4444',
          sky: '#38bdf8',
          platinum: '#f1f5f9',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-active': 'rgba(0, 242, 254, 0.35)',
        }
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
