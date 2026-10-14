/* lock.js - App PIN lock. */
'use strict';

/* ============================================================
   APP LOCK & PRIVACY LOGIC
   ============================================================ */
let lockSettings = { enabled: false, hash: '', salt: '', timeout: 2, hideNames: false };
let failedAttempts = 0;
let isLocked = false;
let inactivityTimer = null;
let lastHiddenTime = 0;
let lockoutEndTime = 0;
let lockoutInterval = null;
/* Failed-attempt count and lockout end time survive a page refresh (otherwise refreshing resets the lockout). */
function loadLockState() {
    try {
        const s = JSON.parse(localStorage.getItem('historyosis_lock_state') || '{}');
        failedAttempts = Math.max(0, parseInt(s.failed) || 0);
        lockoutEndTime = Number(s.until) || 0;
        if (lockoutEndTime - Date.now() > 300000) lockoutEndTime = Date.now() + 300000;   // clock changed: never longer than the max penalty
    } catch(e) {}
}
function saveLockState() {
    try {
        if (failedAttempts === 0 && lockoutEndTime === 0) localStorage.removeItem('historyosis_lock_state');
        else localStorage.setItem('historyosis_lock_state', JSON.stringify({ failed: failedAttempts, until: lockoutEndTime }));
    } catch(e) {}
}
function loadLockSettings() {
    try {
        const s = localStorage.getItem('historyosis_lock');
        if (s) Object.assign(lockSettings, JSON.parse(s));
        if (lockSettings.timeout === undefined) lockSettings.timeout = 2;
    } catch(e){}
}
function saveLockSettings() {
    try { localStorage.setItem('historyosis_lock', JSON.stringify(lockSettings)); } catch(e){}
}
function triggerLock(immediate = false) {
    if (!lockSettings.enabled) return;
    isLocked = true;
    document.documentElement.classList.remove('lock-boot');
    closeModal();                                                   // no dialog may stay open (or readable) behind the lock
    document.getElementById('toast-container').innerHTML = '';
    document.getElementById('records-container').innerHTML = '';    // patient names leave the page while locked
    document.getElementById('summary-view').innerHTML = '';
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    document.getElementById('app-header').style.display = 'none';
    document.getElementById('app-main').style.display = 'none';
    document.getElementById('fab-new-intake').style.display = 'none';
    document.getElementById('lock-screen').style.display = 'flex';
    document.getElementById('lock-pin').value = '';
    document.getElementById('lock-pin').focus();
    updateLockoutUI();
}
document.getElementById('lock-pin').addEventListener('keydown', function(e) {
    if(e.key === 'Enter') attemptUnlock();
});
async function attemptUnlock() {
    if (Date.now() < lockoutEndTime) return;
    const pin = document.getElementById('lock-pin').value;
    if (!pin) return;
    const btn = document.getElementById('btn-unlock');
    btn.disabled = true;

    let valid = false;
    try { valid = await verifyPin(pin); }
    catch (e) { btn.disabled = false; return showToast('Unlock needs a secure browser context (https or file).', 'error'); }
    if (valid) {
        isLocked = false;
        failedAttempts = 0; lockoutEndTime = 0; saveLockState();
        document.getElementById('app-header').style.display = 'block';
        document.getElementById('app-main').style.display = 'block';
        document.getElementById('fab-new-intake').style.display = 'flex';
        document.getElementById('lock-screen').style.display = 'none';
        document.getElementById('lock-pin').value = '';
        resetInactivityTimer();
        renderRecords();
    } else {
        failedAttempts++;
        document.getElementById('lock-pin').value = '';
        if (failedAttempts >= 5) {
            let penalty = 30000;
            if (failedAttempts === 6) penalty = 60000;
            if (failedAttempts > 6) penalty = 300000;
            lockoutEndTime = Date.now() + penalty;
            saveLockState();
            updateLockoutUI();
        } else {
            saveLockState();
            showToast(`Incorrect PIN. ${5 - failedAttempts} attempt(s) left.`, 'error');
            btn.disabled = false;
        }
    }
}
function updateLockoutUI() {
    const btn = document.getElementById('btn-unlock');
    const inp = document.getElementById('lock-pin');
    const msg = document.getElementById('lockout-timer');
    if (lockoutInterval) { clearInterval(lockoutInterval); lockoutInterval = null; }
    if (Date.now() < lockoutEndTime) {
        btn.disabled = true; inp.disabled = true; msg.style.display = 'block';
        const tick = () => {
            const rem = Math.ceil((lockoutEndTime - Date.now()) / 1000);
            if (rem <= 0) {
                clearInterval(lockoutInterval); lockoutInterval = null;
                lockoutEndTime = 0; saveLockState();   // attempts stay counted: the next wrong PIN gets the longer penalty
                btn.disabled = false; inp.disabled = false; msg.style.display = 'none';
                inp.value = ''; inp.focus();
            } else { msg.textContent = `Too many attempts. Try again in ${rem}s`; }
        };
        tick();
        if (lockoutEndTime > 0) lockoutInterval = setInterval(tick, 1000);
    } else {
        btn.disabled = false; inp.disabled = false; msg.style.display = 'none';
    }
}
function resetInactivityTimer() {
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (!lockSettings.enabled || lockSettings.timeout === 0 || isLocked) return;
    inactivityTimer = setTimeout(() => triggerLock(), lockSettings.timeout * 60000);
}
['touchstart', 'touchmove', 'mousemove', 'mousedown', 'click', 'keydown', 'scroll', 'wheel'].forEach(evt => document.addEventListener(evt, resetInactivityTimer, {passive: true}));
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (lockSettings.enabled) {
            document.getElementById('privacy-blanket').style.display = 'block';
            lastHiddenTime = Date.now();
        }
    } else {
        document.getElementById('privacy-blanket').style.display = 'none';
        if (lockSettings.enabled && lastHiddenTime > 0) {
            if (Date.now() - lastHiddenTime > 30000) triggerLock();
            lastHiddenTime = 0;
            resetInactivityTimer();
        }
    }
});
/* --- Config UI --- */
function showSetPinModal(title, doneMsg) {
    showCustomBodyModal(title, `<input type="password" id="new-pin" autocomplete="off" autocapitalize="off" maxlength="64" placeholder="PIN or passphrase (4-64 characters)"><br><br><input type="password" id="new-pin-confirm" autocomplete="off" autocapitalize="off" maxlength="64" placeholder="Confirm PIN or passphrase">`, async () => {
        const p1 = document.getElementById('new-pin').value;
        const p2 = document.getElementById('new-pin-confirm').value;
        if (p1.length < 4 || p1.length > 64) return showToast('PIN / passphrase must be 4 to 64 characters', 'error');
        if (p1 !== p2) return showToast('PINs do not match', 'error');
        let salt, hash;
        try { salt = crypto.getRandomValues(new Uint8Array(16)); hash = await hashPin(p1, salt); }
        catch (e) { return showToast('App Lock needs a secure browser context (https or file).', 'error'); }
        lockSettings.enabled = true;
        lockSettings.salt = buf2hex(salt);
        lockSettings.hash = buf2hex(hash);
        saveLockSettings();
        failedAttempts = 0; lockoutEndTime = 0; saveLockState();
        document.getElementById('btn-lock-now').style.display = 'inline-flex';
        resetInactivityTimer();
        closeModal();
        showToast(doneMsg, 'success');
    });
}
async function openLockSettings() {
    if (!lockSettings.enabled) {
        showSetPinModal('Set App Lock', 'App Lock enabled');
    } else {
        showCustomBodyModal('Authentication Required', `<input type="password" id="auth-pin" placeholder="Enter current PIN">`, async () => {
            const btn = document.getElementById('modal-confirm-btn');
            btn.disabled = true;
            const p = document.getElementById('auth-pin').value;
            const valid = await verifyPin(p);
            if (!valid) { btn.disabled = false; return showToast('Incorrect PIN', 'error'); }
            closeModal();
            setTimeout(showLockMgmt, 300);
        }, 'Proceed');
    }
}
function showLockMgmt() {
    const html = `
        <div class="field"><label>Auto-Lock Timer</label>
        <select id="set-auto-lock">
          <option value="0" ${lockSettings.timeout===0?'selected':''}>Off</option>
          <option value="1" ${lockSettings.timeout===1?'selected':''}>1 minute</option>
          <option value="2" ${lockSettings.timeout===2?'selected':''}>2 minutes</option>
          <option value="5" ${lockSettings.timeout===5?'selected':''}>5 minutes</option>
          <option value="10" ${lockSettings.timeout===10?'selected':''}>10 minutes</option>
        </select></div>
        <div class="btn-group">
           <button class="btn btn-warning" onclick="changePinFlow()">Change PIN</button>
           <button class="btn btn-danger" onclick="disableLock()">Turn Off Lock</button>
        </div>
    `;
    showCustomBodyModal('Lock Settings', html, () => {
        lockSettings.timeout = parseInt(document.getElementById('set-auto-lock').value);
        saveLockSettings();
        resetInactivityTimer();
        closeModal();
        showToast('Settings saved', 'success');
    }, 'Save');
}
function disableLock() {
    lockSettings.enabled = false;
    lockSettings.hash = '';
    lockSettings.salt = '';
    saveLockSettings();
    failedAttempts = 0; lockoutEndTime = 0; saveLockState();
    document.getElementById('btn-lock-now').style.display = 'none';
    closeModal();
    showToast('App Lock disabled', 'success');
}
function changePinFlow() {
    // The old PIN stays in force until the new one is saved; Cancel changes nothing.
    closeModal();
    setTimeout(() => showSetPinModal('Change PIN', 'PIN changed'), 300);
}
function forgotPin() {
    showCustomBodyModal('Forgot PIN?', `<p style="margin-bottom:12px;">The only way to regain access is to erase all patient records and reset the app. Please type <strong>ERASE</strong> below to confirm.</p><input type="text" id="erase-confirm" autocomplete="off" autocapitalize="characters" placeholder="Type ERASE">`, async () => {
        const val = document.getElementById('erase-confirm').value;
        if (val !== 'ERASE') return showToast('Type ERASE to confirm', 'error');
        try {
            Object.keys(localStorage).filter(k => k.indexOf('historyosis_') === 0).forEach(k => localStorage.removeItem(k));
        } catch(e) {}
        try { await dbClear(); } catch(e) { return showToast('Could not erase records: ' + (e && e.message || e), 'error'); }
        location.reload();
    }, 'Erase App Data');
    document.getElementById('modal-overlay').style.zIndex = '2500';   // must sit above the lock screen (2000)
    document.getElementById('modal-confirm-btn').classList.replace('btn-primary', 'btn-danger');
}
/* --- Web Crypto Helpers --- */
async function hashPin(pin, saltBuf) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(pin), { name: "PBKDF2" }, false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: saltBuf, iterations: 200000, hash: "SHA-256" }, keyMaterial, 256);
    return new Uint8Array(bits);
}
async function verifyPin(pin) {
    if (!lockSettings.salt || !lockSettings.hash) return false;
    const saltBuf = hex2buf(lockSettings.salt);
    const hash = await hashPin(pin, saltBuf);
    return buf2hex(hash) === lockSettings.hash;
}
