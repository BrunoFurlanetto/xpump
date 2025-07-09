import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'X-Pump',
        short_name: 'X-Pump',
        description: 'A gamification app for gyms with social media features and rankings.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ff8d46',
        theme_color: '#011b2a',
        icons: [
            {
                src: '/apple-icon.png',
                sizes: '200x200',
                type: 'image/png',
            },
        ],
    }
}