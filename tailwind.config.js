/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["GoogleSansFlex", "sans-serif"],
        google: ["GoogleSansFlex", "sans-serif"],
      },
      colors: {
        primary: {
          50: "#e8f2fd",
          100: "#cce0fa",
          200: "#99c1f5",
          300: "#66a2f0",
          400: "#3383eb",
          500: "#0064e6",
          600: "#0061cf",
          700: "#004d9c",
          800: "#003969",
          900: "#002436",
        },
        secondary: {
          50: "#e6f7ed",
          100: "#ccefdb",
          200: "#99dfb7",
          300: "#66cf93",
          400: "#33bf6f",
          500: "#0daf58",
          600: "#0aa351",
          700: "#088242",
          800: "#066233",
          900: "#044124",
        },
      },
    },
  },
  plugins: [],
};
