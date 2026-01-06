"use client";

import {useState,useCallback,useRef} from "react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Switch} from "@/components/ui/switch";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select";
import {
	ImageIcon,
	Download,
	Settings,
	RefreshCw,
	CheckCircle2,
	AlertCircle,
	CloudUpload,
	X,
	Zap,
	LayoutGrid,
	Flame,
	ChevronDown
} from "lucide-react";
import {
	convertImage,
	formatFileSize,
	calculateReduction,
	validateImageFile,
	downloadImage,
	getSupportedFormats
} from "@/lib/image-converter";
import {cn} from "@/lib/utils";

export function ImageConverter() {
	const [files,setFiles]=useState([]);
	const [toFormat,setToFormat]=useState("webp"); // Default to WEBP output
	const [quality,setQuality]=useState(100);
	const [maintainAspectRatio,setMaintainAspectRatio]=useState(true);
	const [preserveMetadata,setPreserveMetadata]=useState(true);
	const [width,setWidth]=useState("");
	const [height,setHeight]=useState("");
	const [isConverting,setIsConverting]=useState(false);
	const [progress,setProgress]=useState(0);
	const [currentFile,setCurrentFile]=useState("");
	const [convertedFiles,setConvertedFiles]=useState([]);
	const [notification,setNotification]=useState(null);
	const [dragActive,setDragActive]=useState(false);
	const [showAdvanced,setShowAdvanced]=useState(false);
	const fileInputRef=useRef(null);

	const formats=getSupportedFormats();

	const showNotification=(message,type="success") => {
		setNotification({message,type});
		setTimeout(() => setNotification(null),3000);
	};

	const handleDrag=useCallback((e) => {
		e.preventDefault(); e.stopPropagation();
		setDragActive(e.type==="dragenter"||e.type==="dragover");
	},[]);

	const handleDrop=useCallback((e) => {
		e.preventDefault(); e.stopPropagation();
		setDragActive(false);
		if(e.dataTransfer.files&&e.dataTransfer.files.length>0) {
			handleFiles(Array.from(e.dataTransfer.files));
		}
	},[]);

	const handleFileChange=(e) => {
		if(e.target.files&&e.target.files.length>0) {
			handleFiles(Array.from(e.target.files));
		}
	};

	const handleFiles=useCallback((newFiles) => {
		const validFiles=newFiles.filter(file => {
			// Accept any image file
			const validation=validateImageFile(file,null); // Pass null to accept any format
			if(!validation.valid) {
				showNotification(validation.errors[0],"error");
				return false;
			}
			return true;
		}).slice(0,10);

		if(validFiles.length>0) {
			setFiles(prev => [...prev,...validFiles].slice(0,10));
			showNotification(`Added ${validFiles.length} file(s)`);
		}
	},[]); // Accept any format, no dependency on fromFormat

	const removeFile=(index) => {
		setFiles(prev => prev.filter((_,i) => i!==index));
	};

	const clearQueue=() => {
		setFiles([]);
		setConvertedFiles([]);
		showNotification("Queue cleared");
	};

	const convertAll=async () => {
		if(files.length===0) {
			showNotification("Please add some files first","error");
			return;
		}
		if(!toFormat) {
			showNotification("Please select a target format","error");
			return;
		}

		setIsConverting(true);
		setConvertedFiles([]);
		setProgress(0);
		const results=[];

		for(let i=0;i<files.length;i++) {
			const file=files[i];
			setCurrentFile(file.name);
			setProgress(Math.round(((i+0.1)/files.length)*100));

			try {
				const result=await convertImage(file,toFormat,{
					quality,
					width: width? parseInt(width):null,
					height: height? parseInt(height):null,
					maintainAspectRatio
				});
				results.push({...result,originalName: file.name,success: true});
			} catch(error) {
				results.push({originalName: file.name,success: false,error: error.message});
			}
			setProgress(Math.round(((i+1)/files.length)*100));
		}

		setConvertedFiles(results);
		setIsConverting(false);
		setCurrentFile("");
		const successCount=results.filter(r => r.success).length;
		showNotification(`Processed ${successCount}/${files.length} images`);
	};

	const downloadAll=() => {
		const successFiles=convertedFiles.filter(f => f.success);
		successFiles.forEach(file => downloadImage(file.blob,file.fileName));
	};

	const downloadSingle=(file) => downloadImage(file.blob,file.fileName);

	const reset=() => {
		setFiles([]);
		setConvertedFiles([]);
		setProgress(0);
		setCurrentFile("");
	};

	const totalOriginalSize=convertedFiles.reduce((sum,f) => sum+(f.originalSize||0),0);
	const totalConvertedSize=convertedFiles.reduce((sum,f) => sum+(f.convertedSize||0),0);
	const totalReduction=calculateReduction(totalOriginalSize,totalConvertedSize);

	// --- EMPTY STATE ---
	if(files.length===0&&convertedFiles.length===0) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] p-4 animate-in fade-in zoom-in duration-700">
				<div className="text-center space-y-4 mb-12">
					<Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary py-1 px-4 text-[10px] font-black tracking-[0.4em] uppercase">
						Neural Processing
					</Badge>
					<h2 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent font-orbitron">
						BATCH CONVERTER
					</h2>
					<p className="text-muted-foreground max-w-2xl mx-auto text-[10px] font-black tracking-[0.3em] uppercase opacity-70">
						High-Fidelity Conversion • Multi-Threaded • Format Optimization
					</p>
				</div>

				<div
					className={cn(
						"w-full max-w-4xl h-[450px] rounded-[3rem] p-1 transition-all duration-500 shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.1),inset_0_20px_60px_rgba(var(--glass-shadow-color),0.3)]",
						dragActive? "scale-[1.02]":"hover:scale-[1.01]"
					)}
					onDragEnter={handleDrag}
					onDragLeave={handleDrag}
					onDragOver={handleDrag}
					onDrop={handleDrop}
				>
					<div className={cn(
						"relative w-full h-full bg-card/40 backdrop-blur-3xl rounded-[3rem] border border-border/50 overflow-hidden flex flex-col items-center justify-center gap-8 transition-all duration-500 group cursor-pointer shadow-[inset_0_4px_20px_rgba(var(--glass-shadow-color),0.15)]",
						dragActive? "bg-primary/5 border-primary/50":"hover:bg-card/60 hover:border-primary/30"
					)}
						onClick={() => fileInputRef.current?.click()}
					>
						{/* Decorative Glows */}
						<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

						<div className="relative z-10 p-8 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 shadow-[inset_0_2px_10px_rgba(var(--glass-shadow-color),0.08)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
							<CloudUpload className="w-16 h-16 text-primary" />
						</div>

						<div className="relative z-10 text-center space-y-3">
							<h2 className="text-3xl md:text-5xl font-black italic text-foreground tracking-tighter font-orbitron drop-shadow-sm">
								DROP IMAGES
							</h2>
							<div className="inline-flex gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
								<span>PNG</span>
								<span>JPG</span>
								<span>WEBP</span>
								<span>GIF</span>
							</div>
						</div>

						<input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
					</div>
				</div>
			</div>
		);
	}

	// --- WORKSPACE ---
	return (
		<div className="w-full max-w-[1600px] mx-auto min-h-[85vh] flex flex-col items-center justify-center p-4 animate-in slide-in-from-bottom-8 duration-700">

			{/* Main Glass Container with Theme-Aware Shadows */}
			<div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 bg-card/60 backdrop-blur-3xl border border-border/50 rounded-[3rem] p-4 shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.08),inset_0_50px_100px_rgba(var(--glass-shadow-color),0.12)] relative overflow-hidden">

				{/* Background Ambient */}
				<div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

				{/* --- LEFT COLUMN: FILE QUEUE --- */}
				<div className="lg:col-span-7 flex flex-col gap-6 relative z-10 h-full">

					{/* File Queue Panel */}
					<div className="relative w-full min-h-[300px] rounded-[2.5rem] overflow-hidden bg-card/30 border border-border/50 shadow-[inset_0_0_50px_rgba(var(--glass-shadow-color),0.08)] group ring-1 ring-border/20 p-6">

						{/* Header */}
						<div className="flex items-center justify-between mb-6">
							<h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
								<LayoutGrid className="w-4 h-4 text-primary" /> Active Queue
								<Badge variant="outline" className="ml-2 text-[8px] border-primary/30 text-primary">{files.length} FILES</Badge>
							</h3>
							<Button variant="ghost" size="sm" onClick={clearQueue} className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-500/10 hover:border-red-500/30 shadow-[inset_0_1px_4px_rgba(var(--glass-shadow-color),0.08)]">
								Clear All
							</Button>
						</div>

						{/* File Grid */}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
							{files.map((file,index) => (
								<div key={index} className="flex items-center justify-between p-4 rounded-xl bg-card/40 border border-border/50 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.08),inset_0_4px_12px_rgba(var(--glass-shadow-color),0.04)] group/item animate-in slide-in-from-left-4 transition-all duration-500 hover:border-primary/30">
									<div className="flex items-center gap-3 min-w-0">
										<div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 flex items-center justify-center shrink-0 shadow-[inset_0_1px_4px_rgba(var(--glass-shadow-color),0.08)]">
											<ImageIcon className="w-4 h-4 text-primary" />
										</div>
										<div className="min-w-0 overflow-hidden">
											<p className="text-xs font-black truncate text-foreground uppercase tracking-tight max-w-[120px] md:max-w-[180px]">{file.name}</p>
											<p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{formatFileSize(file.size)}</p>
										</div>
									</div>
									<Button variant="ghost" size="icon" onClick={() => removeFile(index)} className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors shrink-0">
										<X className="h-4 w-4" />
									</Button>
								</div>
							))}
						</div>

						{/* Add More Button */}
						<div className="mt-4 pt-4 border-t border-border/50">
							<Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full h-12 rounded-xl border-dashed border-2 border-border/50 hover:border-primary/50 text-muted-foreground hover:text-primary text-[10px] font-black uppercase tracking-widest transition-all">
								<CloudUpload className="w-4 h-4 mr-2" /> Add More Images
							</Button>
							<input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
						</div>
					</div>

					{/* Results Panel */}
					{convertedFiles.length>0&&(
						<div className="rounded-[2rem] bg-card/30 border border-border/50 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.08),inset_0_10px_30px_rgba(var(--glass-shadow-color),0.08)] p-6 animate-in zoom-in duration-500">

							{/* Stats */}
							<div className="flex items-center justify-between p-4 rounded-xl bg-green-500/5 border border-green-500/20 mb-4">
								<div className="flex flex-col">
									<span className="text-[8px] font-black text-green-500 uppercase tracking-widest mb-1">Total Savings</span>
									<span className="text-2xl font-black text-green-500 italic tracking-tighter">-{totalReduction}%</span>
								</div>
								<div className="text-right">
									<p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">{formatFileSize(totalOriginalSize)} →</p>
									<p className="text-sm font-black text-green-500 font-mono">{formatFileSize(totalConvertedSize)}</p>
								</div>
							</div>

							{/* File List */}
							<div className="space-y-2 max-h-48 overflow-y-auto pr-2">
								{convertedFiles.map((file,index) => (
									<div key={index} className={cn(
										"flex items-center justify-between p-3 rounded-xl border transition-all",
										file.success? "border-green-500/20 bg-green-500/5":"border-destructive/20 bg-destructive/5"
									)}>
										<div className="flex items-center gap-3 min-w-0">
											<div className={file.success? "text-green-500":"text-destructive"}>
												{file.success? <CheckCircle2 className="h-4 w-4" />:<AlertCircle className="h-4 w-4" />}
											</div>
											<div className="min-w-0">
												<p className="text-[10px] font-black truncate text-foreground uppercase tracking-wider max-w-[150px]">{file.fileName||file.originalName}</p>
												{file.success&&(
													<p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">
														{formatFileSize(file.originalSize)} → {formatFileSize(file.convertedSize)}
													</p>
												)}
											</div>
										</div>
										{file.success&&(
											<Button variant="ghost" size="icon" onClick={() => downloadSingle(file)} className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg transition-all shrink-0">
												<Download className="h-4 w-4" />
											</Button>
										)}
									</div>
								))}
							</div>

							{/* Actions */}
							<div className="grid grid-cols-2 gap-3 mt-4">
								<Button onClick={downloadAll} className="h-12 rounded-xl bg-green-600 hover:bg-green-500 text-white shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.2)] text-[9px] font-black uppercase tracking-widest">
									<Download className="w-4 h-4 mr-2" /> Download All
								</Button>
								<Button variant="outline" onClick={reset} className="h-12 rounded-xl border-border/50 text-muted-foreground hover:text-foreground text-[9px] font-black uppercase tracking-widest shadow-[inset_0_1px_4px_rgba(var(--glass-shadow-color),0.08)]">
									<RefreshCw className="w-4 h-4 mr-2" /> Reset
								</Button>
							</div>
						</div>
					)}
				</div>

				{/* --- RIGHT COLUMN: CONTROLS --- */}
				<div className="lg:col-span-5 flex flex-col h-full gap-5 relative z-10">

					{/* Control Panel */}
					<div className="flex-1 flex flex-col gap-5 p-6 rounded-[2.5rem] bg-card/40 border border-border/50 backdrop-blur-xl relative overflow-hidden shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.08),inset_0_20px_50px_rgba(var(--glass-shadow-color),0.08)]">

						<div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-50" />

						<div className="flex items-center justify-between">
							<h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">
								<Settings className="w-4 h-4" /> Conversion Settings
							</h3>
						</div>

						{/* Format Selection */}
						<div className="space-y-4">
							<label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground pl-1">Output Format</label>

							{/* Target Format - Full Width */}
							<div className="space-y-2">
								<span className="text-[8px] font-black uppercase tracking-wider text-primary pl-1">Convert To</span>
								<Select value={toFormat} onValueChange={setToFormat}>
									<SelectTrigger className="w-full h-14 rounded-xl border-primary/50 bg-card/40 font-black text-sm text-primary shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.1),inset_0_4px_12px_rgba(var(--primary-rgb),0.05),0_0_20px_rgba(var(--primary-rgb),0.1)] hover:border-primary transition-all">
										<SelectValue placeholder="Select target format" />
									</SelectTrigger>
									<SelectContent className="rounded-xl border-primary/30 bg-card/95 backdrop-blur-xl shadow-[0_20px_60px_rgba(var(--glass-shadow-color),0.3),0_0_30px_rgba(var(--primary-rgb),0.1)]">
										{formats.map(format => (
											<SelectItem key={format.value} value={format.value} className="rounded-lg font-bold text-sm hover:bg-primary/10 focus:bg-primary/10">
												{format.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Format Info */}
							<p className="text-[8px] font-medium text-muted-foreground/60 pl-1">
								Accepts: PNG, JPG, GIF, WEBP, BMP, TIFF, AVIF
							</p>
						</div>

						{/* Quality Slider */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<label className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground pl-1">Quality</label>
								<Badge variant="outline" className="border-primary/30 text-primary text-[9px] font-black">{quality}%</Badge>
							</div>
							<input
								type="range" min="1" max="100" value={quality}
								onChange={(e) => setQuality(parseInt(e.target.value))}
								className="w-full accent-primary h-2 bg-border/50 rounded-full appearance-none cursor-pointer"
							/>
						</div>

						{/* Advanced Settings Toggle */}
						<button
							onClick={() => setShowAdvanced(!showAdvanced)}
							className={cn(
								"w-full p-4 rounded-xl border transition-all duration-300 text-left outline-none flex items-center justify-between",
								showAdvanced
									? "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/50 shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.1),inset_0_2px_10px_rgba(var(--primary-rgb),0.1)]"
									:"bg-background/20 border-border/50 hover:bg-background/40 hover:border-border shadow-[inset_0_2px_4px_rgba(var(--glass-shadow-color),0.04)]"
							)}
						>
							<div className="flex items-center gap-3">
								<Zap className={cn("w-4 h-4",showAdvanced? "text-primary":"text-muted-foreground")} />
								<div>
									<p className={cn("text-[10px] font-black uppercase tracking-wider",showAdvanced? "text-primary":"text-muted-foreground")}>
										Advanced Options
									</p>
									<p className="text-[8px] text-muted-foreground/60 font-medium uppercase tracking-wider">
										Resize, Aspect Ratio, Metadata
									</p>
								</div>
							</div>
							<ChevronDown className={cn("w-4 h-4 transition-transform",showAdvanced? "rotate-180 text-primary":"text-muted-foreground")} />
						</button>

						{/* Advanced Options Panel */}
						{showAdvanced&&(
							<div className="space-y-4 p-4 rounded-xl bg-card/30 border border-border/50 animate-in slide-in-from-top-2 duration-300 shadow-[inset_0_2px_8px_rgba(var(--glass-shadow-color),0.06)]">
								<div className="grid grid-cols-2 gap-3">
									<div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/30">
										<label className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Aspect Lock</label>
										<Switch checked={maintainAspectRatio} onCheckedChange={setMaintainAspectRatio} className="data-[state=checked]:bg-primary" />
									</div>
									<div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/30">
										<label className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Keep EXIF</label>
										<Switch checked={preserveMetadata} onCheckedChange={setPreserveMetadata} className="data-[state=checked]:bg-primary" />
									</div>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1">
										<label className="text-[8px] font-black uppercase tracking-wider text-muted-foreground pl-1">Width</label>
										<input type="number" placeholder="Auto" value={width} onChange={(e) => setWidth(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-border/50 bg-background/50 text-sm font-mono font-bold placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors" />
									</div>
									<div className="space-y-1">
										<label className="text-[8px] font-black uppercase tracking-wider text-muted-foreground pl-1">Height</label>
										<input type="number" placeholder="Auto" value={height} onChange={(e) => setHeight(e.target.value)} disabled={maintainAspectRatio} className="w-full h-10 px-3 rounded-lg border border-border/50 bg-background/50 text-sm font-mono font-bold placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors disabled:opacity-50" />
									</div>
								</div>
							</div>
						)}

					</div>

					{/* Action Button */}
					{isConverting? (
						<div className="h-20 w-full rounded-[2rem] bg-muted border border-border/50 flex flex-col items-center justify-center gap-2 shadow-[inset_0_2px_10px_rgba(var(--glass-shadow-color),0.08)]">
							<div className="flex items-center gap-3">
								<RefreshCw className="w-5 h-5 text-primary animate-spin" />
								<span className="text-muted-foreground font-black uppercase tracking-[0.2em] text-[10px]">Processing...</span>
							</div>
							<div className="w-3/4 h-1 bg-primary/10 rounded-full overflow-hidden">
								<div className="h-full bg-gradient-to-r from-primary to-primary/50 transition-all duration-300" style={{width: `${progress}%`}} />
							</div>
							<span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-wider">{currentFile}</span>
						</div>
					):(
						<Button
							onClick={convertAll}
							disabled={files.length===0||!toFormat}
							className={cn(
								"h-20 w-full rounded-[2rem] shadow-[inset_0_1px_1px_rgba(var(--glass-shadow-highlight),0.2),0_20px_60px_rgba(var(--primary-rgb),0.2)] border-t border-white/10 group overflow-hidden relative transition-all duration-300",
								(files.length===0||!toFormat)? "bg-muted cursor-not-allowed border-none shadow-[inset_0_2px_10px_rgba(var(--glass-shadow-color),0.08)] text-muted-foreground":"bg-primary hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.98] text-primary-foreground"
							)}
						>
							<div className="flex flex-col items-center justify-center gap-1">
								<div className="flex items-center gap-3">
									<Flame className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" />
									<span className="text-lg font-black uppercase tracking-[0.2em] font-orbitron">Convert</span>
								</div>
								<span className="text-[8px] font-bold uppercase tracking-[0.3em] opacity-40 group-hover:opacity-80 transition-opacity">
									{files.length} files → {toFormat.toUpperCase()||"Select format"}
								</span>
							</div>
						</Button>
					)}

				</div>

			</div>

			{/* Notification */}
			{notification&&(
				<div className={cn(
					"fixed bottom-8 right-8 z-[100] flex items-center gap-4 rounded-2xl px-6 py-4 shadow-2xl animate-in slide-in-from-right-8 duration-500 border",
					notification.type==='error'? "bg-red-500 border-red-600 text-white":"bg-primary border-primary/20 text-primary-foreground"
				)}>
					{notification.type==='error'? <AlertCircle className="h-5 w-5" />:<CheckCircle2 className="h-5 w-5" />}
					<span className="text-xs font-black uppercase tracking-widest">{notification.message}</span>
				</div>
			)}
		</div>
	);
}
