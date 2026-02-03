// Theme configuration for the application
export const themes = [
	{ id: 'light', name: 'Professional Light', icon: 'Sun' },
	{ id: 'dark', name: 'Professional Dark', icon: 'Moon' },
	{ id: 'nebula', name: 'Cosmic Nebula', icon: 'Sparkles' }
];

export const getThemeClass = (theme) => {
	// Simple pass-through since we use simple class names
	return theme || 'dark';
};
