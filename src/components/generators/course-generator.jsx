"use client";

import {useState,useRef} from "react";
import {Card,CardContent,CardHeader,CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Progress} from "@/components/ui/progress";
import {ScrollArea} from "@/components/ui/scroll-area";
import {
	FileText,
	Upload,
	Code,
	Eye,
	Copy,
	CheckCircle2,
	AlertCircle,
	History
} from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import {
	processCourseFile,
	generateOverviewCode,
	generateCourseObjectivesCode,
	generateSyllabusCode,
	generateFAQCode,
	generateMainPointsCode
} from "@/lib/docx-processor";
import {PreviewDrawer} from "@/components/preview-drawer";
import {ProgressButton} from "@/components/progress-button";
import {HistoryList} from "@/components/history-list";
import {useAuthAction} from "@/lib/use-auth-action";
import {toast} from "sonner";
import {useEffect} from "react";
import {saveGeneratorState, getLatestGeneratorState} from "@/lib/tool-history";

export function CourseGenerator() {
	const [courseName,setCourseName]=useState("");
	const [file,setFile]=useState(null);
	const [isProcessing,setIsProcessing]=useState(false);
	const [progress,setProgress]=useState(0);
	const [progressText,setProgressText]=useState("");
	const [courseData,setCourseData]=useState(null);
	const { performAction } = useAuthAction();

	// Generated Code States
	const [overviewCode,setOverviewCode]=useState("");
	const [objectivesCode,setObjectivesCode]=useState("");
	const [syllabusCode,setSyllabusCode]=useState("");
	const [faqCode,setFaqCode]=useState("");
	const [mainPointsCode,setMainPointsCode]=useState("");

	// Media URL for Overview (auto-detects if it's video or image)
	const [mediaUrl,setMediaUrl]=useState("");
	const [restoredFileName, setRestoredFileName] = useState("");

	// View State
	const [activeView,setActiveView]=useState("mainpoints"); // mainpoints, overview, objectives, syllabus, faq
	const fileInputRef=useRef(null);

	// Preview Drawer State
	const [previewOpen,setPreviewOpen]=useState(false);
	const [previewContent,setPreviewContent]=useState("");
	const [previewTitle,setPreviewTitle]=useState("");

	// Load latest state on mount
	useEffect(() => {
		const loadState = async () => {
			const state = await getLatestGeneratorState('course_generator');
			if (state) {
				setCourseName(state.courseName || "");
				setCourseData(state.courseData || null);
				setOverviewCode(state.overviewCode || "");
				setObjectivesCode(state.objectivesCode || "");
				setSyllabusCode(state.syllabusCode || "");
				setFaqCode(state.faqCode || "");
				setMainPointsCode(state.mainPointsCode || "");
				setMediaUrl(state.mediaUrl || "");
				if (state.courseData) {
					toast.info("Restored last session assets");
				}
			}
		};
		loadState();
	}, []);

	// Auto-save helper
	const persistState = async (updates = {}) => {
		const currentState = {
			courseName,
			courseData,
			overviewCode,
			objectivesCode,
			syllabusCode,
			faqCode,
			mainPointsCode,
			mediaUrl,
			fileName: updates.fileName || file?.name || restoredFileName || courseName || 'Course Content',
			...updates
		};
		await saveGeneratorState('course_generator', currentState, currentState.fileName);
	};

	const showNotification=(message,type="success") => {
		if (type === 'error') toast.error(message);
		else if (type === 'warning' || type === 'info') toast.info(message);
		else toast.success(message);
	};

	const handleFileChange=(e) => {
		if(e.target.files&&e.target.files[0]) {
			setFile(e.target.files[0]);
			showNotification(`Selected: ${e.target.files[0].name}`,"info");
		}
	};

	const handleUpload=async () => {
		if(!file) return showNotification("Please select a file to upload.","warning");
		if(!courseName) return showNotification("Please enter a course name.","warning");

		setIsProcessing(true);
		setProgress(10);
		setProgressText("Reading DOCX file...");

		try {
			// Record to media hub
			const { recordMediaUpload } = await import("@/lib/media-hub");
			await recordMediaUpload({
				fileName: file.name,
				fileType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
				fileSize: file.size
			});
			// Simulate progress
			const interval=setInterval(() => {
				setProgress(p => Math.min(p+10,90));
			},200);

			const data=await processCourseFile(file,courseName);

			clearInterval(interval);
			setProgress(100);
			setProgressText("Course content extracted successfully!");
			setCourseData(data);
			showNotification("Course content extracted successfully!","success");
			persistState({ courseData: data, courseName });

			setTimeout(() => {
				setIsProcessing(false);
				setProgress(0);
				setProgressText("");
			},2000);

		} catch(error) {
			setIsProcessing(false);
			showNotification("Error extractng content: "+error.message,"error");
		}
	};

	const handleGenerateOverview=() => {
		if(!courseData?.fileProcessed) return showNotification("Please upload and process a DOCX file first.","warning");
		const code=generateOverviewCode(courseData,mediaUrl);
		setOverviewCode(code);
		setActiveView("overview");
		showNotification("Overview code generated successfully!");
		persistState({ overviewCode: code, activeView: "overview" });
	};

	const handleGenerateObjectives=() => {
		if(!courseData?.fileProcessed) return showNotification("Please upload and process a DOCX file first.","warning");
		const code=generateCourseObjectivesCode(courseData);
		setObjectivesCode(code);
		setActiveView("objectives");
		showNotification("Course Objectives code generated successfully!");
		persistState({ objectivesCode: code, activeView: "objectives" });
	};

	const handleGenerateSyllabus=() => {
		if(!courseData?.fileProcessed) return showNotification("Please upload and process a DOCX file first.","warning");
		const code=generateSyllabusCode(courseData);
		setSyllabusCode(code);
		setActiveView("syllabus");
		showNotification("Syllabus code generated successfully!");
		persistState({ syllabusCode: code, activeView: "syllabus" });
	};

	const handleGenerateFAQ=() => {
		if(!courseData?.fileProcessed) return showNotification("Please upload and process a DOCX file first.","warning");
		const code=generateFAQCode(courseData);
		setFaqCode(code);
		setActiveView("faq");
		showNotification("FAQ code generated successfully!");
		persistState({ faqCode: code, activeView: "faq" });
	};

	const handleGenerateMainPoints=() => {
		if(!courseData?.fileProcessed) return showNotification("Please upload and process a DOCX file first.","warning");
		const code=generateMainPointsCode(courseData);
		setMainPointsCode(code);
		setActiveView("mainpoints");
		showNotification("Main Points code generated successfully!");
		persistState({ mainPointsCode: code, activeView: "mainpoints" });
	};

	const downloadDemoFile=() => {
		performAction(() => {
			const link=document.createElement('a');
			link.href='https://media.hazwoper-osha.com/wp-content/uploads/2025/12/1765354187/demo-file-of-website-content-for-3-section.docx';
			link.download='demo-file-of-website-content-for-3-section.docx';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}, { type: 'download', name: 'Demo Course File' });
	};

	const openPreview=(content,title) => {
		setPreviewContent(content);
		setPreviewTitle(title);
		setPreviewOpen(true);
	};

	const copyToClipboard=(text) => {
		performAction(() => {
			navigator.clipboard.writeText(text);
		}, { type: 'copy', name: 'Course Code' });
	};

	const handleRestore = (state) => {
		if (!state) return;
		setCourseName(state.courseName || "");
		setCourseData(state.courseData || null);
		setOverviewCode(state.overviewCode || "");
		setObjectivesCode(state.objectivesCode || "");
		setSyllabusCode(state.syllabusCode || "");
		setFaqCode(state.faqCode || "");
		setMainPointsCode(state.mainPointsCode || "");
		setMediaUrl(state.mediaUrl || "");
		setRestoredFileName(state.fileName || "");
		if (state.activeView) setActiveView(state.activeView);
		toast.success("Identity session synchronized");
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-end">
				<Sheet>
					<SheetTrigger asChild>
						<Button variant="outline" className="h-11 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 border-primary/20 hover:bg-primary/5 transition-all shadow-sm">
							<History className="h-4 w-4 text-primary" /> Neural Sync History
						</Button>
					</SheetTrigger>
					<SheetContent side="right" className="w-full sm:max-w-[50%] p-0 glass-panel-deep border-l border-border animate-in slide-in-from-right duration-500 z-[200]">
						<SheetHeader className="p-8 border-b border-border/50 bg-muted/20">
							<SheetTitle className="flex items-center gap-3 text-xl font-black">
								<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
									<History className="h-5 w-5 text-primary" />
								</div>
								Neural Sync Hub
							</SheetTitle>
						</SheetHeader>
						<HistoryList toolType="course_generator" onRestore={handleRestore} />
					</SheetContent>
				</Sheet>
			</div>

			<div className="grid lg:grid-cols-2 gap-6">

				{/* LEFT COLUMN: Controls */}
				<div className="space-y-6">

					{/* Upload Card */}
					<Card className="card">
						<CardHeader className="card-header">
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5 text-warning" />
								Upload DOCX File
							</CardTitle>
						</CardHeader>
						<CardContent className="card-body space-y-4">
							<div className="space-y-2">
								<Label htmlFor="courseName">Course Name</Label>
								<Input
									id="courseName"
									placeholder="Enter course name (e.g., Swing Stage Scaffold Training)"
									value={courseName}
									onChange={(e) => setCourseName(e.target.value)}
									className="form-control"
								/>
							</div>

							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">
									Download our demo file to check the required structure. Create your course file following the same format, then upload for easy website content code generation.
								</p>
								<Button variant="outline" size="sm" onClick={downloadDemoFile} className="btn">
									<Upload className="mr-2 h-4 w-4" />
									Download Demo Course File
								</Button>
							</div>

							<div className="space-y-4">
								<div className="file-upload-area p-8 border-2 border-dashed rounded-lg text-center cursor-pointer hover:bg-muted/50 transition-colors"
									onClick={() => fileInputRef.current?.click()}>
									<Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
									<p className="text-sm text-muted-foreground">Click to upload DOCX file</p>
								</div>
								<Input
									ref={fileInputRef}
									type="file"
									accept=".docx"
									onChange={handleFileChange}
									className="hidden"
								/>
								<div className="text-xs text-muted-foreground mt-1 text-center font-medium italic">
									{file ? `Selected: ${file.name}` : 
									 restoredFileName ? `Identity Restored: ${restoredFileName}` : "No file selected"}
								</div>
								
								{/* Media URL - Integration */}
								<div className="space-y-3 pt-4 border-t">
									<Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground pl-1">Overview Media (Optional)</Label>
									<div className="space-y-2">
										<Input
											placeholder="Vimeo/YouTube URL or image path"
											value={mediaUrl}
											onChange={(e) => setMediaUrl(e.target.value)}
											className="form-control text-xs"
										/>
										<p className="text-[9px] text-muted-foreground italic pl-1">
											Auto-detects video or image based on URL. Leave empty to skip.
										</p>
									</div>
								</div>

								<div className="pt-2">
									<ProgressButton 
										onClick={handleUpload} 
										isLoading={isProcessing}
										progress={progress}
										disabled={!file || !courseName}
										label="Process and Prepare Course"
										loadingLabel={progressText || "Processing"}
										className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 rounded-xl text-sm font-semibold shadow-md transition-all active:scale-[0.98]"
										variant="default"
									/>
								</div>
							</div>
						</CardContent>
					</Card>


					{/* Actions Card - Hidden until processed */}
					{courseData && (
						<Card className="card animate-in fade-in slide-in-from-top-4 duration-500">
							<CardHeader className="card-header">
								<CardTitle className="flex items-center gap-2">
									<Code className="h-5 w-5 text-info" />
									Generate HTML Content
								</CardTitle>
							</CardHeader>
							<CardContent className="card-body">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<Button onClick={handleGenerateMainPoints} className="btn bg-purple-600 hover:bg-purple-700 text-white h-11 rounded-xl font-medium text-sm">
										<Code className="mr-2 h-4 w-4" /> Main Points
									</Button>
									<Button onClick={handleGenerateOverview} className="btn bg-green-600 hover:bg-green-700 text-white h-11 rounded-xl font-medium text-sm">
										<Code className="mr-2 h-4 w-4" /> Generate Overview
									</Button>
									<Button onClick={handleGenerateObjectives} className="btn bg-green-600 hover:bg-green-700 text-white h-11 rounded-xl font-medium text-sm">
										<Code className="mr-2 h-4 w-4" /> Course Objectives
									</Button>
									<Button onClick={handleGenerateSyllabus} className="btn bg-green-600 hover:bg-green-700 text-white h-11 rounded-xl font-medium text-sm">
										<Code className="mr-2 h-4 w-4" /> Generate Syllabus
									</Button>
									<Button onClick={handleGenerateFAQ} className="btn bg-green-600 hover:bg-green-700 text-white h-11 rounded-xl font-medium text-sm">
										<Code className="mr-2 h-4 w-4" /> Generate FAQ
									</Button>
								</div>
							</CardContent>
						</Card>
					)}

				</div>


				{/* RIGHT COLUMN: Output */}
				<div className="space-y-6">
					<div className="card bg-card border rounded-lg shadow-sm min-h-[600px] flex flex-col overflow-hidden">

						{/* Selector Buttons */}
						{(mainPointsCode||overviewCode||objectivesCode||syllabusCode||faqCode)? (
							<div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
								<button
									onClick={() => setActiveView("mainpoints")}
									className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView==='mainpoints'
										? 'bg-primary text-primary-foreground shadow-sm'
										:'hover:bg-accent text-muted-foreground'
										}`}
								>
									Main Points
								</button>
								<button
									onClick={() => setActiveView("overview")}
									className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView==='overview'
										? 'bg-primary text-primary-foreground shadow-sm'
										:'hover:bg-accent text-muted-foreground'
										}`}
								>
									Overview
								</button>
								<button
									onClick={() => setActiveView("objectives")}
									className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView==='objectives'
										? 'bg-primary text-primary-foreground shadow-sm'
										:'hover:bg-accent text-muted-foreground'
										}`}
								>
									Objectives
								</button>
								<button
									onClick={() => setActiveView("syllabus")}
									className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView==='syllabus'
										? 'bg-primary text-primary-foreground shadow-sm'
										:'hover:bg-accent text-muted-foreground'
										}`}
								>
									Syllabus
								</button>
								<button
									onClick={() => setActiveView("faq")}
									className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeView==='faq'
										? 'bg-primary text-primary-foreground shadow-sm'
										:'hover:bg-accent text-muted-foreground'
										}`}
								>
									FAQ
								</button>
							</div>
						):(
							<div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10">
								<Code className="h-12 w-12 mb-4 opacity-20" />
								<h4 className="text-xl font-medium mb-2">No Code Generated Yet</h4>
								<p className="text-sm text-center max-w-xs">
									Upload a file and generate content to see the code here
								</p>
							</div>
						)}

						{/* Textarea Content */}
						{(mainPointsCode||overviewCode||objectivesCode||syllabusCode||faqCode)&&(
							<div className="flex-1 p-4 flex flex-col h-full overflow-hidden">

								{/* FAQ Interactive List Removed to match Blog Generator UI */}

								<div className="flex items-center justify-between mb-2 mt-2">
									<h4 className="text-sm font-semibold flex items-center gap-2">
										<Code className="h-4 w-4" />
										{activeView==='mainpoints'&&"Main Points Code"}
										{activeView==='overview'&&"Overview Code"}
										{activeView==='objectives'&&"Course Objectives Code"}
										{activeView==='syllabus'&&"Syllabus Code"}
										{activeView==='faq'&&"Full FAQ HTML Code"}
									</h4>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											className="preview-icon-btn"
											onClick={() => {
												const content={
													'mainpoints': mainPointsCode,
													'overview': overviewCode,
													'objectives': objectivesCode,
													'syllabus': syllabusCode,
													'faq': faqCode
												}[activeView];
												const title={
													'mainpoints': 'Main Points',
													'overview': 'Overview',
													'objectives': 'Course Objectives',
													'syllabus': 'Syllabus',
													'faq': 'FAQ'
												}[activeView];
												openPreview(content,title);
											}}
										>
											<Eye className="h-3 w-3 mr-1" /> Preview
										</Button>
										<Button
											size="sm"
											className="copy-btn"
											onClick={() => {
												const content={
													'mainpoints': mainPointsCode,
													'overview': overviewCode,
													'objectives': objectivesCode,
													'syllabus': syllabusCode,
													'faq': faqCode
												}[activeView];
												copyToClipboard(content);
											}}
										>
											<Copy className="h-3 w-3 mr-1" /> Copy All
										</Button>
									</div>
								</div>

								<textarea
									className="flex-1 w-full bg-muted/50 border rounded-md p-4 font-mono text-xs resize-none focus:outline-ring code-editor"
									value={
										activeView==='mainpoints'? mainPointsCode:
										activeView==='overview'? overviewCode:
										activeView==='objectives'? objectivesCode:
										activeView==='syllabus'? syllabusCode:
										activeView==='faq'? faqCode:""
									}
									onChange={(e) => {
										const val = e.target.value;
										if (activeView === 'mainpoints') setMainPointsCode(val);
										else if (activeView === 'overview') setOverviewCode(val);
										else if (activeView === 'objectives') setObjectivesCode(val);
										else if (activeView === 'syllabus') setSyllabusCode(val);
										else if (activeView === 'faq') setFaqCode(val);
									}}
									placeholder="Code will appear here..."
								/>
							</div>
						)}
					</div>
				</div>
			</div>

			<PreviewDrawer
				open={previewOpen}
				onOpenChange={setPreviewOpen}
				title={previewTitle}
				content={previewContent}
				data={activeView==='faq'? courseData?.faqData:null}
			/>

			{/* Notification system replaced by Sonner */}
		</div>
	);
}

