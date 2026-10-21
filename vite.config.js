import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy dipakai agar browser tidak terkena blokir CORS saat memanggil API BMKG.
// Saat deploy, buat aturan rewrite yang sama (lihat vercel.json / netlify.toml).
const bmkg = { target: "https://api.bmkg.go.id", changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/bmkg/, "") };

const bnpb = { target: "https://gis.bnpb.go.id", changeOrigin: true, rewrite: (p) => p.replace(/^\/api\/bnpb/, "") };

export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api/bmkg": bmkg, "/api/bnpb": bnpb } },
  preview: { proxy: { "/api/bmkg": bmkg, "/api/bnpb": bnpb } },
});
