#!/usr/bin/env node
/**
 * research-paper.js
 * Generates a personalized 1-page research paper using Gemini AI.
 * Personalized for a 29-year-old software engineer who loves:
 *   anthropology, dogs, men's fashion & history of clothes, computer science,
 *   AI (as it relates to CS), personal finance, Counter-Strike, Magic the Gathering,
 *   CrossFit, and cooking.
 *
 * Usage:  node research-paper.js
 * Env:    GEMINI_API_KEY  — your Gemini API key
 */

import { GoogleGenAI } from "@google/genai";
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
  const subtitle = chalk.dim("  Powered by Gemini AI · Personalized for you  ");
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
  const printableBody = typeof body === "string" ? body.trim() : "";

  console.log();
  console.log(SEPARATOR);
  console.log();
  console.log(chalk.bold.yellowBright(`  🔬  ${title}`));
  console.log();
  console.log(SEPARATOR);
  console.log();

  if (!printableBody) {
    console.log(chalk.yellow("  No printable body content returned by the model."));
    console.log();
    console.log(SEPARATOR);
    console.log();
    return;
  }

  // Word-wrap and colorize the body section by section
  const lines = printableBody.split("\n");
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

  const previousTitles =
    history.papers?.length > 0
      ? `\n\nIMPORTANT — Previous paper titles (avoid adjacent or near-duplicate angles):\n${history.papers.map((paper, i) => `  ${i + 1}. ${paper.title}`).join("\n")}`
      : "";

  const recentPapers =
    history.papers?.length > 0
      ? `\n\nMost recent papers (you must choose a clearly different domain and angle):\n${history.papers.slice(-3).map((paper, i) => `  ${i + 1}. ${paper.title} [${paper.topic_tag}]`).join("\n")}`
      : "";

  return `You are a research paper generator for a specific person with the following profile:
- Age: 29 years old
- Profession: Software engineer
- Interests (choose ONE to focus on per paper): ${USER_INTERESTS.join(", ")}
- Preference: practical and modern information over purely historical facts${previousTopics}${previousTitles}${recentPapers}

Generate a concise 1-page research paper on a topic that this person would find genuinely fascinating. The topic MUST be one they haven't seen before (see the list above).

Rules:
1. Pick a specific, niche angle — not a broad survey. E.g. don't just write "dogs" — write about a specific aspect like "How border collies process human pointing gestures differently from other breeds".
2. Lean toward practical, modern, or cutting-edge information. Include real-world applications or actionable insights where possible.
3. Ensure the paper is substantively different from recent papers in BOTH domain and angle. If the last paper was finance-related, pick a non-finance domain this time.
4. The paper should have the following sections (use markdown headings):
   ## Abstract
   ## Introduction
   ## Key Findings
   ## Practical Implications
   ## Conclusion
5. Keep the total length to roughly 900–1200 words.
6. In Key Findings, include at least 5 concrete findings with specificity (tools, methods, metrics, or examples).
7. Start your response with a JSON block (fenced with \`\`\`json) containing exactly:
   { "title": "<paper title>", "topic_tag": "<short 3-7 word topic tag>" }
   Then output the full paper body (in markdown) after the JSON block.
8. Write in a clear, engaging style — this is meant to be read for fun as well as for learning.`;
}

function extractGeminiText(response) {
  if (!response) {
    return "";
  }

  if (typeof response.text === "string" && response.text.trim()) {
    return response.text;
  }

  if (typeof response.text === "function") {
    const textFromMethod = response.text();
    if (typeof textFromMethod === "string" && textFromMethod.trim()) {
      return textFromMethod;
    }
  }

  const candidateText = (response.candidates ?? [])
    .flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text)
    .filter((text) => typeof text === "string" && text.trim())
    .join("\n")
    .trim();

  return candidateText;
}

function parseGeneratedPaper(rawResponse) {
  const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/);
  let title = "Research Paper";
  let topicTag = "unknown";
  let body = rawResponse;

  if (jsonMatch) {
    try {
      const meta = JSON.parse(jsonMatch[1]);
      title = meta.title ?? title;
      topicTag = meta.topic_tag ?? topicTag;
      body = rawResponse.replace(/```json[\s\S]*?```/, "").trim();
    } catch {
      body = rawResponse;
    }
  }

  return { title, topicTag, body };
}

function countWords(text) {
  return (text.match(/\b[\w'-]+\b/g) ?? []).length;
}

function validatePaperBody(body) {
  const requiredSections = [
    "## Abstract",
    "## Introduction",
    "## Key Findings",
    "## Practical Implications",
    "## Conclusion",
  ];

  const missingSections = requiredSections.filter(
    (section) => !body.includes(section)
  );
  const words = countWords(body);

  return {
    isValid: missingSections.length === 0 && words >= 800,
    missingSections,
    words,
  };
}

function buildRepairPrompt(originalPrompt, validation) {
  const issues = [
    validation.words < 800
      ? `- Too short: ${validation.words} words; must be 900-1200 words.`
      : null,
    validation.missingSections.length
      ? `- Missing sections: ${validation.missingSections.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `${originalPrompt}

Your prior answer did not satisfy the format/length requirements:
${issues}

Rewrite the paper from scratch and fully comply. Return only:
1) A JSON metadata block as instructed.
2) The complete markdown paper body.`;
}

/* ─────────────────────────────────────────────
   Main
───────────────────────────────────────────── */
async function main() {
  banner();

  // Validate API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      chalk.redBright(
        "\n  ✖  Missing GEMINI_API_KEY environment variable.\n" +
          "     Set it and try again:\n" +
          "     export GEMINI_API_KEY=AIza...\n"
      )
    );
    process.exit(1);
  }

  const history = loadHistory();
  const client = new GoogleGenAI({ apiKey });
  const prompt = buildPrompt(history);
  const preferredModel = process.env.GEMINI_MODEL?.trim();
  const modelCandidates = [...new Set([
    preferredModel,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
  ].filter(Boolean))];

  const spinner = ora({
    text: chalk.cyan("  Asking Gemini to write your paper…"),
    spinner: "dots",
    color: "cyan",
  }).start();

  let rawResponse;
  let modelUsed = modelCandidates[0];
  let lastError;
  try {
    for (const modelName of modelCandidates) {
      try {
        let candidateText = "";
        let validation = { isValid: false, missingSections: [], words: 0 };

        for (let attempt = 0; attempt < 3; attempt++) {
          const contents =
            attempt === 0
              ? prompt
              : buildRepairPrompt(prompt, validation);

          const response = await client.models.generateContent({
            model: modelName,
            contents,
            config: {
              maxOutputTokens: 2600,
            },
          });

          const extractedText = extractGeminiText(response);
          if (!extractedText) {
            continue;
          }

          candidateText = extractedText;
          const parsed = parseGeneratedPaper(candidateText);
          validation = validatePaperBody(parsed.body);

          if (validation.isValid) {
            rawResponse = candidateText;
            modelUsed = modelName;
            lastError = null;
            break;
          }
        }

        if (rawResponse) {
          break;
        }

        lastError = new Error(
          `Incomplete output from model ${modelName} (words: ${validation.words}; missing sections: ${validation.missingSections.join(", ") || "none"}).`
        );
      } catch (err) {
        lastError = err;
      }
    }

    if (!rawResponse) {
      throw lastError ?? new Error("No response received from any Gemini model.");
    }
  } catch (err) {
    spinner.fail(chalk.redBright("  Gemini API call failed."));
    console.error(chalk.red(`\n  ${err.message}\n`));
    console.error(
      chalk.yellow(
        "  Tried models: " + modelCandidates.join(", ") +
          "\n  Tip: set GEMINI_MODEL to one your account can access, or enable billing.\n"
      )
    );
    process.exit(1);
  }

  spinner.succeed(chalk.greenBright(`  Paper generated! (${modelUsed})`));

  const parsedPaper = parseGeneratedPaper(rawResponse);
  let title = parsedPaper.title;
  let topicTag = parsedPaper.topicTag;
  let body = parsedPaper.body;

  if (!body.trim()) {
    body = rawResponse.trim();
  }

  if (!body.trim()) {
    body = "No printable text was returned by the model.";
  }

  if (process.env.GEMINI_DEBUG === "1") {
    console.log(chalk.dim("\n  [debug] raw response preview:\n"));
    console.log(chalk.dim(rawResponse.slice(0, 800)));
    console.log();
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
