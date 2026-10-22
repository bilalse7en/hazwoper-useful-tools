import os from 'os';
import path from 'path';
import fs from 'fs';

/**
 * Detects if the current runtime environment has a read-only process.cwd(),
 * such as Vercel Serverless Functions, AWS Lambda, or containerized environments.
 */
function checkIsReadOnly() {
  if (
    process.env.VERCEL === '1' ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.NOW_REGION
  ) {
    return true;
  }
  try {
    const testFile = path.join(process.cwd(), `.writable_check_${Date.now()}`);
    fs.writeFileSync(testFile, '1');
    fs.unlinkSync(testFile);
    return false;
  } catch {
    return true;
  }
}

export const isReadOnlyEnv = checkIsReadOnly();

/**
 * Returns a guaranteed writable temporary directory.
 * On Vercel/Lambda: /tmp/hazwoper-shorts/<subDir>
 * On Local: <process.cwd>/temp/<subDir> (or os.tmpdir() fallback)
 */
export function getTempDir(subDir = '') {
  let baseDir;
  if (isReadOnlyEnv) {
    baseDir = path.join(os.tmpdir(), 'hazwoper-shorts');
  } else {
    baseDir = path.join(process.cwd(), 'temp');
  }

  const fullDir = subDir ? path.join(baseDir, subDir) : baseDir;
  try {
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }
    return fullDir;
  } catch {
    const fallback = path.join(os.tmpdir(), subDir || 'hazwoper-shorts');
    if (!fs.existsSync(fallback)) {
      fs.mkdirSync(fallback, { recursive: true });
    }
    return fallback;
  }
}

/**
 * Returns a guaranteed writable directory for local Media Hub assets.
 * On Vercel: /tmp/media-hub
 * On Local: public/media-hub
 */
export function getLocalMediaDir(subDir = '') {
  let baseDir;
  if (isReadOnlyEnv) {
    baseDir = path.join(os.tmpdir(), 'media-hub');
  } else {
    baseDir = path.join(process.cwd(), 'public', 'media-hub');
  }

  const fullDir = subDir ? path.join(baseDir, subDir) : baseDir;
  try {
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }
    return fullDir;
  } catch {
    const fallback = path.join(os.tmpdir(), 'media-hub', subDir);
    if (!fs.existsSync(fallback)) {
      fs.mkdirSync(fallback, { recursive: true });
    }
    return fallback;
  }
}

/**
 * Returns the path to the Media Hub registry JSON file.
 * On Vercel: /tmp/media-hub-registry.json
 * On Local: data/media-hub-registry.json
 */
export function getRegistryFilePath() {
  if (isReadOnlyEnv) {
    return path.join(os.tmpdir(), 'media-hub-registry.json');
  }
  return path.join(process.cwd(), 'data', 'media-hub-registry.json');
}

/**
 * Returns the path to the background Jobs JSON file.
 * On Vercel: /tmp/video-shorts-jobs.json
 * On Local: data/video-shorts-jobs.json
 */
export function getJobsFilePath() {
  if (isReadOnlyEnv) {
    return path.join(os.tmpdir(), 'video-shorts-jobs.json');
  }
  return path.join(process.cwd(), 'data', 'video-shorts-jobs.json');
}
