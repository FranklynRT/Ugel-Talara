import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  server: {
    host: '0.0.0.0', // Permite acceso desde cualquier IP (red local y ngrok)
    port: parseInt(process.env.PORT || '5173'),
    strictPort: false, // Permitir otro puerto si 5173 está ocupado
    open: false, // No abrir automáticamente el navegador
    hmr: {
      host: 'localhost', // HMR solo en localhost para mejor rendimiento
      port: 5173, // Puerto para Hot Module Replacement
    },
    cors: true, // Habilitar CORS para acceso desde otros dispositivos
  },
  optimizeDeps: {
    exclude: ['react-router-dom'], // Excluir react-router-dom de la optimización automática
    force: true, // Forzar re-optimización para resolver problemas de dependencias
  },
});
