"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Card,CardContent,CardDescription,CardFooter,CardHeader,CardTitle} from "@/components/ui/card";
import {authenticate} from "@/lib/auth";
import {supabase} from "@/lib/supabase";
import {Lock, Chrome, ArrowRight, ShieldCheck, Zap, Globe, Sparkles} from "lucide-react";
import { Footer } from "@/components/footer";
import { Separator } from "@/components/ui/separator";

export function LoginScreen({onLogin}) {
	const [isSignUp,setIsSignUp]=useState(false);
	const [email,setEmail]=useState("");
	const [fullName,setFullName]=useState("");
	const [username,setUsername]=useState("");
	const [password,setPassword]=useState("");
	const [error,setError]=useState("");
	const [successMsg,setSuccessMsg]=useState("");
	const [isLoading,setIsLoading]=useState(false);

	const handleSubmit=async (e) => {
		e.preventDefault();
		setError("");
		setSuccessMsg("");
		setIsLoading(true);
		
		try {
			if (isSignUp) {
				const { data, error: signUpError } = await supabase.auth.signUp({
					email: email,
					password: password,
					options: {
						data: {
							full_name: fullName,
							username: username
						}
					}
				});
				if (signUpError) throw signUpError;
				if (data.user) {
					setSuccessMsg("Check your email for the confirmation link!");
					setIsSignUp(false);
				}
			} else {
				const user=await authenticate(username || email,password);
				if(user) {
					onLogin(user);
				} else {
					setError("Invalid credentials. Please try again.");
				}
			}
		} catch (err) {
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleLogin = async () => {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: window.location.origin
			}
		});
		if (error) setError(error.message);
	};

	return (
		<div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
			<div className="w-full max-w-[1200px] grid lg:grid-cols-2 gap-12 items-center">
				
				{/* Left Side: Branding & Features */}
				<div className="hidden lg:flex flex-col space-y-8 animate-in-card">
					<div className="space-y-4">
						<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
							<Sparkles className="w-3 h-3" />
							Premium Content Suite
						</div>
						<h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-tight text-foreground">
							Modern <span className="text-primary">AI-Powered</span> content automation.
						</h1>
						<p className="text-xl text-muted-foreground max-w-md">
							Accelerate your digital workflow with our suite of intelligent document extraction and media optimization tools.
						</p>
					</div>

					<div className="grid gap-6">
						{[
							{ icon: ShieldCheck, title: "Enterprise Security", desc: "Local processing ensures your data never leaves your device." },
							{ icon: Zap, title: "Lightning Fast", desc: "Native browser engines provide instant results for heavy tasks." },
							{ icon: Globe, title: "Global Standards", desc: "Generate semantic HTML compatible with any LMS platform." }
						].map((item, i) => (
							<div key={i} className="flex gap-4 p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
								<div className="flex-none w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
									<item.icon className="w-6 h-6" />
								</div>
								<div>
									<h4 className="font-bold">{item.title}</h4>
									<p className="text-sm text-muted-foreground">{item.desc}</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Right Side: Login Card */}
				<div className="flex flex-col items-center w-full">
					<Card className="w-full max-w-md shadow-2xl border-primary/10 animate-in-card lg:[animation-delay:200ms]">
						<CardHeader className="space-y-1 pb-8">
							<div className="flex justify-center mb-6">
								<div className="relative">
									<div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
									<div className="relative rounded-2xl bg-primary shadow-xl p-4 border border-primary-foreground/20">
										<Lock className="h-8 w-8 text-primary-foreground" />
									</div>
								</div>
							</div>
							<CardTitle className="text-3xl font-black text-center">
								{isSignUp ? "Create Account" : "Welcome back"}
							</CardTitle>
							<CardDescription className="text-center text-base">
								{isSignUp ? "Join our enterprise content suite" : "Select your preferred method to continue"}
							</CardDescription>
						</CardHeader>
						
						<CardContent className="space-y-6">
							{/* Social Login */}
							<Button 
								variant="outline" 
								className="w-full h-12 gap-3 font-bold border-border/60 hover:bg-muted/50 transition-all rounded-xl"
								onClick={handleGoogleLogin}
								disabled={isLoading}
							>
								<Chrome className="w-5 h-5 text-red-500" />
								{isSignUp ? "Sign up with Google" : "Continue with Google"}
							</Button>

							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<Separator />
								</div>
								<div className="relative flex justify-center text-xs uppercase">
									<span className="bg-card px-2 text-muted-foreground font-medium">Or use email</span>
								</div>
							</div>

							{/* Form Login/Signup */}
							<form onSubmit={handleSubmit} className="space-y-4">
								{isSignUp && (
									<>
										<div className="space-y-2">
											<Label htmlFor="fullName" className="text-sm font-bold ml-1">Full Name</Label>
											<Input
												id="fullName"
												placeholder="John Doe"
												value={fullName}
												onChange={(e) => setFullName(e.target.value)}
												className="h-12 rounded-xl focus-visible:ring-primary bg-muted/30 border-border/50"
												disabled={isLoading}
												required
											/>
										</div>
									</>
								)}
								<div className="space-y-2">
									<Label htmlFor="email" className="text-sm font-bold ml-1">
										{isSignUp ? "Email Address" : "Username or Email"}
									</Label>
									<Input
										id="email"
										type="text"
										placeholder="name@company.com"
										value={isSignUp ? email : username}
										onChange={(e) => isSignUp ? setEmail(e.target.value) : setUsername(e.target.value)}
										className="h-12 rounded-xl focus-visible:ring-primary bg-muted/30 border-border/50"
										disabled={isLoading}
										required
									/>
								</div>
								<div className="space-y-2">
									<div className="flex justify-between items-center px-1">
										<Label htmlFor="password" title="password" className="text-sm font-bold">Password</Label>
										{!isSignUp && <button type="button" className="text-xs text-primary font-bold hover:underline">Forgot?</button>}
									</div>
									<Input
										id="password"
										type="password"
										placeholder="••••••••"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className="h-12 rounded-xl focus-visible:ring-primary bg-muted/30 border-border/50"
										disabled={isLoading}
										required
									/>
								</div>
								
								{error&&(
									<div className="text-sm text-destructive font-bold text-center bg-destructive/10 py-2 rounded-lg">
										{error}
									</div>
								)}

								{successMsg&&(
									<div className="text-sm text-green-500 font-bold text-center bg-green-500/10 py-2 rounded-lg">
										{successMsg}
									</div>
								)}

								<Button 
									className="w-full h-12 mt-6 rounded-xl font-bold shadow-lg shadow-primary/20 group" 
									type="submit"
									disabled={isLoading}
								>
									{isLoading ? (isSignUp ? "Creating..." : "Signing in...") : (isSignUp ? "Create Account" : "Access Dashboard")}
									{!isLoading && <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />}
								</Button>
							</form>
						</CardContent>
						
						<CardFooter className="pb-8 justify-center">
							<p className="text-sm text-muted-foreground">
								{isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
								<button 
									onClick={() => setIsSignUp(!isSignUp)}
									className="text-primary font-bold hover:underline"
								>
									{isSignUp ? "Sign In" : "Sign Up Now"}
								</button>
							</p>
						</CardFooter>
					</Card>
				</div>
			</div>

			<div className="w-full max-w-6xl mt-24 border-t border-border pt-12">
				<Footer />
			</div>
		</div>
	);
}
