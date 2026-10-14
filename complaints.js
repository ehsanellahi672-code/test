/* complaints.js - Presenting complaints, chips, red flags. */
'use strict';

/* ============================================================
   PC, ROS, COMORBID LOGIC
   ============================================================ */
function populatePCDropdown(filterSys) {
  const sel = document.getElementById('pc-dropdown');
  sel.innerHTML = '<option value="">— Presenting complaint —</option>';
  const grouped = {};
  medicalDataPools.presentingComplaints.forEach(pc => {
    const sys = pc.system || 'General';
    if (filterSys && sys !== filterSys) return;
    if (!grouped[sys]) grouped[sys] = [];
    grouped[sys].push(pc);
  });
  Object.keys(grouped).forEach(sys => {
    const og = document.createElement('optgroup');
    og.label = (systemLabels[sys] || sys);
    grouped[sys].forEach(pc => {
      const opt = document.createElement('option');
      opt.value = pc.label; opt.textContent = pc.label;
      og.appendChild(opt);
    });
    sel.appendChild(og);
  });
}
function buildPCSystemChips() {
  const container = document.getElementById('pc-system-chips');
  if (!container) return;
  const systems = [...new Set(medicalDataPools.presentingComplaints.map(p=>p.system).filter(Boolean))];
  container.innerHTML = '';
  const allChip = document.createElement('button');
  allChip.className = 'sys-chip active';
  allChip.textContent = 'All';
  allChip.onclick = () => { filterPC(''); setActiveChip(allChip); };
  container.appendChild(allChip);
  systems.forEach(sys => {
    const chip = document.createElement('button');
    chip.className = 'sys-chip';
    chip.textContent = (systemLabels[sys]||sys);
    chip.onclick = () => { filterPC(sys); setActiveChip(chip); };
    container.appendChild(chip);
  });
}
function setActiveChip(el) {
  document.querySelectorAll('#pc-system-chips .sys-chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
}
function filterPC(sys) { populatePCDropdown(sys || null); }
function addPC() {
  const sel = document.getElementById('pc-dropdown');
  const custom = document.getElementById('pc-custom-input');
  const label = sel.value || custom.value.trim();
  if (!label) { showToast('Select or type a complaint first.', 'error'); return; }
  if (pcCards.find(c => c.label.toLowerCase() === label.toLowerCase())) { showToast(`"${label}" already added.`, 'warning'); return; }
  const pcData = medicalDataPools.presentingComplaints.find(p => p.label === label);
  const id = 'pc-' + Date.now();
  pcCards.push({ id, label, hopi: pcData ? pcData.hopi : [], answers: [], duration: '', custom: '' });
  renderPCCards(); sel.value = ''; custom.value = ''; updateProgress(); triggerAutoSave();
}
function renderPCCards() {
  const container = document.getElementById('pc-cards-container');
  container.innerHTML = '';
  pcCards.forEach((card, idx) => {
    const div = document.createElement('div');
    div.className = 'pc-card';
    div.id = card.id;
    let hopiHTML = '';
    if (card.hopi.length > 0) {
      card.hopi.forEach((q, qi) => {
        hopiHTML += `<div class="field"><label>HOPI Q${qi+1} <span class="guidance">${escH(q)}</span></label><textarea rows="2" oninput="updatePCA('${card.id}',${qi},this.value)">${escH(card.answers[qi]||'')}</textarea></div>`;
      });
    } else {
      hopiHTML = `<div class="field"><label>Presenting history</label><textarea rows="3" oninput="updatePCA('${card.id}',0,this.value)">${escH(card.answers[0]||'')}</textarea></div>`;
    }
    const chipDef = chipDefFor(card.label);
    if (chipDef) hopiHTML = chipsBlockHTML(card, chipDef);
    div.innerHTML = `
      <div class="pc-card-header">
        <div class="pc-card-title">Complaint ${idx+1}: ${escH(card.label)}</div>
        <button class="btn btn-danger-outline btn-sm" onclick="removePC('${card.id}')">✕ Remove</button>
      </div>
      <div class="field"><label>Duration <span class="guidance">(e.g. 3 days, 2 weeks)</span></label><input type="text" placeholder="Duration" value="${escH(card.duration||'')}" oninput="updatePCF('${card.id}','duration',this.value)"></div>
      ${hopiHTML}
      ${redFlagsHTML(card)}
      <div class="field"><label>${chipDef ? 'Other details' : 'Custom Notes / Additional HOPI'}</label><textarea placeholder="${chipDef ? 'Anything the chips did not cover...' : 'Extra details for this complaint...'}" oninput="updatePCF('${card.id}','custom',this.value)">${escH(card.custom||'')}</textarea></div>`;
    container.appendChild(div);
    if (chipDef) updateChipPreview(card);
  });
}
/* ============================================================
   HOPI CHIPS  (tap-to-answer history; optional "chips" on a complaint in data.js)
   Answers are stored on the complaint card as card.chipAnswers, keyed by the group's q:
     multi -> ['a','b']   single -> 'a'   scale -> '8'   duration -> { n:'2', u:'hours' }   ternary -> { 'sweating':'present', 'syncope':'absent' }
   ============================================================ */
function chipDefFor(label) {
  const def = medicalDataPools.presentingComplaints.find(p => p.label === label);
  return def && Array.isArray(def.chips) && def.chips.length ? def.chips : null;
}
function chipAnswersOf(card) {
  if (!card.chipAnswers || typeof card.chipAnswers !== 'object' || Array.isArray(card.chipAnswers)) card.chipAnswers = {};
  return card.chipAnswers;
}
function chipPrune(card) {                       // keep records tidy: no empty answers, no empty chipAnswers
  const a = card.chipAnswers; if (!a) return;
  Object.keys(a).forEach(k => {
    const v = a[k];
    const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length) ||
      (v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).some(x => v[x] !== '' && v[x] !== undefined && v[x] !== null));
    if (empty) delete a[k];
  });
  if (!Object.keys(a).length) delete card.chipAnswers;
}
function chipGroupInner(card, g, gi) {
  const ans = (card.chipAnswers && typeof card.chipAnswers === 'object') ? card.chipAnswers[g.q] : undefined;
  const id = card.id;
  if (g.type === 'multi') {
    const on = Array.isArray(ans) ? ans : [];
    return (g.options || []).map((o, oi) => `<button type="button" class="chip${on.includes(o) ? ' on' : ''}" aria-pressed="${on.includes(o)}" onclick="chipTap('${id}',${gi},${oi})">${escH(o)}</button>`).join('');
  }
  if (g.type === 'single') {
    return (g.options || []).map((o, oi) => `<button type="button" class="chip${ans === o ? ' on' : ''}" aria-pressed="${ans === o}" onclick="chipTap('${id}',${gi},${oi})">${escH(o)}</button>`).join('');
  }
  if (g.type === 'scale') {
    let h = ''; for (let n = g.min; n <= g.max; n++) h += `<button type="button" class="chip scale${String(ans) === String(n) ? ' on' : ''}" aria-pressed="${String(ans) === String(n)}" aria-label="${escH(g.q)} ${n}" onclick="chipTap('${id}',${gi},${n})">${n}</button>`;
    return h;
  }
  if (g.type === 'duration') {
    const d = (ans && typeof ans === 'object') ? ans : {};
    return `<input type="number" inputmode="decimal" min="0" step="any" class="chip-num" id="cn-${id}-${gi}" aria-label="${escH(g.q)} amount" value="${escH(d.n || '')}" oninput="chipDuration('${id}',${gi},'n',this.value)">` +
      (g.units || ['hours', 'days', 'weeks', 'months']).map((u, ui) => `<button type="button" class="chip${d.u === u ? ' on' : ''}" aria-pressed="${d.u === u}" onclick="chipDuration('${id}',${gi},'u',${ui})">${escH(u)}</button>`).join('');
  }
  if (g.type === 'ternary') {
    const st = (ans && typeof ans === 'object' && !Array.isArray(ans)) ? ans : {};
    return (g.options || []).map((o, oi) => {
      const v = st[o]; const cls = v === 'present' ? ' tern-p' : v === 'absent' ? ' tern-a' : '';
      const mark = v === 'present' ? '✓ ' : v === 'absent' ? '✕ ' : '';
      const word = v === 'present' ? 'present' : v === 'absent' ? 'absent' : 'not asked';
      return `<button type="button" class="chip${cls}" aria-label="${escH(o)}: ${word}" onclick="chipTap('${id}',${gi},${oi})">${mark}${escH(o)}</button>`;
    }).join('');
  }
  return '';
}
function chipsBlockHTML(card, groups) {
  let h = '<div class="chips-block">';
  groups.forEach((g, gi) => {
    const hint = g.type === 'multi' ? 'pick all that apply' : g.type === 'ternary' ? 'tap: ✓ present, ✕ absent, again to clear' : g.type === 'scale' ? `${g.min} to ${g.max}` : '';
    h += `<div class="chip-group"><div class="chip-q" id="cq-${card.id}-${gi}">${escH(g.q)}${hint ? ` <span class="chip-hint">${escH(hint)}</span>` : ''}</div><div class="chip-row" id="cr-${card.id}-${gi}" role="group" aria-labelledby="cq-${card.id}-${gi}">${chipGroupInner(card, g, gi)}</div></div>`;
  });
  h += `<div class="chip-preview empty" id="cp-${card.id}" aria-live="polite"></div>`;
  const prompts = (card.hopi || []).filter(Boolean);
  if (prompts.length) h += `<details class="prompts-hint"><summary>Prompts (what to ask)</summary><ul>${prompts.map(q => `<li>${escH(q)}</li>`).join('')}</ul></details>`;
  const typed = (card.answers || []).some(a => a && String(a).trim());
  if (typed) h += `<details class="prompts-hint" open><summary>Earlier typed HOPI answers</summary>${(card.hopi || []).map((q, qi) => `<div class="field"><label>HOPI Q${qi + 1} <span class="guidance">${escH(q)}</span></label><textarea rows="2" oninput="updatePCA('${card.id}',${qi},this.value)">${escH((card.answers || [])[qi] || '')}</textarea></div>`).join('')}</details>`;
  return h + '</div>';
}
function updateChipPreview(card) {
  const el = document.getElementById('cp-' + card.id); if (!el) return;
  const t = composeHopiSentence(card);
  el.textContent = t ? 'Reads as: ' + t : 'Tap chips to build the history. It will read as a sentence in the summary.';
  el.classList.toggle('empty', !t);
}
function refreshChipGroup(card, gi) {
  const groups = chipDefFor(card.label); if (!groups) return;
  const row = document.getElementById('cr-' + card.id + '-' + gi);
  if (row) row.innerHTML = chipGroupInner(card, groups[gi], gi);
  updateChipPreview(card);
}
function chipTap(cardId, gi, oi) {
  const card = pcCards.find(c => c.id === cardId); if (!card) return;
  const groups = chipDefFor(card.label); const g = groups && groups[gi]; if (!g) return;
  const a = chipAnswersOf(card);
  if (g.type === 'multi') {
    const o = g.options[oi]; const cur = Array.isArray(a[g.q]) ? a[g.q].slice() : [];
    const at = cur.indexOf(o); if (at >= 0) cur.splice(at, 1); else cur.push(o);
    a[g.q] = g.options.filter(x => cur.includes(x));              // keep the data.js order
  } else if (g.type === 'single') {
    const o = g.options[oi]; if (a[g.q] === o) delete a[g.q]; else a[g.q] = o;
  } else if (g.type === 'scale') {
    const v = String(oi); if (String(a[g.q]) === v) delete a[g.q]; else a[g.q] = v;
  } else if (g.type === 'ternary') {
    const o = g.options[oi]; const st = (a[g.q] && typeof a[g.q] === 'object' && !Array.isArray(a[g.q])) ? a[g.q] : {};
    const cur = st[o];
    if (!cur) st[o] = 'present'; else if (cur === 'present') st[o] = 'absent'; else delete st[o];
    a[g.q] = st;
  }
  chipPrune(card); refreshChipGroup(card, gi); triggerAutoSave();
}
function chipDuration(cardId, gi, part, val) {
  const card = pcCards.find(c => c.id === cardId); if (!card) return;
  const groups = chipDefFor(card.label); const g = groups && groups[gi]; if (!g || g.type !== 'duration') return;
  const a = chipAnswersOf(card); const d = (a[g.q] && typeof a[g.q] === 'object' && !Array.isArray(a[g.q])) ? a[g.q] : {};
  if (part === 'n') { d.n = String(val).trim(); }
  else { const u = (g.units || ['hours', 'days', 'weeks', 'months'])[val]; d.u = d.u === u ? '' : u; }
  a[g.q] = d; chipPrune(card); triggerAutoSave();
  if (part === 'n') updateChipPreview(card); else refreshChipGroup(card, gi);
}
/* Turn the chip answers into a sentence, for example:
   "Chest Pain: crushing, radiating to left arm, severity 8/10. Associated: sweating, nausea. No syncope." */
function composeHopiSentence(card) {
  const groups = chipDefFor(card && card.label); const a = card && card.chipAnswers;
  if (!groups || !a || typeof a !== 'object' || Array.isArray(a)) return '';
  const parts = [], assoc = [], neg = [];
  const put = (g, v) => parts.push(g.fmt ? g.fmt.replace('{v}', v) : v);
  groups.forEach(g => {
    const v = a[g.q]; if (v === undefined || v === null) return;
    if (g.type === 'multi') { const l = (Array.isArray(v) ? v : []).filter(x => typeof x === 'string' && (g.options || []).includes(x)); if (l.length) put(g, l.join(', ')); }
    else if (g.type === 'single') { if (typeof v === 'string' && (g.options || []).includes(v)) put(g, v); }
    else if (g.type === 'scale') { const n = parseFloat(v); if (isFinite(n) && n >= g.min && n <= g.max) put(g, String(n)); }
    else if (g.type === 'duration') {
      if (typeof v !== 'object' || Array.isArray(v)) return;
      const n = String(v.n == null ? '' : v.n).trim(), u = typeof v.u === 'string' ? v.u : '';
      if (!n || !u) return;
      const unit = (parseFloat(n) === 1 && /s$/.test(u)) ? u.slice(0, -1) : u;
      put(g, n + ' ' + unit);
    }
    else if (g.type === 'ternary') {
      if (typeof v !== 'object' || Array.isArray(v)) return;
      const yes = (g.options || []).filter(o => v[o] === 'present'), no = (g.options || []).filter(o => v[o] === 'absent');
      if (yes.length) assoc.push(g.q + ': ' + yes.join(', '));
      if (no.length) neg.push(no.join(', '));
    }
  });
  if (!parts.length && !assoc.length && !neg.length) return '';
  let t = String(card.label) + (parts.length ? ': ' + parts.join(', ') : '') + '.';
  assoc.forEach(x => { t += ' ' + x + '.'; });
  if (neg.length) t += ' No ' + neg.join(', ') + '.';
  return t;
}
function redFlagListFor(label) {
  const def = medicalDataPools.presentingComplaints.find(p => p.label === label);
  return def && Array.isArray(def.redFlags) ? def.redFlags : [];
}
function redFlagsHTML(card) {
  const rf = redFlagListFor(card.label); if (!rf.length) return '';
  const ticked = Array.isArray(card.redFlagsPresent) ? card.redFlagsPresent : [];
  return `<details class="rf-box"${ticked.length ? ' open' : ''}><summary>Red flags to exclude (${rf.length})${ticked.length ? ` <span class="rf-count">${ticked.length} present</span>` : ''}</summary><div class="rf-hint">Tick any red flag that is PRESENT. Leave the rest unticked.</div>` +
    rf.map((t, i) => `<label class="rf-item"><input type="checkbox" ${ticked.includes(t) ? 'checked' : ''} onchange="toggleRedFlag('${card.id}',${i},this.checked)"><span>${escH(t)}</span></label>`).join('') + `</details>`;
}
function toggleRedFlag(cardId, i, on) {
  const c = pcCards.find(x => x.id === cardId); if (!c) return;
  const text = redFlagListFor(c.label)[i]; if (text === undefined) return;
  const list = Array.isArray(c.redFlagsPresent) ? c.redFlagsPresent.slice() : [];
  const at = list.indexOf(text);
  if (on && at < 0) list.push(text); else if (!on && at >= 0) list.splice(at, 1);
  c.redFlagsPresent = list;
  const sum = document.querySelector('#' + cardId + ' details.rf-box summary');
  if (sum) sum.innerHTML = `Red flags to exclude (${redFlagListFor(c.label).length})` + (list.length ? ` <span class="rf-count">${list.length} present</span>` : '');
  triggerAutoSave();
}
function removePC(id) { pcCards = pcCards.filter(c => c.id !== id); renderPCCards(); updateProgress(); triggerAutoSave(); }
function updatePCA(cardId, qi, val) { const c = pcCards.find(c=>c.id===cardId); if(c){if(!c.answers)c.answers=[];c.answers[qi]=val;} }
function updatePCF(cardId, field, val) { const c = pcCards.find(c=>c.id===cardId); if(c)c[field]=val; }
