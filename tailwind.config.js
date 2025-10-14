/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'bee-yellow': '#F6C445',
        'bee-dark': '#1F2937',
        'bee-green': '#0FA958',
        'bee-amber': '#F59E0B',
        'bee-red': '#EF4444',
      },
      boxShadow: {
        soft: '0 10px 25px -10px rgba(0,0,0,0.15)'
      },
      borderRadius: {
        '2xl': '1rem'
      }
    },
  },
  plugins: [],
}
