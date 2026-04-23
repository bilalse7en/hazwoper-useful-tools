"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card,CardContent,CardDescription,CardFooter,CardHeader,CardTitle} from "@/components/ui/card";
import {authenticate} from "@/lib/auth";
import {Lock} from "lucide-react";

export function LoginScreen({onLogin}) {
	const [username,setUsername]=useState("");
	const [password,setPassword]=useState("");
	const [error,setError]=useState("");

	const handleSubmit=async (e) => {
		e.preventDefault();
		setError("");
		const user=await authenticate(username,password);
		if(user) {
			onLogin(user);
		} else {
			setError("Invalid credentials. Please try again.");
		}
	};

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-4 overflow-y-auto py-12 gap-8">
			<Card className="w-full max-w-md animate-in-card">
				<CardHeader className="space-y-1">
					<div className="flex justify-center mb-4">
						<div className="rounded-full bg-primary/10 p-3">
							<Lock className="h-6 w-6 text-primary" />
						</div>
					</div>
					<CardTitle className="text-2xl font-bold text-center">Sign in to Content Suite</CardTitle>
					<CardDescription className="text-center">
						Enter your credentials to access the generators
					</CardDescription>
				</CardHeader>
				<form onSubmit={handleSubmit}>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="username">Username</Label>
							<Input
								id="username"
								placeholder="admin"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								autoCapitalize="none"
								autoCorrect="off"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								placeholder="••••••••"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
						{error&&(
							<div className="text-sm text-red-500 font-medium text-center">
								{error}
							</div>
						)}
					</CardContent>
					<CardFooter>
						<Button className="w-full mt-4" type="submit">
							Sign In
						</Button>
					</CardFooter>
				</form>
			</Card>

			{/* High Value Content for AdSense Compliance */}
			<div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 mt-12 animate-in-card [animation-delay:200ms]">
				<div className="bg-card p-6 rounded-2xl border border-border">
					<h3 className="font-bold text-lg mb-3">Enterprise Security</h3>
					<p className="text-sm text-muted-foreground leading-relaxed">
						Content Suite is built with a browser-first architecture. This means your sensitive documents and course materials never leave your device. All processing, extraction, and generation happen locally in your browser, providing unparalleled data privacy for your organization.
					</p>
				</div>
				<div className="bg-card p-6 rounded-2xl border border-border">
					<h3 className="font-bold text-lg mb-3">Professional Output</h3>
					<p className="text-sm text-muted-foreground leading-relaxed">
						Generate clean, semantic HTML that is ready for integration with any major Learning Management System (LMS). Our tools eliminate the messy formatting typically associated with document exports, ensuring your content looks professional on every device.
					</p>
				</div>
				<div className="bg-card p-6 rounded-2xl border border-border">
					<h3 className="font-bold text-lg mb-3">Intelligent Extraction</h3>
					<p className="text-sm text-muted-foreground leading-relaxed">
						Save hours of manual labor with our automated extraction engines. Whether you need a glossary from a 100-page manual or a syllabus from a complex document structure, our tools handle the heavy lifting with high precision and speed.
					</p>
				</div>
				<div className="bg-card p-6 rounded-2xl border border-border">
					<h3 className="font-bold text-lg mb-3">Modern Optimization</h3>
					<p className="text-sm text-muted-foreground leading-relaxed">
						Optimize your media assets for the web instantly. Convert images to modern formats like WebP or compress videos with high-quality retention. Everything is done client-side, eliminating the wait times of server-side uploads.
					</p>
				</div>
			</div>
		</div>
	);
}
