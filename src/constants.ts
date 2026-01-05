/**
 * Global Constants for CodeBro
 */

export const IGNORED_PATHS = [
  'node_modules',
  '.git',
  '.vscode',
  '.idea',
  'dist',
  'build',
  '.next',
  '.cache',
  'coverage',
  'logs',
  'tmp',
  'temp',
  'vendor',
  'img',           // Added: Images waste token context
  'assets',        // Added: Static assets usually don't need code analysis
  'package-lock.json', // Added: Massive file that drains your API budget
  'yarn.lock',
  '*.log',
  '*.tmp',
  '*.bak',
  '*.png',         // Added: Explicit binary ignore
  '*.jpg',
  '*.jpeg',
  '*.svg',
  '.env',
  '.env.local'
];

export const MAX_FILE_SIZE_KB = 50; 
export const GROK_MODEL = 'grok-3'; // Set to grok-2-1212 if you want to save even more money

export const KEY_FILES = [
  'package.json',
  'tsconfig.json',
  'README.md',
  'index.ts',
  'index.js',
  'server.ts',
  'server.js',
  'App.tsx',
  'App.jsx',
  'main.ts',
  'main.js',
  'webpack.config.js',
  'vite.config.ts',
  'next.config.js',
  'tailwind.config.js',
  'src/index.ts',
  'src/main.ts',
  'public/index.html',
  'assets/index.html',
  'dockerfile',
  'Dockerfile',
  'compose.yml',
  'docker-compose.yml',
];

// Markers for Grok's output parsing
export const CODEBRO_FILE_CHANGE_START = '---CODEBRO_FILE_CHANGE---';
export const CODEBRO_FILE_CHANGE_END = '---END_CODEBRO_FILE_CHANGE---';
export const CODEBRO_FILE_KEY = 'FILE:';
export const CODEBRO_ACTION_KEY = 'ACTION:';
export const CODEBRO_CONTENT_KEY = 'CONTENT:';
export const CODEBRO_PATCH_KEY = 'PATCH:';

// Configuration for local operations
export const BACKUP_DIR = '.codebro/backups'; // Added: Required by codeWriter.ts