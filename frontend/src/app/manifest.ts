import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "X-Pump - Gamificação para Academias",
    short_name: "X-Pump",
    description:
      "App de gamificação para academias com ranking, redes sociais e desafios. Registre treinos, acompanhe nutrição e compete com amigos.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1a1a1a",
    theme_color: "#011b2a",
    categories: ["fitness", "health", "lifestyle", "sports"],
    icons: [
      {
        src: "/logo/x192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logo/x512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
