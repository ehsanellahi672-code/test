/* settings.js - Settings dialog, backup reminder, trash (restore / purge). */
'use strict';

/* ============================================================
   SETTINGS, BACKUP & TRASH
   ============================================================ */
function getSettings() {
   try {
      const s = JSON.parse(localStorage.getItem('historyosis_settings') || 'null') || {};
      const n = Number(s.interval);
      return Object.assign({}, s, { interval: [0, 3, 7, 14].includes(n) ? n : 7 });
   } catch (e) { return { interval: 7 }; }
}
function saveSettings(settings) {
   try { localStorage.setItem('historyosis_settings', JSON.stringify(settings)); } catch(e) {}
}
function openSettings() {
   let settings = getSettings();
   if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then(p => {
          const el = document.getElementById('persist-status');
          if(el) el.innerHTML = `<strong>Status:</strong> ${p ? '<span style="color:var(--success)">Granted</span>' : '<span style="color:var(--warning)">Not Granted</span>'}`;
      }).catch(() => {
          const el = document.getElementById('persist-status');
          if (el) el.textContent = 'Status: unknown';
      });
   }
   const html = `
     <div class="field"><label>App Lock & Privacy</label>
       <button class="btn btn-secondary btn-sm" onclick="openLockSettings()">Configure App Lock</button>
       <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;margin-top:10px;cursor:pointer;font-weight:normal;color:var(--text-primary)">
         <input type="checkbox" id="set-hide-names" ${lockSettings.hideNames?'checked':''} style="width:18px;height:18px;flex-shrink:0;">
         Hide patient names in lists
       </label>
     </div>
     <hr class="divider">
     ${printSettingsHTML()}
     <hr class="divider">
     ${rvSettingsHTML()}
     <hr class="divider">
     ${appearanceSettingsHTML()}
     <hr class="divider">
     ${pwaSettingsHTML()}
     <hr class="divider">
     <div class="field"><label>Backup Reminder Interval</label>
     <select id="set-backup-interval">
       <option value="0" ${settings.interval===0?'selected':''}>Off</option>
       <option value="3" ${settings.interval===3?'selected':''}>3 days</option>
       <option value="7" ${settings.interval===7?'selected':''}>7 days</option>
       <option value="14" ${settings.interval===14?'selected':''}>14 days</option>
     </select></div>
     <div class="field"><label>Storage Persistence</label>
     <div id="persist-status" style="font-size:0.8rem;color:var(--text-muted)">Checking...</div>
     <div style="font-size:0.75rem;margin-top:4px;color:var(--text-muted)">Lowers the chance of the browser clearing data automatically if device storage is low.</div>
     </div>
     <hr class="divider">
     <div class="field"><label>About HistoryOsis</label>
     <div style="font-size:0.85rem;color:var(--text-primary)"><strong>HistoryOsis &mdash; Clinical Intake</strong> v2.2</div>
     <div style="font-size:0.8rem;margin-top:4px;color:var(--text-secondary)">Created by <strong>Ehsan Ellahi &middot; RMU49</strong>, founder of HistoryOsis Technologies.</div>
     <div style="font-size:0.75rem;margin-top:4px;color:var(--text-muted)">Works offline. Patient data stays on this device.</div>
     </div>
   `;
   showCustomBodyModal('App Settings', html, () => {
      settings.interval = parseInt(document.getElementById('set-backup-interval').value);
      printSettingsRead(settings);
      rvSettingsRead(settings);
      saveSettings(settings);
      lockSettings.hideNames = document.getElementById('set-hide-names').checked;
      saveLockSettings();
      closeModal();
      renderRecords();
   }, 'Save Settings');
   if (!(navigator.storage && navigator.storage.persisted)) {
      const el = document.getElementById('persist-status');
      if (el) el.textContent = 'Not supported by this browser';
   }
}
function updateBackupBanner(activeCount) {
   const banner = document.getElementById('backup-banner');
   const settings = getSettings();
   if (activeCount === 0 || settings.interval === 0) { banner.style.display = 'none'; return; }
   
   let lastBackup = null;
   try { lastBackup = localStorage.getItem('historyosis_last_backup'); } catch(e){}
   
   let show = false, msg = '';
   if (!lastBackup) {
       show = true; msg = 'never';
   } else {
       let diff = (Date.now() - new Date(lastBackup).getTime()) / (1000*3600*24);
       if (!isFinite(diff)) { show = true; msg = 'never'; }   // unreadable date counts as no backup
       else if (diff >= settings.interval) { show = true; msg = `${Math.max(0, Math.floor(diff))} days ago`; }
   }
   if (show) {
       document.getElementById('backup-banner-msg').innerText = `Last backup: ${msg}`;
       banner.style.display = 'flex';
   } else { banner.style.display = 'none'; }
}
function openTrash() {
    dbGetAll().then(records => {
        const trashed = records.filter(r => r.deletedAt);
        let html = trashed.length === 0 ? '<p style="font-size:0.85rem">No deleted records.</p>' : '';
        trashed.forEach(r => {
            const days = Math.floor((Date.now() - new Date(r.deletedAt).getTime()) / (1000*3600*24));
            const remains = 30 - days;
            html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:8px">
               <div>
                 <div style="font-weight:bold;font-size:0.85rem">${escH(lockSettings.hideNames ? getInitials(r.demographics?.name || 'Unknown') : (r.demographics?.name || 'Unknown'))}</div>
                 <div style="font-size:0.75rem;color:var(--text-muted)">Deletes permanently in ${remains} days</div>
               </div>
               <div style="display:flex;gap:6px">
                 <button class="btn btn-secondary btn-sm" onclick="restoreRecord('${r.id}')">Restore</button>
                 <button class="btn btn-danger-outline btn-sm" onclick="permDeleteRecord('${r.id}')">Delete</button>
               </div>
            </div>`;
        });
        showCustomBodyModal('Recently Deleted', html, closeModal, 'Close');
        const cancelBtn = document.querySelector('#modal-content .btn-group .btn-secondary');
        if (cancelBtn) cancelBtn.remove();   // "Cancel" and "Close" did the same thing
    });
}
async function purgeOldDeletedRecords() {
    try {
        const records = await dbGetAll();
        const now = Date.now();
        for (let r of records) {
            if (r.deletedAt) {
                const diff = (now - new Date(r.deletedAt).getTime()) / (1000*3600*24);
                if (diff > 30) await dbDelete(r.id);
            }
        }
    } catch(e) {}
}
async function restoreRecord(id) {
    const records = await dbGetAll();
    const rec = records.find(r => r.id === id);
    if (rec) {
        delete rec.deletedAt;
        await dbPut(rec);
        showToast('Record restored.', 'success');
        openTrash();
        renderRecords();
    }
}
async function permDeleteRecord(id) {
    showModal('Delete Permanently', 'This record will be destroyed and cannot be recovered.', async () => {
        await dbDelete(id);
        showToast('Permanently deleted.', 'success');
        openTrash();
        renderRecords();
    });
}
