import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep tech aesthetic - inspired by network infrastructure
        "pathrag": {
          "bg": "#0a0e14",
          "surface": "#121820",
          "surface-alt": "#1a222d",
          "border": "#2a3544",
          "accent": "#00d4aa",
          "accent-glow": "#00ffcc",
          "warning": "#ff6b35",
          "danger": "#ff3366",
          "success": "#00d4aa",
          "text": "#e8ecf1",
          "text-muted": "#6b7a8f",
        }
      },
      fontFamily: {
        "mono": ["JetBrains Mono", "Fira Code", "monospace"],
        "display": ["Space Grotesk", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "scan-line": "scan-line 4s linear infinite",
        "data-flow": "data-flow 1.5s ease-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "data-flow": {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateX(20px)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
