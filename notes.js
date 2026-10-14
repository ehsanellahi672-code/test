/* notes.js - Progress notes (SOAP) and vitals change. */
'use strict';

/* ---- progress notes: reference panel, today's vitals, NEWS2 change, rolling problems list ---- */
const NOTE_VITAL_KEYS = ['bp', 'pulse', 'rr', 'spo2', 'temp'];
const NOTE_VITAL_LABELS = { bp: 'BP', pulse: 'Pulse', rr: 'RR', spo2: 'SpO₂', temp: 'Temp' };
function noteAnyVitals(v) { return !!v && typeof v === 'object' && NOTE_VITAL_KEYS.some(k => v[k] != null && String(v[k]).trim()); }
function vitalsToNews2(v) {
  v = v || {};
  return news2Compute({ rr: vitalNum(v.rr), spo2: vitalNum(v.spo2), sbp: vitalSystolic(v.bp), hr: vitalNum(v.pulse), tempC: vitalTempC(v.temp), gcs: null, o2: v.o2 || '', consc: v.consciousness || '', scale2: v.spo2Scale2 === 'Yes' });
}
function vitalsLineText(v) {
  if (!noteAnyVitals(v)) return '';
  const parts = NOTE_VITAL_KEYS.filter(k => v[k] != null && String(v[k]).trim()).map(k => NOTE_VITAL_LABELS[k] + ' ' + String(v[k]).trim());
  const n = vitalsToNews2(v);
  return parts.join(', ') + (n.entered ? ' · NEWS2 ' + n.total + ' (' + n.band + ')' + (n.missing.length ? ', partial' : '') : '');
}
function noteProblems(pl) { return pl && Array.isArray(pl.problems) ? pl.problems.filter(x => typeof x === 'string' && x.trim()) : []; }
function noteExtraHTML(pl, forPrint) {
  if (!pl || typeof pl !== 'object') return '';
  let h = '';
  const vl = vitalsLineText(pl.vitals); if (vl) h += forPrint ? `<div><strong>Vitals:</strong> ${escH(vl)}</div>` : `<div class="np-vitals-line"><strong>Vitals:</strong> ${escH(vl)}</div>`;
  const pr = noteProblems(pl); if (pr.length) h += forPrint ? `<div><strong>Problems / Plan:</strong> ${pr.map((x, i) => (i + 1) + '. ' + escH(x)).join('; ')}</div>` : `<div class="np-vitals-line"><strong>Problems / Plan:</strong> ${pr.map((x, i) => (i + 1) + '. ' + escH(x)).join('; ')}</div>`;
  return h;
}
function noteExtraText(pl) {
  if (!pl || typeof pl !== 'object') return '';
  let t = ''; const vl = vitalsLineText(pl.vitals); if (vl) t += `Vitals: ${vl}\n`;
  const pr = noteProblems(pl); if (pr.length) t += `Problems / Plan: ${pr.map((x, i) => (i + 1) + '. ' + x).join('; ')}\n`;
  return t;
}
function noteContext(rec) {
  rec = rec || {}; const notes = Array.isArray(rec.progressNotes) ? rec.progressNotes : [];
  let prev = null, source = '';
  for (let i = notes.length - 1; i >= 0; i--) { const n = notes[i]; if (n && n.type === 'SOAP' && n.payload && noteAnyVitals(n.payload.vitals)) { prev = n.payload.vitals; source = formatNoteTimestamp(n.timestamp) + ' (progress note)'; break; } }
  const ev = rec.exam && rec.exam.vitals;
  if (!prev && noteAnyVitals(ev)) { prev = ev; source = 'Admission record' + (rec.savedAt ? ', ' + fmtDMY(rec.savedAt) : ''); }
  const ex = rec.exam || {}, lines = [];
  const gen = ex.general || {}; const gp = [['appearance', 'appearance'], ['pallor', 'pallor'], ['jaundice', 'jaundice'], ['cyanosis', 'cyanosis'], ['clubbing', 'clubbing'], ['lymph', 'lymph nodes'], ['oedema', 'oedema'], ['other', 'other']].filter(([k]) => gen[k] && String(gen[k]).trim()).map(([k, l]) => l + ': ' + String(gen[k]).trim());
  if (gp.length) lines.push('General: ' + gp.join('; '));
  (Array.isArray(ex.systems) ? ex.systems : []).forEach(si => {
    const def = medicalDataPools.examinations.find(e => e.system === si.system); if (!def) return;
    const vals = def.fields.map((f, fi) => exVal(si, f, fi)).filter(v => v && String(v).trim()).map(v => String(v).trim());
    if (vals.length) lines.push(si.system + ': ' + vals.slice(0, 4).join('; '));
  });
  if (ex.custom && String(ex.custom).trim()) lines.push(String(ex.custom).trim());
  let lastO = ''; for (let i = notes.length - 1; i >= 0; i--) { const n = notes[i]; if (n && n.type === 'SOAP' && n.payload && n.payload.o && String(n.payload.o).trim()) { lastO = String(n.payload.o).trim(); break; } }
  if (lastO) lines.push('Last note, objective: ' + lastO);
  const tx = rec.treatment || {}, plan = [];
  (Array.isArray(tx.items) ? tx.items : []).slice(0, 14).forEach(i => { if (i && i.name) plan.push('[' + (i.category || '') + '] ' + i.name + (i.detail ? ' — ' + i.detail : '')); });
  const txNotes = notes.filter(n => n && n.type === 'Treatment' && typeof n.payload === 'string' && n.payload.trim()); if (txNotes.length) plan.push('Latest treatment update: ' + txNotes[txNotes.length - 1].payload.trim());
  if (tx.monitoring && String(tx.monitoring).trim()) plan.push('Monitoring: ' + String(tx.monitoring).trim());
  let problems = []; for (let i = notes.length - 1; i >= 0; i--) { const pr = notes[i] && notes[i].type === 'SOAP' ? noteProblems(notes[i].payload) : []; if (pr.length) { problems = pr; break; } }
  if (!problems.length && tx.primaryDx && String(tx.primaryDx).trim()) problems = [String(tx.primaryDx).trim()];
  return { prev, source, exam: lines, plan, problems, scale2: !!(prev && prev.spo2Scale2 === 'Yes') };
}
function noteReadVitals() {
  const g = id => ((document.getElementById(id) || {}).value || '').trim();
  return { bp: g('np-bp'), pulse: g('np-pulse'), rr: g('np-rr'), spo2: g('np-spo2'), temp: g('np-temp'), o2: g('np-o2'), consciousness: g('np-consc'), spo2Scale2: (document.getElementById('np-scale2') || {}).checked ? 'Yes' : '' };
}
function noteNum(k, v) { return k === 'bp' ? vitalSystolic(v) : k === 'temp' ? vitalTempC(v) : vitalNum(v); }
function arrowHTML(delta, digits, worseUp) {
  if (delta === null || !isFinite(delta)) return '';
  const d = Math.round(delta * Math.pow(10, digits)) / Math.pow(10, digits);
  if (d === 0) return '<span class="np-arrow same" title="no change">→ no change</span>';
  return `<span class="np-arrow ${d > 0 ? 'up' : 'down'}" title="${d > 0 ? 'higher' : 'lower'} than before">${d > 0 ? '↑' : '↓'} ${Math.abs(d)}</span>`;
}
function noteVitalsChanged() {
  const ctx = window.__noteCtx || {}, prev = ctx.prev, cur = noteReadVitals();
  NOTE_VITAL_KEYS.forEach(k => {
    const e = document.getElementById('np-d-' + k); if (!e) return;
    const a = prev ? noteNum(k, prev[k]) : null, b = noteNum(k, cur[k]);
    e.innerHTML = (a !== null && b !== null) ? arrowHTML(b - a, k === 'temp' ? 1 : 0) : '';
  });
  const box = document.getElementById('np-news2'); if (!box) return;
  const n = vitalsToNews2(cur);
  if (!n.entered) { box.className = 'np-news2'; box.textContent = 'Enter today\'s vitals to see the NEWS2 score.'; return; }
  let txt = 'NEWS2 today: ' + n.total + ' (' + n.band + ')' + (n.missing.length ? ' · partial, missing ' + n.missing.join(', ') : ''), cls = 'np-news2';
  const pn = prev ? vitalsToNews2(prev) : null;
  if (pn && pn.entered) {
    const d = n.total - pn.total;
    txt += d > 0 ? ' · ↑ +' + d + ' since previous (' + pn.total + '): worse' : d < 0 ? ' · ↓ ' + d + ' since previous (' + pn.total + '): better' : ' · → same as previous (' + pn.total + ')';
    cls += d > 0 ? ' worse' : d < 0 ? ' better' : '';
  }
  box.className = cls; box.textContent = txt;
}
function npAddProblem(text) {
  const box = document.getElementById('np-problems'); if (!box) return;
  const row = document.createElement('div'); row.className = 'np-prob';
  row.innerHTML = '<input type="text" maxlength="200" aria-label="Problem or plan item" placeholder="Problem / plan item"><button type="button" aria-label="Remove this item">✕</button>';
  row.querySelector('input').value = text || '';
  row.querySelector('button').onclick = () => row.remove();
  box.appendChild(row);
  if (!text) row.querySelector('input').focus();
}
function noteReadProblems() {
  const out = []; document.querySelectorAll('#np-problems .np-prob input').forEach(i => { const t = i.value.trim().slice(0, 200); if (t && !out.includes(t)) out.push(t); });
  return out.slice(0, 12);
}
async function openSOAPModal(recordId) {
  let rec = null; try { rec = (await dbGetAll()).find(r => r.id === recordId) || null; } catch (e) {}
  if (rec && rvIsApproved(rec)) { showToast('This record is approved and read-only. Reopen it first.', 'warning'); return; }
  const ctx = noteContext(rec); window.__noteCtx = ctx;
  const consOpts = (document.getElementById('vs-consc') ? document.getElementById('vs-consc').innerHTML : '<option value="">Select</option><option>Alert</option>');
  const prevVal = k => ctx.prev && ctx.prev[k] != null && String(ctx.prev[k]).trim() ? String(ctx.prev[k]).trim() : '';
  const pv = k => prevVal(k) ? `<span class="np-prev">previous: ${escH(prevVal(k))}</span>` : '';
  let ref = '';
  if (ctx.prev || ctx.exam.length || ctx.plan.length || ctx.problems.length) {
    const pn = ctx.prev ? vitalsToNews2(ctx.prev) : null;
    ref = `<details class="np-ref" open id="np-ref"><summary>Earlier values (read-only)</summary>
      <div class="np-block"><b>Previous vitals</b>${ctx.source ? `<span class="np-src">${escH(ctx.source)}</span>` : ''}<div>${ctx.prev ? escH(NOTE_VITAL_KEYS.filter(k => prevVal(k)).map(k => NOTE_VITAL_LABELS[k] + ' ' + prevVal(k)).join(' · ') || 'None recorded') + (pn && pn.entered ? ' · NEWS2 ' + pn.total + ' (' + escH(pn.band) + ')' : '') : 'None recorded'}</div></div>
      <div class="np-block"><b>Last examination</b>${ctx.exam.length ? '<ul>' + ctx.exam.map(l => `<li>${escH(l.length > 220 ? l.slice(0, 217) + '...' : l)}</li>`).join('') + '</ul>' : '<div>None recorded</div>'}</div>
      <div class="np-block"><b>Current plan</b>${ctx.plan.length ? '<ul>' + ctx.plan.map(l => `<li>${escH(l)}</li>`).join('') + '</ul>' : '<div>None recorded</div>'}</div>
    </details>`;
  }
  const vf = (id, k, label, ph, mode) => `<div class="field"><label for="${id}">${label}${pv(k)}</label><input type="text" id="${id}" placeholder="${ph}" inputmode="${mode || 'decimal'}" autocomplete="off" oninput="noteVitalsChanged()"><span class="np-delta" id="np-d-${k}" aria-live="polite"></span></div>`;
  const body = `${ref}
    <div class="subsection-label" style="margin-top:0">Today's vitals</div>
    <div class="np-vgrid">${vf('np-bp', 'bp', 'BP', '120/80', 'text')}${vf('np-pulse', 'pulse', 'Pulse', 'bpm')}${vf('np-rr', 'rr', 'RR', '/min')}${vf('np-spo2', 'spo2', 'SpO₂', '%')}${vf('np-temp', 'temp', 'Temp', '°C or °F')}
      <div class="field"><label for="np-o2">On oxygen?</label><select id="np-o2" onchange="noteVitalsChanged()"><option value="">Select</option><option value="No">No (room air)</option><option value="Yes">Yes</option></select></div>
      <div class="field" style="grid-column:1/-1"><label for="np-consc">Consciousness</label><select id="np-consc" onchange="noteVitalsChanged()">${consOpts}</select></div></div>
    <label class="rf-item" style="border:0"><input type="checkbox" id="np-scale2" ${ctx.scale2 ? 'checked' : ''} onchange="noteVitalsChanged()"><span>SpO₂ Scale 2 (target 88-92%, e.g. COPD)</span></label>
    <div class="np-news2" id="np-news2" aria-live="polite">Enter today's vitals to see the NEWS2 score.</div>
    <div class="field"><label>Subjective</label><textarea id="soap-s" placeholder="Patient's reported symptoms..."></textarea></div>
    <div class="field"><label>Objective</label><textarea id="soap-o" placeholder="Clinical findings, vitals..."></textarea></div>
    <div class="field"><label>Assessment</label><textarea id="soap-a" placeholder="Diagnosis, differential..."></textarea></div>
    <div class="field"><label>Plan</label><textarea id="soap-p" placeholder="Treatment, follow-up..."></textarea></div>
    <div class="subsection-label">Problems / Plan <span class="guidance">(carries to the next note)</span></div>
    <div id="np-problems"></div>
    <button type="button" class="btn btn-secondary btn-sm" style="min-height:44px" onclick="npAddProblem('')">+ Add problem</button>`;
  showCustomBodyModal('Add SOAP Note', body, () => { saveSOAPNote(recordId); }, 'Save');
  (ctx.problems.length ? ctx.problems : []).forEach(t => npAddProblem(t));
  window.__noteProblemsAtOpen = JSON.stringify(ctx.problems);
  noteVitalsChanged();
}
async function saveSOAPNote(recordId) {
  const g = id => ((document.getElementById(id) || {}).value || '').trim();
  const s = g('soap-s'), o = g('soap-o'), a = g('soap-a'), p = g('soap-p');
  const vit = noteReadVitals(), hasV = noteAnyVitals(vit) || !!vit.o2 || !!vit.consciousness;
  const problems = noteReadProblems(), changed = JSON.stringify(problems) !== window.__noteProblemsAtOpen;
  if (!s && !o && !a && !p && !hasV && !(changed && problems.length)) { showToast('Cannot save empty note.', 'warning'); return; }
  try {
    const records = await dbGetAll(); const record = records.find(r => r.id === recordId);
    if (!record) { showToast('Record not found.', 'error'); return; }
    if (rvIsApproved(record)) { closeModal(); showToast('This record is approved and read-only. Reopen it first.', 'warning'); return; }
    if (!Array.isArray(record.progressNotes)) record.progressNotes = [];
    const payload = { s, o, a, p };
    if (hasV) { const n = vitalsToNews2(vit); payload.vitals = Object.assign({}, vit, { news2: n.entered ? String(n.total) : '', news2Band: n.entered ? n.band : '', news2Partial: n.entered && n.missing.length ? 'Yes' : '' }); }
    if (problems.length) payload.problems = problems;
    record.progressNotes.push({ timestamp: new Date().toISOString(), type: 'SOAP', payload });
    await dbPut(record); closeModal(); await renderRecords(); showToast('Note added', 'success');
  } catch (err) { showToast('Failed to save SOAP note.', 'error'); }
}
