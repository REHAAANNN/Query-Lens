/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        blue: {
          500: '#3b82f6',
          900: '#1e3a8a',
        },
        cyan: {
          500: '#06b6d4',
        },
      },
    },
  },
  plugins: [],
};
