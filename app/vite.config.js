import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  // svgr turns `import X from "./x.svg?react"` into a React component, so
  // icons render as real <svg> elements (see components/ui/Icon.jsx).
  plugins: [react(), tailwindcss(), svgr()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    host: true,
  },
});
