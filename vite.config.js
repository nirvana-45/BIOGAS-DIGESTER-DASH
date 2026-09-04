import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["react", "react-dom", "recharts", "lucide-react"],
  },
  server: {
    host: true, // bind to 0.0.0.0 so other devices/browsers on the LAN can connect, not just 127.0.0.1
    port: 5173,
    strictPort: false,
    open: true,
  },
  preview: {
    host: true,
    port: 4173,
  },
});
