/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Claro brand red (from the 01.plan_type_parametrizador design system),
        // overriding Tailwind's default "red" scale so every existing red-*
        // utility class in the app resolves to the brand color automatically.
        red: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#f24d43',
          600: '#E63027',
          700: '#CC2922',
          800: '#a3211b',
          900: '#7a1915',
          950: '#450a0a',
        },
      },
      fontFamily: {
        sans: ['Barlow', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['Barlow Condensed', 'Barlow', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  darkMode: "class",
  plugins: [],
}
