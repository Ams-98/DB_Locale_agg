// utils.js - funzioni comuni globali

window.qs = (sel) => document.querySelector(sel);
window.on = (el, ev, cb) => el && el.addEventListener(ev, cb);

window.setMessage = (el, msg, type = "info") => {
  if (!el) return;
  el.className = `response ${type}`;
  el.textContent = msg;
};

window.getToken = () => localStorage.getItem("token");
window.setToken = (t) => localStorage.setItem("token", t);
window.clearToken = () => localStorage.removeItem("token");
