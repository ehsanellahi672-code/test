/* sections.js - Comorbidities, review of systems, family history, examination, investigations, treatments. */
'use strict';

function populateComorbidDropdown() {
  const sel = document.getElementById('comorbid-dropdown');
  medicalDataPools.comorbidities.forEach(c => { const opt = document.createElement('option'); opt.value = c; opt.textContent = c; sel.appendChild(opt); });
}
function addComorbidity() {
  const val = document.getElementById('comorbid-dropdown').value;
  if (!val) { showToast('Select a comorbidity.', 'error'); return; }
  if (comorbidItems.includes(val)) { showToast('Already added.', 'warning'); return; }
  comorbidItems.push(val); renderComorbidItems(); document.getElementById('comorbid-dropdown').value = ''; updateProgress(); triggerAutoSave();
}
function removeComorbidity(idx) { comorbidItems.splice(idx, 1); renderComorbidItems(); updateProgress(); triggerAutoSave(); }
function renderComorbidItems() {
  const c = document.getElementById('comorbid-container'); c.innerHTML = '';
  comorbidItems.forEach((item, idx) => {
    const pill = document.createElement('div'); pill.className = 'badge badge-red';
    pill.style.cssText = 'font-size:0.75rem; padding:4px 10px; display:flex; align-items:center; gap:6px; background:var(--danger-light); color:var(--danger); border:1px solid rgba(220,38,38,0.15); border-radius:99px;';
    pill.innerHTML = `${escH(item)} <span style="cursor:pointer;font-size:0.85rem;margin-left:4px" onclick="removeComorbidity(${idx})">✕</span>`;
    c.appendChild(pill);
  });
  if (typeof refreshDrugSafety === 'function') refreshDrugSafety();
}
function populateROSDropdown() {
  const sel = document.getElementById('ros-dropdown');
  medicalDataPools.rosSymptoms.forEach(s => { const opt = document.createElement('option'); opt.value = s; opt.textContent = s; sel.appendChild(opt); });
}
function addROS() {
  const val = document.getElementById('ros-dropdown').value;
  if (!val) { showToast('Select a symptom.', 'error'); return; }
  if (rosItems.includes(val)) { showToast('Already added.', 'warning'); return; }
  rosItems.push(val); renderROSItems(); document.getElementById('ros-dropdown').value = ''; updateProgress(); triggerAutoSave();
}
function removeROS(idx) { rosItems.splice(idx, 1); renderROSItems(); updateProgress(); triggerAutoSave(); }
function renderROSItems() {
  const c = document.getElementById('ros-container'); c.innerHTML = '';
  rosItems.forEach((item, idx) => {
    const pill = document.createElement('div'); pill.className = 'badge badge-warn';
    pill.style.cssText = 'font-size:0.75rem; padding:4px 10px; display:flex; align-items:center; gap:6px; background:var(--warning-light); color:var(--warning); border:1px solid rgba(217,119,6,0.2); border-radius:99px;';
    pill.innerHTML = `${escH(item)} <span style="cursor:pointer;font-size:0.85rem;margin-left:4px" onclick="removeROS(${idx})">✕</span>`;
    c.appendChild(pill);
  });
}
function populateFHDropdown() {
  const sel = document.getElementById('fh-dropdown');
  medicalDataPools.fhConditions.forEach(s => { const opt = document.createElement('option'); opt.value = s; opt.textContent = s; sel.appendChild(opt); });
}
function addFH() {
  const val = document.getElementById('fh-dropdown').value;
  if (!val) { showToast('Select a condition.', 'error'); return; }
  if (fhItems.includes(val)) { showToast('Already added.', 'warning'); return; }
  fhItems.push(val); renderFHItems(); document.getElementById('fh-dropdown').value = ''; updateProgress(); triggerAutoSave();
}
function removeFH(idx) { fhItems.splice(idx, 1); renderFHItems(); updateProgress(); triggerAutoSave(); }
function renderFHItems() {
  const c = document.getElementById('fh-container'); c.innerHTML = '';
  fhItems.forEach((item, idx) => {
    const pill = document.createElement('div'); pill.className = 'badge badge-blue';
    pill.style.cssText = 'font-size:0.75rem; padding:4px 10px; display:flex; align-items:center; gap:6px; background:var(--accent-light); color:var(--accent); border:1px solid var(--accent-mid); border-radius:99px;';
    pill.innerHTML = `${escH(item)} <span style="cursor:pointer;font-size:0.85rem;margin-left:4px" onclick="removeFH(${idx})">✕</span>`;
    c.appendChild(pill);
  });
}
/* ============================================================
   EXAM, INVEST, TREAT LOGIC
   ============================================================ */
function populateExamDropdown() {
  const sel = document.getElementById('exam-dropdown');
  medicalDataPools.examinations.forEach(ex => { const opt = document.createElement('option'); opt.value = ex.system; opt.textContent = ex.system; sel.appendChild(opt); });
}
function addExam() {
  const sel = document.getElementById('exam-dropdown'); const sys = sel.value;
  if (!sys) { showToast('Select a system first.', 'error'); return; }
  if (examItems.find(e=>e.system===sys)) { showToast('Already added.', 'warning'); return; }
  examItems.push({system:sys, findings:{}});
  renderExamCards(); sel.value = ''; updateProgress(); triggerAutoSave();
}
function renderExamCards() {
  const container = document.getElementById('exam-cards-container'); container.innerHTML = '';
  examItems.forEach(item => {
    const def = medicalDataPools.examinations.find(e=>e.system===item.system);
    if (!def) return;
    const div = document.createElement('div'); div.className = 'exam-item';
    let fields = '';
    def.fields.forEach((f,fi) => {
      const val = exVal(item, f, fi) || '';
      if (f.type==='select') {
        const opts = f.options.map(o=>`<option${o===val?' selected':''}>${escH(o)}</option>`).join('');
        fields += `<div class="field"><label>${escH(f.label)}</label><select onchange="updateExF('${escH(item.system)}',${fi},this.value)"><option value="">— Select —</option>${opts}</select></div>`;
      } else if (f.type==='textarea') {
        fields += `<div class="field"><label>${escH(f.label)}</label><textarea placeholder="${escH(f.placeholder||'')}" oninput="updateExF('${escH(item.system)}',${fi},this.value)">${escH(val)}</textarea></div>`;
      } else {
        fields += `<div class="field"><label>${escH(f.label)}</label><input type="text" placeholder="${escH(f.placeholder||'')}" value="${escH(val)}" oninput="updateExF('${escH(item.system)}',${fi},this.value)"></div>`;
      }
    });
    div.innerHTML = `<div class="exam-item-header"><div class="exam-item-title">${escH(item.system)}</div><button class="btn btn-danger-outline btn-sm" onclick="removeExam('${escH(item.system)}')">✕ Remove</button></div>${fields}`;
    container.appendChild(div);
  });
}
function removeExam(sys) { examItems = examItems.filter(e=>e.system!==sys); renderExamCards(); triggerAutoSave(); }
function updateExF(sys, fi, val) {
  const i = examItems.find(e=>e.system===sys); const def = medicalDataPools.examinations.find(e=>e.system===sys);
  if (!i || !def || !def.fields[fi]) return;
  if (!i.findings) i.findings = {};
  i.findings[def.fields[fi].label] = val;
}
function populateInvestDropdown() {
  const catSel = document.getElementById('invest-category'); const invSel = document.getElementById('invest-dropdown');
  catSel.addEventListener('change', () => {
    invSel.innerHTML = '<option value="">— Select —</option>';
    const cat = catSel.value;
    if (cat && medicalDataPools.investigations[cat]) {
      medicalDataPools.investigations[cat].forEach(inv => { const opt = document.createElement('option'); opt.value = inv; opt.textContent = inv; invSel.appendChild(opt); });
    }
  });
}
function addInvestigation(nameArg, catArg) {
  const name = (typeof nameArg === 'string') ? nameArg : document.getElementById('invest-dropdown').value;
  const cat = (typeof catArg === 'string') ? catArg : document.getElementById('invest-category').value;
  if (!name) { showToast('Select an investigation first.', 'error'); return; }
  if (investItems.find(i=>i.name===name)) { showToast('Already added.', 'warning'); return; }
  investItems.push({name, category:cat, result:''});
  renderInvestItems(); updateProgress(); triggerAutoSave();
}
function addCustomInvestigation() {
  const name = document.getElementById('invest-custom-name').value.trim(); const result = document.getElementById('invest-custom-result').value.trim();
  if (!name) { showToast('Enter investigation name.', 'error'); return; }
  investItems.push({name, category:'Custom', result});
  document.getElementById('invest-custom-name').value = ''; document.getElementById('invest-custom-result').value = '';
  renderInvestItems(); updateProgress(); triggerAutoSave();
}
function renderInvestItems() {
  const c = document.getElementById('invest-container'); c.innerHTML = '';
  investItems.forEach((item,idx) => {
    const div = document.createElement('div'); div.className = 'invest-item';
    div.innerHTML = `<span class="badge badge-blue" style="align-self:start; margin-top:8px">${escH(item.category)}</span><div class="invest-item-main"><div class="invest-name">${escH(item.name)}</div><textarea placeholder="Result / finding (type here)" oninput="investItems[${idx}].result=this.value" rows="1" style="margin-top:4px">${escH(item.result)}</textarea></div><button class="btn btn-danger-outline btn-sm" style="align-self:start; margin-top:8px" onclick="removeInvest(${idx})">✕</button>`;
    c.appendChild(div);
  });
}
function removeInvest(idx) { investItems.splice(idx,1); renderInvestItems(); triggerAutoSave(); }
function initTreatmentListener() {
  document.getElementById('treatment-category-filter').addEventListener('change', function() {
    const cat = this.value; const sel = document.getElementById('treatment-dropdown'); sel.innerHTML = '<option value="">— Select —</option>';
    if (cat && medicalDataPools.treatments[cat]) {
      medicalDataPools.treatments[cat].forEach(t => { const opt = document.createElement('option'); opt.value = t; opt.textContent = t; sel.appendChild(opt); });
    }
  });
}
function addTreatment(nameArg, catArg) {
  const cat = (typeof catArg === 'string') ? catArg : document.getElementById('treatment-category-filter').value;
  const name = (typeof nameArg === 'string') ? nameArg : document.getElementById('treatment-dropdown').value;
  if (!name) { showToast('Select a treatment first.', 'error'); return; }
  if (treatItems.find(t=>t.name===name)) { showToast('Already added.', 'warning'); return; }
  treatItems.push({name, category:cat, detail:''}); renderTreatItems(); triggerAutoSave();
}
function addCustomTreatment() {
  const cat = document.getElementById('treat-custom-cat').value; const name = document.getElementById('treat-custom-name').value.trim(); const detail = document.getElementById('treat-custom-detail').value.trim();
  if (!name) { showToast('Enter treatment name.', 'error'); return; }
  treatItems.push({name, category:cat, detail});
  document.getElementById('treat-custom-name').value = ''; document.getElementById('treat-custom-detail').value = ''; renderTreatItems(); triggerAutoSave();
}
function renderTreatItems() {
  const c = document.getElementById('treatment-container'); c.innerHTML = '';
  const cls = {Medical:'badge-blue',Surgical:'badge-red',Conservative:'badge-green','Monitoring / Nursing':'badge-warn','Monitoring':'badge-warn',Referral:'badge-warn'};
  treatItems.forEach((item,idx) => {
    const div = document.createElement('div'); div.className = 'treatment-item';
    div.innerHTML = `<span class="badge ${cls[item.category]||'badge-blue'}" style="align-self:center">${escH(item.category)}</span><div class="treatment-item-main"><div class="treat-name">${escH(item.name)}</div><input type="text" placeholder="Dose / details / notes" value="${escH(item.detail)}" oninput="treatItems[${idx}].detail=this.value" style="margin-top:4px"><div class="treat-warn" id="tw-${idx}"></div></div><button class="btn btn-danger-outline btn-sm" style="align-self:center" onclick="removeTreat(${idx})">✕</button>`;
    c.appendChild(div);
  });
  refreshDrugSafety();
}
function removeTreat(idx) { treatItems.splice(idx,1); renderTreatItems(); triggerAutoSave(); }
