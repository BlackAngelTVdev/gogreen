import moment from "moment";
import simpleGit from "simple-git";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

const dataFilePath = path.join(process.cwd(), "data.json");

const ART_PRESETS = {
  "2023-bloom": {
    id: "2023-bloom",
    label: "Bloom 2023",
    year: 2023,
    commitCount: 12,
    palette: ["#12403a", "#1f7a63", "#f2a541", "#f26a4b", "#f8f1e7"],
    layout: "circle",
  },
  "2023-grid": {
    id: "2023-grid",
    label: "Grid 2023",
    year: 2023,
    commitCount: 16,
    palette: ["#101828", "#2c4d7a", "#5fa8d3", "#f2c14e", "#f4f1de"],
    layout: "grid",
  },
  "2023-ribbon": {
    id: "2023-ribbon",
    label: "Ribbon 2023",
    year: 2023,
    commitCount: 18,
    palette: ["#3d155f", "#7f2982", "#c44569", "#f9a826", "#f5f0e6"],
    layout: "ribbon",
  },
};

function sanitizeRepoName(repoName) {
  const fallbackName = "Art History GIT=";
  const source = String(repoName ?? fallbackName).trim() || fallbackName;
  return source.replace(/[\\/:*?"<>|]/g, "-");
}

async function loadState() {
  try {
    const content = await readFile(dataFilePath, "utf8");
    const parsed = JSON.parse(content);

    if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.history)) {
        return {
          history: parsed.history.filter((entry) => entry && typeof entry === "object"),
        };
      }

      if (parsed.lastGeneration) {
        return {
          history: [parsed.lastGeneration].filter((entry) => entry && typeof entry === "object"),
        };
      }
    }
  } catch {
    return { history: [] };
  }

  return { history: [] };
}

async function saveState(state) {
  await writeFile(dataFilePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function createSeededRandom(seedText) {
  let seed = 0;

  for (let index = 0; index < seedText.length; index++) {
    seed = (seed * 31 + seedText.charCodeAt(index)) >>> 0;
  }

  return () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pickPaletteColor(preset, index) {
  return preset.palette[index % preset.palette.length];
}

function buildSourceDates(sourceDates, year, totalCommits) {
  const sortedSourceDates = sourceDates
    .map((dateText) => moment(dateText))
    .filter((dateValue) => dateValue.isValid())
    .sort((left, right) => left.valueOf() - right.valueOf());

  if (sortedSourceDates.length > 0) {
    return Array.from({ length: totalCommits }, (_, index) => {
      const sourceDate = sortedSourceDates[index % sortedSourceDates.length].clone();
      sourceDate.add(Math.floor(index / sortedSourceDates.length) * 7, "minutes");
      return sourceDate.toISOString();
    }).sort((left, right) => new Date(left).valueOf() - new Date(right).valueOf());
  }

  const start = moment(`${year}-01-01`).startOf("day");
  const end = moment(`${year}-12-31`).endOf("day");
  const durationMs = Math.max(1, end.valueOf() - start.valueOf());

  return Array.from({ length: totalCommits }, (_, index) => {
    const ratio = totalCommits === 1 ? 0.5 : index / (totalCommits - 1);
    const offsetMs = Math.floor(durationMs * ratio);
    return start.clone().add(offsetMs, "milliseconds").toISOString();
  });
}

async function collectSourceDates(sourceRepoUrl, year) {
  const git = simpleGit(sourceRepoUrl);
  const since = `${year}-01-01`;
  const until = `${year}-12-31`;

  try {
    const logOutput = await git.raw([
      "log",
      `--since=${since}`,
      `--until=${until}`,
      "--format=%ad",
      "--date=iso-strict",
    ]);

    return logOutput
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function createShape(preset, random, index) {
  const hueShift = Math.floor(random() * 360);
  const opacity = (0.55 + random() * 0.35).toFixed(2);
  const color = pickPaletteColor(preset, index);
  const x = 5 + Math.floor(random() * 90);
  const y = 10 + Math.floor(random() * 70);
  const size = 12 + Math.floor(random() * 22);

  if (preset.layout === "grid") {
    const gridX = 10 + (index % 6) * 14;
    const gridY = 16 + Math.floor(index / 6) * 14;
    return `<rect x="${gridX}" y="${gridY}" width="12" height="12" rx="2" fill="${color}" fill-opacity="${opacity}" transform="rotate(${hueShift % 18} 50 50)" />`;
  }

  if (preset.layout === "ribbon") {
    const yOffset = 18 + (index * 5) % 50;
    return `<path d="M 0 ${yOffset} C 28 ${yOffset - 10}, 66 ${yOffset + 14}, 100 ${yOffset - 4}" stroke="${color}" stroke-width="${4 + (index % 4)}" stroke-linecap="round" fill="none" stroke-opacity="${opacity}" />`;
  }

  return `<circle cx="${x}" cy="${y}" r="${size}" fill="${color}" fill-opacity="${opacity}" stroke="#ffffff" stroke-opacity="0.18" stroke-width="1" />`;
}

function buildSvgContent({ preset, repoName, dates, shapes }) {
  const bgA = preset.palette[0];
  const bgB = preset.palette[preset.palette.length - 1];
  const pattern = shapes.join("\n        ");
  const timelineLabel = `${preset.label} · ${dates.length} commits · ${repoName}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" role="img" aria-label="${timelineLabel}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgA}" />
      <stop offset="100%" stop-color="${bgB}" />
    </linearGradient>
    <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="14" />
    </filter>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)" />
  <circle cx="200" cy="150" r="110" fill="#ffffff" fill-opacity="0.06" filter="url(#blur)" />
  <circle cx="1000" cy="650" r="140" fill="#ffffff" fill-opacity="0.07" filter="url(#blur)" />
  ${pattern}
  <rect x="50" y="640" width="1100" height="110" rx="26" fill="#0f172a" fill-opacity="0.42" />
  <text x="80" y="690" fill="#ffffff" fill-opacity="0.96" font-size="34" font-family="Arial, Helvetica, sans-serif" font-weight="700">${repoName}</text>
  <text x="80" y="730" fill="#ffffff" fill-opacity="0.8" font-size="18" font-family="Arial, Helvetica, sans-serif">${preset.label} · ${dates[0] ?? ""} → ${dates[dates.length - 1] ?? ""}</text>
</svg>`;
}

async function writeArtFiles(repoPath, payload) {
  const manifest = {
    ...payload.manifest,
    updatedAt: new Date().toISOString(),
  };

  await writeFile(path.join(repoPath, "canvas.svg"), payload.svg, "utf8");
  await writeFile(path.join(repoPath, "timeline.json"), `${JSON.stringify(payload.timeline, null, 2)}\n`, "utf8");
  await writeFile(path.join(repoPath, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(path.join(repoPath, "README.md"), payload.readme, "utf8");
}

function createHistoryEntry({ repoName, repoPath, preset, sourceRepoUrl, destinationRepoUrl, sourceDates, generatedHead, commitDates }) {
  return {
    id: randomUUID(),
    kind: "art",
    repoName,
    repoPath,
    sourceRepoUrl,
    destinationRepoUrl: destinationRepoUrl ?? null,
    presetId: preset.id,
    presetLabel: preset.label,
    year: preset.year,
    sourceCommitCount: sourceDates.length,
    generatedHead,
    commitCount: commitDates.length,
    commitDates,
    generatedAt: new Date().toISOString(),
    status: "active",
  };
}

export async function generateArtRepo({ presetId, repoName, sourceRepoUrl, destinationRepoUrl }) {
  const preset = ART_PRESETS[presetId] ?? ART_PRESETS["2023-bloom"];
  const safeRepoName = sanitizeRepoName(repoName);
  const sourceClonePath = await mkdtemp(path.join(os.tmpdir(), `${safeRepoName}-source-`));
  const repoPath = await mkdtemp(path.join(os.tmpdir(), `${safeRepoName}-`));
  const git = simpleGit(repoPath);
  const sourceClone = simpleGit(sourceClonePath);

  if (!sourceRepoUrl || !String(sourceRepoUrl).trim()) {
    throw new Error("Fournis une URL GitHub source pour l’historique Art.");
  }

  await sourceClone.clone(sourceRepoUrl, sourceClonePath);
  const sourceDates = await collectSourceDates(sourceClonePath, preset.year);
  const commitDates = buildSourceDates(sourceDates, preset.year, preset.commitCount);
  const random = createSeededRandom(`${preset.id}:${safeRepoName}:${commitDates.length}`);
  const shapes = [];

  try {
    try {
      await git.raw(["init", "-b", "main"]);
    } catch {
      await git.raw(["init"]);
      await git.raw(["branch", "-M", "main"]).catch(() => {});
    }
    await git.raw(["config", "user.name", "goGreen Art"]);
    await git.raw(["config", "user.email", "art@gogreen.local"]);

    for (let index = 0; index < commitDates.length; index++) {
      shapes.push(createShape(preset, random, index));

      const svg = buildSvgContent({
        preset,
        repoName: safeRepoName,
        dates: commitDates.slice(0, index + 1),
        shapes,
      });

      await writeArtFiles(repoPath, {
        svg,
        timeline: {
          presetId: preset.id,
          year: preset.year,
          commitDates: commitDates.slice(0, index + 1),
          sourceCommitDates: sourceDates,
          shapesCount: shapes.length,
        },
        manifest: {
          repoName: safeRepoName,
          presetId: preset.id,
          presetLabel: preset.label,
          year: preset.year,
          commitIndex: index + 1,
          totalCommits: commitDates.length,
          sourceCommitCount: sourceDates.length,
        },
        readme: `# ${safeRepoName}\n\nPreset: ${preset.label}\nYear: ${preset.year}\nCommits: ${index + 1}/${commitDates.length}\n`,
      });

      await git.raw(["add", "."]);
      await git.raw(["commit", "--date", commitDates[index], "-m", `${preset.label} ${index + 1}/${commitDates.length}`]);
    }

    const generatedHead = (await git.revparse(["HEAD"])).trim();

    if (destinationRepoUrl && String(destinationRepoUrl).trim()) {
      try {
        await git.removeRemote("origin");
      } catch {
        // Remote absent, on continue.
      }

      await git.addRemote("origin", String(destinationRepoUrl).trim());
      await git.raw(["push", "-u", "origin", "main"]);
      await rm(repoPath, { recursive: true, force: true });
    }

    const historyEntry = createHistoryEntry({
      repoName: safeRepoName,
      repoPath,
      preset,
      sourceRepoUrl: String(sourceRepoUrl).trim(),
      destinationRepoUrl: destinationRepoUrl ? String(destinationRepoUrl).trim() : null,
      sourceDates,
      generatedHead,
      commitDates,
    });

    const state = await loadState();
    state.history.push(historyEntry);
    await saveState(state);

    return {
      ok: true,
      generationId: historyEntry.id,
      repoName: safeRepoName,
      repoPath,
      sourceRepoUrl: String(sourceRepoUrl).trim(),
      destinationRepoUrl: destinationRepoUrl ? String(destinationRepoUrl).trim() : null,
      presetId: preset.id,
      presetLabel: preset.label,
      year: preset.year,
      sourceCommitCount: sourceDates.length,
      commitCount: commitDates.length,
      generatedHead,
      commitDates,
    };
  } catch (error) {
    await rm(repoPath, { recursive: true, force: true });
    await rm(sourceClonePath, { recursive: true, force: true });
    throw error;
  } finally {
    await rm(sourceClonePath, { recursive: true, force: true });
  }
}

export async function getArtPresets() {
  return Object.values(ART_PRESETS).map((preset) => ({
    id: preset.id,
    label: preset.label,
    year: preset.year,
    commitCount: preset.commitCount,
  }));
}
