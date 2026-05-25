import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { yahooProxyPlugin } from "./server/yahooProxy";

export default defineConfig({
  plugins: [react(), yahooProxyPlugin()],
});
