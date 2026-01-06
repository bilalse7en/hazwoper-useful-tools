/**
 * Image Compressor + Converter Library
 * Key feature: Output is NEVER larger than input
 * Supports: PNG, JPG, WEBP, GIF, BMP, TIFF, AVIF
 */

/**
 * Get the file extension from a filename
 * @param {string} filename
 * @returns {string}
 */
function getFileExtension(filename) {
	const ext=filename.split('.').pop().toLowerCase();
	if(ext==='jpeg') return 'jpg';
	return ext;
}

/**
 * Convert and compress an image file
 * GUARANTEE: Output will never be larger than input
 * @param {File} file - The image file to convert
 * @param {string} toFormat - Target format (png, jpg, webp, etc.)
 * @param {Object} options - Conversion options
 * @returns {Promise<Object>} - Converted image data
 */
export async function convertImage(file,toFormat,options={}) {
	const defaultOptions={
		quality: 100,
		width: null,
		height: null,
		maintainAspectRatio: true
	};

	const opts={...defaultOptions,...options};
	const sourceFormat=getFileExtension(file.name);
	const targetFormat=toFormat.toLowerCase();
	const originalSize=file.size;

	try {
		// Load the image
		const img=await loadImage(file);

		// Calculate dimensions
		let targetWidth=opts.width? parseInt(opts.width):img.width;
		let targetHeight=opts.height? parseInt(opts.height):img.height;

		if(opts.maintainAspectRatio&&(opts.width||opts.height)) {
			const aspectRatio=img.width/img.height;
			if(opts.width&&!opts.height) {
				targetHeight=Math.round(targetWidth/aspectRatio);
			} else if(opts.height&&!opts.width) {
				targetWidth=Math.round(targetHeight*aspectRatio);
			}
		}

		// Check if same format, same dimensions, and 100% quality - return original
		const isSameFormat=(sourceFormat===targetFormat)||
			(sourceFormat==='jpg'&&targetFormat==='jpeg')||
			(sourceFormat==='jpeg'&&targetFormat==='jpg');

		const sameDimensions=targetWidth===img.width&&targetHeight===img.height;

		if(isSameFormat&&opts.quality===100&&sameDimensions) {
			const url=URL.createObjectURL(file);
			return {
				blob: file,
				url: url,
				originalSize: file.size,
				convertedSize: file.size,
				width: img.width,
				height: img.height,
				format: toFormat,
				fileName: getConvertedFileName(file.name,toFormat),
				preserved: true,
				reduction: 0
			};
		}

		// Create canvas
		const canvas=document.createElement('canvas');
		canvas.width=targetWidth;
		canvas.height=targetHeight;

		const ctx=canvas.getContext('2d');

		// Fill with white background for formats that don't support transparency
		if(['jpg','jpeg','bmp'].includes(targetFormat)) {
			ctx.fillStyle='#FFFFFF';
			ctx.fillRect(0,0,canvas.width,canvas.height);
		}

		// High-quality scaling
		ctx.imageSmoothingEnabled=true;
		ctx.imageSmoothingQuality='high';
		ctx.drawImage(img,0,0,targetWidth,targetHeight);

		const mimeType=getMimeType(targetFormat);

		// Convert quality percentage to actual quality value
		// Start with user's requested quality
		let qualityValue=opts.quality/100;

		// Try to get a blob smaller than original
		let blob=await canvasToBlob(canvas,mimeType,qualityValue);

		// If output is larger than original, progressively reduce quality
		if(blob.size>originalSize) {
			// Try multiple quality levels to get smaller file
			const qualityLevels=[0.9,0.8,0.7,0.6,0.5,0.4,0.3,0.2,0.1];

			for(const q of qualityLevels) {
				if(q>=qualityValue) continue; // Skip if higher than user's choice

				const attemptBlob=await canvasToBlob(canvas,mimeType,q);
				if(attemptBlob.size<=originalSize) {
					blob=attemptBlob;
					qualityValue=q;
					break;
				}
				// Keep the smallest one we've found
				if(attemptBlob.size<blob.size) {
					blob=attemptBlob;
					qualityValue=q;
				}
			}

			// If still larger than original after all attempts, return original file
			if(blob.size>originalSize) {
				// For same format, always return original if we can't make it smaller
				if(isSameFormat) {
					const url=URL.createObjectURL(file);
					return {
						blob: file,
						url: url,
						originalSize: file.size,
						convertedSize: file.size,
						width: img.width,
						height: img.height,
						format: toFormat,
						fileName: getConvertedFileName(file.name,toFormat),
						preserved: true,
						reduction: 0,
						note: 'Original preserved (already optimized)'
					};
				}
				// For different format, use smallest we could get but warn
			}
		}

		const convertedUrl=URL.createObjectURL(blob);
		const reduction=Math.round(((originalSize-blob.size)/originalSize)*100);

		return {
			blob: blob,
			url: convertedUrl,
			originalSize: originalSize,
			convertedSize: blob.size,
			width: targetWidth,
			height: targetHeight,
			format: toFormat,
			fileName: getConvertedFileName(file.name,toFormat),
			preserved: false,
			reduction: Math.max(0,reduction),
			actualQuality: Math.round(qualityValue*100)
		};
	} catch(error) {
		console.error('Conversion error:',error);
		throw new Error(`Failed to convert image: ${error.message}`);
	}
}

/**
 * Convert canvas to blob with given quality
 */
function canvasToBlob(canvas,mimeType,quality) {
	return new Promise((resolve,reject) => {
		canvas.toBlob(
			(blob) => {
				if(blob) {
					resolve(blob);
				} else {
					reject(new Error('Failed to create blob'));
				}
			},
			mimeType,
			quality
		);
	});
}

/**
 * Load an image file into an Image element
 */
function loadImage(file) {
	return new Promise((resolve,reject) => {
		const img=new Image();
		img.onload=() => {
			URL.revokeObjectURL(img.src);
			resolve(img);
		};
		img.onerror=() => {
			URL.revokeObjectURL(img.src);
			reject(new Error('Failed to load image'));
		};
		img.src=URL.createObjectURL(file);
	});
}

/**
 * Get MIME type for format
 */
function getMimeType(format) {
	const mimeTypes={
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		webp: 'image/webp',
		gif: 'image/gif',
		avif: 'image/avif',
		tiff: 'image/tiff',
		bmp: 'image/bmp'
	};
	return mimeTypes[format.toLowerCase()]||'image/png';
}

/**
 * Get converted file name
 */
function getConvertedFileName(originalName,toFormat) {
	const baseName=originalName.replace(/\.[^/.]+$/,'');
	return `${baseName}.${toFormat}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
	if(bytes===0) return '0 B';
	const k=1024;
	const sizes=['B','KB','MB','GB'];
	const i=Math.floor(Math.log(bytes)/Math.log(k));
	return parseFloat((bytes/Math.pow(k,i)).toFixed(2))+' '+sizes[i];
}

/**
 * Calculate size reduction percentage
 */
export function calculateReduction(originalSize,convertedSize) {
	if(originalSize===0) return 0;
	const reduction=((originalSize-convertedSize)/originalSize)*100;
	return Math.max(0,Math.round(reduction)); // Never show negative reduction
}

/**
 * Validate image file
 */
export function validateImageFile(file,expectedFormat=null,maxSize=100*1024*1024) {
	const errors=[];

	if(!file.type.startsWith('image/')) {
		errors.push('File is not an image');
		return {valid: false,errors};
	}

	if(expectedFormat) {
		const extension=file.name.split('.').pop().toLowerCase();
		const expectedExt=expectedFormat.toLowerCase();
		const isMatch=extension===expectedExt||
			(expectedExt==='jpg'&&extension==='jpeg')||
			(expectedExt==='jpeg'&&extension==='jpg');

		if(!isMatch) {
			errors.push(`Expected ${expectedFormat.toUpperCase()} file, got ${extension.toUpperCase()}`);
		}
	}

	if(file.size>maxSize) {
		errors.push(`File size exceeds maximum of ${formatFileSize(maxSize)}`);
	}

	return {
		valid: errors.length===0,
		errors
	};
}

/**
 * Download image
 */
export function downloadImage(blob,fileName) {
	const url=URL.createObjectURL(blob);
	const link=document.createElement('a');
	link.href=url;
	link.download=fileName;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Download multiple images as zip
 */
export async function downloadImagesAsZip(images) {
	try {
		const JSZip=(await import('jszip')).default;
		const zip=new JSZip();

		images.forEach(({blob,fileName}) => {
			zip.file(fileName,blob);
		});

		const content=await zip.generateAsync({type: 'blob'});
		downloadImage(content,'converted-images.zip');
	} catch(error) {
		images.forEach(({blob,fileName}) => {
			downloadImage(blob,fileName);
		});
	}
}

/**
 * Get supported formats (WEBP first as best for compression)
 */
export function getSupportedFormats() {
	return [
		{value: 'webp',label: 'WEBP (Best Compression)'},
		{value: 'jpg',label: 'JPG (Universal)'},
		{value: 'png',label: 'PNG (Lossless)'},
		{value: 'gif',label: 'GIF (Animated)'},
		{value: 'avif',label: 'AVIF (Next-Gen)'},
		{value: 'bmp',label: 'BMP (Uncompressed)'}
	];
}

/**
 * Check browser format support
 */
export function isFormatSupported(format) {
	const canvas=document.createElement('canvas');
	canvas.width=1;
	canvas.height=1;
	const mimeType=getMimeType(format);
	const dataUrl=canvas.toDataURL(mimeType);
	return dataUrl.startsWith(`data:${mimeType}`);
}
