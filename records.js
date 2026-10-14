/* records.js - The Records list. */
'use strict';

/* ============================================================
   RENDER SAVED RECORDS
   ============================================================ */
function recordMatchesSearch(record, term) {
  const d = record.demographics || {}; const tx = record.treatment || {}; const his = record.history || {};
  const searchTargets = [
    d.name, d.mrno, d.dept, d.bedno, d.residence, tx.primaryDx, tx.differentials, recStatusOf(record), ...recTagsOf(record),
    ...(his.pcs || []).map(pc => pc.label), ...(his.rosSelected || []), ...(his.comorbidItems || []),
    his.pmhMedical, his.pmhAllergies, ...(record.investigations?.items || []).map(i => i.name), ...(record.investigations?.items || []).map(i => i.result),
  ].filter(v => v).map(v => String(v).toLowerCase());
  return String(term).split(/\s+/).filter(Boolean).every(t => searchTargets.some(v => v.includes(t)));   // every word must appear somewhere
}
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase() + '.';
    return parts.map(p => p[0] ? p[0].toUpperCase() + '.' : '').join(' ');
}
async function renderRecords() {
  if (typeof isLocked !== 'undefined' && isLocked) return;   // list is rebuilt on unlock
  let records;
  try { records = await dbGetAll(); } catch(err) { showToast('Failed to load records.', 'error'); return; }
  if (typeof isLocked !== 'undefined' && isLocked) return;   // locked while the records were loading
  const search = (document.getElementById('search-records')?.value||'').toLowerCase();
  const container = document.getElementById('records-container');
  const label = document.getElementById('record-count-label');
  const activeRecords = records.filter(r => !r.deletedAt);
  recSyncControls(activeRecords);
  const filtered = recFilterSort(activeRecords, search.trim());
  
  updateBackupBanner(activeRecords.length);
  
  if (label) label.textContent = `${filtered.length} of ${activeRecords.length} records`;
  if (filtered.length===0 && activeRecords.length>0) {
    container.innerHTML='<div class="empty-state"><p>No records match.<br>Change the search or filters, or use "Clear search and filters".</p></div>';
    return;
  }
  if (filtered.length===0) {
    container.innerHTML=`<div class="empty-state"><div class="icon"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg></div><p>${search?'No records match your search.':'No saved records yet. Fill the Intake Form and save a patient.'}</p></div>`;
    return;
  }
  container.innerHTML='';
  filtered.forEach(record => {
   try {
    const d=record.demographics||{}; const pc=(record.history?.pcs||[]).map(p=>p.label).join(', '); const dx=record.treatment?.primaryDx||'';
    const savedAt=record.savedAt?new Date(record.savedAt).toLocaleString():''; const initial=(String(d.name||'?')[0]||'?').toUpperCase();
    const div=document.createElement('div'); div.className='record-card'; div.id='rcard-'+record.id;
    const hideMode = lockSettings.hideNames;
    const displayFullName = d.name || 'Unknown';
    const displayInitials = getInitials(displayFullName);
    div.innerHTML=`
      <div class="record-card-header" onclick="toggleRecordCard('${record.id}')">
        <div class="record-avatar">${escH(initial)}</div>
        <div style="flex:1;min-width:0">
          <div class="record-patient-name">
            <span class="patient-name-span" data-full="${escH(displayFullName)}" data-initials="${escH(displayInitials)}" data-hidden="${hideMode}">${hideMode ? escH(displayInitials) : escH(displayFullName)}</span>
            <span class="badge badge-blue" style="margin-left:5px">${escH(d.sex||'')}</span>${d.age?` <span class="badge badge-green">${escH(d.age)}${ageSuffix(d)}</span>`:''}
          </div>
          <div class="record-meta">${d.mrno?'MR: '+escH(d.mrno)+' · ':''}${d.dept?escH(d.dept)+' · ':''}Saved: ${savedAt}</div>
          ${pc?`<div class="record-meta"><em>${escH(pc.slice(0,80))}</em></div>`:''}
          ${dx?`<div class="record-dx">⊕ ${escH(dx)}</div>`:''}
          ${recChipsHTML(record)}
          ${rvChipsHTML(record)}
        </div>
        <div class="chevron">▼</div>
      </div>
      <div class="record-card-body">
        <div class="record-actions">
          <button class="btn btn-primary btn-sm" onclick="editRecord('${record.id}')">Edit</button>
          <button class="btn btn-secondary btn-sm" onclick="copyEMR('${record.id}')">Copy EMR</button>
          <button class="btn btn-secondary btn-sm" onclick="exportSingleRecord('${record.id}')">Export</button>
          <button class="btn btn-secondary btn-sm" onclick="printRecord('${record.id}')">Print</button>
          <button class="btn btn-secondary btn-sm" onclick="shareRecord('${record.id}')">Share</button>
          <button class="btn btn-secondary btn-sm" onclick="openHistory('${record.id}')">History</button>
          <button class="btn btn-danger-outline btn-sm" onclick="deleteRecord('${record.id}')">Delete</button>
          <div style="flex:1;min-width:20px;"></div>
          <button class="btn btn-secondary btn-sm" onclick="openSOAPModal('${record.id}')">Add SOAP</button>
          <button class="btn btn-secondary btn-sm" onclick="openTxModal('${record.id}')">Update Tx</button>
        </div>
        <div class="record-detail">${buildSummaryHTML(record)}</div>
        ${rvCardBlock(record)}
      </div>`;
    container.appendChild(div);
   } catch (err) {
    const bad=document.createElement('div'); bad.className='record-card';
    const sid=escH(String(record && record.id));
    bad.innerHTML=`<div class="record-card-header"><div style="flex:1;min-width:0"><div class="record-patient-name">Unreadable record</div><div class="record-meta">ID: ${sid}. Its data is damaged, so it cannot be shown.</div></div></div><div class="record-actions" style="padding:0 14px 12px"><button class="btn btn-danger-outline btn-sm" onclick="deleteRecord('${sid}')">Delete</button></div>`;
    container.appendChild(bad);
   }
  });
}
function toggleRecordCard(id) { 
  const c=document.getElementById('rcard-'+id); 
  if(c) {
    const isOpen = c.classList.toggle('open');
    const nameSpan = c.querySelector('.patient-name-span');
    if (nameSpan && nameSpan.dataset.hidden === 'true') {
        nameSpan.textContent = isOpen ? nameSpan.dataset.full : nameSpan.dataset.initials;
    }
  }
}
async function editRecord(id) {
  let records;
  try { records = await dbGetAll(); } catch(err) { showToast('Failed to load records.', 'error'); return; }
  const record = records.find(r=>r.id===id); if (!record) { showToast('Record not found.', 'error'); return; }
  clearFormState(); editingRecordId = record.id; loadDataIntoForm(record); switchTab('form');
  document.querySelectorAll('.card').forEach(c=>c.classList.remove('open')); document.getElementById('sec-demographics').classList.add('open');
  updateProgress(); showToast(`Editing: ${record.demographics?.name||'Patient'}`, 'success');
}
function deleteRecord(id) {
  showModal('Delete Record', 'Move this record to recently deleted?', async () => {
    try {
        const records = await dbGetAll();
        const rec = records.find(r => r.id === id);
        if (rec) {
            rec.deletedAt = new Date().toISOString();
            await dbPut(rec); await renderRecords();
            closeModal(); showToast('Record moved to trash.', 'success');
        }
    } catch(err) { showToast('Failed to delete record.', 'error'); }
  }, null, 'Delete');
}
