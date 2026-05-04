import moment from "moment";
import simpleGit from "simple-git";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

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
    
    const dates = buildCommitDates(startDay, endDay, count);
    const totalCommits = dates.length;

    for (let index = 0; index < totalCommits; index++) {
      const dateIso = dates[index];
      const commitMessage = `${messageBase} ${index + 1}/${totalCommits}`;
      await createCommit(git, dateIso, commitMessage);
    }

    await git.push();

    return {
      ok: true,
      repoUrl,
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
