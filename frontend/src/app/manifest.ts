import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Start - Gamificação para Academias",
    short_name: "Start",
    description:
      "App de gamificação para academias com ranking, redes sociais e desafios. Registre treinos, acompanhe nutrição e compete com amigos.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#1a1a1a",
    theme_color: "#011b2a",
    categories: ["fitness", "health", "lifestyle", "sports"],
    // Adicionar ícones com múltiplos propósitos
    icons: [
      // Ícones maskable (para adaptar em diferentes dispositivos)
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
      // Ícones any (para compatibilidade máxima)
      {
        src: "/logo/x192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo/x512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    // Adicionar screenshots para a loja do PWA (opcional mas recomendado)
    // screenshots: [
    //   {
    //     src: "/screenshots/home.png",
    //     sizes: "1080x1920",
    //     type: "image/png",
    //     form_factor: "narrow",
    //   },
    // ],
    // Adicionar shortcuts (atalhos na tela inicial)
    shortcuts: [
      {
        name: "Registrar Treino",
        short_name: "Treino",
        description: "Registre seu treino rapidamente",
        url: "/workouts/register",
        icons: [{ src: "/logo/x192x192.png", sizes: "192x192" }],
      },
      {
        name: "Ver Ranking",
        short_name: "Ranking",
        description: "Veja o ranking dos grupos",
        url: "/groups",
        icons: [{ src: "/logo/x192x192.png", sizes: "192x192" }],
      },
      {
        name: "Perfil",
        short_name: "Perfil",
        description: "Acesse seu perfil",
        url: "/profile",
        icons: [{ src: "/logo/x192x192.png", sizes: "192x192" }],
      },
    ],
    // Adicionar informações de preferências
    prefer_related_applications: false,
    // Adicionar share target (para compartilhar conteúdo no app)
    share_target: {
      action: "/share",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
  };
}
