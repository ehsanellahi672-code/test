/* summary.js - Summary view, EMR text and copy. */
'use strict';

function refreshSummary() {
  const data = collectFormData(); document.getElementById('summary-view').innerHTML = buildSummaryHTML(data); showToast('Summary refreshed.', 'success');
}
/* ============================================================
   BUILD SUMMARY HTML
   ============================================================ */
function buildSummaryHTML(d) {
  const s = v => v ? escH(v) : '—'; const dem = d.demographics||{}; const his = d.history||{}; const ex = d.exam||{}; const inv = d.investigations||{}; const tx = d.treatment||{}; const cred = d.credentials||{};
  let h = '';
  h += `<div class="summary-section"><div class="summary-title">Demographics</div><div class="summary-grid"><div class="summary-row"><strong>Name:</strong> ${s(dem.name)}</div><div class="summary-row"><strong>MR No:</strong> ${s(dem.mrno)}</div><div class="summary-row"><strong>Age / Sex:</strong> ${s(dem.age)}${ageSuffix(dem)} / ${s(dem.sex)}</div><div class="summary-row"><strong>Department:</strong> ${s(dem.dept)}</div><div class="summary-row"><strong>Admitted Via:</strong> ${s(dem.admitVia)}</div><div class="summary-row"><strong>Date / Time:</strong> ${s(dem.dateAdmission)} ${s(dem.timeAdmission)}</div><div class="summary-row"><strong>Bed:</strong> ${s(dem.bedno)}</div><div class="summary-row"><strong>Occupation:</strong> ${s(dem.occupation)}</div><div class="summary-row"><strong>Residence:</strong> ${s(dem.residence)}</div><div class="summary-row"><strong>Informant:</strong> ${s(dem.informant)}</div></div></div>`;

  if ((his.pcs||[]).length>0) {
    h += `<div class="summary-section"><div class="summary-title">Chief Complaints & HOPI</div>`;
    (his.pcs||[]).forEach((pc,i) => {
      h += `<div style="margin-bottom:12px"><strong>${i+1}. ${escH(pc.label)}</strong> — Duration: ${s(pc.duration)}<br>`;
      const hs = composeHopiSentence(pc);
      if (hs) h+=`<div style="margin-left:12px;font-size:0.9rem;margin-top:4px">${escH(hs)}</div>`;
      (pc.hopi||[]).forEach((q,qi) => { if (hs && !(pc.answers&&pc.answers[qi])) return; const a=(pc.answers&&pc.answers[qi])||'—'; h+=`<div style="margin-left:12px;font-size:0.83rem;margin-top:4px"><em>${escH(q)}</em><br>${escH(a)}</div>`; });
      if (pc.custom) h+=`<div style="margin-left:12px;font-size:0.83rem"><em>Notes:</em> ${escH(pc.custom)}</div>`;
      if (Array.isArray(pc.redFlagsPresent) && pc.redFlagsPresent.length) h+=`<div style="margin-left:12px;font-size:0.83rem;color:var(--danger)"><strong>Red flags present:</strong> ${escH(pc.redFlagsPresent.join('; '))}</div>`; h += `</div>`;
    }); h += `</div>`;
  }
  h += `<div class="summary-section"><div class="summary-title">Review of Systems</div>`;
  if ((his.rosSelected||[]).length>0) h+=`<div class="summary-row"><strong>Positive symptoms:</strong> ${escH(his.rosSelected.join(', '))}</div>`;
  if (his.rosNarrative) h+=`<div class="summary-block" style="margin-top:6px">${escH(his.rosNarrative)}</div>`; h += `</div>`;

  if ((his.comorbidItems && his.comorbidItems.length > 0) || his.comorbidNarrative) {
    h += `<div class="summary-section"><div class="summary-title">Comorbidities</div>`;
    if (his.comorbidItems && his.comorbidItems.length > 0) h += `<div class="summary-row"><strong>Conditions:</strong> ${escH(his.comorbidItems.join(', '))}</div>`;
    if (his.comorbidNarrative) h += `<div class="summary-block" style="margin-top:6px">${escH(his.comorbidNarrative)}</div>`; h += `</div>`;
  }

  h += `<div class="summary-section"><div class="summary-title">Past Medical & Surgical History</div><div class="summary-grid"><div class="summary-row"><strong>Medical:</strong> ${s(his.pmhMedical)}</div><div class="summary-row"><strong>Surgical:</strong> ${s(his.pmhSurgical)}</div><div class="summary-row"><strong>Drugs:</strong> ${s(his.pmhDrugs)}</div><div class="summary-row"><strong>Allergies:</strong> ${s(his.pmhAllergies)}</div></div><div class="summary-row" style="margin-top:4px"><strong>Immunisation:</strong> ${s(his.pmhImmunisation)}</div>${carryLineHTML(d)}</div>`;
  if (his.paeds && (his.paeds.birth || his.paeds.feeding || his.paeds.development)) {
    const pd = his.paeds; h += `<div class="summary-section"><div class="summary-title">Paediatric History</div><div class="summary-grid"><div class="summary-row"><strong>Birth:</strong> ${s(pd.birth)}</div><div class="summary-row"><strong>Feeding:</strong> ${s(pd.feeding)}</div><div class="summary-row"><strong>Development:</strong> ${s(pd.development)}</div></div></div>`;
  }
  h += `<div class="summary-section"><div class="summary-title">Family History</div>`;
  if ((his.fhSelected||[]).length>0) h+=`<div class="summary-row"><strong>Conditions:</strong> ${escH(his.fhSelected.join(', '))}</div>`;
  if (his.fhNarrative) h+=`<div class="summary-block" style="margin-top:6px">${escH(his.fhNarrative)}</div>`; h += `</div>`;

  if (dem.sex==='Female' && his.repro) {
    const r=his.repro; h += `<div class="summary-section"><div class="summary-title">Reproductive History</div><div class="summary-grid"><div class="summary-row"><strong>Menarche/Cycle:</strong> ${s(r.menarche)}</div><div class="summary-row"><strong>LMP:</strong> ${s(r.lmp)}</div><div class="summary-row"><strong>Obstetric:</strong> ${s(r.obstetric)}</div><div class="summary-row"><strong>Contraception:</strong> ${s(r.contraception)}</div>${r.pregnancy?`<div class="summary-row"><strong>Pregnancy status:</strong> ${s(r.pregnancy)}</div>`:''}</div></div>`;
  }

  const sh=his.sh||{};
  h += `<div class="summary-section"><div class="summary-title">Social History</div><div class="summary-grid"><div class="summary-row"><strong>Smoking:</strong> ${s(sh.smoking)} ${sh.smokingDetail?'— '+escH(sh.smokingDetail):''}</div><div class="summary-row"><strong>Alcohol:</strong> ${s(sh.alcohol)}</div><div class="summary-row"><strong>Drugs:</strong> ${s(sh.drugs)}</div><div class="summary-row"><strong>Diet:</strong> ${s(sh.diet)}</div><div class="summary-row"><strong>Exercise:</strong> ${s(sh.exercise)}</div><div class="summary-row"><strong>Travel:</strong> ${s(sh.travel)}</div><div class="summary-row"><strong>Living:</strong> ${s(sh.living)}</div><div class="summary-row"><strong>ADLs:</strong> ${s(sh.adl)}</div></div></div>`;

  const v=ex.vitals||{};
  h += `<div class="summary-section"><div class="summary-title">Vital Signs</div><div class="summary-grid"><div class="summary-row"><strong>BP:</strong> ${s(v.bp)} mmHg</div><div class="summary-row"><strong>Pulse:</strong> ${s(v.pulse)} bpm</div><div class="summary-row"><strong>RR:</strong> ${s(v.rr)} /min</div><div class="summary-row"><strong>SpO₂:</strong> ${s(v.spo2)}%</div><div class="summary-row"><strong>Temp:</strong> ${s(v.temp)}°F</div><div class="summary-row"><strong>GCS:</strong> ${s(v.gcs)}</div><div class="summary-row"><strong>Height:</strong> ${s(v.height)}</div><div class="summary-row"><strong>Weight:</strong> ${s(v.weight)}</div><div class="summary-row"><strong>BMI:</strong> ${s(v.bmi)}</div>${v.o2?`<div class="summary-row"><strong>Supplemental O₂:</strong> ${s(v.o2)}</div>`:''}${v.consciousness?`<div class="summary-row"><strong>Consciousness:</strong> ${s(v.consciousness)}</div>`:''}</div>${v.news2!==undefined&&v.news2!==''?`<div class="summary-row" style="margin-top:8px"><strong>NEWS2:</strong> ${escH(v.news2)}${v.news2Band?' — '+escH(v.news2Band)+' risk':''}${v.news2Partial==='Yes'?' (partial: some parameters not entered)':''}<div style="font-size:0.72rem;color:var(--text-muted)">Decision support only. Clinical judgement and local protocols apply.</div></div>`:''}</div>`;

  const gen=ex.general||{};
  h += `<div class="summary-section"><div class="summary-title">General Examination</div><div class="summary-grid"><div class="summary-row"><strong>Appearance:</strong> ${s(gen.appearance)}</div><div class="summary-row"><strong>Pallor:</strong> ${s(gen.pallor)}</div><div class="summary-row"><strong>Jaundice:</strong> ${s(gen.jaundice)}</div><div class="summary-row"><strong>Cyanosis:</strong> ${s(gen.cyanosis)}</div><div class="summary-row"><strong>Clubbing:</strong> ${s(gen.clubbing)}</div><div class="summary-row"><strong>Lymph:</strong> ${s(gen.lymph)}</div><div class="summary-row"><strong>Oedema:</strong> ${s(gen.oedema)}</div></div></div>`;

  if ((ex.systems||[]).length>0) {
    h += `<div class="summary-section"><div class="summary-title">System Examinations</div>`;
    (ex.systems||[]).forEach(sysItem => {
      const def = medicalDataPools.examinations.find(e=>e.system===sysItem.system);
      if (!def) return;
      h += `<div style="margin-bottom:10px"><strong>${escH(sysItem.system)}</strong><br>`;
      def.fields.forEach((f,fi) => { const fv=exVal(sysItem,f,fi); if(fv)h+=`<div style="margin-left:12px;font-size:0.83rem">${escH(f.label)}: ${escH(fv)}</div>`; }); h += `</div>`;
    }); h += `</div>`;
  }

  if ((inv.items||[]).length>0) {
    h += `<div class="summary-section"><div class="summary-title">Investigations</div>`;
    (inv.items||[]).forEach(i => { h+=`<div class="summary-row"><strong>${escH(i.name)}:</strong> ${escH(i.result||'Pending')}</div>`; });
    if (inv.summary) h+=`<div class="summary-block" style="margin-top:6px">${escH(inv.summary)}</div>`; h += `</div>`;
  }

  h += `<div class="summary-section"><div class="summary-title">Diagnosis & Management</div><div class="summary-row"><strong>Primary Dx:</strong> ${s(tx.primaryDx)}</div>`;
  if (tx.differentials) h+=`<div class="summary-block" style="margin-top:6px"><strong>Differentials:</strong><br>${escH(tx.differentials)}</div>`;
  if ((tx.items||[]).length>0) {
    h+=`<div style="margin-top:10px"><strong>Treatment Plan:</strong><ul style="margin-left:16px;margin-top:4px">`;
    (tx.items||[]).forEach(t=>{ h+=`<li style="font-size:0.83rem;margin-bottom:2px">[${escH(t.category)}] ${escH(t.name)}${t.detail?' — '+escH(t.detail):''}${t.allergyAck?' <em>(allergy alert reviewed)</em>':''}</li>`; }); h+=`</ul></div>`;
  } h += `</div>`;

  if (d.progressNotes && d.progressNotes.length > 0) {
      h += `<div class="summary-section" style="margin-top:18px; border-top: 1px solid var(--border); padding-top: 18px;"><div class="summary-title">Clinical Timeline & Progress</div><div style="display:flex; flex-direction:column; gap:12px;">`;
      d.progressNotes.forEach(note => {
          h += `<div class="summary-block" style="border-left: 3px solid ${note.type === 'SOAP' ? 'var(--accent)' : 'var(--warning)'}; border-radius: 4px; padding: 10px 14px; background: var(--surface);">`;
          h += `<div style="margin-bottom:6px; display:flex; align-items:center; gap:8px;"><strong style="font-size:0.85rem;">${escH(formatNoteTimestamp(note.timestamp))}</strong>${note.type === 'Treatment' ? `<span class="badge badge-warn">Treatment Update</span>` : `<span class="badge badge-blue">SOAP Note</span>`}</div>`;
          if (note.type === 'SOAP') {
              const pl = note.payload || {};
              if (pl.s) h += `<div style="font-size:0.83rem; margin-bottom:4px;"><strong>S:</strong> ${escH(pl.s)}</div>`;
              if (pl.o) h += `<div style="font-size:0.83rem; margin-bottom:4px;"><strong>O:</strong> ${escH(pl.o)}</div>`;
              if (pl.a) h += `<div style="font-size:0.83rem; margin-bottom:4px;"><strong>A:</strong> ${escH(pl.a)}</div>`;
              if (pl.p) h += `<div style="font-size:0.83rem;"><strong>P:</strong> ${escH(pl.p)}</div>`;
              h += noteExtraHTML(pl);
          } else if (note.type === 'Treatment') {
              h += `<div style="font-size:0.83rem;">${escH(note.payload)}</div>`;
          }
          h += `</div>`;
      }); h += `</div></div>`;
  }

  if (cred.name) {
    let signStr = '';
    if (cred.role === 'Student') { signStr = `${escH(cred.name)}<br><span style="font-size:0.75rem;color:var(--text-muted)">Student | Roll No: ${escH(cred.roll)} | ${escH(cred.year)}${cred.ward ? ' | Ward: '+escH(cred.ward) : ''}</span>`; } 
    else { signStr = `${escH(cred.name)}<br><span style="font-size:0.75rem;color:var(--text-muted)">${escH(cred.designation)} | ${escH(cred.department)}</span>`; }
    h += `<div class="summary-section" style="margin-top:28px; border-top: 1px dashed var(--border-strong); padding-top: 18px;"><div style="text-align: right; line-height:1.4;"><strong style="font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary)">Sign-off / Stamp</strong><br><div style="margin-top:6px;font-size:0.95rem;font-weight:700">${signStr}</div></div></div>`;
  }
  return h;
}
/* ============================================================
   EMR TEXT
   ============================================================ */
function buildEMRText(r) {
  const s=v=>v||'N/A';
  const d=r.demographics||{};const h=r.history||{};const ex=r.exam||{};const inv=r.investigations||{};const tx=r.treatment||{};
  const cred = r.credentials||{};
  let t='';
  t+=`========================================\n         HISTORYOSIS — PATIENT RECORD\n========================================\n\n`;
  t+=`DEMOGRAPHICS\n${'-'.repeat(40)}\nName: ${s(d.name)}   MR No: ${s(d.mrno)}\nAge: ${s(d.age)}${ageSuffix(d, true)}   Sex: ${s(d.sex)}   Bed: ${s(d.bedno)}\nDepartment: ${s(d.dept)}\nAdmitted via: ${s(d.admitVia)}\nDate/Time: ${s(d.dateAdmission)} ${s(d.timeAdmission)}\nOccupation: ${s(d.occupation)}   Residence: ${s(d.residence)}\nInformant: ${s(d.informant)}\n\n`;
  t+=`CHIEF COMPLAINTS & HOPI\n${'-'.repeat(40)}\n`;
  (h.pcs||[]).forEach((pc,i)=>{ t+=`${i+1}. ${pc.label} — Duration: ${s(pc.duration)}\n`; const hs=composeHopiSentence(pc); if(hs)t+=`   ${hs}\n`; (pc.hopi||[]).forEach((q,qi)=>{ if(hs&&!(pc.answers&&pc.answers[qi]))return; t+=`   Q${qi+1}: ${q}\n   A: ${(pc.answers&&pc.answers[qi])||'N/A'}\n`; }); if(pc.custom)t+=`   Notes: ${pc.custom}\n`; if(Array.isArray(pc.redFlagsPresent)&&pc.redFlagsPresent.length)t+=`   Red flags present: ${pc.redFlagsPresent.join('; ')}\n`; });
  t+=`\nREVIEW OF SYSTEMS\n${'-'.repeat(40)}\nPositive: ${(h.rosSelected||[]).join(', ')||'None'}\n${h.rosNarrative||''}\n\n`;
  if ((h.comorbidItems && h.comorbidItems.length > 0) || h.comorbidNarrative) { t += `COMORBIDITIES\n${'-'.repeat(40)}\n`; if (h.comorbidItems && h.comorbidItems.length > 0) t += `${h.comorbidItems.join(', ')}\n`; if (h.comorbidNarrative) t += `${h.comorbidNarrative}\n`; t += `\n`; }
  t+=`PMH/PSH\n${'-'.repeat(40)}\nMedical: ${s(h.pmhMedical)}\nSurgical: ${s(h.pmhSurgical)}\nDrugs: ${s(h.pmhDrugs)}\nAllergies: ${s(h.pmhAllergies)}\n${carryLineText(r)}\n`;
  if (h.paeds && (h.paeds.birth || h.paeds.feeding || h.paeds.development)) t+=`PAEDIATRIC HISTORY\n${'-'.repeat(40)}\nBirth: ${s(h.paeds.birth)}\nFeeding: ${s(h.paeds.feeding)}\nDevelopment: ${s(h.paeds.development)}\n\n`;
  t+=`FAMILY HISTORY\n${'-'.repeat(40)}\n${(h.fhSelected||[]).join(', ')||'None'}\n${h.fhNarrative||''}\n\n`;
  if(d.sex==='Female'){const rep=h.repro||{};t+=`REPRODUCTIVE HISTORY\n${'-'.repeat(40)}\nMenarche: ${s(rep.menarche)}\nLMP: ${s(rep.lmp)}\nObstetric: ${s(rep.obstetric)}\nContraception: ${s(rep.contraception)}\n${rep.pregnancy?`Pregnancy status: ${rep.pregnancy}\n`:''}\n`;}
  const sh=h.sh||{};
  t+=`SOCIAL HISTORY\n${'-'.repeat(40)}\nSmoking: ${s(sh.smoking)} ${sh.smokingDetail||''}\nAlcohol: ${s(sh.alcohol)}\nDrugs: ${s(sh.drugs)}\nTravel: ${s(sh.travel)}\nLiving: ${s(sh.living)}\nADLs: ${s(sh.adl)}\n\n`;
  const v=ex.vitals||{};
  t+=`VITAL SIGNS\n${'-'.repeat(40)}\nBP: ${s(v.bp)} mmHg   Pulse: ${s(v.pulse)} bpm   RR: ${s(v.rr)} /min\nSpO2: ${s(v.spo2)}%   Temp: ${s(v.temp)}°F   GCS: ${s(v.gcs)}\nHeight: ${s(v.height)}   Weight: ${s(v.weight)}   BMI: ${s(v.bmi)}\n${(v.o2||v.consciousness)?`Supplemental O2: ${s(v.o2)}   Consciousness: ${s(v.consciousness)}\n`:''}${(v.news2!==undefined&&v.news2!=='')?`NEWS2: ${v.news2}${v.news2Band?' ('+v.news2Band+' risk'+(v.news2Partial==='Yes'?', partial':'')+')':''} - decision support only\n`:''}\n`;
  (ex.systems||[]).forEach(si=>{
    const def=medicalDataPools.examinations.find(e=>e.system===si.system); if(!def)return;
    t+=`${si.system.toUpperCase()}\n${'-'.repeat(40)}\n`;
    def.fields.forEach((f,fi)=>{ const fv=exVal(si,f,fi); if(fv)t+=`${f.label}: ${fv}\n`; }); t+='\n';
  });
  t+=`INVESTIGATIONS\n${'-'.repeat(40)}\n`; (inv.items||[]).forEach(i=>{t+=`${i.name}: ${i.result||'Pending'}\n`;});
  if(inv.summary)t+=`\nInterpretation:\n${inv.summary}\n`;
  t+=`\nDIAGNOSIS & MANAGEMENT\n${'-'.repeat(40)}\nPrimary Dx: ${s(tx.primaryDx)}\n`; if(tx.differentials)t+=`Differentials:\n${tx.differentials}\n`;
  t+=`\nTreatment Plan:\n`; (tx.items||[]).forEach(i=>{t+=`  [${i.category}] ${i.name}${i.detail?' — '+i.detail:''}${i.allergyAck?' (allergy alert reviewed)':''}\n`;});
  if(tx.monitoring)t+=`\nMonitoring:\n${tx.monitoring}\n`; if(tx.discharge)t+=`\nDischarge Plan:\n${tx.discharge}\n`;
  if (r.progressNotes && r.progressNotes.length > 0) {
      t += `\nCLINICAL TIMELINE & PROGRESS\n${'-'.repeat(40)}\n`;
      r.progressNotes.forEach(note => {
          t += `[${formatNoteTimestamp(note.timestamp)}] - ${note.type.toUpperCase()}\n`;
          if (note.type === 'SOAP') { const pl = note.payload || {}; if (pl.s) t += `S: ${pl.s}\n`; if (pl.o) t += `O: ${pl.o}\n`; if (pl.a) t += `A: ${pl.a}\n`; if (pl.p) t += `P: ${pl.p}\n`; t += noteExtraText(pl); } 
          else { t += `${note.payload == null ? '' : note.payload}\n`; } t += `\n`;
      });
  }
  if (cred.name) {
      t+= `\n${'-'.repeat(40)}\nSIGNING CREDENTIALS\n`;
      if (cred.role === 'Student') { t+= `Signed: ${s(cred.name)}\nRole: Student\nRoll No: ${s(cred.roll)}\nYear: ${s(cred.year)}\nWard: ${s(cred.ward)}\n`; } 
      else { t+= `Signed: ${s(cred.name)}\nDesignation: ${s(cred.designation)}\nDepartment: ${s(cred.department)}\n`; }
  }
  t+=`\n${'='.repeat(40)}\nRecord ID: ${r.id}\nSaved: ${r.savedAt?new Date(r.savedAt).toLocaleString():'N/A'}\nGenerated by HistoryOsis v2.2\n${'='.repeat(40)}\n`;
  return t;
}
async function copyEMR(id) {
  try {
    const records = await dbGetAll(); const record = records.find(r=>r.id===id);
    if (!record) { showToast('Record not found.', 'error'); return; }
    const text = buildEMRText(record);
    if (navigator.clipboard) { navigator.clipboard.writeText(text).then(()=>showToast('EMR format copied!','success')).catch(()=>fallbackCopy(text)); } else { fallbackCopy(text); }
  } catch(err) { showToast('Failed to copy EMR.', 'error'); }
}
function fallbackCopy(text) {
  const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');showToast('Copied (fallback).','success');}catch(e){showToast('Copy failed — please copy manually.','error');}
  document.body.removeChild(ta);
}
