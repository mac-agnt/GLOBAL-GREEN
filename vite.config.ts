import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // The whole prototype ships as one screen; one ~1.2 MB chunk (300 kB gzipped) is expected
  // now that the Global Green modules are included.
  build: { chunkSizeWarningLimit: 1400 },
});
