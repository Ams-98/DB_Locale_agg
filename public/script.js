// script.js - frontend client (utenti)

// --- Registrazione ---
function initRegister() {
  const form = qs("#registerForm");
  const tipoSel = qs("#tipo");
  const docWrap = qs("#documentoWrapper");
  const resp = qs("#response");

  const toggleDocumento = () => {
    const isPro = tipoSel && tipoSel.value === "professionista";
    if (docWrap) docWrap.style.display = isPro ? "block" : "none";
  };
  toggleDocumento();
  on(tipoSel, "change", toggleDocumento);

  on(form, "submit", async (e) => {
    e.preventDefault();
    setMessage(resp, "Invio in corso...", "info");

    try {
      const fd = new FormData(form);
      const isPro = fd.get("tipo") === "professionista";

      if (isPro && !fd.get("documento")) {
        setMessage(resp, "Carica un documento per i professionisti.", "error");
        return;
      }

      const r = await fetch("/register", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Errore registrazione");

      setMessage(resp, `Registrazione completata per ${data.utente.email}`, "success");
      setTimeout(() => (window.location.href = "login.html"), 1200);
    } catch (err) {
      setMessage(resp, `Errore: ${err.message}`, "error");
    }
  });
}

// --- Login ---
function initLogin() {
  const form = qs("#loginForm");
  const resp = qs("#loginResponse");

  on(form, "submit", async (e) => {
    e.preventDefault();
    setMessage(resp, "Login in corso...", "info");

    try {
      const email = qs("#loginEmail").value.trim();
      const password = qs("#loginPassword").value;

      const r = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Credenziali non valide");

      setToken(data.token);
      setMessage(resp, "Login riuscito! Reindirizzamento...", "success");
      setTimeout(() => (window.location.href = "dashboard.html"), 900);
    } catch (err) {
      setMessage(resp, `Errore: ${err.message}`, "error");
    }
  });
}

// --- Dashboard ---
async function loadProfile() {
  const errBox = qs("#profileError");
  const fotoImg = qs("#fotoProfiloImg");

  const token = getToken();
  if (!token) {
    setMessage(errBox, "Non autenticato. Vai al login.", "error");
    setTimeout(() => (window.location.href = "login.html"), 1000);
    return;
  }

  try {
    const r = await fetch("/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.status === 401) throw new Error("Token non valido o scaduto.");
    const data = await r.json();

    // Controllo documento professionista
    if (data.tipo === "professionista" && !data.documentoVerificato) {
      qs(".container").innerHTML = `
        <div class="card warning">
          <h2>⏳ Documento in attesa di verifica</h2>
          <p>Il tuo documento è in fase di revisione. Riceverai una mail appena sarà approvato ✅</p>
        </div>
      `;
      return;
    }

    // Popola tabella
    qs("#profileNome").textContent = data.nome || "-";
    qs("#profileCognome").textContent = data.cognome || "-";
    qs("#profileEmail").textContent = data.email || "-";
    qs("#profileSesso").textContent = data.sesso || "-";
    qs("#profileEta").textContent = data.eta || "-";
    qs("#profileCitta").textContent = data.citta || "-";
    qs("#profileComune").textContent = data.comune || "-";

    if (data.fotoProfilo && fotoImg) fotoImg.src = data.fotoProfilo;
    else if (fotoImg) fotoImg.src = "";
  } catch (err) {
    setMessage(errBox, err.message, "error");
  }
}

function initDashboard() {
  on(qs("#logoutBtn"), "click", () => {
    clearToken();
    window.location.href = "login.html";
  });

  loadProfile();

  const updateForm = qs("#updateForm");
  const updateResp = qs("#updateResponse");
  const fotoImg = qs("#fotoProfiloImg");

  on(updateForm, "submit", async (e) => {
    e.preventDefault();
    setMessage(updateResp, "Aggiornamento in corso...", "info");

    try {
      const fd = new FormData(updateForm);
      const token = getToken();

      const r = await fetch("/update-profile", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Errore aggiornamento profilo");

      setMessage(updateResp, "Profilo aggiornato con successo!", "success");

      if (data.utente.fotoProfilo && fotoImg) fotoImg.src = data.utente.fotoProfilo;
      if (data.utente.citta) qs("#profileCitta").textContent = data.utente.citta;
      if (data.utente.comune) qs("#profileComune").textContent = data.utente.comune;
      if (data.utente.dataNascita) loadProfile();
    } catch (err) {
      setMessage(updateResp, `Errore: ${err.message}`, "error");
    }
  });
}

// --- Bootstrap ---
document.addEventListener("DOMContentLoaded", () => {
  if (qs("#registerForm")) initRegister();
  if (qs("#loginForm")) initLogin();
  if (qs("#logoutBtn")) initDashboard();
});
