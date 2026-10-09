import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // アプリ全体のメインカラー（水色系）。変えたいときはここだけ直せばOKです。
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
        // サイドバーや見出しに使う濃い紺色
        navy: {
          500: "#3a6ea5",
          600: "#2f5d8f",
          700: "#284f7a",
          800: "#224366",
          900: "#1c3756",
        },
      },
    },
  },
  plugins: [],
};

export default config;
