import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tabellone: {
          primary: "#4C4BFF",
          navy: "#1e3a5f",
          magenta: "#E647A7",
          secondary: "#FF8C3A",
          accent: "#e85d04",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
