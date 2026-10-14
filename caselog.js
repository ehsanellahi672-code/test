/* caselog.js - Case log (CSV). */
'use strict';

function caseSystems(r) {
  const pools = (typeof medicalDataPools !== 'undefined' && medicalDataPools.presentingComplaints) || [], out = [];
  ((r.history && r.history.pcs) || []).forEach(pc => { const def = pools.find(p => p.label === (pc && pc.label)); const l = def && (systemLabels[def.system] || def.system); if (l && !out.includes(l)) out.push(l); });
  if (!out.length) (((r.exam && r.exam.systems) || [])).forEach(x => { if (x && x.system && !out.includes(x.system)) out.push(x.system); });
  return out;
}
function buildCaseLogCSV(records, anon) {
  const head = ['Case no.', 'Date'].concat(anon ? [] : ['Patient name', 'MR number'], ['Age', 'Sex', 'Department', 'Primary diagnosis', 'Systems involved', 'Role', 'Credentials', 'Signed by', 'Supervisor']);
  const rows = [head.map(csvCell).join(',')];
  records.forEach((r, i) => {
    const d = r.demographics || {}, c = r.credentials || {}, tx = r.treatment || {};
    const age = d.age ? String(d.age) + (d.ageUnit === 'months' ? ' months' : d.ageUnit === 'days' ? ' days' : '') : '';
    const cred = c.role === 'Doctor' ? [c.designation, c.department] : [c.roll && 'Roll ' + c.roll, c.year, c.ward && 'Ward ' + c.ward];
    rows.push([i + 1, recDateOf(r)].concat(anon ? [] : [d.name, d.mrno], [age, d.sex, d.dept, tx.primaryDx, caseSystems(r).join('; '), c.role, cred.filter(Boolean).join('; '), c.name, c.supervisor]).map(csvCell).join(','));
  });
  return rows.join('\r\n') + '\r\n';
}
async function openCaseLog() {
  let all; try { all = (await dbGetAll()).filter(r => !r.deletedAt); } catch (e) { showToast('Failed to load records.', 'error'); return; }
  if (!all.length) { showToast('No records to export.', 'warning'); return; }
  const shown = new Set(recFilterSort(all, ((document.getElementById('search-records') || {}).value || '').toLowerCase().trim()).map(r => r.id));
  const rows = all.map(r => { const d = r.demographics || {}, nm = d.name || 'Unknown';
    return `<label class="cl-row"><input type="checkbox" class="cl-chk" value="${escH(r.id)}" ${shown.has(r.id) ? 'checked' : ''}><span><strong>${escH(lockSettings.hideNames ? getInitials(nm) : nm)}</strong>${d.mrno ? ' · ' + escH(d.mrno) : ''}<br><span style="color:var(--text-muted)">${escH(recDateOf(r))}${(r.treatment && r.treatment.primaryDx) ? ' · ' + escH(r.treatment.primaryDx) : ''}</span></span></label>`; }).join('');
  const html = `<p style="font-size:0.82rem;margin-bottom:8px">Choose the records for the log. The ones currently shown in your list are ticked.</p>
    <div style="display:flex;gap:6px;margin-bottom:8px"><button type="button" class="btn btn-secondary btn-sm" onclick="clToggle(true)">Tick all</button><button type="button" class="btn btn-secondary btn-sm" onclick="clToggle(false)">Tick none</button></div>
    <label class="cl-row" style="border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:8px;padding:8px 10px"><input type="checkbox" id="cl-anon" checked><span><strong>Anonymise</strong><br><span style="color:var(--text-muted)">Leaves out patient names and MR numbers. Bed, address and date of birth are never included.</span></span></label>
    <div id="cl-list">${rows}</div>`;
  showCustomBodyModal('Export case log (CSV)', html, () => {
    const ids = new Set([...document.querySelectorAll('#cl-list .cl-chk:checked')].map(c => c.value));
    if (!ids.size) { showToast('Tick at least one record.', 'warning'); return; }
    const anon = document.getElementById('cl-anon').checked;
    const csv = buildCaseLogCSV(all.filter(r => ids.has(r.id)), anon);
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })), a = document.createElement('a');
    a.href = url; a.download = `historyosis-case-log-${new Date().toISOString().split('T')[0]}${anon ? '-anonymised' : ''}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    closeModal(); showToast(`Case log exported (${ids.size}).`, 'success');
  }, 'Download CSV');
}
function clToggle(on) { document.querySelectorAll('#cl-list .cl-chk').forEach(c => { c.checked = on; }); }
