/* history.js - Version history dialog. */
'use strict';

async function openHistory(id) {
  let list = []; try { list = await verAll(id); } catch (e) { showToast('Could not read version history.', 'error'); return; }
  let html = list.length ? '' : '<p style="font-size:0.85rem">No earlier versions yet. A version is kept each time you save a change.</p>';
  list.forEach((v, i) => {
    const older = list[i + 1], ch = older ? verChanged(v.rec, older.rec) : null;
    const sum = !older ? (v.legacy ? 'Saved before version history existed' : 'First saved version') : (ch.length ? 'Changed: ' + ch.join(', ') : 'No section changes');
    const when = isNaN(new Date(v.at)) ? '' : new Date(v.at).toLocaleString();
    html += `<div class="ver-row"><div class="ver-top"><strong style="font-size:0.85rem">${escH(when)}</strong>${i === 0 ? '<span class="badge badge-green">Current</span>' : ''}${v.label ? `<span class="badge badge-blue">${escH(v.label)}</span>` : ''}</div><div class="ver-sum">${escH(sum)}</div>${i === 0 ? '' : `<button type="button" class="btn btn-secondary btn-sm" onclick="confirmRestoreVersion('${escH(id)}','${escH(v.vid)}')">Restore this version</button>`}</div>`;
  });
  showCustomBodyModal('Version history', html, closeModal, 'Close');
  const cancelBtn = document.querySelector('#modal-content .btn-group .btn-secondary'); if (cancelBtn) cancelBtn.remove();
}
function confirmRestoreVersion(rid, vid) {
  showModal('Restore version', 'This saves the chosen version as the current record. The present version stays in the history, so you can go back. Progress notes are kept.', () => restoreVersion(rid, vid), null, 'Restore');
}
async function restoreVersion(rid, vid) {
  try {
    const cur = (await dbGetAll()).find(r => r.id === rid && !r.deletedAt);
    const snap = (await verAll(rid)).find(v => v.vid === vid);
    if (!cur || !snap) { closeModal(); showToast('That version is no longer available.', 'error'); return; }
    if (rvIsApproved(cur)) { closeModal(); showToast('This record is approved. Reopen it before restoring a version.', 'warning'); return; }
    await verSnapshot(cur, null);                                  // make sure the present state can be restored again
    const rec = JSON.parse(JSON.stringify(snap.rec)); rec.id = rid; rec.savedAt = new Date().toISOString(); rec.progressNotes = Array.isArray(cur.progressNotes) ? cur.progressNotes : [];
    if (cur.reviews) rec.reviews = cur.reviews; if (cur.signoff) rec.signoff = cur.signoff;
    await dbPut(rec); await verSnapshot(rec, null);
    if (editingRecordId === rid) { clearFormState(); editingRecordId = rid; loadDataIntoForm(rec); updateProgress(); }
    closeModal(); await renderRecords(); showToast('Version restored.', 'success');
  } catch (e) { showToast('Could not restore that version.', 'error'); }
}
