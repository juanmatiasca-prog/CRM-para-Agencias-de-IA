import type { NextConfig } from "next";

/**
 * Export estatico: Firebase Hosting (clasico) sirve HTML/JS/CSS sin servidor.
 * Toda la logica corre en el navegador, incluida la autenticacion.
 * Si en el futuro hace falta SSR o rutas de API, habra que migrar a
 * Firebase App Hosting y quitar `output: "export"`.
 */
const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
