/* appearance.js - Theme and text size. */

/* ============================================================
   PROMPT 14: appearance, accessibility, install and offline
   ============================================================ */

/* ---------- theme and text size (stored under historyosis_appearance; the early script in <head> applies it before paint) */
const APPEAR_KEY = 'historyosis_appearance';
function appearanceGet() {
  try {
    const a = JSON.parse(localStorage.getItem(APPEAR_KEY) || 'null') || {};
    return { theme: (a.theme === 'light' || a.theme === 'dark') ? a.theme : 'auto', size: (a.size === 'small' || a.size === 'large') ? a.size : 'normal' };
  } catch (e) { return { theme: 'auto', size: 'normal' }; }
}
function appearanceApply() {
  const a = appearanceGet(); let dark = a.theme === 'dark';
  if (a.theme === 'auto') { try { dark = !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); } catch (e) {} }
  const d = document.documentElement;
  d.setAttribute('data-theme', dark ? 'dark' : 'light'); d.setAttribute('data-theme-pref', a.theme); d.setAttribute('data-size', a.size);
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', dark ? '#101216' : '#F5F5F7');
}
function appearanceSet() {
  const t = document.getElementById('set-theme'), z = document.getElementById('set-size');
  const a = { theme: t ? t.value : 'auto', size: z ? z.value : 'normal' };
  try { localStorage.setItem(APPEAR_KEY, JSON.stringify(a)); } catch (e) {}
  appearanceApply();
}
function appearanceSettingsHTML() {
  const a = appearanceGet();
  const o = (v, l, cur) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${l}</option>`;
  return `<div class="field"><label for="set-theme">Appearance</label>
    <select id="set-theme" onchange="appearanceSet()">${o('auto', 'Automatic (follow the device)', a.theme)}${o('light', 'Light', a.theme)}${o('dark', 'Dark', a.theme)}</select></div>
    <div class="field"><label for="set-size">Text size</label>
    <select id="set-size" onchange="appearanceSet()">${o('small', 'Small', a.size)}${o('normal', 'Normal', a.size)}${o('large', 'Large', a.size)}</select>
    <div style="font-size:0.75rem;margin-top:4px;color:var(--text-muted)">Changes apply straight away. Printing always uses a light page.</div></div>`;
}
appearanceApply();
try { const _mq = matchMedia('(prefers-color-scheme: dark)'); if (_mq.addEventListener) _mq.addEventListener('change', appearanceApply); else if (_mq.addListener) _mq.addListener(appearanceApply); } catch (e) {}
