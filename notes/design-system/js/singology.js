/* Singology 1:1 is CSS-only: every component is plain HTML with sg- classes
   from css/singology.css. This script only exposes the theme helper below, so any
   stack (or none) can use it. */
window.Singology = {
  version: "1",
  /* Set data-theme on <html>: "light", "dark", or "auto" (follow the device). */
  setTheme: function (theme) {
    var t = theme === "auto" || !theme
      ? (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    document.documentElement.setAttribute("data-theme", t);
    return t;
  }
};
