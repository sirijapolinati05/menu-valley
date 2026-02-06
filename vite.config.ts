import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react-swc";
  import path from "path";

  export default defineConfig({
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react()],
    resolve: {
      extensions: [".js", ".jsx", ".ts", ".tsx"],
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@contexts": path.resolve(__dirname, "./src/contexts"),
      },
    },
    optimizeDeps: {
      include: ['exceljs'],
    },
  });