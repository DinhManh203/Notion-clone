/** @type {import('next').NextConfig} */
const nextConfig = {
    // Optimize images with new remotePatterns format
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'files.edgestore.dev',
            },
            {
                protocol: 'https',
                hostname: 'img.clerk.com',
            },
        ],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
    },

    // Fix workspace root warning
    outputFileTracingRoot: require('path').join(__dirname),

    // External packages for server components (reduce bundle size)
    serverExternalPackages: ['googleapis', 'pdfmake', 'html2canvas', 'jspdf'],

    // Enable experimental features for better performance
    experimental: {
        optimizePackageImports: [
            'lucide-react',
            '@radix-ui/react-icons',
            '@clerk/clerk-react',
            '@blocknote/core',
            '@blocknote/react',
            '@blocknote/mantine',
            '@mui/icons-material',
            '@mui/material',
            '@emotion/react',
            '@emotion/styled',
        ],
    },

    // Modularize imports for better tree-shaking
    modularizeImports: {
        '@mui/icons-material': {
            transform: '@mui/icons-material/{{member}}',
        },
    },

    // Webpack optimizations
    webpack: (config, { dev, isServer }) => {
        // Enable caching for faster rebuilds
        config.cache = {
            type: 'filesystem',
            buildDependencies: {
                config: [__filename],
            },
        };

        // Optimize module resolution
        config.resolve.alias = {
            ...config.resolve.alias,
        };

        // Reduce bundle size in production
        if (!dev && !isServer) {
            config.optimization = {
                ...config.optimization,
                moduleIds: 'deterministic',
                runtimeChunk: 'single',
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        default: false,
                        vendors: false,
                        // Vendor chunk for node_modules
                        vendor: {
                            name: 'vendor',
                            chunks: 'all',
                            test: /node_modules/,
                            priority: 20,
                        },
                        // Common chunk for shared code
                        common: {
                            name: 'common',
                            minChunks: 2,
                            chunks: 'all',
                            priority: 10,
                            reuseExistingChunk: true,
                            enforce: true,
                        },
                    },
                },
            };
        }

        return config;
    },

    // Optimize production builds
    productionBrowserSourceMaps: false,

    // Enable React strict mode for better development
    reactStrictMode: true,

    // Reduce compilation overhead
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
    },
}

module.exports = nextConfig
