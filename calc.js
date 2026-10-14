/* calc.js - Vitals maths: height/weight parsing, BMI, Shock Index, NEWS2. Reads the form only through readVitals / calcBMI / calcShockIndex. */
'use strict';

function parseHeightToCm(raw) {
  const h = (raw || '').trim();
  if (!h) return null;
  let m;
  if ((m = h.match(/^(\d+(?:\.\d+)?)\s*cm$/i))) return parseFloat(m[1]);
  if ((m = h.match(/^(\d+(?:\.\d+)?)\s*m(?:etres?|eters?)?$/i))) return parseFloat(m[1]) * 100;
  if ((m = h.match(/^(\d+)\s*(?:['’′]|ft|feet|foot)\s*(?:(\d+(?:\.\d+)?)\s*(?:["”″]|in|inch|inches)?)?$/i))) {
    return (parseFloat(m[1]) * 12 + (parseFloat(m[2]) || 0)) * 2.54;
  }
  if ((m = h.match(/^(\d+(?:\.\d+)?)\s*(?:["”″]|in|inch|inches)$/i))) return parseFloat(m[1]) * 2.54;
  if ((m = h.match(/^(\d+(?:\.\d+)?)$/))) {
    const n = parseFloat(m[1]);
    if (n >= 100) return n;
    if (n >= 1 && n <= 2.5) return n * 100;
    return n * 2.54;
  }
  return null;
}
function parseWeightToKg(raw) {
  const w = (raw || '').trim();
  let m;
  if ((m = w.match(/(\d+(?:\.\d+)?)\s*kg/i))) return parseFloat(m[1]);
  if ((m = w.match(/(\d+(?:\.\d+)?)\s*lbs?/i))) return parseFloat(m[1]) * 0.453592;
  if ((m = w.match(/^(\d+(?:\.\d+)?)$/))) return parseFloat(m[1]);
  return null;
}
function calcBMI(silent) {
  const heightRaw = document.getElementById('vs-height')?.value || '';
  const weightRaw = document.getElementById('vs-weight')?.value || '';
  const out = document.getElementById('vs-bmi');
  const heightCm = parseHeightToCm(heightRaw);
  const weightKg = parseWeightToKg(weightRaw);
  const ok = heightCm && weightKg && heightCm >= 50 && heightCm <= 260 && weightKg >= 1 && weightKg <= 500;
  if (!ok) {
    if (!silent && (heightRaw || weightRaw)) showToast('Could not read height/weight. Try "170 cm", "5\'10\"", "70 kg" or "150 lbs".', 'warning');
    out.value = '';
    return;
  }
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  out.value = bmi.toFixed(1);
  if (!silent) showToast(`BMI calculated: ${bmi.toFixed(1)}`, 'success');
}
function calcShockIndex(silent) {
  const bpRaw = document.getElementById('vs-bp')?.value || '';
  const pulseRaw = document.getElementById('vs-pulse')?.value || '';
  let systolic = null;
  const bpMatch = bpRaw.match(/(\d+)\s*(?:\/|mmhg)/i);
  const bpPlain = bpRaw.match(/^\s*(\d+)\s*$/);
  if (bpMatch) systolic = parseFloat(bpMatch[1]);
  else if (bpPlain) systolic = parseFloat(bpPlain[1]);
  const hrMatch = pulseRaw.match(/(\d+(?:\.\d+)?)/);
  const hr = hrMatch ? parseFloat(hrMatch[1]) : null;
  const indexField = document.getElementById('vs-shock-index');

  if (!systolic || !hr || systolic <= 0 || hr <= 0) {
    if (!silent && (bpRaw || pulseRaw)) showToast('Enter BP and Pulse to calculate Shock Index.', 'warning');
    if (indexField) { indexField.value = ''; indexField.className = ''; }
    return;
  }
  const si = (hr / systolic).toFixed(2);
  const siNum = parseFloat(si);
  let interpretation;
  if (siNum < 0.7) interpretation = 'Normal';
  else if (siNum < 0.9) interpretation = 'Borderline';
  else if (siNum < 1.0) interpretation = 'Elevated';
  else if (siNum < 1.4) interpretation = 'Shock (moderate)';
  else interpretation = 'Severe Shock';
  const type = siNum >= 1.0 ? 'error' : siNum >= 0.7 ? 'warning' : 'success';
  if (indexField) {
    indexField.value = si;
    indexField.className = siNum >= 1.0 ? 'badge-red' : '';
  }
  if (!silent) showToast(`Shock Index: ${si} — ${interpretation}`, type);
}
function ageToYears(age, unit) {               // age as typed, unit '' | 'months' | 'days'  ->  years, or null
  const n = parseFloat(age);
  if (!isFinite(n) || n < 0) return null;
  return unit === 'months' ? n / 12 : unit === 'days' ? n / 365 : n;
}
/* ============================================================
   VITALS ALERTS, NEWS2 & ALLERGY SAFETY  (advisory only - never blocks saving)
   ============================================================ */
function vitalNum(raw) {                       // tolerant: "96 bpm", "97%", "18/min" -> number
  const m = String(raw == null ? '' : raw).match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}
function vitalSystolic(raw) {                  // "130/85", "130", "130 mmHg"
  const t = String(raw == null ? '' : raw);
  const m = t.match(/(\d+)\s*(?:\/|mmhg)/i) || t.match(/^\s*(\d+)\s*$/);
  return m ? parseFloat(m[1]) : null;
}
function vitalTempC(raw) {                     // the field is labelled °F; values under 50 are read as °C
  const t = String(raw == null ? '' : raw);
  const n = vitalNum(t);
  if (n === null) return null;
  let c;
  if (/c\b|°\s*c/i.test(t)) c = n;
  else if (/f\b|°\s*f/i.test(t)) c = (n - 32) * 5 / 9;
  else c = n >= 50 ? (n - 32) * 5 / 9 : n;
  if (c < 25 || c > 46) return null;           // not a plausible body temperature
  return Math.round(c * 10) / 10;
}
function vitalGCS(raw) {                       // "15", "15 (E4V5M6)", "E3 V4 M5"
  const t = String(raw == null ? '' : raw);
  const e = t.match(/E\s*([1-4])/i), vv = t.match(/V\s*([1-5])/i), mm = t.match(/M\s*([1-6])/i);
  if (e && vv && mm) return parseInt(e[1]) + parseInt(vv[1]) + parseInt(mm[1]);
  const n = vitalNum(t);
  return (n !== null && n >= 3 && n <= 15) ? Math.round(n) : null;
}
/* NEWS2 (Royal College of Physicians, 2017) parameter scores. Each returns 0-3, or null when the value is missing. */
const NEWS2_TABLE = {
  rr:   v => v <= 8 ? 3 : v <= 11 ? 1 : v <= 20 ? 0 : v <= 24 ? 2 : 3,
  spo2s1: v => v <= 91 ? 3 : v <= 93 ? 2 : v <= 95 ? 1 : 0,
  spo2s2: (v, onO2) => v <= 83 ? 3 : v <= 85 ? 2 : v <= 87 ? 1 : v <= 92 ? 0 : !onO2 ? 0 : v <= 94 ? 1 : v <= 96 ? 2 : 3,
  sbp:  v => v <= 90 ? 3 : v <= 100 ? 2 : v <= 110 ? 1 : v <= 219 ? 0 : 3,
  hr:   v => v <= 40 ? 3 : v <= 50 ? 1 : v <= 90 ? 0 : v <= 110 ? 1 : v <= 130 ? 2 : 3,
  temp: v => v <= 35.0 ? 3 : v <= 36.0 ? 1 : v <= 38.0 ? 0 : v <= 39.0 ? 1 : 2
};
function readVitals() {
  const val = id => (document.getElementById(id) || {}).value || '';
  return {
    rr: vitalNum(val('vs-rr')), spo2: vitalNum(val('vs-spo2')), sbp: vitalSystolic(val('vs-bp')),
    hr: vitalNum(val('vs-pulse')), tempC: vitalTempC(val('vs-temp')), gcs: vitalGCS(val('vs-gcs')),
    o2: val('vs-o2'), consc: val('vs-consc'), scale2: !!(document.getElementById('vs-scale2') || {}).checked
  };
}
function news2Compute(v) {
  const onO2 = v.o2 === 'Yes';
  const parts = {
    rr: v.rr === null ? null : NEWS2_TABLE.rr(Math.round(v.rr)),
    spo2: v.spo2 === null ? null : (v.scale2 ? NEWS2_TABLE.spo2s2(Math.round(v.spo2), onO2) : NEWS2_TABLE.spo2s1(Math.round(v.spo2))),
    o2: v.o2 === '' ? null : (onO2 ? 2 : 0),
    sbp: v.sbp === null ? null : NEWS2_TABLE.sbp(v.sbp),
    hr: v.hr === null ? null : NEWS2_TABLE.hr(v.hr),
    consc: v.consc === '' ? null : (v.consc === 'Alert' ? 0 : 3),
    temp: v.tempC === null ? null : NEWS2_TABLE.temp(v.tempC)
  };
  const names = { rr: 'respiratory rate', spo2: 'SpO₂', o2: 'oxygen', sbp: 'systolic BP', hr: 'pulse', consc: 'consciousness', temp: 'temperature' };
  const missing = Object.keys(parts).filter(k => parts[k] === null).map(k => names[k]);
  const entered = Object.keys(parts).filter(k => parts[k] !== null);
  const total = entered.reduce((a, k) => a + parts[k], 0);
  const anyThree = entered.some(k => parts[k] === 3);
  let band = '', cls = '', response = '';
  if (entered.length) {
    if (total >= 7) { band = 'High'; cls = 'n2-high'; response = 'Emergency response: continuous monitoring and immediate review by a team with critical-care competence; consider transfer to higher level of care.'; }
    else if (total >= 5) { band = 'Medium'; cls = 'n2-med'; response = 'Urgent response: urgent review by a clinician skilled in acute illness; consider critical-care outreach; increase monitoring.'; }
    else if (anyThree) { band = 'Low-medium'; cls = 'n2-lowmed'; response = 'Single red score: urgent ward-based review by a clinician to decide whether escalation is needed.'; }
    else { band = 'Low'; cls = 'n2-low'; response = total === 0 ? 'Continue routine monitoring (at least every 12 hours).' : 'Ward-based response: nurse assessment, observations at least every 4–6 hours.'; }
  }
  return { parts, total, anyThree, band, cls, response, missing, entered: entered.length };
}
function news2Stored() {                       // value saved with the record
  const r = news2Compute(readVitals());
  return r.entered ? { score: String(r.total), band: r.band, partial: r.missing.length ? 'Yes' : '' } : { score: '', band: '', partial: '' };
}
/* Per-vital normal / abnormal / critical tag (adult defaults).
   Critical = a NEWS2 score of 3 (or a very extreme value); "normal" uses everyday clinical ranges, so it is not identical to NEWS2 score 0.
     RR      normal 12-20      abnormal 9-11, 21-24            critical <=8, >=25
     SpO2    normal >=94       abnormal 92-93                  critical <=91          (Scale 2: see below)
     SBP     normal 101-159    abnormal 91-100, 160-219        critical <=90, >=220
     Pulse   normal 51-100     abnormal 41-50, 101-130         critical <=40, >=131
     Temp    normal 36.1-37.9  abnormal 35.1-36.0, 38.0-40.9   critical <=35.0, >=41.0
     GCS     normal 15         abnormal 9-14                   critical <=8
   Returns { cls, text } or null when empty/unreadable. */
function vitalTag(kind, v) {
  const tag = (cls, text) => ({ cls, text });
  const band = (x, crit, abn) => crit(x) ? tag('crit', 'Critical') : abn(x) ? tag('warn', 'Abnormal') : tag('ok', 'Normal');
  switch (kind) {
    case 'rr': { if (v.rr === null) return null; const x = Math.round(v.rr); return band(x, x => x <= 8 || x >= 25, x => x <= 11 || x >= 21); }
    case 'spo2': {
      if (v.spo2 === null) return null; const x = Math.round(v.spo2);
      if (v.scale2) { const p = NEWS2_TABLE.spo2s2(x, v.o2 === 'Yes'); return p === 3 ? tag('crit', 'Critical') : p > 0 ? tag('warn', 'Abnormal') : tag('ok', 'Normal'); }
      return band(x, x => x <= 91, x => x <= 93);
    }
    case 'bp': return v.sbp === null ? null : band(v.sbp, x => x <= 90 || x >= 220, x => x <= 100 || x >= 160);
    case 'pulse': return v.hr === null ? null : band(v.hr, x => x <= 40 || x >= 131, x => x <= 50 || x >= 101);
    case 'temp': { if (v.tempC === null) return null; const t = band(v.tempC, x => x <= 35.0 || x >= 41.0, x => x <= 36.0 || x >= 38.0); t.text += ' (' + v.tempC.toFixed(1) + ' °C)'; return t; }
    case 'gcs': return v.gcs === null ? null : v.gcs >= 15 ? tag('ok', 'Normal') : v.gcs >= 9 ? tag('warn', 'Abnormal') : tag('crit', 'Critical');
  }
  return null;
}
