import * as path from 'node:path';
import * as readline from 'node:readline/promises';
import process from 'node:process';
import chalk from 'chalk';

// Optimized imports using the new budget-friendly scanner functions
import { 
  scanDirectoryShallow, 
  scanSingleFile 
} from '../utils/fileScanner';
import { sendMessage } from '../utils/grokService';
import {
  logError,
  logInfo,
  logSuccess,
  logBold,
  logWarning,
  startSpinner,
  confirm,
  displayDiff,
  logCode,
  parseGrokFixResponse,
} from '../utils/cliUtils';

/**
 * Global types
 */
import type { Message, CodeChange, GrokAnalysisResult } from '../types';

import { backupFile, createFile } from '../utils/codeWriter';
import {
  CODEBRO_FILE_CHANGE_START,
} from '../constants';

/**
 * Parses Grok's conversational analysis into a structured roadmap.
 */
async function parseGrokAnalysis(response: string): Promise<GrokAnalysisResult> {
  const analysis: GrokAnalysisResult = {
    summary: '',
    techStack: [],
    issues: [],
    plan: [],
  };

  const techStackMatch = response.match(/Tech Stack:\s*(.*)/i);
  if (techStackMatch?.[1]) {
    analysis.techStack = techStackMatch[1].split(',').map((s: string) => s.trim()).filter(Boolean);
  }

  const issuesMatch = response.match(/Issues Identified:\s*\n((?:- [^\n]+\n?)+)/i);
  if (issuesMatch?.[1]) {
    analysis.issues = issuesMatch[1].split('\n')
      .filter((line: string) => line.startsWith('- '))
      .map((line: string) => line.substring(2).trim());
  }

  const planMatch = response.match(/Plan to make it runnable:\s*\n((?:[0-9]+\. [^\n]+\n?)+)/i);
  if (planMatch?.[1]) {
    analysis.plan = planMatch[1].split('\n')
      .filter((line: string) => /^[0-9]+\./.test(line))
      .map((line: string) => line.replace(/^[0-9]+\./, '').trim());
  }

  return analysis;
}

export async function fixProject(projectPath: string): Promise<void> {
  const absolutePath = path.resolve(projectPath);
  logInfo(`\nInitiating Budget-Friendly Fix Mode: ${absolutePath}`);

  // We maintain a project map (shallow scan) to give Grok context without code bloat
  let projectMap = "";
  let chatHistory: Message[] = [{ 
    role: 'system', 
    content: `You are CodeBro. When asked to implement a step, you MUST use the ${CODEBRO_FILE_CHANGE_START} markers. You have a high-level map of the project, but you only see file content when the user provides it.` 
  }];
  let grokAnalysis: GrokAnalysisResult | null = null;
  
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  // 1. SHALLOW SCAN (Low Cost)
  const mapSpinner = startSpinner('Mapping project structure...');
  try {
    projectMap = await scanDirectoryShallow(absolutePath);
    mapSpinner.succeed('Project map generated.');
  } catch (error) {
    mapSpinner.fail('Failed to map directory.');
    rl.close();
    return;
  }

  // 2. INITIAL ARCHITECTURAL PLAN
  // We send the Map + package.json (usually the most important file for tech stack)
  const pkgJson = await scanSingleFile(absolutePath, 'package.json');
  const initialPrompt = `PROJECT MAP:\n${projectMap}\n\nCORE FILE (package.json):\n${pkgJson?.content || 'Not found'}\n\nAnalyze the project structure and provide a roadmap to fix it.`;
  
  chatHistory.push({ role: 'user', content: initialPrompt });

  const analysisSpinner = startSpinner('Grok is architecting a solution...');
  try {
    const grokResponse = await sendMessage(chatHistory, "Initial Architecture Planning");
    chatHistory.push({ role: 'assistant', content: grokResponse });
    grokAnalysis = await parseGrokAnalysis(grokResponse);
    analysisSpinner.succeed('Plan ready.');
    console.log(chalk.cyan('\n--- CODEBRO ROADMAP ---'));
    console.log(grokResponse);
  } catch (error) {
    analysisSpinner.fail(`Analysis failed: ${(error as Error).message}`);
    rl.close();
    return;
  }

  // 3. INTERACTIVE SURGICAL LOOP
  let interactive = true;
  while (interactive) {
    const userInput = await rl.question(chalk.magenta('\nNext action (e.g., "step 1", "exit"): '));
    const command = userInput.toLowerCase().trim();

    if (command === 'exit' || command === 'quit') {
      interactive = false;
      continue;
    }

    if (command.includes('step')) {
      const stepIdx = parseInt(command.replace(/[^\d]/g, ''), 10) - 1;
      
      if (!grokAnalysis || isNaN(stepIdx) || !grokAnalysis.plan[stepIdx]) {
        logError('Step not found in the current roadmap.');
        continue;
      }

      const stepDescription = grokAnalysis.plan[stepIdx];
      logInfo(`\n🚀 Implementing: ${stepDescription}`);

      // Ask for the specific file to minimize token usage
      const targetFile = await rl.question(chalk.yellow('Which file should I read for this step? (e.g. src/App.tsx): '));
      
      const fixSpinner = startSpinner(`Reading ${targetFile} and generating fix...`);
      try {
        const fileData = await scanSingleFile(absolutePath, targetFile);
        
        // Surgical Prompt: Only the map context + the single target file content
        const stepPrompt = `Action: ${stepDescription}.\n\nTARGET FILE: ${targetFile}\nCURRENT CONTENT:\n\`\`\`\n${fileData?.content || '// New File'}\n\`\`\``;
        
        chatHistory.push({ role: 'user', content: stepPrompt });
        const grokFixResponse = await sendMessage(chatHistory, `Applying fix to ${targetFile}`);
        
        fixSpinner.succeed(`Changes suggested for ${targetFile}.`);

        const changes = parseGrokFixResponse(grokFixResponse);
        
        for (const change of changes) {
          logBold(`\nPROPOSED CHANGE: ${change.file} (${change.action})`);
          const targetFilePath = path.join(absolutePath, change.file);

          if (change.content) {
            // Compare against local version
            displayDiff(fileData?.content || '', change.content);
            
            const shouldApply = await confirm(`Apply this change to ${change.file}?`);
            if (shouldApply) {
              await backupFile(targetFilePath);
              await createFile(targetFilePath, change.content);
              logSuccess(`Successfully updated ${change.file}`);
            }
          }
        }
      } catch (error: any) {
        fixSpinner.fail(`Generation failed: ${error.message}`);
      }
    }
  }

  rl.close();
  logInfo('Exiting CodeBro Fix Mode. Happy coding!');
}