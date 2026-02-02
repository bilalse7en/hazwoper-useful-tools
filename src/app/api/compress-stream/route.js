import {spawn} from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Get FFmpeg path - handle various edge cases with multiple fallback strategies
let ffmpegPath = ffmpegStatic;

// Function to check if a path exists and is executable
function isValidFFmpegPath(testPath) {
	try {
		return fs.existsSync(testPath) && fs.statSync(testPath).isFile();
	} catch {
		return false;
	}
}

// If ffmpegStatic is not absolute or seems incorrect, resolve manually
if (!ffmpegPath || ffmpegPath.includes('ROOT') || !path.isAbsolute(ffmpegPath) || !isValidFFmpegPath(ffmpegPath)) {
	const isWin = os.platform() === 'win32';
	const binaryName = isWin ? 'ffmpeg.exe' : 'ffmpeg';
	
	// Try multiple path resolution strategies
	const possiblePaths = [
		// Standard node_modules location (Windows format)
		path.join(process.cwd(), 'node_modules', 'ffmpeg-static', binaryName),
		// Alternative node_modules locations
		path.join(process.cwd(), 'node_modules', '.bin', binaryName),
		path.join(__dirname, '..', '..', '..', '..', 'node_modules', 'ffmpeg-static', binaryName),
		// System path (if ffmpeg is installed globally)
		isWin ? 'C:\\ffmpeg\\bin\\ffmpeg.exe' : '/usr/bin/ffmpeg',
		isWin ? 'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe' : '/usr/local/bin/ffmpeg',
	];
	
	// Find the first valid path
	ffmpegPath = possiblePaths.find(p => isValidFFmpegPath(p)) || possiblePaths[0];
}

console.log('[FFmpeg] Using binary path:', ffmpegPath);
console.log('[FFmpeg] Path exists:', isValidFFmpegPath(ffmpegPath));

// HandBrake-style compression presets with quality audio (min 256k, max 512k)
const PRESETS={
	// Lightning Fast - fast encoding with quality preservation
	fast: {
		crf: 28, // Good compression with acceptable quality
		preset: 'fast', // Fast but quality-preserving
		audioBitrate: '256k',
		audioSampleRate: 48000,
		tune: 'film', // Optimized for film/video content
	},
	// HandBrake mode - preserves original audio
	handbrake: {
		crf: 28,
		preset: 'slow',
		copyAudio: true, // Copy original audio without re-encoding
	},
	maximum: {
		crf: 32,
		preset: 'medium',
		audioBitrate: '256k',
		audioSampleRate: 48000,
	},
	balanced: {
		crf: 26,
		preset: 'medium',
		audioBitrate: '256k',
		audioSampleRate: 48000,
	},
	quality: {
		crf: 20,
		preset: 'slow',
		audioBitrate: '512k',
		audioSampleRate: 48000,
	}
};

// Calculate target video bitrate for desired file size
function calculateTargetBitrate(targetSizeMB,durationSeconds,audioBitrateKbps) {
	const totalBitrateKbps=(targetSizeMB*8192)/durationSeconds;
	const videoBitrateKbps=totalBitrateKbps-audioBitrateKbps;
	return Math.max(videoBitrateKbps,100);
}

export async function POST(req) {
	let inputPath=null;
	let outputPath=null;

	const encoder=new TextEncoder();

	const stream=new ReadableStream({
		async start(controller) {
			let isClosed=false;

			const sendProgress=(percent,message) => {
				if(isClosed) return;
				try {
					controller.enqueue(encoder.encode(`data: ${JSON.stringify({type: 'progress',percent,message})}\n\n`));
				} catch(e) {
					isClosed=true;
				}
			};

			const sendComplete=(buffer) => {
				if(isClosed) return;
				isClosed=true;
				try {
					const base64=buffer.toString('base64');
					controller.enqueue(encoder.encode(`data: ${JSON.stringify({type: 'complete',data: base64,size: buffer.length})}\n\n`));
					controller.close();
				} catch(e) {}
			};

			const sendError=(error) => {
				if(isClosed) return;
				isClosed=true;
				try {
					controller.enqueue(encoder.encode(`data: ${JSON.stringify({type: 'error',message: error})}\n\n`));
					controller.close();
				} catch(e) {}
			};

			try {
				const formData=await req.formData();
				const file=formData.get('file');
				const presetId=formData.get('preset')||'handbrake';
				const resolution=formData.get('resolution')||'original';
				const targetSizeMB=parseFloat(formData.get('targetSizeMB'))||null;
				const duration=parseFloat(formData.get('duration'))||null;

				if(!file) {
					sendError('No file uploaded');
					return;
				}

				// Validate FFmpeg binary exists before proceeding
				if (!isValidFFmpegPath(ffmpegPath)) {
					sendError(`FFmpeg binary not found at: ${ffmpegPath}. Please ensure ffmpeg-static is installed correctly by running: npm install ffmpeg-static`);
					return;
				}

				sendProgress(2,'Initializing...');

				// Get preset settings
				const preset=PRESETS[presetId]||PRESETS.handbrake;
				const audioBitrateKbps=parseInt(preset.audioBitrate)||256;

				// Create temp file paths
				const tempDir=os.tmpdir();
				const uniqueSuffix=Date.now()+'-'+Math.round(Math.random()*1E9);
				inputPath=path.join(tempDir,`input-${uniqueSuffix}.mp4`);
				outputPath=path.join(tempDir,`output-${uniqueSuffix}.mp4`);

				// Save uploaded file to disk
				const buffer=Buffer.from(await file.arrayBuffer());
				await fs.promises.writeFile(inputPath,buffer);

				sendProgress(5,'File uploaded, preparing encoder...');

				// Build FFmpeg arguments
				const args=[
					'-y',
					'-i',inputPath,
					'-c:v','libx264',
					'-preset',preset.preset,
					'-pix_fmt','yuv420p',
					'-movflags','+faststart',
				];

				// Audio handling: copy original or re-encode
				if(preset.copyAudio) {
					// Copy original audio stream (preserves quality perfectly)
					args.push('-c:a','copy');
				} else {
					// Re-encode audio with AAC
					args.push('-c:a','aac');
					args.push('-b:a',preset.audioBitrate);
					args.push('-ar',String(preset.audioSampleRate));
					args.push('-ac','2');
					args.push('-profile:a','aac_low');
				}

				// Add tune option if specified (for fast mode: zerolatency)
				if(preset.tune) {
					args.push('-tune',preset.tune);
				}

				// Calculate target bitrate if target size mode is enabled
				if(targetSizeMB&&duration&&duration>0) {
					const targetVideoBitrate=calculateTargetBitrate(targetSizeMB,duration,audioBitrateKbps);
					args.push('-b:v',`${Math.round(targetVideoBitrate)}k`);
					args.push('-maxrate',`${Math.round(targetVideoBitrate*1.5)}k`);
					args.push('-bufsize',`${Math.round(targetVideoBitrate*2)}k`);
				} else {
					args.push('-crf',String(preset.crf));
				}

				// Add scale filter if resolution is specified
				if(resolution!=='original') {
					const size=parseInt(resolution);
					if(!isNaN(size)) {
						args.push('-vf',`scale='min(${size},iw)':-2`);
					}
				}

				args.push(outputPath);

				// Run FFmpeg with real progress and timeout
			await new Promise((resolve,reject) => {
				console.log('[FFmpeg] Command:',ffmpegPath,args.join(' '));

				const ffProcess=spawn(ffmpegPath,args,{
					windowsHide: true
				});

				let stderr='';
				let videoDuration=0;

				// Add a timeout to prevent hanging (10 minutes max)
				const timeout = setTimeout(() => {
					ffProcess.kill('SIGKILL');
					reject(new Error('Video compression timed out after 10 minutes. Please try with a shorter video or different settings.'));
				}, 600000); // 10 minutes

				ffProcess.stderr.on('data',(data) => {
					const output=data.toString();
					stderr+=output;

					// Parse duration from input file info
					const durationMatch=output.match(/Duration: (\d{2}):(\d{2}):(\d{2})\.(\d+)/);
					if(durationMatch) {
						videoDuration=parseInt(durationMatch[1])*3600+
							parseInt(durationMatch[2])*60+
							parseInt(durationMatch[3])+
							parseInt(durationMatch[4])/100;
					}

					// Parse current encoding time for progress
					const timeMatch=output.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d+)/);
					if(timeMatch&&videoDuration>0) {
						const currentTime=parseInt(timeMatch[1])*3600+
							parseInt(timeMatch[2])*60+
							parseInt(timeMatch[3])+
							parseInt(timeMatch[4])/100;
						// Scale progress from 5% to 95% (leaving room for init and finalize)
						const rawPercent=(currentTime/videoDuration)*100;
						const scaledPercent=5+Math.round(rawPercent*0.9);
						const percent=Math.min(scaledPercent,95);
						sendProgress(percent,`Encoding: ${percent}%`);
					}
				});

				ffProcess.on('close',(code) => {
					clearTimeout(timeout);
					if(code===0) {
						resolve();
					} else {
						reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-300)}`));
					}
				});

				ffProcess.on('error',(err) => {
					clearTimeout(timeout);
					reject(new Error(`Failed to start FFmpeg: ${err.message}`));
				});
			});

				sendProgress(96,'Finalizing output...');

				// Check if output exists
				if(!fs.existsSync(outputPath)) {
					throw new Error('Output file was not created');
				}

				// Read the output file
				const outputBuffer=await fs.promises.readFile(outputPath);

				sendProgress(98,'Preparing download...');

				// Cleanup temp files
				await fs.promises.unlink(inputPath).catch(() => {});
				await fs.promises.unlink(outputPath).catch(() => {});

				sendProgress(100,'Complete!');
				sendComplete(outputBuffer);

			} catch(error) {
				console.error('Compression Error:',error);

				// Cleanup on error
				if(inputPath) await fs.promises.unlink(inputPath).catch(() => {});
				if(outputPath) await fs.promises.unlink(outputPath).catch(() => {});

				sendError(error.message||'Compression failed');
			}
		}
	});

	return new Response(stream,{
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
		},
	});
}
