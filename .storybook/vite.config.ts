import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../src"),
      "@/lib": path.resolve(__dirname, "../src/lib"),
      "@/hooks": path.resolve(__dirname, "../src/hooks"),
      "@/components": path.resolve(__dirname, "../src/components"),
      "@/app": path.resolve(__dirname, "../src/app"),
    },
  },
});
