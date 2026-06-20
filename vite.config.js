import { defineConfig } from "vite";

export default defineConfig({
  base: "/main-experiment/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
