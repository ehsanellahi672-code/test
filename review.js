/* review.js - Peer review: comments, sign-off, lock. */
'use strict';

/* ============================================================
   PROMPT 13: SUPERVISOR REVIEW, SECTION COMPLETENESS, SIGN-OFF
   record.reviews  = [{ id, section, text, by, role, at, resolved, resolvedAt, resolvedBy }]      (optional)
   record.signoff  = { state:'ready'|'approved'|'', readyAt, readyBy, approvedBy, approvedRole, approvedAt, log:[{at,action,by,role,note}] }  (optional)
   Both live only on the saved record (never in the form draft, never in version snapshots). Settings: rvOn, rvName, rvRole, printComments.
   While reviewer mode is on, or the record is approved, the form is read-only; comments are stored separately and never touch the text.
   ============================================================ */
const RV_SECTIONS = [['demographics', 'Demographics', 'sec-demographics'], ['history', 'History', 'sec-history'], ['exam', 'Examination', 'sec-exam'], ['investigations', 'Investigations', 'sec-investigations'], ['treatment', 'Plan', 'sec-treatment'], ['credentials', 'Signing details', 'sec-credentials']];
let rvState = { rid: null, reviews: [], signoff: { state: '', log: [] } };
const rvEl = id => document.getElementById(id);
const rvStr = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, n) : '');
const rvIso = v => (typeof v === 'string' && !isNaN(new Date(v)) ? v : '');
const rvFmt = v => { const d = new Date(v); return isNaN(d) ? '' : d.toLocaleString(); };
function rvCfg() { const c = getSettings(); return { on: c.rvOn === true, name: rvStr(c.rvName, 60), role: rvStr(c.rvRole, 40) }; }
function rvSettingsHTML() {
  const c = rvCfg();
  return `<div class="field"><label>Reviewer mode</label>
    <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;cursor:pointer;font-weight:normal;color:var(--text-primary)"><input type="checkbox" id="set-rv-on" ${c.on ? 'checked' : ''} style="width:18px;height:18px;flex-shrink:0;"> Turn on reviewer mode</label>
    <input type="text" id="set-rv-name" maxlength="60" placeholder="Reviewer name" aria-label="Reviewer name" value="${escH(c.name)}" style="margin-top:8px">
    <input type="text" id="set-rv-role" maxlength="40" placeholder="Role (e.g. Supervisor)" aria-label="Reviewer role" value="${escH(c.role)}" style="margin-top:8px">
    <div style="font-size:0.75rem;margin-top:4px;color:var(--text-muted)">While it is on, the form is read-only. You can comment on each section and approve a record. Comments never change the author's text.</div></div>`;
}
function rvSettingsRead(settings) {
  const on = rvEl('set-rv-on'), nm = rvEl('set-rv-name'), rl = rvEl('set-rv-role');
  if (on) settings.rvOn = on.checked; if (nm) settings.rvName = nm.value.trim().slice(0, 60); if (rl) settings.rvRole = rl.value.trim().slice(0, 40);
  setTimeout(rvRenderAll, 0);
}
function rvClean(list) {
  const out = [];
  (Array.isArray(list) ? list : []).forEach((c, i) => {
    if (!c || typeof c !== 'object') return;
    const sec = RV_SECTIONS.some(x => x[0] === c.section) ? c.section : '', text = typeof c.text === 'string' ? c.text.slice(0, 2000) : '';
    if (!sec || !text.trim()) return;
    out.push({ id: typeof c.id === 'string' && /^[\w-]{1,40}$/.test(c.id) ? c.id : 'x' + i, section: sec, text, by: rvStr(c.by, 60), role: rvStr(c.role, 40), at: rvIso(c.at), resolved: c.resolved === true, resolvedAt: rvIso(c.resolvedAt), resolvedBy: rvStr(c.resolvedBy, 60) });
  });
  return out.slice(0, 200);
}
function rvSignoffOf(rec) {
  const s = rec && rec.signoff; if (!s || typeof s !== 'object') return { state: '', log: [] };
  return { state: s.state === 'ready' || s.state === 'approved' ? s.state : '', readyAt: rvIso(s.readyAt), readyBy: rvStr(s.readyBy, 60), approvedBy: rvStr(s.approvedBy, 60), approvedRole: rvStr(s.approvedRole, 40), approvedAt: rvIso(s.approvedAt),
    log: (Array.isArray(s.log) ? s.log : []).filter(e => e && typeof e === 'object').slice(-50).map(e => ({ at: rvIso(e.at), action: rvStr(e.action, 20), by: rvStr(e.by, 60), role: rvStr(e.role, 40), note: rvStr(e.note, 200) })) };
}
function rvIsApproved(rec) { return rvSignoffOf(rec).state === 'approved'; }
function rvFormApproved() { return !!editingRecordId && rvState.rid === editingRecordId && rvState.signoff.state === 'approved'; }
function rvIsLocked() { return rvCfg().on || rvFormApproved(); }
function rvBlocked() {
  if (!rvIsLocked()) return false;
  showToast(rvCfg().on ? 'Reviewer mode is on: the form is read-only.' : 'Approved: read-only. Reopen it to edit.', 'warning'); return true;
}
function rvActor() { const c = rvCfg(); return c.on && c.name ? c.name : (((rvEl('cred-name') || {}).value || '').trim() || 'Author'); }
function rvReset() { rvState = { rid: null, reviews: [], signoff: { state: '', log: [] } }; rvRenderAll(); }
async function rvRefresh() {
  const rid = editingRecordId; if (!rid) { rvReset(); return; }
  let rec = null; try { rec = (await dbGetAll()).find(r => r.id === rid && !r.deletedAt) || null; } catch (e) {}
  if (editingRecordId !== rid) return;
  rvState = { rid: rec ? rid : null, reviews: rvClean(rec && rec.reviews), signoff: rvSignoffOf(rec) }; rvRenderAll();
}
async function rvMutate(fn, id) {
  const rid = id || rvState.rid;
  if (!rid) { showToast('Save the record first.', 'warning'); return null; }
  let rec; try { rec = (await dbGetAll()).find(r => r.id === rid && !r.deletedAt); } catch (e) { rec = null; }
  if (!rec) { showToast('Record not found.', 'error'); return null; }
  fn(rec); try { await dbPut(rec); } catch (e) { showToast('Could not save.', 'error'); return null; }
  return rec;
}
function rvRenderAll() { rvRenderBanner(); rvRenderBoxes(); rvRenderSignoff(); rvRenderComplete(); rvApplyLock(); }
/* ---- banner / lock ---- */
function rvRenderBanner() {
  const b = rvEl('rv-banner'); if (!b) return; const c = rvCfg(), so = rvState.signoff;
  b.classList.remove('approved');
  if (c.on) { b.hidden = false; b.innerHTML = `<span><strong>Reviewer mode</strong> — ${c.name ? escH(c.name) : '<em>name not set (add it in Settings)</em>'}${c.role ? ' (' + escH(c.role) + ')' : ''}. The form is read-only. Add comments under each section.</span><button type="button" class="btn btn-secondary" onclick="rvTurnOff()">Turn off</button>`; return; }
  if (rvFormApproved()) { b.hidden = false; b.classList.add('approved'); b.innerHTML = `<span><strong>Approved</strong> by ${escH(so.approvedBy || 'reviewer')}${so.approvedRole ? ' (' + escH(so.approvedRole) + ')' : ''} on ${escH(rvFmt(so.approvedAt))}. Read-only until reopened.</span><button type="button" class="btn btn-secondary" onclick="rvReopen()">Reopen</button>`; return; }
  b.hidden = true; b.innerHTML = '';
}
function rvTurnOff() { const st = getSettings(); st.rvOn = false; saveSettings(st); rvRenderAll(); }
let rvObs = null, rvT = null;
function rvApplyLock() {
  const locked = rvIsLocked(); document.body.classList.toggle('rv-locked', locked);
  const f = rvEl('tab-form'); if (!f) return;
  f.querySelectorAll('input,select,textarea,button').forEach(el => {
    if (el.closest('.rv-keep,.rv-box,.rv-banner') || el.classList.contains('rv-keepbtn')) return;
    if (locked) { if (!el.disabled) { el.dataset.rvOff = '1'; el.disabled = true; } }
    else if (el.dataset.rvOff) { el.disabled = false; delete el.dataset.rvOff; }
  });
}
function rvInit() {
  document.querySelectorAll('#sec-review .btn-group button').forEach(b => { if (/printCurrentForm|shareCurrentForm|refreshSummary/.test(b.getAttribute('onclick') || '')) b.classList.add('rv-keepbtn'); });
  const f = rvEl('tab-form'); if (f && window.MutationObserver) { rvObs = new MutationObserver(() => { if (rvIsLocked()) { clearTimeout(rvT); rvT = setTimeout(rvApplyLock, 60); } }); rvObs.observe(f, { childList: true, subtree: true }); }
  rvRenderAll();
}
/* ---- comments ---- */
function rvCommentHTML(c, canDelete) {
  return `<div class="rv-c${c.resolved ? ' done' : ''}" data-cid="${escH(c.id)}"><div class="rv-c-h"><strong>${escH(c.by || 'Reviewer')}</strong>${c.role ? `<span class="rv-role">${escH(c.role)}</span>` : ''}${c.resolved ? '<span class="badge badge-green">Resolved</span>' : '<span class="badge badge-warn">Open</span>'}<span class="rv-time">${escH(rvFmt(c.at))}</span></div>
    <div class="rv-c-t">${escH(c.text)}</div><div class="rv-c-a"><button type="button" class="btn btn-secondary btn-sm" onclick="rvResolve('${escH(c.id)}')">${c.resolved ? 'Reopen comment' : 'Mark resolved'}</button>${canDelete ? `<button type="button" class="btn btn-danger-outline btn-sm" onclick="rvDelete('${escH(c.id)}')">Delete</button>` : ''}</div></div>`;
}
function rvRenderBoxes() {
  const cfg = rvCfg();
  RV_SECTIONS.forEach(([key, label, cardId]) => {
    const card = rvEl(cardId), body = card && card.querySelector('.card-body'); if (!body) return;
    let box = body.querySelector(':scope > .rv-box');
    if (!box) { box = document.createElement('div'); box.className = 'rv-box'; box.dataset.sec = key; body.appendChild(box); }
    const keep = {}; box.querySelectorAll('textarea').forEach(t => { keep[t.id] = t.value; });
    const list = rvState.reviews.filter(c => c.section === key), open = list.filter(c => !c.resolved).length;
    box.hidden = !list.length && !cfg.on;
    let h = list.length ? `<div class="rv-title">Reviewer comments${open ? ' (' + open + ' open)' : ''}</div>` + list.map(c => rvCommentHTML(c, cfg.on)).join('') : '';
    if (cfg.on) h += rvState.rid ? `<div class="rv-add"><div class="rv-title">${list.length ? 'Add another comment' : 'Comment on ' + escH(label)}</div><textarea id="rv-new-${key}" maxlength="2000" placeholder="Write a comment for the author..." aria-label="New comment on ${escH(label)}"></textarea><button type="button" class="btn btn-primary" onclick="rvAdd('${key}')" style="margin-top:8px">Add comment</button></div>` : '<div class="rv-note">Save the record first, then comments can be added.</div>';
    box.innerHTML = h;
    Object.keys(keep).forEach(k => { const t = rvEl(k); if (t) t.value = keep[k]; });
    const hl = card.querySelector('.card-header-left'); if (hl) { let bd = hl.querySelector('.rv-badge'); if (open) { if (!bd) { bd = document.createElement('span'); bd.className = 'rv-badge'; hl.appendChild(bd); } bd.textContent = open + ' open'; } else if (bd) bd.remove(); }
  });
}
async function rvAdd(key) {
  const c = rvCfg(); if (!c.on || !c.name) { showToast('Enter your reviewer name in Settings first.', 'warning'); return; }
  const t = rvEl('rv-new-' + key), text = ((t && t.value) || '').trim().slice(0, 2000);
  if (!text) { showToast('Type a comment first.', 'warning'); return; }
  const rec = await rvMutate(r => { r.reviews = rvClean(r.reviews); r.reviews.push({ id: 'c-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), section: key, text, by: c.name, role: c.role, at: new Date().toISOString(), resolved: false }); });
  if (!rec) return; if (t) t.value = '';
  rvState.reviews = rvClean(rec.reviews); rvRenderAll(); renderRecords(); showToast('Comment added.', 'success');
}
async function rvResolve(id) {
  const rec = await rvMutate(r => { r.reviews = rvClean(r.reviews); const c = r.reviews.find(x => x.id === id); if (!c) return; c.resolved = !c.resolved; c.resolvedAt = c.resolved ? new Date().toISOString() : ''; c.resolvedBy = c.resolved ? rvActor() : ''; });
  if (!rec) return; rvState.reviews = rvClean(rec.reviews); rvRenderAll(); renderRecords();
}
function rvDelete(id) {
  showModal('Delete comment', 'Delete this comment? This cannot be undone.', async () => {
    closeModal();
    const rec = await rvMutate(r => { r.reviews = rvClean(r.reviews).filter(x => x.id !== id); });
    if (rec) { rvState.reviews = rvClean(rec.reviews); rvRenderAll(); renderRecords(); }
  }, null, 'Delete');
}
function rvCardBlock(r) {
  const list = rvClean(r && r.reviews); if (!list.length) return '';
  const open = list.filter(c => !c.resolved).length;
  return `<div class="rv-card"><div class="rv-title">Reviewer comments${open ? ' (' + open + ' open)' : ''}</div>${list.map(c => `<div style="margin-bottom:6px;font-size:0.82rem"><strong>${escH((RV_SECTIONS.find(x => x[0] === c.section) || [])[1] || '')}</strong> — ${escH(c.by || 'Reviewer')}${c.role ? ' (' + escH(c.role) + ')' : ''}, ${escH(rvFmt(c.at))} ${c.resolved ? '<span class="badge badge-green">Resolved</span>' : '<span class="badge badge-warn">Open</span>'}<div style="white-space:pre-wrap;word-break:break-word">${escH(c.text)}</div></div>`).join('')}</div>`;
}
function rvChipsHTML(r) {
  const so = rvSignoffOf(r), open = rvClean(r && r.reviews).filter(c => !c.resolved).length; let h = '';
  if (so.state === 'approved') h += `<span class="rstat rv-appr">Approved${so.approvedBy ? ' by ' + escH(so.approvedBy) : ''}</span>`; else if (so.state === 'ready') h += '<span class="rstat rv-ready">Ready for review</span>';
  if (open) h += `<span class="rstat rv-open">${open} open comment${open > 1 ? 's' : ''}</span>`;
  return h ? `<div class="chip-row">${h}</div>` : '';
}
/* ---- sign-off ---- */
function rvRenderSignoff() {
  const box = rvEl('rv-signoff'); if (!box) return; const so = rvState.signoff, cfg = rvCfg(), saved = !!rvState.rid;
  const open = rvState.reviews.filter(c => !c.resolved).length;
  let st = 'Not yet submitted for review.';
  if (so.state === 'ready') st = `<strong>Ready for review</strong>${so.readyBy ? ' — ' + escH(so.readyBy) : ''}${so.readyAt ? ', ' + escH(rvFmt(so.readyAt)) : ''}.`;
  if (so.state === 'approved') st = `<strong>Approved</strong> by ${escH(so.approvedBy || 'reviewer')}${so.approvedRole ? ' (' + escH(so.approvedRole) + ')' : ''} on ${escH(rvFmt(so.approvedAt))}. Read-only until reopened.`;
  let btn = '';
  if (so.state === 'approved') btn = '<button type="button" class="btn btn-secondary" id="rv-btn-reopen" onclick="rvReopen()">Reopen</button>';
  else if (cfg.on) btn = `<button type="button" class="btn btn-primary" id="rv-btn-approve" onclick="rvApprove()" ${saved ? '' : 'disabled'}>Approve</button>`;
  else if (so.state === 'ready') btn = '<button type="button" class="btn btn-secondary" id="rv-btn-withdraw" onclick="rvWithdraw()">Back to draft</button>';
  else btn = '<button type="button" class="btn btn-primary" id="rv-btn-ready" onclick="rvReady()">Mark ready for review</button>';
  const log = so.log.length ? `<details><summary>Sign-off log (${so.log.length})</summary>${so.log.slice().reverse().map(e => `<div>${escH(rvFmt(e.at))} — <strong>${escH(e.action)}</strong>${e.by ? ' by ' + escH(e.by) : ''}${e.role ? ' (' + escH(e.role) + ')' : ''}${e.note ? ': ' + escH(e.note) : ''}</div>`).join('')}</details>` : '';
  box.innerHTML = `<div class="rv-title">Sign-off</div><div class="rv-so-s">${st}</div>${open ? `<div class="rv-so-s">${open} open reviewer comment${open > 1 ? 's' : ''}.</div>` : ''}${btn}${cfg.on && !saved ? '<div class="rv-note" style="margin-top:6px">Open a saved record to approve it.</div>' : ''}${log}`;
}
function rvPush(r, action, extra) { const s = rvSignoffOf(r); s.log.push(Object.assign({ at: new Date().toISOString(), action }, extra || {})); s.log = s.log.slice(-50); return s; }
async function verEvent(rec, label) {
  const list = await verAll(rec.id), v = verMake(rec, new Date().toISOString()); v.label = String(label).slice(0, 80);
  const all = list.concat([v]).sort((a, b) => String(b.at).localeCompare(String(a.at)) || String(b.vid).localeCompare(String(a.vid)));
  await verWrite([v], all.slice(VER_MAX).map(x => x.vid));
}
async function rvReady() {
  if (rvBlocked()) return;
  await saveRecord(); const id = editingRecordId; if (!id) return;
  const by = rvActor(), now = new Date().toISOString();
  const rec = await rvMutate(r => { const s = rvPush(r, 'ready', { by }); s.state = 'ready'; s.readyAt = now; s.readyBy = by; r.signoff = s; }, id);
  if (!rec) return; rvState.rid = id; rvState.signoff = rvSignoffOf(rec); rvState.reviews = rvClean(rec.reviews); rvRenderAll(); renderRecords(); showToast('Marked ready for review.', 'success');
}
async function rvWithdraw() {
  const by = rvActor();
  const rec = await rvMutate(r => { const s = rvPush(r, 'withdrawn', { by }); s.state = ''; r.signoff = s; });
  if (!rec) return; rvState.signoff = rvSignoffOf(rec); rvRenderAll(); renderRecords(); showToast('Back to draft.', 'success');
}
function rvApprove() {
  const c = rvCfg(); if (!c.on || !c.name) { showToast('Turn on reviewer mode and enter your name in Settings first.', 'warning'); return; }
  if (!rvState.rid) { showToast('Open a saved record to approve it.', 'warning'); return; }
  const open = rvState.reviews.filter(x => !x.resolved).length;
  showModal('Approve record', `Approve this record as <strong>${escH(c.name)}</strong>${c.role ? ' (' + escH(c.role) + ')' : ''}? It becomes read-only until it is reopened.${open ? `<br><br><strong>${open} reviewer comment${open > 1 ? 's are' : ' is'} still open.</strong>` : ''}`, async () => {
    closeModal();
    const now = new Date().toISOString();
    const rec = await rvMutate(r => { const s = rvPush(r, 'approved', { by: c.name, role: c.role }); s.state = 'approved'; s.approvedBy = c.name; s.approvedRole = c.role; s.approvedAt = now; r.signoff = s; });
    if (!rec) return;
    try { await verEvent(rec, 'Approved by ' + c.name); } catch (e) {}
    rvState.signoff = rvSignoffOf(rec); rvRenderAll(); renderRecords(); showToast('Record approved.', 'success');
  }, null, 'Approve');
}
function rvReopen() {
  showModal('Reopen record', 'The record becomes editable again. This is written to the sign-off log and the version history.<br><br><input type="text" id="rv-reason" maxlength="200" placeholder="Reason (optional)" aria-label="Reason for reopening">', async () => {
    const reason = rvStr((rvEl('rv-reason') || {}).value, 200), by = rvActor(), c = rvCfg();
    closeModal();
    const id = rvState.rid; if (!id) return;
    const rec = await rvMutate(r => { const s = rvPush(r, 'reopened', { by, role: c.on ? c.role : '', note: reason }); s.state = ''; s.approvedBy = ''; s.approvedRole = ''; s.approvedAt = ''; r.signoff = s; }, id);
    if (!rec) return;
    try { await verEvent(rec, 'Reopened by ' + by); } catch (e) {}
    rvState.signoff = rvSignoffOf(rec); rvRenderAll(); renderRecords(); showToast('Record reopened.', 'success');
  }, null, 'Reopen');
}
/* ---- per-section completeness ---- */
function rvTarget(ids) { for (const id of ids) { const e = rvEl(id); if (e && e.offsetParent !== null) return e; } for (const id of ids) { const e = rvEl(id); if (e) return e; } return null; }
function rvSections() {
  const v = id => ((rvEl(id) || {}).value || '').trim(), any = ids => ids.some(v);
  const hopi = (typeof pcCards !== 'undefined' ? pcCards : []).some(c => { let s = ''; try { s = composeHopiSentence(c) || ''; } catch (e) {} return s.trim() || (c.answers || []).some(a => String(a || '').trim()) || String(c.custom || '').trim(); });
  const hopiT = () => document.querySelector('#pc-cards-container textarea, #pc-cards-container .chip') || rvTarget(['pk-in-pc', 'pc-dropdown']);
  const gen = [...document.querySelectorAll('[id^="gen-"]')].some(e => (e.value || '').trim());
  return [
    { name: 'Demographics', items: [
      { label: 'Name', ok: !!v('d-name'), card: 'sec-demographics', t: () => rvTarget(['d-name']) },
      { label: 'Age', ok: !!v('d-age'), card: 'sec-demographics', t: () => rvTarget(['d-age']) },
      { label: 'Sex', ok: !!v('d-sex'), card: 'sec-demographics', t: () => rvTarget(['d-sex']) }] },
    { name: 'History', items: [
      { label: 'Presenting complaint', ok: pcCards.length > 0, card: 'sec-history', t: () => rvTarget(['pk-in-pc', 'pc-dropdown']) },
      { label: 'HOPI', ok: !!hopi, card: 'sec-history', t: hopiT },
      { label: 'Past history', ok: any(['pmh-medical', 'pmh-surgical', 'pmh-custom', 'comorbid-narrative']) || (typeof comorbidItems !== 'undefined' && comorbidItems.length > 0), card: 'sec-history', t: () => rvTarget(['pmh-medical']) },
      { label: 'Drug history', ok: !!v('pmh-drugs'), card: 'sec-history', t: () => rvTarget(['pmh-drugs']) },
      { label: 'Allergies', ok: !!v('pmh-allergies'), card: 'sec-history', t: () => rvTarget(['pmh-allergies']) }] },
    { name: 'Examination', items: [
      { label: 'Vital signs', ok: any(['vs-bp', 'vs-pulse', 'vs-rr', 'vs-spo2', 'vs-temp', 'vs-gcs']), card: 'sec-exam', t: () => rvTarget(['vs-bp']) },
      { label: 'General examination', ok: gen, card: 'sec-exam', t: () => rvTarget(['gen-appearance']) },
      { label: 'At least one system', ok: examItems.length > 0, card: 'sec-exam', t: () => rvTarget(['exam-dropdown']) }] },
    { name: 'Investigations', items: [{ label: 'At least one investigation', ok: investItems.length > 0, card: 'sec-investigations', t: () => rvTarget(['pk-in-invest', 'invest-dropdown']) }] },
    { name: 'Plan', items: [{ label: 'Primary diagnosis', ok: !!v('dx-primary'), card: 'sec-treatment', t: () => rvTarget(['dx-primary']) }] }
  ];
}
function rvGo(it) {
  const c = rvEl(it.card); if (c) c.classList.add('open');
  const f = it.t(); if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => { try { f.focus({ preventScroll: true }); } catch (e) {} }, 350); }
}
function rvRenderComplete() {
  const box = rvEl('rv-complete'); if (!box) return;
  const secs = rvSections(); let done = 0, total = 0;
  secs.forEach(s => { s.items.forEach(i => { total++; if (i.ok) done++; }); });
  const html = `<div class="rv-title">Section completeness <span style="text-transform:none;letter-spacing:0;font-weight:600;color:var(--text-muted)">— ${done} of ${total} key items</span></div>` +
    secs.map((s, si) => { const ok = s.items.filter(i => i.ok).length, miss = s.items.map((i, ii) => [i, ii]).filter(x => !x[0].ok);
      return `<div class="rvc-row" data-sec="${escH(s.name)}"><div class="rvc-h"><strong>${escH(s.name)}</strong><span class="rvc-n ${miss.length ? 'part' : 'ok'}">${ok} of ${s.items.length}</span></div>${miss.length ? `<div class="rvc-miss">${miss.map(([i, ii]) => `<button type="button" class="rvc-btn" data-s="${si}" data-i="${ii}" aria-label="${escH(i.label)}: missing, tap to go to it">${escH(i.label)}</button>`).join('')}</div>` : '<div class="rvc-done">✓ All key items recorded</div>'}</div>`; }).join('');
  // Do not rebuild identical markup: a rebuild between pointerdown and pointerup (a blur-triggered refresh)
  // would swallow the tap on a missing-item button.
  if (box.__rvHtml === html) return;
  box.__rvHtml = html; box.innerHTML = html;
  box.querySelectorAll('.rvc-btn').forEach(b => { b.onclick = () => rvGo(secs[+b.dataset.s].items[+b.dataset.i]); });
}
/* ---- print ---- */
function rvPrintHTML(rec, cfg) {
  let h = ''; const so = rvSignoffOf(rec);
  if (so.state === 'approved') h += `<div class="print-section"><div class="print-section-title">APPROVAL</div><div class="print-row"><span class="print-label">Approved by:</span> ${escH(so.approvedBy || 'reviewer')}${so.approvedRole ? ' (' + escH(so.approvedRole) + ')' : ''} on ${escH(rvFmt(so.approvedAt))}</div></div>`;
  if (cfg && cfg.comments) {
    const rv = rvClean(rec && rec.reviews);
    if (rv.length) h += `<div class="print-section"><div class="print-section-title">REVIEWER COMMENTS</div>${rv.map(c => `<div class="print-block"><div class="print-label">${escH((RV_SECTIONS.find(x => x[0] === c.section) || [])[1] || '')} — ${escH(c.by || 'Reviewer')}${c.role ? ' (' + escH(c.role) + ')' : ''}, ${escH(rvFmt(c.at))} ${c.resolved ? '(resolved)' : '(open)'}</div><div>${escH(c.text)}</div></div>`).join('')}</div>`;
  }
  return h;
}
rvInit();
