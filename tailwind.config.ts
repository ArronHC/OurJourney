import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        journal: {
          bg: "#f0e8dc",
          paper: "#fffdf8",
          text: "#5a4a3a",
          "text-secondary": "#8b6f5e",
          "text-muted": "#b8a090",
          accent: "#c47d5a",
          gold: "#d4a574",
          border: "#e8d5c4",
          binding: "#e0c4a8",
        },
        ticket: {
          "flight-start": "#ffffff",
          "flight-end": "#f8f4ef",
          "flight-border": "#e0d0c0",
          "train-start": "#f8f0f2",
          "train-end": "#ffffff",
          "train-border": "#e0c8cc",
          "hotel-start": "#f0f4f8",
          "hotel-end": "#ffffff",
          "hotel-border": "#c8d4e0",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
      },
      maxWidth: {
        journal: "680px",
      },
    },
  },
  plugins: [],
};

export default config;
