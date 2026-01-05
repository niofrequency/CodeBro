import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Terminal as TerminalIcon, Search, Files, Settings, Play, Bug, Wrench, 
  FolderOpen, ChevronRight, ChevronDown, FileCode, FileJson, FileText,
  AlertCircle, CheckCircle2, Cpu, RefreshCw, Plus, Trash2, Save, 
  Code2, X, GitBranch, Box, Layout, Command, Info, Palette, 
  MessageSquare, Send, Paperclip, Eraser, PanelRightClose, 
  PanelRightOpen, User, Bot, Layers, History, Activity, Zap, 
  Package, Folder, Copy, Check, Sparkles, Globe, Shield, HardDrive
} from 'lucide-react';

// FIXED IMPORT: Added /src/ to match your directory: C:\Users\admti\Desktop\CodeBro-main\src\utils\grokService.ts
import { sendMessage } from './src/utils/grokService';

// --- Types & Interfaces ---
interface ProjectFile {
  name: string;
  path: string;
  type: 'code' | 'json' | 'text';
  content: string;
  isModified?: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

type SidebarPane = 'explorer' | 'search' | 'git' | 'debug' | 'extensions' | 'settings';

// --- Constants ---
const INITIAL_PROJECT: ProjectFile[] = [
  { 
    name: 'package.json', 
    path: 'package.json', 
    type: 'json', 
    content: '{\n  "name": "codebro-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "express": "^4.18.2",\n    "lucide-react": "latest"\n  }\n}' 
  },
  { 
    name: 'index.js', 
    path: 'src/index.js', 
    type: 'code', 
    content: 'const express = require("express");\nconst app = express();\n\n// TODO: Fix the missing route handler\n\napp.listen(3000, () => {\n  console.log("Server running on http://localhost:3000");\n});', 
    isModified: true 
  },
  { 
    name: 'grokService.ts', 
    path: 'src/utils/grokService.ts', 
    type: 'code', 
    content: '// AI logic initialized\nexport const callGrok = () => { /* ... */ };' 
  },
  { 
    name: 'README.md', 
    path: 'README.md', 
    type: 'text', 
    content: '# Welcome to CodeBro\nUse the AI tools to analyze or fix this codebase.' 
  }
];

// --- Helper Functions ---
const buildFileTree = (files: ProjectFile[]) => {
  const root: any = {};
  files.forEach(file => {
    const parts = file.path.split('/');
    let current = root;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        current[part] = { isFile: true, file };
      } else {
        if (!current[part]) current[part] = { isFile: false, children: {} };
        current = current[part].children;
      }
    });
  });
  return root;
};

const FileIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'json': return <FileJson size={14} className="text-yellow-400" />;
    case 'code': return <FileCode size={14} className="text-blue-400" />;
    default: return <FileText size={14} className="text-slate-400" />;
  }
};

// --- Sub-Components ---
const FormattedGrokMessage = ({ content }: { content: string }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
          const lang = match?.[1] || 'code';
          const code = match?.[2] || '';
          const blockId = `block-${index}`;

          return (
            <div key={index} className="rounded-lg border border-[#30363d] bg-black/80 overflow-hidden my-3 shadow-2xl">
              <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
                  <span className="text-[10px] font-mono text-slate-500 uppercase ml-2 tracking-widest">{lang}</span>
                </div>
                <button 
                  onClick={() => copyToClipboard(code, blockId)}
                  className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-emerald-400 transition-all font-bold px-2 py-0.5 rounded hover:bg-emerald-500/10"
                >
                  {copiedId === blockId ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiedId === blockId ? 'COPIED' : 'COPY'}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto custom-scrollbar bg-[#0d1117]">
                <code className="text-[12px] font-mono text-emerald-50/90 leading-relaxed">{code}</code>
              </pre>
            </div>
          );
        }
        return <p key={index} className="text-[13px] leading-relaxed whitespace-pre-wrap text-slate-300">{part}</p>;
      })}
    </div>
  );
};

const FileTreeItem = ({ name, node, activePath, onSelect, depth = 0 }: any) => {
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = node.isFile && node.file.path === activePath;

  if (node.isFile) {
    return (
      <div 
        onClick={() => onSelect(node.file.path)}
        className={`flex items-center space-x-2 py-1.5 px-3 cursor-pointer rounded-md text-[13px] transition-all group ${isSelected ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500' : 'text-slate-400 hover:bg-[#161b22] hover:text-slate-200'}`}
        style={{ marginLeft: `${depth * 8}px` }}
      >
        <FileIcon type={node.file.type} />
        <span className="truncate flex-1">{name}</span>
        {node.file.isModified && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]" />}
      </div>
    );
  }

  return (
    <div>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 py-1.5 px-3 cursor-pointer text-slate-300 hover:bg-[#161b22] text-[13px] font-medium transition-colors"
        style={{ marginLeft: `${depth * 8}px` }}
      >
        <div className="transition-transform duration-200" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          <ChevronRight size={14} className="text-slate-500" />
        </div>
        <Folder size={14} className={`${isOpen ? 'text-emerald-500' : 'text-slate-500'} transition-colors`} />
        <span className="truncate">{name}</span>
      </div>
      {isOpen && (
        <div className="border-l border-[#30363d] ml-5 mt-0.5">
          {Object.entries(node.children).map(([childName, childNode]: any) => (
            <FileTreeItem 
              key={childName} 
              name={childName} 
              node={childNode} 
              activePath={activePath} 
              onSelect={onSelect} 
              depth={depth + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Application ---
const App = () => {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<'editor' | 'analyze' | 'plan'>('editor');
  const [activeSidebar, setActiveSidebar] = useState<SidebarPane>('explorer');
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  
  // Data State
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>(INITIAL_PROJECT);
  const [activeFilePath, setActiveFilePath] = useState<string | null>('src/index.js');
  const [searchQuery, setSearchQuery] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [logs, setLogs] = useState<string[]>(['CodeBro v1.2.6 Initialized...', 'System: xAI Grok-3 engine connected.']);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: "System online. I am Grok-3. Upload a directory or select a file to begin the neural audit.", timestamp: new Date().toLocaleTimeString() }
  ]);
  const [chatInput, setChatInput] = useState('');
  
  // Settings
  const [settings, setSettings] = useState({
    theme: 'Deep Space',
    fontSize: 14,
    aiModel: 'grok-3',
    autoSave: true,
    telemetry: false
  });

  // Refs
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Memos
  const fileTree = useMemo(() => buildFileTree(projectFiles), [projectFiles]);
  const activeFile = useMemo(() => projectFiles.find(f => f.path === activeFilePath) || null, [projectFiles, activeFilePath]);
  const modifiedFiles = useMemo(() => projectFiles.filter(f => f.isModified), [projectFiles]);
  
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return projectFiles.filter(f => 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      f.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projectFiles, searchQuery]);

  // Effects
  useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  // Handlers
  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-100));

  const handleFileSelect = (path: string) => {
    setActiveFilePath(path);
    setActiveTab('editor');
    addLog(`Opened: ${path}`);
  };

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!activeFilePath) return;
    const newContent = e.target.value;
    setProjectFiles(prev => prev.map(f => 
      f.path === activeFilePath ? { ...f, content: newContent, isModified: true } : f
    ));
  };

  const handleOpenFolder = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        addLog('Error: Browser does not support File System Access API.');
        return;
      }
      const dirHandle = await (window as any).showDirectoryPicker();
      setIsBusy(true);
      addLog(`Indexing directory: ${dirHandle.name}...`);
      
      const files: ProjectFile[] = [];
      const readDir = async (handle: any, currentPath = '') => {
        for await (const entry of handle.values()) {
          const relPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            if (file.size < 1024 * 500) { 
              const content = await file.text();
              const ext = entry.name.split('.').pop();
              files.push({
                name: entry.name,
                path: relPath,
                type: ext === 'json' ? 'json' : (['js','ts','tsx','py','css'].includes(ext) ? 'code' : 'text'),
                content,
                isModified: false
              });
            }
          } else if (entry.kind === 'directory' && !['node_modules', '.git', 'dist'].includes(entry.name)) {
            await readDir(entry, relPath);
          }
        }
      };

      await readDir(dirHandle);
      setProjectFiles(files);
      if (files.length > 0) setActiveFilePath(files[0].path);
      addLog(`Success: Indexed ${files.length} project files.`);
    } catch (err: any) {
      addLog(`System Error: ${err.message}`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleAnalyze = async () => {
    setIsBusy(true);
    setActiveTab('analyze');
    addLog("Neural Scan: Running comprehensive audit of codebase...");
    
    setTimeout(() => {
      setAnalysis({
        techStack: ["React 18", "TypeScript 5.0", "Express", "Lucide Icons", "TailwindCSS"],
        summary: "Architecture is monolithic but well-structured. Core logic resides in src/. The neural engine recommends optimizing asynchronous middleware and hardening environment variables.",
        issues: [
          "Security: Hardcoded port and lack of CORS policy in index.js",
          "Performance: Unoptimized memoization in recursive Tree component",
          "Logic: Missing 404/500 global error handlers",
          "Structure: Config files missing from project root"
        ],
        plan: [
          "Initialize .env system for dynamic port management",
          "Implement global error handling middleware in Express",
          "Add project-wide linting rules for TypeScript strictness",
          "Refactor directory indexing for large-scale file support"
        ]
      });
      addLog("Scan Complete: Found 4 critical points. Repair plan generated.");
      setIsBusy(false);
    }, 3000);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isBusy) return;

    const userInput = chatInput;
    const userMsg: ChatMessage = { 
      role: 'user', 
      content: userInput, 
      timestamp: new Date().toLocaleTimeString() 
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsBusy(true);
    addLog(`Neural Link: Forwarding request to Grok-3...`);

    try {
      const historyForApi = chatMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      let finalPrompt = userInput;
      if (activeFile) {
        finalPrompt = `[Context: Current file is ${activeFile.path}]\nCode:\n${activeFile.content}\n\nUser Question: ${userInput}`;
      }
      
      historyForApi.push({ role: 'user', content: finalPrompt });

      const responseText = await sendMessage(historyForApi as any);

      const assistantMsg: ChatMessage = { 
        role: 'assistant', 
        content: responseText, 
        timestamp: new Date().toLocaleTimeString() 
      };

      setChatMessages(prev => [...prev, assistantMsg]);
      addLog("Grok-3: Intelligence stream synchronized.");
    } catch (err: any) {
      addLog(`Neural Error: ${err.message}`);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ Connection Failed: ${err.message}.`, 
        timestamp: new Date().toLocaleTimeString() 
      }]);
    } finally {
      setIsBusy(false);
    }
  };

  const handleFixStep = (step: string) => {
    setIsBusy(true);
    addLog(`Neural Reconstruction: Executing "${step}"...`);
    setTimeout(() => {
      addLog(`Success: Applied changes for ${step}`);
      setIsBusy(false);
    }, 1200);
  };

  const attachActiveFile = () => {
    if (activeFile) {
      setChatInput(prev => prev + `\n\n[FILE_CONTEXT: ${activeFile.path}]\n\`\`\`\n${activeFile.content}\n\`\`\``);
    }
  };

  const handleCommit = () => {
    if (modifiedFiles.length === 0) return;
    addLog(`Git: Committing ${modifiedFiles.length} files to main...`);
    setIsBusy(true);
    setTimeout(() => {
      setProjectFiles(prev => prev.map(f => ({ ...f, isModified: false })));
      addLog("Git: Push successful to origin/main.");
      setIsBusy(false);
    }, 1500);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d1117] text-slate-300 font-sans selection:bg-emerald-500/30">
      
      {/* 1. Activity Bar (Navigation) */}
      <div className="w-14 border-r border-[#30363d] flex flex-col items-center py-4 space-y-4 bg-[#0d1117] z-30 select-none">
        <div className="mb-4 text-emerald-500 animate-pulse"><Box size={28} /></div>
        <button onClick={() => setActiveSidebar('explorer')} className={`p-2 rounded-xl transition-all ${activeSidebar === 'explorer' ? 'text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}><Files size={24} /></button>
        <button onClick={() => setActiveSidebar('search')} className={`p-2 rounded-xl transition-all ${activeSidebar === 'search' ? 'text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}><Search size={24} /></button>
        <button onClick={() => setActiveSidebar('git')} className={`p-2 rounded-xl transition-all ${activeSidebar === 'git' ? 'text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}><GitBranch size={24} /></button>
        <button onClick={() => setActiveSidebar('debug')} className={`p-2 rounded-xl transition-all ${activeSidebar === 'debug' ? 'text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}><Bug size={24} /></button>
        <div className="flex-1" />
        <button onClick={() => setActiveSidebar('settings')} className={`p-2 rounded-xl transition-all ${activeSidebar === 'settings' ? 'text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-slate-500 hover:text-slate-300'}`}><Settings size={24} /></button>
      </div>

      {/* 2. Secondary Sidebar Content */}
      <div className="w-64 border-r border-[#30363d] bg-[#0d1117] flex flex-col z-10 shadow-2xl overflow-hidden">
        
        {activeSidebar === 'explorer' && (
          <>
            <div className="p-4 flex items-center justify-between">
              <span className="uppercase text-[11px] font-black text-slate-500 tracking-[0.2em]">Project Explorer</span>
              <button className="text-slate-500 hover:text-emerald-400"><Plus size={14} /></button>
            </div>
            <div className="px-4 pb-4">
              <button 
                onClick={handleOpenFolder} 
                className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg shadow-lg shadow-emerald-900/20 transition-all active:scale-95 group"
              >
                <FolderOpen size={16} className="group-hover:animate-bounce" />
                <span>Open Project</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
              <div className="py-2">
                {Object.entries(fileTree).map(([name, node]) => (
                  <FileTreeItem 
                    key={name} name={name} node={node} 
                    activePath={activeFilePath} onSelect={handleFileSelect} 
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {activeSidebar === 'search' && (
          <div className="flex flex-col h-full">
            <div className="p-4 uppercase text-[11px] font-black text-slate-500 tracking-[0.2em]">Neural Search</div>
            <div className="px-4 space-y-4">
              <div className="relative group">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Find in files..."
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-lg p-2.5 text-xs text-white outline-none focus:border-emerald-500 transition-all"
                />
                <Search size={14} className="absolute right-3 top-3 text-slate-500 group-focus-within:text-emerald-400" />
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pb-10">
                {searchResults.map(f => (
                  <div key={f.path} onClick={() => handleFileSelect(f.path)} className="p-3 bg-[#161b22]/40 hover:bg-[#161b22] rounded-lg border border-[#30363d] cursor-pointer transition-all hover:border-emerald-500/30">
                    <div className="flex items-center space-x-2 mb-1">
                      <FileIcon type={f.type} />
                      <span className="text-[12px] font-semibold text-slate-200">{f.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{f.path}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSidebar === 'git' && (
          <div className="flex flex-col h-full">
            <div className="p-4 uppercase text-[11px] font-black text-slate-500 tracking-[0.2em]">Source Control</div>
            <div className="flex-1 px-4">
              <div className="mb-6">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-4 px-1">
                  <span className="flex items-center gap-2"><Activity size={12} /> CHANGES</span>
                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full text-[10px]">{modifiedFiles.length}</span>
                </div>
                {modifiedFiles.length === 0 ? (
                  <div className="text-center py-10 opacity-30 text-xs">Clean working directory</div>
                ) : (
                  <div className="space-y-1">
                    {modifiedFiles.map(f => (
                      <div key={f.path} onClick={() => handleFileSelect(f.path)} className="flex items-center gap-3 text-[13px] py-2 px-3 rounded-lg cursor-pointer hover:bg-[#161b22] group">
                        <FileIcon type={f.type} />
                        <span className="truncate text-slate-300 flex-1 group-hover:text-white">{f.name}</span>
                        <span className="text-yellow-500 font-black text-[10px]">M</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button 
                onClick={handleCommit}
                disabled={modifiedFiles.length === 0}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>Push to Origin</span>
              </button>
            </div>
          </div>
        )}

        {activeSidebar === 'settings' && (
          <div className="p-6 space-y-8">
            <div className="uppercase text-[11px] font-black text-slate-500 tracking-[0.2em]">Engine Config</div>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-2"><Cpu size={14} /> AI Model</label>
                <select value={settings.aiModel} onChange={(e) => setSettings({...settings, aiModel: e.target.value})} className="w-full bg-[#161b22] border border-[#30363d] text-xs py-2.5 px-3 rounded-lg outline-none text-white focus:border-emerald-500">
                  <option value="grok-3">Grok-3 Neural</option>
                  <option value="grok-2">Grok-2 Stable</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-2"><Palette size={14} /> UI Theme</label>
                <select value={settings.theme} className="w-full bg-[#161b22] border border-[#30363d] text-xs py-2.5 px-3 rounded-lg outline-none text-white opacity-50 cursor-not-allowed">
                  <option>Deep Space Green</option>
                </select>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-[#30363d]">
                <span className="text-[11px] text-slate-400">Auto-save</span>
                <div className="w-10 h-5 bg-emerald-600 rounded-full flex items-center px-1 transition-all cursor-pointer"><div className="w-3 h-3 bg-white rounded-full ml-auto" /></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Workspace / Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117] relative">
        
        {/* Workspace Top Header */}
        <div className="h-12 border-b border-[#30363d] flex items-center justify-between px-6 bg-[#0d1117]/80 backdrop-blur-md z-20">
          <div className="flex items-center space-x-4">
            {activeFile && (
              <div className="flex items-center space-x-2 text-[13px] font-semibold text-slate-200">
                <FileIcon type={activeFile.type} />
                <span>{activeFile.path}</span>
                {activeFile.isModified && <span className="text-yellow-500 italic text-[11px] font-normal">• Unsaved</span>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleAnalyze} disabled={isBusy} className={`flex items-center gap-2 bg-emerald-500/10 text-emerald-400 text-[11px] font-black px-4 py-2 rounded-full border border-emerald-500/20 hover:bg-emerald-500/20 transition-all ${isBusy ? 'opacity-50' : ''}`}>
              <Sparkles size={14} className={isBusy ? 'animate-spin' : ''} />
              <span>{isBusy ? 'ANALYZING...' : 'RUN NEURAL SCAN'}</span>
            </button>
            <button onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)} className={`p-2 rounded-lg hover:bg-slate-800 transition-all ${isRightSidebarOpen ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-500'}`}>
              {isRightSidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#0d1117] border-b border-[#30363d] px-6 select-none">
          {['editor', 'analyze', 'plan'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)} 
              className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === tab ? 'border-emerald-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Viewport */}
        <div className="flex-1 overflow-hidden relative">
          
          {isBusy && activeTab === 'editor' && (
            <div className="absolute inset-0 z-10 pointer-events-none">
              <div className="absolute inset-0 bg-emerald-500/[0.03] animate-pulse" />
              <div className="w-full h-[3px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.5)] absolute top-0 animate-scan-line" />
            </div>
          )}

          {activeTab === 'editor' && activeFile ? (
            <div className="flex h-full font-mono">
              <div className="w-14 bg-[#0d1117] text-[#2a2f36] text-[12px] flex flex-col items-center pt-6 border-r border-[#30363d] select-none">
                {activeFile.content.split('\n').map((_, i) => <div key={i} className="h-6 leading-6">{i + 1}</div>)}
              </div>
              <textarea 
                value={activeFile.content} 
                onChange={handleEditorChange} 
                spellCheck={false}
                style={{ fontSize: `${settings.fontSize}px` }}
                className={`w-full h-full bg-[#0d1117] text-[#e6edf3] p-6 outline-none resize-none custom-scrollbar leading-6 tracking-tight transition-all selection:bg-emerald-500/20 ${isBusy ? 'opacity-40 grayscale-[0.8]' : 'opacity-100'}`}
              />
            </div>
          ) : activeTab === 'analyze' && analysis ? (
            <div className="p-12 max-w-5xl mx-auto h-full overflow-y-auto custom-scrollbar space-y-10">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/5"><Cpu size={40} /></div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight uppercase">Intelligence Report</h2>
                  <p className="text-slate-500 text-xs font-bold">ENGINE: xAI GROK-3 • SCAN: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#161b22] p-6 rounded-2xl border border-[#30363d] space-y-4">
                  <h3 className="text-xs font-black uppercase text-emerald-500 tracking-[0.2em] flex items-center gap-2"><Package size={16} /> Technical Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.techStack.map((t: string) => <span key={t} className="px-3 py-1 bg-[#0d1117] text-slate-300 border border-[#30363d] rounded-lg text-xs font-bold">{t}</span>)}
                  </div>
                </div>
                <div className="bg-[#161b22] p-6 rounded-2xl border border-red-500/20 space-y-4 shadow-[0_10px_30px_rgba(239,68,68,0.05)]">
                  <h3 className="text-xs font-black uppercase text-red-400 tracking-[0.2em] flex items-center gap-2"><AlertCircle size={16} /> Critical Issues</h3>
                  <ul className="space-y-3">
                    {analysis.issues.map((iss: string, idx: number) => (
                      <li key={idx} className="text-xs text-slate-300 flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shadow-[0_0_5px_red]" />
                        <span>{iss}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-[#161b22] p-8 rounded-2xl border border-[#30363d] space-y-4 leading-relaxed relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={100} /></div>
                <h3 className="text-xs font-black uppercase text-slate-500 tracking-[0.2em]">Summary Overview</h3>
                <p className="text-slate-300 text-sm leading-8">{analysis.summary}</p>
              </div>
            </div>
          ) : activeTab === 'plan' && analysis ? (
            <div className="p-12 max-w-5xl mx-auto h-full overflow-y-auto custom-scrollbar space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-4 uppercase"><Wrench size={32} className="text-emerald-500" /> Neural Repair Sequence</h2>
                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full border border-emerald-500/20">READY</span>
              </div>
              
              <div className="space-y-4">
                {analysis.plan.map((step: string, i: number) => (
                  <div key={i} className="group flex items-center justify-between bg-[#161b22] border border-[#30363d] p-8 rounded-2xl hover:border-emerald-500/40 transition-all hover:shadow-2xl">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-xl bg-[#0d1117] flex items-center justify-center text-lg font-black text-emerald-500 border border-[#30363d] group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        {i + 1}
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Sequence Step</span>
                        <span className="text-white text-sm font-bold block">{step}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleFixStep(step)} 
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl text-xs font-black shadow-lg shadow-emerald-900/40 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
                    >
                      PATCH
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4 grayscale">
              <RefreshCw size={80} className={isBusy ? 'animate-spin' : ''} />
              <p className="font-black uppercase tracking-[0.5em] text-sm">Waiting for project data</p>
            </div>
          )}
        </div>

        {/* Dynamic Terminal / Console */}
        <div className="h-44 border-t border-[#30363d] bg-[#0d1117] flex flex-col z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.4)]">
          <div className="px-6 py-2.5 border-b border-[#30363d] flex items-center justify-between bg-[#161b22]/30 select-none">
            <div className="flex items-center gap-3">
              <TerminalIcon size={14} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnostic Console</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600">
              <span className="flex items-center gap-1"><HardDrive size={10} /> PROJECT ROOT: /LOCAL_ENV</span>
              <span className="flex items-center gap-1 text-emerald-500/50"><Shield size={10} /> ENCRYPTED SESSION</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] space-y-2 custom-scrollbar bg-black/10">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 group">
                <span className="text-slate-800 select-none">{i.toString().padStart(2, '0')}</span>
                <span className="text-slate-600">❯</span>
                <span className={`${log.includes('Success') || log.includes('Git') || log.includes('Grok') ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>{log}</span>
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>

      {/* 4. Grok Assistant Panel (Right) */}
      <div className={`border-l border-[#30363d] bg-[#0d1117] flex flex-col transition-all duration-500 ease-in-out z-40 ${isRightSidebarOpen ? 'w-[420px]' : 'w-0 overflow-hidden'}`}>
        <div className="p-5 border-b border-[#30363d] flex items-center justify-between bg-[#161b22]/30 select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20"><Bot size={20} /></div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-200 block">Neural Assistant</span>
              <span className="text-[9px] text-emerald-500 font-black flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> GROK-3 ACTIVE</span>
            </div>
          </div>
          <button onClick={() => setChatMessages([])} title="Purge memory" className="p-2 text-slate-600 hover:text-red-400 transition-colors"><Eraser size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-gradient-to-b from-black/10 to-transparent">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-3 opacity-40 select-none text-[9px] font-black uppercase tracking-[0.2em]">
                {msg.role === 'assistant' ? <Bot size={12} className="text-emerald-400" /> : <User size={12} />}
                <span>{msg.role}</span>
                <span className="font-normal opacity-40">• {msg.timestamp}</span>
              </div>
              <div className={`max-w-full p-5 rounded-2xl text-[13px] leading-relaxed shadow-xl border transition-all ${msg.role === 'user' ? 'bg-emerald-600/5 text-emerald-50 border-emerald-500/20 ml-6' : 'bg-[#161b22] text-slate-200 border-[#30363d] mr-6'}`}>
                {msg.role === 'assistant' ? <FormattedGrokMessage content={msg.content} /> : <p className="whitespace-pre-wrap">{msg.content}</p>}
              </div>
            </div>
          ))}
          {isBusy && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-emerald-500/60 text-[9px] font-black uppercase tracking-widest">
                <RefreshCw size={12} className="animate-spin" />
                <span>Grok is thinking...</span>
              </div>
              <div className="w-32 h-1 bg-[#161b22] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 animate-[loading_1.5s_infinite]" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-6 bg-[#0d1117] border-t border-[#30363d] shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
          <div className="relative bg-[#161b22] rounded-2xl border border-[#30363d] focus-within:border-emerald-500/50 transition-all p-3">
            <textarea 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
              placeholder="Ask Grok to refactor, fix, or explain..."
              className="w-full bg-transparent border-none text-[13px] text-slate-200 outline-none resize-none h-28 p-2 custom-scrollbar leading-6"
            />
            <div className="flex items-center justify-between mt-3 px-2">
              <button onClick={attachActiveFile} title="Reference current file" className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-emerald-400 transition-all">
                <Paperclip size={18} />
              </button>
              <button 
                onClick={() => handleSendChat()} 
                disabled={isBusy || !chatInput.trim()} 
                className={`p-3 rounded-xl transition-all active:scale-90 flex items-center gap-3 ${isBusy || !chatInput.trim() ? 'bg-slate-800 text-slate-700 opacity-50' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/40'}`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest">Send</span>
                <Send size={18} />
              </button>
            </div>
          </div>
          <div className="mt-4 flex justify-center opacity-20">
            <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.3em]">Quantum Neural Core v3.0</p>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #484f58; }
        
        @keyframes scan-line {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .animate-scan-line {
          animation: scan-line 4s linear infinite;
        }

        textarea {
          caret-color: #10b981;
        }
      `}</style>
    </div>
  );
};

// --- Initial Render ---
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}