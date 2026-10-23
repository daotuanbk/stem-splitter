import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron/simple";

export default defineConfig({
  base: "./",
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    react(),
    electron({
      main: { entry: "electron/main.ts" },
      preload: {
        input: "electron/preload.ts",
        // Sandboxed preloads must be CommonJS; a .mjs name would make Electron try to load it as ESM.
        vite: { build: { rolldownOptions: { output: { entryFileNames: "[name].cjs" } } } },
      },
    }),
  ],
});
