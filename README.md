# 🤖 CodeBro: Quantum Neural Core v3.0

**CodeBro** is an AI-powered developer tool that transforms messy or incomplete directories into runnable websites. By leveraging the **xAI Grok-3** engine, it performs high-intelligence project mapping and surgical code repair without the high costs typically associated with LLM tools.

## 🚀 Key Features

* **Neural Scan**: Performs a "Shallow Map" of your project to understand architecture without reading every line of code.
* **Surgical Fixes**: Injects only the specific file context needed for a repair, keeping sidebar chat costs around $0.01 per message.
* **Diagnostic Console**: Real-time logging of the xAI Grok-3 engine status and file system operations.
* **Automated Backups**: Every "Fix" is preceded by a backup in `.codebro/backups`, ensuring your code is always safe.
* **Priority Ranking**: Automatically prioritizes `package.json` and entry points to ensure Grok understands the project "brain" first.

## 🛠️ Technical Stack

* **Core Engine**: xAI Grok-3.
* **Runtime**: Node.js (CLI-first).
* **Build System**: Vite + TypeScript.
* **Intelligence Strategy**: Shallow Mapping & Surgical Context Injection.

## 📦 Installation

1. **Clone the repository**:
```bash
git clone https://github.com/your-repo/codebro.git
cd codebro

```


2. **Configure Environment**:
Create a `.env.local` file in the root directory:
```env
VITE_XAI_API_KEY=your_xai_api_key_here

```


3. **Install Dependencies**:
```bash
npm install

```



## 📖 Usage

### 1. The Neural Audit

To map a project and generate a repair plan, use the `analyze` command:

```bash
codebro analyze ./path-to-project

```

This triggers the **Neural Scan**, which identifies tech stacks and architectural issues.

### 2. The Interactive Repair

To enter the interactive mode (as seen in the **Neural Assistant** sidebar):

```bash
codebro fix ./path-to-project

```

In this mode, you can chat with Grok-3 to apply surgical fixes to specific files.

## ⚠️ Safety & Budget

* **Ignore Patterns**: CodeBro automatically skips `node_modules`, `.git`, and binary files (like `.png`) to save you money.
* **Character Caps**: Total context is hard-capped at 100,000 characters to prevent accidental API overages.

---

**Would you like me to help you set up the `bin` field in your `package.json` so you can run these commands globally by just typing `codebro`?**
