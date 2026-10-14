/* form.js - The intake form: state, draft autosave, loading and collecting a record, saving, navigation, credentials. */
'use strict';

/* ============================================================
   AUTO-SAVE DRAFT
   ============================================================ */
let autoSaveTimeout = null;
function triggerAutoSave() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        if (rvIsLocked()) return;
        const data = collectFormData();
        data._editingId = editingRecordId || null;
        try { localStorage.setItem('historyosis_draft', JSON.stringify(data)); } catch (e) {}
    }, 1500);
}
function restoreDraft() {
    try {
        const draftJSON = localStorage.getItem('historyosis_draft');
        if (draftJSON) {
            const draft = JSON.parse(draftJSON);
            if (draft && Object.keys(draft).length > 0) {
                editingRecordId = (typeof draft._editingId === 'string' && /^[\w-]+$/.test(draft._editingId)) ? draft._editingId : null;
                loadDataIntoForm(draft);
            }
        }
    } catch (e) { console.error('Failed to restore draft:', e); }
}
function loadDataIntoForm(record) {
    setTimeout(() => rvRefresh(), 0);                       // review comments and sign-off live on the saved record
    const set = (eid,val) => { const el=document.getElementById(eid); if(el)el.value=val||''; };
    const d=record.demographics||{};
    set('d-name',d.name);set('d-mrno',d.mrno);set('d-age',d.age);set('d-age-unit',d.ageUnit);set('d-sex',d.sex);
    set('d-bedno',d.bedno);set('d-dept',d.dept);set('d-admit-via',d.admitVia);
    set('d-occupation',d.occupation);set('d-residence',d.residence);
    set('d-date-admission',d.dateAdmission);set('d-time-admission',d.timeAdmission);
    set('d-informant',d.informant);set('d-custom',d.custom);
    checkReproHistory();
    const h=record.history||{};
    pcCards=JSON.parse(JSON.stringify(h.pcs||[]));
    pcCards.forEach((c,i)=>{ if(!c.id || !/^[\w-]+$/.test(String(c.id))) c.id='pc-'+Date.now()+'-'+i; });
    renderPCCards();
    rosItems = JSON.parse(JSON.stringify(h.rosSelected || [])); renderROSItems();
    set('ros-narrative',h.rosNarrative);set('ros-custom',h.rosCustom);
    comorbidItems = JSON.parse(JSON.stringify(h.comorbidItems || [])); renderComorbidItems();
    set('comorbid-narrative', h.comorbidNarrative);
    set('pmh-medical',h.pmhMedical);set('pmh-surgical',h.pmhSurgical);
    set('pmh-drugs',h.pmhDrugs);set('pmh-allergies',h.pmhAllergies);
    set('pmh-immunisation',h.pmhImmunisation);set('pmh-custom',h.pmhCustom);
    fhItems = JSON.parse(JSON.stringify(h.fhSelected || [])); renderFHItems();
    set('fh-narrative',h.fhNarrative);set('fh-custom',h.fhCustom);
    const rep=h.repro||{};
    set('repro-menarche',rep.menarche);set('repro-lmp',rep.lmp);
    set('repro-obstetric',rep.obstetric);set('repro-contraception',rep.contraception);
    set('repro-screening',rep.screening);set('repro-custom',rep.custom);set('repro-preg',rep.pregnancy);
    const pd=h.paeds||{}; set('pd-birth',pd.birth);set('pd-feeding',pd.feeding);set('pd-development',pd.development);set('pd-immunisation',h.pmhImmunisation);
    const sh=h.sh||{};
    set('sh-smoking',sh.smoking);set('sh-smoking-detail',sh.smokingDetail);
    set('sh-alcohol',sh.alcohol);set('sh-drugs',sh.drugs);
    set('sh-diet',sh.diet);set('sh-exercise',sh.exercise);
    set('sh-travel',sh.travel);set('sh-living',sh.living);
    set('sh-adl',sh.adl);set('sh-custom',sh.custom);
    const ex=record.exam||{};
    const v=ex.vitals||{};
    set('vs-bp',v.bp);set('vs-pulse',v.pulse);set('vs-rr',v.rr);
    set('vs-spo2',v.spo2);set('vs-temp',v.temp);set('vs-gcs',v.gcs);
    set('vs-o2',v.o2);set('vs-consc',v.consciousness);
    { const sc=document.getElementById('vs-scale2'); if(sc) sc.checked = v.spo2Scale2==='Yes'; }
    set('vs-height',v.height);set('vs-weight',v.weight);set('vs-bmi',v.bmi);set('pd-weight',v.weight);
    const gen=ex.general||{};
    set('gen-appearance',gen.appearance);set('gen-pallor',gen.pallor);
    set('gen-jaundice',gen.jaundice);set('gen-cyanosis',gen.cyanosis);
    set('gen-clubbing',gen.clubbing);set('gen-lymph',gen.lymph);
    set('gen-oedema',gen.oedema);set('gen-other',gen.other);
    set('exam-custom',ex.custom);
    examItems=JSON.parse(JSON.stringify(ex.systems||[]));
    examItems.forEach(migrateExamFindings);
    renderExamCards();
    investItems=JSON.parse(JSON.stringify(record.investigations?.items||[])); renderInvestItems();
    set('invest-summary',record.investigations?.summary);
    const tx=record.treatment||{};
    set('dx-primary',tx.primaryDx);set('dx-differentials',tx.differentials);
    treatItems=JSON.parse(JSON.stringify(tx.items||[])); renderTreatItems();
    set('treat-monitoring',tx.monitoring);set('treat-discharge',tx.discharge);
    set('treat-counselling',tx.counselling);
    const cred = record.credentials||{};
    set('cred-role', cred.role||'Student'); set('cred-name', cred.name);
    set('cred-roll', cred.roll); set('cred-year', cred.year); set('cred-ward', cred.ward); set('cred-supervisor', cred.supervisor);
    recTags = recCleanTags(record.tags); renderTagChips(); set('d-tag-input', ''); set('d-status', recStatusOf(record));
    set('cred-designation', cred.designation); set('cred-department', cred.department);
    restoreCarryState(record.carriedForward);
    toggleCredFields();
    
    calcShockIndex(true);
    calcBMI(true);
    updateProgress();
    if (typeof updateVitalsAssessment==='function') { checkReproHistory(); updateVitalsAssessment(); updateAllergyAndChecklist(); }
}
/* ============================================================
   STATE
   ============================================================ */
let pcCards = []; let carryState = null; let recTags = [];   // carryState: history carried forward from an earlier record (Prompt 9)
let examItems = [];
let investItems = [];
let treatItems = [];
let comorbidItems = [];
let rosItems = [];
let fhItems = [];
let editingRecordId = null;
let isRoundView = false;
let pendingImportData = null;
function initDateDefaults() {
  const now = new Date();
  document.getElementById('d-date-admission').value = now.toISOString().split('T')[0];
  document.getElementById('d-time-admission').value = now.toTimeString().slice(0,5);
}
/* ============================================================
   ROUND VIEW TOGGLE LOGIC
   ============================================================ */
function toggleRoundView() {
  isRoundView = !isRoundView;
  const body = document.body;
  const banner = document.getElementById('round-view-banner');
  const btn = document.getElementById('round-toggle-btn');
  if (isRoundView) {
    body.classList.add('round-view-active');
    banner.style.display = 'block';
    btn.classList.add('active');
    document.getElementById('sec-exam').classList.add('open');
    document.getElementById('sec-investigations').classList.add('open');
    document.getElementById('sec-treatment').classList.add('open');
    showToast('Round View Activated', 'success');
  } else {
    body.classList.remove('round-view-active');
    banner.style.display = 'none';
    btn.classList.remove('active');
    showToast('Round View Deactivated', '');
  }
}
/* ============================================================
   TABS & ACCORDION
   ============================================================ */
function switchTab(tab) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('tab-btn-' + tab).classList.add('active');
  if (tab === 'records') renderRecords();
  if (tab === 'form') updateProgress();
}
function toggleCard(id) { document.getElementById(id).classList.toggle('open'); }
/* ============================================================
   PROGRESS & METRICS
   ============================================================ */
function updateProgress() {
  const keys = ['d-name','d-age','d-sex','d-dept','d-mrno'];
  let filled = keys.filter(id => { const el = document.getElementById(id); return el && el.value.trim(); }).length;
  if (pcCards.length > 0) filled++;
  if (document.getElementById('pmh-medical')?.value.trim()) filled++;
  if (examItems.length > 0 || document.getElementById('vs-bp')?.value.trim()) filled++;
  if (investItems.length > 0) filled++;
  if (document.getElementById('dx-primary')?.value.trim()) filled++;
  const pct = Math.round((filled / 10) * 100);
  document.getElementById('progress-fill').style.width = pct + '%';
  const pbar = document.querySelector('.progress-bar'); if (pbar) pbar.setAttribute('aria-valuenow', String(pct));
  document.getElementById('progress-pct').textContent = pct + '%';
  updateDot('dot-demographics', ['d-name','d-age','d-sex'].every(id => document.getElementById(id)?.value.trim()));
  updateDot('dot-history', pcCards.length > 0);
  updateDot('dot-exam', examItems.length > 0 || document.getElementById('vs-bp')?.value.trim());
  updateDot('dot-investigations', investItems.length > 0);
  updateDot('dot-treatment', document.getElementById('dx-primary')?.value.trim());
  updateDot('dot-credentials', document.getElementById('cred-name')?.value.trim());
  if (typeof updateVitalsAssessment === 'function') { updateVitalsAssessment(); updateAllergyAndChecklist(); }
  if (typeof rvRenderComplete === 'function') rvRenderComplete();
}
function updateDot(id, cond) { const d = document.getElementById(id); if (d) d.classList.toggle('done', !!cond); }
function checkReproHistory() {
  const sex = document.getElementById('d-sex').value;
  document.getElementById('repro-section').style.display = sex === 'Female' ? 'block' : 'none';
  updatePaedsAndPregnancy();
}
function onAgeSexChange() { updateProgress(); checkReproHistory(); }
function ageSuffix(d, bare) {                  // text after the number in the summary, print view, records list and EMR
  const u = d && d.ageUnit;
  return u === 'months' ? ' months' : u === 'days' ? ' days' : (bare ? '' : ' yr');
}
function formAgeYears() { return ageToYears((document.getElementById('d-age') || {}).value, (document.getElementById('d-age-unit') || {}).value); }
function isPaediatricForm() { const y = formAgeYears(); return y !== null && y < 16; }
function pregnancyAskable() { const sex = (document.getElementById('d-sex') || {}).value; const y = formAgeYears(); return sex === 'Female' && (y === null || (y >= 12 && y <= 55)); }
function updatePaedsAndPregnancy() {
  const ps = document.getElementById('paeds-section'); if (!ps) return;
  ps.style.display = isPaediatricForm() ? 'block' : 'none';
  const pf = document.getElementById('repro-preg-field'); if (pf) pf.style.display = pregnancyAskable() ? '' : 'none';
  const wf = document.getElementById('pd-weight-field'), pw = document.getElementById('pd-weight');
  if (wf && pw) wf.classList.toggle('need-value', isPaediatricForm() && !pw.value.trim());
}
/* ============================================================
   CREDENTIALS
   ============================================================ */
function toggleCredFields() {
    const role = document.getElementById('cred-role').value;
    document.getElementById('cred-student-fields').style.display = role === 'Student' ? 'grid' : 'none';
    document.getElementById('cred-doctor-fields').style.display = role === 'Doctor' ? 'grid' : 'none';
}
function saveCredentials() {
    const cred = { role: document.getElementById('cred-role').value, name: document.getElementById('cred-name').value, roll: document.getElementById('cred-roll').value, year: document.getElementById('cred-year').value, ward: document.getElementById('cred-ward').value, designation: document.getElementById('cred-designation').value, department: document.getElementById('cred-department').value, supervisor: (document.getElementById('cred-supervisor') || {}).value || '' };
    localStorage.setItem('historyosis_credentials', JSON.stringify(cred)); updateProgress();
}
function loadCredentials() {
    const c = JSON.parse(localStorage.getItem('historyosis_credentials')) || { role: 'Student', name: 'Ehsan Ellahi', roll: 'RMU49', year: 'Final Year', ward: '', designation: '', department: '' };
    document.getElementById('cred-role').value = c.role || 'Student'; document.getElementById('cred-name').value = c.name || ''; document.getElementById('cred-roll').value = c.roll || ''; document.getElementById('cred-year').value = c.year || ''; document.getElementById('cred-ward').value = c.ward || ''; document.getElementById('cred-designation').value = c.designation || ''; document.getElementById('cred-department').value = c.department || ''; { const sv = document.getElementById('cred-supervisor'); if (sv) sv.value = c.supervisor || ''; } toggleCredFields();
}
/* ============================================================
   AUTOFILL & CLEAR
   ============================================================ */
function markUnremarkable() {
  const idDefaults = {
    'gen-lymph': 'No palpable lymphadenopathy', 'gen-oedema': 'No peripheral oedema', 'gen-other': 'No other peripheral stigmata',
    'vs-gcs': '15 (E4V5M6)', 'ros-narrative': 'No other significant symptoms reported.', 'comorbid-narrative': 'No known comorbidities.',
    'pmh-medical': 'No significant past medical history.', 'pmh-surgical': 'No significant past surgical history.', 'pmh-drugs': 'No regular medications.',
    'pmh-allergies': 'No known drug allergies (NKDA).', 'pmh-immunisation': 'Up to date.', 'fh-narrative': 'No significant family history.',
    'repro-menarche': 'Unremarkable', 'repro-obstetric': 'Unremarkable', 'repro-contraception': 'None', 'repro-screening': 'Up to date',
    'sh-smoking-detail': 'Non-smoker', 'sh-travel': 'No recent travel.', 'sh-living': 'Independent.', 'sh-adl': 'Fully independent.',
    'exam-custom': 'Systemic examination unremarkable.', 'invest-summary': 'No significant abnormalities.',
    'treat-monitoring': 'Routine monitoring.', 'treat-discharge': 'Discharge when clinically stable.', 'treat-counselling': 'Standard care advice given.'
  };
  const smartDefaults = [ { match: /breath sounds/i, value: 'Vesicular breath sounds, no added sounds' }, { match: /added sounds/i, value: 'No added sounds' }, { match: /percussion/i, value: 'Resonant throughout' }, { match: /murmurs/i, value: 'No murmurs detected' }, { match: /peripheral pulses/i, value: 'Present and equal bilaterally' }, { match: /cranial nerves/i, value: 'Grossly intact' }, { match: /motor/i, value: 'Normal tone and power' }, { match: /sensory/i, value: 'Intact' }, { match: /reflexes/i, value: '2+ and symmetrical' }, { match: /tenderness/i, value: 'No tenderness or guarding' } ];
  const fire = el => { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
  const isFemale = g('d-sex') === 'Female'; let count = 0;
  Object.keys(idDefaults).forEach(id => {
    if (id.startsWith('repro-') && !isFemale) return;
    const el = document.getElementById(id); if (el && !el.value.trim()) { el.value = idDefaults[id]; fire(el); count++; }
  });
  document.querySelectorAll('#exam-cards-container input[type="text"], #exam-cards-container textarea').forEach(el => {
    if (el.value.trim()) return;
    const labelText = (el.closest('.field')?.querySelector('label')?.textContent || '');
    if (/additional|risk assessment|nodule|mass/i.test(labelText)) return;
    const hit = smartDefaults.find(p => p.match.test(labelText)); el.value = hit ? hit.value : 'Unremarkable'; fire(el); count++;
  });
  showToast(count ? `Marked ${count} empty field${count>1?'s':''} as unremarkable.` : 'No empty fields to fill.', count ? 'success' : '');
  triggerAutoSave();
}
function clearFormState() {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  pcCards=[]; examItems=[]; investItems=[]; treatItems=[]; comorbidItems=[]; rosItems=[]; fhItems=[]; editingRecordId=null; carryState=null; recTags=[]; if (typeof renderTagChips === 'function') renderTagChips(); if (typeof rvReset === 'function') rvReset(); if (typeof renderCarryMarks === 'function') { renderCarryMarks(); hideCarryOffer(); }
  document.getElementById('pc-cards-container').innerHTML=''; document.getElementById('exam-cards-container').innerHTML=''; document.getElementById('invest-container').innerHTML=''; document.getElementById('treatment-container').innerHTML=''; document.getElementById('comorbid-container').innerHTML=''; document.getElementById('ros-container').innerHTML=''; document.getElementById('fh-container').innerHTML='';
  localStorage.removeItem('historyosis_draft');
}
function clearForm() {
  showModal('Clear Form', 'Clear all entered data? Saved records are not affected.', () => {
      clearFormState();
      document.querySelectorAll('#tab-form input:not([readonly]):not([type="checkbox"]):not([type="file"]), #tab-form select, #tab-form textarea').forEach(el => { if (el.tagName==='SELECT') el.selectedIndex=0; else el.value=''; });
      document.querySelectorAll('#tab-form input[type="checkbox"]').forEach(cb => cb.checked=false); document.getElementById('repro-section').style.display='none';
      document.getElementById('summary-view').innerHTML='<div class="empty-state"><div class="icon"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div><p>Click <strong>Refresh Preview</strong> to see the summary.</p></div>';
      initDateDefaults(); loadCredentials(); updateProgress(); closeModal(); showToast('Form cleared.', 'success');
  });
}
function newIntake() {
  if (editingRecordId || pcCards.length > 0 || investItems.length > 0 || document.getElementById('d-name').value.trim()) {
    showModal('New Intake', 'Start a new blank intake form? Unsaved data will be lost.', () => {
        clearFormState();
        document.querySelectorAll('#tab-form input:not([readonly]):not([type="checkbox"]):not([type="file"]), #tab-form select, #tab-form textarea').forEach(el => { if(el.tagName==='SELECT')el.selectedIndex=0; else el.value=''; });
        document.querySelectorAll('#tab-form input[type="checkbox"]').forEach(cb => cb.checked=false); document.getElementById('repro-section').style.display='none';
        document.getElementById('summary-view').innerHTML='<div class="empty-state"><div class="icon"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div><p>Click <strong>Refresh Preview</strong> to see the summary.</p></div>';
        initDateDefaults(); loadCredentials(); updateProgress(); closeModal(); switchTab('form');
        document.getElementById('sec-demographics').classList.add('open'); showToast('New intake started.', 'success');
    });
  } else {
    switchTab('form'); document.getElementById('sec-demographics').classList.add('open'); showToast('New intake form ready.', 'success');
  }
}
function collectFormData() {
  const out = {
    id: editingRecordId || ('rec-'+Date.now()), savedAt: new Date().toISOString(),
    dataVersion: (typeof medicalDataPools === 'object' && medicalDataPools && +medicalDataPools.dataVersion) || 0,
    demographics: { name:g('d-name'),mrno:g('d-mrno'),age:g('d-age'),ageUnit:g('d-age-unit'),sex:g('d-sex'), bedno:g('d-bedno'),dept:g('d-dept'),admitVia:g('d-admit-via'), occupation:g('d-occupation'),residence:g('d-residence'), dateAdmission:g('d-date-admission'),timeAdmission:g('d-time-admission'), informant:g('d-informant'),custom:g('d-custom') },
    history: { pcs:JSON.parse(JSON.stringify(pcCards)), rosSelected:JSON.parse(JSON.stringify(rosItems)), rosNarrative:g('ros-narrative'), rosCustom:g('ros-custom'), comorbidItems:JSON.parse(JSON.stringify(comorbidItems)), comorbidNarrative:g('comorbid-narrative'), pmhMedical:g('pmh-medical'),pmhSurgical:g('pmh-surgical'), pmhDrugs:g('pmh-drugs'),pmhAllergies:g('pmh-allergies'), pmhImmunisation:g('pmh-immunisation'),pmhCustom:g('pmh-custom'), fhSelected:JSON.parse(JSON.stringify(fhItems)),fhNarrative:g('fh-narrative'),fhCustom:g('fh-custom'), repro:{menarche:g('repro-menarche'),lmp:g('repro-lmp'),obstetric:g('repro-obstetric'),contraception:g('repro-contraception'),screening:g('repro-screening'),custom:g('repro-custom'),pregnancy:g('repro-preg')}, paeds:{birth:g('pd-birth'),feeding:g('pd-feeding'),development:g('pd-development')}, sh:{smoking:g('sh-smoking'),smokingDetail:g('sh-smoking-detail'),alcohol:g('sh-alcohol'),drugs:g('sh-drugs'),diet:g('sh-diet'),exercise:g('sh-exercise'),travel:g('sh-travel'),living:g('sh-living'),adl:g('sh-adl'),custom:g('sh-custom')} },
    exam: { vitals:{bp:g('vs-bp'),pulse:g('vs-pulse'),rr:g('vs-rr'),spo2:g('vs-spo2'),temp:g('vs-temp'),gcs:g('vs-gcs'),height:g('vs-height'),weight:g('vs-weight'),bmi:g('vs-bmi'),o2:g('vs-o2'),consciousness:g('vs-consc'),spo2Scale2:(document.getElementById('vs-scale2')||{}).checked?'Yes':'',news2:news2Stored().score,news2Band:news2Stored().band,news2Partial:news2Stored().partial}, general:{appearance:g('gen-appearance'),pallor:g('gen-pallor'),jaundice:g('gen-jaundice'),cyanosis:g('gen-cyanosis'),clubbing:g('gen-clubbing'),lymph:g('gen-lymph'),oedema:g('gen-oedema'),other:g('gen-other')}, systems:JSON.parse(JSON.stringify(examItems)),custom:g('exam-custom') },
    investigations:{items:JSON.parse(JSON.stringify(investItems)),summary:g('invest-summary')},
    treatment:{primaryDx:g('dx-primary'),differentials:g('dx-differentials'),items:JSON.parse(JSON.stringify(treatItems)),monitoring:g('treat-monitoring'),discharge:g('treat-discharge'),counselling:g('treat-counselling')},
    credentials:{role:g('cred-role'),name:g('cred-name'),roll:g('cred-roll'),year:g('cred-year'),ward:g('cred-ward'),designation:g('cred-designation'),department:g('cred-department'),supervisor:g('cred-supervisor')}
  };
  if (carryState) out.carriedForward = JSON.parse(JSON.stringify(carryState));
  const tg = recTagsForSave(); if (tg.length) out.tags = tg;
  const stt = g('d-status'); if (REC_STATUSES.includes(stt)) out.status = stt;
  return out;
}
async function saveRecord() {
  if (rvBlocked()) return;
  const name = document.getElementById('d-name').value.trim();
  if (!name) { showToast('Enter patient name before saving.', 'error'); return; }
  const data = collectFormData(); data.savedAt = new Date().toISOString();
  try {
    const records = await dbGetAll();
    const existing = records.find(r => r.id === data.id);
    if (existing) { data.progressNotes = existing.progressNotes || []; if (existing.reviews) data.reviews = existing.reviews; if (existing.signoff) data.signoff = existing.signoff; showToast('Record updated.', 'success'); } 
    else { showToast('Record saved.', 'success'); }
    await dbPut(data); editingRecordId = data.id;
    try { await verSnapshot(data, existing || null); } catch (e) { /* history is a bonus: never block a save */ }
    rvRefresh();
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout); localStorage.removeItem('historyosis_draft');
    await renderRecords();
  } catch(e) { showToast('Storage error — may not have saved.', 'error'); }
}
