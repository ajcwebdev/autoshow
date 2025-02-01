import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
  vite: {
    server: {
        allowedHosts: "autoshow.up.railway.app",
    }
  },
});