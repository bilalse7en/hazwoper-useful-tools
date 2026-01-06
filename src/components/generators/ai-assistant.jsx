"use client";

import {useState,useRef,useEffect} from "react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {Input} from "@/components/ui/input";
import {
	Bot,
	Send,
	Sparkles,
	Copy,
	Cpu,
	Zap,
	BrainCircuit,
	Terminal,
	ImageIcon,
	Download,
	Wand2,
	Settings2,
	Paperclip,
	X,
	FileText,
	Plus,
	ScanFace,
	Activity,
	Menu,
	History,
	ShieldCheck,
	Maximize2,
	ChevronDown,
	ChevronUp,
	ExternalLink
} from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import ReactMarkdown from 'react-markdown';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter';
import {vscDarkPlus} from 'react-syntax-highlighter/dist/esm/styles/prism';

const MODELS=[
	{id: "meta-llama/llama-3.3-70b-instruct:free",label: "Llama 3.3 70B",icon: Zap,provider: "Meta"},
	{id: "nvidia/llama-3.1-nemotron-nano-8b-v1:free",label: "Nemotron 8B",icon: Bot,provider: "NVIDIA"},
	{id: "deepseek/deepseek-r1-0528:free",label: "DeepSeek R1",icon: BrainCircuit,provider: "DeepSeek"},
	{id: "microsoft/phi-3-mini-128k-instruct:free",label: "Phi-3 Mini",icon: Cpu,provider: "Microsoft"},
	{id: "qwen/qwen-2-7b-instruct:free",label: "Qwen 2 7B",icon: Sparkles,provider: "Alibaba"},
	{id: "image-gen",label: "Image Generator",icon: ImageIcon,provider: "AI Horde"},
];

const LOGO_URL="https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765460885/Hi.gif";

const CodeBlock=({children,language}) => {
	const [expanded,setExpanded]=useState(false);
	const [showFullView,setShowFullView]=useState(false);
	const codeString=String(children).replace(/\n$/,'');
	const lineCount=codeString.split('\n').length;
	const isLong=lineCount>15;

	return (
		<div className="group relative my-4 rounded-2xl overflow-hidden border border-border/50 bg-[#0d0d0d] backdrop-blur-sm transition-all hover:border-primary/30 max-w-full not-prose">
			<div className="bg-card/40 px-4 py-2.5 flex items-center justify-between border-b border-border/50 select-none">
				<div className="flex items-center gap-2">
					<div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
						<Terminal className="h-3.5 w-3.5 text-primary" />
					</div>
					<span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/80">{language}</span>
				</div>
				<div className="flex items-center gap-1">
					<Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary/10" onClick={() => setShowFullView(true)} title="Perfect Preview">
						<Maximize2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
					</Button>
					<Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-primary/10" onClick={() => navigator.clipboard.writeText(codeString)} title="Copy Code">
						<Copy className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
					</Button>
				</div>
			</div>

			<div className={cn(
				"relative transition-all duration-300 ease-in-out w-full overflow-hidden",
				!expanded&&isLong? "max-h-[350px]":"max-h-none"
			)}>
				<div className="w-full overflow-x-auto custom-scrollbar-horizontal">
					<SyntaxHighlighter
						style={vscDarkPlus}
						language={language}
						PreTag="div"
						showLineNumbers={true}
						lineNumberStyle={{minWidth: '2.5em',paddingRight: '1em',color: 'rgba(255,255,255,0.2)',fontSize: '10px'}}
						className="!bg-transparent !p-4 !m-0 !text-xs !leading-relaxed selection:bg-primary/30"
						customStyle={{
							margin: 0,
							padding: '1rem',
							background: 'transparent',
							fontSize: '12px',
							lineHeight: '1.5',
							minWidth: '100%'
						}}
					>
						{codeString}
					</SyntaxHighlighter>
				</div>

				{!expanded&&isLong&&(
					<div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/80 to-transparent pointer-events-none flex items-end justify-center pb-4">
						<Button
							variant="outline"
							className="h-8 px-4 rounded-xl bg-[#0d0d0d]/90 backdrop-blur-md border border-primary/20 pointer-events-auto text-[10px] font-black uppercase text-primary hover:bg-primary/10 shadow-2xl"
							onClick={() => setExpanded(true)}
						>
							<ChevronDown className="h-3 w-3 mr-1" /> Expand {lineCount} Lines
						</Button>
					</div>
				)}
			</div>

			{expanded&&isLong&&(
				<div className="p-2 flex justify-center border-t border-border/50 bg-card/20">
					<Button
						variant="ghost"
						size="sm"
						className="h-7 text-[9px] font-black uppercase tracking-wider hover:bg-primary/10"
						onClick={() => setExpanded(false)}
					>
						<ChevronUp className="h-3 w-3 mr-1" /> Collapse
					</Button>
				</div>
			)}

			<Dialog open={showFullView} onOpenChange={setShowFullView}>
				<DialogContent className="max-w-5xl h-[85vh] p-0 flex flex-col bg-[#0d0d0d] border-border/50 overflow-hidden rounded-[2rem]">
					<DialogHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between shrink-0 bg-card/20 pb-4">
						<div className="flex items-center gap-3">
							<div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center">
								<Terminal className="h-5 w-5 text-primary" />
							</div>
							<div>
								<DialogTitle className="text-lg font-black uppercase tracking-tight">Perfect Preview</DialogTitle>
								<DialogDescription className="text-[10px] text-muted-foreground uppercase tracking-widest">{language} • {lineCount} Lines</DialogDescription>
							</div>
						</div>
						<div className="flex items-center gap-2 pr-8">
							<Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(codeString)} className="rounded-xl border-primary/20 hover:bg-primary/10 text-[10px] font-black uppercase">
								<Copy className="h-3.5 w-3.5 mr-2" /> Copy Full
							</Button>
						</div>
					</DialogHeader>
					<div className="flex-1 overflow-auto p-6 bg-black/40 custom-scrollbar">
						<SyntaxHighlighter
							style={vscDarkPlus}
							language={language}
							PreTag="div"
							showLineNumbers={true}
							className="!bg-transparent !p-0 !m-0 !text-sm"
						>
							{codeString}
						</SyntaxHighlighter>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export function AIAssistant() {
	const [input,setInput]=useState("");
	const [messages,setMessages]=useState([]);
	const [isLoading,setIsLoading]=useState(false);
	const [selectedModel,setSelectedModel]=useState(MODELS[0].id);
	const [attachedFile,setAttachedFile]=useState(null);
	const [filePreview,setFilePreview]=useState(null);
	const [sidebarOpen,setSidebarOpen]=useState(false);
	const [openRouterKey,setOpenRouterKey]=useState("");
	const [sessions,setSessions]=useState([]);
	const [currentSessionId,setCurrentSessionId]=useState(null);

	const scrollRef=useRef(null);
	const fileInputRef=useRef(null);

	// Load saved data on mount
	useEffect(() => {
		const savedKey=localStorage.getItem('openrouter_key')||"";
		setOpenRouterKey(savedKey);

		const savedSessions=localStorage.getItem('ai_sessions');
		const savedCurrentId=localStorage.getItem('ai_current_session_id');

		if(savedSessions) {
			try {
				const parsed=JSON.parse(savedSessions);
				setSessions(parsed);
				if(savedCurrentId&&parsed.find(s => s.id===savedCurrentId)) {
					const session=parsed.find(s => s.id===savedCurrentId);
					setCurrentSessionId(savedCurrentId);
					setMessages(session.messages||[]);
					setSelectedModel(session.model||MODELS[0].id);
				} else if(parsed.length>0) {
					setCurrentSessionId(parsed[0].id);
					setMessages(parsed[0].messages||[]);
					setSelectedModel(parsed[0].model||MODELS[0].id);
				} else {
					createNewSession();
				}
			} catch(e) {
				console.error("Failed to load sessions:",e);
				createNewSession();
			}
		} else {
			createNewSession();
		}
	},[]);

	// Persistence to localStorage
	useEffect(() => {
		if(sessions.length>0) {
			localStorage.setItem('ai_sessions',JSON.stringify(sessions));
		}
		if(currentSessionId) {
			localStorage.setItem('ai_current_session_id',currentSessionId);
		}
	},[sessions,currentSessionId]);

	// Sync current session state with the sessions list
	useEffect(() => {
		if(!currentSessionId) return;

		setSessions(prev => prev.map(s => {
			if(s.id===currentSessionId) {
				let newTitle=s.title;
				if((s.title==="New Chat"||!s.title)&&messages.length>0) {
					const firstUserMsg=messages.find(m => m.role==="user");
					if(firstUserMsg) {
						newTitle=firstUserMsg.content.slice(0,40)+(firstUserMsg.content.length>40? "...":"");
					}
				}
				return {
					...s,
					messages: messages.filter(m => !m.tempId),
					model: selectedModel,
					title: newTitle,
					updatedAt: Date.now()
				};
			}
			return s;
		}));
	},[messages,selectedModel,currentSessionId]);

	const createNewSession=() => {
		const newSession={
			id: Date.now().toString(),
			title: "New Chat",
			messages: [],
			model: MODELS[0].id,
			createdAt: Date.now(),
			updatedAt: Date.now()
		};
		setSessions(prev => [newSession,...prev]);
		setCurrentSessionId(newSession.id);
		setMessages([]);
		setSelectedModel(MODELS[0].id);
	};

	const switchSession=(id) => {
		const s=sessions.find(sess => sess.id===id);
		if(s) {
			setCurrentSessionId(id);
			setMessages(s.messages||[]);
			setSelectedModel(s.model||MODELS[0].id);
		}
	};

	const deleteSession=(id,e) => {
		if(e) e.stopPropagation();
		const updated=sessions.filter(s => s.id!==id);
		setSessions(updated);
		if(currentSessionId===id) {
			if(updated.length>0) {
				switchSession(updated[0].id);
			} else {
				createNewSession();
			}
		}
	};

	const clearAllChats=() => {
		setSessions([]);
		createNewSession();
		localStorage.removeItem('ai_sessions');
		localStorage.removeItem('ai_current_session_id');
	};

	useEffect(() => {
		if(scrollRef.current) {
			scrollRef.current.scrollTop=scrollRef.current.scrollHeight;
		}
	},[messages]);

	const saveKey=() => {
		localStorage.setItem('openrouter_key',openRouterKey);
		alert("API Key saved!");
	};

	const handleFileSelect=(e) => {
		const file=e.target.files[0];
		if(!file) return;
		setAttachedFile(file);
		if(file.type.startsWith('image/')) {
			const reader=new FileReader();
			reader.onload=(e) => setFilePreview(e.target.result);
			reader.readAsDataURL(file);
		} else {
			setFilePreview('file');
		}
	};

	const removeAttachment=() => {
		setAttachedFile(null);
		setFilePreview(null);
		if(fileInputRef.current) fileInputRef.current.value='';
	};

	const fileToBase64=(file) => new Promise((resolve,reject) => {
		const reader=new FileReader();
		reader.readAsDataURL(file);
		reader.onload=() => resolve(reader.result.split(',')[1]);
		reader.onerror=error => reject(error);
	});

	const handleSend=async () => {
		if((!input.trim()&&!attachedFile)||isLoading) return;

		const currentInput=input;
		const currentFile=attachedFile;
		const currentPreview=filePreview;

		const userMessage={
			role: "user",
			content: currentInput,
			timestamp: new Date(),
			attachment: currentPreview&&currentFile?.type.startsWith('image/')? currentPreview:null,
			fileName: currentFile?.name
		};

		setMessages(prev => [...prev,userMessage]);
		setInput("");
		removeAttachment();
		setIsLoading(true);

		// Image Generation using AI Horde (free, no API key required)
		if(selectedModel==="image-gen") {
			// Show generating message immediately
			const tempMsgId=Date.now();
			setMessages(prev => [...prev,{
				role: "assistant",
				content: `🎨 Generating image: "${currentInput}"\n\n⏳ Queuing with AI Horde (free, community-powered)...`,
				timestamp: new Date(),
				tempId: tempMsgId
			}]);

			try {
				// Step 1: Submit image generation request to AI Horde
				const submitResponse=await fetch("https://aihorde.net/api/v2/generate/async",{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"apikey": "0000000000" // Anonymous key - no signup needed
					},
					body: JSON.stringify({
						prompt: currentInput+", high quality, detailed, 4k",
						params: {
							width: 512,
							height: 512,
							steps: 25,
							cfg_scale: 7.5,
							sampler_name: "k_euler_a"
						},
						nsfw: false,
						censor_nsfw: true,
						models: ["stable_diffusion"]
					})
				});

				if(!submitResponse.ok) {
					const errData=await submitResponse.json();
					throw new Error(errData.message||"Failed to submit image request");
				}

				const submitData=await submitResponse.json();
				const requestId=submitData.id;

				if(!requestId) {
					throw new Error("No request ID received from AI Horde");
				}

				// Step 2: Poll for completion with progress updates
				let attempts=0;
				const maxAttempts=90; // 90 attempts x 2 seconds = 3 minutes max wait

				const checkStatus=async () => {
					attempts++;

					try {
						const statusResponse=await fetch(`https://aihorde.net/api/v2/generate/status/${requestId}`);
						const statusData=await statusResponse.json();

						// Update progress message
						const queuePos=statusData.queue_position||0;
						const waitTime=statusData.wait_time||0;

						// Remove temp message and add progress
						setMessages(prev => prev.filter(m => m.tempId!==tempMsgId));

						if(statusData.done&&statusData.generations&&statusData.generations.length>0) {
							// Image is ready! Handle both URL and base64
							let imageUrl=statusData.generations[0].img;

							// If it's base64, convert to data URL
							if(imageUrl&&!imageUrl.startsWith('http')) {
								imageUrl=`data:image/webp;base64,${imageUrl}`;
							}

							setMessages(prev => [...prev,{
								role: "assistant",
								content: `Generated: "${currentInput}"`,
								type: "image",
								url: imageUrl,
								timestamp: new Date()
							}]);
							setIsLoading(false);
						} else if(statusData.faulted) {
							throw new Error("Generation failed on AI Horde worker");
						} else if(attempts<maxAttempts) {
							// Still processing, show progress and check again
							setMessages(prev => [...prev,{
								role: "assistant",
								content: `🎨 Generating: "${currentInput}"\n\n⏳ Queue position: ${queuePos} | Est. wait: ${waitTime}s\n\n_AI Horde is community-powered and free!_`,
								timestamp: new Date(),
								tempId: tempMsgId
							}]);
							setTimeout(checkStatus,2000);
						} else {
							throw new Error("Image generation timed out after 3 minutes");
						}
					} catch(pollError) {
						setMessages(prev => prev.filter(m => m.tempId!==tempMsgId));
						throw pollError;
					}
				};

				// Start polling after initial delay
				setTimeout(checkStatus,2000);

			} catch(error) {
				console.error("AI Horde error:",error);
				setMessages(prev => prev.filter(m => m.tempId!==tempMsgId));
				setMessages(prev => [...prev,{
					role: "assistant",
					content: `⚠️ Image generation failed: ${error.message}\n\n**Tips:**\n- AI Horde is community-powered, try again in a moment\n- Peak hours may have longer queues\n- Try a simpler prompt`,
					timestamp: new Date()
				}]);
				setIsLoading(false);
			}
			return;
		}

		// Text Models - Use OpenRouter free models
		try {
			let promptMessages=[
				{role: "system",content: "You are AI Universe, a helpful AI assistant. Be concise and accurate."},
				...messages.filter(m => !m.type).map(m => ({role: m.role,content: m.content}))
			];

			if(currentFile&&currentFile.type.startsWith('image/')) {
				const base64Data=await fileToBase64(currentFile);
				promptMessages.push({
					role: "user",
					content: [
						{type: "text",text: currentInput||"Describe this image."},
						{type: "image_url",image_url: {url: `data:${currentFile.type};base64,${base64Data}`}}
					]
				});
			} else {
				promptMessages.push({role: "user",content: currentInput});
			}

			// Use OpenRouter with free models
			const authKey=openRouterKey;
			const fallbackModels=[
				selectedModel,
				"meta-llama/llama-3.3-70b-instruct:free",
				"nvidia/llama-3.1-nemotron-nano-8b-v1:free",
				"deepseek/deepseek-r1-0528:free",
				"microsoft/phi-3-mini-128k-instruct:free",
				"qwen/qwen-2-7b-instruct:free"
			].filter((v,i,a) => a.indexOf(v)===i);

			// Try OpenRouter if key exists
			if(authKey) {
				let lastError=null;
				for(const modelToTry of fallbackModels) {
					try {
						const response=await fetch("https://openrouter.ai/api/v1/chat/completions",{
							method: "POST",
							headers: {
								"Authorization": `Bearer ${authKey}`,
								"HTTP-Referer": window.location.origin,
								"X-Title": "AI Universe",
								"Content-Type": "application/json"
							},
							body: JSON.stringify({
								"model": modelToTry,
								"messages": promptMessages
							})
						});

						const data=await response.json();

						if(!response.ok) {
							lastError=data.error?.message||`Model ${modelToTry} unavailable`;
							console.warn(`Model ${modelToTry} failed:`,lastError);
							continue;
						}

						const aiMessage={
							role: "assistant",
							content: data.choices?.[0]?.message?.content||"No response received.",
							timestamp: new Date(),
							model: modelToTry.split('/')[1]?.replace(':free','')
						};
						setMessages(prev => [...prev,aiMessage]);
						return;
					} catch(fetchError) {
						lastError=fetchError.message;
						console.warn(`Fetch error for ${modelToTry}:`,fetchError);
						continue;
					}
				}
			}

			// 🚀 Fallback to Pollinations.ai (FREE, RELIABLE, NO KEY)
			try {
				// Use 'llama' for Llama 3.3 if selected, otherwise fallback to high-quality defaults
				const fallbackModelName=selectedModel.includes('llama')? 'llama':'openai';

				// Using the more robust "direct" method for anonymous fallback
				const pollinationsResponse=await fetch("https://text.pollinations.ai/",{
					method: "POST",
					headers: {"Content-Type": "application/json"},
					body: JSON.stringify({
						messages: promptMessages,
						model: fallbackModelName,
						seed: Math.floor(Math.random()*1000000),
						json: false // Ensure we get plain text to avoid complex parsing
					})
				});

				if(!pollinationsResponse.ok) throw new Error("Primary fallback failed");

				const pollinationsText=await pollinationsResponse.text();

				// If we get the "IMPORTANT NOTICE" text, it means the JSON endpoint is being restricted
				// We'll catch this and move to the "Direct URL" string-based fallback
				if(pollinationsText.includes("IMPORTANT NOTICE")) {
					throw new Error("Provider returned deprecation notice");
				}

				const aiMessage={
					role: "assistant",
					content: pollinationsText,
					timestamp: new Date(),
					model: "Intelligence Free"
				};
				setMessages(prev => [...prev,aiMessage]);
			} catch(pollError) {
				// 🛡️ Final Resort: The legacy direct prompt method (usually most reliable for anonymous)
				try {
					const lastMsg=currentInput||"hello";
					const modelStr=selectedModel.includes('llama')? "llama":"openai";
					const directUrl=`https://text.pollinations.ai/${encodeURIComponent(lastMsg)}?model=${modelStr}&system=${encodeURIComponent("You are AI Universe, a helpful assistant. Be professional and accurate.")}`;

					const directResponse=await fetch(directUrl);
					const directText=await directResponse.text();

					// Final validation
					if(directText.includes("IMPORTANT NOTICE")) {
						throw new Error("Final fallback failed");
					}

					setMessages(prev => [...prev,{
						role: "assistant",
						content: directText,
						timestamp: new Date(),
						model: "Sync Free"
					}]);
				} catch(finalError) {
					throw new Error("All free AI clusters are currently busy. Please try again in 30 seconds or add your own key in Settings.");
				}
			}
		} catch(error) {
			setMessages(prev => [...prev,{role: "assistant",content: `Error: ${error.message}`,timestamp: new Date()}]);
		} finally {
			setIsLoading(false);
		}
	};

	const downloadImage=(url) => {
		const link=document.createElement('a');
		link.href=url;
		link.download=`ai-generated-${Date.now()}.jpg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<div className="flex h-[90vh] w-full glass-panel-deep rounded-[2.5rem] overflow-hidden shadow-2xl">

			{/* Sidebar */}
			<div className={cn(
				"w-64 flex-col border-r border-border/50 bg-card/60 backdrop-blur-xl transition-all duration-300",
				sidebarOpen? "flex absolute z-50 h-full lg:relative":"hidden lg:flex"
			)}>
				<div className="p-4">
					<div className="flex items-center gap-3 mb-6 p-2 rounded-2xl bg-primary/5 border border-primary/10">
						<div className="h-10 w-10 rounded-xl overflow-hidden shadow-lg shadow-primary/20 ring-1 ring-primary/20 bg-black">
							<img src={LOGO_URL} alt="Logo" className="w-full h-full object-cover" />
						</div>
						<div>
							<h1 className="text-[11px] font-black uppercase tracking-tighter text-foreground">AI Universe</h1>
							<p className="text-[7px] text-primary/70 font-black uppercase tracking-[0.2em]">Neural Intelligence</p>
						</div>
					</div>

					<Button className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-wider bg-primary text-primary-foreground shadow-xl shadow-primary/20 mb-4 transition-all hover:scale-[1.02] active:scale-[0.98]" onClick={createNewSession}>
						<Plus className="h-4 w-4 mr-2" /> New Chat
					</Button>
				</div>

				<div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
					<h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-3 px-2 flex items-center gap-2">
						<History className="h-3 w-3" /> Recent Chats
					</h3>
					<div className="space-y-1">
						{sessions.length>0? (
							sessions.map(s => (
								<div
									key={s.id}
									onClick={() => switchSession(s.id)}
									className={cn(
										"group flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all duration-200 border",
										currentSessionId===s.id
											? "bg-primary/10 border-primary/20 shadow-sm"
											:"hover:bg-card/80 border-transparent hover:border-border/50"
									)}
								>
									<FileText className={cn("h-3 w-3 shrink-0",currentSessionId===s.id? "text-primary":"text-muted-foreground")} />
									<span className={cn(
										"flex-1 text-[10px] font-bold truncate tracking-tight",
										currentSessionId===s.id? "text-foreground":"text-muted-foreground group-hover:text-foreground/80"
									)}>
										{s.title}
									</span>
									<button
										onClick={(e) => deleteSession(s.id,e)}
										className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all"
									>
										<X className="h-3 w-3" />
									</button>
								</div>
							))
						):(
							<p className="px-2 text-[10px] text-muted-foreground/40 italic">No recent chats</p>
						)}
					</div>
				</div>

				<div className="p-4 border-t border-border/50">
					<Dialog>
						<DialogTrigger asChild>
							<Button variant="ghost" className="w-full justify-start gap-2 h-9 text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all rounded-xl">
								<Settings2 className="h-3.5 w-3.5" /> Settings
							</Button>
						</DialogTrigger>
						<DialogContent className="rounded-2xl">
							<DialogHeader className="flex flex-row items-center gap-4">
								<div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-lg">
									<ShieldCheck className="h-6 w-6 text-primary" />
								</div>
								<div>
									<DialogTitle className="text-lg font-black uppercase tracking-tight">Intelligence Config</DialogTitle>
									<DialogDescription className="text-[9px] uppercase font-bold tracking-widest text-primary/60">Secure Neural Encryption</DialogDescription>
								</div>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">OpenRouter Key</label>
									<Input type="password" value={openRouterKey} onChange={e => setOpenRouterKey(e.target.value)} placeholder="sk-or-v1-..." className="h-10 rounded-xl text-xs font-mono" />
								</div>
								<Button onClick={saveKey} className="w-full h-10 rounded-xl font-black uppercase tracking-wider text-[10px]">
									Save Key
								</Button>
								<div className="pt-4 border-t border-border/50">
									<Button variant="destructive" onClick={clearAllChats} className="w-full h-10 rounded-xl font-black uppercase tracking-wider text-[10px]">
										Clear All History
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>

					<div className="mt-4 flex items-center justify-center gap-2 px-2 py-1.5 rounded-lg bg-primary/5 border border-primary/10 select-none">
						<div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
						<span className="text-[7px] font-black uppercase tracking-[0.2em] text-primary/60">Neural Active & Secure</span>
					</div>
				</div>
			</div>

			{/* Main Chat Area */}
			<div className="flex-1 flex flex-col min-w-0 bg-black/5">
				{/* Header */}
				<header className="h-16 border-b border-border/50 px-6 flex items-center justify-between glass-panel shrink-0 select-none">
					<div className="flex items-center gap-4">
						<div className="lg:hidden h-9 w-9 rounded-xl bg-card border border-border/50 flex items-center justify-center" onClick={() => setSidebarOpen(!sidebarOpen)}>
							<Menu className="h-5 w-5 text-primary" />
						</div>
						<div className="flex items-center gap-3">
							<div className="h-9 w-9 rounded-xl overflow-hidden border border-primary/20 shadow-lg">
								<img src={LOGO_URL} alt="Logo" className="w-full h-full object-cover" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h2 className="text-sm font-black uppercase tracking-tight">Intelligence Hub</h2>
									<div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
										<div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
										<span className="text-[8px] font-black uppercase text-green-500 tracking-widest">Online</span>
									</div>
								</div>
								{selectedModel&&(
									<p className="text-[9px] text-muted-foreground uppercase font-medium tracking-wider flex items-center gap-1">
										<Zap className="h-2.5 w-2.5 text-primary" /> Powered by {MODELS.find(m => m.id===selectedModel)?.label}
									</p>
								)}
							</div>
						</div>
					</div>
					<Select value={selectedModel} onValueChange={setSelectedModel}>
						<SelectTrigger className="w-[180px] h-9 text-[10px] font-black uppercase rounded-lg">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{MODELS.map(m => (
								<SelectItem key={m.id} value={m.id} className="text-xs">
									<div className="flex items-center gap-2">
										<m.icon className="h-3 w-3" />
										<span>{m.label}</span>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</header>

				{/* Messages */}
				<div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth bg-black/5">
					{messages.length===0? (
						<div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in-card">
							<div className="relative group">
								<div className="absolute inset-0 bg-primary/20 blur-3xl group-hover:bg-primary/30 transition-all duration-500 rounded-full" />
								<div className="relative h-24 w-24 rounded-[2.5rem] overflow-hidden border-2 border-primary/20 shadow-2xl transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
									<img src={LOGO_URL} alt="Branding" className="w-full h-full object-cover" />
								</div>
							</div>
							<div className="space-y-4 max-w-sm">
								<h2 className="text-3xl font-black uppercase tracking-tighter text-foreground drop-shadow-xl">
									Neural <span className="text-primary">Intelligence</span>
								</h2>
								<p className="text-xs text-muted-foreground font-medium leading-relaxed">
									Welcome to your premium AI companion. Ask questions, generate code, or create stunning visuals with our integrated neural network.
								</p>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
								{[
									{t: "Code",i: Terminal,c: "Write a JS function"},
									{t: "Image",i: ImageIcon,c: "Generate a sunset"},
									{t: "Analyze",i: ScanFace,c: "Explain this code"},
									{t: "Ideas",i: BrainCircuit,c: "App ideas for 2024"}
								].map((item,idx) => (
									<button
										key={idx}
										onClick={() => setInput(item.c)}
										className="p-3 rounded-xl bg-card/40 border border-border/50 hover:border-primary/50 transition-all text-left flex items-center gap-2"
									>
										<item.i className="h-4 w-4 text-primary" />
										<span className="text-[10px] font-bold uppercase">{item.t}</span>
									</button>
								))}
							</div>
						</div>
					):(
						messages.map((m,i) => (
							<div key={i} className={cn("flex gap-2",m.role==="user"? "flex-row-reverse":"")}>
								<div className={cn(
									"h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border border-border/50 shadow-sm",
									m.role==="user"? "bg-primary text-primary-foreground overflow-hidden":"bg-black/50 overflow-hidden"
								)}>
									{m.role==="user"? "U":<img src={LOGO_URL} alt="Assistant" className="w-full h-full object-cover" />}
								</div>

								<div className={cn("flex-1 min-w-0 max-w-[85%] space-y-2",m.role==="user"? "items-end":"")}>
									{m.attachment&&(
										<div className="rounded-xl overflow-hidden border border-border/50 max-w-[200px]">
											<img src={m.attachment} alt="Attached" className="w-full h-auto" />
										</div>
									)}

									<div className={cn(
										"p-3 rounded-xl text-sm",
										m.role==="user"
											? "bg-primary text-primary-foreground rounded-tr-sm"
											:"bg-card border border-border/50 rounded-tl-sm"
									)}>
										{m.type==="image"? (
											<div className="space-y-2">
												<div className="relative group rounded-lg overflow-hidden">
													<img src={m.url} alt="Generated" className="w-full h-auto max-w-[300px]" />
													<div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
														<Button size="icon" variant="secondary" onClick={() => downloadImage(m.url)} className="rounded-xl">
															<Download className="h-4 w-4" />
														</Button>
													</div>
												</div>
												<p className="text-[10px] text-muted-foreground">{m.content}</p>
											</div>
										):(
											<div className="prose prose-sm prose-invert max-w-none break-words">
												<ReactMarkdown components={{
													code({node,inline,className,children,...props}) {
														const match=/language-(\w+)/.exec(className||'');
														if(!inline) {
															return <CodeBlock language={match? match[1]:'code'}>{children}</CodeBlock>;
														}
														return <code className="bg-primary/20 text-primary px-1.5 py-0.5 rounded-md text-[11px] font-bold border border-primary/20 whitespace-normal break-all">{children}</code>
													},
													pre({node,children}) {
														return <div className="not-prose my-4">{children}</div>;
													}
												}}>{m.content}</ReactMarkdown>
											</div>
										)}
									</div>

									<span className="text-[8px] text-muted-foreground/50 px-2">
										{new Date(m.timestamp).toLocaleTimeString([],{hour: '2-digit',minute: '2-digit'})}
									</span>
								</div>
							</div>
						))
					)}
					{isLoading&&(
						<div className="flex gap-2">
							<div className="h-8 w-8 rounded-xl bg-card border border-border/50 flex items-center justify-center">
								<Activity className="h-4 w-4 text-primary animate-spin" />
							</div>
							<div className="p-3 rounded-xl bg-card border border-border/50 rounded-tl-sm">
								<div className="flex items-center gap-2">
									<div className="h-2 w-16 bg-primary/20 rounded-full animate-pulse" />
									<div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Input Area */}
				<div className="p-4 border-t border-border/50 bg-card/40 backdrop-blur-xl shrink-0">
					{filePreview&&(
						<div className="mb-2 p-2 bg-card/60 border border-border/50 rounded-xl flex items-center gap-2">
							{attachedFile.type.startsWith('image/')? (
								<img src={filePreview} alt="Preview" className="h-10 w-10 rounded-lg object-cover" />
							):(
								<div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
									<FileText className="h-4 w-4 text-primary" />
								</div>
							)}
							<span className="text-[10px] font-bold truncate flex-1">{attachedFile.name}</span>
							<Button variant="ghost" size="icon" onClick={removeAttachment} className="h-6 w-6 text-red-500">
								<X className="h-3 w-3" />
							</Button>
						</div>
					)}

					<div className="flex gap-2">
						<input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
						<Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-10 w-10 shrink-0 rounded-xl">
							<Paperclip className="h-4 w-4" />
						</Button>

						<Textarea
							placeholder={selectedModel==="image-gen"? "Describe an image...":"Type a message..."}
							value={input}
							onChange={e => setInput(e.target.value)}
							onKeyDown={e => {if(e.key==="Enter"&&!e.shiftKey) {e.preventDefault(); handleSend();} }}
							className="min-h-[40px] max-h-[120px] flex-1 resize-none rounded-xl text-sm"
						/>

						<Button onClick={handleSend} disabled={(!input.trim()&&!attachedFile)||isLoading} className="h-10 w-10 shrink-0 rounded-xl">
							<Send className="h-4 w-4" />
						</Button>
					</div>

					<div className="mt-2 flex items-center justify-center gap-4 text-[8px] text-muted-foreground/30 uppercase tracking-widest">
						<span className="flex items-center gap-1"><Cpu className="h-2 w-2" />Neural Active</span>
						<span className="flex items-center gap-1"><ShieldCheck className="h-2 w-2" />Secure</span>
					</div>
				</div>
			</div>

			{/* Sidebar Overlay */}
			{sidebarOpen&&(
				<div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
			)}
		</div>
	);
}
