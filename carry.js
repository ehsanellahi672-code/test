/* carry.js - Carry-forward from an earlier record of the same patient. */
'use strict';

/* ============================================================
   CARRY HISTORY FORWARD + RICHER PROGRESS NOTES   (Prompt 9)
   carryState (saved on the record as carriedForward):
     { fromId, fromDate, sections:{pmh,comorbid,fh,sh,drugs,allergies : true}, ack:{drugs:bool, allergies:bool} }
   Progress note payload (type 'SOAP') may now also hold  vitals:{bp,pulse,rr,spo2,temp,o2,consciousness,spo2Scale2,news2,news2Band,news2Partial}  and  problems:[text]
   ============================================================ */
const CF_NAMES = { pmh: 'past history', comorbid: 'comorbidities', fh: 'family history', sh: 'social history', drugs: 'drug history', allergies: 'allergies' };
const CF_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDMY(iso) { const d = new Date(iso); if (isNaN(d.getTime())) return ''; return String(d.getDate()).padStart(2, '0') + ' ' + CF_MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }
function normMR(x) { return String(x == null ? '' : x).trim().toLowerCase().replace(/\s+/g, ''); }
function cleanCarryState(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return null;
  const sec = {}; Object.keys(CF_NAMES).forEach(k => { if (c.sections && c.sections[k] === true) sec[k] = true; });
  if (!Object.keys(sec).length) return null;
  return { fromId: typeof c.fromId === 'string' ? c.fromId.slice(0, 80) : '', fromDate: typeof c.fromDate === 'string' ? c.fromDate.slice(0, 40) : '', sections: sec,
    ack: { drugs: !!(c.ack && c.ack.drugs === true), allergies: !!(c.ack && c.ack.allergies === true) } };
}
function restoreCarryState(c) { carryState = cleanCarryState(c); renderCarryMarks(); updateAllergyAndChecklist(); }
function renderCarryMarks() {
  const date = carryState ? fmtDMY(carryState.fromDate) : '';
  ['pmh', 'comorbid', 'fh', 'sh'].forEach(k => {
    const el = document.getElementById('cf-mark-' + k); if (!el) return;
    const on = !!(carryState && carryState.sections[k]);
    el.hidden = !on;
    el.innerHTML = on ? `<span>Carried forward from ${escH(date || 'an earlier record')}. Edit anything that has changed.</span><button type="button" aria-label="Hide this note" onclick="dismissCarryMark('${k}')">✕</button>` : '';
  });
  ['drugs', 'allergies'].forEach(k => {
    const el = document.getElementById('cf-ack-' + k); if (!el) return;
    const on = !!(carryState && carryState.sections[k]);
    el.hidden = !on;
    if (!on) { el.innerHTML = ''; return; }
    const ok = !!carryState.ack[k];
    el.className = 'cf-ack' + (ok ? '' : ' pending');
    el.innerHTML = `<span class="cf-badge">Carried forward from ${escH(date || 'an earlier record')}</span><label class="cf-chk"><input type="checkbox" id="cf-chk-${k}" ${ok ? 'checked' : ''} onchange="cfAck('${k}',this.checked)"> Confirm still correct</label>`;
  });
}
function dismissCarryMark(k) { if (carryState) { delete carryState.sections[k]; if (!Object.keys(carryState.sections).length) carryState = null; renderCarryMarks(); updateAllergyAndChecklist(); triggerAutoSave(); } }
function cfAck(k, on) { if (carryState && carryState.sections[k]) { carryState.ack[k] = !!on; renderCarryMarks(); updateAllergyAndChecklist(); triggerAutoSave(); } }
function carryAckItems() {
  const out = []; if (!carryState) return out;
  const val = id => ((document.getElementById(id) || {}).value || '').trim();
  [['allergies', 'pmh-allergies', 'allergies'], ['drugs', 'pmh-drugs', 'medicines']].forEach(([k, fid, word]) => {
    if (carryState.sections[k] && val(fid)) out.push({ label: 'Carried-forward ' + word + ' confirmed', ok: !!carryState.ack[k], card: 'sec-history', field: 'cf-chk-' + k });
  });
  return out;
}
function carryParts(r) {
  const c = cleanCarryState(r && r.carriedForward); if (!c) return null;
  const names = Object.keys(CF_NAMES).filter(k => c.sections[k]).map(k => CF_NAMES[k]);
  const pend = [];
  if (c.sections.allergies && !c.ack.allergies) pend.push('allergies'); if (c.sections.drugs && !c.ack.drugs) pend.push('medicines');
  const done = [];
  if (c.sections.allergies && c.ack.allergies) done.push('allergies'); if (c.sections.drugs && c.ack.drugs) done.push('medicines');
  let t = 'History carried forward from ' + (fmtDMY(c.fromDate) || 'an earlier record') + ' (' + names.join(', ') + ').';
  if (done.length) t += ' Confirmed still correct: ' + done.join(' and ') + '.';
  if (pend.length) t += ' NOT yet confirmed: ' + pend.join(' and ') + '.';
  return { text: t, pending: pend.length > 0 };
}
function carryLineHTML(r) { const c = carryParts(r); return c ? `<div class="summary-row" style="margin-top:4px;font-size:0.8rem;${c.pending ? 'color:var(--danger);font-weight:600' : 'color:var(--text-secondary)'}"><em>${escH(c.text)}</em></div>` : ''; }
function carryLinePrint(r) { const c = carryParts(r); return c ? `<div style="font-size:0.85em;margin-top:4px;${c.pending ? 'font-weight:bold' : ''}"><em>${escH(c.text)}</em></div>` : ''; }
function carryLineText(r) { const c = carryParts(r); return c ? c.text + '\n' : ''; }
/* ---- offer to load from an earlier record with the same MR number ---- */
let cfTimer = null, cfDismissed = '', cfCandidate = null;
function hideCarryOffer() { const b = document.getElementById('cf-offer'); if (b) { b.hidden = true; b.innerHTML = ''; } cfCandidate = null; }
function scheduleCarryCheck() { clearTimeout(cfTimer); cfTimer = setTimeout(checkCarryOffer, 350); }
async function checkCarryOffer() {
  const box = document.getElementById('cf-offer'); const mrEl = document.getElementById('d-mrno'); if (!box || !mrEl) return;
  const mr = normMR(mrEl.value);
  if (mr.length < 2) { hideCarryOffer(); return; }
  let recs = []; try { recs = await dbGetAll(); } catch (e) { hideCarryOffer(); return; }
  if (normMR(mrEl.value) !== mr) return;                    // typed on while we were reading
  const cands = recs.filter(r => r && !r.deletedAt && r.id !== editingRecordId && r.demographics && normMR(r.demographics.mrno) === mr)
    .sort((a, b) => String(b.savedAt || '').localeCompare(String(a.savedAt || '')));
  if (cfDismissed && cfDismissed !== mr) cfDismissed = '';
  if (!cands.length || cfDismissed === mr) { hideCarryOffer(); return; }
  const c = cands[0]; cfCandidate = c.id;
  const date = fmtDMY(c.savedAt) || fmtDMY(c.demographics.dateAdmission) || 'earlier';
  const nm = x => String(x || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const nowName = nm((document.getElementById('d-name') || {}).value), oldName = nm(c.demographics.name);
  const warn = nowName && oldName && nowName !== oldName ? '<div class="cf-warn">The name on that record is different. Check the MR number before loading.</div>' : '';
  box.innerHTML = `<div class="cf-msg">A saved record with this MR number exists (${escH(date)}${cands.length > 1 ? ', ' + (cands.length - 1) + ' older' : ''}).</div><button type="button" class="btn btn-primary btn-sm" onclick="confirmLoadPrevious()">Load history from previous record (${escH(date)})</button><button type="button" class="btn btn-secondary btn-sm" onclick="dismissCarryOffer()">Not now</button>${warn}`;
  box.hidden = false;
}
function dismissCarryOffer() { cfDismissed = normMR((document.getElementById('d-mrno') || {}).value); hideCarryOffer(); }
function carrySourceSummary(rec) {
  const h = rec.history || {}, sh = h.sh || {}, t = v => String(v == null ? '' : v).trim();
  const list = [];
  if (t(h.pmhMedical) || t(h.pmhSurgical) || t(h.pmhCustom) || t(h.pmhImmunisation)) list.push('past medical and surgical history, immunisation');
  if (t(h.pmhDrugs)) list.push('drug history');
  if (t(h.pmhAllergies)) list.push('allergies');
  if ((h.comorbidItems || []).length || t(h.comorbidNarrative)) list.push('comorbidities');
  if ((h.fhSelected || []).length || t(h.fhNarrative) || t(h.fhCustom)) list.push('family history');
  if (Object.keys(sh).some(k => t(sh[k]))) list.push('social history');
  return list;
}
async function confirmLoadPrevious() {
  let rec; try { rec = (await dbGetAll()).find(r => r.id === cfCandidate); } catch (e) { rec = null; }
  if (!rec) { showToast('That record is no longer available.', 'error'); hideCarryOffer(); return; }
  const list = carrySourceSummary(rec);
  if (!list.length) { showToast('The earlier record has no history to carry forward.', 'warning'); return; }
  const date = fmtDMY(rec.savedAt) || 'an earlier date';
  showModal('Load history from previous record', `Copies from the record saved on <strong>${escH(date)}</strong>: ${escH(list.join(', '))}.<br>It does <strong>not</strong> copy today's complaint, vitals, examination, investigations or plan. Fields that already have text are left as they are. Allergies and medicines must be confirmed again.`, () => { closeModal(); applyCarryForward(rec); }, null, 'Load history');
}
function applyCarryForward(rec) {
  const h = rec.history || {}, shx = h.sh || {}, text = v => (typeof v === 'string' ? v : '').trim();
  const sections = {}, skipped = [];
  const el = id => document.getElementById(id);
  const fire = (e, ev) => e.dispatchEvent(new Event(ev, { bubbles: true }));
  const fill = (id, val) => { const e = el(id); if (!e) return false; const v = text(val); if (!v) return false; if (e.value.trim()) { skipped.push(id); return false; } e.value = v; if (e.value !== v) { e.value = ''; return false; } fire(e, 'input'); fire(e, 'change'); return true; };
  let any;
  any = [fill('pmh-medical', h.pmhMedical), fill('pmh-surgical', h.pmhSurgical), fill('pmh-custom', h.pmhCustom), fill('pmh-immunisation', h.pmhImmunisation)].some(Boolean); if (any) sections.pmh = true;
  if (fill('pmh-drugs', h.pmhDrugs)) sections.drugs = true;
  if (fill('pmh-allergies', h.pmhAllergies)) sections.allergies = true;
  // comorbidities: add the ones that are missing
  let cAdded = false; (Array.isArray(h.comorbidItems) ? h.comorbidItems : []).forEach(x => { if (typeof x === 'string' && x && !comorbidItems.includes(x)) { comorbidItems.push(x); cAdded = true; } });
  if (cAdded) renderComorbidItems();
  const cn = fill('comorbid-narrative', h.comorbidNarrative); if (cAdded || cn) sections.comorbid = true;
  let fAdded = false; (Array.isArray(h.fhSelected) ? h.fhSelected : []).forEach(x => { if (typeof x === 'string' && x && !fhItems.includes(x)) { fhItems.push(x); fAdded = true; } });
  if (fAdded) renderFHItems();
  const f2 = [fill('fh-narrative', h.fhNarrative), fill('fh-custom', h.fhCustom)].some(Boolean); if (fAdded || f2) sections.fh = true;
  any = ['smoking', 'alcohol', 'drugs', 'diet', 'exercise'].map(k => fill('sh-' + k, shx[k])).concat([fill('sh-smoking-detail', shx.smokingDetail), fill('sh-travel', shx.travel), fill('sh-living', shx.living), fill('sh-adl', shx.adl), fill('sh-custom', shx.custom)]).some(Boolean); if (any) sections.sh = true;
  if (!Object.keys(sections).length) { hideCarryOffer(); showToast('Nothing was copied: those fields already have text.', 'warning'); return; }
  const prev = carryState && carryState.sections ? carryState : null;
  carryState = { fromId: rec.id, fromDate: rec.savedAt || (rec.demographics && rec.demographics.dateAdmission) || '', sections: Object.assign({}, prev ? prev.sections : {}, sections), ack: { drugs: prev && !sections.drugs ? !!prev.ack.drugs : false, allergies: prev && !sections.allergies ? !!prev.ack.allergies : false } };
  hideCarryOffer(); renderCarryMarks(); updateProgress(); updateAllergyAndChecklist(); triggerAutoSave();
  const need = [sections.allergies ? 'allergies' : '', sections.drugs ? 'medicines' : ''].filter(Boolean);
  showToast(need.length ? 'History loaded · confirm ' + need.join(' & ') : 'History loaded', 'success');
}
document.addEventListener('input', e => { if (e.target && e.target.id === 'd-mrno') scheduleCarryCheck(); });
document.addEventListener('change', e => { if (e.target && e.target.id === 'd-mrno') scheduleCarryCheck(); });
