#!/usr/bin/env node

import { Command } from 'commander';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import process from 'node:process';

/**
 * FIX: Extensionless imports for "moduleResolution": "Bundler".
 * These point to the optimized commands we built.
 */
import { analyzeProject } from './commands/analyze';
import { fixProject } from './commands/fix';
import { logError, logInfo } from './utils/cliUtils';

/**
 * ENVIRONMENT INITIALIZATION
 * Explicitly load .env.local for the CLI environment.
 * We prioritize .env.local as it's common for Vite projects.
 */
const envPath = path.resolve(process.cwd(), '.env.local');
const fallbackEnvPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else if (fs.existsSync(fallbackEnvPath)) {
  dotenv.config({ path: fallbackEnvPath });
}

/**
 * API KEY MAPPING
 * Ensures VITE_XAI_API_KEY is populated for the Grok Service.
 */
if (process.env.API_KEY && !process.env.VITE_XAI_API_KEY) {
  process.env.VITE_XAI_API_KEY = process.env.API_KEY;
} else if (process.env.VITE_XAI_API_KEY && !process.env.API_KEY) {
  process.env.API_KEY = process.env.VITE_XAI_API_KEY;
}

const program = new Command();

program
  .name('codebro')
  .description('An AI-powered CLI tool to turn incomplete code directories into working websites using Grok.')
  .version('1.1.0');

/**
 * ANALYZE COMMAND
 * Now uses the "Shallow Map" strategy to save you tokens.
 */
program
  .command('analyze <path>')
  .description('Scans a local code directory and provides a budget-friendly analysis.')
  .action(async (dirPath: string) => {
    try {
      if (!process.env.VITE_XAI_API_KEY) {
        logError('Missing API Key. Ensure VITE_XAI_API_KEY is set in your .env file.');
        process.exit(1);
      }
      await analyzeProject(dirPath);
    } catch (error) {
      logError(`Analysis failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

/**
 * FIX COMMAND
 * Now uses the "Surgical Step" strategy to apply code changes.
 */
program
  .command('fix <path>')
  .description('Enters interactive mode to apply fixes one step at a time.')
  .action(async (dirPath: string) => {
    try {
      if (!process.env.VITE_XAI_API_KEY) {
        logError('Missing API Key. Ensure VITE_XAI_API_KEY is set in your .env file.');
        process.exit(1);
      }
      await fixProject(dirPath);
    } catch (error) {
      logError(`Repair process failed: ${(error as Error).message}`);
      process.exit(1);
    }
  });

program.on('--help', () => {
  logInfo('\nEnvironment:');
  logInfo(`   Project Root: ${process.cwd()}`);
  logInfo(`   API Key Status: ${process.env.VITE_XAI_API_KEY ? '✅ Configured' : '❌ Not Found'}`);
});

async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    logError(`CodeBro experienced an unhandled error: ${(error as Error).message}`);
    process.exit(1);
  }
}

main();