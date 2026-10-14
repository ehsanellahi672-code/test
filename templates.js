/* templates.js - Templates (built-in and user). */
'use strict';

/* ---- templates ---- */
function categoryOf(pool, name) { const k = Object.keys(pool || {}).find(c => (pool[c] || []).includes(name)); return k || ''; }
function templateProblems(t) {
  const P = medicalDataPools, bad = [];
  (t.complaints || []).forEach(l => { if (!P.presentingComplaints.some(p => p.label === l)) bad.push('complaint: ' + l); });
  (t.exam || []).forEach(x => { if (!P.examinations.some(e => e.system === x)) bad.push('exam: ' + x); });
  (t.investigations || []).forEach(x => { const n = typeof x === 'string' ? x : x.name; if (!categoryOf(P.investigations, n)) bad.push('investigation: ' + n); });
  (t.treatments || []).forEach(x => { const n = typeof x === 'string' ? x : x.name; if (!categoryOf(P.treatments, n)) bad.push('treatment: ' + n); });
  return bad;
}
function builtinTemplates() {
  const out = [], list = Array.isArray(medicalDataPools.templates) ? medicalDataPools.templates : [];
  list.forEach((t, i) => {
    const c = cleanTemplate(Object.assign({}, t, { id: 'b' + i }));
    if (!c) return;
    c.id = 'b' + i; c.builtin = true;
    c.investigations = c.investigations.map(x => ({ name: x.name, category: x.category || categoryOf(medicalDataPools.investigations, x.name) })).filter(x => x.category);
    c.treatments = c.treatments.map(x => ({ name: x.name, category: x.category || categoryOf(medicalDataPools.treatments, x.name) })).filter(x => x.category);
    c.complaints = c.complaints.filter(l => medicalDataPools.presentingComplaints.some(p => p.label === l));
    c.exam = c.exam.filter(x => medicalDataPools.examinations.some(e => e.system === x));
    out.push(c);
  });
  return out;
}
function validateTemplates() {
  const list = Array.isArray(medicalDataPools.templates) ? medicalDataPools.templates : [];
  window.__templateProblems = [];
  list.forEach(t => { const b = templateProblems(t); if (b.length) { window.__templateProblems.push({ name: t && t.name, missing: b }); try { console.warn('HistoryOsis template "' + (t && t.name) + '" has items that are not in the lists and were skipped:', b); } catch (e) {} } });
}
function allTemplates() { return builtinTemplates().concat(loadPrefs().tpl.map(t => Object.assign({}, t, { builtin: false }))); }
function findTemplate(id) { return allTemplates().find(t => t.id === id); }
function tplSummary(t) {
  const parts = [];
  if (t.complaints.length) parts.push(t.complaints.length + ' complaint' + (t.complaints.length > 1 ? 's' : ''));
  if (t.exam.length) parts.push(t.exam.length + ' exam');
  if (t.investigations.length) parts.push(t.investigations.length + ' investigation' + (t.investigations.length > 1 ? 's' : ''));
  if (t.treatments.length) parts.push(t.treatments.length + ' plan item' + (t.treatments.length > 1 ? 's' : ''));
  return parts.join(' · ');
}
function tplPlan(t) {
  return {
    complaints: t.complaints.filter(l => !pcCards.some(c => String(c.label).toLowerCase() === l.toLowerCase())),
    exam: t.exam.filter(x => !examItems.some(e => e.system === x)),
    investigations: t.investigations.filter(i => !investItems.some(x => x.name === i.name)),
    treatments: t.treatments.filter(i => !treatItems.some(x => x.name === i.name))
  };
}
function tplTotal(t) { return t.complaints.length + t.exam.length + t.investigations.length + t.treatments.length; }
function tplPlanTotal(p) { return p.complaints.length + p.exam.length + p.investigations.length + p.treatments.length; }
let pcSeq = 0;
function applyTemplate(t) {
  const p = tplPlan(t);
  p.complaints.forEach(l => {
    const d = medicalDataPools.presentingComplaints.find(x => x.label === l);
    pcCards.push({ id: 'pc-' + Date.now() + '-' + (pcSeq++), label: l, hopi: d ? d.hopi : [], answers: [], duration: '', custom: '' });
  });
  p.exam.forEach(x => examItems.push({ system: x, findings: {} }));
  p.investigations.forEach(i => investItems.push({ name: i.name, category: i.category || 'Custom', result: '' }));
  p.treatments.forEach(i => treatItems.push({ name: i.name, category: i.category || 'Medical', detail: '' }));
  if (p.complaints.length) renderPCCards();
  if (p.exam.length) renderExamCards();
  if (p.investigations.length) renderInvestItems();
  if (p.treatments.length) renderTreatItems();
  updateProgress(); triggerAutoSave();
  return tplPlanTotal(p);
}
function openTemplates() {
  const all = allTemplates(), mine = all.filter(t => !t.builtin), built = all.filter(t => t.builtin);
  const row = t => `<div class="tpl-row"><button type="button" class="tpl-pick" onclick="startTemplate('${t.id}')"><b>${escH(t.name)}</b><span>${escH(tplSummary(t))}</span></button>${t.builtin ? '' : `<button type="button" class="tpl-del" aria-label="Delete template ${escH(t.name)}" onclick="deleteTemplate('${t.id}')">🗑</button>`}</div>`;
  const html = `<h3>Start from template</h3><p class="tpl-note">Adds the items below to this form. Anything already on the form, and anything you have typed, is kept.</p>
    <div class="tpl-head">My templates</div>${mine.length ? mine.map(row).join('') : '<p class="tpl-note">None yet. Fill in a record, then tap <b>Save as template</b>.</p>'}
    <div class="tpl-head">Built-in</div>${built.length ? built.map(row).join('') : '<p class="tpl-note">No built-in templates in this data.js.</p>'}
    <div class="btn-group" style="margin-top:14px"><button class="btn btn-secondary" onclick="closeModal()">Close</button></div>`;
  const content = document.getElementById('modal-content'); content.innerHTML = `<div style="max-height:72vh;overflow-y:auto">${html}</div>`;
  document.getElementById('modal-overlay').style.display = 'flex';
}
function startTemplate(id) {
  const t = findTemplate(id); if (!t) return;
  const p = tplPlan(t), add = tplPlanTotal(p), have = tplTotal(t) - add;
  if (!add) { closeModal(); showToast('Everything in this template is already on the form.', 'warning'); return; }
  const lines = [];
  if (p.complaints.length) lines.push(p.complaints.length + ' complaint' + (p.complaints.length > 1 ? 's' : ''));
  if (p.exam.length) lines.push(p.exam.length + ' examination system' + (p.exam.length > 1 ? 's' : ''));
  if (p.investigations.length) lines.push(p.investigations.length + ' investigation' + (p.investigations.length > 1 ? 's' : ''));
  if (p.treatments.length) lines.push(p.treatments.length + ' plan item' + (p.treatments.length > 1 ? 's' : ''));
  const hasContent = pcCards.length || examItems.length || investItems.length || treatItems.length;
  const body = `<strong>${escH(t.name)}</strong><br>Will add ${escH(lines.join(', '))}.${have ? ' ' + have + ' already on the form will be left as they are.' : ''}${hasContent ? ' Nothing you have typed will be changed.' : ''}<br><span style="font-size:0.78rem">Templates are starting points. Check every item, and add doses yourself.</span>`;
  showModal('Start from template', body, () => { closeModal(); const n = applyTemplate(t); showToast(`Added ${n} item${n === 1 ? '' : 's'} from "${t.name}".`, 'success'); }, null, 'Add to form');
}
function currentTemplateContent() {
  return {
    complaints: pcCards.map(c => c.label).filter(Boolean),
    exam: examItems.map(e => e.system).filter(Boolean),
    investigations: investItems.map(i => ({ name: i.name, category: i.category || '' })).filter(i => i.name),
    treatments: treatItems.map(i => ({ name: i.name, category: i.category || '' })).filter(i => i.name)
  };
}
function openSaveTemplate() {
  const c = currentTemplateContent();
  if (!(c.complaints.length || c.exam.length || c.investigations.length || c.treatments.length)) { showToast('Add some complaints, examinations, investigations or plan items first.', 'error'); return; }
  const sum = tplSummary(c);
  showCustomBodyModal('Save as template', `<p class="tpl-note">Saves the list of items only: ${escH(sum)}. It does not save the patient, answers, results, doses or notes. It is stored on this device.</p><div class="field"><label for="tpl-name">Template name</label><input type="text" id="tpl-name" maxlength="60" placeholder="e.g. Post-MI ward round" autocomplete="off"></div>`, () => {
    const name = (document.getElementById('tpl-name').value || '').trim();
    if (!name) { showToast('Give the template a name.', 'error'); return; }
    saveUserTemplate(name, currentTemplateContent());
  }, 'Save template');
  setTimeout(() => { const i = document.getElementById('tpl-name'); if (i) i.focus(); }, 60);
}
function saveUserTemplate(name, content) {
  const prefs = loadPrefs(); const t = cleanTemplate(Object.assign({ name }, content));
  if (!t) { showToast('Nothing to save.', 'error'); return false; }
  const at = prefs.tpl.findIndex(x => x.name.toLowerCase() === t.name.toLowerCase());
  if (at >= 0) { t.id = prefs.tpl[at].id; prefs.tpl[at] = t; }
  else { if (prefs.tpl.length >= 30) { showToast('You can keep up to 30 templates. Delete one first.', 'error'); return false; } prefs.tpl.unshift(t); }
  savePrefs(); closeModal(); showToast(at >= 0 ? `Template "${t.name}" updated.` : `Template "${t.name}" saved.`, 'success'); return true;
}
function deleteTemplate(id) {
  const t = loadPrefs().tpl.find(x => x.id === id); if (!t) return;
  showModal('Delete template', `Delete <strong>${escH(t.name)}</strong>? This cannot be undone.`, () => { const p = loadPrefs(); p.tpl = p.tpl.filter(x => x.id !== id); savePrefs(); closeModal(); showToast('Template deleted.', 'success'); }, null, 'Delete');
}
