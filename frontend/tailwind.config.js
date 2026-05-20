/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'flame': 'flame-breathing 2s ease-in-out infinite',
      },
      keyframes: {
        'flame-breathing': {
          '0%, 100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.4))' },
          '50%': { transform: 'scale(1.1)', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.7))' },
        }
      }
    },
  },
  plugins: [],
}
