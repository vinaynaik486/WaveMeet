/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sofia: ["Sofia Pro", "sans-serif"], // Regular (default)
        "sofia-italic": ["Sofia Pro Italic", "sans-serif"], // Italic
        "sofia-extralight": ["Sofia Pro ExtraLight", "sans-serif"], // ExtraLight
        "sofia-ultralight": ["Sofia Pro UltraLight", "sans-serif"], // UltraLight
        "sofia-extralight-italic": [
          "Sofia Pro ExtraLight Italic",
          "sans-serif",
        ], // ExtraLight Italic
        "sofia-ultralight-italic": [
          "Sofia Pro UltraLight Italic",
          "sans-serif",
        ], // UltraLight Italic
        "sofia-light": ["Sofia Pro Light", "sans-serif"], // Light
        "sofia-light-italic": ["Sofia Pro Light Italic", "sans-serif"], // Light Italic
        "sofia-medium": ["Sofia Pro Medium", "sans-serif"], // Medium
        "sofia-medium-italic": ["Sofia Pro Medium Italic", "sans-serif"], // Medium Italic
        "sofia-semibold": ["Sofia Pro SemiBold", "sans-serif"], // SemiBold
        "sofia-semibold-italic": ["Sofia Pro SemiBold Italic", "sans-serif"], // SemiBold Italic
        "sofia-bold": ["Sofia Pro Bold", "sans-serif"], // Bold
        "sofia-bold-italic": ["Sofia Pro Bold Italic", "sans-serif"], // Bold Italic
        "sofia-black": ["Sofia Pro Black", "sans-serif"], // Black
        "sofia-black-italic": ["Sofia Pro Black Italic", "sans-serif"], // Black Italic
      },
    },
  },
  plugins: [],
};
