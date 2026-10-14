/* ui.js - Toasts, modal dialogs, pinch-zoom guard. */
'use strict';

/* ============================================================
   MODALS & SOAP
   ============================================================ */
function showToast(msg, type='') {
  const c=document.getElementById('toast-container'); const t=document.createElement('div');
  t.className=`toast ${type}`;t.textContent=msg; c.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transform='translateY(12px)';t.style.transition='0.3s';},2600);
  setTimeout(()=>t.remove(),3000);
}
function showModal(title, body, onConfirm, onAlt, confirmLabel='Confirm', altLabel=null) {
  const overlay=document.getElementById('modal-overlay'); const content=document.getElementById('modal-content');
  const altBtn=altLabel?`<button class="btn btn-warning" id="modal-alt-btn">${escH(altLabel)}</button>`:'';
  content.innerHTML=`<h3>${escH(title)}</h3><p>${body}</p><div class="btn-group"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button>${altBtn}<button class="btn btn-primary" id="modal-confirm-btn">${escH(confirmLabel)}</button></div>`;
  overlay.style.display='flex'; document.getElementById('modal-confirm-btn').onclick=onConfirm; if(altLabel&&onAlt)document.getElementById('modal-alt-btn').onclick=onAlt;
}
function showCustomBodyModal(title, bodyHTML, onConfirm, confirmLabel='Save') {
  const overlay=document.getElementById('modal-overlay'); const content=document.getElementById('modal-content');
  content.innerHTML=`<h3>${escH(title)}</h3><div style="max-height:60vh;overflow-y:auto;padding-right:4px;margin-bottom:20px;">${bodyHTML}</div><div class="btn-group"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" id="modal-confirm-btn">${escH(confirmLabel)}</button></div>`;
  overlay.style.display='flex'; document.getElementById('modal-confirm-btn').onclick=onConfirm;
}
function closeModal(event) {
  if(event&&event.target!==document.getElementById('modal-overlay'))return;
  document.getElementById('modal-overlay').style.display='none';
  document.getElementById('modal-overlay').style.zIndex='';
  pendingImportData = null;   // cancelled import: release the parsed file
}
/* openSOAPModal is defined in the Prompt 9 block (reference panel, today's vitals, NEWS2, problems list) */

async function openTxModal(recordId) {
  try { const r = (await dbGetAll()).find(x => x.id === recordId); if (r && rvIsApproved(r)) { showToast('This record is approved and read-only. Reopen it first.', 'warning'); return; } } catch (e) {}
  const bodyHTML = `<div class="field"><label>Treatment Update</label><textarea id="tx-update" placeholder="New medications, procedures, conservative management updates..."></textarea></div>`;
  showCustomBodyModal('Update Treatment', bodyHTML, () => { saveTxUpdate(recordId); closeModal(); }, 'Save');
}
/* saveSOAPNote is defined in the Prompt 9 block */

async function saveTxUpdate(recordId) {
    try {
        const records = await dbGetAll(); const record = records.find(r => r.id === recordId);
        if (!record) { showToast('Record not found.', 'error'); return; }
        if (rvIsApproved(record)) { showToast('This record is approved and read-only. Reopen it first.', 'warning'); return; }
        if (!record.progressNotes) record.progressNotes = [];
        const tx = document.getElementById('tx-update').value.trim();
        if (!tx) { showToast('Cannot save empty update.', 'warning'); return; }
        record.progressNotes.push({ timestamp: new Date().toISOString(), type: 'Treatment', payload: tx });
        await dbPut(record); await renderRecords(); showToast('Note added', 'success');
    } catch(err) { showToast('Failed to save treatment update.', 'error'); }
}
/* ============================================================
   GESTURE LOGIC
   ============================================================ */
let _pinchStartDist = null; let _pinchStartTime = null;
document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        _pinchStartDist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
        _pinchStartTime = Date.now();
    }
}, {passive: true});
document.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && _pinchStartDist && _pinchStartTime) {
        const curDist = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
        const timeElapsed = Date.now() - _pinchStartTime;
        if (_pinchStartDist - curDist > 75 && timeElapsed < 350) { 
            document.activeElement?.blur(); _pinchStartDist = null; _pinchStartTime = null;
        }
    }
}, {passive: true});
document.addEventListener('touchend', () => { _pinchStartDist = null; _pinchStartTime = null; });
