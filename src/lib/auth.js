// USERS moved to server-side API

export const ROLES={
	admin: ['*'],
	blog_creator: ['blog','html-cleaner','image-converter','video-compressor','image-to-text'],
	content_creator: ['course','glossary','resources','html-cleaner','image-converter','video-compressor','image-to-text']
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

export async function authenticate(username,password) {
	try {
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

export function hasAccess(role,featureId) {
	if(!role) return false;
	const allowed=ROLES[role];
	if(!allowed) return false;
	if(allowed.includes('*')) return true;
	return allowed.includes(featureId);
}
