// Sets the saved theme on <html> before first paint to avoid a flash of the
// wrong theme. Loaded via next/script (strategy="beforeInteractive") from
// the locale layout — it must run before React hydrates.
(function () {
  try {
    var theme = localStorage.getItem('korean-study-theme');
    if (theme) document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
