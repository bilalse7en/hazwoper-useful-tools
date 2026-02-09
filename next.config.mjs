const nextConfig={
	// Enable source maps in production for better debugging and PageSpeed Insights compliance
	productionBrowserSourceMaps: true,
	
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
				source: "/:path*",
				headers: [
					{
						key: "X-DNS-Prefetch-Control",
						value: "on"
					},
					{
						key: "Strict-Transport-Security",
						value: "max-age=63072000; includeSubDomains; preload"
					},
					{
						key: "X-XSS-Protection",
						value: "1; mode=block"
					},
					{
						key: "X-Frame-Options",
						value: "SAMEORIGIN"
					},
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), geolocation=()"
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff"
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin"
					}
				]
			}
		];
	},
};

export default nextConfig;
