import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF2DF",
        paper: "#FFFFFF",
        gold: {
          DEFAULT: "#E7A233",
          dark: "#B97A1E",
        },
        chili: {
          DEFAULT: "#C6401B",
          dark: "#9E3115",
        },
        coffee: "#33241A",
        avocado: {
          DEFAULT: "#5B7B3B",
          dark: "#41591F",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        bag: "6px 6px 22px 22px",
      },
    },
  },
  plugins: [],
};

export default config;
