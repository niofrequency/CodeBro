import * as path from 'node:path';
import { 
  scanDirectoryShallow, 
  scanSingleFile 
} from '../utils/fileScanner';
import { sendMessage } from '../utils/grokService';
import {
  logError,
  logInfo,
  logSuccess,
  startSpinner,
  logWarning
} from '../utils/cliUtils';
import type { Message } from '../types';

const INITIAL_SYSTEM_PROMPT = `You are CodeBro, an expert full-stack developer.
Your goal is to analyze a project directory and generate a roadmap to make it a runnable website.

You will receive a PROJECT MAP (list of files) and the content of CORE files.
Your task is to:
1. Identify the primary tech stack.
2. Summarize the current state.
3. Identify missing files, configs, or bugs.
4. Generate a detailed, numbered, step-by-step plan.

Structure your response clearly:
Tech Stack: [Detected tech stack]
Current State: [Brief summary]
Issues Identified:
- [Issue 1]
Plan to make it runnable:
1. [Step 1]
`;

export async function analyzeProject(projectPath: string): Promise<void> {
  const absolutePath = path.resolve(projectPath);
  logInfo(`\nAnalyzing project at: ${absolutePath}`);

  // 1. SHALLOW SCAN (Saves Money)
  const mapSpinner = startSpinner('Mapping project structure...');
  let projectMap = "";
  try {
    projectMap = await scanDirectoryShallow(absolutePath);
    mapSpinner.succeed('Project map generated.');
  } catch (error) {
    mapSpinner.fail('Failed to map directory.');
    return;
  }

  if (!projectMap || projectMap === "No files found.") {
    logWarning('No relevant files found in the directory. Exiting.');
    return;
  }

  // 2. FETCH CORE CONTEXT (Surgical Scan)
  // We only read the config files to understand the project "brain"
  logInfo('Reading core configuration files...');
  const coreFiles = ['package.json', 'tsconfig.json', 'vite.config.ts', 'server.js'];
  let coreContext = "";

  for (const fileName of coreFiles) {
    const file = await scanSingleFile(absolutePath, fileName);
    if (file) {
      coreContext += `FILE: ${fileName}\nCONTENT:\n\`\`\`json\n${file.content}\n\`\`\`\n\n`;
    }
  }

  // 3. PREPARE LIGHTWEIGHT PROMPT
  const userPrompt = `Here is my project structure:\n${projectMap}\n\nCORE CONFIGURATION:\n${coreContext}\nAnalyze this and provide a plan.`;

  const messages: Message[] = [
    { role: 'system', content: INITIAL_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  // 4. GROK CALL
  const spinner = startSpinner('Grok is architecting a solution...');
  try {
    const projectContextHint = "High-level architectural planning using project map.";
    const grokResponse = await sendMessage(messages, projectContextHint);
    
    spinner.succeed('Grok analysis complete!');
    logSuccess('\n--- Grok\'s Codebase Analysis and Plan ---');
    console.log(grokResponse);
    logSuccess('----------------------------------------');
    logInfo('\nNext step: Run "codebro fix <path>" to start implementing this plan.');
  } catch (error) {
    spinner.fail('Grok analysis failed.');
    logError(`Error during Grok API call: ${(error as Error).message}`);
  }
}