import { defineConfig } from "windicss/helpers";
import colors from "windicss/colors";
import typography from "windicss/plugin/typography";

export default defineConfig({
  darkMode: "class",
  // https://windicss.org/posts/v30.html#attributify-mode
  attributify: true,

  plugins: [typography()],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "1000px",
            color: "inherit",
            a: {
              color: colors.teal[500],
              opacity: 0.75,
              fontWeight: "500",
              textDecoration: "underline",
              "&:hover": {
                opacity: 1,
                color: colors.teal[700],
              },
            },
            b: { color: "inherit" },
            strong: { color: "inherit" },
            em: { color: "inherit" },
            h1: { color: "#059669" },
            h2: { color: "#059669" },
            h3: { color: "#059669" },
            h4: { color: "#059669" },
            ol: { padding: "0" },
            code: { color: "inherit" },
          },
        },
      },
      transitionTimingFunction: {
        explosion: "cubic-bezier(0.25, 0.1, 0.46, 1.46)",
      },
    },
  },
});
