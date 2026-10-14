# HistoryOsis — Clinical Intake (v2.2)

An offline-first clinical history and examination form. It runs in a browser from plain files: no build step, no server, no internet needed after the files are on the device.
Patient records stay in the browser on that device.

Created by Ehsan Ellahi · RMU49, founder of HistoryOsis Technologies.

---

## 1. Folder layout

Keep **all** of these in one folder. `index.html` loads everything else by relative name.

```
index.html            page structure (the forms, dialogs, tabs)
styles.css            all styling, light and dark themes
data.js               ALL medical content (the only file you edit to change clinical content)
datacheck.js          checks data.js at start-up and shows a readable error panel
sw.js                 service worker (offline + install; only runs over HTTPS or localhost)
manifest.webmanifest  home-screen name, colours, icons
icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
tests.html            self-tests: open it in a browser, every line must say PASS
HOSTING.md            how to put the app online so it can be installed
README.md             this file

util.js        small pure helpers: escH, csvCell, isPlainObj, parseImportPayload, hex
calc.js        vitals maths: height/weight, BMI, Shock Index, NEWS2, vitals tags
schema.js      record shape: migrateExamFindings, exVal, sanitizeImportedRecord
db.js          IndexedDB: records, version history, migration from the old storage
ui.js          toasts, modal dialogs, pinch-zoom guard
settings.js    Settings dialog, backup reminder, trash (restore / purge)
form.js        the intake form: state, draft autosave, collect / load / save, navigation, credentials
complaints.js  presenting complaints, chips, red flags
sections.js    comorbidities, review of systems, family history, examination, investigations, treatments
pickers.js     search pickers, favourites and recents
templates.js   built-in and user templates
carry.js       carry-forward from an earlier record of the same patient
notes.js       progress notes (SOAP) and vitals change
search.js      record status, tags, search and filters
history.js     version history dialog
caselog.js     case log (CSV)
print.js       printing, sharing, print settings
review.js      peer review comments and sign-off lock
summary.js     summary view, EMR text, copy
records.js     the Records list
backup.js      export, import, clear all
safety.js      vitals assessment, checklist, drug-safety checks
lock.js        PIN lock
appearance.js  theme and text size
pwa.js         install and update
a11y.js        accessibility labels and focus handling
app.js         start-up: runs once the page has loaded
```

### How the files are loaded

They are ordinary `<script src="...">` tags at the end of `index.html`, with **no ES modules and no `fetch`**, so the app works when `index.html` is simply opened from disk.
All the scripts share one global scope, so a function in one file can call a function in another.
The **order of the tags matters** only for code that runs the moment a file loads (for example `rvInit()` at the end of `review.js`, or the `addEventListener` lines); everything else runs later, after the page is ready.
Rule of thumb: if you add a new file, put its tag **after** the files it uses, and before `app.js`.

When you add or rename a file you must also:
1. add it to the `SHELL` list in `sw.js` (otherwise it will not work offline), and
2. change `CACHE_VERSION` in `sw.js` (otherwise phones keep the old cached copy).

---

## 2. Self-tests

Open `tests.html` in a browser (double-click it; it must sit in the same folder).
It checks: height and weight reading, BMI, Shock Index, NEWS2 worked examples, HTML escaping, CSV escaping, import validation, the `data.js` checks (it deliberately breaks copies of the data and confirms each problem is caught), and migration of old records with numeric exam keys.
Every line should say **PASS**. The page does not read or write any patient data.

Run it after every change to `data.js` or the calculation files.

## 3. What happens when `data.js` is wrong

At start-up `datacheck.js` checks `data.js`. If something is wrong the app shows a full-screen panel listing the problems in plain words (and a **Copy details** button) instead of a blank page. Your saved records are never touched.

It checks that:
- no two complaints share a label;
- every complaint's `system` code exists in `systemLabels`;
- every exam field has a `label` (findings are saved under the label), labels are unique within a system, and a `select` has options;
- every investigation category and treatment category in `data.js` exists in the matching dropdown in `index.html`;
- every item named by a template exists in the pools;
- chip groups have a valid `type`, and the lists have the right shape;
- a missing `dataVersion` or a duplicate list entry is shown as a note, not an error.

If a script file (or `styles.css`) is missing, the panel says which one.

## 4. Storage

Records live in **IndexedDB** database `HistoryOsisDB` (version 2):

| Store | Key | Holds |
| --- | --- | --- |
| `records` | `id` | one object per patient record |
| `versions` | `vid` (index on `rid`) | earlier saved copies of a record, newest 10 kept per record |

Small settings live in **localStorage**, all keys start with `historyosis_`:

| Key | Holds |
| --- | --- |
| `historyosis_draft` | the unsaved form, so a closed tab does not lose work |
| `historyosis_settings` | Settings dialog options (backup reminder, print and review options) |
| `historyosis_credentials` | the "signing details" remembered for the next record |
| `historyosis_prefs` | favourites, recently used items and your own templates |
| `historyosis_appearance` | theme and text size |
| `historyosis_lock`, `historyosis_lock_state` | PIN lock settings (hash, not the PIN) and failed-attempt count |
| `historyosis_last_backup` | when the last download happened |
| `historyosis_records` | old v1 storage, read once and moved into IndexedDB |

Records are **per web address**. A file opened from disk and the hosted copy are different places; move records with **Download (.json)** and **Upload (.json)**.

## 5. Record format

One record (what is saved, exported and imported):

```jsonc
{
  "id": "rec-1733400000000",          // unique; letters, numbers, - and _ only
  "savedAt": "2026-10-12T09:30:00.000Z",
  "dataVersion": 1,                    // dataVersion of data.js when the record was saved (0 = unknown)
  "demographics": { "name": "", "mrno": "", "age": "", "ageUnit": "", "sex": "", "bedno": "", "dept": "",
                    "admitVia": "", "occupation": "", "residence": "", "dateAdmission": "", "timeAdmission": "",
                    "informant": "", "custom": "" },
  "history": {
    "pcs": [{ "id": "", "label": "Chest Pain", "hopi": [], "answers": [], "duration": "", "custom": "" }],
    "rosSelected": [], "rosNarrative": "", "rosCustom": "",
    "comorbidItems": [], "comorbidNarrative": "",
    "pmhMedical": "", "pmhSurgical": "", "pmhDrugs": "", "pmhAllergies": "", "pmhImmunisation": "", "pmhCustom": "",
    "fhSelected": [], "fhNarrative": "", "fhCustom": "",
    "repro": { }, "paeds": { }, "sh": { }
  },
  "exam": {
    "vitals": { "bp": "", "pulse": "", "rr": "", "spo2": "", "temp": "", "gcs": "", "height": "", "weight": "", "bmi": "",
                "o2": "", "consciousness": "", "spo2Scale2": "", "news2": "", "news2Band": "", "news2Partial": "" },
    "general": { },
    "systems": [{ "system": "Cardiovascular (CVS)", "findings": { "Pulse character": "Regular" } }],  // keyed by FIELD LABEL
    "custom": ""
  },
  "investigations": { "items": [{ "name": "", "category": "", "result": "" }], "summary": "" },
  "treatment": { "primaryDx": "", "differentials": "", "items": [{ "name": "", "category": "", "detail": "" }],
                 "monitoring": "", "discharge": "", "counselling": "" },
  "credentials": { "role": "", "name": "", "roll": "", "year": "", "ward": "", "designation": "", "department": "", "supervisor": "" },

  // optional
  "carriedForward": { },               // what was carried from an earlier record
  "tags": [], "status": "",
  "progressNotes": [{ "timestamp": "", "type": "SOAP", "payload": { } }],
  "reviews": [{ "id": "", "section": "", "text": "", "by": "", "role": "", "at": "", "resolved": false }],
  "signoff": { "state": "ready|approved|", "approvedBy": "", "approvedAt": "", "log": [] },
  "deletedAt": "2026-10-12T09:30:00.000Z"   // present = in the trash
}
```

Old records may have exam findings keyed by position (`"0"`, `"1"`). They are converted to label keys when opened (`migrateExamFindings`).
A backup file is `{ "records": [ ... ] }`. Imports also accept a bare list or one record, and every record is rebuilt by `sanitizeImportedRecord` because a file is untrusted.

---

## 6. Changing the medical content (`data.js`)

`data.js` defines `medicalDataPools` and `systemLabels`. After any change, **open `tests.html`** (all PASS) and open `index.html` (no error panel). If you changed content in a way that matters, raise `dataVersion` by 1.

### Add a complaint
Add an object to `presentingComplaints`:
```js
{ label: "Hiccups", system: "GI",          // label must be unique; system must be a key of systemLabels
  redFlags: ["Lasting more than 48 hours"],// optional list
  chips: [ { q: "Onset", type: "single", options: ["sudden", "gradual"], fmt: "{v} onset" } ],   // optional
  hopi: ["Duration and pattern?", "Associated vomiting or reflux?"] }
```
Chip `type` is one of `multi`, `single`, `ternary` (all need `options`), `scale` (needs `min` below `max`) or `duration`.
A new body system needs a line in `systemLabels` first, for example `Renal: "Renal"`.

### Add an examination system
Add to `examinations`:
```js
{ system: "Ear, Nose and Throat (ENT)",
  fields: [ { label: "Tympanic membrane", type: "select", options: ["Normal", "Perforated"] },
            { label: "Throat", type: "text" } ] }      // type: text, textarea or select
```
Findings are saved **under the field label**, so labels must be unique within the system, and **renaming a label later orphans the old findings** in saved records.

### Add an investigation (or a treatment)
Add the name to a category list in `investigations` (or `treatments`):
```js
investigations: { "Biochemistry": [ ..., "Serum lactate" ] }
```
To add a **new category**, also add it as an `<option>` in `index.html`: the `invest-category` dropdown for investigations, the `treatment-category-filter` dropdown for treatments. The start-up check tells you if you forget.

### Add a template
Add to `templates`. Every name must already exist in the lists above, spelled the same:
```js
{ name: "Acute asthma", complaints: ["Wheeze"], exam: ["Respiratory"],
  investigations: ["Peak flow"], treatments: ["Salbutamol nebuliser"] }
```
Templates only add items; they never set doses or answers.

### Other tables in `data.js`
`drugClasses`, `classAliases`, `crossReactive`, `conditionAliases` and `cautions` drive the allergy and drug-safety advice. A medicine named in `drugClasses` should also exist as a treatment (the check shows a note if not).

---

## 7. Hosting and updating

See `HOSTING.md`. In short: upload the whole folder to any static host, then **change `CACHE_VERSION` in `sw.js` on every release**.

This tool gives advisory prompts only. It does not replace clinical judgement.
