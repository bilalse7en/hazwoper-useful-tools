const nextConfig={
	// Empty turbopack config to silence webpack warning
	turbopack: {},
	webpack: (config, { isServer }) => {
		// Add support for FFmpeg.wasm
		config.resolve.fallback = {
			...config.resolve.fallback,
			fs: false,
			path: false,
		};
		
		return config;
	},
	/* config options here */
};

export default nextConfig;
