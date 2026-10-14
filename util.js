/* util.js - Small pure helpers (escaping, CSV, import parsing, hex). No DOM access. */
'use strict';

function csvCell(v) {
  let t = v == null ? '' : String(v).replace(/\s+/g, ' ').trim();
  if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;                          // spreadsheet formula injection
  return '"' + t.replace(/"/g, '""') + '"';
}
function g(id) { return (document.getElementById(id)||{}).value||''; }
function isPlainObj(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }
/* Decide what an import file contains. Accepts {records:[...]}, a bare array, or one record.
   Returns { imported: every candidate, valid: usable records, invalidCount }. Pure, so tests.html can call it. */
function parseImportPayload(data) {
  let imported = [];
  if (data && data.records && Array.isArray(data.records)) imported = data.records;
  else if (Array.isArray(data)) imported = data;
  else if (data && data.id && data.demographics) imported = [data];
  const valid = []; let invalidCount = 0;
  imported.forEach(r => {
    if (isPlainObj(r) && r.id && isPlainObj(r.demographics)) valid.push(r);
    else invalidCount++;   // null, text, numbers, or no id / demographics
  });
  return { imported, valid, invalidCount };
}
function formatNoteTimestamp(ts) {
  if (!ts) return 'Unknown time';
  if (ts.includes('T')) return new Date(ts).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  return ts;
}
function escH(str) {
  if(!str)return'';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function buf2hex(buf) { return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join(''); }
function hex2buf(hex) { return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))); }
