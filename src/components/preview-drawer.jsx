"use client";

import {Button} from "@/components/ui/button";
import {Sheet,SheetContent,SheetHeader,SheetTitle} from "@/components/ui/sheet";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Eye,Copy,X} from "lucide-react";
import {useState} from "react";

export function PreviewDrawer({
	open,
	onOpenChange,
	title,
	content,
	onCopy,
	data
}) {
	const [copied,setCopied]=useState(false);

	const handleCopy=async () => {
		if(content) {
			await navigator.clipboard.writeText(content);
			setCopied(true);
			setTimeout(() => setCopied(false),2000);
			onCopy?.();
		}
	};

	// Process HTML to add SEO attributes
	const processSEO = (html) => {
		if (!html) return '';
		let processed = html.replace(/\<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1([^>]*)\>/gi,(match,p1,p2,p3) => {
			let cleanP3=p3.replace(/\s+(target|rel)=["'][^"']*?["']/gi,'').trim();
			const isInternalLink = p2.toLowerCase().includes('hazwoper-osha.com');
			let newTag='<a href="'+p2+'" target="_blank"';
			if (!isInternalLink) newTag+=' rel="noopener noreferrer"';
			if(cleanP3) newTag+=' '+cleanP3;
			newTag+='>';
			return newTag;
		});
		return processed.replace(/&nbsp;/g, ' ');
	};

	const copyText=async (text) => {
		await navigator.clipboard.writeText(processSEO(text));
	};

	const isFaqView=title?.toLowerCase().includes('faq')&&Array.isArray(data)&&data.length>0;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-[80vw] sm:max-w-none p-0 border-l shadow-2xl" data-hide-default-close="true">
				<SheetHeader className="flex flex-row items-center justify-between border-b border-border p-4">
					<div className="flex items-center gap-2">
						<Eye className="h-5 w-5 text-primary" />
						<SheetTitle>{title} Preview</SheetTitle>
					</div>
					<div className="flex items-center gap-2 pr-6">
						<Button
							variant="outline"
							size="sm"
							onClick={() => onOpenChange(false)}
							className="gap-2"
						>
							<X className="h-4 w-4" />
							Close
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={handleCopy}
							className="gap-2"
						>
							<Copy className="h-4 w-4" />
							{copied? 'Copied!':'Copy Code'}
						</Button>
					</div>
				</SheetHeader>
				<ScrollArea className="h-[calc(100vh-80px)]">
					<div className="p-6">
						{isFaqView? (
							<div className="space-y-3">
								<div className="alert alert-info bg-muted p-4 rounded-lg mb-4 text-sm text-muted-foreground border">
									<p className="font-semibold mb-1">FAQ Preview</p>
									<p>Each question and answer shown in a card. Use copy buttons to copy individual Q&A.</p>
								</div>
								
								{/* Show each FAQ in its own card, one per row */}
								{data.map((faq, idx) => (
									<div key={idx} className="border rounded-lg p-4 bg-card shadow-sm hover:shadow-md transition-shadow">
										{/* Question with numbering */}
										<div className="flex justify-between items-start gap-2 mb-3">
											<h5 className="font-bold text-base flex-1">
												<span className="text-primary mr-2">{idx + 1}.</span>
												{faq.question}
											</h5>
											<Button
												size="sm"
												variant="outline"
												className="h-7 text-xs shrink-0"
												onClick={() => copyText(faq.question)}
												title="Copy question"
											>
												<Copy className="h-3 w-3" />
											</Button>
										</div>
										
										{/* Answer */}
										<div className="flex justify-between items-start gap-2 pl-6">
											<div 
												className="faq-answer flex-1 text-sm text-muted-foreground" 
												dangerouslySetInnerHTML={{__html: processSEO(faq.answer)}}
											/>
											<Button
												size="sm"
												variant="outline"
												className="h-7 text-xs shrink-0"
												onClick={() => copyText(faq.answer)}
												title="Copy answer"
											>
												<Copy className="h-3 w-3" />
											</Button>
										</div>
									</div>
								))}
							</div>
						):(
							<div
								className="preview-container prose prose-sm dark:prose-invert max-w-none rounded-lg border border-border p-6"
								dangerouslySetInnerHTML={{__html: content||''}}
							/>
						)}
					</div>
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}
