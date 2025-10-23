﻿import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Minimal Vite + React + proxy -> backend på 8000
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
