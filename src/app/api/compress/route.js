
import {NextResponse} from 'next/server';
import {spawn} from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Get FFmpeg path - handle various edge cases
let ffmpegPath=ffmpegStatic;

// If ffmpegStatic is not absolute or seems incorrect, resolve manually
if(!ffmpegPath||ffmpegPath.includes('ROOT')||!path.isAbsolute(ffmpegPath)) {
	const isWin=os.platform()==='win32';
	const binaryName=isWin? 'ffmpeg.exe':'ffmpeg';
	ffmpegPath=path.join(process.cwd(),'node_modules','ffmpeg-static',binaryName);
}

// Verify binary exists
if(!fs.existsSync(ffmpegPath)) {
	console.error('FFmpeg binary not found at:',ffmpegPath);
}

// HandBrake-style compression presets with professional audio (min 256k, max 512k)
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
	// Ultra compression with preserved audio
	maximum: {
		crf: 32,
		preset: 'medium',
		audioBitrate: '256k',
		audioSampleRate: 48000,
	},
	// Balanced with good audio
	balanced: {
		crf: 26,
		preset: 'medium',
		audioBitrate: '256k',
		audioSampleRate: 48000,
	},
	// Quality focused with best audio
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

// Run FFmpeg as a child process with raw spawn for better control
function runFFmpegCommand(args,onProgress) {
	return new Promise((resolve,reject) => {
		console.log('FFmpeg command:',ffmpegPath,args.join(' '));

		const process=spawn(ffmpegPath,args,{
			windowsHide: true
		});

		let stderr='';
		let duration=0;

		process.stderr.on('data',(data) => {
			const output=data.toString();
			stderr+=output;

			// Parse duration
			const durationMatch=output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
			if(durationMatch) {
				duration=parseInt(durationMatch[1])*3600+
					parseInt(durationMatch[2])*60+
					parseInt(durationMatch[3]);
			}

			// Parse progress
			const timeMatch=output.match(/time=(\d{2}):(\d{2}):(\d{2})/);
			if(timeMatch&&duration>0&&onProgress) {
				const currentTime=parseInt(timeMatch[1])*3600+
					parseInt(timeMatch[2])*60+
					parseInt(timeMatch[3]);
				const percent=Math.round((currentTime/duration)*100);
				onProgress(percent);
			}
		});

		process.on('close',(code) => {
			if(code===0) {
				resolve();
			} else {
				reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
			}
		});

		process.on('error',(err) => {
			reject(new Error(`Failed to start FFmpeg: ${err.message}`));
		});
	});
}

export async function POST(req) {
	let inputPath=null;
	let outputPath=null;

	try {
		const formData=await req.formData();
		const file=formData.get('file');
		const presetId=formData.get('preset')||'handbrake';
		const resolution=formData.get('resolution')||'original';
		const targetSizeMB=parseFloat(formData.get('targetSizeMB'))||null;
		const duration=parseFloat(formData.get('duration'))||null;

		if(!file) {
			return NextResponse.json({error: 'No file uploaded'},{status: 400});
		}

		// Get preset settings
		const preset=PRESETS[presetId]||PRESETS.handbrake;
		const audioBitrateKbps=parseInt(preset.audioBitrate)||96;

		// Create temp file paths
		const tempDir=os.tmpdir();
		const uniqueSuffix=Date.now()+'-'+Math.round(Math.random()*1E9);
		inputPath=path.join(tempDir,`input-${uniqueSuffix}.mp4`);
		outputPath=path.join(tempDir,`output-${uniqueSuffix}.mp4`);

		// Save uploaded file to disk
		const buffer=Buffer.from(await file.arrayBuffer());
		await fs.promises.writeFile(inputPath,buffer);

		console.log('Input file saved:',inputPath,'Size:',buffer.length);

		// Build FFmpeg arguments with professional audio settings
		const args=[
			'-y', // Overwrite output
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
			// CRF mode for quality-based compression
			args.push('-crf',String(preset.crf));
		}

		// Add scale filter if resolution is specified
		if(resolution!=='original') {
			const size=parseInt(resolution);
			if(!isNaN(size)) {
				// Scale to width while maintaining aspect ratio, ensure height is divisible by 2
				args.push('-vf',`scale='min(${size},iw)':-2`);
			}
		}

		// Output file
		args.push(outputPath);

		// Run FFmpeg
		await runFFmpegCommand(args,(percent) => {
			console.log(`Processing: ${percent}%`);
		});

		// Check if output exists
		if(!fs.existsSync(outputPath)) {
			throw new Error('Output file was not created');
		}

		// Read the output file
		const outputBuffer=await fs.promises.readFile(outputPath);

		console.log('Output file size:',outputBuffer.length);

		// Cleanup temp files
		await fs.promises.unlink(inputPath).catch(() => {});
		await fs.promises.unlink(outputPath).catch(() => {});

		// Return the compressed video
		return new NextResponse(outputBuffer,{
			headers: {
				'Content-Type': 'video/mp4',
				'Content-Disposition': `attachment; filename="compressed_${file.name}"`,
			},
		});

	} catch(error) {
		console.error('Compression Error:',error);

		// Cleanup on error
		if(inputPath) await fs.promises.unlink(inputPath).catch(() => {});
		if(outputPath) await fs.promises.unlink(outputPath).catch(() => {});

		return NextResponse.json(
			{error: 'Compression failed',details: error.message},
			{status: 500}
		);
	}
}
