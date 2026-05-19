"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuthAction } from "@/lib/use-auth-action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
	Eraser,
	Eye,
	History,
	Undo2,
	Copy,
	Trash2,
	FileText,
	Code,
	Settings
} from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { PreviewDrawer } from "@/components/preview-drawer";
import { cleanHTML, getHTMLStats, getReductionRate } from "@/lib/html-cleaner";
import { ProgressButton } from "@/components/progress-button";
import { saveGeneratorState } from "@/lib/tool-history";
import { HistoryList } from "@/components/history-list";

const defaultOptions = {
	removeNBSP: true,
	removeClasses: true,
	removeIds: true,
	removeStyleAttrs: true,
	removeDataAttrs: true,
	removeEmptyTags: true,
	removeInlineStyles: true,
	removeFontTags: false,
	minifyHTML: false,
	beautifyHTML: false,
	preserveEssentialAttrs: true,
	removeComments: true,
	normalizeWhitespace: true,
	removeScriptStyleTags: true,
	removeBrTags: true,
	convertLineBreaks: true
};

const optionLabels = {
	removeNBSP: { label: "Remove &nbsp;" },
	removeClasses: { label: "Remove classes" },
	removeIds: { label: "Remove IDs" },
	removeStyleAttrs: { label: "Remove style attrs" },
	removeDataAttrs: { label: "Remove data attrs" },
	removeEmptyTags: { label: "Remove empty tags" },
	removeInlineStyles: { label: "Remove inline styles" },
	removeFontTags: { label: "Remove font/span" },
	minifyHTML: { label: "Minify HTML" },
	beautifyHTML: { label: "Beautify HTML" },
	preserveEssentialAttrs: { label: "Preserve essential" },
	removeComments: { label: "Remove comments" },
	normalizeWhitespace: { label: "Normalize whitespace" },
	removeScriptStyleTags: { label: "Remove script/style" },
	removeBrTags: { label: "Remove <br> tags" },
	convertLineBreaks: { label: "Convert line breaks" }
};

export function HTMLCleaner() {
	const { performAction } = useAuthAction();
	const [html, setHtml] = useState("");
	const [options, setOptions] = useState(defaultOptions);
	const [stats, setStats] = useState({ charCount: 0, wordCount: 0, nbspCount: 0, tagCount: 0, cleanScore: 0 });
	const [reductionRate, setReductionRate] = useState(0);
	const [history, setHistory] = useState([]);
	const [historyIndex, setHistoryIndex] = useState(-1);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);

	// Update stats when HTML changes
	useEffect(() => {
		if (typeof window !== 'undefined' && html) {
			const newStats = getHTMLStats(html);
			setStats(newStats);
		}
	}, [html]);

	const saveState = async (currentHtml) => {
		if (!currentHtml) return;
		await saveGeneratorState('html_cleaner', {
			html: currentHtml,
			options
		}, `Cleaned HTML - ${new Date().toLocaleTimeString()}`);
	};

	const handleClean = useCallback(() => {
		if (!html.trim()) {
			toast.error("Please enter some HTML first");
			return;
		}

		setIsProcessing(true);

		// Save current state to local undo history
		setHistory(prev => [...prev.slice(0, historyIndex + 1), html]);
		setHistoryIndex(prev => prev + 1);

		try {
			const cleaned = cleanHTML(html, options);
			const reduction = getReductionRate(html, cleaned);

			setHtml(cleaned);
			setReductionRate(reduction);
			toast.success(`HTML cleaned! Reduced by ${reduction}%`);
			saveState(cleaned);
		} catch (error) {
			toast.error("Error cleaning HTML: " + error.message);
		} finally {
			setIsProcessing(false);
		}
	}, [html, options, historyIndex]);

	const handleUndo = () => {
		if (historyIndex >= 0) {
			setHtml(history[historyIndex]);
			setHistoryIndex(prev => prev - 1);
			toast.info("Undo successful");
		}
	};

	const handleCopy = async () => {
		if (!html.trim()) {
			toast.error("Nothing to copy");
			return;
		}
		performAction(async () => {
			await navigator.clipboard.writeText(html);
		}, { type: 'copy', name: 'HTML Cleaner' });
	};

	const handleClear = () => {
		if (html) {
			setHistory(prev => [...prev, html]);
			setHistoryIndex(prev => prev + 1);
		}
		setHtml("");
		setReductionRate(0);
		toast.info("Editor cleared");
	};

	const handleRestore = (state) => {
		if (!state) return;
		setHtml(state.html || "");
		if (state.options) setOptions(state.options);
		toast.success("HTML session synchronized");
	};

	const toggleOption = (key) => {
		setOptions(prev => ({ ...prev, [key]: !prev[key] }));
	};

	const selectAll = () => {
		setOptions(Object.fromEntries(Object.keys(defaultOptions).map(k => [k, true])));
	};

	const deselectAll = () => {
		setOptions(Object.fromEntries(Object.keys(defaultOptions).map(k => [k, false])));
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
							<SheetTitle className="flex items-center gap-3 text-sm font-black">
								<div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
									<History className="h-5 w-5 text-primary" />
								</div>
								Neural Sync Hub
							</SheetTitle>
						</SheetHeader>
						<HistoryList toolType="html_cleaner" onRestore={handleRestore} />
					</SheetContent>
				</Sheet>
			</div>

			<Card className="card">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Eraser className="h-5 w-5 text-blue-500" />
						Advanced HTML Cleaner
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap gap-2">
						<ProgressButton 
							onClick={handleClean} 
							disabled={isProcessing || !html.trim()}
							isLoading={isProcessing}
							label="Clean HTML"
							loadingLabel="Cleaning..."
							className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold px-6 h-10 rounded-xl shadow-sm transition-all"
							variant="default"
						/>
						<Button variant="outline" onClick={() => setPreviewOpen(true)} className="h-10 rounded-xl">
							<Eye className="mr-2 h-4 w-4" /> Preview
						</Button>
						<Button variant="outline" onClick={handleUndo} disabled={historyIndex < 0} className="h-10 rounded-xl">
							<Undo2 className="mr-2 h-4 w-4" /> Undo
						</Button>
						<Button variant="outline" onClick={handleCopy} className="h-10 rounded-xl">
							<Copy className="mr-2 h-4 w-4" /> Copy
						</Button>
						<Button variant="outline" onClick={handleClear} className="h-10 rounded-xl">
							<Trash2 className="mr-2 h-4 w-4" /> Clear
						</Button>
					</div>

					<div className="space-y-2">
						<Label className="flex items-center gap-2">
							<Code className="h-4 w-4" /> Paste your HTML here:
						</Label>
						<Textarea
							value={html}
							onChange={(e) => setHtml(e.target.value)}
							placeholder="Paste your HTML content here..."
							className="min-h-[300px] font-mono text-sm rounded-xl bg-muted/30"
						/>
					</div>

					<div className="grid grid-cols-3 md:grid-cols-6 gap-2">
						{[
							{ label: "Chars", value: stats.charCount.toLocaleString() },
							{ label: "Words", value: stats.wordCount.toLocaleString() },
							{ label: "nbsp", value: stats.nbspCount },
							{ label: "Tags", value: stats.tagCount },
							{ label: "Score", value: `${stats.cleanScore}%` },
							{ label: "Reduction", value: `${reductionRate}%`, color: "text-green-500" }
						].map((stat, i) => (
							<div key={i} className="rounded-xl border p-3 text-center bg-muted/20">
								<div className="text-[10px] uppercase font-bold text-muted-foreground">{stat.label}</div>
								<div className={`text-lg font-black ${stat.color || ""}`}>{stat.value}</div>
							</div>
						))}
					</div>

					<Accordion type="single" collapsible className="w-full">
						<AccordionItem value="options" className="border-none">
							<AccordionTrigger className="hover:no-underline py-2">
								<div className="flex items-center gap-2 text-sm font-bold">
									<Settings className="h-4 w-4" /> Cleaning Options
								</div>
							</AccordionTrigger>
							<AccordionContent>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
									{Object.entries(optionLabels).map(([key, { label }]) => (
										<div key={key} className="flex items-center space-x-2">
											<Switch
												id={key}
												checked={options[key]}
												onCheckedChange={() => toggleOption(key)}
											/>
											<Label htmlFor={key} className="text-xs cursor-pointer">
												{label}
											</Label>
										</div>
									))}
								</div>
								<div className="flex gap-2 mt-6 pt-4 border-t border-border/50">
									<Button variant="outline" size="sm" onClick={selectAll} className="rounded-lg text-[10px] h-8 px-4 font-black uppercase">
										Select All
									</Button>
									<Button variant="outline" size="sm" onClick={deselectAll} className="rounded-lg text-[10px] h-8 px-4 font-black uppercase">
										Deselect All
									</Button>
								</div>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</CardContent>
			</Card>

			<PreviewDrawer
				open={previewOpen}
				onOpenChange={setPreviewOpen}
				title="HTML Preview"
				content={html}
			/>
		</div>
	);
}
