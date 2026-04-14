/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        fkBlue: "#2874f0",
        fkOrange: "#fb641b",
        fkYellow: "#ffe11b"
      },
      fontFamily: {
        sans: ["Segoe UI", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 4px rgba(0,0,0,.16)"
      }
    }
  },
  plugins: []
};
