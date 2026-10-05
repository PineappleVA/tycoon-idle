import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  // Ruta relativa: el bundle se publica en GitHub Pages bajo
  // https://<usuario>.github.io/tycoon-idle/, no en la raíz del dominio.
  // Con viteSingleFile todo va inline en index.html, así que no hay assets
  // externos, pero así tampoco se rompe si algún día se quita el plugin.
  base: "./",
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: "0.0.0.0",
    // Sin esto Vite responde 403 a cualquier host que no sea localhost, lo que
    // rompe los previews servidos detrás de un proxy (túneles, contenedores…).
    allowedHosts: true,
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
