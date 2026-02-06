import { NextResponse } from 'next/server';

// Server-side only credentials
const USERS = {
	admin: {
		username: 'admin',
		password: 'Bilal@7',
		role: 'admin',
		name: 'Administrator'
	},
	blog: {
		username: 'blog',
		password: 'Blog@123',
		role: 'blog_creator',
		name: 'Blog Editor'
	},
	content: {
		username: 'content',
		password: 'content@123',
		role: 'content_creator',
		name: 'Content Creator'
	}
};

export async function POST(request) {
	try {
		const { username, password } = await request.json();
		const user = USERS[username];

		if (user && user.password === password) {
			// Return safe user object without password
			const { password: _, ...safeUser } = user;
			return NextResponse.json({ user: safeUser }, { status: 200 });
		}

		return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
	} catch (error) {
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
