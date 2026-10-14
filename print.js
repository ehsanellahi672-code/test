/* print.js - Printing, sharing, print settings. */
'use strict';

/* ============================================================
   PROMPT 12: PRINT LAYOUT AND SHARING
   Settings (in localStorage 'historyosis_settings'): printInst, printDept, printLogo (data URL, max 300 px wide), printLayout ('full' | 'compact').
   buildPrintDocument(record, {layout}) returns the whole A4 print page; buildShareText(record, anon) returns the plain-text summary.
   No QR code: nothing was added for it.
   ============================================================ */
const PRINT_LOGO_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/=]+$/;
function printCfg() {
  const c = getSettings();
  const t = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, n) : '');
  return { inst: t(c.printInst, 80), dept: t(c.printDept, 80), logo: (typeof c.printLogo === 'string' && c.printLogo.length < 400000 && PRINT_LOGO_RE.test(c.printLogo)) ? c.printLogo : '', layout: c.printLayout === 'compact' ? 'compact' : 'full', comments: c.printComments === true };
}
let printLogoPending;                   // undefined = unchanged, '' = remove, data URL = new logo (applied when Settings is saved)
function printSettingsHTML() {
  const c = printCfg(); printLogoPending = undefined;
  return `<div class="field"><label>Printing</label>
    <input type="text" id="set-pr-inst" maxlength="80" placeholder="Institution name (shown on prints)" value="${escH(c.inst)}" aria-label="Institution name">
    <input type="text" id="set-pr-dept" maxlength="80" placeholder="Department" value="${escH(c.dept)}" aria-label="Department for the print header" style="margin-top:8px">
    <div class="pr-logo-row"><span id="set-pr-logo-prev">${c.logo ? `<img src="${c.logo}" alt="Current logo">` : '<span style="font-size:0.8rem;color:var(--text-muted)">No logo</span>'}</span>
      <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('set-pr-logo').click()">Choose logo</button>
      <button type="button" class="btn btn-secondary btn-sm" onclick="printLogoRemove()">Remove</button>
      <input type="file" id="set-pr-logo" accept="image/png,image/jpeg,image/webp" style="display:none" onchange="printLogoChosen(this)"></div>
    <select id="set-pr-layout" aria-label="Print layout" style="margin-top:8px"><option value="full" ${c.layout === 'full' ? 'selected' : ''}>Full layout</option><option value="compact" ${c.layout === 'compact' ? 'selected' : ''}>Compact (aims for one page)</option></select>
    <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;margin-top:8px;cursor:pointer;font-weight:normal;color:var(--text-primary)"><input type="checkbox" id="set-pr-comments" ${c.comments ? 'checked' : ''} style="width:18px;height:18px;flex-shrink:0;"> Include reviewer comments in prints</label>
    <div style="font-size:0.75rem;margin-top:4px;color:var(--text-muted)">Used by Print and Export PDF. The logo is scaled down to 300 px wide.</div></div>`;
}
function printSettingsRead(settings) {
  const v = id => { const e = document.getElementById(id); return e ? e.value : null; };
  const i = v('set-pr-inst'), d = v('set-pr-dept'), l = v('set-pr-layout');
  if (i !== null) settings.printInst = i.trim().slice(0, 80);
  if (d !== null) settings.printDept = d.trim().slice(0, 80);
  if (l !== null) settings.printLayout = l === 'compact' ? 'compact' : 'full';
  const pc = document.getElementById('set-pr-comments'); if (pc) settings.printComments = pc.checked;
  if (printLogoPending === '') delete settings.printLogo; else if (printLogoPending) settings.printLogo = printLogoPending;
  printLogoPending = undefined;
}
function printLogoRemove() { printLogoPending = ''; const p = document.getElementById('set-pr-logo-prev'); if (p) p.innerHTML = '<span style="font-size:0.8rem;color:var(--text-muted)">No logo</span>'; }
function printLogoChosen(input) {
  const f = input.files && input.files[0]; input.value = ''; if (!f) return;
  if (!/^image\/(png|jpeg|webp)$/.test(f.type)) { showToast('Choose a PNG, JPEG or WebP image.', 'error'); return; }
  if (f.size > 5 * 1024 * 1024) { showToast('That image is too large (over 5 MB).', 'error'); return; }
  const rd = new FileReader();
  rd.onload = () => {
    const img = new Image();
    img.onload = () => {
      try {
        const k = Math.min(1, 300 / img.width, 150 / img.height), w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const cx = cv.getContext('2d');
        cx.drawImage(img, 0, 0, w, h);
        let url = cv.toDataURL('image/png');
        if (url.length > 180000) { cx.globalCompositeOperation = 'destination-over'; cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); url = cv.toDataURL('image/jpeg', 0.85); }
        if (url.length > 180000 || !PRINT_LOGO_RE.test(url)) { showToast('That logo is too detailed. Try a simpler image.', 'error'); return; }
        printLogoPending = url; const p = document.getElementById('set-pr-logo-prev'); if (p) p.innerHTML = `<img src="${url}" alt="New logo">`;
      } catch (e) { showToast('Could not read that image.', 'error'); }
    };
    img.onerror = () => showToast('Could not read that image.', 'error');
    img.src = rd.result;
  };
  rd.onerror = () => showToast('Could not read that file.', 'error');
  rd.readAsDataURL(f);
}
function printSignBlock(cred) {
  cred = cred || {}; const ok = v => v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim().toUpperCase() !== 'N/A';
  const lines = cred.role === 'Doctor' ? [cred.designation, cred.department] : [cred.role === 'Student' ? 'Student' : '', cred.roll && 'Roll No: ' + cred.roll, cred.year, cred.ward];
  return `<div class="sign-block"><div class="sign-col"><div class="sign-title">Signed by</div><div class="sign-space"></div><div class="sign-line"></div>
    <strong>${ok(cred.name) ? escH(cred.name) : '&nbsp;'}</strong><div class="sign-small">${escH(lines.filter(ok).join(' | '))}</div><div class="sign-small">Date and time: ______________________</div></div>
    <div class="sign-col"><div class="sign-title">Supervisor</div><div class="sign-space"></div><div class="sign-line"></div>
    <strong>${ok(cred.supervisor) ? escH(cred.supervisor) : '&nbsp;'}</strong><div class="sign-small">Signature</div><div class="sign-small">Date and time: ______________________</div></div></div>`;
}
const PRINT_COMPACT_SKIP = ['REVIEW OF SYSTEMS', 'FAMILY HISTORY', 'SOCIAL HISTORY', 'REPRODUCTIVE HISTORY'];
function printCompactBody(html) {
  const doc = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
  doc.querySelectorAll('.print-section').forEach(sec => {
    const t = (sec.querySelector('.print-section-title') || {}).textContent || '';
    if (PRINT_COMPACT_SKIP.includes(t.trim().toUpperCase())) { sec.remove(); return; }
    if (/CLINICAL TIMELINE/i.test(t)) { const notes = [...sec.children].filter(c => !c.classList.contains('print-section-title')); notes.slice(0, Math.max(0, notes.length - 2)).forEach(n => n.remove()); }
  });
  return doc.body.innerHTML;
}
function buildPrintDocument(record, opt) {
  opt = opt || {}; const cfg = printCfg(), compact = (opt.layout || cfg.layout) === 'compact';
  let body = buildPrintHTML(record, { sign: true, extraHTML: rvPrintHTML(record, cfg) }); if (compact) body = printCompactBody(body);
  const rid = String(record && record.id != null ? record.id : ''), ridCss = rid.replace(/[^A-Za-z0-9._:-]/g, '').slice(0, 60);
  const when = new Date().toLocaleString(), whenCss = when.replace(/[^A-Za-z0-9 ,.:\/-]/g, '');
  const dem = (record && record.demographics) || {};
  const hdrTop = (cfg.logo || cfg.inst || cfg.dept) ? `<div class="ph-top">${cfg.logo ? `<img class="ph-logo" src="${cfg.logo}" alt="">` : ''}<div>${cfg.inst ? `<div class="ph-inst">${escH(cfg.inst)}</div>` : ''}${cfg.dept ? `<div class="ph-dept">${escH(cfg.dept)}</div>` : ''}</div></div>` : '';
  const css = `@page{size:A4;margin:12mm 12mm 16mm 12mm;@bottom-left{content:"Printed ${whenCss} | Record ${ridCss}";font:7.5pt Helvetica,Arial,sans-serif;color:#444}@bottom-right{content:"Page " counter(page) " of " counter(pages);font:8pt Helvetica,Arial,sans-serif;color:#222}}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:10.5pt;line-height:1.4;color:#000;background:#fff;margin:0 auto;width:186mm}
.print-header{text-align:center;margin-bottom:14px;border-bottom:2px solid #000;padding-bottom:8px}
.ph-top{display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px;text-align:left}
.ph-logo{max-width:300px;max-height:90px;object-fit:contain}
.ph-inst{font-size:14pt;font-weight:700}.ph-dept{font-size:10.5pt;color:#333}
.print-header h1{margin:0;font-size:18pt;text-transform:uppercase;letter-spacing:1.2px}
.print-header p{margin:3px 0 0;font-size:9pt;color:#555}
.demographics-box{border:1px solid #444;padding:10px 12px;margin-bottom:14px;border-radius:4px;display:grid;grid-template-columns:1fr 1fr;gap:5px 14px;break-inside:avoid}
.print-section{margin-bottom:14px;break-inside:avoid;page-break-inside:avoid}
.print-section-title{border-bottom:1.5px solid #000;padding:2px 0;font-size:11pt;font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;break-after:avoid}
.print-row,.print-block,li{break-inside:avoid}
.print-row{margin-bottom:4px}.print-label{font-weight:700;color:#000}
.print-block{margin:6px 0 8px;padding:5px 10px;border-left:3px solid #555}
.sign-block{display:grid;grid-template-columns:1fr 1fr;gap:14mm;margin-top:18px;break-inside:avoid;page-break-inside:avoid}
.sign-title{font-weight:700;font-size:9pt;text-transform:uppercase;letter-spacing:.5px}
.sign-space{height:14mm}.sign-line{border-top:1px solid #000;margin-bottom:3px}
.sign-small{font-size:9pt;color:#333;margin-top:2px}
.print-footer{margin-top:18px;text-align:center;font-size:8.5pt;color:#555;border-top:1px solid #bbb;padding-top:6px}
body.compact{font-size:8.5pt;line-height:1.3}
.compact .print-header{margin-bottom:8px;padding-bottom:5px}.compact .print-header h1{font-size:13pt}
.compact .print-body{column-count:2;column-gap:7mm}
.compact .print-section{margin-bottom:7px}.compact .print-section-title{font-size:9pt;margin-bottom:4px}
.compact .demographics-box{column-span:all;padding:6px 8px;margin-bottom:8px;font-size:8.5pt}
.compact .sign-block{column-span:all;margin-top:8px}.compact .sign-space{height:9mm}`;
  const fit = `(function(){function mm(n){var d=document.createElement('div');d.style.cssText='position:absolute;visibility:hidden;width:1px;height:'+n+'mm';document.body.appendChild(d);var h=d.offsetHeight;d.remove();return h;}
var page=mm(269),b=document.querySelector('.print-body');
if(document.body.className.indexOf('compact')>-1){var fs=8.5,hd=document.querySelector('.print-header'),ft=document.querySelector('.print-footer');
function used(){return hd.offsetHeight+b.offsetHeight+ft.offsetHeight+30;}
while(fs>6.5&&used()>page){fs-=0.25;document.body.style.fontSize=fs+'pt';}}
else{[].forEach.call(document.querySelectorAll('.print-section'),function(s){if(s.offsetHeight>page*0.92){s.style.breakInside='auto';s.style.pageBreakInside='auto';}});}})();`;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Clinical Record — ${escH(dem.name || 'Patient')}</title><style>${css}</style></head><body class="${compact ? 'compact' : 'full'}"><div class="print-header">${hdrTop}<h1>Clinical Patient Record</h1><p>Generated by HistoryOsis v2.2</p></div><div class="print-body">${body}</div><div class="print-footer">Record ID: ${escH(rid)} &bull; Printed on: ${escH(when)}</div><script>${fit}<\/script></body></html>`;
}
/* ---------- share summary (text) ---------- */
function buildShareText(r, anon) {
  const ok = v => v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim().toUpperCase() !== 'N/A';
  const d = r.demographics || {}, h = r.history || {}, ex = r.exam || {}, v = ex.vitals || {}, tx = r.treatment || {}, inv = r.investigations || {}, cr = r.credentials || {};
  const L = [];
  L.push('CLINICAL SUMMARY' + (anon ? ' (anonymised)' : ''));
  if (!anon) { const id = [ok(d.name) && d.name, ok(d.mrno) && 'MR ' + d.mrno].filter(Boolean).join(' | '); if (id) L.push('Patient: ' + id); }
  const as = [ok(d.age) && d.age + ageSuffix(d, true), ok(d.sex) && d.sex].filter(Boolean).join(' / '); if (as) L.push('Age / sex: ' + as);
  if (ok(d.dept)) L.push('Department: ' + d.dept);
  if (ok(d.dateAdmission)) L.push('Admitted: ' + d.dateAdmission);
  const pcs = (h.pcs || []).filter(p => p && ok(p.label));
  if (pcs.length) { L.push('', 'PRESENTING COMPLAINTS'); pcs.forEach((pc, i) => { L.push(`${i + 1}. ${pc.label}${ok(pc.duration) ? ' (' + pc.duration + ')' : ''}`); let hs = ''; try { hs = composeHopiSentence(pc); } catch (e) {} if (hs) L.push('   ' + hs); else (pc.hopi || []).forEach((q, qi) => { const a = pc.answers && pc.answers[qi]; if (ok(a)) L.push('   ' + a); }); if (ok(pc.custom)) L.push('   ' + pc.custom); }); }
  const pm = [['Past history', h.pmhMedical], ['Surgical', h.pmhSurgical], ['Drugs', h.pmhDrugs], ['Allergies', h.pmhAllergies]].filter(x => ok(x[1]));
  const com = (h.comorbidItems || []).filter(ok); if (com.length) pm.unshift(['Comorbidities', com.join(', ')]);
  if (pm.length) { L.push('', 'BACKGROUND'); pm.forEach(x => L.push(x[0] + ': ' + x[1])); }
  const vs = [ok(v.bp) && 'BP ' + v.bp, ok(v.pulse) && 'Pulse ' + v.pulse, ok(v.rr) && 'RR ' + v.rr, ok(v.spo2) && 'SpO2 ' + v.spo2 + '%', ok(v.temp) && 'Temp ' + v.temp, ok(v.gcs) && 'GCS ' + v.gcs, ok(v.news2) && 'NEWS2 ' + v.news2 + (ok(v.news2Band) ? ' (' + v.news2Band + ')' : '')].filter(Boolean);
  if (vs.length) { L.push('', 'VITALS', vs.join(', ')); }
  const ii = (inv.items || []).filter(i => i && ok(i.name)); if (ii.length) { L.push('', 'INVESTIGATIONS'); ii.forEach(i => L.push(i.name + ': ' + (ok(i.result) ? i.result : 'pending'))); }
  if (ok(tx.primaryDx) || (tx.items || []).length) { L.push('', 'DIAGNOSIS AND PLAN'); if (ok(tx.primaryDx)) L.push('Diagnosis: ' + tx.primaryDx); (tx.items || []).filter(i => i && ok(i.name)).forEach(i => L.push('- ' + (ok(i.category) ? '[' + i.category + '] ' : '') + i.name + (ok(i.detail) ? ' - ' + i.detail : ''))); }
  const notes = (r.progressNotes || []).filter(n => n && n.type === 'SOAP' && n.payload);
  if (notes.length) { const pl = notes[notes.length - 1].payload; const bits = [['S', pl.s], ['A', pl.a], ['P', pl.p]].filter(x => ok(x[1])); if (bits.length) { L.push('', 'LATEST UPDATE'); bits.forEach(x => L.push(x[0] + ': ' + x[1])); } }
  if (cr.role) L.push('', 'Signed: ' + (anon ? cr.role : [cr.name, cr.role].filter(ok).join(', ')));
  L.push('', 'Shared from HistoryOsis');
  let text = L.join('\n');
  if (anon) {                                  // best-effort: also remove the name and MR number if they were typed into free text
    const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    String(d.name || '').split(/\s+/).filter(w => w.length >= 3).forEach(w => { text = text.replace(new RegExp('\\b' + esc(w) + '\\b', 'gi'), '[name]'); });
    if (ok(d.mrno) && String(d.mrno).trim().length >= 2) text = text.split(String(d.mrno).trim()).join('[MR]');
  }
  return text;
}
async function shareRecord(id) {
  let rec; try { rec = (await dbGetAll()).find(r => r.id === id && !r.deletedAt); } catch (e) { showToast('Failed to load record.', 'error'); return; }
  if (!rec) { showToast('Record not found.', 'error'); return; }
  openShareDialog(rec);
}
async function shareCurrentForm() {
  const data = collectFormData();
  try { const ex = (await dbGetAll()).find(r => r.id === data.id); if (ex && ex.progressNotes) data.progressNotes = ex.progressNotes; } catch (e) {}
  openShareDialog(data);
}
function openShareDialog(rec) {
  window.__shareRec = rec;
  const canShare = typeof navigator.share === 'function';
  const html = `<label class="cl-row" style="border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:10px;padding:8px 10px"><input type="checkbox" id="sh-anon" checked onchange="shareRefresh()"><span><strong>Leave out patient name and MR number</strong><br><span style="color:var(--text-muted)">Anonymised share. Check the text below before sending.</span></span></label>
    <textarea id="sh-preview" readonly aria-label="Text that will be shared"></textarea>
    ${canShare ? '<div style="margin-top:8px"><button type="button" class="btn btn-secondary btn-sm" onclick="shareCopy()" style="min-height:44px">Copy text instead</button></div>' : ''}`;
  showCustomBodyModal('Share summary', html, () => shareSend(), canShare ? 'Share' : 'Copy text');
  shareRefresh();
}
function shareRefresh() { const a = document.getElementById('sh-anon'), t = document.getElementById('sh-preview'); if (a && t && window.__shareRec) t.value = buildShareText(window.__shareRec, a.checked); }
function shareText() { const t = document.getElementById('sh-preview'); return t ? t.value : ''; }
function shareCopy() {
  const text = shareText(); if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => { closeModal(); showToast('Summary copied.', 'success'); }).catch(() => { fallbackCopy(text); closeModal(); });
  else { fallbackCopy(text); closeModal(); }
}
function shareSend() {
  const text = shareText(); if (!text) return;
  if (typeof navigator.share === 'function') {
    navigator.share({ title: 'Clinical summary', text }).then(() => closeModal()).catch(e => { if (!e || e.name !== 'AbortError') shareCopy(); });
  } else shareCopy();
}
function buildPrintHTML(r, opts) {
  const isValid = v => v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim().toUpperCase() !== 'N/A';
  const dem = r.demographics || {}; const his = r.history || {}; const ex = r.exam || {}; const inv = r.investigations || {}; const tx = r.treatment || {}; const cred = r.credentials || {};
  let html = '';
  html += `<div class="demographics-box">`;
  if (isValid(dem.name)) html += `<div><span class="print-label">Name:</span> ${escH(dem.name)}</div>`;
  if (isValid(dem.mrno)) html += `<div><span class="print-label">MR No:</span> ${escH(dem.mrno)}</div>`;
  if (isValid(dem.age) || isValid(dem.sex)) { let ageSex = [dem.age ? `${dem.age}${ageSuffix(dem)}` : '', dem.sex].filter(isValid).join(' / '); if (ageSex) html += `<div><span class="print-label">Age/Sex:</span> ${escH(ageSex)}</div>`; }
  if (isValid(dem.dateAdmission)) { let dt = [dem.dateAdmission, dem.timeAdmission].filter(isValid).join(' '); html += `<div><span class="print-label">Admission:</span> ${escH(dt)}</div>`; }
  if (isValid(dem.dept)) html += `<div><span class="print-label">Department:</span> ${escH(dem.dept)}</div>`;
  if (isValid(dem.bedno)) html += `<div><span class="print-label">Bed:</span> ${escH(dem.bedno)}</div>`;
  if (isValid(dem.admitVia)) html += `<div><span class="print-label">Admitted Via:</span> ${escH(dem.admitVia)}</div>`;
  if (isValid(dem.occupation)) html += `<div><span class="print-label">Occupation:</span> ${escH(dem.occupation)}</div>`;
  if (isValid(dem.residence)) html += `<div><span class="print-label">Residence:</span> ${escH(dem.residence)}</div>`;
  if (isValid(dem.informant)) html += `<div><span class="print-label">Informant:</span> ${escH(dem.informant)}</div>`;
  html += `</div>`;

  const sectionStart = (title) => `<div class="print-section"><div class="print-section-title">${title}</div>`; const sectionEnd = () => `</div>`;
  const printRow = (lbl, val) => isValid(val) ? `<div class="print-row"><span class="print-label">${lbl}:</span> ${escH(val)}</div>` : '';
  const printBlock = (lbl, val) => isValid(val) ? `<div class="print-block"><div class="print-label">${lbl}:</div><div>${escH(val)}</div></div>` : '';

  if (his.pcs && his.pcs.length > 0) {
    let pcHtml = '';
    his.pcs.forEach((pc, i) => {
      if (!isValid(pc.label)) return;
      pcHtml += `<div style="margin-bottom: 12px;"><strong>${i+1}. ${escH(pc.label)}</strong>`;
      if (isValid(pc.duration)) pcHtml += ` — Duration: ${escH(pc.duration)}`; pcHtml += `<br>`;
      const hsp = composeHopiSentence(pc);
      if (hsp) pcHtml += `<div style="margin-left: 15px; font-size: 0.95em; margin-top: 4px;">${escH(hsp)}</div>`;
      if (pc.hopi && pc.hopi.length > 0) { pc.hopi.forEach((q, qi) => { let a = (pc.answers && pc.answers[qi]); if (isValid(a)) { pcHtml += `<div style="margin-left: 15px; font-size: 0.95em; margin-top: 4px;"><em>${escH(q)}</em><br>${escH(a)}</div>`; } }); }
      if (isValid(pc.custom)) pcHtml += `<div style="margin-left: 15px; font-size: 0.95em; margin-top: 4px;"><em>Notes:</em> ${escH(pc.custom)}</div>`;
      if (Array.isArray(pc.redFlagsPresent) && pc.redFlagsPresent.length) pcHtml += `<div style="margin-left: 15px; font-size: 0.95em; margin-top: 4px;"><strong>Red flags present:</strong> ${escH(pc.redFlagsPresent.join('; '))}</div>`; pcHtml += `</div>`;
    });
    if (pcHtml) html += sectionStart('CHIEF COMPLAINTS & HOPI') + pcHtml + sectionEnd();
  }

  let rosValidItems = (his.rosSelected || []).filter(isValid);
  if (rosValidItems.length > 0 || isValid(his.rosNarrative)) { html += sectionStart('REVIEW OF SYSTEMS'); if (rosValidItems.length > 0) html += printRow('Positive symptoms', rosValidItems.join(', ')); html += printBlock('Narrative', his.rosNarrative); html += sectionEnd(); }

  let comValidItems = (his.comorbidItems || []).filter(isValid);
  if (comValidItems.length > 0 || isValid(his.comorbidNarrative)) { html += sectionStart('COMORBIDITIES'); if (comValidItems.length > 0) html += printRow('Conditions', comValidItems.join(', ')); html += printBlock('Narrative', his.comorbidNarrative); html += sectionEnd(); }

  let pmhStr = printRow('Medical', his.pmhMedical) + printRow('Surgical', his.pmhSurgical) + printRow('Drugs', his.pmhDrugs) + printRow('Allergies', his.pmhAllergies) + printRow('Immunisation', his.pmhImmunisation);
  if (pmhStr) html += sectionStart('PAST MEDICAL & SURGICAL HISTORY') + pmhStr + carryLinePrint(r) + sectionEnd();

  let fhValidItems = (his.fhSelected || []).filter(isValid);
  if (his.paeds && (isValid(his.paeds.birth) || isValid(his.paeds.feeding) || isValid(his.paeds.development))) { html += sectionStart('PAEDIATRIC HISTORY') + printRow('Birth history', his.paeds.birth) + printRow('Feeding', his.paeds.feeding) + printRow('Development', his.paeds.development) + sectionEnd(); }
  if (fhValidItems.length > 0 || isValid(his.fhNarrative)) { html += sectionStart('FAMILY HISTORY'); if (fhValidItems.length > 0) html += printRow('Conditions', fhValidItems.join(', ')); html += printBlock('Narrative', his.fhNarrative); html += sectionEnd(); }

  if (dem.sex === 'Female' && his.repro) { let r = his.repro; let repStr = printRow('Menarche/Cycle', r.menarche) + printRow('LMP', r.lmp) + printRow('Obstetric', r.obstetric) + printRow('Contraception', r.contraception) + printRow('Pregnancy status', r.pregnancy); if (repStr) html += sectionStart('REPRODUCTIVE HISTORY') + repStr + sectionEnd(); }

  if (his.sh) {
    let sh = his.sh; let shStr = ''; let smokingStr = [sh.smoking, sh.smokingDetail].filter(isValid).join(' — ');
    if (smokingStr) shStr += printRow('Smoking', smokingStr);
    shStr += printRow('Alcohol', sh.alcohol) + printRow('Drugs', sh.drugs) + printRow('Diet', sh.diet) + printRow('Exercise', sh.exercise) + printRow('Travel', sh.travel) + printRow('Living', sh.living) + printRow('ADLs', sh.adl);
    if (shStr) html += sectionStart('SOCIAL HISTORY') + shStr + sectionEnd();
  }

  if (ex.vitals) {
    let v = ex.vitals; let vitStr = '';
    if (isValid(v.bp)) vitStr += `<span class="print-label">BP:</span> ${escH(v.bp)} mmHg &nbsp;&nbsp; `; if (isValid(v.pulse)) vitStr += `<span class="print-label">Pulse:</span> ${escH(v.pulse)} bpm &nbsp;&nbsp; `; if (isValid(v.rr)) vitStr += `<span class="print-label">RR:</span> ${escH(v.rr)} /min &nbsp;&nbsp; `; if (isValid(v.spo2)) vitStr += `<span class="print-label">SpO₂:</span> ${escH(v.spo2)}% &nbsp;&nbsp; `; if (isValid(v.temp)) vitStr += `<span class="print-label">Temp:</span> ${escH(v.temp)}°F &nbsp;&nbsp; `; if (isValid(v.gcs)) vitStr += `<span class="print-label">GCS:</span> ${escH(v.gcs)} &nbsp;&nbsp; `; if (isValid(v.height)) vitStr += `<span class="print-label">Height:</span> ${escH(v.height)} &nbsp;&nbsp; `; if (isValid(v.weight)) vitStr += `<span class="print-label">Weight:</span> ${escH(v.weight)} &nbsp;&nbsp; `; if (isValid(v.bmi)) vitStr += `<span class="print-label">BMI:</span> ${escH(v.bmi)} &nbsp;&nbsp; `; if (isValid(v.o2)) vitStr += `<span class="print-label">Supplemental O₂:</span> ${escH(v.o2)} &nbsp;&nbsp; `; if (isValid(v.consciousness)) vitStr += `<span class="print-label">Consciousness:</span> ${escH(v.consciousness)} &nbsp;&nbsp; `; if (isValid(v.news2)) vitStr += `<br><span class="print-label">NEWS2:</span> ${escH(v.news2)}${isValid(v.news2Band) ? ' (' + escH(v.news2Band) + ' risk' + (v.news2Partial === 'Yes' ? ', partial' : '') + ')' : ''} <span style="font-size:0.8em">&mdash; decision support only</span>`;
    if (vitStr.trim()) html += sectionStart('VITAL SIGNS') + `<div style="line-height: 1.8;">${vitStr}</div>` + sectionEnd();
  }

  if (ex.general) {
    let gen = ex.general; let genStr = printRow('Appearance', gen.appearance) + printRow('Pallor', gen.pallor) + printRow('Jaundice', gen.jaundice) + printRow('Cyanosis', gen.cyanosis) + printRow('Clubbing', gen.clubbing) + printRow('Lymph', gen.lymph) + printRow('Oedema', gen.oedema);
    if (genStr) html += sectionStart('GENERAL EXAMINATION') + `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">${genStr}</div>` + sectionEnd();
  }

  if (ex.systems && ex.systems.length > 0) {
    let sysHtml = '';
    ex.systems.forEach(si => {
      const def = medicalDataPools.examinations.find(e => e.system === si.system); if (!def) return;
      let fieldsHtml = '';
      def.fields.forEach((f, fi) => { let fv = exVal(si, f, fi); if (isValid(fv)) fieldsHtml += `<div><span class="print-label">${escH(f.label)}:</span> ${escH(fv)}</div>`; });
      if (fieldsHtml) { sysHtml += `<div style="margin-bottom: 10px;"><strong>${escH(si.system)}</strong><div style="margin-left: 15px;">${fieldsHtml}</div></div>`; }
    });
    if (sysHtml) html += sectionStart('SYSTEM EXAMINATIONS') + sysHtml + sectionEnd();
  }

  let validInv = (inv.items || []).filter(i => isValid(i.name));
  if (validInv.length > 0 || isValid(inv.summary)) {
    html += sectionStart('INVESTIGATIONS'); validInv.forEach(i => { html += printRow(escH(i.name), isValid(i.result) ? i.result : 'Pending'); }); html += printBlock('Interpretation', inv.summary); html += sectionEnd();
  }

  let txStr = '';
  if (isValid(tx.primaryDx)) txStr += printRow('Primary Dx', tx.primaryDx);
  if (isValid(tx.differentials)) txStr += printBlock('Differentials', tx.differentials);
  
  let validTx = (tx.items || []).filter(i => isValid(i.name));
  if (validTx.length > 0) {
    txStr += `<div style="margin-top: 8px;"><span class="print-label">Treatment Plan:</span><ul style="margin: 4px 0 8px 20px; padding: 0;">`;
    validTx.forEach(t => { txStr += `<li>[${escH(t.category)}] ${escH(t.name)}${isValid(t.detail) ? ' — ' + escH(t.detail) : ''}${t.allergyAck ? ' <em>(allergy alert reviewed)</em>' : ''}</li>`; }); txStr += `</ul></div>`;
  }
  if (isValid(tx.monitoring)) txStr += printBlock('Monitoring', tx.monitoring); if (isValid(tx.discharge)) txStr += printBlock('Discharge Plan', tx.discharge); if (isValid(tx.counselling)) txStr += printBlock('Counselling', tx.counselling);
  if (txStr) html += sectionStart('DIAGNOSIS & MANAGEMENT') + txStr + sectionEnd();

  if (r.progressNotes && r.progressNotes.length > 0) {
    html += sectionStart('CLINICAL TIMELINE & PROGRESS');
    r.progressNotes.forEach(note => {
      html += `<div style="margin-bottom: 12px; padding: 10px; border: 1px solid #d1d1d6; border-left: 4px solid ${note.type === 'SOAP' ? '#1C6EF5' : '#D97706'}; background: #f9f9fb; page-break-inside: avoid;">`;
      html += `<div style="font-weight: bold; margin-bottom: 6px; font-size: 0.9em; color: #555;">[${escH(formatNoteTimestamp(note.timestamp))}] - ${escH(note.type.toUpperCase())}</div>`;
      if (note.type === 'SOAP') {
        const pl = note.payload || {};
        if (isValid(pl.s)) html += `<div><strong>S:</strong> ${escH(pl.s)}</div>`; if (isValid(pl.o)) html += `<div><strong>O:</strong> ${escH(pl.o)}</div>`; if (isValid(pl.a)) html += `<div><strong>A:</strong> ${escH(pl.a)}</div>`; if (isValid(pl.p)) html += `<div><strong>P:</strong> ${escH(pl.p)}</div>`; html += noteExtraHTML(pl, true);
      } else if (note.type === 'Treatment') { if (isValid(note.payload)) html += `<div>${escH(note.payload)}</div>`; }
      html += `</div>`;
    });
    html += sectionEnd();
  }

  if (opts && opts.sign) html += (opts.extraHTML || '') + printSignBlock(cred);
  else if (isValid(cred.name)) {
    html += `<div style="margin-top: 40px; text-align: right; page-break-inside: avoid;"><div style="display: inline-block; text-align: left; border-top: 1px dashed #000; padding-top: 8px; min-width: 250px;">`;
    if (cred.role === 'Student') { html += `<strong>${escH(cred.name)}</strong><br><span style="font-size: 0.9em; color: #444;">Student | Roll No: ${escH(cred.roll)}<br>${escH(cred.year)}${isValid(cred.ward) ? ' | ' + escH(cred.ward) : ''}</span>`; } 
    else { html += `<strong>${escH(cred.name)}</strong><br><span style="font-size: 0.9em; color: #444;">${escH(cred.designation)} | ${escH(cred.department)}</span>`; }
    html += `</div></div>`;
  }
  return html;
}
async function printRecord(id) {
  let records;
  try { records = await dbGetAll(); } catch(err) { showToast('Failed to load record.', 'error'); return; }
  const record = records.find(r => r.id === id); if (!record) { showToast('Record not found.', 'error'); return; }
  printRecordObject(record);
}
async function printCurrentForm() {
  const data = collectFormData();
  try { const existing = (await dbGetAll()).find(r => r.id === data.id); if (existing && existing.progressNotes) data.progressNotes = existing.progressNotes; if (existing && existing.reviews) data.reviews = existing.reviews; if (existing && existing.signoff) data.signoff = existing.signoff; } catch (e) {}
  if (!data.demographics?.name) { showToast('Enter patient name before exporting.', 'error'); return; }
  printRecordObject(data);
}
function printRecordObject(record) {
  const old = document.getElementById('_print_sandbox'); if (old) old.remove();
  const iframe = document.createElement('iframe');
  // A4-sized (and off screen) so the page can measure itself before printing
  iframe.id = '_print_sandbox'; iframe.style.cssText = 'position:fixed;width:794px;height:1123px;border:0;left:-9999px;top:-9999px;visibility:hidden;'; document.body.appendChild(iframe);
  const fullDoc = buildPrintDocument(record);
  iframe.onload = () => {
    try { iframe.contentWindow.focus(); iframe.contentWindow.print(); }
    catch(e) { showToast('Print failed. Try the Copy EMR button instead.', 'error'); }
    setTimeout(() => { iframe.remove(); }, 2000);
  };
  iframe.srcdoc = fullDoc;
}
