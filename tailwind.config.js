/** @type {import("tailwindcss").Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: { 900: "#0B0F17" },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.35)",
      },
      borderColor: {
        stroke: "rgba(255,255,255,0.08)",
      },
    },
  },
  plugins: [],
};
