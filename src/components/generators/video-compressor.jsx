"use client";

import {useState,useRef,useEffect} from "react";
import {Card} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {
	Maximize2,
	Minimize2,
	Monitor,
	Zap,
	Download,
	CloudUpload,
	ArrowLeft,
	Trash2,
	Settings,
	X,
	CheckCircle2,
	Play,
	Pause,
	Film,
	Target,
	Gauge,
	Sparkles,
	Flame,
	Server,
	Monitor as BrowserIcon
} from "lucide-react";
import {cn} from "@/lib/utils";
import {formatFileSize} from "@/lib/image-converter";
import {FFmpeg} from "@ffmpeg/ffmpeg";
import {fetchFile,toBlobURL} from "@ffmpeg/util";

// --- Constants ---
const RESOLUTIONS=[
	{id: "original",label: "Original",icon: Maximize2,desc: "Source Size"},
	{id: "1920",label: "1080p FHD",icon: Monitor,desc: "1920x1080"},
	{id: "1280",label: "720p HD",icon: Monitor,desc: "1280x720"},
	{id: "854",label: "480p SD",icon: Minimize2,desc: "854x480"},
	{id: "640",label: "360p Mobile",icon: Minimize2,desc: "640x360"},
];

// Compression presets
const COMPRESSION_PRESETS=[
	{
		id: "fast",
		label: "Lightning Fast",
		icon: Zap,
		twoPass: false,
		crf: 28,
		preset: "fast",
		audioBitrate: "256k",
		desc: "⚡ Fast + Balanced",
		compressionRatio: 0.30
	},
	{
		id: "handbrake",
		label: "HandBrake Mode",
		icon: Flame,
		twoPass: true,
		crf: 28,
		preset: "slow",
		audioBitrate: "Original",
		desc: "Max Compress (Original Audio)",
		compressionRatio: 0.15
	},
	{
		id: "maximum",
		label: "Ultra Compress",
		icon: Target,
		twoPass: true,
		crf: 32,
		preset: "slow",
		audioBitrate: "256k",
		desc: "Smallest Size (256k Audio)",
		compressionRatio: 0.10
	},
	{
		id: "balanced",
		label: "Balanced",
		icon: Gauge,
		twoPass: false,
		crf: 26,
		preset: "medium",
		audioBitrate: "256k",
		desc: "Good Quality (256k Audio)",
		compressionRatio: 0.30
	},
	{
		id: "quality",
		label: "High Quality",
		icon: Sparkles,
		twoPass: false,
		crf: 20,
		preset: "slow",
		audioBitrate: "512k",
		desc: "Best Visual (512k Audio)",
		compressionRatio: 0.50
	},
];

export function VideoCompressor() {
	// --- State ---
	const [activeFile,setActiveFile]=useState(null);
	const [targetResolution,setTargetResolution]=useState("original");
	const [qualityPreset,setQualityPreset]=useState("fast");
	const [targetSizeMB,setTargetSizeMB]=useState("");
	const [useTargetSize,setUseTargetSize]=useState(false);
	const [compressionMode,setCompressionMode]=useState("client"); // "client" or "server"

	const [isProcessing,setIsProcessing]=useState(false);
	const [progress,setProgress]=useState(0);
	const [result,setResult]=useState(null);
	const [error,setError]=useState(null);
	const [dragActive,setDragActive]=useState(false);
	const [progressMessage,setProgressMessage]=useState("");
	const [ffmpegLoaded,setFfmpegLoaded]=useState(false);

	const fileInputRef=useRef(null);
	const ffmpegRef=useRef(new FFmpeg());

	const isDevMode = process.env.NODE_ENV === 'development';

	// Load FFmpeg on component mount
	useEffect(() => {
		const loadFFmpeg = async () => {
			const ffmpeg = ffmpegRef.current;
			
			ffmpeg.on('log', ({ message }) => {
				console.log(message);
			});

			ffmpeg.on('progress', ({ progress: prog, time }) => {
				const percent = Math.round(prog * 100);
				setProgress(percent);
			});

			try {
				const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
				await ffmpeg.load({
					coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
					wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
				});
				setFfmpegLoaded(true);
			} catch (err) {
				console.error('Failed to load FFmpeg:', err);
				setError('Failed to load video processor. Please refresh the page.');
			}
		};

		loadFFmpeg();
	}, []);

	// --- Helpers ---
	const handleFiles=(files) => {
		const file=files[0];
		if(!file||!file.type.startsWith('video/')) return;

		const preview=URL.createObjectURL(file);
		const video=document.createElement('video');
		video.preload='metadata';
		video.onloadedmetadata=() => {
			const durationSec=video.duration&&!isNaN(video.duration)? video.duration:0;
			setActiveFile({
				file,
				preview,
				durationSec: durationSec,
				duration: formatDuration(durationSec),
				resolution: `${video.videoWidth}x${video.videoHeight}`,
				width: video.videoWidth,
				height: video.videoHeight
			});

			const originalMB=file.size/(1024*1024);
			const suggestedMB=Math.max(1,Math.round(originalMB*0.15*10)/10);
			setTargetSizeMB(suggestedMB.toString());
		};
		video.src=URL.createObjectURL(file);
		setResult(null);
		setError(null);
	};

	const formatDuration=(seconds) => {
		if(!seconds||isNaN(seconds)) return "00:00";
		const mins=Math.floor(seconds/60);
		const secs=Math.floor(seconds%60);
		return `${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
	};

	const estimateFileSize=(resId) => {
		if(!activeFile) return null;

		const preset=COMPRESSION_PRESETS.find(p => p.id===qualityPreset)||COMPRESSION_PRESETS[0];
		const sourceMB=activeFile.file.size/(1024*1024);

		if(useTargetSize&&targetSizeMB) {
			return parseFloat(targetSizeMB).toFixed(1);
		}

		let targetWidth=activeFile.width;
		if(resId!=='original') targetWidth=parseInt(resId);
		if(isNaN(targetWidth)) targetWidth=1920;

		let resolutionFactor=1.0;
		if(targetWidth<activeFile.width) {
			resolutionFactor=Math.pow(targetWidth/activeFile.width,1.5);
		}

		const estimatedMB=sourceMB*preset.compressionRatio*resolutionFactor;
		return Math.min(estimatedMB,sourceMB*0.95).toFixed(1);
	};

	// --- SERVER-SIDE COMPRESSION (Local Dev Only) ---
	const processVideoServer = async () => {
		if(!activeFile) return;

		setIsProcessing(true);
		setProgress(0);
		setProgressMessage("Starting...");
		setError(null);

		try {
			const formData=new FormData();
			formData.append('file',activeFile.file);
			formData.append('preset',qualityPreset);
			formData.append('resolution',targetResolution);
			formData.append('duration',activeFile.durationSec.toString());

			if(useTargetSize&&targetSizeMB) {
				formData.append('targetSizeMB',targetSizeMB);
			}

			const response=await fetch('/api/compress-stream',{
				method: 'POST',
				body: formData,
			});

			if(!response.ok) {
				throw new Error('Failed to start compression');
			}

			const reader=response.body.getReader();
			const decoder=new TextDecoder();
			let buffer='';

			while(true) {
				const {done,value}=await reader.read();
				if(done) break;

				buffer+=decoder.decode(value,{stream: true});
				const lines=buffer.split('\n\n');
				buffer=lines.pop()||'';

				for(const line of lines) {
					if(line.startsWith('data: ')) {
						try {
							const data=JSON.parse(line.slice(6));

							if(data.type==='progress') {
								setProgress(data.percent);
								setProgressMessage(data.message||`${data.percent}%`);
							} else if(data.type==='complete') {
								const binaryStr=atob(data.data);
								const bytes=new Uint8Array(binaryStr.length);
								for(let i=0;i<binaryStr.length;i++) {
									bytes[i]=binaryStr.charCodeAt(i);
								}
								const blob=new Blob([bytes],{type: 'video/mp4'});
								const url=URL.createObjectURL(blob);

								let reduction=0;
								if(activeFile.file.size>0) {
									reduction=Math.round(((activeFile.file.size-data.size)/activeFile.file.size)*100);
								}

								setProgress(100);
								setResult({
									url,
									filename: `compressed_${activeFile.file.name}`,
									size: data.size,
									reduction: reduction>0? reduction:0
								});
							} else if(data.type==='error') {
								throw new Error(data.message);
							}
						} catch(e) {
							if(e.message!=='Unexpected end of JSON input') {
								console.error('Parse error:',e);
							}
						}
					}
				}
			}

		} catch(err) {
			console.error('Compression error:',err);
			setError(err.message||"Failed to compress video. Please try again.");
		} finally {
			setIsProcessing(false);
			setProgressMessage("");
		}
	};

	// --- CLIENT-SIDE COMPRESSION (FFmpeg.wasm) ---
	const processVideoClient=async () => {
		if(!activeFile || !ffmpegLoaded) {
			setError('Video processor not ready. Please wait...');
			return;
		}

		setIsProcessing(true);
		setProgress(0);
		setProgressMessage("Starting...");
		setError(null);

		try {
			const ffmpeg = ffmpegRef.current;
			const preset=COMPRESSION_PRESETS.find(p => p.id===qualityPreset)||COMPRESSION_PRESETS[0];

			setProgressMessage("Loading video...");
			await ffmpeg.writeFile('input.mp4', await fetchFile(activeFile.file));

			setProgress(5);
			setProgressMessage("Preparing encoder...");

			const args = [
				'-i', 'input.mp4',
				'-c:v', 'libx264',
				'-preset', preset.preset,
				'-pix_fmt', 'yuv420p',
				'-movflags', '+faststart',
			];

			if(preset.audioBitrate === 'Original') {
				args.push('-c:a', 'copy');
			} else {
				args.push('-c:a', 'aac');
				args.push('-b:a', preset.audioBitrate);
				args.push('-ar', '48000');
				args.push('-ac', '2');
			}

			if(useTargetSize && targetSizeMB && activeFile.durationSec > 0) {
				const audioBitrateKbps = preset.audioBitrate === 'Original' ? 128 : parseInt(preset.audioBitrate);
				const totalBitrateKbps = (parseFloat(targetSizeMB) * 8192) / activeFile.durationSec;
				const videoBitrateKbps = Math.max(totalBitrateKbps - audioBitrateKbps, 100);
				args.push('-b:v', `${Math.round(videoBitrateKbps)}k`);
				args.push('-maxrate', `${Math.round(videoBitrateKbps * 1.5)}k`);
				args.push('-bufsize', `${Math.round(videoBitrateKbps * 2)}k`);
			} else {
				args.push('-crf', String(preset.crf));
			}

			if(targetResolution !== 'original') {
				const size = parseInt(targetResolution);
				if(!isNaN(size)) {
					args.push('-vf', `scale='min(${size},iw)':-2`);
				}
			}

			args.push('output.mp4');

			setProgress(10);
			setProgressMessage(preset.twoPass ? "Pass 1: Analyzing..." : "Processing...");

			await ffmpeg.exec(args);

			setProgress(95);
			setProgressMessage("Finalizing...");

			const data = await ffmpeg.readFile('output.mp4');
			const blob = new Blob([data.buffer], { type: 'video/mp4' });
			const url = URL.createObjectURL(blob);

			let reduction = 0;
			if(activeFile.file.size > 0) {
				reduction = Math.round(((activeFile.file.size - blob.size) / activeFile.file.size) * 100);
			}

			setProgress(100);
			setProgressMessage("Complete!");
			
			setResult({
				url,
				filename: `compressed_${activeFile.file.name}`,
				size: blob.size,
				reduction: reduction > 0 ? reduction : 0
			});

			await ffmpeg.deleteFile('input.mp4');
			await ffmpeg.deleteFile('output.mp4');

		} catch(err) {
			console.error('Compression error:', err);
			setError(err.message || "Failed to compress video. Please try again.");
		} finally {
			setIsProcessing(false);
			setProgressMessage("");
		}
	};

	const processVideo = () => {
		if(compressionMode === 'server') {
			processVideoServer();
		} else {
			processVideoClient();
		}
	};

	const downloadResult=() => {
		if(!result) return;
		const a=document.createElement('a');
		a.href=result.url;
		a.download=result.filename;
		a.click();
	};

	const reset=() => {
		if(activeFile?.preview) URL.revokeObjectURL(activeFile.preview);
		if(result?.url) URL.revokeObjectURL(result.url);
		setActiveFile(null);
		setResult(null);
		setProgress(0);
		setUseTargetSize(false);
	};

	// --- RENDER: EMPTY STATE ---
	if(!activeFile) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-in fade-in zoom-in duration-700">
				<div className="text-center space-y-4 mb-12">
					<Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary py-1 px-4 text-[10px] font-black tracking-[0.4em] uppercase">
						{compressionMode === 'client' ? (ffmpegLoaded ? "HandBrake Engine (Browser)" : "Loading Engine...") : "HandBrake Engine (Server)"}
					</Badge>
					<h2 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent font-orbitron">
						ULTRA COMPRESSOR
					</h2>
					<p className="text-muted-foreground max-w-2xl mx-auto text-[10px] font-black tracking-[0.3em] uppercase opacity-70">
						Two-Pass Encoding • Target Size Mode • 25MB → 4MB
					</p>
					
					{/* Mode Selector - Only in Dev */}
					{isDevMode && (
						<div className="flex items-center justify-center gap-2 mt-6">
							<button
								onClick={() => setCompressionMode('client')}
								className={cn(
									"px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
									compressionMode === 'client'
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:bg-muted/80"
								)}
							>
								<BrowserIcon className="w-4 h-4 inline mr-2" />
								Browser Mode
							</button>
							<button
								onClick={() => setCompressionMode('server')}
								className={cn(
									"px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all",
									compressionMode === 'server'
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:bg-muted/80"
								)}
							>
								<Server className="w-4 h-4 inline mr-2" />
								Server Mode (Dev Only)
							</button>
						</div>
					)}
				</div>

				<div
					className={cn(
						"w-full max-w-4xl h-[450px] rounded-[3rem] p-1 transition-all duration-500 shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.1),inset_0_20px_60px_rgba(var(--glass-shadow-color),0.3)]",
						dragActive? "scale-[1.02]":"hover:scale-[1.01]"
					)}
					onDragEnter={(e) => {e.preventDefault(); setDragActive(true);}}
					onDragLeave={() => setDragActive(false)}
					onDragOver={(e) => e.preventDefault()}
					onDrop={(e) => {e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files);}}
				>
					<div className={cn(
						"relative w-full h-full bg-card/40 backdrop-blur-3xl rounded-[3rem] border border-border/50 overflow-hidden flex flex-col items-center justify-center gap-8 transition-all duration-500 group cursor-pointer shadow-[inset_0_4px_20px_rgba(var(--glass-shadow-color),0.15)]",
						dragActive? "bg-primary/5 border-primary/50":"hover:bg-card/60 hover:border-primary/30",
						(!ffmpegLoaded && compressionMode === 'client') && "opacity-50 cursor-wait"
					)}
						onClick={() => {
							if(compressionMode === 'server' || ffmpegLoaded) {
								fileInputRef.current?.click();
							}
						}}
					>
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

						<div className="relative z-10 p-8 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 shadow-[inset_0_2px_10px_rgba(var(--glass-shadow-color),0.08)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
							<CloudUpload className="w-16 h-16 text-primary" />
						</div>

						<div className="relative z-10 text-center space-y-3">
							<h2 className="text-3xl md:text-5xl font-black italic text-foreground tracking-tighter font-orbitron drop-shadow-sm">
								{(compressionMode === 'client' && !ffmpegLoaded) ? "LOADING..." : "DROP VIDEO"}
							</h2>
							<div className="inline-flex gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
								<span>MP4</span>
								<span>MOV</span>
								<span>AVI</span>
								<span>MKV</span>
							</div>
						</div>

						<input 
							ref={fileInputRef} 
							type="file" 
							accept="video/*" 
							onChange={(e) => handleFiles(e.target.files)} 
							className="hidden" 
							disabled={compressionMode === 'client' && !ffmpegLoaded} 
						/>
					</div>
				</div>
			</div>
		);
	}

	// --- RENDER: WORKSPACE ---
	return (
		<div className="w-full max-w-[1600px] mx-auto min-h-[85vh] flex flex-col items-center justify-center p-4 animate-in slide-in-from-bottom-8 duration-700">

			<div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 bg-card/60 backdrop-blur-3xl border border-border/50 rounded-[3rem] p-4 shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.08),inset_0_50px_100px_rgba(var(--glass-shadow-color),0.12)] relative overflow-hidden">

				<div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

				{/* LEFT COLUMN: PREVIEW */}
				<div className="lg:col-span-7 flex flex-col gap-6 relative z-10 h-full">

					<div className="relative w-full aspect-video rounded-[2.5rem] overflow-hidden bg-black border border-border/50 shadow-[inset_0_0_50px_rgba(var(--glass-shadow-color),0.5)] group ring-1 ring-border/20">

						<div className="absolute inset-0 pointer-events-none shadow-[inset_0_10px_40px_rgba(var(--glass-shadow-color),0.4)] z-20 rounded-[2.5rem]" />

						<video src={activeFile.preview} className="w-full h-full object-contain relative z-10" controls />

						{/* Progress Overlay */}
						{isProcessing&&(
							<div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 space-y-6">
								<div className="relative">
									<div className="absolute inset-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-pulse" />

									<svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
										<circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" className="text-primary/10" />
										<circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-primary transition-all duration-500 ease-out" strokeDasharray={`${progress*2.83} 283`} />
									</svg>

									<div className="absolute inset-0 flex items-center justify-center">
										<img src="https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765460885/Hi.gif" alt="Processing" className="w-16 h-16 rounded-full object-cover animate-bounce shadow-xl ring-2 ring-primary/30" />
									</div>
								</div>

								<div className="text-center space-y-3">
									<div className="flex items-center justify-center gap-2">
										<span className="text-4xl font-black text-primary font-orbitron tabular-nums">{Math.round(progress)}</span>
										<span className="text-xl font-black text-primary/60">%</span>
									</div>

									<p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">
										{progressMessage||(COMPRESSION_PRESETS.find(p => p.id===qualityPreset)?.twoPass?
											(progress<45? "Pass 1: Analyzing...":"Pass 2: Encoding..."):
											"Processing..."
										)}
									</p>

									<div className="w-64 h-2 bg-primary/10 rounded-full overflow-hidden shadow-inner">
										<div className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-full transition-all duration-300 ease-out" style={{width: `${progress}%`}} />
									</div>
								</div>
							</div>
						)}

						{/* Success Overlay */}
						{result&&!isProcessing&&(
							<div className="absolute top-6 right-6 z-40 animate-in zoom-in duration-500">
								<div className="bg-green-500 hover:bg-green-600 text-white border-none h-12 px-6 shadow-[inset_0_2px_10px_rgba(var(--glass-shadow-color),0.15)] text-xs font-black italic tracking-widest rounded-xl flex items-center gap-3 transition-colors cursor-default">
									<CheckCircle2 className="w-4 h-4" />
									<span>{result.reduction}% SMALLER</span>
								</div>
							</div>
						)}

						{/* Error Overlay */}
						{error&&(
							<div className="absolute inset-0 bg-destructive/90 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-8 text-center space-y-4 shadow-[inset_0_0_50px_rgba(var(--glass-shadow-color),0.25)]">
								<div className="p-4 rounded-full bg-black/20 text-white mb-2 shadow-inner">
									<Trash2 className="w-8 h-8" />
								</div>
								<h3 className="text-xl font-black text-white uppercase tracking-wider">Processing Failed</h3>
								<p className="text-white/80 text-xs font-mono max-w-xs">{error}</p>
								<Button variant="outline" onClick={() => setError(null)} className="mt-4 border-white/30 text-white hover:bg-white/10 shadow-[inset_0_1px_4px_rgba(var(--glass-shadow-color),0.2)]">Dismiss</Button>
							</div>
						)}
					</div>

					{/* File Info Bar */}
					<div className="flex flex-col md:flex-row items-center justify-between gap-1 p-2 rounded-[2rem] bg-card/30 border border-border/50 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.08),inset_0_10px_30px_rgba(var(--glass-shadow-color),0.08)]">
						<div className="flex items-center gap-5 w-full md:w-auto">
							<div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 flex items-center justify-center shrink-0 shadow-[inset_0_1px_4px_rgba(var(--glass-shadow-color),0.08)]">
								<Film className="w-5 h-5 text-primary" />
							</div>
							<div className="overflow-hidden min-w-0 flex-1">
								<h3 className="text-sm font-black text-foreground truncate uppercase tracking-tight font-orbitron max-w-[180px] md:max-w-[250px]">{activeFile.file.name}</h3>
								<div className="flex gap-2 mt-1">
									<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{activeFile.resolution}</span>
									<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{activeFile.duration}</span>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end bg-black/5 md:bg-transparent p-4 md:p-0 rounded-xl shadow-inner md:shadow-none">
							<div className="text-right">
								<p className="text-[8px] uppercase text-muted-foreground tracking-[0.2em] font-black mb-1">Source</p>
								<p className="text-sm font-black text-foreground/80 font-mono">{formatFileSize(activeFile.file.size)}</p>
							</div>

							<div className="h-8 w-px bg-border shadow-[0_0_10px_rgba(0,0,0,0.1)]" />

							<div className="text-left">
								<p className="text-[8px] uppercase text-green-500/80 tracking-[0.2em] font-black mb-1">
									{useTargetSize? "Target":"Est. Output"}
								</p>
								{result? (
									<p className="text-sm font-black text-green-600 dark:text-green-400 font-mono drop-shadow-sm">{formatFileSize(result.size)}</p>
								):(
									<p className="text-sm font-black text-muted-foreground/50 font-mono">
										~{estimateFileSize(targetResolution)} MB
									</p>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* RIGHT COLUMN: CONTROLS */}
				<div className="lg:col-span-5 flex flex-col h-full gap-5 relative z-10">

					<div className="flex-1 flex flex-col gap-5 p-6 md:p-8 rounded-[2.5rem] bg-card/40 border border-border/50 backdrop-blur-xl relative overflow-hidden shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.08),inset_0_20px_50px_rgba(var(--glass-shadow-color),0.08)]">

						<div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-50" />

						<div className="flex items-center justify-between">
							<h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
								<Settings className="w-4 h-4 animate-spin-slow" /> HandBrake Settings
							</h3>
							<Button variant="ghost" size="sm" onClick={reset} className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-500/10 hover:border-red-500/30 shadow-[inset_0_1px_4px_rgba(var(--glass-shadow-color),0.08)]">
								Reset
							</Button>
						</div>

						{/* Mode Selector - Dev Only */}
						{isDevMode && (
							<div className="space-y-2">
								<label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground pl-1">Processing Mode (Dev Only)</label>
								<div className="grid grid-cols-2 gap-2">
									<button
										onClick={() => setCompressionMode('client')}
										disabled={isProcessing||!!result}
										className={cn(
											"px-3 py-2 rounded-xl border text-xs font-bold transition-all",
											compressionMode === 'client'
												? "bg-primary/10 border-primary/50 text-primary"
												: "bg-background/20 border-border/50 text-muted-foreground hover:bg-background/40"
										)}
									>
										<BrowserIcon className="w-3 h-3 inline mr-1" />
										Browser
									</button>
									<button
										onClick={() => setCompressionMode('server')}
										disabled={isProcessing||!!result}
										className={cn(
											"px-3 py-2 rounded-xl border text-xs font-bold transition-all",
											compressionMode === 'server'
												? "bg-primary/10 border-primary/50 text-primary"
												: "bg-background/20 border-border/50 text-muted-foreground hover:bg-background/40"
										)}
									>
										<Server className="w-3 h-3 inline mr-1" />
										Server
									</button>
								</div>
							</div>
						)}

						{/* Compression Mode Selection */}
						<div className="space-y-3">
							<label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground pl-1">Compression Mode</label>
							<div className="grid grid-cols-2 gap-2">
								{COMPRESSION_PRESETS.map((preset) => {
									const Icon=preset.icon;
									return (
										<button
											key={preset.id}
											onClick={() => {setQualityPreset(preset.id); setUseTargetSize(false);}}
											disabled={isProcessing||!!result}
											className={cn(
												"relative p-3 rounded-xl border transition-all duration-300 text-left outline-none group overflow-hidden",
												qualityPreset===preset.id&&!useTargetSize
													? "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/50 shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.1),inset_0_2px_10px_rgba(var(--primary-rgb),0.1)]"
													:"bg-background/20 border-border/50 hover:bg-background/40 hover:border-border shadow-[inset_0_2px_4px_rgba(var(--glass-shadow-color),0.04)]"
											)}
										>
											<div className="flex items-center gap-3 relative z-10">
												<Icon className={cn("w-4 h-4 shrink-0",qualityPreset===preset.id&&!useTargetSize? "text-primary":"text-muted-foreground")} />
												<div className="min-w-0">
													<p className={cn("text-[10px] font-black uppercase tracking-wider font-orbitron truncate",qualityPreset===preset.id&&!useTargetSize? "text-primary":"text-muted-foreground")}>
														{preset.label}
													</p>
													<p className="text-[8px] text-muted-foreground/60 font-medium uppercase tracking-wider truncate">
														{preset.desc}
													</p>
												</div>
											</div>
											{preset.twoPass&&(
												<Badge className="absolute top-1 right-1 text-[6px] px-1 py-0 bg-orange-500/20 text-orange-500 border-orange-500/30">2-PASS</Badge>
											)}
										</button>
									)
								})}
							</div>
						</div>

						{/* Target Size Mode */}
						<div className="space-y-3">
							<button
								onClick={() => setUseTargetSize(!useTargetSize)}
								disabled={isProcessing||!!result}
								className={cn(
									"w-full p-4 rounded-xl border transition-all duration-300 text-left outline-none flex items-center justify-between",
									useTargetSize
										? "bg-gradient-to-r from-orange-500/10 to-orange-500/5 border-orange-500/50"
										:"bg-background/20 border-border/50 hover:bg-background/40"
								)}
							>
								<div className="flex items-center gap-3">
									<Target className={cn("w-5 h-5",useTargetSize? "text-orange-500":"text-muted-foreground")} />
									<div>
										<p className={cn("text-xs font-black uppercase tracking-wider font-orbitron",useTargetSize? "text-orange-500":"text-muted-foreground")}>
											Target Size Mode
										</p>
										<p className="text-[9px] text-muted-foreground/60 font-medium uppercase tracking-wider">
											Specify exact output file size
										</p>
									</div>
								</div>
								<div className={cn(
									"w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center",
									useTargetSize? "border-orange-500 bg-orange-500":"border-muted-foreground/30"
								)}>
									{useTargetSize&&<CheckCircle2 className="w-3 h-3 text-white" />}
								</div>
							</button>

							{useTargetSize&&(
								<div className="flex items-center gap-3 p-4 rounded-xl bg-orange-500/5 border border-orange-500/20 animate-in slide-in-from-top-2 duration-300">
									<input
										type="number"
										value={targetSizeMB}
										onChange={(e) => setTargetSizeMB(e.target.value)}
										placeholder="5"
										min="1"
										step="0.5"
										disabled={isProcessing||!!result}
										className="flex-1 bg-background/50 border border-border/50 rounded-lg px-4 py-2 text-sm font-mono font-bold text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-orange-500/50 transition-colors"
									/>
									<span className="text-sm font-black text-orange-500 uppercase tracking-wider">MB</span>
								</div>
							)}
						</div>

						{/* Resolution Selection */}
						<div className="space-y-3">
							<label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground pl-1">Output Resolution</label>

							<div className="grid grid-cols-2 gap-2">
								{RESOLUTIONS.slice(0,4).map((res) => {
									const estimated=estimateFileSize(res.id);
									return (
										<button
											key={res.id}
											onClick={() => setTargetResolution(res.id)}
											disabled={isProcessing||!!result}
											className={cn(
												"px-2 py-2.5 rounded-xl border text-xs font-bold transition-all duration-200 outline-none disabled:opacity-50 flex flex-col items-center justify-center gap-1 min-h-[60px]",
												targetResolution===res.id
													? "bg-primary/10 border-primary/50 text-foreground shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.1),inset_0_2px_10px_rgba(var(--glass-shadow-color),0.04)]"
													:"bg-background/20 border-border/50 text-muted-foreground hover:bg-background/40 hover:border-border shadow-[inset_0_2px_4px_rgba(var(--glass-shadow-color),0.04)]"
											)}
										>
											<div className="flex items-center gap-2">
												<res.icon className="w-3 h-3 opacity-50" />
												<span className="uppercase tracking-wider text-[9px]">{res.label}</span>
											</div>
											{!useTargetSize&&(
												<span className={cn(
													"text-[8px] font-black font-mono",
													targetResolution===res.id? "text-primary brightness-150":"text-muted-foreground/50"
												)}>
													~{estimated} MB
												</span>
											)}
										</button>
									)
								})}
							</div>
						</div>

					</div>

					{/* Action Area */}
					{result? (
						<Button
							onClick={downloadResult}
							className="h-20 w-full rounded-[2rem] bg-green-600 hover:bg-green-500 text-white shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.2),0_20px_60px_rgba(var(--primary-rgb),0.2)] border-t border-white/20 group overflow-hidden relative transition-all active:scale-95"
						>
							<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
							<div className="flex flex-col items-center justify-center relative z-10 gap-1">
								<div className="flex items-center gap-3">
									<Download className="w-6 h-6 animate-bounce" />
									<span className="text-lg font-black uppercase tracking-widest font-orbitron">Download</span>
								</div>
								<span className="text-[8px] font-bold uppercase tracking-[0.3em] opacity-60">
									{formatFileSize(result.size)} • {result.reduction}% Smaller
								</span>
							</div>
						</Button>
					):(
						<Button
							onClick={processVideo}
							disabled={isProcessing || (compressionMode === 'client' && !ffmpegLoaded)}
							className={cn(
								"h-20 w-full rounded-[2rem] shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.2),0_20px_60px_rgba(var(--primary-rgb),0.2)] border-t border-white/10 group overflow-hidden relative transition-all duration-300",
								isProcessing||(compressionMode === 'client' && !ffmpegLoaded)? "bg-muted cursor-not-allowed border-none shadow-[inset_0_2px_10px_rgba(var(--glass-shadow-color),0.08)] text-muted-foreground":"bg-primary hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.98] text-primary-foreground"
							)}
						>
							{isProcessing? (
								<div className="flex flex-col items-center gap-2">
									<span className="text-muted-foreground/60 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
										{COMPRESSION_PRESETS.find(p => p.id===qualityPreset)?.twoPass? "Two-Pass Processing...":"Processing..."}
									</span>
								</div>
							):(compressionMode === 'client' && !ffmpegLoaded)? (
								<div className="flex flex-col items-center gap-2">
									<span className="text-muted-foreground/60 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
										Loading Engine...
									</span>
								</div>
							):(
								<div className="flex flex-col items-center justify-center gap-1">
									<div className="flex items-center gap-3">
										<Flame className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
										<span className="text-lg font-black uppercase tracking-[0.2em] font-orbitron">Compress</span>
									</div>
									<span className="text-[8px] font-bold uppercase tracking-[0.3em] opacity-40 group-hover:opacity-80 transition-opacity">
										{useTargetSize? `Target: ${targetSizeMB} MB`:COMPRESSION_PRESETS.find(p => p.id===qualityPreset)?.desc}
									</span>
								</div>
							)}
						</Button>
					)}

				</div>

			</div>
		</div>
	);
}
