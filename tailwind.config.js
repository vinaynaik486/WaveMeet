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
      },
    },
  },
  plugins: [],
};
