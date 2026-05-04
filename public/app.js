const form = document.getElementById("commit-form");
const status = document.getElementById("status");
const output = document.getElementById("output");
const repoUrl = document.getElementById("repoUrl");
const startDay = document.getElementById("startDay");
const endDay = document.getElementById("endDay");
const historyList = document.getElementById("history-list");

const today = new Date().toISOString().slice(0, 10);
const defaultRepoUrl = "https://github.com/yourusername/exemple.git";
repoUrl.value = defaultRepoUrl;
startDay.value = today;
endDay.value = today;

startDay.addEventListener("change", () => {
  if (endDay.value < startDay.value) {
    endDay.value = startDay.value;
  }
});

async function runGeneration() {
  const submitButton = document.getElementById("submit");
  status.textContent = "Génération en cours...";
  output.textContent = "{";
  submitButton.disabled = true;

  try {
    const response = await fetch("/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repoUrl: repoUrl.value.trim(),
        startDay: startDay.value,
        endDay: endDay.value,
        count: Number(document.getElementById("count").value),
        messageBase: document.getElementById("message").value,
      }),
    });

    const payload = await response.json();
    output.textContent = JSON.stringify(payload, null, 2);
    status.textContent = response.ok ? "Terminé." : "Erreur.";
    await loadGenerationHistory();
  } catch (error) {
    output.textContent = JSON.stringify({ error: String(error) }, null, 2);
    status.textContent = "Erreur réseau.";
  } finally {
    submitButton.disabled = false;
  }
}

function formatHistoryEntry(entry) {
  const historyItem = document.createElement("article");
  historyItem.className = "history-item";

  const topRow = document.createElement("div");
  topRow.className = "history-item-top";

  const titleWrap = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = `${entry.kind === "art" ? "GoGreen Art" : "GoGreen Faker"} · ${entry.count} commits`;
  const subtitle = document.createElement("div");
  subtitle.className = "hint";
  subtitle.textContent = `${entry.repoUrl} · ${new Date(entry.generatedAt).toLocaleString("fr-FR")}`;
  titleWrap.append(title, subtitle);

  const meta = document.createElement("div");
  meta.className = "history-meta";
  const statusTag = document.createElement("span");
  statusTag.className = `tag ${entry.status}`;
  statusTag.textContent = entry.status === "active" ? "Actif" : "Supprimé";
  const kindTag = document.createElement("span");
  kindTag.className = "tag";
  kindTag.textContent = entry.kind;
  meta.append(kindTag, statusTag);

  topRow.append(titleWrap, meta);

  const details = document.createElement("pre");
  details.textContent = JSON.stringify(entry, null, 2);

  historyItem.append(topRow, details);

  if (entry.status === "active") {
    const actions = document.createElement("div");
    actions.className = "manage-actions";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "danger-button";
    deleteButton.textContent = "Supprimer cette entrée";
    deleteButton.addEventListener("click", () => {
      void deleteHistoryEntry(entry.id, deleteButton);
    });

    const notice = document.createElement("span");
    notice.className = "status";
    notice.textContent = "Cette entrée est la dernière active de son dépôt et de son type.";

    actions.append(deleteButton, notice);
    historyItem.append(actions);
  }

  return historyItem;
}

async function loadGenerationHistory() {
  try {
    const response = await fetch("/generation-history?kind=faker");
    const payload = await response.json();

    if (response.ok && Array.isArray(payload.history)) {
      historyList.innerHTML = "";

      if (payload.history.length === 0) {
        const emptyState = document.createElement("p");
        emptyState.className = "hint";
        emptyState.textContent = "Aucune entrée d'historique pour le moment.";
        historyList.append(emptyState);
        return;
      }

      payload.history.forEach((entry) => {
        historyList.append(formatHistoryEntry(entry));
      });
    }
  } catch {
    const fallback = document.createElement("p");
    fallback.className = "hint";
    fallback.textContent = "Impossible de charger l'historique pour le moment.";
    historyList.replaceChildren(fallback);
  }
}

async function deleteHistoryEntry(generationId, triggerButton) {
  if (triggerButton instanceof HTMLButtonElement) {
    triggerButton.disabled = true;
  }

  try {
    const response = await fetch("/delete-generated", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        generationId,
      }),
    });

    const payload = await response.json();
    output.textContent = JSON.stringify(payload, null, 2);
    status.textContent = response.ok ? "Entrée supprimée." : "Suppression impossible.";
    await loadGenerationHistory();
  } catch (error) {
    output.textContent = JSON.stringify({ error: String(error) }, null, 2);
    status.textContent = "Erreur réseau.";
  }

  if (triggerButton instanceof HTMLButtonElement) {
    triggerButton.disabled = false;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  void runGeneration();
});

void loadGenerationHistory();
