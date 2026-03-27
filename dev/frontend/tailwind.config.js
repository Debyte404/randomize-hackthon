/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: '#1a1a1a', // aggressive beige/gray
          text: '#f0f0f0',
          accent: '#06b6d4', // cyan OS
        }
      }
    },
  },
  plugins: [],
}
