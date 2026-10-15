/* Wireframe helpers – OTTIMO DS v0.3 (R1 bước 4). Not production code.
   - State switcher: buttons [data-set-state="loading|empty|error|offline|normal"] change [data-state] on every .stateful (or the one named in data-target).
   - Theme switcher: [data-set-theme="light|dark|auto"].
   - Language: [data-set-lang="vi|en|ru"] replaces text of [data-i18n="key"] using window.OTTIMO_STRINGS (fallback en -> vi).
     Params: data-i18n-args='{"room":"203"}'. Updates <html lang>.
   - Seg / switch demo toggling with aria-pressed / aria-checked. */
(function () {
  var S = window.OTTIMO_STRINGS || { vi: {}, en: {}, ru: {} };
  function fmt(str, args) { return String(str).replace(/\{(\w+)\}/g, function (m, k) { return args && k in args ? args[k] : m; }); }
  function t(lang, key) { return (S[lang] && S[lang][key]) || S.en[key] || S.vi[key] || key; }

  function setLang(lang, root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(function (el) {
      var args = {}; try { args = JSON.parse(el.getAttribute('data-i18n-args') || '{}'); } catch (e) {}
      el.textContent = fmt(t(lang, el.getAttribute('data-i18n')), args);
      // FB-R1-UXR-UXD-06d: a string that falls back to EN must carry lang="en" so screen readers switch voice (WCAG 3.1.2)
      var fb = lang !== 'vi' && !(S[lang] && S[lang][el.getAttribute('data-i18n')]);
      var fbLang = fb ? ((S.en && S.en[el.getAttribute('data-i18n')]) ? 'en' : 'vi') : null;
      if (fbLang && fbLang !== lang) { el.setAttribute('data-fallback', fbLang); el.setAttribute('lang', fbLang); }
      else { el.removeAttribute('data-fallback'); el.removeAttribute('lang'); }
    });
    var scope = root && root !== document ? root : document.documentElement;
    scope.setAttribute('lang', lang);
    // Banners that only make sense in one language (e.g. "Русская версия скоро")
    (root || document).querySelectorAll('[data-only-lang]').forEach(function (el) { el.classList.toggle('on', el.getAttribute('data-only-lang') === lang); });
    document.querySelectorAll('[data-set-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === lang)); });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-set-state]');
    if (b) {
      var st = b.getAttribute('data-set-state');
      var sel = b.getAttribute('data-target') || '.stateful';
      document.querySelectorAll(sel).forEach(function (el) { el.setAttribute('data-state', st); });
      b.parentElement.querySelectorAll('[data-set-state]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var live = document.getElementById('wf-live'); if (live) live.textContent = 'Trạng thái: ' + b.textContent.trim();
      return;
    }
    var th = e.target.closest('[data-set-theme]');
    if (th) {
      var v = th.getAttribute('data-set-theme');
      if (v === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', v);
      th.parentElement.querySelectorAll('[data-set-theme]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === th)); });
      return;
    }
    var lg = e.target.closest('[data-set-lang]');
    if (lg) { var scope = lg.getAttribute('data-target'); setLang(lg.getAttribute('data-set-lang'), scope ? document.querySelector(scope) : document); return; }
    var sw = e.target.closest('[role="switch"]');
    if (sw) {
      var on = sw.getAttribute('aria-checked') !== 'true'; sw.setAttribute('aria-checked', String(on));
      var tgt = sw.getAttribute('data-reveal'); if (tgt) document.querySelectorAll(tgt).forEach(function (el) { el.hidden = !on; });
      var hide = sw.getAttribute('data-conceal'); if (hide) document.querySelectorAll(hide).forEach(function (el) { el.hidden = on; });
      return;
    }
    var sg = e.target.closest('.seg button');
    if (sg && !sg.hasAttribute('data-set-state') ) { sg.parentElement.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === sg)); }); }
  });

  // Stepper +/- demo
  document.addEventListener('click', function (e) {
    var s = e.target.closest('.stepper button'); if (!s) return;
    var out = s.parentElement.querySelector('output'); var v = parseInt(out.textContent, 10) || 0;
    var max = parseInt(s.parentElement.getAttribute('data-max') || '99', 10);
    v = s.getAttribute('data-d') === '-1' ? Math.max(0, v - 1) : Math.min(max, v + 1);
    out.textContent = v;
  });

  document.addEventListener('DOMContentLoaded', function () {
    var init = document.documentElement.getAttribute('data-init-lang');
    if (init) setLang(init);
  });
  window.OTTIMO_WF = { setLang: setLang, t: t };
})();
