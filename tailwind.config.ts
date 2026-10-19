import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        pretendard: "Pretendard Variable",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "star-pop": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.06)", boxShadow: "0 0 0 6px hsl(var(--foreground) / 0.12)" },
          "100%": { transform: "scale(1)", boxShadow: "0 0 0 0 hsl(var(--foreground) / 0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "15%": { transform: "translateX(-10px)" },
          "30%": { transform: "translateX(9px)" },
          "45%": { transform: "translateX(-7px)" },
          "60%": { transform: "translateX(5px)" },
          "75%": { transform: "translateX(-3px)" },
        },
        "destroy-flash": {
          "0%": { backgroundColor: "hsl(var(--destructive) / 0.25)" },
          "100%": { backgroundColor: "hsl(var(--destructive) / 0)" },
        },
      },
      animation: {
        "star-pop": "star-pop 0.5s ease-out",
        shake: "shake 0.5s ease-in-out",
        "destroy-flash": "destroy-flash 0.8s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
