import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface: "#111111",
        "surface-alt": "#1a1a1a",
        foreground: "#ffffff",
        primary: {
          DEFAULT: "#00ff88",
          muted: "#10b981",
          glow: "rgba(0,255,136,0.15)",
        },
        destructive: "#ef4444",
        border: "rgba(255,255,255,0.06)",
        "border-hover": "rgba(255,255,255,0.1)",
        "text-secondary": "rgba(255,255,255,0.5)",
        "text-muted": "rgba(255,255,255,0.3)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "33%": { transform: "translate(30px, -30px)" },
          "66%": { transform: "translate(-20px, 20px)" },
        },
      },
      animation: {
        float: "float 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
