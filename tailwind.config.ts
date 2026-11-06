import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff8e6", 100: "#feecbf", 200: "#fdd980", 300: "#fbc447",
          400: "#f4ae1f", 500: "#e8a317", 600: "#c07f0d", 700: "#935d0e", 800: "#6b4310", 900: "#4a2e0e",
        },
        ink: { 50: "#f7f4f3", 100: "#ece6e4", 200: "#d6cbc8", 300: "#b3a39f", 400: "#8a7772",
               500: "#6a5753", 600: "#4f3f3c", 700: "#3a2a28", 800: "#2a1b19", 900: "#270403", 950: "#1a0302" },
      },
      boxShadow: { card: "0 1px 2px rgba(39,4,3,.06), 0 4px 16px rgba(39,4,3,.06)" },
    },
  },
  plugins: [],
};
export default config;
