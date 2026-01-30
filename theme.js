const THEME_KEY = "panchanga-theme";
const root = document.documentElement;
const toggleButtons = () => document.querySelectorAll("[data-theme-toggle]");

function getPreferredTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  toggleButtons().forEach((btn) => {
    btn.textContent = theme === "dark" ? "Light" : "Dark";
  });
}

function initThemeToggle() {
  const theme = getPreferredTheme();
  applyTheme(theme);
  toggleButtons().forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
    });
  });
}

initThemeToggle();
