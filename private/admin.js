// admin.js - pannello amministrazione

/* --- Utility locali --- */
const qs = (sel) => document.querySelector(sel);
const ce = (tag) => document.createElement(tag);
const on = (el, ev, cb) => el && el.addEventListener(ev, cb);

function getToken() {
  return localStorage.getItem("token");
}
function clearToken() {
  localStorage.removeItem("token");
}
function setMessage(el, msg, type = "info") {
  if (!el) return;
  el.className = `response ${type}`;
  el.textContent = msg;
}

/* --- Caricamento utenti --- */
async function loadUsers() {
  const tbody = qs("#usersTable tbody");
  const respBox = qs("#adminResponse");
  tbody.innerHTML = "";

  try {
    const r = await fetch("/admin/users", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!r.ok) throw new Error("Accesso negato o errore nel caricamento utenti");
    const users = await r.json();

    users.forEach((u) => {
      const tr = ce("tr");
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.nome || "-"}</td>
        <td>${u.cognome || "-"}</td>
        <td>${u.email}</td>
        <td>${u.sesso || "-"}</td>
        <td>${u.citta || "-"}</td>
        <td>${u.comune || "-"}</td>
        <td>${u.tipo}</td>
        <td>${u.documento ? `<a href="/uploads/${u.documento}" target="_blank">Vedi</a>` : "-"}</td>
        <td>
          ${u.documentoVerificato
            ? '<span class="btn success">✅ Confermato</span>'
            : '<span class="btn danger">❌ Non confermato</span>'}
        </td>
        <td>${u.ruolo}</td>
        <td>
          <button class="btn primary verifyBtn" data-id="${u.id}" ${u.documentoVerificato ? "disabled" : ""}>
            Verifica
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Collego i bottoni di verifica
    document.querySelectorAll(".verifyBtn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const userId = btn.dataset.id;
        try {
          const r = await fetch(`/admin/verify-document/${userId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify({ stato: true }),
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data?.error || "Errore verifica");
          setMessage(respBox, `Documento utente #${userId} verificato ✅`, "success");
          loadUsers();
        } catch (err) {
          setMessage(respBox, err.message, "error");
        }
      });
    });
  } catch (err) {
    setMessage(respBox, err.message, "error");
  }
}

/* --- Init pagina admin --- */
document.addEventListener("DOMContentLoaded", () => {
  if (!getToken()) {
    window.location.href = "../login.html";
    return;
  }

  on(qs("#logoutBtn"), "click", () => {
    clearToken();
    window.location.href = "../login.html";
  });

  loadUsers();
});
