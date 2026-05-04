import moment from "moment";
import simpleGit from "simple-git";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

const dataFilePath = path.join(process.cwd(), "data.json");

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
    // Aucun état persistant encore, on repart d'un état vide.
  }

  return { history: [] };
}

async function saveState(state) {
  await writeFile(dataFilePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function buildCommitDates(startDayIso, endDayIso, totalCommits) {
  const start = moment(startDayIso).startOf("day");
  const end = moment(endDayIso).endOf("day");
  const durationMs = Math.max(1, end.valueOf() - start.valueOf());

  return Array.from({ length: totalCommits }, () => {
    const offsetMs = Math.floor(Math.random() * durationMs);
    return start.clone().add(offsetMs, "milliseconds").toISOString();
  }).sort((left, right) => new Date(left).valueOf() - new Date(right).valueOf());
}

async function createCommit(git, dateIso, commitMessage) {
  await git.raw(["commit", "--allow-empty", "--date", dateIso, "-m", commitMessage]);
}

function createHistoryEntry({ kind, repoUrl, branchName, baseCommit, generatedHead, startDay, endDay, count, messageBase }) {
  return {
    id: randomUUID(),
    kind,
    repoUrl,
    branchName,
    baseCommit,
    generatedHead,
    startDay,
    endDay,
    count,
    messageBase,
    generatedAt: new Date().toISOString(),
    status: "active",
  };
}

function getActiveEntriesInOrder(history, filterFn = () => true) {
  return history.filter((entry) => entry && entry.status === "active" && filterFn(entry));
}

export async function generateCommits({ repoUrl, startDay, endDay, count, messageBase }) {
  if (!repoUrl || typeof repoUrl !== "string" || !repoUrl.trim()) {
    throw new Error("Fournis une URL de dépôt valide.");
  }

  if (!moment(startDay, "YYYY-MM-DD", true).isValid()) {
    throw new Error("Choisis une date de début valide.");
  }

  if (!moment(endDay, "YYYY-MM-DD", true).isValid()) {
    throw new Error("Choisis une date de fin valide.");
  }

  if (moment(endDay).isBefore(moment(startDay), "day")) {
    throw new Error("La date de fin doit être égale ou postérieure à la date de début.");
  }

  if (!Number.isInteger(count) || count < 1 || count > 365) {
    throw new Error("Le nombre de commits doit être entre 1 et 365.");
  }

  // Clone le dépôt dans un dossier temporaire
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "gogreen-"));
  const git = simpleGit(tempDir);

  try {
    await git.clone(repoUrl, tempDir);
    const branchName = (await git.raw(["branch", "--show-current"]).catch(() => "")).trim() || "main";
    const baseCommit = (await git.revparse(["HEAD"])).trim();

    const dates = buildCommitDates(startDay, endDay, count);
    const totalCommits = dates.length;

    for (let index = 0; index < totalCommits; index++) {
      const dateIso = dates[index];
      const commitMessage = `${messageBase} ${index + 1}/${totalCommits}`;
      await createCommit(git, dateIso, commitMessage);
    }

    await git.push();
    const generatedHead = (await git.revparse(["HEAD"])).trim();

    const historyEntry = createHistoryEntry({
      kind: "faker",
      repoUrl,
      branchName,
      baseCommit,
      generatedHead,
      startDay,
      endDay,
      count: totalCommits,
      messageBase,
    });

    const state = await loadState();
    state.history.push(historyEntry);
    await saveState(state);

    return {
      ok: true,
      generationId: historyEntry.id,
      repoUrl,
      branchName,
      baseCommit,
      generatedHead,
      startDay,
      endDay,
      count: totalCommits,
      messageBase,
      commits: dates,
    };
  } finally {
    // Nettoie le dossier temporaire
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function deleteHistoryEntry({ generationId }) {
  const state = await loadState();
  const activeEntries = getActiveEntriesInOrder(state.history, (entry) => entry.kind === "faker" || entry.kind === "art");

  if (activeEntries.length === 0) {
    throw new Error("Aucune entrée d'historique active à supprimer.");
  }

  const generation = generationId
    ? activeEntries.find((entry) => entry.id === generationId)
    : activeEntries[activeEntries.length - 1];

  if (!generation || generation.status !== "active") {
    throw new Error("Cette entrée ne peut pas être supprimée.");
  }

  const activeEntriesForRepo = getActiveEntriesInOrder(state.history, (entry) => {
    if (entry.kind !== generation.kind) {
      return false;
    }

    if (generation.kind === "art") {
      return entry.repoPath === generation.repoPath;
    }

    return entry.repoUrl === generation.repoUrl;
  });
  const latestMatchingEntry = activeEntriesForRepo[activeEntriesForRepo.length - 1];

  if (!latestMatchingEntry || latestMatchingEntry.id !== generation.id) {
    throw new Error("Supprime d'abord les lots plus récents de cette même page.");
  }

  try {
    if (generation.kind === "art") {
      if (generation.destinationRepoUrl) {
        const tempDir = await mkdtemp(path.join(os.tmpdir(), "gogreen-delete-art-"));
        const git = simpleGit(tempDir);

        await git.clone(generation.destinationRepoUrl, tempDir);
        await git.raw(["checkout", "-B", generation.branchName, `origin/${generation.branchName}`]);

        const currentHead = (await git.revparse(["HEAD"])).trim();
        if (currentHead !== generation.generatedHead) {
          throw new Error("Le repo Art a changé depuis la génération. Impossible de supprimer ce lot en sécurité.");
        }

        await git.raw(["reset", "--hard", generation.baseCommit]);
        await git.raw(["push", "--force", "origin", generation.branchName]);
        await rm(tempDir, { recursive: true, force: true });
      } else {
        await rm(generation.repoPath, { recursive: true, force: true });
      }
    } else {
      const tempDir = await mkdtemp(path.join(os.tmpdir(), "gogreen-delete-"));
      const git = simpleGit(tempDir);
      await git.clone(generation.repoUrl, tempDir);
      await git.raw(["checkout", "-B", generation.branchName, `origin/${generation.branchName}`]);

      const currentHead = (await git.revparse(["HEAD"])).trim();
      if (currentHead !== generation.generatedHead) {
        throw new Error("Le dépôt a changé depuis la génération. Impossible de supprimer ce lot en sécurité.");
      }

      await git.raw(["reset", "--hard", generation.baseCommit]);
      await git.raw(["push", "--force", "origin", generation.branchName]);

      await rm(tempDir, { recursive: true, force: true });
    }

    const revertedAt = new Date().toISOString();
    const updatedState = await loadState();
    updatedState.history = updatedState.history.map((entry) => {
      if (entry.id !== generation.id) {
        return entry;
      }

      return {
        ...entry,
        status: "reverted",
        revertedAt,
      };
    });

    await saveState(updatedState);

    return {
      ok: true,
      generationId: generation.id,
      repoUrl: generation.repoUrl,
      branchName: generation.branchName,
      revertedAt,
      deletedCount: generation.count,
    };
  } finally {
    // Les clones temporaires sont nettoyés au fil du flux.
  }
}

export async function getGenerationHistory({ kind } = {}) {
  const state = await loadState();
  const history = state.history.slice().reverse();

  if (!kind) {
    return history;
  }

  return history.filter((entry) => entry.kind === kind);
}
