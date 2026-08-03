/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],

  // Off: hand-written CSS
  corePlugins: {
    preflight: false,
  },

  theme: {
    // Mirrors existing stylesheet breakpoints
    screens: {
      xs: "360px",
      sm: "480px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
      boxShadow: {
        card: "0 1px 3px rgb(15 23 42 / 0.06), 0 1px 2px rgb(15 23 42 / 0.04)",
        "card-hover": "0 12px 28px rgb(15 23 42 / 0.10), 0 4px 10px rgb(15 23 42 / 0.06)",
        auth: "0 20px 40px rgb(0 0 0 / 0.08), 0 4px 12px rgb(0 0 0 / 0.05)",
        ring: "0 0 0 4px rgb(99 102 241 / 0.12)",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.6s ease",
      },
    },
  },

  plugins: [],
};
