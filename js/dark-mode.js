(function() {
  var saved = localStorage.getItem('theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  var btn = document.createElement('button');
  btn.id = 'theme-toggle';
  btn.textContent = '\uD83C\uDF19';
  btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999;font-size:1.5rem;padding:0.5rem;border-radius:50%;border:none;cursor:pointer;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
  btn.addEventListener('click', function() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    btn.textContent = isDark ? '\uD83C\uDF19' : '\u2600\uFE0F';
  });
  document.body.appendChild(btn);
})();
