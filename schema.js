/* schema.js - Record shape: exam-key migration and cleaning of imported records. */
'use strict';

function exVal(si, f, fi) {
  const F = (si && si.findings) || {};
  if (F[f.label] !== undefined) return F[f.label];
  if (F[fi] !== undefined) return F[fi];
  return '';
}
function migrateExamFindings(item) {
  const def = medicalDataPools.examinations.find(e => e.system === item.system);
  const F = item.findings || {};
  if (def) {
    def.fields.forEach((f, fi) => { if (F[f.label] === undefined && F[fi] !== undefined) F[f.label] = F[fi]; });
    Object.keys(F).forEach(k => { if (/^\d+$/.test(k)) delete F[k]; });
  }
  item.findings = F;
}
/* Imported files are untrusted: rebuild each record so every section has the type the app expects
   (a wrong type used to throw while drawing the Records list). Returns a detached copy. */
function sanitizeImportedRecord(raw) {
  const r = JSON.parse(JSON.stringify(raw));
  delete r.deletedAt;                         // imported records always arrive active
  if (typeof r.id !== 'string' || !/^[\w-]+$/.test(r.id)) {
    r.id = 'rec-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
  }
  ['demographics', 'history', 'exam', 'investigations', 'treatment', 'credentials'].forEach(k => {
    if (r[k] !== undefined && !isPlainObj(r[k])) r[k] = {};
  });
  const toText = v => (v === null || v === undefined) ? '' : (typeof v === 'object' ? '' : String(v));
  Object.keys(r.demographics || {}).forEach(k => { r.demographics[k] = toText(r.demographics[k]); });
  const h = r.history || {};
  ['rosSelected', 'comorbidItems', 'fhSelected'].forEach(k => {
    h[k] = Array.isArray(h[k]) ? h[k].map(toText).filter(Boolean) : [];
  });
  h.pcs = Array.isArray(h.pcs) ? h.pcs.filter(isPlainObj) : [];
  if (r.history) r.history = h;
  const ex = r.exam || {};
  if (r.exam) {
    ex.vitals = isPlainObj(ex.vitals) ? ex.vitals : {};
    Object.keys(ex.vitals).forEach(k => { ex.vitals[k] = toText(ex.vitals[k]); });
    ex.systems = Array.isArray(ex.systems) ? ex.systems.filter(x => isPlainObj(x) && typeof x.system === 'string') : [];
    ex.systems.forEach(x => { if (!isPlainObj(x.findings)) x.findings = {}; });
  }
  if (r.investigations) r.investigations.items = Array.isArray(r.investigations.items) ? r.investigations.items.filter(isPlainObj) : [];
  if (r.treatment) r.treatment.items = Array.isArray(r.treatment.items) ? r.treatment.items.filter(isPlainObj) : [];
  if (r.progressNotes !== undefined) r.progressNotes = Array.isArray(r.progressNotes) ? r.progressNotes.filter(isPlainObj) : [];
  return r;
}
