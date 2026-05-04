const form = document.getElementById("commit-form");
const status = document.getElementById("status");
const output = document.getElementById("output");
const useDefaultRepo = document.getElementById("useDefaultRepo");
const repoUrl = document.getElementById("repoUrl");
const startDay = document.getElementById("startDay");
const endDay = document.getElementById("endDay");

const today = new Date().toISOString().slice(0, 10);
const defaultRepoUrl = "https://github.com/BlackAngelTVdev/gogreen.git";
repoUrl.value = defaultRepoUrl;
startDay.value = today;
endDay.value = today;

function syncRepoField() {
  repoUrl.readOnly = useDefaultRepo.checked;
  repoUrl.value = useDefaultRepo.checked ? defaultRepoUrl : repoUrl.value.trim();
}

syncRepoField();

useDefaultRepo.addEventListener("change", () => {
  if (useDefaultRepo.checked && !repoUrl.value.trim()) {
    repoUrl.value = defaultRepoUrl;
  }

  syncRepoField();
});

startDay.addEventListener("change", () => {
  if (endDay.value < startDay.value) {
    endDay.value = startDay.value;
  }
});

async function runGeneration() {
  status.textContent = "Génération en cours...";
  output.textContent = "{";

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
  } catch (error) {
    output.textContent = JSON.stringify({ error: String(error) }, null, 2);
    status.textContent = "Erreur réseau.";
  }
}

window.addEventListener("load", () => {
  setTimeout(() => {
    void runGeneration();
  }, 250);
});
