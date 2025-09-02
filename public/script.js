// --- Registrazione ---
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(registerForm);

    // Validazione password (almeno un numero e un carattere speciale)
    const password = formData.get("password");
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])/;
    if (!passwordRegex.test(password)) {
      document.getElementById("response").innerText =
        "⚠️ La password deve contenere almeno un numero e un carattere speciale.";
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        document.getElementById("response").innerText =
          "✅ Registrazione completata!";
        console.log("Utente registrato:", data);
      } else {
        document.getElementById("response").innerText =
          "❌ " + (data.error || "Errore nella registrazione.");
      }
    } catch (err) {
      console.error("Errore di rete:", err);
      document.getElementById("response").innerText =
        "⚠️ Errore di connessione al server.";
    }
  });
}

// --- Login ---
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      document.getElementById("response").innerText =
        "Inserisci email e password.";
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        document.getElementById("response").innerText =
          "✅ Login effettuato con successo!";
        console.log("Utente loggato:", data);

        // 🔑 Salvo il token JWT in localStorage
        if (data.token) {
          localStorage.setItem("token", data.token);
        }

        // 🔁 Redirect automatico alla dashboard
        window.location.href = "dashboard.html";
      } else {
        document.getElementById("response").innerText =
          "❌ " + (data.error || "Credenziali non valide.");
      }
    } catch (err) {
      console.error("Errore di rete:", err);
      document.getElementById("response").innerText =
        "⚠️ Errore di connessione al server.";
    }
  });
}

// --- Dashboard (legge token e chiama /profile) ---
async function caricaProfilo() {
  const token = localStorage.getItem("token");
  if (!token) {
    document.getElementById("dashboard").innerText =
      "⚠️ Non sei autenticato. Torna al login.";
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/profile", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById("dashboard").innerHTML = `
        <h2>Benvenuto, ${data.nome}!</h2>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>ID Utente:</strong> ${data.id}</p>
        <button onclick="logout()">🚪 Logout</button>
      `;
    } else {
      document.getElementById("dashboard").innerText =
        "❌ " + (data.error || "Errore nel caricamento del profilo.");
    }
  } catch (err) {
    console.error("Errore di rete:", err);
    document.getElementById("dashboard").innerText =
      "⚠️ Errore di connessione al server.";
  }
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}

// Avvia caricamento profilo se siamo in dashboard
if (document.getElementById("dashboard")) {
  caricaProfilo();
}
