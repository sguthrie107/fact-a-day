#!/usr/bin/env node
/**
 * research-paper.js
 * Generates a personalized 1-page research paper using Claude AI.
 * Personalized for a 29-year-old software engineer who loves:
 *   anthropology, dogs, men's fashion & history of clothes, computer science,
 *   AI (as it relates to CS), personal finance, Counter-Strike, Magic the Gathering,
 *   CrossFit, and cooking.
 *
 * Usage:  node research-paper.js
 * Env:    ANTHROPIC_API_KEY  — your Anthropic API key
 */

import Anthropic from "@anthropic-ai/sdk";
import chalk from "chalk";
import boxen from "boxen";
import ora from "ora";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/* ─────────────────────────────────────────────
   Paths
───────────────────────────────────────────── */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HISTORY_FILE = path.join(__dirname, "history.json");
const PAPERS_DIR = path.join(__dirname, "papers");

/* ─────────────────────────────────────────────
   User profile
───────────────────────────────────────────── */
const USER_INTERESTS = [
  "anthropology",
  "dogs and dog behavior/breeds",
  "men's fashion",
  "history of clothing and textiles",
  "computer science",
  "artificial intelligence as it relates to computer science",
  "personal finance and investing",
  "Counter-Strike (the video game)",
  "Magic the Gathering",
  "CrossFit and functional fitness",
  "cooking and culinary techniques",
];

/* ─────────────────────────────────────────────
   History helpers
───────────────────────────────────────────── */
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
    }
  } catch {
    // corrupted file — start fresh
  }
  return { topics: [], papers: [] };
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf8");
}

/* ─────────────────────────────────────────────
   File-system helpers
───────────────────────────────────────────── */
function ensurePapersDir() {
  if (!fs.existsSync(PAPERS_DIR)) {
    fs.mkdirSync(PAPERS_DIR, { recursive: true });
  }
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function savePaper(title, body, date) {
  ensurePapersDir();
  const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const slug = slugify(title);
  const filename = `${dateStr}-${slug}.md`;
  const filepath = path.join(PAPERS_DIR, filename);

  const content = [
    `# ${title}`,
    "",
    `> *Generated on ${date.toDateString()} by the fact-a-day research paper engine.*`,
    "",
    "---",
    "",
    body.trim(),
    "",
    "---",
    "",
    `*Paper #${slug} · Saved ${date.toISOString()}*`,
  ].join("\n");

  fs.writeFileSync(filepath, content, "utf8");
  return filename;
}

/* ─────────────────────────────────────────────
   Terminal rendering
───────────────────────────────────────────── */
const SEPARATOR = chalk.cyan("━".repeat(72));

function banner() {
  const title = chalk.bold.magentaBright("  📄  FACT-A-DAY RESEARCH PAPER ENGINE  📄  ");
  const subtitle = chalk.dim("  Powered by Claude AI · Personalized for you  ");
  console.log(
    boxen(`${title}\n${subtitle}`, {
      padding: 1,
      margin: 1,
      borderStyle: "double",
      borderColor: "magenta",
    })
  );
}

function renderPaper(title, body) {
  console.log();
  console.log(SEPARATOR);
  console.log();
  console.log(chalk.bold.yellowBright(`  🔬  ${title}`));
  console.log();
  console.log(SEPARATOR);
  console.log();

  // Word-wrap and colorize the body section by section
  const lines = body.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();

    if (/^#{1,3}\s/.test(trimmed)) {
      // Markdown heading
      const text = trimmed.replace(/^#{1,3}\s+/, "");
      console.log(chalk.bold.cyanBright(`\n  ◆  ${text.toUpperCase()}`));
    } else if (/^\*\*(.+)\*\*$/.test(trimmed)) {
      // Bold-only line (used as a sub-header)
      console.log(chalk.bold.greenBright(`  ${trimmed.replace(/\*\*/g, "")}`));
    } else if (trimmed === "" || trimmed === "---") {
      console.log();
    } else {
      // Wrap body text at 70 chars with 2-space indent
      const words = trimmed.split(" ");
      let currentLine = "  ";
      for (const word of words) {
        if ((currentLine + word).length > 72) {
          console.log(chalk.white(currentLine));
          currentLine = `  ${word} `;
        } else {
          currentLine += `${word} `;
        }
      }
      if (currentLine.trim()) {
        console.log(chalk.white(currentLine));
      }
    }
  }

  console.log();
  console.log(SEPARATOR);
  console.log();
}

/* ─────────────────────────────────────────────
   AI prompt
───────────────────────────────────────────── */
function buildPrompt(history) {
  const previousTopics =
    history.topics.length > 0
      ? `\n\nIMPORTANT — Topics already covered (DO NOT repeat or overlap with these):\n${history.topics.map((t, i) => `  ${i + 1}. ${t}`).join("\n")}`
      : "";

  return `You are a research paper generator for a specific person with the following profile:
- Age: 29 years old
- Profession: Software engineer
- Interests (choose ONE to focus on per paper): ${USER_INTERESTS.join(", ")}
- Preference: practical and modern information over purely historical facts${previousTopics}

Generate a concise 1-page research paper on a topic that this person would find genuinely fascinating. The topic MUST be one they haven't seen before (see the list above).

Rules:
1. Pick a specific, niche angle — not a broad survey. E.g. don't just write "dogs" — write about a specific aspect like "How border collies process human pointing gestures differently from other breeds".
2. Lean toward practical, modern, or cutting-edge information. Include real-world applications or actionable insights where possible.
3. The paper should have the following sections (use markdown headings):
   ## Abstract
   ## Introduction
   ## Key Findings
   ## Practical Implications
   ## Conclusion
4. Keep the total length to roughly 500–700 words (one page when printed).
5. Start your response with a JSON block (fenced with \`\`\`json) containing exactly:
   { "title": "<paper title>", "topic_tag": "<short 3-7 word topic tag>" }
   Then output the full paper body (in markdown) after the JSON block.
6. Write in a clear, engaging style — this is meant to be read for fun as well as for learning.`;
}

/* ─────────────────────────────────────────────
   Main
───────────────────────────────────────────── */
async function main() {
  banner();

  // Validate API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error(
      chalk.redBright(
        "\n  ✖  Missing ANTHROPIC_API_KEY environment variable.\n" +
          "     Set it and try again:\n" +
          "     export ANTHROPIC_API_KEY=sk-ant-...\n"
      )
    );
    process.exit(1);
  }

  const history = loadHistory();
  const client = new Anthropic({ apiKey });

  const spinner = ora({
    text: chalk.cyan("  Asking Claude to write your paper…"),
    spinner: "dots",
    color: "cyan",
  }).start();

  let rawResponse;
  try {
    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: buildPrompt(history) }],
    });
    rawResponse = message.content[0].text;
  } catch (err) {
    spinner.fail(chalk.redBright("  Claude API call failed."));
    console.error(chalk.red(`\n  ${err.message}\n`));
    process.exit(1);
  }

  spinner.succeed(chalk.greenBright("  Paper generated!"));

  // Parse JSON metadata block
  const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/);
  let title = "Research Paper";
  let topicTag = "unknown";
  let body = rawResponse;

  if (jsonMatch) {
    try {
      const meta = JSON.parse(jsonMatch[1]);
      title = meta.title ?? title;
      topicTag = meta.topic_tag ?? topicTag;
      // Strip the JSON block from the body
      body = rawResponse.replace(/```json[\s\S]*?```/, "").trim();
    } catch {
      // Parse error — use raw response as body
    }
  }

  // Display in terminal
  renderPaper(title, body);

  // Save to file
  const now = new Date();
  const filename = savePaper(title, body, now);

  // Update history
  history.topics.push(topicTag);
  history.papers.push({
    date: now.toISOString(),
    title,
    topic_tag: topicTag,
    file: filename,
  });
  saveHistory(history);

  console.log(
    chalk.greenBright(
      boxen(
        `✅  Paper saved to:\n   ${chalk.bold(`papers/${filename}`)}\n\n` +
          `📚  Total papers generated: ${chalk.bold(String(history.papers.length))}`,
        {
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: "green",
        }
      )
    )
  );
}

main();
