# 📄 Fact-a-Day — AI Research Paper Generator

A personalized, AI-powered research paper generator that delivers a unique 1-page research paper every time you run it — tailored to your interests with zero repetition across runs.

Built with **Node.js** and powered by **Google Gemini**.

---

## ✨ What It Does

Each run:

1. Asks Gemini to pick a **fresh, specific topic** from your interests (anthropology, dogs, men's fashion, history of clothing, computer science, AI, personal finance, CrossFit, cooking).
2. Generates a **~500–700 word research paper** with abstract, key findings, and practical implications.
3. Prints it to the terminal with **colorful formatting** that looks great in PowerShell and any modern terminal.
4. Saves the paper as a **Markdown file** in the `papers/` directory.
5. Records the topic in `history.json` so **no topic is ever repeated**.

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Notes |
|---|---|
| [Node.js](https://nodejs.org) v18 or higher | Download from https://nodejs.org |
| Gemini API key | Create one at https://aistudio.google.com/app/apikey |

### 1 — Get a Gemini API Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
2. Create a new Gemini API key.

### 2 — Set Your API Key

**PowerShell (Windows):**
```powershell
$env:GEMINI_API_KEY = "AIza-your-key-here"
```

**Bash/Zsh (macOS / Linux):**
```bash
export GEMINI_API_KEY="AIza-your-key-here"
```

Optional model override (useful if your quota doesn't include Pro models):

**PowerShell (Windows):**
```powershell
$env:GEMINI_MODEL = "gemini-2.5-flash"
```

**Bash/Zsh (macOS / Linux):**
```bash
export GEMINI_MODEL="gemini-2.5-flash"
```

> 💡 **Tip:** Add this line to your `$PROFILE` (PowerShell) or `~/.bashrc` / `~/.zshrc` so you don't have to set it every session.

### 3 — Install Dependencies (first run only)

```powershell
npm install
```

### 4 — Run It!

**PowerShell (Windows):**
```powershell
.\run.ps1
```

**Bash/Zsh (macOS / Linux):**
```bash
./run.sh
```

**Or directly with Node:**
```bash
node research-paper.js
```

---

## 📁 File Structure

```
fact-a-day/
├── research-paper.js   ← main executable
├── run.ps1             ← PowerShell launcher (Windows)
├── run.sh              ← Shell launcher (macOS/Linux)
├── package.json
├── history.json        ← auto-created; tracks topics to avoid repeats
└── papers/
    └── YYYY-MM-DD-<slug>.md   ← generated papers saved here
```

---

## 🎨 Terminal Output Preview

The output includes:
- A magenta double-border banner
- Color-coded section headers in cyan
- Body text in white
- A green success box with the saved filename and total paper count

All ANSI colors render natively in **Windows Terminal**, **PowerShell 7+**, and any modern Unix terminal.

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| `GEMINI_API_KEY is not set` | See step 2 above |
| `Quota exceeded` / `RESOURCE_EXHAUSTED` | Use a Flash model via `GEMINI_MODEL` (e.g. `gemini-2.5-flash`) or enable billing |
| `Node.js is not installed` | Download from https://nodejs.org |
| `Cannot find module` | Run `npm install` first |
| Papers repeating topics | Delete `history.json` to reset the deduplication history |

---

## 📚 Your Interest Profile

Papers are generated around these topics (one specific angle per run):

- 🦴 Anthropology
- 🐕 Dogs & dog behavior/breeds
- 👔 Men's fashion & history of clothing/textiles
- 💻 Computer science
- 🤖 AI as it relates to computer science
- 💰 Personal finance & investing
- 🏋️ CrossFit & functional fitness
- 🍳 Cooking & culinary techniques

---

*Powered by [Google Gemini](https://ai.google.dev/) · Written in JavaScript (Node.js)*