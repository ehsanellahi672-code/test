# Hosting HistoryOsis so it installs and works offline

A service worker (the part that lets the app open without internet) only runs over **HTTPS** or on **localhost**.
If you open `index.html` straight from your phone's files or your computer, the app still works, but it cannot be installed.
Hosting the files for free takes about five minutes.

## Files to upload (keep them together in one folder)

| File | What it is |
| --- | --- |
| `index.html` | The page. |
| `styles.css` | The styling |
| `data.js`, `datacheck.js` | Medical content, and the start-up check of it |
| `util.js`, `calc.js`, `schema.js`, `db.js`, `ui.js`, `settings.js`, `form.js`, `complaints.js`, `sections.js`, `pickers.js`, `templates.js`, `carry.js`, `notes.js`, `search.js`, `history.js`, `caselog.js`, `print.js`, `review.js`, `summary.js`, `records.js`, `backup.js`, `safety.js`, `lock.js`, `appearance.js`, `pwa.js`, `a11y.js`, `app.js` | The app's code (all must be present, in the same folder) |
| `sw.js` | The service worker |
| `manifest.webmanifest` | Name, colours and icons for the home screen |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | Icons |
| `tests.html`, `README.md` | Optional: self-tests and the developer notes |

Simplest way: upload **the whole folder** exactly as it is. If any file is missing, the app shows a panel naming the missing file.

## Option A: Netlify Drop (easiest, no account needed to start)

1. Put the files above in one folder on your computer.
2. Open https://app.netlify.com/drop in a browser.
3. Drag the folder onto the page. After a few seconds you get a web address ending in `.netlify.app`.
4. Open that address on your phone.

## Option B: GitHub Pages

1. Make a free GitHub account and press **New repository**. Name it `historyosis`, set it to Public, and tick "Add a README".
2. Press **Add file > Upload files**, drag in all the files above, and press **Commit changes**.
3. Go to **Settings > Pages**. Under "Build and deployment" choose **Deploy from a branch**, pick `main` and `/ (root)`, and press **Save**.
4. After a minute your app is at `https://YOUR-NAME.github.io/historyosis/`.

Anyone with the link can open the app, but the link only serves the empty app. **Patient records never leave the phone**; they stay in that phone's browser.

## Install on the phone

- **Android (Chrome):** open the address, wait a few seconds, then use the menu (three dots) > **Install app** or **Add to Home screen**. Settings inside the app also has an "Install app on this device" button when Chrome allows it.
- **iPhone (Safari):** open the address, press Share > **Add to Home Screen**.
- Open the app once while online. After that, turn on airplane mode and open it again to check it works.
  Settings > "Install and offline use" should say "Offline ready".

## Important: records do not move automatically

Records live in the browser **for one web address**. The hosted address is a different "site" from the local file, so it starts empty.
Before you switch:
1. In the old copy press **Download (.json)** on the Records tab.
2. In the hosted copy press **Upload (.json)** and import that file.

## Updating the app later

1. Upload every file that changed (or simply the whole folder again).
2. **Open `sw.js` and change the version text** near the top, for example `const CACHE_VERSION = 'v15-1';` to `'v15-2';`, then upload `sw.js` too.
   If you skip this, phones keep showing the old cached copy.
3. Next time the app is opened online, a bar says "Update available". Press **Reload**. Any unsaved draft is kept.

## Testing on your own computer (optional)

In the folder with the files run `python3 -m http.server 8000`, then open http://localhost:8000/ in Chrome. localhost counts as secure, so install and offline mode work there too.
