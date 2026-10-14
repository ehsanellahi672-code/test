/* pickers.js - Search pickers, favourites and recents (stored in prefs). */
'use strict';

/* ============================================================
   SEARCH PICKERS, FAVOURITES, RECENT ITEMS, TEMPLATES   (Prompt 8)
   The original <select> lists stay in the page (hidden) and keep working; the picker sits on top of them.
   Preferences live in localStorage 'historyosis_prefs': { fav:{list:[..]}, recent:{list:[..]}, tpl:[ my templates ] }
   ============================================================ */
const PREFS_KEY = 'historyosis_prefs';
const PICKER_KEYS = ['pc', 'ros', 'comorbid', 'fh', 'invest', 'treat'];
let prefsMem = null;
function cleanStrList(a, max) { return Array.isArray(a) ? a.filter(x => typeof x === 'string' && x && x.length <= 200).slice(0, max) : []; }
function cleanTemplate(t) {
  if (!t || typeof t !== 'object' || Array.isArray(t)) return null;
  const name = typeof t.name === 'string' ? t.name.trim().slice(0, 60) : '';
  const pairs = a => (Array.isArray(a) ? a : []).map(x => typeof x === 'string' ? { name: x, category: '' } : (x && typeof x.name === 'string' ? { name: x.name, category: typeof x.category === 'string' ? x.category : '' } : null)).filter(x => x && x.name && x.name.length <= 200).slice(0, 60);
  const out = { id: typeof t.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(t.id) ? t.id : ('u-' + Math.random().toString(36).slice(2, 9)),
    name, complaints: cleanStrList(t.complaints, 20), exam: cleanStrList(t.exam, 20), investigations: pairs(t.investigations), treatments: pairs(t.treatments) };
  if (!name || !(out.complaints.length || out.exam.length || out.investigations.length || out.treatments.length)) return null;
  return out;
}
function loadPrefs() {
  if (prefsMem) return prefsMem;
  const p = { fav: {}, recent: {}, tpl: [] };
  PICKER_KEYS.forEach(k => { p.fav[k] = []; p.recent[k] = []; });
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      PICKER_KEYS.forEach(k => { if (raw.fav && typeof raw.fav === 'object') p.fav[k] = cleanStrList(raw.fav[k], 200); if (raw.recent && typeof raw.recent === 'object') p.recent[k] = cleanStrList(raw.recent[k], 10); });
      p.tpl = (Array.isArray(raw.tpl) ? raw.tpl : []).map(cleanTemplate).filter(Boolean).slice(0, 30);
    }
  } catch (e) {}
  prefsMem = p; return p;
}
function savePrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(loadPrefs())); } catch (e) {} }
/* ---- search ---- */
function pkNorm(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/ae/g, 'e').replace(/oe/g, 'e')            // oedema = edema, haem = hem, anaemia = anemia
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
function pkMatch(label, tokens) {                       // -1 = no match, 0 = every word starts a word, 1 = inside a word
  const n = pkNorm(label), words = n.split(' '); let rank = 0;
  for (const t of tokens) {
    if (words.some(w => w.startsWith(t))) continue;
    if (n.includes(t)) { rank = 1; continue; }
    return -1;
  }
  return rank;
}
function pkSelItems(id) {
  const sel = document.getElementById(id), out = [];
  if (!sel) return out;
  sel.querySelectorAll('option').forEach(o => { if (!o.value) return; out.push({ value: o.value, label: o.textContent, group: o.parentElement && o.parentElement.tagName === 'OPTGROUP' ? o.parentElement.label : '' }); });
  return out;
}
function pkPoolItems(pool, catId) {
  const cat = document.getElementById(catId).value, out = [];
  Object.keys(pool || {}).forEach(c => { if (cat && c !== cat) return; (pool[c] || []).forEach(n => out.push({ value: n, label: n, group: c, cat: c })); });
  return out;
}
const PICKERS = {
  pc:       { selId: 'pc-dropdown',       label: 'complaint',     eg: 'chest',   items: () => pkSelItems('pc-dropdown'),       pick: it => { document.getElementById('pc-dropdown').value = it.value; addPC(); },                 fallback: () => addPC() },
  ros:      { selId: 'ros-dropdown',      label: 'symptom',       eg: 'cough',   items: () => pkSelItems('ros-dropdown'),      pick: it => { document.getElementById('ros-dropdown').value = it.value; addROS(); },               fallback: () => addROS() },
  comorbid: { selId: 'comorbid-dropdown', label: 'comorbidity',   eg: 'diab',    items: () => pkSelItems('comorbid-dropdown'), pick: it => { document.getElementById('comorbid-dropdown').value = it.value; addComorbidity(); },   fallback: () => addComorbidity() },
  fh:       { selId: 'fh-dropdown',       label: 'condition',     eg: 'cancer',  items: () => pkSelItems('fh-dropdown'),       pick: it => { document.getElementById('fh-dropdown').value = it.value; addFH(); },                 fallback: () => addFH() },
  invest:   { selId: 'invest-dropdown',   label: 'investigation', eg: 'troponin', items: () => pkPoolItems(medicalDataPools.investigations, 'invest-category'), pick: it => addInvestigation(it.value, it.cat || document.getElementById('invest-category').value), fallback: () => addInvestigation() },
  treat:    { selId: 'treatment-dropdown', label: 'treatment',    eg: 'fluid',   items: () => pkPoolItems(medicalDataPools.treatments, 'treatment-category-filter'),  pick: it => addTreatment(it.value, it.cat || document.getElementById('treatment-category-filter').value), fallback: () => addTreatment() }
};
const pkState = {};
function pkRecord(key, value) {
  const r = loadPrefs().recent[key].filter(v => v !== value); r.unshift(value); loadPrefs().recent[key] = r.slice(0, 10); savePrefs();
}
function pkToggleFav(key, value) {
  const f = loadPrefs().fav[key], at = f.indexOf(value);
  if (at >= 0) f.splice(at, 1); else f.unshift(value);
  savePrefs();
}
function pkCompute(st) {
  const tokens = pkNorm(st.input.value).split(' ').filter(Boolean);
  const prefs = loadPrefs(), fav = prefs.fav[st.key], rec = prefs.recent[st.key];
  const seen = new Map(); st.def.items().forEach(i => { if (!seen.has(i.value)) seen.set(i.value, i); });
  const scored = []; seen.forEach(it => { const r = tokens.length ? pkMatch(it.label, tokens) : 0; if (r >= 0) scored.push({ it, r }); });
  const favs = scored.filter(x => fav.includes(x.it.value)).sort((a, b) => a.r - b.r || fav.indexOf(a.it.value) - fav.indexOf(b.it.value));
  const recs = scored.filter(x => !fav.includes(x.it.value) && rec.includes(x.it.value)).sort((a, b) => a.r - b.r || rec.indexOf(a.it.value) - rec.indexOf(b.it.value));
  const rest = scored.filter(x => !fav.includes(x.it.value) && !rec.includes(x.it.value)).sort((a, b) => a.r - b.r);   // stable: keeps data order
  return { tokens, sections: [['★ Favourites', favs], ['Recent', recs], [tokens.length ? 'Matches' : 'All', rest]].filter(x => x[1].length) };
}
function pkRender(st) {
  const prefs = loadPrefs(), fav = prefs.fav[st.key], top = st.list.scrollTop;
  const c = pkCompute(st); st.results = []; let html = '';
  c.sections.forEach(([head, arr]) => {
    html += `<div class="picker-head" role="presentation">${escH(head)}</div>`;
    arr.forEach(x => {
      const n = st.results.length; st.results.push(x.it); const on = fav.includes(x.it.value);
      html += `<div class="picker-row" role="presentation"><div class="picker-item" role="option" id="pk-${st.key}-${n}" data-i="${n}" aria-selected="false"><span class="picker-label">${escH(x.it.label)}</span>${x.it.group ? `<span class="picker-tag">${escH(x.it.group)}</span>` : ''}</div><button type="button" class="picker-star${on ? ' on' : ''}" data-i="${n}" aria-pressed="${on}" aria-label="${on ? 'Remove from favourites' : 'Add to favourites'}: ${escH(x.it.label)}">${on ? '★' : '☆'}</button></div>`;
    });
  });
  if (!st.results.length) html = `<div class="picker-empty" role="presentation">${c.tokens.length ? 'No match. Try fewer letters' + (st.key === 'pc' ? ', or use the custom box.' : '.') : 'Nothing to show.'}</div>`;
  st.list.innerHTML = html; st.list.scrollTop = top;
  st.active = st.results.length && c.tokens.length ? 0 : -1; pkMark(st);
}
function pkMark(st) {
  st.list.querySelectorAll('.picker-item').forEach(el => { const on = +el.dataset.i === st.active; el.classList.toggle('act', on); el.setAttribute('aria-selected', on ? 'true' : 'false'); });
  const cur = st.active >= 0 ? document.getElementById('pk-' + st.key + '-' + st.active) : null;
  if (cur) { st.input.setAttribute('aria-activedescendant', cur.id); cur.scrollIntoView({ block: 'nearest' }); } else st.input.removeAttribute('aria-activedescendant');
}
function pkOpen(st) { if (!st.open) { st.open = true; st.list.hidden = false; st.input.setAttribute('aria-expanded', 'true'); } pkRender(st); }
function pkClose(st) { st.open = false; st.list.hidden = true; st.input.setAttribute('aria-expanded', 'false'); st.input.removeAttribute('aria-activedescendant'); }
function pkPick(st, it) {
  if (!it) return;
  pkRecord(st.key, it.value); st.input.value = ''; pkClose(st); st.input.blur();
  st.def.pick(it);
}
function buildPicker(key) {
  const def = PICKERS[key], sel = document.getElementById(def.selId);
  if (!sel || document.getElementById('pk-' + key)) return;
  const box = document.createElement('div'); box.className = 'picker'; box.id = 'pk-' + key;
  box.innerHTML = `<input type="text" class="picker-input" id="pk-in-${key}" role="combobox" aria-expanded="false" aria-controls="pk-list-${key}" aria-autocomplete="list" aria-label="Search ${def.label}" placeholder="Search ${def.label}, e.g. ${def.eg}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="search"><div class="picker-list" id="pk-list-${key}" role="listbox" aria-label="${def.label} list" hidden></div>`;
  sel.style.display = 'none'; sel.setAttribute('aria-hidden', 'true'); sel.tabIndex = -1;
  (sel.closest('.field') || sel.parentElement).appendChild(box);
  const st = { key, def, box, input: box.querySelector('input'), list: box.querySelector('.picker-list'), open: false, results: [], active: -1 };
  pkState[key] = st;
  st.input.addEventListener('focus', () => pkOpen(st));
  st.input.addEventListener('click', () => { if (!st.open) pkOpen(st); });
  st.input.addEventListener('input', () => pkOpen(st));
  st.input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!st.open) pkOpen(st); if (st.results.length) { st.active = (st.active + 1) % st.results.length; pkMark(st); } }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (!st.open) pkOpen(st); if (st.results.length) { st.active = st.active <= 0 ? st.results.length - 1 : st.active - 1; pkMark(st); } }
    else if (e.key === 'Enter') { e.preventDefault(); if (!st.open) pkOpen(st); const it = st.results[st.active >= 0 ? st.active : 0]; if (it && (st.active >= 0 || st.input.value.trim())) pkPick(st, it); }
    else if (e.key === 'Escape') { if (st.open) { e.preventDefault(); pkClose(st); } }
    else if (e.key === 'Tab') pkClose(st);
  });
  st.list.addEventListener('click', e => {
    const star = e.target.closest('.picker-star');
    if (star) { const it = st.results[+star.dataset.i]; if (it) { pkToggleFav(key, it.value); pkRender(st); } return; }
    const row = e.target.closest('.picker-item'); if (row) pkPick(st, st.results[+row.dataset.i]);
  });
}
function initPickers() {
  PICKER_KEYS.forEach(buildPicker);
  document.addEventListener('click', e => { Object.keys(pkState).forEach(k => { const st = pkState[k]; if (st.open && !st.box.contains(e.target)) pkClose(st); }); }, true);   // on click (not pointerdown) so closing the list never moves a button out from under the finger
  ['invest-category', 'treatment-category-filter'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('change', () => { const st = pkState[id === 'invest-category' ? 'invest' : 'treat']; if (st && st.open) pkRender(st); }); });
}
/* the "+ Add" button next to a picker: adds the top match of what is typed (or falls back to the old behaviour, e.g. the custom complaint box) */
function pickerAdd(key) {
  const st = pkState[key];
  if (!st) { PICKERS[key].fallback(); return; }
  if (st.input.value.trim()) {
    pkRender(st);
    if (st.results.length) { pkPick(st, st.results[0]); return; }
    if (key === 'pc' && document.getElementById('pc-custom-input').value.trim()) { PICKERS.pc.fallback(); return; }
    showToast('No match found.', 'warning'); return;
  }
  if (key === 'pc') { PICKERS.pc.fallback(); return; }
  showToast('Type to search, then tap an item.', 'error');
}
