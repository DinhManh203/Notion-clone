/** @type {import('next').NextConfig} */
const nextConfig = {
    // Tối ưu hóa hình ảnh với định dạng remotePatterns mới.
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

    // Phân chia các lệnh nhập khẩu thành các mô-đun để tối ưu hóa việc loại bỏ mã không cần thiết.
    modularizeImports: {
        '@mui/icons-material': {
            transform: '@mui/icons-material/{{member}}',
        },
    },

    // Tối ưu hóa Webpack
    webpack: (config, { dev, isServer }) => {
        config.cache = {
            type: 'filesystem',
            buildDependencies: {
                config: [__filename],
            },
        };

        config.resolve.alias = {
            ...config.resolve.alias,
            'yjs': require.resolve('yjs'),
        };


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
                        vendor: {
                            name: 'vendor',
                            chunks: 'all',
                            test: /node_modules/,
                            priority: 20,
                        },
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

    productionBrowserSourceMaps: false,

    reactStrictMode: true,

    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
    },
}

module.exports = nextConfig
