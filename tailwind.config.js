/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          400: '#4ade80',
        },
        dark: {
          DEFAULT: '#1a1a1a',
        },
        warning: {
          DEFAULT: '#fbbf24',
        }
      }
    },
  },
  plugins: [],
}
