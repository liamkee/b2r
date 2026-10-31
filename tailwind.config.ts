import type { Config } from "tailwindcss";

// Tailwind v4 is CSS-first (see app/globals.css `@import "tailwindcss"`).
// This file is kept for Task 1 file-list parity and IDE tooling;
// theme customization belongs in CSS via `@theme`.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
};

export default config;
