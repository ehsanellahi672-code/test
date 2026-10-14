/* safety.js - Vitals assessment, checklist, drug-safety checks. */
'use strict';

function updateVitalsAssessment() {
  if (!document.getElementById('vitals-redflags')) return;
  const v = readVitals();
  const labels = { rr: 'RR', spo2: 'SpO₂', bp: 'SBP', pulse: 'Pulse', temp: 'Temp', gcs: 'GCS' };
  const shown = { rr: v.rr === null ? '' : Math.round(v.rr) + '/min', spo2: v.spo2 === null ? '' : Math.round(v.spo2) + '%', bp: v.sbp === null ? '' : String(v.sbp), pulse: v.hr === null ? '' : String(v.hr), temp: v.tempC === null ? '' : v.tempC.toFixed(1) + '°C', gcs: v.gcs === null ? '' : String(v.gcs) };
  const flags = [];
  Object.keys(labels).forEach(k => {
    const el = document.getElementById('vtag-' + k); if (!el) return;
    const t = vitalTag(k, v);
    const field = el.closest('.field');
    if (field) field.classList.toggle('v-crit', !!t && t.cls === 'crit'), field.classList.toggle('v-warn', !!t && t.cls === 'warn');
    if (!t) { el.className = 'vtag'; el.textContent = ''; return; }
    el.className = 'vtag show ' + t.cls; el.textContent = t.text;
    if (t.cls === 'crit') flags.push(labels[k] + ' ' + shown[k]);
  });
  const line = document.getElementById('vitals-redflags');
  if (flags.length) { line.style.display = 'block'; line.textContent = 'Red flags: ' + flags.join(', '); } else { line.style.display = 'none'; line.textContent = ''; }

  const res = document.getElementById('news2-result');
  if (res) {
    const n = news2Compute(v);
    if (!n.entered) { res.className = 'news2-result'; res.textContent = 'Enter vitals to see the NEWS2 score.'; }
    else {
      res.className = 'news2-result ' + n.cls;
      res.innerHTML = `<span class="n2-score">NEWS2 ${n.total}</span> — ${escH(n.band)} risk${n.missing.length ? ' <em>(partial)</em>' : ''}<br>${escH(n.response)}` +
        (n.anyThree && n.total < 7 && n.band !== 'Low-medium' ? '<br><strong>A single parameter scores 3: consider urgent review.</strong>' : '') +
        (n.missing.length ? `<br><span style="font-size:0.8rem">Not yet entered: ${escH(n.missing.join(', '))}. The score may be higher once these are added.</span>` : '');
    }
  }
}
/* Allergy banner + "before you finish" checklist */
function setNKDA() {
  const el = document.getElementById('pmh-allergies'); if (!el) return;
  el.value = 'No known drug allergies (NKDA).';
  el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
  updateAllergyAndChecklist(); showToast('Allergies set to NKDA.', 'success');
}
function reviewChecklistState() {
  const val = id => ((document.getElementById(id) || {}).value || '').trim();
  const vit = ['vs-bp', 'vs-pulse', 'vs-rr', 'vs-spo2', 'vs-temp', 'vs-gcs'].some(id => val(id));
  const items = [
    { label: 'Allergies recorded', ok: !!val('pmh-allergies'), card: 'sec-history', field: 'pmh-allergies' },
    { label: 'Primary diagnosis entered', ok: !!val('dx-primary'), card: 'sec-treatment', field: 'dx-primary' },
    { label: 'At least one vital sign entered', ok: vit, card: 'sec-exam', field: 'vs-bp' }
  ];
  if (typeof isPaediatricForm === 'function' && isPaediatricForm()) items.push({ label: 'Weight recorded (needed for a child)', ok: !!val('vs-weight'), card: 'sec-exam', field: 'vs-weight' });
  const pend = typeof pendingAllergyAcks === 'function' ? pendingAllergyAcks() : [];
  if (pend.length) items.push({ label: 'Drug-allergy alert' + (pend.length > 1 ? 's' : '') + ' reviewed (' + pend.length + ')', ok: false, card: 'sec-treatment', field: 'ack-' + pend[0] });
  carryAckItems().forEach(it => items.push(it));
  return items;
}
function updateAllergyAndChecklist() {
  if (typeof refreshDrugSafety === 'function') refreshDrugSafety();   // also redraws the checklist
  else renderAllergyChecklist();
}
function renderAllergyChecklist() {
  const missing = !((document.getElementById('pmh-allergies') || {}).value || '').trim();
  ['allergy-banner-hist', 'allergy-banner-review'].forEach(id => { const b = document.getElementById(id); if (b) b.style.display = missing ? 'flex' : 'none'; });
  const box = document.getElementById('review-checklist-items'); if (!box) return;
  box.innerHTML = '';
  reviewChecklistState().forEach(it => {
    const b = document.createElement('button'); b.type = 'button';
    b.className = 'rc-item ' + (it.ok ? 'ok' : 'todo');
    b.innerHTML = `<span class="rc-mark" aria-hidden="true">${it.ok ? '✓' : '!'}</span><span>${escH(it.label)}</span>${it.ok ? '' : '<span class="rc-hint">Tap to fix</span>'}`;
    b.setAttribute('aria-label', it.label + (it.ok ? ': done' : ': missing, tap to go to the field'));
    if (!it.ok) b.onclick = () => { const c = document.getElementById(it.card); if (c) c.classList.add('open'); const f = document.getElementById(it.field); if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => f.focus({ preventScroll: true }), 350); } };
    box.appendChild(b);
  });
  if (typeof rvRenderComplete === 'function') rvRenderComplete();
}
const MIRRORED_FIELDS = { 'vs-weight': 'pd-weight', 'pd-weight': 'vs-weight', 'pmh-immunisation': 'pd-immunisation', 'pd-immunisation': 'pmh-immunisation' };
document.addEventListener('input', e => {
  const id = e.target && e.target.id;
  if (id && MIRRORED_FIELDS[id]) {
    const other = document.getElementById(MIRRORED_FIELDS[id]);
    if (other && other.value !== e.target.value) { other.value = e.target.value; if (id === 'pd-weight') other.dispatchEvent(new Event('input', { bubbles: true })); }
    updatePaedsAndPregnancy();
  }
});
document.addEventListener('input', e => { if (e.target && e.target.closest && e.target.closest('#sec-exam, #sec-history, #sec-treatment')) { updateVitalsAssessment(); updateAllergyAndChecklist(); } });
document.addEventListener('change', e => { if (e.target && e.target.closest && e.target.closest('#sec-exam, #sec-history, #sec-treatment')) { updateVitalsAssessment(); updateAllergyAndChecklist(); } });
/* ============================================================
   DRUG SAFETY  (advisory only - never blocks saving)
   Tables live in data.js: drugClasses, classAliases, crossReactive, conditionAliases, cautions
   ============================================================ */
const CONDITION_LABELS = { ckd: 'CKD', peptic_ulcer: 'peptic ulcer / GI bleeding', heart_failure: 'heart failure', asthma: 'asthma', diabetes: 'diabetes', bleeding_history: 'bleeding history', anticoagulant: 'anticoagulant', warfarin: 'warfarin', pregnancy: 'pregnancy' };
const NEGATION_BEFORE = /\b(no|not|non|nil|none|denies|denied|without|tolerat\w*|resolved|outgrown)\b[^,;.()]*$/;
function normText(t) { return String(t == null ? '' : t).toLowerCase().replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim(); }
function termRegex(term) { return new RegExp('(^|[^a-z0-9])(' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?![a-z0-9])'); }
/* Find the terms of a list in free text; a term preceded by "no / not / denies..." in the same phrase does not count. */
function findTerms(rawText, terms) {
  const found = [];
  normText(rawText).split(/[,;.\n\r\/()]+/).forEach(clause => {
    if (!clause.trim()) return;
    terms.forEach(t => {
      const m = termRegex(t.term).exec(clause);
      if (!m) return;
      const before = clause.slice(0, m.index + m[1].length);
      if (NEGATION_BEFORE.test(before)) return;
      if (!found.some(f => f.cls === t.cls)) found.push({ cls: t.cls, term: m[2] });
    });
  });
  return found;
}
let _drugTermCache = null;
function drugTerms() {                                   // [{term, cls}] from classAliases, class names and drug keywords
  if (_drugTermCache) return _drugTermCache;
  const P = medicalDataPools, out = []; const seen = new Set();
  const add = (term, cls) => { term = normText(term); if (term.length < 3 || seen.has(term + '|' + cls)) return; seen.add(term + '|' + cls); out.push({ term, cls }); };
  Object.keys(P.classAliases || {}).forEach(cls => { add(cls, cls); P.classAliases[cls].forEach(a => add(a, cls)); });
  Object.keys(P.drugClasses || {}).forEach(k => { const d = P.drugClasses[k]; if (d) { add(d.cls, d.cls); d.keywords.forEach(w => add(w, d.cls)); } });
  out.sort((a, b) => b.term.length - a.term.length);       // longest first so "co-amoxiclav" wins over "amoxicillin" style overlaps
  return (_drugTermCache = out);
}
function drugInfoFor(item) {                              // { cls, keywords, cautionExempt } or null when the item is not a medicine
  const P = medicalDataPools; if (!item || !item.name) return null;
  if (P.drugClasses && Object.prototype.hasOwnProperty.call(P.drugClasses, item.name)) return P.drugClasses[item.name];
  const name = normText(item.name); let best = null;       // custom item: use the drug named first in the text
  drugTerms().forEach(t => { const m = termRegex(t.term).exec(name); if (!m) return; const pos = m.index + m[1].length; if (!best || pos < best.pos) best = { pos, cls: t.cls }; });
  return best ? { cls: best.cls, keywords: [], cautionExempt: [] } : null;
}
function crossNote(a, b) {
  const x = (medicalDataPools.crossReactive || []).find(c => (c.a === a && c.b === b) || (c.a === b && c.b === a));
  return x ? x.note : null;
}
function activeConditions() {
  const P = medicalDataPools, set = {};
  const text = [comorbidItems.join(', '), g('comorbid-narrative'), g('pmh-medical'), g('pmh-drugs')].join(' , ');
  Object.keys(P.conditionAliases || {}).forEach(k => {
    const terms = P.conditionAliases[k].map(a => ({ term: normText(a), cls: k }));
    if (findTerms(text, terms).length) set[k] = true;
  });
  treatItems.forEach(it => { const d = drugInfoFor(it); if (!d) return; if (['coumarin', 'doac', 'heparin'].includes(d.cls)) set.anticoagulant = true; if (d.cls === 'coumarin') set.warfarin = true; });
  if (pregnancyAskable() && g('repro-preg') === 'Pregnant') set.pregnancy = true;
  return set;
}
function treatSafety(item, conds, hits) {
  const info = drugInfoFor(item), res = { allergy: [], cautions: [], adultDose: false, key: '' };
  if (info) {
    hits.forEach(h => {
      if (h.cls === info.cls) res.allergy.push({ cross: false, text: `Allergy recorded: ${h.term}. ${item.name.split(' ')[0]} is in the ${info.cls} group.` });
      else { const n = crossNote(h.cls, info.cls); if (n) res.allergy.push({ cross: true, text: `Allergy recorded: ${h.term}. ${item.name.split(' ')[0]} is a ${info.cls}; ${n}.` }); }
    });
    (medicalDataPools.cautions || []).forEach(r => {
      if (!r.classes.includes(info.cls)) return;
      const why = r.conditions.filter(c => conds[c] && !(info.cautionExempt || []).includes(c));
      if (why.length) res.cautions.push({ note: r.note, why: why.map(c => CONDITION_LABELS[c] || c).join(', ') });
    });
  }
  const dosey = /\d\s*(mg|g|mcg|µg|units?|iu)\b/i.test(item.name || '');
  res.adultDose = isPaediatricForm() && item.category === 'Medical' && (!!info || dosey);
  res.key = res.allergy.map(a => a.text).sort().join('|');
  return res;
}
function pendingAllergyAcks() {                           // indexes of plan items with an allergy alert not yet ticked
  const hits = findTerms(g('pmh-allergies'), drugTerms()), out = [];
  treatItems.forEach((it, i) => { const r = treatSafety(it, {}, hits); if (r.allergy.length && it.allergyAck !== r.key) out.push(i); });
  return out;
}
function ackAllergy(idx, on) {
  const it = treatItems[idx]; if (!it) return;
  const hits = findTerms(g('pmh-allergies'), drugTerms());
  const r = treatSafety(it, {}, hits);
  if (on && r.allergy.length) it.allergyAck = r.key; else delete it.allergyAck;
  triggerAutoSave(); refreshDrugSafety();
}
function refreshDrugSafety() {
  if (!document.getElementById('treatment-container') || typeof medicalDataPools === 'undefined' || !medicalDataPools.drugClasses) { renderAllergyChecklist(); return; }
  const hits = findTerms(g('pmh-allergies'), drugTerms()), conds = activeConditions();
  treatItems.forEach((it, idx) => {
    const box = document.getElementById('tw-' + idx); if (!box) return;
    const r = treatSafety(it, conds, hits);
    if (it.allergyAck && it.allergyAck !== r.key) delete it.allergyAck;      // the allergy changed since it was ticked: ask again
    let h = '';
    r.allergy.forEach(a => { h += `<div class="dw ${a.cross ? 'dw-warn' : 'dw-crit'}">⚠ ${escH(a.text)}</div>`; });
    if (r.allergy.length) h += `<label class="dw-ack"><input type="checkbox" id="ack-${idx}" ${it.allergyAck === r.key ? 'checked' : ''} onchange="ackAllergy(${idx},this.checked)"> I have checked</label>`;
    r.cautions.forEach(c => { h += `<div class="dw dw-warn">Consider: ${escH(c.note)} <span class="dw-why">(${escH(c.why)} recorded)</span></div>`; });
    if (r.adultDose) h += `<div class="dw dw-info">Adult dose - verify for child</div>`;
    if (box.innerHTML !== h) box.innerHTML = h;
    const row = box.closest('.treatment-item'); if (row) row.classList.toggle('has-allergy', r.allergy.length > 0 && it.allergyAck !== r.key);
  });
  renderAllergyChecklist();
}
