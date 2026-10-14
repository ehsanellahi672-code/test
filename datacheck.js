/* ============================================================
   datacheck.js - startup checks for data.js
   Loaded right after data.js. Contains no app logic.
   - validateData(pools, labels, dom) is a pure function: it returns a list of problems and touches nothing.
     tests.html calls it directly.
   - runDataChecks() runs once the page has loaded and shows a readable panel instead of a blank screen.
   Problem objects: { level: 'error' | 'warn', msg: 'text' }.
   ============================================================ */

const DATA_CHIP_TYPES = ['multi', 'single', 'scale', 'duration', 'ternary'];

function dcIsObj(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }
function dcStr(x) { return typeof x === 'string' ? x.trim() : ''; }

/* pools  = medicalDataPools, labels = systemLabels
   dom    = optional { investCats: [...], treatCats: [...] } : the category names the HTML dropdowns offer */
function validateData(pools, labels, dom) {
  const out = [];
  const err = m => out.push({ level: 'error', msg: m });
  const warn = m => out.push({ level: 'warn', msg: m });

  if (!dcIsObj(pools)) { err('medicalDataPools is missing or is not an object. data.js did not load, or it has a syntax error.'); return out; }
  if (!dcIsObj(labels)) err('systemLabels is missing or is not an object.');

  // --- required lists
  ['presentingComplaints', 'rosSymptoms', 'comorbidities', 'fhConditions', 'examinations'].forEach(k => {
    if (!Array.isArray(pools[k])) err('"' + k + '" must be a list.');
    else if (!pools[k].length) err('"' + k + '" is empty.');
  });
  ['investigations', 'treatments'].forEach(k => {
    if (!dcIsObj(pools[k])) err('"' + k + '" must be an object of category name -> list of names.');
    else Object.keys(pools[k]).forEach(c => { if (!Array.isArray(pools[k][c])) err('"' + k + '" category "' + c + '" must be a list.'); });
  });
  if (out.some(o => o.level === 'error')) return out;        // the rest assumes the shapes above

  // --- version
  if (!(Number.isInteger(pools.dataVersion) && pools.dataVersion > 0)) warn('dataVersion is missing. Add "dataVersion: 1," to medicalDataPools so saved records record which data they used.');

  // --- complaints
  const seen = {};
  pools.presentingComplaints.forEach((c, i) => {
    if (!dcIsObj(c) || !dcStr(c.label)) { err('Complaint #' + (i + 1) + ' has no label.'); return; }
    const key = c.label.trim().toLowerCase();
    if (seen[key]) err('Duplicate complaint label: "' + c.label + '".'); seen[key] = true;
    if (!dcStr(c.system)) err('Complaint "' + c.label + '" has no system code.');
    else if (dcIsObj(labels) && !Object.prototype.hasOwnProperty.call(labels, c.system)) err('Complaint "' + c.label + '" uses system code "' + c.system + '", which is not in systemLabels.');
    if (!Array.isArray(c.hopi)) warn('Complaint "' + c.label + '" has no hopi list.');
    if (c.redFlags !== undefined && !Array.isArray(c.redFlags)) err('Complaint "' + c.label + '": redFlags must be a list.');
    if (c.chips !== undefined) {
      if (!Array.isArray(c.chips)) { err('Complaint "' + c.label + '": chips must be a list.'); return; }
      c.chips.forEach((g, gi) => {
        const where = 'Complaint "' + c.label + '" chips group ' + (gi + 1);
        if (!dcIsObj(g) || !dcStr(g.q)) { err(where + ' has no question text (q).'); return; }
        if (DATA_CHIP_TYPES.indexOf(g.type) < 0) err(where + ' ("' + g.q + '") has unknown type "' + g.type + '".');
        else if (['multi', 'single', 'ternary'].indexOf(g.type) >= 0 && !(Array.isArray(g.options) && g.options.length)) err(where + ' ("' + g.q + '") needs a list of options.');
        else if (g.type === 'scale' && !(Number(g.min) < Number(g.max))) err(where + ' ("' + g.q + '") needs min lower than max.');
      });
    }
  });

  // --- examination systems: findings are saved under the field label, so labels must exist and be unique per system
  const sysSeen = {};
  pools.examinations.forEach((s, i) => {
    if (!dcIsObj(s) || !dcStr(s.system)) { err('Exam system #' + (i + 1) + ' has no name.'); return; }
    if (sysSeen[s.system]) err('Duplicate exam system: "' + s.system + '".'); sysSeen[s.system] = true;
    if (!Array.isArray(s.fields) || !s.fields.length) { err('Exam system "' + s.system + '" has no fields.'); return; }
    const fl = {};
    s.fields.forEach((f, j) => {
      if (!dcIsObj(f) || !dcStr(f.label)) { err('Exam system "' + s.system + '": field #' + (j + 1) + ' has no label.'); return; }
      if (fl[f.label]) err('Exam system "' + s.system + '": duplicate field label "' + f.label + '".'); fl[f.label] = true;
      if (['text', 'select', 'textarea'].indexOf(f.type) < 0) err('Exam field "' + f.label + '" (' + s.system + ') has unknown type "' + f.type + '".');
      if (f.type === 'select' && !(Array.isArray(f.options) && f.options.length)) err('Exam field "' + f.label + '" (' + s.system + ') is a select but has no options.');
    });
  });

  // --- investigation and treatment categories must exist in the HTML dropdowns
  if (dom && Array.isArray(dom.investCats)) Object.keys(pools.investigations).forEach(c => { if (dom.investCats.indexOf(c) < 0) err('Investigation category "' + c + '" is in data.js but not in the Category dropdown in index.html.'); });
  if (dom && Array.isArray(dom.treatCats)) Object.keys(pools.treatments).forEach(c => { if (dom.treatCats.indexOf(c) < 0) err('Treatment category "' + c + '" is in data.js but not in the Category dropdown in index.html.'); });

  // --- duplicate names inside the plain lists (a duplicate is harmless but is probably a typo)
  [['rosSymptoms', pools.rosSymptoms], ['comorbidities', pools.comorbidities], ['fhConditions', pools.fhConditions]].forEach(p => {
    const s = {}; p[1].forEach(n => { const k = String(n).trim().toLowerCase(); if (s[k]) warn('Duplicate entry in ' + p[0] + ': "' + n + '".'); s[k] = true; });
  });
  ['investigations', 'treatments'].forEach(k => Object.keys(pools[k]).forEach(c => { const s = {}; pools[k][c].forEach(n => { if (s[n]) warn('Duplicate in ' + k + ' / ' + c + ': "' + n + '".'); s[n] = true; }); }));

  // --- templates: every named item must exist in the pools
  if (pools.templates !== undefined) {
    if (!Array.isArray(pools.templates)) err('"templates" must be a list.');
    else {
      const has = (pool, n) => Object.keys(pool).some(c => pool[c].indexOf(n) >= 0);
      pools.templates.forEach((t, i) => {
        if (!dcIsObj(t) || !dcStr(t.name)) { err('Template #' + (i + 1) + ' has no name.'); return; }
        const bad = m => err('Template "' + t.name + '": ' + m + ' is not in the lists in data.js.');
        (t.complaints || []).forEach(l => { if (!pools.presentingComplaints.some(p => p && p.label === l)) bad('complaint "' + l + '"'); });
        (t.exam || []).forEach(x => { if (!pools.examinations.some(e => e && e.system === x)) bad('exam system "' + x + '"'); });
        (t.investigations || []).forEach(x => { const n = typeof x === 'string' ? x : (x && x.name); if (!has(pools.investigations, n)) bad('investigation "' + n + '"'); });
        (t.treatments || []).forEach(x => { const n = typeof x === 'string' ? x : (x && x.name); if (!has(pools.treatments, n)) bad('treatment "' + n + '"'); });
      });
    }
  }

  // --- drug tables: every medicine in drugClasses should be a real treatment (a typo here silently disables a warning)
  if (pools.drugClasses !== undefined) {
    if (!dcIsObj(pools.drugClasses)) err('"drugClasses" must be an object.');
    else {
      const med = {}; Object.keys(pools.treatments).forEach(c => pools.treatments[c].forEach(n => { med[n] = true; }));
      Object.keys(pools.drugClasses).forEach(n => { if (!med[n]) warn('drugClasses lists "' + n + '", which is not a treatment name.'); });
    }
  }
  return out;
}

/* ---------- the readable error panel (inline styles on purpose: styles.css may be the thing that failed to load) */
function showDataErrorPanel(problems, fatal) {
  if (document.getElementById('data-error-panel')) return;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const errs = problems.filter(p => p.level === 'error'), warns = problems.filter(p => p.level === 'warn');
  const li = p => '<li style="margin:6px 0;line-height:1.4">' + esc(p.msg) + '</li>';
  const box = document.createElement('div');
  box.id = 'data-error-panel'; box.setAttribute('role', 'alertdialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'data-error-title');
  box.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#fff;color:#1c1c1e;overflow:auto;padding:20px;font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif';
  box.innerHTML = '<div style="max-width:640px;margin:0 auto">' +
    '<h1 id="data-error-title" style="font-size:1.3rem;margin:0 0 8px;color:#b91c1c">HistoryOsis found a problem with its files</h1>' +
    '<p style="margin:0 0 12px">' + (fatal ? 'The app cannot start safely, so nothing has been changed. Your saved records are untouched.' : 'The app can still run, but some content may be missing or behave oddly. Your saved records are untouched.') + '</p>' +
    '<p style="margin:0 0 6px;font-weight:700">What to do</p>' +
    '<ul style="margin:0 0 16px;padding-left:20px"><li>Make sure <b>index.html</b>, <b>data.js</b>, <b>styles.css</b> and all the other script files are in the <b>same folder</b>, and all come from the same version.</li><li>If you edited <b>data.js</b>, undo your last change. The list below shows what is wrong.</li></ul>' +
    '<p style="margin:0 0 6px;font-weight:700">Problems found (' + errs.length + ')</p><ul id="data-error-list" style="margin:0 0 16px;padding-left:20px">' + errs.slice(0, 40).map(li).join('') + (errs.length > 40 ? '<li>... and ' + (errs.length - 40) + ' more</li>' : '') + '</ul>' +
    (warns.length ? '<details style="margin:0 0 16px"><summary style="cursor:pointer;font-weight:700;min-height:44px;display:flex;align-items:center">Notes (' + warns.length + ')</summary><ul style="padding-left:20px">' + warns.slice(0, 40).map(li).join('') + '</ul></details>' : '') +
    '<div style="display:flex;flex-wrap:wrap;gap:10px">' +
    '<button type="button" id="data-error-copy" style="min-height:44px;padding:0 18px;border:1.5px solid #1a5fd9;background:#fff;color:#1a5fd9;border-radius:99px;font:inherit;font-weight:600;cursor:pointer">Copy details</button>' +
    (fatal ? '' : '<button type="button" id="data-error-go" style="min-height:44px;padding:0 18px;border:0;background:#1a5fd9;color:#fff;border-radius:99px;font:inherit;font-weight:600;cursor:pointer">Continue anyway</button>') +
    '</div></div>';
  document.body.appendChild(box);
  const text = 'HistoryOsis data check:\n' + problems.map(p => '- [' + p.level + '] ' + p.msg).join('\n');
  document.getElementById('data-error-copy').onclick = function () { try { navigator.clipboard.writeText(text); this.textContent = 'Copied'; } catch (e) { this.textContent = 'Copy not available'; } };
  const go = document.getElementById('data-error-go'); if (go) go.onclick = function () { box.remove(); };
  const first = document.getElementById('data-error-copy'); if (first) first.focus();
}

/* the category names the HTML dropdowns offer (read at run time, so index.html and data.js are compared as they really are) */
function dcReadDom() {
  const opts = id => { const el = document.getElementById(id); return el ? Array.prototype.map.call(el.options, o => (o.value || o.textContent || '').trim()).filter(Boolean) : null; };
  return { investCats: opts('invest-category'), treatCats: opts('treatment-category-filter') };
}

function runDataChecks() {
  let problems = [], fatal = false;
  const loadErrs = (window.__loadErrors || []);
  loadErrs.forEach(e => { problems.push({ level: 'error', msg: e.kind === 'missing' ? 'The file "' + e.file + '" could not be loaded. Is it in the same folder as index.html?' : 'Script error in "' + e.file + '": ' + (e.msg || 'unknown') }); });
  if (typeof medicalDataPools === 'undefined' || typeof systemLabels === 'undefined') {
    fatal = true;
    problems.push({ level: 'error', msg: 'data.js did not load correctly (medicalDataPools / systemLabels are missing).' });
  } else {
    try { problems = problems.concat(validateData(medicalDataPools, systemLabels, dcReadDom())); }
    catch (e) { fatal = true; problems.push({ level: 'error', msg: 'The data check itself failed: ' + e.message }); }
  }
  if (problems.some(p => p.level === 'error' && /could not be loaded/.test(p.msg))) fatal = true;      // a missing app file: nothing will work
  window.__dataProblems = problems;
  const errors = problems.filter(p => p.level === 'error');
  if (errors.length) showDataErrorPanel(problems, fatal);
  problems.filter(p => p.level === 'warn').forEach(p => { try { console.warn('HistoryOsis data note: ' + p.msg); } catch (e) {} });
  return problems;
}
document.addEventListener('DOMContentLoaded', runDataChecks);
