/* app.js - Start-up: runs once the page has loaded. */
'use strict';

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initDateDefaults();
  populatePCDropdown(null);
  buildPCSystemChips();
  populateExamDropdown();
  populateInvestDropdown();
  populateROSDropdown();
  populateFHDropdown();
  populateComorbidDropdown();
  initTreatmentListener();
  initPickers();
  validateTemplates();
  loadCredentials();
  updateProgress();

  loadLockSettings();
  loadLockState();
  if (lockSettings.enabled) {
      document.getElementById('btn-lock-now').style.display = 'inline-flex';
      triggerLock(true);
  }

  dbReady
    .then(() => { if (navigator.storage?.persist) navigator.storage.persist(); })
    .then(() => purgeOldDeletedRecords())
    .then(() => runMigration())
    .then(() => renderRecords())
    .catch(err => showToast('Database failed to open: ' + (err?.message || err), 'error'));

  restoreDraft();

  document.addEventListener('input', triggerAutoSave);
  document.addEventListener('change', triggerAutoSave);
  resetInactivityTimer();
});
