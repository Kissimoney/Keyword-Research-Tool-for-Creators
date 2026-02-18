import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/', '/pricing'],
                disallow: ['/dashboard', '/projects', '/account', '/auth', '/api/'],
            },
        ],
        sitemap: 'https://creatorkeyword.pro/sitemap.xml',
    };
}
