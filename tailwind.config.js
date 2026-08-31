/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        canvas: '#f4f7f9',
        ink: '#0f172a',
        muted: '#64748b',
        line: '#dce4ed',
        gold: '#e0b142',
        stone: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
        },
      },
      boxShadow: {
        panel: '0 1px 1px rgba(15, 23, 42, 0.02)',
      },
    },
  },
  plugins: [],
}
