/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable SWC minification for faster builds
    swcMinify: true,

    // Optimize images
    images: {
        domains: [
            "files.edgestore.dev"
        ],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
    },

    // Enable experimental features for better performance
    experimental: {
        optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', '@clerk/clerk-react'],
    },

    // Optimize production builds
    productionBrowserSourceMaps: false,

    // Enable React strict mode for better development
    reactStrictMode: true,
}

module.exports = nextConfig
