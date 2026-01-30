const THEME_KEY = "panchanga-theme";
const root = document.documentElement;
const toggleButtons = () => document.querySelectorAll("[data-theme-toggle]");

function getPreferredTheme() {
  return "dark";
}

function applyTheme(theme) {
  const finalTheme = "dark";
  root.setAttribute("data-theme", finalTheme);
  localStorage.setItem(THEME_KEY, finalTheme);
  toggleButtons().forEach((btn) => {
    btn.textContent = "Dark";
  });
}

function initThemeToggle() {
  const theme = getPreferredTheme();
  applyTheme(theme);
  toggleButtons().forEach((btn) => {
    btn.addEventListener("click", () => {
      applyTheme("dark");
    });
  });
}

initThemeToggle();
