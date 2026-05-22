import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0c",
        card: "#141417",
        cardhi: "#1c1c20",
        line: "#26262c",
        ink: "#e8e8ea",
        muted: "#6b6b73",
        good: "#7fd1a0",
        warn: "#e0b878",
        bad: "#e08c8c",
        moon: "#cdd6f4",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
