// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FFF8F0",
        pinkpaw: "#FADADD",
        pawBrown: "#7A5D52",
        catGray: "#5A5A5A",
      },
      keyframes: {
        bob: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        tail: { "0%,100%": { transform: "rotate(0deg)" }, "50%": { transform: "rotate(12deg)" } },
        pawstep: {
          "0%": { opacity: "0", transform: "translateY(6px) scale(0.95)" },
          "30%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(-6px) scale(1)" },
        },
        blink: { "0%,92%,100%": { transform: "scaleY(1)" }, "95%": { transform: "scaleY(0.05)" } },
      },
      animation: {
        bob: "bob 1.6s ease-in-out infinite",
        tail: "tail 1.2s ease-in-out infinite",
        pawstep: "pawstep 1.4s ease-in-out infinite",
        blink: "blink 3.4s ease-in-out infinite",
      },
      boxShadow: { soft: "0 10px 30px rgba(250,218,221,0.55)" },
      borderRadius: { "2xl": "1.25rem", "3xl": "1.75rem" },
    },
  },
  plugins: [],
};
export default config;
