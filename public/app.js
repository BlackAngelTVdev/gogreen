const form = document.getElementById("commit-form");
const status = document.getElementById("status");
const output = document.getElementById("output");
const submit = document.getElementById("submit");
const repoUrl = document.getElementById("repoUrl");
const startDay = document.getElementById("startDay");
const endDay = document.getElementById("endDay");

const today = new Date().toISOString().slice(0, 10);
repoUrl.value = "";
startDay.value = today;
endDay.value = today;

startDay.addEventListener("change", () => {
  if (endDay.value < startDay.value) {
    endDay.value = startDay.value;
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submit.disabled = true;
  status.textContent = "Génération en cours...";
  output.textContent = "{";

  try {
    const response = await fetch("/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repoUrl: repoUrl.value,
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
  } finally {
    submit.disabled = false;
  }
});
