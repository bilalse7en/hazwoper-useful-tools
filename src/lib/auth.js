// USERS moved to server-side API

export const ROLES={
	admin: ['*'],
	blog_creator: ['blog', 'html-cleaner', 'image-converter', 'video-compressor', 'image-to-text', 'document-extractor', 'ai-assistant'],
	content_creator: ['course', 'glossary', 'resources', 'html-cleaner', 'image-converter', 'video-compressor', 'image-to-text', 'document-extractor', 'ai-assistant'],
	user: ['html-cleaner', 'image-converter', 'video-compressor', 'image-to-text', 'document-extractor', 'ai-assistant']
};

export const NAV_ITEMS=[
	{id: "course",label: "Web Content Generator",icon: "GraduationCap"},
	{id: "glossary",label: "Glossary Generator",icon: "BookOpen"},
	{id: "resources",label: "Resource Generator",icon: "FileSpreadsheet"},
	{id: "blog",label: "Blog Generator",icon: "PenTool"},
	{id: "html-cleaner",label: "HTML Cleaner",icon: "Code"},
	{id: "image-converter",label: "Image Converter",icon: "ImageIcon"},
	{id: "image-to-text",label: "Image to Text",icon: "ScanText"},
	{id: "video-compressor",label: "Video Compressor",icon: "Video"},
];

import { supabase } from "./supabase";

export async function authenticate(username,password) {
	try {
		// Try Supabase first if configured
		if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
			const { data, error } = await supabase.auth.signInWithPassword({
				email: username.includes('@') ? username : `${username}@example.com`, // Assuming email for Supabase
				password: password,
			});

			if (!error && data.user) {
				// Fetch profile for role
				const { data: profile } = await supabase
					.from('profiles')
					.select('role, username')
					.eq('id', data.user.id)
					.single();
				
				return {
					id: data.user.id,
					username: profile?.username || username,
					email: data.user.email,
					role: profile?.role || 'content_creator', // Default role
					name: profile?.username || username
				};
			}
		}

		// Fallback to existing API
		const res = await fetch('/api/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password })
		});
		
		if (res.ok) {
			const data = await res.json();
			return data.user;
		}
	} catch (error) {
		console.error("Login failed", error);
	}
	return null;
}

export function hasAccess(user, featureId) {
	// Free tools that everyone can access
	const freeTools = ['html-cleaner', 'image-converter', 'video-compressor', 'image-to-text'];
	if (freeTools.includes(featureId)) return true;

	if(!user) return false;
	const role = user.role;
	const allowed = ROLES[role];
	if (!allowed) return false;
	
	// Admin always has access
	if (allowed.includes('*')) return true;

	// Check if it's a generator tool
	const isGenerator = ['course', 'blog', 'glossary', 'resources', 'document-extractor'].includes(featureId);
	
	if (isGenerator) {
		// Only allow if they have explicit generator access OR if their role naturally includes it
		return user.has_generator_access === true || user.role === 'admin';
	}

	// Utility tools are accessible if they are in the role's allowed list
	return allowed.includes(featureId);
}

export function triggerLogin() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('trigger-login'));
  }
}
