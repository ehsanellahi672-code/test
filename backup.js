/* backup.js - Export, import and clear all. */
'use strict';

/* ============================================================
   DATABASE EXPORT / IMPORT
   ============================================================ */
async function exportDatabase() {
  try {
    const allRecords = await dbGetAll();
    const records = allRecords.filter(r => !r.deletedAt);
    if(records.length===0){showToast('No records to export.','warning');return;}
    const json=JSON.stringify({exportedAt:new Date().toISOString(),version:'2.2',records},null,2);
    const blob=new Blob([json],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');
    a.href=url; a.download=`historyosis-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    
    try { localStorage.setItem('historyosis_last_backup', new Date().toISOString()); } catch(e) {}
    showToast('Database exported.','success');
    renderRecords();
  } catch(err) { showToast('Failed to export database.', 'error'); }
}
async function exportSingleRecord(id) {
  try {
    const records = await dbGetAll();
    const record = records.find(r => r.id === id);
    if (!record) { showToast('Record not found.', 'error'); return; }
    const json = JSON.stringify(record, null, 2);
    const blob = new Blob([json], {type: 'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a');
    const mrno = (record.demographics && record.demographics.mrno) ? record.demographics.mrno.replace(/[^a-zA-Z0-9-]/g, '') : 'UNKNOWN-MR';
    const date = new Date().toISOString().split('T')[0];
    a.href = url; a.download = `${mrno}_${date}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    showToast('Single patient record exported.', 'success');
  } catch(err) { showToast('Failed to export record.', 'error'); }
}
function importDatabase(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if(!file) return;
  if(file.size > 20 * 1024 * 1024) { showToast('File is too large (>20 MB).', 'error'); return; }
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsed = parseImportPayload(JSON.parse(e.target.result));
      const valid = parsed.valid, invalidCount = parsed.invalidCount;
      if(valid.length === 0) { showToast('No valid records found to import.', 'error'); return; }

      const existing = await dbGetAll();
      let newCount = 0, duplicateCount = 0;
      valid.forEach(r => {
         if (existing.some(ex => ex.id === r.id)) duplicateCount++;
         else newCount++;
      });

      pendingImportData = { valid, existing, newCount, duplicateCount, invalidCount };
      
      let html = `<p>Found <strong>${valid.length}</strong> valid records in the file.</p>
      <ul style="margin: 10px 0 16px 20px;">
        <li>New records: <strong>${newCount}</strong></li>
        <li>Existing duplicates: <strong>${duplicateCount}</strong></li>
        <li>Invalid entries skipped: <strong>${invalidCount}</strong></li>
      </ul>`;

      if (duplicateCount > 0) {
         html += `<p style="font-weight:600; margin-bottom:8px">How should duplicates be handled?</p>
         <div class="import-options" style="display:flex; flex-direction:column; gap:6px;">
            <label><input type="radio" name="import-strategy" value="skip" checked> Skip duplicate records</label>
            <label><input type="radio" name="import-strategy" value="overwrite"> Overwrite existing records</label>
            <label><input type="radio" name="import-strategy" value="keep"> Keep both (assign new IDs)</label>
         </div>`;
      }
      
      showCustomBodyModal('Import Preview', html, executeImport, 'Import');
    } catch(err) { showToast('Invalid JSON file or format.', 'error'); }
  };
  reader.readAsText(file);
}
async function executeImport() {
  if (!pendingImportData) return;
  const { valid, existing } = pendingImportData;
  pendingImportData = null;                   // a second tap on Import now does nothing
  const stratInput = document.querySelector('input[name="import-strategy"]:checked');
  const strategy = stratInput ? stratInput.value : 'skip';
  const btn = document.getElementById('modal-confirm-btn'); if (btn) btn.disabled = true;

  const known = new Set(existing.map(e => e.id));
  let importedCount = 0, failed = false;
  try {
    for (const raw of valid) {
      const r = sanitizeImportedRecord(raw);
      if (known.has(r.id)) {
        if (strategy === 'skip') continue;
        if (strategy === 'keep') r.id = r.id + '-copy-' + Math.floor(Math.random() * 100000);
      }
      await dbPut(r); known.add(r.id); importedCount++;
    }
  } catch (err) { failed = true; }
  closeModal();
  await renderRecords();
  if (failed) showToast(`Import stopped early: ${importedCount} records were added.`, 'error');
  else showToast(`Successfully imported ${importedCount} records.`, 'success');
}
/* ============================================================
   CLEAR ALL
   ============================================================ */
function confirmClearDatabase() {
  showModal('Clear All Records', 'This permanently deletes ALL records, including recently deleted ones. Cannot be undone. Download a backup first.',
    async () => {
      try {
        await dbClear();
        await renderRecords();
        closeModal();
        showToast('All records cleared.', 'success');
      } catch(err) { showToast('Failed to clear database.', 'error'); }
    }
  );
}
