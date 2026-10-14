/* a11y.js - Accessibility labels, focus handling. */

/* ---------- accessibility */
// 1. Link every label to its field, and give any unlabelled field a name.
function a11yLabels() {
  document.querySelectorAll('label:not([for])').forEach(l => {
    if (l.querySelector('input,select,textarea')) return;
    let n = l.nextElementSibling, ctl = null;
    while (n && !ctl) {
      if (n.tagName === 'LABEL') break;                       // the next label starts another field
      const c = n.matches('input:not([type=hidden]),select,textarea') ? n : n.querySelector('input:not([type=hidden]),select,textarea');
      if (c && !c.closest('label')) ctl = c;
      n = n.nextElementSibling;
    }
    if (ctl && ctl.id && !document.querySelector('label[for="' + CSS.escape(ctl.id) + '"]')) l.setAttribute('for', ctl.id);
  });
  document.querySelectorAll('input:not([type=hidden]),select,textarea').forEach(c => {
    if (c.getAttribute('aria-label') || c.getAttribute('aria-labelledby') || c.title || (c.labels && c.labels.length)) return;
    let name = c.getAttribute('placeholder') || '';
    if (!name) { const f = c.closest('.field'); const l = f && f.querySelector('label'); name = l ? l.textContent.trim() : ''; }
    if (name) c.setAttribute('aria-label', name.slice(0, 80));
  });
}
// 2. Anything clickable that is not a real button becomes keyboard-reachable.
function a11yClickables() {
  document.querySelectorAll('[onclick]').forEach(e => {
    if (/^(BUTTON|A|INPUT|SELECT|TEXTAREA|SUMMARY|LABEL)$/.test(e.tagName) || e.id === 'modal-overlay' || e.getAttribute('role') || e.hasAttribute('tabindex')) return;
    e.setAttribute('role', 'button'); e.setAttribute('tabindex', '0');
  });
}
document.addEventListener('keydown', e => {
  const t = e.target;
  if ((e.key === 'Enter' || e.key === ' ') && t && t.getAttribute && t.getAttribute('role') === 'button' && !/^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) { e.preventDefault(); t.click(); }
});
// 3. State for assistive tech: open/closed sections, section-complete marks, current tab.
function a11yState() {
  document.querySelectorAll('.card').forEach(c => { const h = c.querySelector(':scope > .card-header'); if (h) h.setAttribute('aria-expanded', c.classList.contains('open') ? 'true' : 'false'); });
  document.querySelectorAll('.complete-dot').forEach(d => { d.setAttribute('role', 'img'); d.setAttribute('aria-label', d.classList.contains('done') ? 'Section complete' : 'Section not complete yet'); });
  document.querySelectorAll('.tab-btn').forEach(b => { if (b.classList.contains('active')) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
}
function a11yAll() { try { a11yLabels(); a11yClickables(); a11yState(); } catch (e) {} }
let a11yTimer = null;
function a11yQueue() { clearTimeout(a11yTimer); a11yTimer = setTimeout(a11yAll, 100); }
a11yAll();
new MutationObserver(a11yQueue).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
// 4. Dialogs: name them, move focus in, keep Tab inside, close on Esc, give focus back afterwards.
let a11yOpener = null, a11yModalOpen = false;
function a11yFocusables(root) {
  return [...root.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(e => !e.disabled && e.offsetParent !== null && e.type !== 'hidden');
}
function a11yModalSync() {
  const ov = document.getElementById('modal-overlay'), c = document.getElementById('modal-content'); if (!ov || !c) return;
  const open = ov.style.display !== 'none' && ov.style.display !== '';
  const bg = ['app-header', 'app-main', 'fab-new-intake'].map(id => document.getElementById(id)).filter(Boolean);
  if (open) {
    if (!a11yModalOpen) { a11yOpener = document.activeElement; a11yModalOpen = true; }
    c.setAttribute('role', 'dialog'); c.setAttribute('aria-modal', 'true'); c.setAttribute('tabindex', '-1');
    const h = c.querySelector('h3'); if (h) { h.id = 'modal-title'; c.setAttribute('aria-labelledby', 'modal-title'); }
    bg.forEach(e => e.setAttribute('inert', ''));
    if (!c.contains(document.activeElement)) { const f = a11yFocusables(c); (f[0] || c).focus(); }
  } else if (a11yModalOpen) {
    a11yModalOpen = false; bg.forEach(e => e.removeAttribute('inert'));
    const o = a11yOpener; a11yOpener = null;
    if (o && document.contains(o) && o.focus && o.offsetParent !== null) { try { o.focus(); } catch (e) {} }
  }
}
(function () {
  const ov = document.getElementById('modal-overlay'), c = document.getElementById('modal-content'); if (!ov || !c) return;
  new MutationObserver(a11yModalSync).observe(ov, { attributes: true, attributeFilter: ['style'] });
  new MutationObserver(a11yModalSync).observe(c, { childList: true });
})();
document.addEventListener('keydown', e => {
  if (!a11yModalOpen) return;
  const c = document.getElementById('modal-content');
  if (e.key === 'Escape' && !e.defaultPrevented) { e.preventDefault(); closeModal(); return; }
  if (e.key === 'Tab' && c) {
    const f = a11yFocusables(c); if (!f.length) { e.preventDefault(); c.focus(); return; }
    const first = f[0], last = f[f.length - 1];
    if (!c.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
