// Fix: Import process from node:process to resolve TypeScript errors in Node environments
import process from 'node:process';
import chalk from 'chalk';
import ora from 'ora';
import * as readline from 'node:readline/promises';
import { diffLines, Change } from 'diff'; 

/**
 * FIX: Removed .js extensions to work with 'Bundler' resolution.
 * The index.ts inside types and constants will be resolved automatically.
 */
import type { CodeChange } from '../types';
import {
  CODEBRO_FILE_CHANGE_START,
  CODEBRO_FILE_KEY,
  CODEBRO_ACTION_KEY,
  CODEBRO_CONTENT_KEY,
  CODEBRO_PATCH_KEY
} from '../constants';

export function logInfo(message: string): void {
  console.log(chalk.blue(message));
}

export function logSuccess(message: string): void {
  console.log(chalk.green(message));
}

export function logWarning(message: string): void {
  console.log(chalk.yellow(message));
}

export function logError(message: string): void {
  console.error(chalk.red(message));
}

export function logBold(message: string): void {
  console.log(chalk.bold(message));
}

export function logCode(code: string): void {
  console.log(chalk.gray(`\n\`\`\`\n${code}\n\`\`\`\n`));
}

/**
 * Robust confirm function. 
 */
export async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(chalk.magenta(`${message} (y/N): `));
    return answer.toLowerCase().startsWith('y');
  } finally {
    rl.close();
  }
}

export function startSpinner(text: string) {
  const spinner = ora(chalk.cyan(text)).start();
  return spinner;
}

export function displayDiff(oldContent: string, newContent: string): void {
  const changes = diffLines(oldContent, newContent);

  logBold('\n--- Proposed Changes ---');
  changes.forEach((part: Change) => {
    if (part.added) {
      process.stdout.write(chalk.green(`+ ${part.value}`));
    } else if (part.removed) {
      process.stdout.write(chalk.red(`- ${part.value}`));
    } else {
      const lines = part.value.split('\n');
      if (lines.length > 4) {
          process.stdout.write(chalk.gray(`   ... (${lines.length - 1} unchanged lines)\n`));
      } else {
          process.stdout.write(chalk.gray(`  ${part.value}`));
      }
    }
  });
  logBold('------------------------\n');
}

/**
 * Resilient Parser for Grok Fix Responses.
 * This looks for the special CODEBRO tags to extract file paths and code.
 */
export function parseGrokFixResponse(response: string): CodeChange[] {
  const changes: CodeChange[] = [];
  const segments = response.split(CODEBRO_FILE_CHANGE_START);

  for (const segment of segments) {
    if (!segment.trim()) continue;

    const fileMatch = segment.match(new RegExp(`${CODEBRO_FILE_KEY}\\s*:?\\s*([^\\n\\r]+)`, 'i'));
    const actionMatch = segment.match(new RegExp(`${CODEBRO_ACTION_KEY}\\s*:?\\s*(CREATE|MODIFY|DELETE)`, 'i'));
    
    const contentMatch = segment.match(new RegExp(`${CODEBRO_CONTENT_KEY}\\s*:?\\s*[\\n\\r]+\`\`\`(?:[a-zA-Z]+)?\\s*[\\n\\r]+([\\s\\S]*?)[\\n\\r]+\`\`\``, 'i'));
    const patchMatch = segment.match(new RegExp(`${CODEBRO_PATCH_KEY}\\s*:?\\s*[\\n\\r]+\`\`\`diff\\s*[\\n\\r]+([\\s\\S]*?)[\\n\\r]+\`\`\``, 'i'));

    if (fileMatch && actionMatch) {
      const file = fileMatch[1].trim();
      const action = actionMatch[1].toUpperCase().trim() as CodeChange['action'];
      const change: CodeChange = { file, action };

      if (contentMatch) {
        change.content = contentMatch[1];
      } else if (patchMatch) {
        change.patch = patchMatch[1].trim();
      }
      
      changes.push(change);
    }
  }
  return changes;
}

export function printFileTree(scannedFiles: { relativePath: string }[]): void {
    if (scannedFiles.length === 0) return;
    logBold('\n📂 Project Structure:');
    
    const sorted = [...scannedFiles].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    
    sorted.forEach(file => {
        const parts = file.relativePath.split('/');
        const indent = '  '.repeat(parts.length - 1);
        const name = parts[parts.length - 1];
        console.log(`${indent}${parts.length > 1 ? '└─ ' : ''}${chalk.cyan(name)}`);
    });
    console.log('');
}