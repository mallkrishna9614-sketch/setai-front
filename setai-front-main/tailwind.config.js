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
        neutral: {
          950: '#0e1217', // Base canvas background
          900: '#151a22', // Primary panel background
          850: '#1c222c', // Elevated surface
          800: '#262d38', // Hairline borders & subtle dividers
          700: '#374151',
          600: '#4b5563',
          500: '#6b7280',
          400: '#9ca3af',
          300: '#d1d5db',
          200: '#e5e7eb',
          100: '#f3f4f6',
          50:  '#f9fafb',
        },
        brand: {
          teal: '#0d9488',
          tealHover: '#14b8a6',
          tealMuted: 'rgba(13, 148, 136, 0.12)',
        },
        status: {
          success: '#10b981',
          successMuted: 'rgba(16, 185, 129, 0.12)',
          warning: '#d97706',
          warningMuted: 'rgba(217, 119, 6, 0.12)',
          error: '#dc2626',
          errorMuted: 'rgba(220, 38, 38, 0.12)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
