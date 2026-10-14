/* pwa.js - Install and update (service worker). */

/* ---------- install and offline (needs https or localhost; silently does nothing for a local file) */
let pwaDeferred = null, pwaReloading = false;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); pwaDeferred = e; });
window.addEventListener('appinstalled', () => { pwaDeferred = null; showToast('HistoryOsis installed.', 'success'); });
function pwaInstall() {
  if (!pwaDeferred) return;
  pwaDeferred.prompt();
  pwaDeferred.userChoice.then(() => {}, () => {}).then(() => { pwaDeferred = null; const b = document.getElementById('set-pwa-install'); if (b) b.style.display = 'none'; });
}
function pwaStatusText() {
  const standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
  if (!/^https?:$/.test(location.protocol)) return 'Offline install is not available because the app is open as a local file. Host the files over HTTPS to turn it on (see HOSTING.md).';
  if (!('serviceWorker' in navigator)) return 'This browser does not support offline install.';
  if (navigator.serviceWorker.controller) return (standalone ? 'Installed. ' : '') + 'Offline ready: the app opens without internet.';
  return 'Not stored for offline use yet. Keep this page open while online, then reload once.';
}
function pwaSettingsHTML() {
  return `<div class="field"><label>Install and offline use</label>
    <div id="set-pwa-status" style="font-size:0.8rem;color:var(--text-muted)">${escH(pwaStatusText())}</div>
    <button type="button" class="btn btn-secondary btn-sm" id="set-pwa-install" style="margin-top:8px;${pwaDeferred ? '' : 'display:none'}" onclick="pwaInstall()">Install app on this device</button></div>`;
}
function pwaUpdateBar(worker) {
  if (document.getElementById('update-bar')) return;
  const bar = document.createElement('div'); bar.id = 'update-bar'; bar.setAttribute('role', 'alert');
  bar.innerHTML = '<span>Update available. Your draft is kept when you reload.</span><button type="button" class="btn btn-primary" id="update-reload">Reload</button><button type="button" class="btn btn-secondary" id="update-later">Later</button>';
  document.body.appendChild(bar);
  document.getElementById('update-later').onclick = () => bar.remove();
  document.getElementById('update-reload').onclick = () => {
    pwaReloading = true;
    try { triggerAutoSave(); } catch (e) {}                       // flush the draft first
    setTimeout(() => { try { worker.postMessage({ type: 'SKIP_WAITING' }); } catch (e) { location.reload(); } }, 1700);
  };
}
function pwaWatch(reg) {
  if (reg.waiting && navigator.serviceWorker.controller) pwaUpdateBar(reg.waiting);
  reg.addEventListener('updatefound', () => {
    const nw = reg.installing; if (!nw) return;
    nw.addEventListener('statechange', () => { if (nw.state === 'installed' && navigator.serviceWorker.controller) pwaUpdateBar(nw); });
  });
  setInterval(() => { try { reg.update(); } catch (e) {} }, 6 * 3600 * 1000);
}
function pwaInit() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  try {
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (pwaReloading) location.reload(); });
    navigator.serviceWorker.register('sw.js').then(pwaWatch).catch(() => {});
  } catch (e) {}
}
window.addEventListener('load', pwaInit);
