import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { glob } from 'glob';

/**
 * Cleaned up imports for Bundler compatibility.
 */
import { IGNORED_PATHS, MAX_FILE_SIZE_KB, KEY_FILES } from '../constants';
import type { ScannedFile } from '../types';

// Protection against Grok context window bloat and high API costs
const MAX_TOTAL_CONTEXT_CHARS = 100000;

/**
 * Checks if a given file path should be ignored.
 * Uses the updated IGNORED_PATHS from constants.ts.
 */
function shouldIgnore(relativePath: string): boolean {
  const standardizedPath = relativePath.split(path.sep).join('/');
  const baseName = path.basename(standardizedPath);

  return IGNORED_PATHS.some((pattern: string) => {
    // Handle extension wildcards like *.png
    if (pattern.startsWith('*.')) {
      return standardizedPath.endsWith(pattern.substring(1));
    }
    // Handle direct folder/file matches
    const parts = standardizedPath.split('/');
    return parts.includes(pattern) || baseName === pattern;
  });
}

/**
 * Assigns priority for scanning.
 * package.json and config files are always read first to define the "brain" of the project.
 */
function getFilePriority(relativePath: string): number {
  const baseName = path.basename(relativePath);
  let priority = 0;

  if (baseName === 'package.json') return 200;
  if (baseName === 'tsconfig.json' || baseName === 'vite.config.ts') return 180;

  if (KEY_FILES.includes(baseName)) priority += 100;
  if (baseName.startsWith('index.') || baseName.startsWith('main.')) priority += 80;

  return priority;
}

/**
 * MONEY SAVER: Shallow Scan
 * Only returns the directory structure. 
 * This gives Grok the "Map" without the expensive content.
 */
export async function scanDirectoryShallow(projectPath: string): Promise<string> {
  const absoluteProjectPath = path.resolve(projectPath);
  
  // Glob everything, then filter based on our strict IGNORED_PATHS
  const files = await glob('**/*', {
    cwd: absoluteProjectPath,
    nodir: true,
    dot: true,
  });

  const map = files
    .filter(file => !shouldIgnore(file))
    .map(file => `📄 ${file}`)
    .join('\n');

  return map || "No files found.";
}

/**
 * SURGICAL SCAN: Single File
 * Reads only one specific file. Used during the interactive "Fix" loop
 * to inject content only when Grok specifically asks for it.
 */
export async function scanSingleFile(projectPath: string, relativeFilePath: string): Promise<ScannedFile | null> {
  const fullPath = path.resolve(projectPath, relativeFilePath);
  try {
    const content = await fs.readFile(fullPath, 'utf8');
    return {
      path: fullPath,
      relativePath: relativeFilePath,
      content: content,
      priority: getFilePriority(relativeFilePath)
    };
  } catch (error) {
    return null;
  }
}

/**
 * DEEP SCAN: Full Context
 * Scans content (respecting character and size limits). 
 * Used primarily for the initial "Analyze" if a map isn't enough.
 */
export async function scanDirectory(projectPath: string): Promise<ScannedFile[]> {
  const scannedFiles: ScannedFile[] = [];
  const absoluteProjectPath = path.resolve(projectPath);

  const files = await glob('**/*', {
    cwd: absoluteProjectPath,
    nodir: true,
    dot: true,
  });

  for (const file of files) {
    const fullPath = path.join(absoluteProjectPath, file);
    if (shouldIgnore(file)) continue;

    try {
      const stats = await fs.stat(fullPath);
      // Skip files that are too large (e.g., minified JS)
      if (stats.size > MAX_FILE_SIZE_KB * 1024) continue;

      const content = await fs.readFile(fullPath, 'utf8');
      
      // Skip binary files (images, executables)
      if (content.includes('\uFFFD') || content.includes('\u0000')) continue;

      scannedFiles.push({
        path: fullPath,
        relativePath: file,
        content: content,
        priority: getFilePriority(file),
      });
    } catch (e) {
      continue;
    }
  }

  // Sort by priority so that package.json and main entry points stay within character limits
  scannedFiles.sort((a, b) => b.priority - a.priority);

  let currentTotalChars = 0;
  const prioritizedContext: ScannedFile[] = [];

  for (const file of scannedFiles) {
    if (currentTotalChars + file.content.length <= MAX_TOTAL_CONTEXT_CHARS) {
      prioritizedContext.push(file);
      currentTotalChars += file.content.length;
    } else {
      break; // Stop adding files once we hit the character budget
    }
  }

  return prioritizedContext;
}