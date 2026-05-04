const artForm = document.getElementById("art-form");
const artStatus = document.getElementById("art-status");
const artOutput = document.getElementById("art-output");
const presetSelect = document.getElementById("presetId");
const sourceRepoUrlInput = document.getElementById("sourceRepoUrl");
const repoNameInput = document.getElementById("repoName");
const destinationRepoUrlInput = document.getElementById("destinationRepoUrl");
const artHistory = document.getElementById("art-history");
const submitArtButton = document.getElementById("submit-art");

const defaultRepoName = "Art History GIT=";
repoNameInput.value = defaultRepoName;

function renderArtEntry(entry) {
  const item = document.createElement("article");
  item.className = "history-item";

  const topRow = document.createElement("div");
  topRow.className = "history-item-top";

  const titleWrap = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = `${entry.presetLabel} · ${entry.commitCount} commits`;
  const subtitle = document.createElement("div");
  subtitle.className = "hint";
  subtitle.textContent = `${entry.repoName} · ${entry.sourceRepoUrl ?? entry.sourceRepoPath ?? "source inconnue"} · ${new Date(entry.generatedAt).toLocaleString("fr-FR")}`;
  titleWrap.append(title, subtitle);

  const meta = document.createElement("div");
  meta.className = "history-meta";
  const kindTag = document.createElement("span");
  kindTag.className = "tag";
  kindTag.textContent = entry.year;
  const statusTag = document.createElement("span");
  statusTag.className = `tag ${entry.status}`;
  statusTag.textContent = entry.status === "active" ? "Actif" : "Supprimé";
  meta.append(kindTag, statusTag);

  topRow.append(titleWrap, meta);

  const details = document.createElement("pre");
  details.textContent = JSON.stringify(entry, null, 2);

  item.append(topRow, details);

  if (entry.status === "active") {
    const actions = document.createElement("div");
    actions.className = "manage-actions";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "danger-button";
    deleteButton.textContent = "Supprimer ce repo Art";
    deleteButton.addEventListener("click", () => {
      void deleteArtGeneration(entry.id, deleteButton);
    });

    const notice = document.createElement("span");
    notice.className = "status";
    notice.textContent = "Cette entrée est la dernière active de son type.";

    actions.append(deleteButton, notice);
    item.append(actions);
  }

  return item;
}

async function loadArtPresets() {
  const response = await fetch("/art-presets");
  const payload = await response.json();

  if (!response.ok || !Array.isArray(payload.presets)) {
    throw new Error(payload.error || "Impossible de charger les presets.");
  }

  presetSelect.innerHTML = "";

  payload.presets.forEach((preset, index) => {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = `${preset.label} · ${preset.year} · ${preset.commitCount} commits`;
    if (index === 0) {
      option.selected = true;
    }
    presetSelect.append(option);
  });
}

async function loadArtHistory() {
  const response = await fetch("/generation-history?kind=art");
  const payload = await response.json();

  if (!response.ok || !Array.isArray(payload.history)) {
    artHistory.replaceChildren(makeEmptyState("Impossible de charger l’historique Art pour le moment."));
    return;
  }

  artHistory.innerHTML = "";

  if (payload.history.length === 0) {
    artHistory.append(makeEmptyState("Aucune génération Art pour le moment."));
    return;
  }

  payload.history.forEach((entry) => {
    artHistory.append(renderArtEntry(entry));
  });
}

function makeEmptyState(text) {
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = text;
  return empty;
}

async function createArtRepo() {
  submitArtButton.disabled = true;
  artStatus.textContent = "Génération Art en cours...";
  artOutput.textContent = JSON.stringify({ message: "Création du repo Art en cours" }, null, 2);

  try {
    const response = await fetch("/generate-art", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        presetId: presetSelect.value,
        sourceRepoUrl: sourceRepoUrlInput.value.trim(),
        repoName: repoNameInput.value.trim(),
        destinationRepoUrl: destinationRepoUrlInput.value.trim(),
      }),
    });

    const payload = await response.json();
    artOutput.textContent = JSON.stringify(payload, null, 2);
    artStatus.textContent = response.ok ? "Repo Art créé." : "Erreur.";
    await loadArtHistory();
  } catch (error) {
    artOutput.textContent = JSON.stringify({ error: String(error) }, null, 2);
    artStatus.textContent = "Erreur réseau.";
  } finally {
    submitArtButton.disabled = false;
  }
}

async function deleteArtGeneration(generationId, triggerButton) {
  if (triggerButton instanceof HTMLButtonElement) {
    triggerButton.disabled = true;
  }

  try {
    const response = await fetch("/delete-generated", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ generationId }),
    });

    const payload = await response.json();
    artOutput.textContent = JSON.stringify(payload, null, 2);
    artStatus.textContent = response.ok ? "Repo Art supprimé." : "Suppression impossible.";
    await loadArtHistory();
  } catch (error) {
    artOutput.textContent = JSON.stringify({ error: String(error) }, null, 2);
    artStatus.textContent = "Erreur réseau.";
  } finally {
    if (triggerButton instanceof HTMLButtonElement) {
      triggerButton.disabled = false;
    }
  }
}

artForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void createArtRepo();
});

void (async () => {
  try {
    await loadArtPresets();
    await loadArtHistory();
  } catch (error) {
    artHistory.replaceChildren(makeEmptyState(String(error?.message ?? error)));
  }
})();
