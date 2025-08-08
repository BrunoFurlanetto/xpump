import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'X-Pump',
        short_name: 'X-Pump',
        description: 'A gamification app for gyms with social media features and rankings.',
        start_url: '/',
        display: 'standalone',
        background_color: '#1a1a1a',
        theme_color: '#011b2a',
        icons: [
            {
                src: '/logo/x192x192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/logo/x512x512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}