// script.js - frontend client

const qs = (sel) => document.querySelector(sel);
const on = (el, ev, cb) => el && el.addEventListener(ev, cb);

function setMessage(el, msg, type = "info") {
  if (!el) return;
  el.className = `response ${type}`;
  el.textContent = msg;
}

function getToken() {
  return localStorage.getItem("token");
}

function setToken(t) {
  localStorage.setItem("token", t);
}

function clearToken() {
  localStorage.removeItem("token");
}

// --- Registrazione ---
function initRegister() {
  const form = qs("#registerForm");
  const tipoSel = qs("#tipo");
  const docWrap = qs("#documentoWrapper");
  const resp = qs("#response");

  // Mostra/nascondi campo documento
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

      // Se professionista ma niente file, avvisa
      if (isPro && !fd.get("documento")) {
        setMessage(resp, "Carica un documento per i professionisti.", "error");
        return;
      }

      const r = await fetch("/register", {
        method: "POST",
        body: fd,
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Errore registrazione");

      setMessage(resp, `Registrazione completata per ${data.utente.email}`, "success");

      // vai al login dopo 1.2s
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
  const box = qs("#profileBox");
  const errBox = qs("#profileError");

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
    if (r.status === 401) {
      throw new Error("Token non valido o scaduto. Effettua di nuovo il login.");
    }
    const data = await r.json();

    box.textContent = JSON.stringify(data, null, 2);
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
}

// bootstrap per pagina
document.addEventListener("DOMContentLoaded", () => {
  if (qs("#registerForm")) initRegister();
  if (qs("#loginForm")) initLogin();
  if (qs("#logoutBtn")) initDashboard();
});
