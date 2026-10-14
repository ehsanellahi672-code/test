/* search.js - Record status, tags, search and filters. */
'use strict';

/* ============================================================
   PROMPT 11: RECORD SEARCH / FILTERS, TAGS + STATUS, VERSION HISTORY, CASE LOG
   Record fields added (all optional):  tags:[text]  status:'Draft'|'Complete'|'Discharged'  credentials.supervisor
   IndexedDB 'versions' store (DB v2): { vid, rid, at, rec }  rec = the saved record without progressNotes / deletedAt / savedAt.
   At most VER_MAX (10) versions are kept per record; they are removed when the record is deleted for good.
   ============================================================ */
const REC_STATUSES = ['Draft', 'Complete', 'Discharged'];
function recStatusOf(r) { return r && REC_STATUSES.includes(r.status) ? r.status : ''; }
function recCleanTags(list) {
  const out = [], seen = new Set();
  (Array.isArray(list) ? list : []).forEach(t => {
    if (typeof t !== 'string') return;
    const c = t.replace(/[\u0000-\u001f,]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 30);
    if (c && !seen.has(c.toLowerCase()) && out.length < 12) { seen.add(c.toLowerCase()); out.push(c); }
  });
  return out;
}
function recTagsOf(r) { return recCleanTags(r && r.tags); }
function recTagsForSave() { const el = document.getElementById('d-tag-input'); return recCleanTags(recTags.concat(el && el.value ? el.value.split(',') : [])); }
function renderTagChips() {
  const box = document.getElementById('d-tags'); if (!box) return;
  box.innerHTML = recTags.map((t, i) => `<span class="rtag">${escH(t)}<button type="button" aria-label="Remove tag ${escH(t)}" onclick="tagRemove(${i})">✕</button></span>`).join('');
}
function tagAdd(raw) {
  const before = recTags.length; recTags = recCleanTags(recTags.concat(String(raw || '').split(',')));
  renderTagChips(); if (recTags.length !== before && typeof triggerAutoSave === 'function') triggerAutoSave();
}
function tagRemove(i) { recTags.splice(i, 1); renderTagChips(); if (typeof triggerAutoSave === 'function') triggerAutoSave(); }
document.addEventListener('keydown', e => {
  if (e.target && e.target.id === 'd-tag-input' && (e.key === 'Enter' || e.key === ',')) { e.preventDefault(); tagAdd(e.target.value); e.target.value = ''; }
});
document.addEventListener('change', e => { if (e.target && e.target.id === 'd-tag-input' && e.target.value) { tagAdd(e.target.value); e.target.value = ''; } });
function recChipsHTML(r) {
  const st = recStatusOf(r), tg = recTagsOf(r); if (!st && !tg.length) return '';
  return `<div class="chip-row">${st ? `<span class="rstat ${st}">${st}</span>` : ''}${tg.map(t => `<span class="rtag">${escH(t)}</span>`).join('')}</div>`;
}
/* ---------- search, filter, sort ---------- */
let recSearchTimer = null;
function recSearchInput() { clearTimeout(recSearchTimer); recSearchTimer = setTimeout(renderRecords, 180); }
function recTogglePanel() {
  const p = document.getElementById('rf-panel'), b = document.getElementById('rf-toggle'); if (!p || !b) return;
  p.hidden = !p.hidden; b.setAttribute('aria-expanded', p.hidden ? 'false' : 'true');
}
function recClearFilters() {
  ['rf-from', 'rf-to', 'rf-dept', 'rf-sex', 'rf-band', 'rf-tag', 'rf-status', 'search-records'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
  const so = document.getElementById('rf-sort'); if (so) so.value = 'new';
  renderRecords();
}
function recIsoLocal(t) { return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); }
function recDateOf(r) {
  const d = (r && r.demographics) || {};
  if (/^\d{4}-\d{2}-\d{2}$/.test(d.dateAdmission || '')) return d.dateAdmission;
  const t = new Date(r && r.savedAt); return isNaN(t) ? '' : recIsoLocal(t);
}
function recAgeYears(d) { const a = parseFloat(d && d.age); if (!isFinite(a) || a < 0) return null; return d.ageUnit === 'months' ? a / 12 : d.ageUnit === 'days' ? a / 365 : a; }
function recBandOf(y) { return y == null ? '' : y < 1 ? 'u1' : y < 12 ? '1-11' : y < 18 ? '12-17' : y < 40 ? '18-39' : y < 65 ? '40-64' : '65'; }
function recPlaces(r) { const d = r.demographics || {}, c = r.credentials || {}; return [d.dept, c.ward].filter(v => typeof v === 'string' && v.trim()).map(v => v.trim()); }
function recFillSelect(id, vals, anyLabel) {
  const el = document.getElementById(id); if (!el) return;
  const key = vals.join('\u0001'); if (el.dataset.k === key) return;
  const cur = el.value; el.dataset.k = key;
  el.innerHTML = `<option value="">${anyLabel}</option>` + vals.map(v => `<option value="${escH(v)}">${escH(v)}</option>`).join('');
  el.value = vals.includes(cur) ? cur : '';
}
function recSyncControls(active) {
  const uniq = list => { const seen = new Map(); list.forEach(v => { if (!seen.has(v.toLowerCase())) seen.set(v.toLowerCase(), v); }); return [...seen.values()].sort((a, b) => a.localeCompare(b)); };
  recFillSelect('rf-dept', uniq(active.flatMap(recPlaces)), 'Any');
  const tags = uniq(active.flatMap(recTagsOf));
  recFillSelect('rf-tag', tags, 'Any');
  const dl = document.getElementById('tag-suggest'); if (dl) dl.innerHTML = tags.map(t => `<option value="${escH(t)}">`).join('');
  const f = recFilters(), n = ['from', 'to', 'dept', 'sex', 'band', 'tag', 'status'].filter(k => f[k]).length;
  const b = document.getElementById('rf-toggle'); if (b) b.textContent = n ? `Filters (${n})` : 'Filters';
}
function recFilters() {
  const v = id => { const e = document.getElementById(id); return e ? e.value : ''; };
  return { from: v('rf-from'), to: v('rf-to'), dept: v('rf-dept'), sex: v('rf-sex'), band: v('rf-band'), tag: v('rf-tag'), status: v('rf-status'), sort: v('rf-sort') || 'new' };
}
function recFilterSort(list, search) {
  const f = recFilters();
  let out = list.filter(r => {
    const d = r.demographics || {};
    if (search && !recordMatchesSearch(r, search)) return false;
    if (f.from || f.to) { const dt = recDateOf(r); if (!dt || (f.from && dt < f.from) || (f.to && dt > f.to)) return false; }
    if (f.dept && !recPlaces(r).some(p => p.toLowerCase() === f.dept.toLowerCase())) return false;
    if (f.sex && d.sex !== f.sex) return false;
    if (f.band && recBandOf(recAgeYears(d)) !== f.band) return false;
    if (f.tag && !recTagsOf(r).some(t => t.toLowerCase() === f.tag.toLowerCase())) return false;
    if (f.status === 'none' ? recStatusOf(r) : (f.status && recStatusOf(r) !== f.status)) return false;
    return true;
  });
  const nm = r => String((r.demographics || {}).name || '').toLowerCase();
  const bed = r => String((r.demographics || {}).bedno || '').trim();
  const t = r => new Date(r.savedAt).getTime() || 0;
  if (f.sort === 'old') out = out.slice().sort((a, b) => t(a) - t(b));
  else if (f.sort === 'name') out = out.slice().sort((a, b) => nm(a).localeCompare(nm(b)));
  else if (f.sort === 'bed') out = out.slice().sort((a, b) => (!bed(a) - !bed(b)) || bed(a).localeCompare(bed(b), undefined, { numeric: true, sensitivity: 'base' }));
  else out = out.slice().sort((a, b) => t(b) - t(a));
  return out;
}
