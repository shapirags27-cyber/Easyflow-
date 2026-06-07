/** Runs before paint to avoid theme flash — respects system + saved preference. */
export function ThemeScript() {
  const code = `
(function() {
  try {
    var stored = localStorage.getItem('easyflow-theme');
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'light' ? 'light' : stored === 'dark' ? 'dark' : (dark ? 'dark' : 'light');
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  } catch (e) {}
})();
`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
