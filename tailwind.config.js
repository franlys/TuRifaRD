/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // eSports premium palette from Proyecto-torneos
        "neon-cyan": "#00F5FF",
        "neon-purple": "#8B5CF6",
        gold: "#FFD700",
        "dark-bg": "#0A0A0F",
        "dark-card": "#12121A",
        "dark-border": "#1E1E2E",
        "bg-primary": "#0A0A0F",
        "bg-secondary": "#12121A",
        "bg-tertiary": "#1E1E2E",
        "accent-gold": "#FFD700",
        "accent-gold-hover": "#FFE57F",
        "border-color-light": "#1E1E2E",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Rajdhani", "Orbitron", "sans-serif"],
        orbitron: ["Orbitron", "sans-serif"],
        rajdhani: ["Rajdhani", "sans-serif"],
      },
    },
  },
  plugins: [],
}
