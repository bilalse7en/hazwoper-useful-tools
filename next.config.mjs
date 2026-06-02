import { withSentryConfig } from '@sentry/nextjs';

const nextConfig = {
  // Enable source maps in production for better debugging and PageSpeed Insights compliance
  productionBrowserSourceMaps: true,

  // Configure external image domains for optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.hazwoper-osha.com',
      },
      {
        protocol: 'https',
        hostname: 'staging-media.hazwoper-osha.com',
      },
    ],
  },

  // Empty turbopack config to silence webpack warning
  turbopack: {},

  webpack: (config, { isServer }) => {
    // Add support for FFmpeg.wasm
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    // Optimize source map generation
    if (!isServer) {
      config.devtool = 'source-map';
    }

    return config;
  },

  /* config options here */
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: 'my-own-19',
  project: 'hazwoper-useful-tools',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and sourcemaps
  webpack: {
    reactComponentAnnotation: {
      enabled: true,
    },
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  // Hides source maps from visitors
  hideSourceMaps: true,
});
