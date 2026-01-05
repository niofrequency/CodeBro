import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { applyPatch as applyDiffPatch } from 'diff';

/**
 * Optimized for local module resolution.
 */
import { logError, logInfo } from './cliUtils';
import { BACKUP_DIR } from '../constants';

/**
 * Creates a backup of a file in the centralized backup directory.
 * Keeps your source tree clean while providing safety.
 */
export async function backupFile(filePath: string): Promise<void> {
  try {
    // 1. Check if the source file actually exists
    await fs.access(filePath);

    // 2. Prepare the backup path (e.g., .codebro/backups/src/index.ts.bak)
    const relativePath = path.isAbsolute(filePath) 
      ? path.relative(process.cwd(), filePath) 
      : filePath;
      
    const backupPath = path.join(BACKUP_DIR, `${relativePath}.bak`);

    // 3. Ensure backup directory structure exists
    await fs.mkdir(path.dirname(backupPath), { recursive: true });

    // 4. Copy the file
    await fs.copyFile(filePath, backupPath);
    logInfo(`Backup secured at: ${backupPath}`);
  } catch (error) {
    // If file doesn't exist, it's likely a 'CREATE' action; no backup needed.
    return;
  }
}

/**
 * Creates or overwrites a file with the specified content.
 * Handles recursive directory creation automatically.
 */
export async function createFile(filePath: string, content: string): Promise<void> {
  try {
    // Ensure the folder structure exists (e.g. src/components/...)
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Write the file
    await fs.writeFile(filePath, content, { encoding: 'utf8' });
    logInfo(`Successfully wrote: ${path.basename(filePath)}`);
  } catch (error) {
    logError(`Failed to create file ${filePath}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Applies a diff patch to an existing file.
 * This is the 'Surgical' approach that saves token costs.
 */
export async function applyPatch(filePath: string, patch: string): Promise<string> {
  try {
    const originalContent = await fs.readFile(filePath, { encoding: 'utf8' });
    
    // Apply the diff using the 'diff' library
    const newContent = applyDiffPatch(originalContent, patch);

    if (newContent === false || typeof newContent !== 'string') {
      throw new Error('Patch application failed. The file may have changed since analysis.');
    }

    await fs.writeFile(filePath, newContent, { encoding: 'utf8' });
    return newContent;
  } catch (error) {
    logError(`Failed to apply patch to ${filePath}: ${(error as Error).message}`);
    throw error; 
  }
}