/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sofia: ["Sofia Pro", "sans-serif"],
        "sofia-italic": ["Sofia Pro Italic", "sans-serif"],
        "sofia-extralight": ["Sofia Pro ExtraLight", "sans-serif"],
        "sofia-ultralight": ["Sofia Pro UltraLight", "sans-serif"],
        "sofia-extralight-italic": [
          "Sofia Pro ExtraLight Italic",
          "sans-serif",
        ],
        "sofia-ultralight-italic": [
          "Sofia Pro UltraLight Italic",
          "sans-serif",
        ],
        "sofia-light": ["Sofia Pro Light", "sans-serif"],
        "sofia-light-italic": ["Sofia Pro Light Italic", "sans-serif"],
        "sofia-medium": ["Sofia Pro Medium", "sans-serif"],
        "sofia-medium-italic": ["Sofia Pro Medium Italic", "sans-serif"],
        "sofia-semibold": ["Sofia Pro SemiBold", "sans-serif"],
        "sofia-semibold-italic": ["Sofia Pro SemiBold Italic", "sans-serif"],
        "sofia-bold": ["Sofia Pro Bold", "sans-serif"],
        "sofia-bold-italic": ["Sofia Pro Bold Italic", "sans-serif"],
        "sofia-black": ["Sofia Pro Black", "sans-serif"],
        "sofia-black-italic": ["Sofia Pro Black Italic", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
