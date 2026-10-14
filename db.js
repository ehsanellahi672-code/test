/* db.js - IndexedDB storage (records, version history) and its migration. */
'use strict';

/* ============================================================
   INDEXEDDB ENGINE
   ============================================================ */
const DB_NAME = 'HistoryOsisDB';
const DB_VERSION = 2;                 // v2 adds the 'versions' store (Prompt 11); existing records are untouched
const STORE_NAME = 'records';
const dbReady = new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onupgradeneeded = e => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains('versions')) {
      db.createObjectStore('versions', { keyPath: 'vid' }).createIndex('rid', 'rid', { unique: false });
    }
  };
  req.onblocked = () => { try { showToast('Close other HistoryOsis tabs to finish updating.', 'warning'); } catch (e) {} };
  req.onsuccess = e => { const db = e.target.result; db.onversionchange = () => db.close(); resolve(db); };
  req.onerror  = e => reject(e.target.error);
});
async function dbGetAll() {
  const db = await dbReady;
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(
      (req.result || []).sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
    );
    req.onerror = () => reject(req.error);
  });
}
async function dbPut(record) {
  const db = await dbReady;
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(record);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}
async function dbDelete(id) {
  const db = await dbReady;
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).delete(id);
    req.onsuccess = () => { verDropFor(id).catch(() => {}).then(resolve); };
    req.onerror   = () => reject(req.error);
  });
}
async function dbClear() {
  const db = await dbReady;
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).clear();
    req.onsuccess = () => { verClearAll().catch(() => {}).then(resolve); };
    req.onerror   = () => reject(req.error);
  });
}
async function runMigration() {
  const raw = localStorage.getItem('historyosis_records');
  if (!raw) return;
  try {
    const old = JSON.parse(raw);
    if (Array.isArray(old) && old.length > 0) {
      for (const rec of old) await dbPut(rec);
      localStorage.removeItem('historyosis_records');
      showToast(`Migrated ${old.length} record(s) to secure storage.`, 'success');
    }
  } catch (e) { /* silent */ }
}
const VER_MAX = 10;
/* ---------- version history ---------- */
async function verAll(rid) {
  const db = await dbReady; if (!db.objectStoreNames.contains('versions')) return [];
  return new Promise((res, rej) => {
    const rq = db.transaction('versions', 'readonly').objectStore('versions').index('rid').getAll(rid);
    rq.onsuccess = () => res((rq.result || []).sort((a, b) => String(b.at).localeCompare(String(a.at)) || String(b.vid).localeCompare(String(a.vid))));
    rq.onerror = () => rej(rq.error);
  });
}
async function verWrite(puts, dels) {
  const db = await dbReady; if (!db.objectStoreNames.contains('versions')) return;
  return new Promise((res, rej) => {
    const tx = db.transaction('versions', 'readwrite'), st = tx.objectStore('versions');
    puts.forEach(v => st.put(v)); dels.forEach(k => st.delete(k));
    tx.oncomplete = () => res(); tx.onerror = tx.onabort = () => rej(tx.error);
  });
}
async function verDropFor(rid) { const l = await verAll(rid); if (l.length) await verWrite([], l.map(v => v.vid)); }
async function verClearAll() {
  const db = await dbReady; if (!db.objectStoreNames.contains('versions')) return;
  return new Promise((res, rej) => { const tx = db.transaction('versions', 'readwrite'); tx.objectStore('versions').clear(); tx.oncomplete = () => res(); tx.onerror = tx.onabort = () => rej(tx.error); });
}
function verCore(r) { const c = JSON.parse(JSON.stringify(r)); delete c.progressNotes; delete c.deletedAt; delete c.savedAt; delete c.reviews; delete c.signoff; return c; }
let verSeq = 0;
function verMake(r, at) { return { vid: 'v-' + Date.now().toString(36) + '-' + (verSeq++).toString(36) + Math.random().toString(36).slice(2, 5), rid: r.id, at: at || r.savedAt || new Date().toISOString(), rec: verCore(r) }; }
// Keeps a snapshot of `rec` (just saved). A record saved before this feature existed gets its earlier state kept first, so "restore the first version" still works.
async function verSnapshot(rec, prev) {
  const list = await verAll(rec.id), puts = [];
  let latest = list[0];
  if (!list.length && prev) { const pv = verMake(prev, prev.savedAt); pv.legacy = true; puts.push(pv); latest = pv; }
  if (latest && JSON.stringify(latest.rec) === JSON.stringify(verCore(rec))) { if (puts.length) await verWrite(puts, []); return; }   // nothing changed: no new version
  puts.push(verMake(rec, rec.savedAt));
  const all = list.concat(puts).sort((a, b) => String(b.at).localeCompare(String(a.at)) || String(b.vid).localeCompare(String(a.vid)));
  await verWrite(puts, all.slice(VER_MAX).map(v => v.vid));
}
const VER_SECTIONS = [['demographics', 'Demographics'], ['history', 'History'], ['exam', 'Examination'], ['investigations', 'Investigations'], ['treatment', 'Plan'], ['credentials', 'Signing details']];
function verChanged(newer, older) {
  const j = v => JSON.stringify(v === undefined ? null : v), out = [];
  VER_SECTIONS.forEach(([k, l]) => { if (j(newer[k]) !== j(older[k])) out.push(l); });
  if (j(newer.tags) !== j(older.tags) || j(newer.status) !== j(older.status)) out.push('Tags / status');
  return out;
}
