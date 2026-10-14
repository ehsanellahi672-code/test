/* ============================================================
   MEDICAL DATA POOLS
   ============================================================ */
const medicalDataPools = {

  // Bump this number whenever the medical content changes in a way that matters. Every saved record stores it.
  dataVersion: 1,

  // Built-in templates for "Start from template". Every string must already exist in the lists below
  // (complaint labels, exam system names, investigation and treatment names); anything that does not match is skipped and logged to the console.
  // Optional fields: complaints[], exam[], investigations[], treatments[]. Templates add items only; they never set doses or answers.
  templates: [
    { name:"Chest pain work-up",
      complaints:["Chest Pain"],
      exam:["Cardiovascular (CVS)", "Respiratory"],
      investigations:["ECG (12-lead)", "Point-of-care troponin", "Troponin I/T (serial)", "Full Blood Count (FBC)", "U&E (urea & electrolytes)", "CXR", "D-Dimer"],
      treatments:["Continuous telemetry", "SpO2 monitoring", "NEWS2 4-hourly"] },
    { name:"Shortness of breath",
      complaints:["Shortness of Breath", "Cough"],
      exam:["Respiratory", "Cardiovascular (CVS)"],
      investigations:["ABG", "CXR", "ECG (12-lead)", "Full Blood Count (FBC)", "U&E (urea & electrolytes)", "CRP", "BNP / NT-proBNP", "D-Dimer", "PEFR"],
      treatments:["SpO2 monitoring", "NEWS2 4-hourly"] },
    { name:"Acute abdomen",
      complaints:["Abdominal Pain", "Nausea / Vomiting"],
      exam:["Abdominal (GI)"],
      investigations:["Full Blood Count (FBC)", "U&E (urea & electrolytes)", "LFTs", "CRP", "Serum amylase / lipase", "Lactate (serum)", "Urinalysis (dipstick)", "Urine pregnancy test", "AXR", "USS Abdomen", "CTAP"],
      treatments:["IV access + fluid resuscitation (0.9% NaCl / Hartmann's)", "Fluid balance chart", "Pain score (NRS 0–10)", "NEWS2 4-hourly", "Urine output hourly"] },
    { name:"Stroke / TIA",
      complaints:["Weakness / Paralysis"],
      exam:["Neurological", "Cardiovascular (CVS)"],
      investigations:["Blood Glucose (CBG)", "ECG (12-lead)", "CT Head ± contrast", "Full Blood Count (FBC)", "U&E (urea & electrolytes)", "Coagulation screen (PT, APTT, INR)", "Fasting lipids", "HbA1c", "Echocardiogram (TTE/TOE)"],
      treatments:["Neurological obs (GCS hourly)", "SpO2 monitoring", "Continuous telemetry", "NEWS2 4-hourly", "Pressure area care", "Physiotherapy referral", "Occupational therapy referral"] },
    { name:"Fever in a child",
      complaints:["Fever in a Child"],
      exam:["ENT Examination", "Respiratory", "Abdominal (GI)"],
      investigations:["Full Blood Count (FBC)", "CRP", "Urinalysis (dipstick)", "Urine MC&S", "Blood cultures (x2 peripherals)", "CXR", "Malaria RDT / thick & thin film"],
      treatments:["Fluid balance chart", "Daily weights", "SpO2 monitoring"] },
    { name:"Post-op day 1",
      exam:["Abdominal (GI)", "Cardiovascular (CVS)", "Respiratory"],
      investigations:["Full Blood Count (FBC)", "U&E (urea & electrolytes)", "CRP"],
      treatments:["NEWS2 4-hourly", "Pain score (NRS 0–10)", "Fluid balance chart", "Urine output hourly", "IV fluid monitoring", "DVT prophylaxis (TED + LMWH)", "Pressure area care", "Physiotherapy referral"] },
    { name:"Diabetic review",
      exam:["Cardiovascular (CVS)", "Ophthalmological"],
      investigations:["HbA1c", "Random blood glucose", "U&E (urea & electrolytes)", "Fasting lipids", "Urine protein:creatinine ratio", "Urinalysis (dipstick)"],
      treatments:["Diabetic education + self-monitoring", "BGL monitoring (pre-meal + bedtime)", "Dietician referral", "Weight management advice", "Ophthalmology"] },
    { name:"Sepsis screen",
      exam:["Cardiovascular (CVS)", "Respiratory", "Abdominal (GI)"],
      investigations:["Lactate (serum)", "Blood cultures (x2 peripherals)", "Full Blood Count (FBC)", "U&E (urea & electrolytes)", "LFTs", "CRP", "Procalcitonin", "Coagulation screen (PT, APTT, INR)", "ABG", "Urinalysis (dipstick)", "MSU MC&S", "CXR"],
      treatments:["IV access + fluid resuscitation (0.9% NaCl / Hartmann's)", "NEWS2 4-hourly", "Fluid balance chart", "Urine output hourly", "SpO2 monitoring"] }
  ],

    // Optional "chips" on a complaint (tap-to-answer HOPI). Each group is { q, type, ... }:
  //   multi    options[]            tick any number          -> fmt applied to the joined list
  //   single   options[]            pick one (tap again to clear)
  //   scale    min, max             one number               -> fmt such as 'severity {v}/10'
  //   duration units[]              number plus a unit       -> fmt such as 'each episode lasts {v}'
  //   ternary  options[]            tap cycles unknown > present > absent; present are listed under "q:", absent as "No ..."
  // fmt is optional and uses {v}. "q" must be unique inside one complaint (answers are stored by q).
  // Complaints without chips keep the three typed HOPI boxes.
  presentingComplaints: [
    // ── CARDIOVASCULAR ──────────────────────────────────────
    { label:"Chest Pain", system:"CVS",
      redFlags:["Pain at rest, or pain that is getting worse or more frequent", "Radiation to the arm or jaw with sweating or nausea", "Tearing pain going through to the back", "Syncope or near-syncope", "Breathlessness or low oxygen saturation", "Low blood pressure or marked tachycardia", "Known ischaemic heart disease or several cardiac risk factors"],
      chips:[
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Character", type:"multi", options:["crushing", "tight / pressure", "sharp", "burning", "tearing", "pleuritic"]},
        {q:"Radiation", type:"multi", options:["left arm", "right arm", "jaw", "neck", "back", "epigastrium"], fmt:"radiating to {v}"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"severity {v}/10"},
        {q:"Each episode lasts", type:"duration", units:["seconds", "minutes", "hours"], fmt:"each episode lasts {v}"},
        {q:"Triggers and relief", type:"multi", options:["worse on exertion", "worse on inspiration", "worse lying flat", "worse after meals", "better with rest", "better with GTN", "better sitting forward"]},
        {q:"Associated", type:"ternary", options:["sweating", "nausea", "vomiting", "breathlessness", "palpitations", "syncope", "cough", "fever"]}
      ],
      hopi:["Site, onset, character (crushing/sharp/burning/tearing), radiation (jaw, left arm, back), severity 1–10?",
            "Exacerbating / relieving factors (exertion, rest, GTN, position, inspiration, meals)?",
            "Associated symptoms: SOB, diaphoresis, palpitations, nausea/vomiting, syncope, cough, fever?"] },
    { label:"Palpitations", system:"CVS",
      chips:[
        {q:"Character", type:"single", options:["regular", "irregular", "skipped beats", "racing"], fmt:"{v}"},
        {q:"Onset and offset", type:"single", options:["sudden onset and offset", "gradual"], fmt:"{v}"},
        {q:"Each episode lasts", type:"duration", units:["seconds", "minutes", "hours", "days"], fmt:"each episode lasts {v}"},
        {q:"Frequency", type:"single", options:["daily", "weekly", "monthly", "rare or first episode"], fmt:"{v}"},
        {q:"Triggers", type:"multi", options:["exertion", "caffeine", "alcohol", "stress or anxiety", "lying down", "at night", "none"], fmt:"triggered by {v}"},
        {q:"Associated", type:"ternary", options:["chest pain", "breathlessness", "dizziness", "syncope", "sweating", "tremor", "weight loss", "heat intolerance"]}
      ],
      hopi:["Onset (sudden vs gradual), duration, frequency of episodes, regularity (regular/irregular)?",
            "Associated chest pain, dyspnoea, dizziness, pre-syncope, diaphoresis, polyuria post-episode?",
            "Triggers (caffeine, exertion, stress, alcohol), known cardiac/thyroid disease, medications?"] },
    { label:"Oedema (Swelling)", system:"CVS",
      chips:[
        {q:"Site", type:"multi", options:["both ankles", "both legs", "one leg", "sacrum", "face / periorbital", "abdomen", "generalised"], fmt:"site: {v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual", "progressive over weeks"], fmt:"{v} onset"},
        {q:"Type", type:"single", options:["pitting", "non-pitting"], fmt:"{v}"},
        {q:"Pattern", type:"multi", options:["worse by evening", "better overnight", "worse in heat", "better with leg elevation"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["breathlessness", "orthopnoea", "PND", "abdominal swelling", "frothy urine", "jaundice", "leg pain or redness", "weight gain"]},
        {q:"Possible causes", type:"ternary", options:["heart failure", "liver disease", "kidney disease", "pregnancy", "immobility or long travel", "recent surgery", "new medicines (CCB, steroid, NSAID)", "known cancer"]}
      ],
      hopi:["Site (bilateral ankles/sacrum/face), onset (gradual/sudden), pitting vs non-pitting, progression over time?",
            "Associated dyspnoea, orthopnoea, PND (cardiac); jaundice, ascites (hepatic); frothy urine (renal)?",
            "Medications (CCBs, steroids, NSAIDs), DVT history, immobility, pregnancy, travel?"] },
    { label:"Syncope / Pre-syncope", system:"CVS",
      redFlags:["Syncope during exertion or while lying down", "Chest pain or palpitations before the event", "Family history of sudden death under 40", "Abnormal ECG or known structural heart disease", "Syncope with no warning (no prodrome)", "Heart failure or an implanted defibrillator", "Signs of bleeding (melaena, abdominal pain, pregnancy)"],
      chips:[
        {q:"Event", type:"single", options:["lost consciousness", "near-faint only"], fmt:"{v}"},
        {q:"Circumstances", type:"multi", options:["on standing", "during exertion", "at rest or lying down", "while sitting", "prolonged standing", "after passing urine or coughing", "in a hot place"], fmt:"occurred {v}"},
        {q:"Warning beforehand", type:"multi", options:["none", "light-headedness", "nausea or sweating", "palpitations", "visual aura"], fmt:"warning: {v}"},
        {q:"Unconscious for", type:"duration", units:["seconds", "minutes"], fmt:"unconscious for {v}"},
        {q:"Recovery", type:"single", options:["rapid and complete", "slow with confusion", "weakness afterwards"], fmt:"recovery {v}"},
        {q:"Witness reports", type:"ternary", options:["jerking movements", "tongue biting", "incontinence", "injury from the fall"]},
        {q:"Associated", type:"ternary", options:["chest pain", "palpitations", "breathlessness", "headache", "focal weakness", "blood loss"]}
      ],
      hopi:["Duration, setting/posture at onset, prodrome (light-headedness, visual graying, nausea, palpitations)?",
            "Witness account: fall, convulsive movements, incontinence, tongue biting, cyanosis, post-ictal state?",
            "Recovery time, previous episodes, cardiac/neurological history, medications (antihypertensives, diuretics)?"] },
    { label:"Claudication / Leg Pain on Walking", system:"CVS",
      chips:[
        {q:"Site", type:"multi", options:["calf", "thigh", "buttock", "foot"], fmt:"site: {v}"},
        {q:"Symptoms present for", type:"duration", units:["weeks", "months", "years"], fmt:"symptoms for {v}"},
        {q:"Walking distance before pain", type:"single", options:["under 50 m", "50 to 200 m", "200 to 500 m", "over 500 m"], fmt:"pain after {v}"},
        {q:"Relief", type:"single", options:["relieved by standing still", "relieved by hanging the leg down", "not relieved by rest"], fmt:"{v}"},
        {q:"Pain also occurs", type:"single", options:["only on walking", "at rest", "at night"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["rest pain", "cold or pale foot", "skin ulcer", "hair loss on the leg", "numbness", "weakness", "back pain"]},
        {q:"Risk factors", type:"ternary", options:["smoking", "diabetes", "hypertension", "high cholesterol", "family history of vascular disease", "previous MI or stroke"]}
      ],
      hopi:["Site (calf/thigh/buttock), onset at fixed distance, relief with rest, walking distance before pain (claudication distance)?",
            "Rest pain (nocturnal, relieved by hanging the foot over the bed), skin changes (ulcers, colour change, hair loss)?",
            "Cardiovascular risk factors: smoking, DM, hypertension, hyperlipidaemia, family history?"] },

    // ── RESPIRATORY ──────────────────────────────────────
    { label:"Shortness of Breath", system:"Resp",
      redFlags:["Unable to speak in full sentences", "Stridor, or swelling of the lips, tongue or throat", "SpO2 below 92% or cyanosis", "Chest pain or haemoptysis", "Unilateral leg swelling, recent surgery or immobility (PE risk)", "Confusion or drowsiness", "Silent chest or exhaustion in an asthmatic"],
      chips:[
        {q:"Onset", type:"single", options:["sudden", "gradual", "progressive over weeks"], fmt:"{v} onset"},
        {q:"Exercise tolerance", type:"single", options:["breathless at rest", "on minimal exertion", "on moderate exertion", "on heavy exertion only"], fmt:"{v}"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"breathlessness {v}/10"},
        {q:"Pattern", type:"multi", options:["orthopnoea", "PND", "positional", "episodic", "constant", "wheeze"], fmt:"{v}"},
        {q:"Triggers", type:"multi", options:["exertion", "cold air", "allergen exposure", "lying flat", "recent infection"], fmt:"triggered by {v}"},
        {q:"Associated", type:"ternary", options:["cough", "sputum", "wheeze", "chest pain", "leg swelling", "fever", "haemoptysis", "palpitations"]},
        {q:"Risk factors", type:"ternary", options:["smoking", "asthma", "COPD", "heart failure", "recent surgery or immobility", "known cancer"]}
      ],
      hopi:["Onset (sudden vs gradual), duration, current MRC dyspnoea grade / NYHA class?",
            "Orthopnoea (number of pillows), PND, wheeze, haemoptysis, pleuritic chest pain, stridor?",
            "Triggers (exertion, allergens, cold air), prior attacks/hospitalisations, occupational exposure?"] },
    { label:"Cough", system:"Resp",
      chips:[
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Type", type:"single", options:["dry", "productive"], fmt:"{v} cough"},
        {q:"Sputum", type:"multi", options:["clear", "white", "yellow or green", "blood-stained", "foul-smelling"], fmt:"sputum: {v}"},
        {q:"Pattern", type:"multi", options:["worse at night", "worse on waking", "after exertion", "after meals", "with cold air", "paroxysmal"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["fever", "breathlessness", "wheeze", "chest pain", "haemoptysis", "weight loss", "night sweats", "coryza", "heartburn"]},
        {q:"Risk factors", type:"ternary", options:["smoker", "TB contact", "recent travel", "takes an ACE inhibitor", "dust exposure at work", "asthma or atopy"]}
      ],
      hopi:["Duration, character (dry/productive), sputum: quantity, colour (clear/yellow/green/rust/blood-stained)?",
            "Time pattern (nocturnal, morning, post-meals/postural), wheeze, stridor, dysphagia, voice change?",
            "Fever, weight loss, night sweats, TB contacts, smoking history, ACE inhibitor use, occupational dust?"] },
    { label:"Haemoptysis", system:"Resp",
      chips:[
        {q:"Amount", type:"single", options:["streaks", "teaspoonfuls", "cupfuls", "massive"], fmt:"amount: {v}"},
        {q:"Colour", type:"single", options:["bright red", "dark", "rusty", "pink and frothy"], fmt:"{v} blood"},
        {q:"Haemoptysis for", type:"duration", units:["days", "weeks", "months"], fmt:"for {v}"},
        {q:"Frequency", type:"single", options:["single episode", "recurrent", "daily"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["cough", "breathlessness", "pleuritic chest pain", "fever", "night sweats", "weight loss", "leg swelling or pain", "hoarseness"]},
        {q:"Risk factors", type:"ternary", options:["smoking", "previous TB", "TB contact", "bronchiectasis", "known cancer", "anticoagulants", "recent surgery or travel", "asbestos exposure"]}
      ],
      hopi:["Volume (streaks/teaspoons/cupfuls), frequency, colour (bright red / dark / rusty), relation to cough?",
            "Associated dyspnoea, pleuritic chest pain, fever, night sweats, weight loss?",
            "Smoking history (pack-years), prior TB/bronchiectasis, anticoagulants, travel, PE risk factors?"] },
    { label:"Wheeze", system:"Resp",
      chips:[
        {q:"Onset", type:"single", options:["sudden", "gradual", "recurrent episodes"], fmt:"{v} onset"},
        {q:"Wheeze present for", type:"duration", units:["days", "weeks", "months", "years"], fmt:"for {v}"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"breathlessness {v}/10"},
        {q:"Pattern", type:"multi", options:["worse at night", "worse in the morning", "seasonal", "episodic", "constant"], fmt:"{v}"},
        {q:"Triggers", type:"multi", options:["exertion", "cold air", "allergens", "smoke", "recent infection", "aspirin or NSAIDs", "emotion"], fmt:"triggered by {v}"},
        {q:"Associated", type:"ternary", options:["cough", "sputum", "chest tightness", "breathlessness", "fever", "itchy eyes or runny nose", "reflux"]},
        {q:"Risk factors", type:"ternary", options:["asthma", "atopy or eczema", "smoking", "COPD", "family history of asthma", "occupational exposure"]}
      ],
      hopi:["Onset (episodic vs persistent), triggers (allergens, cold air, exercise, smoke, ASA/NSAIDs, beta-blockers)?",
            "Associated cough, dyspnoea, chest tightness, nocturnal symptoms, response to bronchodilators?",
            "Known asthma/COPD diagnosis, atopy history (eczema, rhinitis), occupational exposures, smoking?"] },
    { label:"Pleuritic Chest Pain", system:"Resp",
      chips:[
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Site", type:"multi", options:["left", "right", "central", "base of chest"], fmt:"site: {v}"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"severity {v}/10"},
        {q:"Pain present for", type:"duration", units:["hours", "days", "weeks"], fmt:"for {v}"},
        {q:"Triggers and relief", type:"multi", options:["worse on deep inspiration", "worse on coughing", "worse on movement", "better with shallow breathing", "better lying on the affected side"]},
        {q:"Associated", type:"ternary", options:["cough", "sputum", "fever", "breathlessness", "haemoptysis", "leg swelling or pain", "recent viral illness", "chest wall injury"]},
        {q:"Risk factors", type:"ternary", options:["recent surgery or immobility", "long-haul travel", "previous DVT or PE", "known cancer", "smoking", "oral contraceptive or HRT", "pregnancy", "TB contact"]}
      ],
      hopi:["Site, onset, sharp/stabbing character, worsened by inspiration/coughing/movement, relieved by breath-holding?",
            "Associated dyspnoea, haemoptysis, cough, fever (pneumonia/pleurisy), leg swelling/calf pain (PE/DVT)?",
            "Recent travel/immobility/surgery, pregnancy, oral contraceptive use, malignancy history?"] },

    // ── GASTROINTESTINAL ─────────────────────────────────
    { label:"Abdominal Pain", system:"GI",
      redFlags:["Rigid abdomen, guarding or rebound tenderness", "Haematemesis, melaena or fresh rectal bleeding", "Pulsatile mass or pain radiating to the back (aneurysm)", "Persistent vomiting or absolute constipation with distension", "Jaundice with fever and rigors", "Hypotension or marked tachycardia", "Pregnant or possibly pregnant (ectopic risk)", "Age over 50 with new symptoms and weight loss"],
      chips:[
        {q:"Site", type:"multi", options:["epigastric", "right upper quadrant", "left upper quadrant", "periumbilical", "right iliac fossa", "left iliac fossa", "suprapubic", "loin", "generalised"], fmt:"site: {v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Character", type:"multi", options:["colicky", "constant", "sharp", "burning", "dull ache", "cramping"]},
        {q:"Radiation", type:"multi", options:["back", "shoulder tip", "groin", "loin to groin"], fmt:"radiating to {v}"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"severity {v}/10"},
        {q:"Triggers and relief", type:"multi", options:["worse after meals", "worse on movement", "worse on coughing", "better leaning forward", "better after vomiting", "better after opening bowels"]},
        {q:"Associated", type:"ternary", options:["nausea", "vomiting", "diarrhoea", "constipation", "fever", "jaundice", "haematemesis", "melaena", "weight loss", "urinary symptoms"]}
      ],
      hopi:["Site (quadrant), onset (sudden/colicky/gradual), character (colicky/constant/burning), radiation, severity 1–10?",
            "Relation to meals (before/after, fat-rich), bowel habit, nausea/vomiting, PR bleeding, urinary symptoms?",
            "Last bowel motion, LMP (female), jaundice, weight loss, previous abdominal surgeries or similar episodes?"] },
    { label:"Nausea / Vomiting", system:"GI",
      chips:[
        {q:"Vomiting for", type:"duration", units:["hours", "days", "weeks"], fmt:"for {v}"},
        {q:"Frequency", type:"single", options:["once or twice", "several times a day", "constant retching"], fmt:"{v}"},
        {q:"Vomit contains", type:"single", options:["food", "bile (green)", "blood", "faeculent material", "clear fluid"], fmt:"vomit: {v}"},
        {q:"Timing", type:"multi", options:["after meals", "early morning", "projectile", "persistent"], fmt:"{v}"},
        {q:"Relief", type:"single", options:["relieved by vomiting", "not relieved by vomiting"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["abdominal pain", "diarrhoea", "constipation", "fever", "headache", "vertigo", "weight loss", "unable to keep fluids down"]},
        {q:"Possible causes", type:"ternary", options:["sick contacts", "new medicines", "alcohol", "pregnancy possible", "diabetes", "suspect food", "head injury", "previous abdominal surgery"]}
      ],
      hopi:["Onset, frequency, volume, character (bilious, blood-stained 'coffee-ground', projectile, undigested food)?",
            "Associated abdominal pain, diarrhoea, constipation, fever, headache, vertigo, tinnitus?",
            "Preceding meals, medications, pregnancy test (female), relief with vomiting, hydration/fluid intake?"] },
    { label:"Diarrhoea", system:"GI",
      chips:[
        {q:"Diarrhoea for", type:"duration", units:["days", "weeks", "months"], fmt:"for {v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Frequency", type:"single", options:["2 to 3 per day", "4 to 6 per day", "more than 6 per day"], fmt:"{v}"},
        {q:"Stool", type:"multi", options:["watery", "loose", "bloody", "mucus", "greasy and floating", "black", "pale"], fmt:"stool: {v}"},
        {q:"Timing", type:"single", options:["nocturnal", "daytime only", "after meals", "alternating with constipation"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["abdominal pain", "fever", "vomiting", "tenesmus", "weight loss", "urgency", "incontinence", "dehydration symptoms"]},
        {q:"Risk factors", type:"ternary", options:["sick contacts", "recent travel", "recent antibiotics", "new medicines", "undercooked food", "HIV or immunosuppression", "family history of bowel disease", "recent hospital stay"]}
      ],
      hopi:["Duration, frequency (stools/day), Bristol Stool Chart type, blood/mucus, nocturnal episodes?",
            "Associated abdominal cramps, tenesmus, fever, vomiting, weight loss, oral ulcers, eye/skin/joint involvement?",
            "Dietary history, recent travel, contacts with illness, antibiotics, immunosuppression, prior IBD/coeliac?"] },
    { label:"Constipation", system:"GI",
      chips:[
        {q:"Constipation for", type:"duration", units:["days", "weeks", "months", "years"], fmt:"for {v}"},
        {q:"Frequency", type:"single", options:["every 2 to 3 days", "less than once a week", "no motion for over a week"], fmt:"opening bowels {v}"},
        {q:"Stool", type:"multi", options:["hard", "pellets", "large", "narrow (pencil-thin)", "blood on the paper", "blood mixed in"], fmt:"stool: {v}"},
        {q:"Features", type:"multi", options:["straining", "incomplete emptying", "needing to digitate", "passing flatus", "no flatus"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["abdominal pain", "bloating", "vomiting", "overflow diarrhoea", "weight loss", "blood in stool", "change in bowel habit"]},
        {q:"Possible causes", type:"ternary", options:["low fibre or fluids", "opioid use", "iron tablets", "hypothyroidism", "immobility", "previous bowel surgery", "pregnancy", "depression"]}
      ],
      hopi:["Duration, usual bowel habit vs current (frequency, consistency), straining, incomplete evacuation, PR bleeding?",
            "Associated abdominal distension, nausea, weight loss, rectal pain, anal fissure symptoms?",
            "Medications (opiates, iron, anticholinergics), fluid/fibre intake, mobility, hypothyroidism, DM?"] },
    { label:"PR Bleeding / Rectal Bleeding", system:"GI",
      redFlags:["Large volume bleeding with dizziness or collapse", "Hypotension or tachycardia", "Change in bowel habit for more than 6 weeks", "Unintentional weight loss", "Iron-deficiency anaemia", "Anticoagulant use", "Age over 50 with new rectal bleeding"],
      chips:[
        {q:"Bleeding for", type:"duration", units:["days", "weeks", "months"], fmt:"for {v}"},
        {q:"Colour", type:"single", options:["bright red", "dark red", "maroon", "black and tarry (melaena)"], fmt:"{v} blood"},
        {q:"Blood is", type:"single", options:["on the paper only", "dripping into the pan", "coating the stool", "mixed with stool"], fmt:"{v}"},
        {q:"Amount", type:"single", options:["streaks", "small amount", "large amount"], fmt:"{v}"},
        {q:"Pain", type:"multi", options:["painless", "pain on passing stool", "abdominal cramps"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["change in bowel habit", "weight loss", "tenesmus", "mucus", "dizziness or syncope", "anal lump", "fever", "loss of appetite"]},
        {q:"Risk factors", type:"ternary", options:["constipation or straining", "haemorrhoids", "anticoagulants or aspirin", "previous polyps", "family history of bowel cancer", "inflammatory bowel disease", "age over 50", "previous pelvic radiotherapy"]}
      ],
      hopi:["Amount (streaks on paper / mixed in stool / clots / toilet bowl red), colour (bright red vs dark vs melaena)?",
            "Associated abdominal pain, change in bowel habit, weight loss, mucus, tenesmus, anal pain?",
            "Age >40 (red flag), family history of colorectal cancer/polyps, IBD, haemorrhoids, diverticular disease?"] },
    { label:"Dysphagia", system:"GI",
      chips:[
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Dysphagia for", type:"duration", units:["days", "weeks", "months", "years"], fmt:"for {v}"},
        {q:"Difficulty with", type:"single", options:["solids only", "solids then liquids", "liquids and solids", "liquids more than solids"], fmt:"{v}"},
        {q:"Felt at", type:"single", options:["throat", "behind the sternum", "lower chest"], fmt:"felt at {v}"},
        {q:"Pattern", type:"multi", options:["intermittent", "progressive", "food sticking", "regurgitation", "coughing on swallowing"]},
        {q:"Associated", type:"ternary", options:["weight loss", "odynophagia", "heartburn", "hoarseness", "vomiting", "chest pain", "chest infections", "neck lump"]},
        {q:"Risk factors", type:"ternary", options:["smoking", "alcohol", "long-standing reflux", "previous stroke", "neurological disease", "previous oesophageal surgery", "hot or caustic ingestion", "HIV or immunosuppression"]}
      ],
      hopi:["Onset, progression, solids only vs solids then liquids vs liquids too, site of hold-up (throat/chest)?",
            "Odynophagia, regurgitation, hoarseness, weight loss, heartburn, coughing/choking on swallowing?",
            "Neurological symptoms (stroke, Parkinson's, MND), neck mass, previous endoscopy/barium swallow results?"] },
    { label:"Heartburn / GORD", system:"GI",
      chips:[
        {q:"Heartburn for", type:"duration", units:["days", "weeks", "months", "years"], fmt:"for {v}"},
        {q:"Frequency", type:"single", options:["occasional", "weekly", "most days", "daily"], fmt:"{v}"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"severity {v}/10"},
        {q:"Triggers", type:"multi", options:["large meals", "spicy food", "alcohol", "coffee", "lying flat", "bending", "night time"], fmt:"worse with {v}"},
        {q:"Relief", type:"multi", options:["antacids", "PPI", "sitting up", "milk"], fmt:"better with {v}"},
        {q:"Associated", type:"ternary", options:["regurgitation", "sour taste", "dysphagia", "night cough", "hoarse voice", "nausea", "chest pain", "epigastric pain"]},
        {q:"Alarm features", type:"ternary", options:["weight loss", "dysphagia", "persistent vomiting", "black stools", "anaemia", "new symptoms over age 55", "family history of upper GI cancer", "early satiety"]}
      ],
      hopi:["Duration, frequency, character (burning, regurgitation of acid/food), worsened by lying down, fatty meals?",
            "Associated dysphagia (alarm feature), odynophagia, hoarseness, chronic cough, weight loss, anaemia?",
            "Medications (NSAIDs, nitrates, CCBs, bisphosphonates), obesity, pregnancy, smoking, alcohol?"] },
    { label:"Jaundice", system:"GI",
      chips:[
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Jaundice present for", type:"duration", units:["days", "weeks", "months"], fmt:"jaundice for {v}"},
        {q:"Pain", type:"single", options:["painless", "painful", "colicky"], fmt:"{v}"},
        {q:"Urine and stool", type:"multi", options:["dark urine", "pale stools"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["itching", "abdominal pain", "fever or rigors", "nausea or vomiting", "weight loss", "loss of appetite", "fatigue", "confusion"]},
        {q:"Risk factors", type:"ternary", options:["alcohol", "blood transfusion", "intravenous drug use", "hepatitis contact", "recent travel", "new medicines or herbal remedies", "gallstones", "family history of liver disease"]}
      ],
      hopi:["Onset (sudden/gradual), duration, colour of urine (dark/cola), stools (pale/clay), pruritus?",
            "Abdominal pain (RUQ, colicky vs dull constant), fever, rigors (Charcot's triad), nausea, weight loss?",
            "Alcohol use (units/week, duration), medications/herbals, blood transfusions, travel, contacts with hepatitis?"] },

    // ── NEUROLOGICAL ─────────────────────────────────────
    { label:"Headache", system:"Neuro",
      redFlags:["Sudden severe (thunderclap) headache", "Fever with neck stiffness or non-blanching rash", "New neurological deficit, confusion or reduced consciousness", "Seizure", "Age over 50 with new headache, scalp tenderness or jaw claudication", "Headache after head injury", "Worse lying down or on waking, with vomiting", "Known cancer, HIV or on anticoagulants"],
      chips:[
        {q:"Onset", type:"single", options:["thunderclap (peak within seconds)", "gradual", "on waking"], fmt:"{v} onset"},
        {q:"Site", type:"multi", options:["frontal", "temporal", "occipital", "one-sided", "global", "behind the eyes"], fmt:"site: {v}"},
        {q:"Character", type:"multi", options:["throbbing", "pressure / band-like", "stabbing", "burning"]},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"severity {v}/10"},
        {q:"Each headache lasts", type:"duration", units:["minutes", "hours", "days"], fmt:"each headache lasts {v}"},
        {q:"Triggers and relief", type:"multi", options:["worse on bending", "worse on coughing or straining", "worse lying down", "better with rest in a dark room", "better with analgesia"]},
        {q:"Associated", type:"ternary", options:["nausea", "vomiting", "photophobia", "aura", "neck stiffness", "fever", "visual disturbance", "focal weakness", "recent head injury"]}
      ],
      hopi:["Site (frontal/temporal/occipital/hemicranial/global), onset (thunderclap vs gradual), character (throbbing/pressure/stabbing)?",
            "Severity 1–10, duration, frequency, aura (visual/sensory/motor), photophobia, phonophobia, nausea/vomiting?",
            "Exacerbating factors (posture, Valsalva, exertion), neck stiffness, fever, visual changes, medication overuse?"] },
    { label:"Dizziness / Vertigo", system:"Neuro",
      chips:[
        {q:"Type", type:"single", options:["spinning (vertigo)", "light-headed", "unsteady", "near-faint"], fmt:"{v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Each episode lasts", type:"duration", units:["seconds", "minutes", "hours", "days"], fmt:"each episode lasts {v}"},
        {q:"Pattern", type:"single", options:["constant", "episodic", "single episode"], fmt:"{v}"},
        {q:"Triggers", type:"multi", options:["head movement", "turning in bed", "standing up", "exertion", "loud noise", "no clear trigger"], fmt:"triggered by {v}"},
        {q:"Associated", type:"ternary", options:["nausea or vomiting", "tinnitus", "hearing loss", "headache", "double vision", "slurred speech", "limb weakness", "ear pain or discharge"]},
        {q:"Risk factors", type:"ternary", options:["hypertension", "diabetes", "atrial fibrillation", "recent head injury", "recent viral illness", "new medicines", "migraine", "previous stroke"]}
      ],
      hopi:["True vertigo (room spinning) vs pre-syncope vs disequilibrium vs light-headedness? Duration?",
            "Triggers (head movement, positional, standing), associated hearing loss, tinnitus, ear fullness, vomiting?",
            "Diplopia, dysarthria, ataxia, dysphagia, facial numbness (brainstem signs), cardiovascular risk factors?"] },
    { label:"Seizure / Fit", system:"Neuro",
      redFlags:["Seizure lasting more than 5 minutes or repeated seizures without recovery", "First seizure", "Fever with neck stiffness", "Head injury", "Persistent confusion or new focal deficit afterwards", "Pregnancy (eclampsia risk)", "Alcohol withdrawal or low blood glucose"],
      chips:[
        {q:"Warning", type:"single", options:["aura", "no warning"], fmt:"{v}"},
        {q:"Seizure lasted", type:"duration", units:["seconds", "minutes"], fmt:"lasted {v}"},
        {q:"During the event", type:"multi", options:["loss of consciousness", "generalised jerking", "one-sided jerking", "stiffening", "staring", "tongue biting", "incontinence"], fmt:"during the event: {v}"},
        {q:"Recovery", type:"single", options:["rapid recovery", "confused for minutes", "confused for hours", "drowsy afterwards"], fmt:"{v}"},
        {q:"Frequency", type:"single", options:["first ever", "occasional", "weekly", "daily"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["headache", "weakness afterwards", "fever", "recent head injury", "missed anti-epileptic doses", "sleep deprivation", "alcohol or drug use", "tongue laceration"]},
        {q:"Risk factors", type:"ternary", options:["epilepsy", "previous stroke", "brain tumour", "head injury", "alcohol withdrawal", "family history of epilepsy", "febrile seizures in childhood", "CNS infection"]}
      ],
      hopi:["Prodrome/aura, onset, duration, type (tonic-clonic/absence/focal/myoclonic/atonic)?",
            "Witnessed account: LOC, convulsive movements, eye deviation, incontinence, tongue biting, cyanosis?",
            "Post-ictal state, recovery time, first-ever seizure, known epilepsy, medications, head trauma, infection, metabolic trigger?"] },
    { label:"Weakness / Paralysis", system:"Neuro",
      redFlags:["Sudden onset (possible stroke)", "Facial droop, speech or visual disturbance", "Back pain with bladder or bowel dysfunction or saddle numbness", "Rapidly ascending weakness (consider Guillain-Barre)", "Breathing difficulty or difficulty swallowing", "Reduced consciousness"],
      chips:[
        {q:"Onset", type:"single", options:["sudden (minutes)", "over hours", "over days", "over weeks or months"], fmt:"{v}"},
        {q:"Distribution", type:"multi", options:["right arm", "left arm", "right leg", "left leg", "face", "both legs", "all four limbs"], fmt:"weakness of {v}"},
        {q:"Course", type:"single", options:["constant", "progressive", "fluctuating", "episodic"], fmt:"{v}"},
        {q:"Daily pattern", type:"single", options:["fatigable, worse later in the day", "worse in the morning", "no pattern"], fmt:"{v}"},
        {q:"Weakness for", type:"duration", units:["hours", "days", "weeks", "months"], fmt:"for {v}"},
        {q:"Associated", type:"ternary", options:["facial droop", "slurred speech", "sensory loss", "visual loss", "headache", "back pain", "bladder or bowel dysfunction", "recent infection"]},
        {q:"Risk factors", type:"ternary", options:["hypertension", "atrial fibrillation", "diabetes", "smoking", "previous stroke or TIA", "recent trauma", "recent viral illness or vaccination", "family neuromuscular disease"]}
      ],
      hopi:["Distribution (UL/LL/one limb/hemiplegia/paraplegia/tetraplegia), onset (sudden vs progressive), duration?",
            "Associated sensory loss, sphincter disturbance (bladder/bowel), cranial nerve involvement, speech, swallowing?",
            "Vascular risk factors (stroke), trauma, infection, recent viral illness (GBS), medication history, preceding neck pain?"] },
    { label:"Altered Mental Status / Confusion", system:"Neuro",
      redFlags:["Reduced Glasgow Coma Scale or rapidly falling consciousness", "Fever with neck stiffness or rash", "Head injury", "Focal neurological deficit", "Low blood glucose", "Hypoxia or hypotension", "Possible overdose or toxin", "Seizure"],
      chips:[
        {q:"Onset", type:"single", options:["sudden", "over hours", "over days", "gradual over months"], fmt:"{v} onset"},
        {q:"Course", type:"single", options:["constant", "fluctuating", "worse at night", "progressively worse"], fmt:"{v}"},
        {q:"Features", type:"multi", options:["disoriented", "drowsy", "agitated", "hallucinating", "poor attention", "memory loss", "speech disturbance"], fmt:"{v}"},
        {q:"Confusion for", type:"duration", units:["hours", "days", "weeks"], fmt:"for {v}"},
        {q:"Associated", type:"ternary", options:["fever", "headache", "neck stiffness", "head injury", "seizure", "new medicines", "alcohol or drug use", "urinary symptoms"]},
        {q:"Risk factors", type:"ternary", options:["dementia", "diabetes", "liver disease", "kidney disease", "recent surgery", "infection", "dehydration", "alcohol dependence"]}
      ],
      hopi:["Onset (acute/subacute/chronic), baseline cognitive function, fluctuating consciousness?",
            "Fever, head trauma, seizures, focal neurology, medication changes (opiates, benzodiazepines, antipsychotics)?",
            "Metabolic screen: glucose, electrolytes, renal/liver function; alcohol/substance use; urinary/respiratory infection?"] },
    { label:"Tremor", system:"Neuro",
      chips:[
        {q:"Tremor for", type:"duration", units:["weeks", "months", "years"], fmt:"for {v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Occurs", type:"single", options:["at rest", "on holding a posture", "on movement", "on aiming (intention)"], fmt:"{v}"},
        {q:"Site", type:"multi", options:["right hand", "left hand", "both hands", "head", "voice", "legs"], fmt:"site: {v}"},
        {q:"Triggers and relief", type:"multi", options:["worse with stress", "worse with caffeine", "worse when tired", "better with alcohol", "better at rest"]},
        {q:"Associated", type:"ternary", options:["slowness", "stiffness", "shuffling gait", "handwriting change", "weight loss", "sweating", "palpitations", "anxiety"]},
        {q:"Risk factors", type:"ternary", options:["family history of tremor", "lithium, valproate or salbutamol", "hyperthyroidism", "alcohol excess", "family history of Parkinson disease", "head injury", "high caffeine intake", "liver disease"]}
      ],
      hopi:["Onset, rest vs action vs intention tremor, distribution (hands/head/voice/legs), unilateral vs bilateral?",
            "Effect on activities of daily living (writing, holding cup, eating), improvement with alcohol?",
            "Family history of tremor, medications (lithium, valproate, beta-agonists, amiodarone), thyroid symptoms, Parkinson's features?"] },
    { label:"Memory Loss / Cognitive Decline", system:"Neuro",
      chips:[
        {q:"Memory problems for", type:"duration", units:["weeks", "months", "years"], fmt:"for {v}"},
        {q:"Onset", type:"single", options:["gradual", "stepwise", "sudden"], fmt:"{v} onset"},
        {q:"Problems", type:"multi", options:["recent memories", "names", "repeating questions", "getting lost", "misplacing items", "difficulty with tasks", "word-finding difficulty"], fmt:"{v}"},
        {q:"Everyday function", type:"single", options:["independent", "needs help with some tasks", "needs help with most tasks"], fmt:"{v}"},
        {q:"Course", type:"single", options:["slowly progressive", "fluctuating", "stepwise", "static"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["mood change", "hallucinations", "personality change", "falls", "incontinence", "gait disturbance", "sleep disturbance", "agitation"]},
        {q:"Risk factors", type:"ternary", options:["hypertension", "stroke", "diabetes", "depression", "head injury", "alcohol excess", "family history of dementia", "hearing or vision loss"]}
      ],
      hopi:["Onset (acute/insidious), duration, domains affected (memory/language/visuospatial/executive function/behaviour)?",
            "Fluctuating cognition (DLB), stepwise progression (vascular), personality change, Parkinsonian features?",
            "Medications (anticholinergics, benzodiazepines), depression, hypothyroidism, B12/folate deficiency, alcohol, head injury?"] },

    // ── GENITOURINARY ────────────────────────────────────
    { label:"Haematuria", system:"GU",
      chips:[
        {q:"Colour", type:"single", options:["pink", "red", "tea or cola coloured", "with clots"], fmt:"{v}"},
        {q:"Blood appears", type:"single", options:["at the start of urination", "throughout urination", "at the end of urination"], fmt:"blood {v}"},
        {q:"Pain", type:"single", options:["painless", "painful"], fmt:"{v}"},
        {q:"Haematuria for", type:"duration", units:["days", "weeks", "months"], fmt:"for {v}"},
        {q:"Episodes", type:"single", options:["first episode", "recurrent"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["dysuria", "frequency", "loin pain", "fever", "weight loss", "urinary retention", "passing stones", "recent sore throat or skin infection"]},
        {q:"Risk factors", type:"ternary", options:["smoking", "kidney stones", "anticoagulants", "recent catheterisation", "recent heavy exercise", "prostate disease", "chemical or dye exposure", "travel to a schistosomiasis area"]}
      ],
      hopi:["Onset, colour (pink/red/cola), relation to stream (initial/terminal/total), clots, painless vs painful?",
            "Associated dysuria, frequency, urgency, flank pain (colicky = stone), fever/rigors (UTI/pyelonephritis)?",
            "Weight loss, smoking history (TCC risk), occupational chemicals (aniline dyes), family history of renal disease?"] },
    { label:"Dysuria / Urinary Symptoms", system:"GU",
      chips:[
        {q:"Symptoms for", type:"duration", units:["hours", "days", "weeks"], fmt:"for {v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Symptoms", type:"multi", options:["burning on passing urine", "frequency", "urgency", "nocturia", "hesitancy", "poor stream", "terminal dribbling", "incomplete emptying"]},
        {q:"Urine", type:"multi", options:["cloudy", "offensive smelling", "blood-stained", "dark"], fmt:"urine: {v}"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"burning {v}/10"},
        {q:"Associated", type:"ternary", options:["fever", "loin pain", "suprapubic pain", "vaginal or urethral discharge", "vomiting", "haematuria", "new sexual partner", "genital sores"]},
        {q:"Risk factors", type:"ternary", options:["previous UTI", "diabetes", "pregnancy", "urinary catheter", "kidney stones", "enlarged prostate", "recent instrumentation", "recent sexual activity"]}
      ],
      hopi:["Dysuria (burning on voiding), frequency, urgency, nocturia, incomplete emptying, hesitancy, poor stream, post-micturition dribble?",
            "Haematuria, vaginal/urethral discharge, fever, loin pain, suprapubic pain/tenderness?",
            "Sexual history, recurrent UTIs, prostate symptoms (male), catheter use, immunosuppression, STI risk?"] },
    { label:"Loin / Flank Pain", system:"GU",
      chips:[
        {q:"Side", type:"single", options:["right", "left", "both"], fmt:"{v} side"},
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Character", type:"multi", options:["colicky", "constant", "dull ache", "sharp"]},
        {q:"Radiation", type:"multi", options:["to the groin", "to the testis or labia", "to the back", "to the abdomen"], fmt:"radiating {v}"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"severity {v}/10"},
        {q:"Associated", type:"ternary", options:["haematuria", "dysuria", "fever or rigors", "nausea or vomiting", "frequency", "reduced urine output", "passing stones", "scrotal pain"]},
        {q:"Risk factors", type:"ternary", options:["previous kidney stones", "family history of stones", "dehydration", "gout", "urinary tract infection", "single kidney", "hypercalcaemia", "recurrent UTIs"]}
      ],
      hopi:["Site (unilateral/bilateral), onset (colicky/constant), radiation (to groin/scrotum/labia = renal colic)?",
            "Haematuria, nausea/vomiting, fever/rigors (infected stone/pyelonephritis), previous stones?",
            "Fluid intake, dietary calcium/oxalate, family history of stones, medications (topiramate, indinavir)?"] },
    { label:"Urinary Incontinence", system:"GU",
      chips:[
        {q:"Incontinence for", type:"duration", units:["weeks", "months", "years"], fmt:"for {v}"},
        {q:"Type", type:"single", options:["leaks on coughing or sneezing", "sudden urge then leak", "constant dribbling", "leaks without awareness", "mixed"], fmt:"{v}"},
        {q:"Frequency", type:"single", options:["occasional", "daily", "several times a day"], fmt:"{v}"},
        {q:"Amount", type:"single", options:["few drops", "moderate leaks", "soaks clothing"], fmt:"{v}"},
        {q:"Other urinary symptoms", type:"multi", options:["frequency", "urgency", "nocturia", "hesitancy", "weak stream", "incomplete emptying"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["dysuria", "haematuria", "back pain", "leg weakness", "bowel incontinence", "constipation", "confusion", "prolapse symptoms"]},
        {q:"Risk factors", type:"ternary", options:["childbirth", "menopause", "obesity", "pelvic surgery", "prostate surgery", "diabetes", "neurological disease", "chronic cough"]}
      ],
      hopi:["Type: stress (cough/sneeze/exertion), urge (sudden strong desire), overflow (incomplete emptying)?",
            "Frequency, nocturia, post-micturition dribble, haematuria, pelvic prolapse symptoms (female)?",
            "Obstetric history (parity), BMI, medications (diuretics, alpha-blockers), neurological symptoms, constipation?"] },

    // ── MUSCULOSKELETAL ──────────────────────────────────
    { label:"Joint Pain (Arthralgia/Arthritis)", system:"MSK",
      chips:[
        {q:"Joints", type:"multi", options:["knees", "hips", "hands", "wrists", "shoulders", "feet or ankles", "spine", "one joint only"], fmt:"joints: {v}"},
        {q:"Pattern", type:"single", options:["symmetrical", "asymmetrical", "migratory"], fmt:"{v}"},
        {q:"Stiffness", type:"multi", options:["morning stiffness under 30 minutes", "morning stiffness over 1 hour", "worse after rest", "worse with use", "better with movement"], fmt:"{v}"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"severity {v}/10"},
        {q:"Symptoms for", type:"duration", units:["days", "weeks", "months", "years"], fmt:"for {v}"},
        {q:"Associated", type:"ternary", options:["joint swelling", "redness or warmth", "fever", "rash", "dry eyes or mouth", "back pain", "weight loss", "mouth ulcers"]},
        {q:"Risk factors", type:"ternary", options:["family history of arthritis", "psoriasis", "recent infection", "gout", "previous joint injury", "inflammatory bowel disease", "tick bite", "recent diarrhoea or urethritis"]}
      ],
      hopi:["Which joints, mono/oligo/polyarticular, symmetric/asymmetric, migratory vs fixed, acute vs chronic?",
            "Swelling, redness, warmth, morning stiffness (duration ≥60 min = inflammatory), functional limitation?",
            "Recent infection (reactive arthritis), skin rashes (psoriasis/SLE), GI symptoms, eye symptoms, family history?"] },
    { label:"Back Pain", system:"MSK",
      redFlags:["Bladder or bowel dysfunction, or saddle numbness (cauda equina)", "Bilateral or progressive leg weakness", "Fever, intravenous drug use or recent infection", "Known cancer or unexplained weight loss", "Age under 20 or over 55 with new pain", "Night pain or pain at rest", "Recent trauma or osteoporosis", "Pulsatile abdominal mass"],
      chips:[
        {q:"Onset", type:"single", options:["sudden", "gradual", "after lifting or injury"], fmt:"{v} onset"},
        {q:"Site", type:"multi", options:["lower back", "upper back", "central", "one-sided"], fmt:"site: {v}"},
        {q:"Character", type:"multi", options:["dull ache", "sharp", "burning", "shooting"]},
        {q:"Radiation", type:"multi", options:["to the buttock", "to the leg above the knee", "to the leg below the knee", "to the groin"], fmt:"radiating {v}"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"severity {v}/10"},
        {q:"Triggers and relief", type:"multi", options:["worse on movement", "worse sitting", "worse on coughing", "worse at night", "better with rest", "morning stiffness over 30 minutes"]},
        {q:"Associated", type:"ternary", options:["leg weakness", "numbness or tingling", "saddle numbness", "bladder dysfunction", "bowel dysfunction", "fever", "weight loss", "recent trauma", "history of cancer"]}
      ],
      hopi:["Site (lumbar/thoracic/cervical), onset (acute/chronic/insidious), character, radiation (leg = sciatica), severity?",
            "Red flags: nocturnal pain, unrelenting, morning stiffness >1h, bladder/bowel dysfunction, bilateral leg neurology?",
            "Mechanism of injury, occupation, prior episodes, corticosteroids, osteoporosis risk factors, weight loss, age >50?"] },
    { label:"Limb Swelling (Unilateral)", system:"MSK",
      chips:[
        {q:"Limb", type:"single", options:["right leg", "left leg", "right arm", "left arm"], fmt:"swelling of {v}"},
        {q:"Onset", type:"single", options:["sudden (hours)", "over days", "gradual over weeks"], fmt:"{v}"},
        {q:"Features", type:"multi", options:["pain", "calf tenderness", "redness", "warmth", "pitting", "tight skin", "heaviness"], fmt:"{v}"},
        {q:"Swelling for", type:"duration", units:["hours", "days", "weeks", "months"], fmt:"for {v}"},
        {q:"Pain", type:"scale", min:0, max:10, fmt:"pain {v}/10"},
        {q:"Associated", type:"ternary", options:["breathlessness", "pleuritic chest pain", "fever", "recent injury", "skin wound or ulcer", "varicose veins", "lymph node swelling", "weight loss"]},
        {q:"Risk factors", type:"ternary", options:["recent surgery", "immobility or long travel", "previous DVT or PE", "known cancer", "pregnancy or postpartum", "oral contraceptive or HRT", "thrombophilia", "lymph node surgery or radiotherapy"]}
      ],
      hopi:["Onset (sudden vs gradual), site (calf/thigh/whole leg), pain, warmth, redness, pitting oedema?",
            "Recent travel/immobility/surgery/hospitalisation, oral contraceptive pill, pregnancy, malignancy history?",
            "Previous DVT/PE, family history of thrombophilia, Wells score features (active cancer, calf asymmetry >3cm)?"] },
    { label:"Neck Pain / Stiffness", system:"MSK",
      chips:[
        {q:"Onset", type:"single", options:["sudden", "gradual", "after injury", "on waking"], fmt:"{v} onset"},
        {q:"Site", type:"multi", options:["central", "right side", "left side", "base of skull", "radiating to shoulder", "radiating down the arm"], fmt:"site: {v}"},
        {q:"Character", type:"multi", options:["dull ache", "sharp", "stiffness", "muscle spasm", "burning"]},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"severity {v}/10"},
        {q:"Triggers and relief", type:"multi", options:["worse on turning", "worse looking up", "worse on flexing", "worse at end of day", "better with rest", "better with heat"]},
        {q:"Associated", type:"ternary", options:["arm pain or numbness", "arm weakness", "headache", "fever", "photophobia", "dizziness", "difficulty walking", "bladder or bowel change"]},
        {q:"Risk factors", type:"ternary", options:["recent trauma or whiplash", "poor posture or desk work", "previous neck problems", "osteoarthritis", "rheumatoid arthritis", "osteoporosis", "known cancer", "intravenous drug use"]}
      ],
      hopi:["Onset, character, radiation (arm/shoulder = cervical radiculopathy), paraesthesia in fingers, weakness?",
            "Trauma (whiplash), morning stiffness (inflammatory), fever/meningism (infection, SAH), occipital headache?",
            "Occupation (posture), prior episodes, red flags: age >50, weight loss, bilateral neurology, incontinence?"] },

    // ── ENDOCRINE / METABOLIC ────────────────────────────
    { label:"Weight Loss", system:"Endo",
      chips:[
        {q:"Amount lost", type:"single", options:["2 to 5 kg", "5 to 10 kg", "more than 10 kg"], fmt:"lost {v}"},
        {q:"Over", type:"duration", units:["weeks", "months"], fmt:"over {v}"},
        {q:"Appetite", type:"single", options:["reduced", "normal", "increased"], fmt:"appetite {v}"},
        {q:"Intent", type:"single", options:["unintentional", "intentional"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["night sweats", "fever", "fatigue", "dysphagia", "change in bowel habit", "cough or haemoptysis", "polyuria or thirst", "heat intolerance or palpitations"]},
        {q:"Risk factors", type:"ternary", options:["smoking", "alcohol", "diabetes", "known cancer", "HIV or TB risk", "depression", "family history of cancer", "new medicines"]}
      ],
      hopi:["Amount (kg/lbs), time period (weeks/months), intentional vs unintentional, percentage of body weight?",
            "Associated anorexia, dysphagia, altered bowel habit, haemoptysis, night sweats, fever (B symptoms)?",
            "Mood (depression, anxiety), oral health, ability to eat, medication changes, substance use, thyroid symptoms?"] },
    { label:"Weight Gain", system:"Endo",
      chips:[
        {q:"Amount gained", type:"single", options:["2 to 5 kg", "5 to 10 kg", "more than 10 kg"], fmt:"gained {v}"},
        {q:"Over", type:"duration", units:["weeks", "months", "years"], fmt:"over {v}"},
        {q:"Appetite", type:"single", options:["increased", "normal", "reduced"], fmt:"appetite {v}"},
        {q:"Distribution", type:"single", options:["generalised", "central (abdomen)", "face and trunk", "legs only"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["fatigue", "cold intolerance", "constipation", "ankle swelling", "menstrual irregularity", "low mood", "easy bruising", "purple stretch marks"]},
        {q:"Risk factors", type:"ternary", options:["steroids", "antipsychotics or antidepressants", "hypothyroidism", "polycystic ovary syndrome", "low physical activity", "pregnancy", "heart or kidney disease", "family history of obesity"]}
      ],
      hopi:["Amount, time period, associated changes in diet/activity, distribution (central vs generalised)?",
            "Associated ankle swelling, dyspnoea (cardiac), constipation, cold intolerance (hypothyroid), menstrual changes?",
            "Medications (steroids, antipsychotics, insulin), mood disorders, sleep apnoea symptoms, alcohol?"] },
    { label:"Polyuria / Polydipsia", system:"Endo",
      chips:[
        {q:"Symptoms for", type:"duration", units:["days", "weeks", "months"], fmt:"for {v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Urine volume", type:"single", options:["slightly increased", "markedly increased", "very large volumes"], fmt:"{v}"},
        {q:"Nocturia", type:"single", options:["none", "1 to 2 times", "3 or more times"], fmt:"nocturia: {v}"},
        {q:"Thirst", type:"single", options:["mild", "marked", "unquenchable"], fmt:"thirst: {v}"},
        {q:"Associated", type:"ternary", options:["weight loss", "fatigue", "blurred vision", "recurrent infections", "genital itching or thrush", "abdominal pain", "nausea or vomiting", "confusion"]},
        {q:"Risk factors", type:"ternary", options:["diabetes", "family history of diabetes", "diuretics", "lithium", "hypercalcaemia", "kidney disease", "head injury or pituitary surgery", "obesity"]}
      ],
      hopi:["Volume of urine (litres/24h), frequency vs true polyuria, nocturia, polydipsia quantity (litres/day)?",
            "Associated weight loss, fatigue, blurred vision, genital itching (DM); dilute vs concentrated urine?",
            "Medications (lithium, diuretics), hypercalcaemia symptoms, known DM or renal disease, family history?"] },
    { label:"Heat/Cold Intolerance", system:"Endo",
      chips:[
        {q:"Intolerance", type:"single", options:["heat", "cold", "both"], fmt:"{v} intolerance"},
        {q:"For", type:"duration", units:["weeks", "months", "years"], fmt:"for {v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Weight change", type:"single", options:["lost weight", "gained weight", "no change"], fmt:"{v}"},
        {q:"Features", type:"multi", options:["sweating", "tremor", "palpitations", "dry skin", "hair thinning", "constipation", "diarrhoea"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["anxiety", "fatigue", "menstrual change", "swelling in the neck", "eye symptoms", "low mood", "muscle weakness", "slow thinking"]},
        {q:"Risk factors", type:"ternary", options:["thyroid disease", "family history of thyroid disease", "radioiodine or thyroid surgery", "amiodarone or lithium", "pregnancy or postpartum", "autoimmune disease", "menopause", "excess iodine"]}
      ],
      hopi:["Heat intolerance (hyperthyroid) vs cold intolerance (hypothyroid), onset (gradual vs sudden)?",
            "Heat: weight loss, palpitations, tremor, diarrhoea, eye changes, goitre, sweating, menstrual irregularity?",
            "Cold: weight gain, constipation, hair loss, dry skin, slow mentation, bradycardia, hoarse voice?"] },
    { label:"Excessive Thirst / Fatigue (DM Screen)", system:"Endo",
      chips:[
        {q:"Symptoms for", type:"duration", units:["days", "weeks", "months"], fmt:"for {v}"},
        {q:"Onset", type:"single", options:["gradual", "sudden", "rapid over days"], fmt:"{v} onset"},
        {q:"Symptoms", type:"multi", options:["excessive thirst", "passing lots of urine", "tiredness", "blurred vision", "weight loss", "increased hunger", "recurrent infections"], fmt:"{v}"},
        {q:"Tiredness", type:"single", options:["mild", "moderate", "severe, affects daily activities"], fmt:"tiredness: {v}"},
        {q:"Associated", type:"ternary", options:["genital itching or thrush", "slow-healing wounds", "tingling in the feet", "nausea or vomiting", "abdominal pain", "fruity breath", "drowsiness", "weight loss"]},
        {q:"Risk factors", type:"ternary", options:["family history of diabetes", "obesity", "previous gestational diabetes", "polycystic ovary syndrome", "steroids", "hypertension", "high cholesterol", "age over 40"]}
      ],
      hopi:["Duration, severity of fatigue (affects work/daily life?), polydipsia, polyuria, nocturia, weight change?",
            "Blurred vision, genital itching/thrush, slow wound healing, recurrent infections, paraesthesia in feet?",
            "Family history of DM, cardiovascular disease, BMI, diet, exercise, ethnicity, gestational DM?"] },

    // ── HAEMATOLOGICAL ───────────────────────────────────
    { label:"Fatigue / Lethargy", system:"Haem",
      chips:[
        {q:"Fatigue for", type:"duration", units:["days", "weeks", "months", "years"], fmt:"for {v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"fatigue {v}/10"},
        {q:"Pattern", type:"single", options:["constant", "worse in the afternoon", "worse after exertion", "not relieved by rest"], fmt:"{v}"},
        {q:"Sleep", type:"single", options:["sleeping well", "poor sleep", "excess sleep", "unrefreshing sleep"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["weight loss", "fever", "night sweats", "low mood", "breathlessness", "pallor", "cold intolerance", "muscle aches"]},
        {q:"Risk factors", type:"ternary", options:["anaemia", "diabetes", "thyroid disease", "heart failure", "recent infection", "new medicines", "heavy periods", "poor diet or alcohol"]}
      ],
      hopi:["Duration, onset (sudden vs gradual), severity, impact on daily function and work?",
            "Sleep quality, mood (depression), cognitive symptoms, thyroid symptoms, polyuria/polydipsia?",
            "Anaemia symptoms: pallor, dyspnoea on exertion, palpitations; infections, medications, weight changes?"] },
    { label:"Pallor / Anaemia Symptoms", system:"Haem",
      chips:[
        {q:"Symptoms for", type:"duration", units:["days", "weeks", "months"], fmt:"for {v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Symptoms", type:"multi", options:["tiredness", "breathlessness on exertion", "palpitations", "dizziness", "headache", "tinnitus", "tendency to faint", "cold hands and feet"], fmt:"{v}"},
        {q:"Other features", type:"multi", options:["sore tongue", "brittle nails", "craving ice or non-food items", "hair loss", "restless legs"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["black stools", "blood in stool", "heavy periods", "weight loss", "jaundice", "dark urine", "fever", "bruising"]},
        {q:"Risk factors", type:"ternary", options:["poor diet", "vegetarian or vegan", "pregnancy", "malabsorption", "NSAIDs or aspirin", "chronic disease", "family history of anaemia", "worm infestation or travel"]}
      ],
      hopi:["Onset, severity, associated dyspnoea on exertion, palpitations, chest pain, dizziness on standing?",
            "Dietary history (iron/B12/folate intake), blood loss (PR, menorrhagia, haematuria), malabsorption symptoms?",
            "Medications (NSAIDs, methotrexate, antifolates), family history (haemoglobinopathy, G6PD), alcohol?"] },
    { label:"Bruising / Bleeding Tendency", system:"Haem",
      chips:[
        {q:"Bruising for", type:"duration", units:["days", "weeks", "months", "years"], fmt:"for {v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Site", type:"multi", options:["legs", "arms", "trunk", "gums", "nose", "urine", "stools"], fmt:"bleeding or bruising: {v}"},
        {q:"Extent", type:"single", options:["a few small bruises", "many bruises", "large bruises", "pinpoint spots (petechiae)"], fmt:"{v}"},
        {q:"Cause", type:"single", options:["spontaneous", "after minor trauma", "after major trauma"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["nosebleeds", "bleeding gums", "heavy periods", "blood in urine", "blood in stool", "joint swelling", "fever", "fatigue"]},
        {q:"Risk factors", type:"ternary", options:["warfarin or anticoagulants", "aspirin or NSAIDs", "steroids", "liver disease", "family history of bleeding", "alcohol", "recent infection", "leukaemia or chemotherapy"]}
      ],
      hopi:["Sites, spontaneous vs traumatic, size (petechiae/purpura/ecchymoses), mucosal bleeding, haemarthroses?",
            "Haemorrhage: post-procedural (dental, surgical), menorrhagia, epistaxis, melaena/PR bleeding?",
            "Medications (anticoagulants, NSAIDs, antiplatelet agents), liver disease, family history of bleeding disorder?"] },
    { label:"Night Sweats", system:"Haem",
      chips:[
        {q:"Night sweats for", type:"duration", units:["days", "weeks", "months"], fmt:"for {v}"},
        {q:"Frequency", type:"single", options:["occasional", "weekly", "most nights", "every night"], fmt:"{v}"},
        {q:"Severity", type:"single", options:["mild (damp)", "moderate", "drenching (soaks the bedding)"], fmt:"{v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Associated", type:"ternary", options:["fever", "weight loss", "cough", "lumps in the neck or armpit", "itching", "fatigue", "palpitations", "abdominal pain"]},
        {q:"Risk factors", type:"ternary", options:["TB contact", "HIV risk", "known cancer", "menopause", "new medicines", "alcohol", "recent infection", "thyroid disease"]}
      ],
      hopi:["Duration, severity (soaking night clothes/sheets vs mild), time of night (early vs late), fever associated?",
            "Associated weight loss and lymphadenopathy (B symptoms = malignancy: lymphoma, leukaemia)?",
            "Infections (TB, HIV, endocarditis), menopause, medications, alcohol, anxiety, hyperthyroidism?"] },

    // ── DERMATOLOGICAL ───────────────────────────────────
    { label:"Rash / Skin Lesion", system:"Derm",
      chips:[
        {q:"Site", type:"multi", options:["face", "scalp", "trunk", "arms", "hands", "legs", "feet", "genitals", "flexures", "generalised"], fmt:"site: {v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual", "recurrent"], fmt:"{v} onset"},
        {q:"Present for", type:"duration", units:["hours", "days", "weeks", "months", "years"], fmt:"for {v}"},
        {q:"Appearance", type:"multi", options:["red", "flat", "raised", "blisters", "scaly", "crusted", "weeping", "pustules", "ulcer", "target-like"], fmt:"{v}"},
        {q:"Itch", type:"single", options:["not itchy", "mildly itchy", "very itchy", "painful"], fmt:"{v}"},
        {q:"Course", type:"single", options:["spreading", "static", "coming and going", "getting smaller"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["fever", "joint pain", "mouth ulcers", "swelling of lips or face", "breathlessness", "new medicines", "contact with sick people", "sun exposure"]}
      ],
      hopi:["Site of onset, distribution (localised/generalised/centripetal/acral), progression, morphology (macule/papule/vesicle/pustule/plaque/nodule)?",
            "Pruritic, painful, burning; scaling, crusting, weeping; fever, mucosal involvement (Stevens-Johnson); drug history?",
            "Exposures (soap/cosmetics/plants/latex/metal), contacts with similar rash, UV exposure, atopy history?"] },
    { label:"Pruritus (Itch)", system:"Derm",
      chips:[
        {q:"Extent", type:"single", options:["localised", "generalised"], fmt:"{v}"},
        {q:"Site", type:"multi", options:["scalp", "trunk", "arms", "legs", "hands and feet", "genitals", "perianal", "between the fingers"], fmt:"site: {v}"},
        {q:"Itch for", type:"duration", units:["days", "weeks", "months"], fmt:"for {v}"},
        {q:"Pattern", type:"single", options:["constant", "worse at night", "after a hot bath", "intermittent"], fmt:"{v}"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"itch {v}/10"},
        {q:"Associated", type:"ternary", options:["rash", "dry skin", "jaundice", "weight loss", "night sweats", "fatigue", "household contacts also itching", "new medicines"]},
        {q:"Risk factors", type:"ternary", options:["eczema", "liver disease", "kidney disease", "diabetes", "thyroid disease", "iron deficiency", "pregnancy", "scabies contact"]}
      ],
      hopi:["Site (localised vs generalised), onset, severity, time pattern (nocturnal = scabies), rash present or not (sine lesione)?",
            "Associated jaundice, pale stools, dark urine (cholestasis); polycythaemia symptoms; CKD symptoms?",
            "Medications (opiates, chlorpromazine), dry skin, atopy, lymphoma/leukaemia, pregnancy (obstetric cholestasis)?"] },

    // ── ENT ──────────────────────────────────────────────
    { label:"Sore Throat / Odynophagia", system:"ENT",
      chips:[
        {q:"Sore throat for", type:"duration", units:["hours", "days", "weeks"], fmt:"for {v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"pain {v}/10"},
        {q:"Features", type:"multi", options:["pain on swallowing", "difficulty swallowing", "one-sided", "hoarse voice", "drooling", "muffled voice", "ear pain"], fmt:"{v}"},
        {q:"Can swallow", type:"single", options:["solids and fluids", "fluids only", "saliva only"], fmt:"can swallow {v}"},
        {q:"Associated", type:"ternary", options:["fever", "cough", "runny nose", "swollen neck glands", "white patches on the tonsils", "rash", "trismus (cannot open mouth)", "difficulty breathing"]},
        {q:"Risk factors", type:"ternary", options:["sick contacts", "smoking", "previous tonsillitis", "immunosuppression", "recent dental work", "incomplete vaccination", "recent glandular fever contact", "reflux"]}
      ],
      hopi:["Duration, severity, onset (sudden/gradual), unilateral vs bilateral, trismus (difficulty opening mouth)?",
            "Fever, drooling, voice change (muffled/hot potato = peritonsillar abscess), dysphagia, neck swelling?",
            "Recent contacts, URTI symptoms, streptococcal risk factors, immunosuppression, HIV risk?"] },
    { label:"Ear Pain / Otalgia", system:"ENT",
      chips:[
        {q:"Side", type:"single", options:["right", "left", "both"], fmt:"{v} side"},
        {q:"Pain for", type:"duration", units:["hours", "days", "weeks"], fmt:"for {v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"severity {v}/10"},
        {q:"Character", type:"multi", options:["sharp", "throbbing", "dull ache", "burning", "pain on touching the ear", "pain on chewing"]},
        {q:"Associated", type:"ternary", options:["discharge", "hearing loss", "tinnitus", "fever", "sore throat", "dizziness", "facial weakness", "swelling behind the ear"]},
        {q:"Risk factors", type:"ternary", options:["recent URTI", "swimming", "cotton bud use", "ear surgery or grommets", "diabetes", "recent flying", "dental problems", "hearing aid use"]}
      ],
      hopi:["Site (external/middle/referred), onset, character, associated hearing loss, discharge, tinnitus, vertigo?",
            "Jaw pain (TMJ), throat pain, dental problems, recent water exposure (swimmer's ear), upper respiratory infection?",
            "Fever, mastoid tenderness (mastoiditis), meningism, immune status?"] },
    { label:"Hearing Loss", system:"ENT",
      chips:[
        {q:"Side", type:"single", options:["right", "left", "both"], fmt:"{v} side"},
        {q:"Onset", type:"single", options:["sudden (hours to days)", "gradual (months to years)", "fluctuating"], fmt:"{v}"},
        {q:"Hearing loss for", type:"duration", units:["days", "weeks", "months", "years"], fmt:"for {v}"},
        {q:"Features", type:"multi", options:["difficulty in noisy places", "TV turned up loud", "muffled sounds", "cannot follow speech"], fmt:"{v}"},
        {q:"Severity", type:"single", options:["mild", "moderate", "severe", "profound"], fmt:"{v} loss"},
        {q:"Associated", type:"ternary", options:["tinnitus", "dizziness", "ear pain", "ear discharge", "blocked ear", "facial weakness", "head injury", "ear fullness"]},
        {q:"Risk factors", type:"ternary", options:["noise exposure", "family history of deafness", "ototoxic drugs", "recurrent ear infections", "head injury", "ear wax", "age over 60", "ear surgery"]}
      ],
      hopi:["Onset (sudden/gradual), unilateral vs bilateral, conductive vs sensorineural features, tinnitus, vertigo?",
            "Noise exposure (occupational/recreational), ototoxic medications (aminoglycosides, cisplatin, loop diuretics)?",
            "Family history, trauma, ear discharge, prior ear infections, Rinne/Weber test results?"] },
    { label:"Epistaxis (Nosebleed)", system:"ENT",
      chips:[
        {q:"Side", type:"single", options:["right", "left", "both"], fmt:"{v} side"},
        {q:"Onset", type:"single", options:["spontaneous", "after nose picking", "after trauma", "after blowing the nose"], fmt:"{v}"},
        {q:"Bleeding lasted", type:"duration", units:["minutes", "hours"], fmt:"lasted {v}"},
        {q:"Amount", type:"single", options:["few drops", "moderate", "heavy", "blood running down the throat"], fmt:"{v}"},
        {q:"Episodes", type:"single", options:["first episode", "recurrent"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["bruising elsewhere", "bleeding gums", "dizziness", "blood in urine or stool", "blocked nose", "facial pain", "headache", "swallowing blood"]},
        {q:"Risk factors", type:"ternary", options:["hypertension", "anticoagulants or aspirin", "nasal steroid or cocaine use", "dry air", "nasal trauma", "bleeding disorder", "liver disease", "alcohol excess"]}
      ],
      hopi:["Site (anterior – Little's area / posterior), severity (volume), frequency, duration, spontaneous vs traumatic?",
            "Associated hypertension, anticoagulant use (warfarin, apixaban), NSAIDs, nasal foreign body, septal perforation?",
            "Haematological risk: platelet disorder, haemophilia, von Willebrand disease, hepatic disease?"] },

    // ── OPHTHALMOLOGY ────────────────────────────────────
    { label:"Red Eye", system:"Ophthalm",
      chips:[
        {q:"Side", type:"single", options:["right", "left", "both"], fmt:"{v} eye"},
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Red eye for", type:"duration", units:["hours", "days", "weeks"], fmt:"for {v}"},
        {q:"Pain", type:"single", options:["painless", "gritty", "sharp", "deep ache", "severe"], fmt:"{v}"},
        {q:"Discharge", type:"multi", options:["watery", "sticky", "purulent", "none"], fmt:"discharge: {v}"},
        {q:"Associated", type:"ternary", options:["reduced vision", "photophobia", "halos around lights", "itching", "headache", "nausea or vomiting", "recent eye injury", "swollen eyelid"]},
        {q:"Risk factors", type:"ternary", options:["contact lens use", "recent eye surgery", "recent URTI", "allergy or hay fever", "previous uveitis", "autoimmune disease", "foreign body or chemical exposure", "sick contacts"]}
      ],
      hopi:["Onset, unilateral vs bilateral, distribution (circumcorneal/conjunctival), pain vs painless, vision affected?",
            "Photophobia, watering (viral) vs purulent discharge (bacterial), itching (allergic), foreign body sensation?",
            "Contact lens use, trauma, systemic disease (uveitis in AS/IBD/sarcoid), recent URTI?"] },
    { label:"Visual Disturbance", system:"Ophthalm",
      chips:[
        {q:"Eye", type:"single", options:["right eye", "left eye", "both eyes"], fmt:"{v}"},
        {q:"Onset", type:"single", options:["sudden", "over hours", "gradual over weeks or months"], fmt:"{v}"},
        {q:"Type", type:"multi", options:["blurred vision", "loss of vision", "flashing lights", "floaters", "curtain or shadow", "distorted lines", "double vision", "halos"], fmt:"{v}"},
        {q:"Field affected", type:"single", options:["whole field", "central", "peripheral", "half of the field"], fmt:"{v}"},
        {q:"Disturbance for", type:"duration", units:["seconds", "minutes", "hours", "days", "weeks"], fmt:"for {v}"},
        {q:"Associated", type:"ternary", options:["eye pain", "headache", "scalp tenderness", "jaw claudication", "limb weakness", "speech difficulty", "eye redness", "nausea or vomiting"]},
        {q:"Risk factors", type:"ternary", options:["diabetes", "hypertension", "migraine", "family history of glaucoma", "short-sightedness", "atrial fibrillation", "age over 50", "recent eye surgery"]}
      ],
      hopi:["Type: loss (central/peripheral/total), blurring, diplopia, flashes/floaters, visual field defect, colour change?",
            "Onset (sudden = emergency: CRVO/CRAO/detachment vs gradual = cataract/glaucoma), painful vs painless?",
            "Diabetes, hypertension, temporal headache (GCA), neurological symptoms, medications?"] },

    // ── PSYCHIATRIC ──────────────────────────────────────
    { label:"Low Mood / Depression", system:"Psych",
      chips:[
        {q:"Low mood for", type:"duration", units:["days", "weeks", "months", "years"], fmt:"for {v}"},
        {q:"Onset", type:"single", options:["gradual", "sudden after an event", "recurrent episodes"], fmt:"{v}"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"low mood {v}/10"},
        {q:"Core symptoms", type:"multi", options:["low mood most of the day", "loss of interest", "tearfulness", "poor concentration", "guilt or worthlessness", "hopelessness", "irritability"], fmt:"{v}"},
        {q:"Biological features", type:"multi", options:["poor sleep", "early morning waking", "reduced appetite", "increased appetite", "low energy", "weight change", "reduced libido"], fmt:"{v}"},
        {q:"Safety screen", type:"ternary", options:["thoughts of self-harm", "suicidal thoughts", "plans or intent", "previous attempts", "psychotic symptoms", "alcohol or drug use", "access to means"]},
        {q:"Risk factors", type:"ternary", options:["previous depression", "family history of depression", "recent bereavement or loss", "chronic illness", "financial or relationship stress", "postnatal period", "thyroid disease", "substance misuse"]}
      ],
      hopi:["Duration, onset, severity, SIGECAPS: Sleep, Interest, Guilt, Energy, Concentration, Appetite, Psychomotor, Suicidal?",
            "Biological symptoms (early morning wakening, diurnal variation worse AM, anhedonia, weight change)?",
            "Precipitating stressors, past episodes, family history, medications, substance use, hypothyroidism?"] },
    { label:"Anxiety / Panic Attacks", system:"Psych",
      chips:[
        {q:"Symptoms for", type:"duration", units:["days", "weeks", "months", "years"], fmt:"for {v}"},
        {q:"Pattern", type:"single", options:["constant worry", "sudden panic attacks", "situational", "both"], fmt:"{v}"},
        {q:"Each panic attack lasts", type:"duration", units:["minutes", "hours"], fmt:"each attack lasts {v}"},
        {q:"Physical symptoms", type:"multi", options:["palpitations", "sweating", "tremor", "chest tightness", "breathlessness", "dizziness", "tingling", "nausea", "dry mouth"], fmt:"{v}"},
        {q:"Triggers", type:"multi", options:["crowds", "social situations", "a specific phobia", "caffeine", "alcohol", "stress at work or study", "no clear trigger"], fmt:"triggered by {v}"},
        {q:"Associated", type:"ternary", options:["poor sleep", "avoidance of places", "low mood", "fear of dying", "fear of losing control", "feeling unreal (depersonalisation)", "substance use", "thoughts of self-harm"]},
        {q:"Risk factors", type:"ternary", options:["family history of anxiety", "previous trauma", "thyroid disease", "high caffeine intake", "stimulant use", "alcohol or benzodiazepine withdrawal", "chronic illness", "recent major stress"]}
      ],
      hopi:["Onset, duration of attacks, frequency, triggers (social/specific phobia/generalised), anticipatory anxiety?",
            "Physical symptoms (palpitations, sweating, tremor, shortness of breath, chest tightness, derealization)?",
            "Medications, caffeine, substance use, thyroid disease, cardiac arrhythmia, prior psychiatric history?"] },
    { label:"Psychosis / Hallucinations", system:"Psych",
      chips:[
        {q:"Symptoms for", type:"duration", units:["days", "weeks", "months", "years"], fmt:"for {v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual", "recurrent"], fmt:"{v} onset"},
        {q:"Hallucinations", type:"multi", options:["auditory (voices)", "visual", "tactile", "olfactory", "command voices", "commenting voices"], fmt:"{v}"},
        {q:"Delusions", type:"multi", options:["persecutory", "grandiose", "referential", "religious", "control by outside forces", "thought insertion or broadcast"], fmt:"delusions: {v}"},
        {q:"Insight", type:"single", options:["full insight", "partial insight", "no insight"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["low mood", "elevated mood", "disorganised speech", "social withdrawal", "poor self-care", "sleep disturbance", "agitation or aggression", "suicidal thoughts"]},
        {q:"Risk factors", type:"ternary", options:["substance use (cannabis, stimulants)", "family history of psychosis", "previous psychiatric admission", "medication non-adherence", "recent stressor", "head injury", "epilepsy", "infection or delirium"]}
      ],
      hopi:["Type of hallucinations (AH/VH/tactile/olfactory), delusions (persecutory/grandiose/reference/nihilistic)?",
            "Thought disorder (loosening of associations, thought insertion/withdrawal/broadcast), negative symptoms?",
            "Duration, onset (acute vs insidious), first episode vs relapse, substance use (cannabis, stimulants), organic cause?"] },
    { label:"Insomnia / Sleep Disturbance", system:"Psych",
      chips:[
        {q:"Insomnia for", type:"duration", units:["days", "weeks", "months", "years"], fmt:"for {v}"},
        {q:"Problem", type:"multi", options:["difficulty falling asleep", "waking in the night", "early morning waking", "unrefreshing sleep", "excessive daytime sleepiness", "nightmares"], fmt:"{v}"},
        {q:"Sleep per night", type:"single", options:["under 3 hours", "3 to 5 hours", "5 to 6 hours"], fmt:"sleeping {v}"},
        {q:"Frequency", type:"single", options:["every night", "most nights", "occasional"], fmt:"{v}"},
        {q:"Contributors", type:"multi", options:["caffeine", "alcohol", "screen use at night", "shift work", "noise", "daytime napping", "pain"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["low mood", "anxiety", "snoring or apnoea", "restless legs", "nocturia", "night sweats", "reflux", "nightmares"]},
        {q:"Risk factors", type:"ternary", options:["stress", "depression or anxiety", "chronic pain", "new medicines", "stimulant use", "thyroid disease", "sleep apnoea", "pregnancy or menopause"]}
      ],
      hopi:["Type: initial (can't fall asleep), middle (frequent waking), early morning waking (depression), hypersomnia?",
            "Sleep hygiene, screen time, caffeine intake, nocturia, pain, OSA symptoms (snoring, witnessed apnoeas, daytime sleepiness)?",
            "Anxiety, depression, shift work, medications (stimulants, steroids, beta-blockers), restless legs?"] },

    // ── GASTROINTESTINAL (additional) ────────────────────
    { label:"Haematemesis", system:"GI",
      redFlags:["Large volume or ongoing bleeding", "Hypotension, tachycardia or collapse", "Known liver disease or varices", "Anticoagulant or antiplatelet use", "Melaena as well", "Age over 60 or other serious illness"],
      chips:[
        {q:"Onset", type:"single", options:["sudden", "after repeated vomiting", "gradual"], fmt:"{v} onset"},
        {q:"Blood is", type:"single", options:["bright red", "coffee-ground", "dark clots"], fmt:"{v}"},
        {q:"Amount", type:"single", options:["streaks", "a cupful", "more than a cupful", "massive"], fmt:"amount: {v}"},
        {q:"Episodes", type:"single", options:["single", "recurrent"], fmt:"{v}"},
        {q:"First noticed", type:"duration", units:["hours", "days"], fmt:"started {v} ago"},
        {q:"Associated", type:"ternary", options:["melaena", "epigastric pain", "dizziness or syncope", "palpitations", "weight loss", "jaundice", "retching before the bleed", "dysphagia"]},
        {q:"Risk factors", type:"ternary", options:["alcohol excess", "liver disease", "NSAIDs or aspirin", "anticoagulants", "previous ulcer", "known varices", "smoking", "recent steroids"]}
      ],
      hopi:["Volume (teaspoons/cupfuls), colour (bright red vs coffee-ground), frequency, associated melaena?",
            "Prior peptic ulcer, liver disease (varices), NSAID/alcohol use, preceding retching (Mallory-Weiss)?",
            "Red flags: haemodynamic instability (tachycardia, hypotension, pallor), large volume, known cirrhosis -> urgent endoscopy?"] },
    { label:"Rectal Prolapse / Tenesmus", system:"GI",
      chips:[
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Symptoms for", type:"duration", units:["weeks", "months", "years"], fmt:"for {v}"},
        {q:"Symptoms", type:"multi", options:["mass protruding from the anus", "feeling of incomplete emptying", "urge with little passed", "mucus discharge", "bleeding"]},
        {q:"Protrusion", type:"single", options:["only when straining", "after every bowel movement", "needs pushing back in", "permanent"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["constipation", "diarrhoea", "faecal incontinence", "blood in stool", "pain", "weight loss", "change in bowel habit"]},
        {q:"Risk factors", type:"ternary", options:["chronic straining", "multiple vaginal deliveries", "previous pelvic surgery", "pelvic floor weakness", "inflammatory bowel disease", "previous radiotherapy", "chronic cough", "neurological disease"]}
      ],
      hopi:["Tenesmus (constant urge to defecate, incomplete evacuation), mucus PR, painful defecation?",
            "Visible prolapse (reducible vs irreducible), bleeding, constipation vs diarrhoea, straining history?",
            "IBD, colorectal cancer, pelvic floor weakness, obstetric history (parity), prior anorectal surgery?"] },
    { label:"Anal Pain / Perianal Symptoms", system:"GI",
      chips:[
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Symptoms for", type:"duration", units:["days", "weeks", "months"], fmt:"for {v}"},
        {q:"Character", type:"multi", options:["sharp", "throbbing", "burning", "dull ache", "tearing on defecation", "constant"]},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"severity {v}/10"},
        {q:"Timing", type:"multi", options:["during defecation", "after defecation", "when sitting", "on coughing", "at night"], fmt:"worse {v}"},
        {q:"Associated", type:"ternary", options:["lump", "bleeding", "discharge", "itching", "fever", "constipation", "swelling", "tenesmus"]},
        {q:"Risk factors", type:"ternary", options:["constipation", "previous anal surgery", "Crohn disease", "anal intercourse", "diabetes", "immunosuppression", "previous abscess or fistula"]}
      ],
      hopi:["Site (perianal, within rectum), onset, character (sharp/throbbing/burning), relation to defecation?",
            "Bleeding PR (bright red), discharge, swelling/lump, fever, pruritus ani, constipation?",
            "Haemorrhoids, fissure-in-ano, fistula, abscess, pilonidal sinus, Crohn's, STI risk (anal receptive sex)?"] },

    // ── GENITOURINARY (additional) ───────────────────────
    { label:"Scrotal Pain / Swelling", system:"GU",
      redFlags:["Sudden onset severe pain (torsion until proven otherwise)", "High-riding or horizontally lying testis", "Absent cremasteric reflex", "Nausea and vomiting with the pain", "Age under 25 or recent trauma", "Hard painless testicular lump", "Fever with a red, swollen scrotum"],
      chips:[
        {q:"Onset", type:"single", options:["sudden (hours)", "gradual (days)", "chronic (weeks to months)"], fmt:"{v}"},
        {q:"Side", type:"single", options:["right", "left", "both"], fmt:"{v} side"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"severity {v}/10"},
        {q:"Character", type:"multi", options:["constant", "intermittent", "dull ache", "sharp"]},
        {q:"Swelling", type:"multi", options:["painless lump", "generalised swelling", "swelling that disappears lying down", "tender swelling"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["nausea or vomiting", "fever", "dysuria", "urethral discharge", "groin lump", "recent trauma", "lower abdominal pain", "recent mumps"]},
        {q:"Risk factors", type:"ternary", options:["recent trauma", "recent sexual activity", "previous torsion", "undescended testis", "recent urinary tract infection", "family history of testicular cancer", "vasectomy", "heavy lifting"]}
      ],
      hopi:["Onset (sudden = torsion vs gradual = epididymo-orchitis), site (testis/epididymis/cord/scrotal wall), severity?",
            "Associated fever, dysuria, urethral discharge, nausea/vomiting, trauma, previous episodes?",
            "Red flags: sudden severe onset in young male -> torsion until proven otherwise, surgical emergency within 6h?"] },
    { label:"Vaginal Discharge / PV Bleeding", system:"GU",
      redFlags:["Heavy bleeding with dizziness or collapse", "Pregnant or possibly pregnant", "Severe lower abdominal pain or shoulder-tip pain", "Fever with pelvic pain", "Postmenopausal bleeding", "Intermenstrual or post-coital bleeding", "Foul-smelling discharge with systemic upset"],
      chips:[
        {q:"Symptom", type:"multi", options:["discharge", "bleeding", "spotting", "post-coital bleeding", "post-menopausal bleeding"], fmt:"{v}"},
        {q:"Symptoms for", type:"duration", units:["days", "weeks", "months"], fmt:"for {v}"},
        {q:"Discharge", type:"multi", options:["white", "yellow-green", "offensive smelling", "frothy", "curdy", "blood-stained"], fmt:"discharge: {v}"},
        {q:"Bleeding amount", type:"single", options:["spotting", "light", "like a period", "heavy with clots"], fmt:"bleeding: {v}"},
        {q:"Associated", type:"ternary", options:["pelvic pain", "itching", "dysuria", "dyspareunia", "fever", "missed period or possible pregnancy", "dizziness", "new partner"]},
        {q:"Risk factors", type:"ternary", options:["sexually transmitted infection", "pregnancy", "hormonal contraception", "menopause", "missed smear tests", "previous gynaecological surgery", "fibroids or polyps", "anticoagulants"]}
      ],
      hopi:["Discharge: colour, consistency, odour, volume, associated pruritus, dyspareunia, dysuria?",
            "PV bleeding: timing (cyclical vs intermenstrual vs post-coital vs post-menopausal), volume, clots, pain?",
            "LMP, sexual history, contraception, smear history, STI risk, pregnancy test, post-menopausal status?"] },
    { label:"Erectile Dysfunction", system:"GU",
      chips:[
        {q:"Problem for", type:"duration", units:["weeks", "months", "years"], fmt:"for {v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Problem", type:"single", options:["difficulty getting an erection", "difficulty keeping it", "situational", "always"], fmt:"{v}"},
        {q:"Morning erections", type:"single", options:["present", "absent"], fmt:"morning erections {v}"},
        {q:"Associated", type:"ternary", options:["reduced libido", "premature ejaculation", "pain on erection", "penile curvature", "low mood or anxiety", "relationship stress", "urinary symptoms", "fatigue"]},
        {q:"Risk factors", type:"ternary", options:["diabetes", "hypertension", "smoking", "alcohol", "heart disease", "antihypertensives or antidepressants", "pelvic surgery or radiotherapy", "recreational drugs"]}
      ],
      hopi:["Duration, onset (gradual = organic vs sudden = psychogenic), morning/nocturnal erections preserved?",
            "Associated loss of libido, ejaculatory problems, relationship stress, performance anxiety?",
            "Cardiovascular risk factors (DM, HTN, dyslipidaemia, smoking), medications (beta-blockers, antidepressants, antihypertensives), testosterone deficiency symptoms?"] },

    // ── MUSCULOSKELETAL (additional) ─────────────────────
    { label:"Hip Pain", system:"MSK",
      chips:[
        {q:"Side", type:"single", options:["right", "left", "both"], fmt:"{v} side"},
        {q:"Site", type:"multi", options:["groin", "outer hip (trochanter)", "buttock", "thigh", "knee"], fmt:"site: {v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual", "after a fall", "after injury"], fmt:"{v} onset"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"severity {v}/10"},
        {q:"Triggers and relief", type:"multi", options:["worse on walking", "worse on weight bearing", "worse lying on that side", "worse on stairs", "better with rest", "start-up pain", "night pain"]},
        {q:"Associated", type:"ternary", options:["limp", "stiffness", "groin swelling", "fever", "back pain", "giving way", "clicking or locking", "weight loss"]},
        {q:"Risk factors", type:"ternary", options:["osteoarthritis", "osteoporosis", "previous hip fracture", "steroid use", "alcohol excess", "rheumatoid arthritis", "known cancer", "childhood hip problems"]}
      ],
      hopi:["Site (groin = intra-articular; lateral = trochanteric bursitis; buttock = referred from spine/SI joint)?",
            "Onset, character, radiation (knee), start-up stiffness, limp, weight-bearing ability, range of motion?",
            "Age (OA in elderly; AVN = steroids/alcohol/sickle cell; SUFE/Perthes in children), trauma, systemic disease?"] },
    { label:"Shoulder Pain", system:"MSK",
      chips:[
        {q:"Side", type:"single", options:["right", "left", "both"], fmt:"{v} side"},
        {q:"Onset", type:"single", options:["sudden", "gradual", "after a fall or injury", "after overuse"], fmt:"{v} onset"},
        {q:"Site", type:"multi", options:["top of the shoulder", "front", "back", "outer deltoid area", "radiating down the arm", "neck"], fmt:"site: {v}"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"severity {v}/10"},
        {q:"Triggers and relief", type:"multi", options:["worse overhead", "worse lying on that side", "worse at night", "worse reaching behind", "better with rest"]},
        {q:"Associated", type:"ternary", options:["stiffness", "weakness", "clicking or catching", "swelling", "neck pain", "arm numbness", "chest pain", "feeling the shoulder slips out"]},
        {q:"Risk factors", type:"ternary", options:["diabetes", "previous dislocation", "overhead sport or work", "previous fracture", "rheumatoid arthritis", "thyroid disease", "heart disease", "previous shoulder surgery"]}
      ],
      hopi:["Site (anterior/lateral/posterior), onset, character, radiation (neck/arm = referred vs cervical radiculopathy)?",
            "Painful arc (60–120° = impingement), night pain, weakness (rotator cuff tear), stiffness (frozen shoulder)?",
            "Mechanism (fall on outstretched hand = dislocation/AC injury), occupation (overhead work), dominant arm?"] },
    { label:"Wrist / Hand Pain", system:"MSK",
      chips:[
        {q:"Side", type:"single", options:["right", "left", "both"], fmt:"{v} side"},
        {q:"Onset", type:"single", options:["sudden", "gradual", "after injury", "after repetitive use"], fmt:"{v} onset"},
        {q:"Site", type:"multi", options:["thumb side", "little finger side", "palm", "fingers", "back of the wrist", "whole hand"], fmt:"site: {v}"},
        {q:"Character", type:"multi", options:["aching", "sharp", "burning", "tingling", "numbness"]},
        {q:"Pattern", type:"multi", options:["worse at night", "worse with gripping", "worse on waking", "worse with typing", "relieved by shaking the hand"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["weakness or dropping things", "clicking or locking", "swelling", "morning stiffness", "neck pain", "colour change in fingers", "fever"]},
        {q:"Risk factors", type:"ternary", options:["repetitive manual work", "pregnancy", "diabetes", "hypothyroidism", "rheumatoid arthritis", "previous wrist fracture", "gout", "obesity"]}
      ],
      hopi:["Site (carpal tunnel = volar wrist/fingers I-III; De Quervain = radial snuffbox; RA = MCP/PIP joints)?",
            "Nocturnal paraesthesia/numbness (CTS), weakness (grip, pinch), morning stiffness, triggering?",
            "Occupation (repetitive use), diabetes, hypothyroidism, pregnancy (CTS risk), rheumatoid symptoms, trauma?"] },
    { label:"Swollen Lymph Node", system:"MSK",
      chips:[
        {q:"Site", type:"multi", options:["neck", "armpit", "groin", "above the collar bone", "multiple sites"], fmt:"site: {v}"},
        {q:"Lump present for", type:"duration", units:["days", "weeks", "months"], fmt:"for {v}"},
        {q:"Course", type:"single", options:["growing", "static", "fluctuating", "getting smaller"], fmt:"{v}"},
        {q:"Features", type:"multi", options:["painful", "painless", "hard", "rubbery", "fixed", "tender", "red"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["fever", "night sweats", "weight loss", "sore throat", "skin rash", "itching", "dental or mouth infection", "cough"]},
        {q:"Risk factors", type:"ternary", options:["recent infection", "TB contact", "HIV risk", "known cancer", "cat scratch or animal exposure", "new medicines", "smoking", "recent travel"]}
      ],
      hopi:["Site (cervical/axillary/inguinal/generalised), size, onset, consistency (soft/firm/hard/rubbery/matted), tender?",
            "Associated fever, night sweats, weight loss (B symptoms = lymphoma), skin changes, local infection/injury?",
            "Red flags: hard, non-tender, >2cm, progressive, supraclavicular location -> malignancy until proven otherwise?"] },

    // ── NEUROLOGICAL (additional) ────────────────────────
    { label:"Facial Pain / Numbness", system:"Neuro",
      chips:[
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Site", type:"multi", options:["forehead", "cheek", "jaw", "around the eye", "one side", "both sides"], fmt:"site: {v}"},
        {q:"Character", type:"multi", options:["electric shock", "stabbing", "burning", "dull ache", "numbness", "tingling"]},
        {q:"Each episode lasts", type:"duration", units:["seconds", "minutes", "hours"], fmt:"each episode lasts {v}"},
        {q:"Triggers", type:"multi", options:["chewing", "touching the face", "cold wind", "brushing teeth", "talking", "swallowing"], fmt:"triggered by {v}"},
        {q:"Associated", type:"ternary", options:["facial weakness", "visual change", "ear pain", "rash", "dental problem", "hearing loss", "dry or red eye", "nasal congestion"]},
        {q:"Risk factors", type:"ternary", options:["multiple sclerosis", "recent shingles", "recent dental work", "sinus disease", "diabetes", "previous facial trauma", "age over 50", "hypertension"]}
      ],
      hopi:["Site (unilateral/bilateral), distribution (which division of trigeminal V1/V2/V3), character (lancinating = TN)?",
            "Triggers (eating, speaking, touch = trigeminal neuralgia), continuous vs paroxysmal, jaw deviation, trismus?",
            "Associated headache, eye symptoms, dental pathology, rash (zoster), MS history, space-occupying lesion risk?"] },
    { label:"Diplopia", system:"Neuro",
      chips:[
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Pattern", type:"single", options:["constant", "intermittent", "worse at end of day"], fmt:"{v}"},
        {q:"Images are", type:"single", options:["side by side (horizontal)", "one above the other (vertical)", "diagonal"], fmt:"{v}"},
        {q:"With one eye closed", type:"single", options:["resolves", "persists"], fmt:"double vision {v}"},
        {q:"Diplopia for", type:"duration", units:["hours", "days", "weeks", "months"], fmt:"for {v}"},
        {q:"Associated", type:"ternary", options:["headache", "eye pain", "drooping eyelid", "facial weakness", "limb weakness", "slurred speech", "dizziness", "scalp tenderness"]},
        {q:"Risk factors", type:"ternary", options:["diabetes", "hypertension", "thyroid disease", "myasthenia gravis", "multiple sclerosis", "head injury", "previous stroke", "age over 50"]}
      ],
      hopi:["Monocular (persists with one eye closed = lens/retina) vs binocular (disappears = cranial nerve/muscle)?",
            "Direction of maximum diplopia, vertical vs horizontal, onset (sudden = vascular), associated ptosis, pupil?",
            "Diabetes (CN III/VI palsy), hypertension, trauma, thyroid disease (TED), myasthenia gravis, raised ICP?"] },

    // ── PSYCHIATRIC (additional) ─────────────────────────
    { label:"Eating Disorder Symptoms", system:"Psych",
      chips:[
        {q:"Symptoms for", type:"duration", units:["weeks", "months", "years"], fmt:"for {v}"},
        {q:"Behaviours", type:"multi", options:["restricting food", "binge eating", "self-induced vomiting", "laxative misuse", "excessive exercise", "diuretic or diet pill misuse", "food rituals"], fmt:"{v}"},
        {q:"Weight change", type:"single", options:["weight loss", "weight gain", "fluctuating", "stable"], fmt:"{v}"},
        {q:"Thoughts", type:"multi", options:["fear of weight gain", "distorted body image", "guilt after eating", "preoccupation with food", "low self-worth"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["absent or irregular periods", "dizziness or fainting", "palpitations", "cold intolerance", "constipation", "tooth erosion", "low mood", "self-harm"]},
        {q:"Risk factors", type:"ternary", options:["previous eating disorder", "family history", "perfectionism", "athletics or dance", "diabetes (insulin omission)", "trauma or bullying", "substance use", "criticism about weight"]}
      ],
      hopi:["Restriction of intake, bingeing, purging (vomiting, laxatives, diuretics), compulsive exercise?",
            "Body image distortion, fear of weight gain, amenorrhoea, fatigue, dizziness, dental erosion, parotid swelling?",
            "Duration, lowest/highest weight, triggers, family history, previous treatment, medical complications (electrolytes)?"] },
    { label:"Substance Misuse / Withdrawal", system:"Psych",
      chips:[
        {q:"Substance", type:"multi", options:["alcohol", "opioids", "cannabis", "stimulants (cocaine, amphetamine)", "benzodiazepines", "tobacco", "other"], fmt:"substances: {v}"},
        {q:"Using for", type:"duration", units:["months", "years"], fmt:"using for {v}"},
        {q:"Pattern", type:"single", options:["daily", "several times a week", "binges", "occasional"], fmt:"{v}"},
        {q:"Route", type:"single", options:["oral", "smoked", "inhaled", "injected", "mixed"], fmt:"route: {v}"},
        {q:"Last use", type:"single", options:["today", "yesterday", "2 to 3 days ago", "over a week ago"], fmt:"last use {v}"},
        {q:"Withdrawal features", type:"ternary", options:["tremor", "sweating", "anxiety", "nausea or vomiting", "seizures", "hallucinations", "agitation", "diarrhoea or yawning"]},
        {q:"Risk factors", type:"ternary", options:["previous withdrawal seizures", "delirium tremens", "shared needles", "mental health problems", "chronic pain", "homelessness", "family history of addiction", "previous overdose"]}
      ],
      hopi:["Substance (alcohol/opiates/benzodiazepines/stimulants/cannabis), frequency, quantity, route, last use?",
            "Withdrawal symptoms: alcohol (tremor, sweating, seizures, DTs); opiates (diarrhoea, cramps, rhinorrhoea, piloerection)?",
            "Dependence criteria (tolerance, withdrawal, loss of control, use despite harm), social/occupational impact, previous detox?"] },

    // ── PAEDIATRIC (new system) ──────────────────────────
    { label:"Fever in a Child", system:"Peds",
      redFlags:["Non-blanching rash", "Neck stiffness, bulging fontanelle or photophobia", "Drowsy, floppy or difficult to rouse", "Grunting, nasal flaring or rapid breathing", "Age under 3 months with a fever", "Signs of dehydration or reduced urine output", "Cold peripheries or prolonged capillary refill", "Seizure"],
      chips:[
        {q:"Pattern", type:"single", options:["continuous", "intermittent", "spiking"], fmt:"{v} fever"},
        {q:"Behaviour", type:"single", options:["playful", "irritable", "drowsy or floppy"], fmt:"{v}"},
        {q:"Feeding", type:"single", options:["feeding normally", "reduced feeding", "refusing feeds"], fmt:"{v}"},
        {q:"Urine output", type:"single", options:["normal urine output", "reduced urine output", "no wet nappy for over 8 hours"], fmt:"{v}"},
        {q:"Medicine given", type:"multi", options:["paracetamol", "ibuprofen", "antibiotics", "none"], fmt:"given {v}"},
        {q:"Associated", type:"ternary", options:["cough", "runny nose", "sore throat", "ear pulling", "vomiting", "diarrhoea", "rash", "neck stiffness", "seizure", "foul-smelling urine", "fast or difficult breathing"]},
        {q:"Background", type:"ternary", options:["sick contacts", "immunisations up to date", "recent travel"]}
      ],
      hopi:["Age, duration, height of fever (°F/°C), pattern (continuous/intermittent/remittent), response to antipyretics?",
            "Source: URTI (cough, coryza), UTI (dysuria, frequency), meningism (neck stiffness, photophobia, purpuric rash)?",
            "Red flags: non-blanching rash (meningococcal), bulging fontanelle, altered consciousness, seizure, <3 months old?"] },
    { label:"Vomiting in an Infant", system:"Peds",
      chips:[
        {q:"Vomiting for", type:"duration", units:["hours", "days", "weeks"], fmt:"for {v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual"], fmt:"{v} onset"},
        {q:"Type", type:"single", options:["small possets", "large effortless vomits", "projectile", "forceful"], fmt:"{v}"},
        {q:"Vomit is", type:"single", options:["milk or food", "green (bilious)", "blood-stained", "coffee-ground"], fmt:"vomit: {v}"},
        {q:"Feeding", type:"single", options:["feeding normally", "feeding poorly", "refusing feeds", "hungry after vomiting"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["diarrhoea", "fever", "abdominal distension", "blood in stool", "lethargy", "fewer wet nappies", "bulging fontanelle", "irritability or colic"]},
        {q:"Risk factors", type:"ternary", options:["sick contacts", "new formula or weaning", "family history of pyloric stenosis", "prematurity", "reflux history", "recent illness", "recent head injury", "poor weight gain"]}
      ],
      hopi:["Age, onset, frequency, volume, projectile (pyloric stenosis), bilious (obstruction) vs non-bilious?",
            "Feeding history (breast/formula, volume, technique), weight gain/loss, wet nappies (hydration), fever?",
            "Blood in vomit, abdominal distension, current latch issues, family history of pyloric stenosis, episodes of inconsolable crying (intussusception)?"] },
    { label:"Rash in a Child", system:"Peds",
      chips:[
        {q:"Site", type:"single", options:["face", "trunk", "limbs", "nappy area", "hands and feet", "generalised"], fmt:"site: {v}"},
        {q:"Onset", type:"single", options:["sudden", "gradual", "after fever"], fmt:"{v} onset"},
        {q:"Rash for", type:"duration", units:["hours", "days", "weeks"], fmt:"for {v}"},
        {q:"Appearance", type:"multi", options:["red patches", "pinpoint spots", "blisters", "scaly", "non-blanching", "weeping or crusted", "wheals (hives)"], fmt:"{v}"},
        {q:"Itch", type:"single", options:["not itchy", "mildly itchy", "very itchy"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["fever", "sore throat", "cough or runny nose", "conjunctivitis", "mouth ulcers", "joint pain", "lethargy", "neck stiffness"]},
        {q:"Risk factors", type:"ternary", options:["sick contacts at school", "unvaccinated", "new medicines", "new foods", "family history of eczema or asthma", "recent travel", "insect bites", "new soaps or detergents"]}
      ],
      hopi:["Age, onset, distribution (starting site, spread), morphology (macular/papular/vesicular/petechial/purpuric)?",
            "Blanching vs non-blanching (non-blanching = meningococcal until proven otherwise), fever, pruritus, systemic upset?",
            "Contacts with similar rash, vaccination status, recent medications, travel, atopy history, mucous membrane involvement?"] },
    { label:"Failure to Thrive / Developmental Delay", system:"Peds",
      chips:[
        {q:"Concern", type:"single", options:["poor weight gain", "poor height growth", "delayed milestones", "weight and development"], fmt:"{v}"},
        {q:"Concern for", type:"duration", units:["weeks", "months", "years"], fmt:"for {v}"},
        {q:"Delayed in", type:"multi", options:["sitting", "walking", "speech", "social interaction", "fine motor skills", "toilet training", "response to sound"], fmt:"delayed: {v}"},
        {q:"Feeding", type:"multi", options:["feeding well", "poor appetite", "fussy eater", "vomiting after feeds", "breastfed", "formula fed"], fmt:"{v}"},
        {q:"Skills", type:"single", options:["no loss of skills", "lost skills previously gained"], fmt:"{v}"},
        {q:"Associated", type:"ternary", options:["chronic diarrhoea", "recurrent infections", "vomiting", "cough or breathlessness", "abnormal stools", "hearing problems", "abnormal movements", "concerns at nursery or school"]},
        {q:"Risk factors", type:"ternary", options:["prematurity", "low birth weight", "maternal illness in pregnancy", "family history of delay", "feeding difficulties", "neonatal complications", "food insecurity", "chronic illness"]}
      ],
      hopi:["Age, birth weight/centile, current weight/height centile, crossing centile lines downward?",
            "Feeding difficulties (intake, vomiting, diarrhoea), malabsorption symptoms, chronic disease, recurrent infections?",
            "Developmental milestones (gross motor, fine motor, language, social), parental concern, socioeconomic factors, family history?"] },

    // ── VASCULAR (new system) ───────────────────────────
    { label:"Acute Limb Ischaemia", system:"Vasc",
      redFlags:["Pain, pallor, pulselessness, paraesthesia, paralysis and perishing cold (the 6 Ps)", "Onset within hours", "Motor weakness or loss of sensation", "Known atrial fibrillation or recent myocardial infarction", "Mottled or cold limb"],
      chips:[
        {q:"Limb", type:"single", options:["right leg", "left leg", "right arm", "left arm"], fmt:"{v}"},
        {q:"Onset", type:"single", options:["sudden", "over hours"], fmt:"{v} onset"},
        {q:"Symptoms for", type:"duration", units:["minutes", "hours", "days"], fmt:"for {v}"},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"pain {v}/10"},
        {q:"The 6 Ps", type:"ternary", options:["pain", "pallor", "pulselessness", "paraesthesia", "paralysis", "perishingly cold"]},
        {q:"Associated", type:"ternary", options:["palpitations", "recent chest pain", "previous claudication", "recent vascular procedure", "recent injury", "back pain"]},
        {q:"Risk factors", type:"ternary", options:["atrial fibrillation", "previous MI", "smoking", "diabetes", "peripheral vascular disease", "recent surgery or catheterisation", "hypercoagulable state", "aortic aneurysm"]}
      ],
      hopi:["Onset (sudden = embolus vs gradual = thrombosis on chronic occlusion), limb affected, time of onset?",
            "6 Ps: Pain, Pallor, Pulselessness, Paraesthesia, Paralysis, Perishing cold — which features present?",
            "Red flags: Paralysis and anaesthesia = irreversible ischaemia approaching — immediate vascular surgical emergency?"] },
    { label:"Varicose Veins / Venous Insufficiency", system:"Vasc",
      chips:[
        {q:"Site", type:"multi", options:["right leg", "left leg", "both legs", "thigh", "calf", "ankle"], fmt:"site: {v}"},
        {q:"Veins noticed for", type:"duration", units:["months", "years"], fmt:"for {v}"},
        {q:"Symptoms", type:"multi", options:["aching or heaviness", "swelling", "itching", "night cramps", "restless legs", "visible bulging veins", "pain on standing"], fmt:"{v}"},
        {q:"Triggers and relief", type:"multi", options:["worse on standing", "worse by evening", "worse in heat", "better with leg elevation", "better with compression stockings"]},
        {q:"Complications", type:"ternary", options:["skin discolouration", "eczema", "ulcer", "bleeding from a vein", "superficial thrombophlebitis", "hardened skin"]},
        {q:"Risk factors", type:"ternary", options:["family history", "pregnancy", "obesity", "prolonged standing", "previous DVT", "previous leg injury", "age over 50", "hormonal treatment"]}
      ],
      hopi:["Duration, distribution (GSV/SSV territory), symptoms (aching, heaviness, itching, cramps, worse at end of day)?",
            "Skin changes (lipodermatosclerosis, eczema, haemosiderin pigmentation, healed/active ulcer above medial malleolus)?",
            "Previous DVT, pregnancy (parity), occupation (prolonged standing), family history, previous treatment (sclerotherapy)?"] },

    // ── ONCOLOGY / GENERAL (new system) ─────────────────
    { label:"B-Symptoms (Constitutional)", system:"Onco",
      chips:[
        {q:"Symptoms for", type:"duration", units:["weeks", "months"], fmt:"for {v}"},
        {q:"Weight loss", type:"single", options:["under 5 kg", "5 to 10 kg", "over 10 kg"], fmt:"weight loss {v}"},
        {q:"Fever", type:"single", options:["low-grade", "high", "intermittent", "cyclical"], fmt:"{v} fever"},
        {q:"Night sweats", type:"single", options:["mild", "moderate", "drenching"], fmt:"{v} night sweats"},
        {q:"Associated", type:"ternary", options:["lumps in the neck, armpit or groin", "itching", "fatigue", "pain in lymph nodes after alcohol", "cough or breathlessness", "abdominal pain", "bone pain", "loss of appetite"]},
        {q:"Risk factors", type:"ternary", options:["previous lymphoma", "HIV or EBV", "autoimmune disease", "family history of lymphoma", "immunosuppression", "smoking", "previous radiotherapy or chemotherapy", "TB contact"]}
      ],
      hopi:["Fever (>38°C, drenching night sweats soaking clothes/sheets, unintentional weight loss >10% in 6 months)?",
            "Lymphadenopathy (site, size, duration, painless vs tender), splenomegaly symptoms (left upper quadrant fullness)?",
            "Fatigue severity, pruritus (generalised, without rash = lymphoma), alcohol-induced lymph node pain (Hodgkin's)?"] },
    { label:"Bone Pain / Pathological Fracture Risk", system:"Onco",
      chips:[
        {q:"Site", type:"multi", options:["spine", "pelvis", "ribs", "long bones", "shoulder", "skull", "multiple sites"], fmt:"site: {v}"},
        {q:"Onset", type:"single", options:["sudden after minimal trauma", "gradual", "after a fall"], fmt:"{v}"},
        {q:"Pain for", type:"duration", units:["days", "weeks", "months"], fmt:"for {v}"},
        {q:"Character", type:"multi", options:["deep ache", "worse at night", "worse on weight bearing", "constant", "sharp"]},
        {q:"Severity", type:"scale", min:0, max:10, fmt:"severity {v}/10"},
        {q:"Associated", type:"ternary", options:["weight loss", "fatigue", "fever", "back pain with leg weakness", "bladder or bowel change", "thirst, constipation or confusion", "known fracture", "lump"]},
        {q:"Risk factors", type:"ternary", options:["known cancer (breast, prostate, lung)", "myeloma", "steroid use", "osteoporosis", "previous radiotherapy", "smoking", "hormone therapy for cancer", "Paget disease"]}
      ],
      hopi:["Site, character (constant/worse at night/deep boring = metastatic vs mechanical = degenerative), onset?",
            "Fracture after minor trauma (pathological), vertebral collapse symptoms (back pain, height loss, kyphosis)?",
            "Known malignancy (breast, prostate, lung, renal, thyroid most common to bone mets), PSA, calcium level?"] },
  ],

  rosSymptoms: [
    "Chest pain","Palpitations","Dyspnoea (exertion)","Orthopnoea","PND","Claudication",
    "Cough","Wheeze","Haemoptysis","Pleuritic pain","Stridor",
    "Nausea","Vomiting","Dysphagia","Heartburn/GORD","PR bleeding","Melaena","Diarrhoea","Constipation","Abdominal distension",
    "Dysuria","Frequency","Haematuria","Polyuria","Nocturia","Urinary incontinence","Loin pain",
    "Headache","Dizziness","Visual changes","Diplopia","Hearing loss","Tinnitus","Facial weakness","Limb weakness","Sensory loss","Tremor","Confusion","Seizures",
    "Arthralgia","Myalgia","Back pain","Neck stiffness","Morning stiffness",
    "Rash","Pruritus","Skin lesion","Hair loss","Nail changes",
    "Fatigue","Weight loss","Weight gain","Fever","Night sweats","Lymphadenopathy","Bruising",
    "Polydipsia","Heat intolerance","Cold intolerance","Anxiety","Low mood","Sleep disturbance","Suicidal ideation"
  ],

  comorbidities: [
    "Hypertension (HTN)", "Type 2 Diabetes Mellitus (T2DM)", "Type 1 Diabetes Mellitus (T1DM)", "Ischaemic Heart Disease (IHD)", "Heart Failure (CCF)", "Atrial Fibrillation (AF)", "Asthma", "Chronic Obstructive Pulmonary Disease (COPD)", "Chronic Kidney Disease (CKD)", "Cerebrovascular Accident (Stroke/TIA)", "Dyslipidaemia", "Hypothyroidism", "Hyperthyroidism", "Rheumatoid Arthritis (RA)", "Osteoarthritis (OA)", "Osteoporosis", "Obesity", "Depression", "Anxiety", "Chronic Liver Disease (CLD)"
  ],

  fhConditions: [
    "Hypertension","Diabetes mellitus","Ischaemic heart disease","Stroke/TIA","Hyperlipidaemia","Atrial fibrillation","Sudden cardiac death (age <50)",
    "Breast cancer","Colorectal cancer","Lung cancer","Prostate cancer","Ovarian cancer","Gastric cancer",
    "TB","Asthma","COPD","CKD","Epilepsy","Schizophrenia","Depression","Bipolar disorder","Alzheimer's disease",
    "Rheumatoid arthritis","SLE","Ankylosing spondylitis","Psoriasis","IBD","Coeliac disease","Thyroid disease",
    "Clotting disorders (thrombophilia)","Haemophilia","Sickle cell disease","Marfan syndrome","Huntington's disease"
  ],

  examinations: [
    { system:"Cardiovascular (CVS)", fields:[
      {label:"Pulse character",type:"select",options:["Regular","Irregularly irregular","Regularly irregular","Slow-rising","Collapsing","Pulsus paradoxus","Bounding"]},
      {label:"JVP",type:"select",options:["Not elevated","Elevated — cm above sternal angle","Absent","Prominent 'a' wave","Prominent 'v' wave","Kussmaul's sign"]},
      {label:"Apex beat (site & character)",type:"text",placeholder:"e.g. 5th ICS MCL, non-displaced, thrusting"},
      {label:"Heart sounds (S1, S2)",type:"select",options:["Normal S1 S2, no murmurs","S3 (gallop)","S4","S3 + S4","Muffled","Variable intensity"]},
      {label:"Murmurs",type:"text",placeholder:"e.g. Pan-systolic grade 3/6 at apex -> axilla"},
      {label:"Peripheral pulses",type:"text",placeholder:"e.g. All present and equal bilaterally"},
      {label:"Peripheral oedema",type:"text",placeholder:"e.g. Pitting oedema +++ bilateral to mid-shin"},
      {label:"CVS additional findings",type:"textarea",placeholder:"Chest scars, pacemaker, further findings..."}
    ]},
    { system:"Respiratory", fields:[
      {label:"Trachea",type:"select",options:["Central","Deviated to left","Deviated to right"]},
      {label:"Chest expansion",type:"select",options:["Equal bilaterally","Reduced right","Reduced left","Globally reduced"]},
      {label:"Percussion",type:"text",placeholder:"e.g. Dull right base; Hyper-resonant left upper zone"},
      {label:"Breath sounds",type:"text",placeholder:"e.g. Vesicular throughout; Bronchial right base"},
      {label:"Added sounds",type:"text",placeholder:"e.g. Fine bibasal crackles; Expiratory wheeze; Pleural rub"},
      {label:"Vocal resonance / tactile fremitus",type:"text",placeholder:"e.g. Increased right base; Decreased left lower zone"},
      {label:"Resp additional findings",type:"textarea",placeholder:"Accessory muscles, intercostal recession, nasal flaring..."}
    ]},
    { system:"Abdominal (GI)", fields:[
      {label:"Inspection",type:"text",placeholder:"e.g. Distended; visible peristalsis; surgical scars"},
      {label:"Bowel sounds",type:"select",options:["Normal","Hyperactive","Hypoactive","Absent","Tinkling"]},
      {label:"Tenderness",type:"text",placeholder:"e.g. Tenderness RIF; guarding RLQ; rebound positive"},
      {label:"Rigidity / guarding",type:"select",options:["Absent","Voluntary guarding","Involuntary guarding","Board-like rigidity"]},
      {label:"Organomegaly",type:"text",placeholder:"e.g. Hepatomegaly 3cm below costal margin"},
      {label:"Murphy's sign",type:"select",options:["Not tested","Negative","Positive"]},
      {label:"Shifting dullness / fluid thrill",type:"select",options:["Not tested","Absent","Present (shifting dullness)","Present (fluid thrill)"]},
      {label:"PR / Rectal exam",type:"text",placeholder:"e.g. Not performed / Normal tone, no masses"},
      {label:"GI additional findings",type:"textarea",placeholder:"Hernias, inguinal nodes, scrotal exam..."}
    ]},
    { system:"Neurological", fields:[
      {label:"Higher functions (orientation, speech)",type:"text",placeholder:"e.g. Alert, oriented x3; fluent speech, no dysphasia"},
      {label:"Cranial nerves (I–XII)",type:"textarea",placeholder:"CN II: PERLA; CN III/IV/VI: full EOM; CN V intact; CN VII no palsy; CN VIII intact; CN XII midline"},
      {label:"Motor (tone, power, coordination)",type:"textarea",placeholder:"Normal tone; power 5/5 all limbs MRC; no pronator drift; FNF intact"},
      {label:"Reflexes (DTRs)",type:"text",placeholder:"e.g. Biceps ++, triceps ++, knee ++, ankle ++, plantars ↓"},
      {label:"Sensory (LT, PP, vibration, proprioception)",type:"textarea",placeholder:"Intact LT and pinprick all dermatomes; vibration reduced at ankles"},
      {label:"Gait & cerebellar (Romberg, tandem, dysdiadochokinesia)",type:"text",placeholder:"e.g. Normal gait; Romberg negative; no truncal ataxia"},
      {label:"Median nerve (Tinel's / Phalen's / carpal tunnel)",type:"text",placeholder:"e.g. Tinel's negative at wrist; Phalen's negative; thenar bulk intact"},
      {label:"Neuro additional findings",type:"textarea",placeholder:"Neck stiffness, Kernig's, Brudzinski, fundoscopy..."}
    ]},
    { system:"MSK — Knee", fields:[
      {label:"Inspection (alignment, swelling, wasting)",type:"text",placeholder:"e.g. Valgus alignment; effusion; quadriceps wasting"},
      {label:"Effusion (bulge/ballottement)",type:"select",options:["Absent","Positive bulge sign","Positive ballottement","Moderate","Large"]},
      {label:"ROM (flexion/extension)",type:"text",placeholder:"e.g. Flexion 0–100°; Extension 0°; painful 80–100°"},
      {label:"Anterior drawer (ACL — 90° flexion)",type:"select",options:["Not tested","Negative","Positive grade I","Positive grade II","Positive grade III"]},
      {label:"Lachman test (ACL — 20–30° flexion)",type:"select",options:["Not tested","Negative","Positive soft endpoint","Positive firm endpoint"]},
      {label:"Posterior drawer (PCL)",type:"select",options:["Not tested","Negative","Positive"]},
      {label:"McMurray (menisci)",type:"select",options:["Not tested","Negative","Positive medial click","Positive lateral click"]},
      {label:"Valgus/Varus stress (MCL/LCL)",type:"text",placeholder:"e.g. Both negative at 0° and 30°"},
      {label:"Knee additional findings",type:"textarea",placeholder:"Patellar tracking, grind test, pes anserine tenderness..."}
    ]},
    { system:"MSK — Ankle & Foot", fields:[
      {label:"Inspection (swelling, bruising, deformity)",type:"text",placeholder:"e.g. Lateral ankle swelling; bruising over ATFL"},
      {label:"Tenderness (anatomical)",type:"text",placeholder:"e.g. ATFL tender; Ottawa rules positive/negative"},
      {label:"ROM (plantar/dorsiflexion, inversion/eversion)",type:"text",placeholder:"e.g. Dorsiflexion 15°; Plantarflexion 45°; inversion limited"},
      {label:"Anterior drawer (ATFL — ankle at 20° plantarflexion)",type:"select",options:["Not tested","Negative","Positive (>5mm translation vs contralateral)","Positive soft endpoint"]},
      {label:"Talar tilt test (CFL)",type:"select",options:["Not tested","Negative","Positive (>5° vs contralateral)"]},
      {label:"Thompson test (Achilles rupture)",type:"select",options:["Not tested","Negative (plantarflexion intact)","Positive (no plantarflexion — Achilles rupture)"]},
      {label:"Ottawa ankle/foot rules",type:"select",options:["Not applied","Negative — imaging not indicated","Positive ankle — X-ray required","Positive foot — X-ray required"]},
      {label:"Ankle additional findings",type:"textarea",placeholder:"Neurovascular status distally, 5th metatarsal base..."}
    ]},
    { system:"MSK — Shoulder", fields:[
      {label:"Inspection (symmetry, wasting)",type:"text",placeholder:"e.g. Supraspinatus/infraspinatus wasting; no deformity"},
      {label:"Active ROM",type:"text",placeholder:"e.g. Painful arc 60–120°; full flexion; limited ER"},
      {label:"Neer (supraspinatus impingement)",type:"select",options:["Not tested","Negative","Positive"]},
      {label:"Hawkins-Kennedy (impingement)",type:"select",options:["Not tested","Negative","Positive"]},
      {label:"Empty Can (supraspinatus tear)",type:"select",options:["Not tested","Negative","Positive — weakness/pain"]},
      {label:"Apprehension test (anterior instability)",type:"select",options:["Not tested","Negative","Positive (apprehension with ER in 90° abduction)"]},
      {label:"Speed's / Yergason's (biceps tendon)",type:"text",placeholder:"e.g. Speed's negative; Yergason's negative"},
      {label:"Shoulder additional findings",type:"textarea",placeholder:"AC joint, sternoclavicular, axillary nerve, strength..."}
    ]},
    { system:"MSK — Spine (Lumbar)", fields:[
      {label:"Inspection (posture, scoliosis)",type:"text",placeholder:"e.g. Reduced lumbar lordosis; no scoliosis"},
      {label:"ROM",type:"text",placeholder:"e.g. Flexion 70° (pain at 50°); Extension 15°"},
      {label:"SLR / Lasègue (L4–S1)",type:"text",placeholder:"e.g. Positive right at 45° — L5/S1 radiation to foot"},
      {label:"Femoral nerve stretch (L2–L4)",type:"select",options:["Not tested","Negative","Positive (anterior thigh pain)"]},
      {label:"Neurological lower limbs",type:"textarea",placeholder:"Power L1–S1; reflexes (knee L3/4, ankle S1); dermatomal sensation"},
      {label:"Schober's test",type:"text",placeholder:"e.g. 4cm increase (normal >5cm)"},
      {label:"Red flags screen",type:"text",placeholder:"e.g. No saddle anaesthesia; bladder/bowel intact; no bilateral neurology"},
      {label:"Spine additional findings",type:"textarea",placeholder:"Paravertebral spasm, sacroiliac tenderness, facet loading..."}
    ]},
    { system:"Thyroid & Neck", fields:[
      {label:"Thyroid size & consistency",type:"text",placeholder:"e.g. Diffusely enlarged; smooth; rubbery; non-tender"},
      {label:"Goitre grade",type:"select",options:["Not palpable","Grade 1 (palpable only)","Grade 2 (visible on extension)","Grade 3 (visible at rest)"]},
      {label:"Nodules",type:"text",placeholder:"e.g. Single nodule right lobe 2cm; firm; mobile"},
      {label:"Pemberton's sign",type:"select",options:["Not tested","Negative","Positive"]},
      {label:"Thyroid bruit",type:"select",options:["Absent","Present"]},
      {label:"Signs of thyroid status",type:"textarea",placeholder:"Lid lag, exophthalmos, tremor, onycholysis, pretibial myxoedema, slow DTRs..."},
      {label:"Cervical lymph nodes",type:"text",placeholder:"e.g. No lymphadenopathy / Jugular chain 1cm mobile"}
    ]},
    { system:"Breast", fields:[
      {label:"Inspection (symmetry, skin)",type:"text",placeholder:"e.g. Bilateral symmetrical; no peau d'orange; no nipple retraction"},
      {label:"Mass characteristics",type:"text",placeholder:"e.g. 2cm UOQ right; hard; irregular; non-tender; fixed"},
      {label:"Nipple examination",type:"text",placeholder:"e.g. Normal; no retraction; no discharge"},
      {label:"Skin tethering / deep fixity",type:"select",options:["Not tested","Absent","Skin tethering","Fixed to deep fascia"]},
      {label:"Axillary/cervical/supraclavicular nodes",type:"text",placeholder:"e.g. No lymphadenopathy / right axilla 2 nodes 1cm firm mobile"},
      {label:"Breast additional findings",type:"textarea",placeholder:"Arm swelling, chest wall signs..."}
    ]},
    { system:"Psychiatric / MSE", fields:[
      {label:"Appearance & behaviour",type:"text",placeholder:"e.g. Poorly kempt; limited eye contact; psychomotor retardation"},
      {label:"Speech (rate, volume, flow)",type:"text",placeholder:"e.g. Slow; low volume; poverty of speech / Pressured; flight of ideas"},
      {label:"Mood (subjective) & Affect (objective)",type:"text",placeholder:"e.g. Mood 'very low' / Affect: blunted, incongruent"},
      {label:"Thought form & content",type:"text",placeholder:"e.g. Linear; no loosening / Ruminations; passive SI; no delusions"},
      {label:"Perception (hallucinations)",type:"text",placeholder:"e.g. Denies Hx / AH 3rd person commanding; VH present"},
      {label:"Cognition (orientation, memory, MMSE)",type:"text",placeholder:"e.g. Oriented x3; MMSE 27/30; digit span 5 forward"},
      {label:"Insight & judgement",type:"text",placeholder:"e.g. Partial insight; understands illness but refuses medication"},
      {label:"Risk assessment",type:"textarea",placeholder:"SI (plan, intent, access); self-harm; harm to others; protective factors..."}
    ]},
    { system:"Ophthalmological", fields:[
      {label:"Visual acuity (corrected)",type:"text",placeholder:"e.g. VA: R 6/6, L 6/9 with glasses"},
      {label:"Visual fields (confrontation)",type:"text",placeholder:"e.g. Full bilaterally / Right homonymous hemianopia"},
      {label:"Pupils (PERLA, RAPD)",type:"text",placeholder:"e.g. PERLA 4mm; no RAPD; brisk consensual"},
      {label:"Fundoscopy",type:"textarea",placeholder:"e.g. Discs sharp; C:D 0.3; no haemorrhages / Background DR right"},
      {label:"Anterior segment / slit-lamp",type:"text",placeholder:"e.g. Clear cornea; deep AC; clear lens / Cataract right"},
      {label:"Ophthalmic additional",type:"textarea",placeholder:"IOP, proptosis, lid, ocular motility..."}
    ]},
    { system:"ENT Examination", fields:[
      {label:"Otoscopy (bilateral TMs)",type:"text",placeholder:"e.g. TMs intact bilaterally; cone of light present"},
      {label:"Hearing (Rinne & Weber)",type:"text",placeholder:"e.g. Rinne positive bilaterally; Weber central"},
      {label:"Nasal examination",type:"text",placeholder:"e.g. Deviated septum; turbinate hypertrophy bilateral"},
      {label:"Throat & oropharynx",type:"text",placeholder:"e.g. Tonsils grade II; injected; no exudate"},
      {label:"Neck (lymph nodes)",type:"text",placeholder:"e.g. Bilateral anterior cervical lymphadenopathy"},
      {label:"ENT additional",type:"textarea",placeholder:"Voice, sinus tenderness, facial nerve, parotid..."}
    ]},
  ],

  investigations: {
    "Bedside (BLIs)": ["Blood Glucose (CBG)","ECG (12-lead)","Urinalysis (dipstick)","PEFR","ABG","Capillary ketones","Urine pregnancy test","Urine MC&S","Sputum AFB","Stool microscopy","Point-of-care troponin","Bladder scan (USS)"],
    "Haematology": ["Full Blood Count (FBC)","ESR","Peripheral blood film","Reticulocyte count","Coagulation screen (PT, APTT, INR)","D-Dimer","Blood group & cross-match","Haemoglobin electrophoresis","Bone marrow aspirate & trephine","Coombs test (DAT)"],
    "Biochemistry": ["U&E (urea & electrolytes)","LFTs","Bone profile (Ca, PO4, ALP)","TFTs","HbA1c","Random blood glucose","Fasting lipids","CRP","Procalcitonin","Serum amylase / lipase","Lactate (serum)","Troponin I/T (serial)","BNP / NT-proBNP","PSA","Iron / TIBC / ferritin","Vitamin B12 & Folate","Vitamin D (25-OH)","Urine protein:creatinine ratio","24h urine protein","Serum cortisol (9am)","ACTH","Urine osmolality","Serum osmolality","Ammonia"],
    "Microbiology": ["Blood cultures (x2 peripherals)","MSU MC&S","Sputum AFB (x3)","Sputum culture","Wound swab culture","Throat swab","Stool culture / O&P","Hepatitis B sAg","Hepatitis C antibody","HIV 4th gen Ag/Ab","Malaria RDT / thick & thin film","COVID-19 PCR","CMV / EBV serology","Lyme serology","H. pylori stool antigen / CLO test"],
    "Immunology / Serology": ["ANA","Anti-dsDNA","ANCA (p/c)","Complement (C3, C4)","Rheumatoid factor","Anti-CCP","Anti-TTG (coeliac)","Immunoglobulins (IgG, IgA, IgM)","Serum protein electrophoresis","Anti-GBM","Anti-phospholipid antibodies (APLA panel)","Cryoglobulins"],
    "Imaging": ["CXR","AXR","Lateral cervical spine X-ray","CT Head ± contrast","CT Chest (HRCT)","CTAP","CTPA","CT Aorta","MRI Brain ± gadolinium","MRI Spine","MRI Knee/Shoulder/Ankle","USS Abdomen","USS Pelvis","USS Renal tract","Echocardiogram (TTE/TOE)","Doppler USS (DVT)","Mammogram","DEXA scan","V/Q scan","PET-CT","Bone scan","USS thyroid","CT KUB (renal stones)"],
    "Cardiac": ["24h Holter monitor","48h/72h Holter","ETT (exercise tolerance test)","Coronary angiography","Cardiac MRI","Tilt table test","Signal-averaged ECG"],
    "Respiratory": ["Spirometry (FEV1/FVC)","Reversibility (post-bronchodilator)","DLCO","BAL","CT-guided lung biopsy","Mantoux / TST","IGRA (Quantiferon TB Gold)","Sleep study (polysomnography)"],
    "Endoscopy": ["OGD (upper GI endoscopy)","Colonoscopy","Flexible sigmoidoscopy","ERCP","Capsule endoscopy","Bronchoscopy","Cystoscopy","Hysteroscopy"],
    "Histopathology / Biopsy": ["Skin punch biopsy","Lymph node biopsy","Liver biopsy","Renal biopsy","Bone marrow biopsy","Prostate biopsy","Breast core biopsy","Thyroid FNA","Pleural biopsy","Endometrial biopsy","Colonic biopsy"],
    "Neurology": ["EEG","NCS (nerve conduction studies)","EMG","Lumbar puncture (CSF analysis)","VEP (visual evoked potentials)","BAER","SSEP","Neuropsychological testing"]
  },

  treatments: {
    "Medical": [
      "IV access + fluid resuscitation (0.9% NaCl / Hartmann's)","O2 therapy (target SpO2 94–98%)",
      "Paracetamol 1g QDS PO","Ibuprofen 400mg TDS PO + PPI","Morphine 2.5–5mg IV PRN (titrate)",
      "Amoxicillin 500mg TDS PO","Co-amoxiclav 625mg TDS PO","Metronidazole 400mg TDS PO",
      "Ceftriaxone 1g OD IV","Piperacillin-tazobactam 4.5g TDS IV","Meropenem 1g TDS IV",
      "Amlodipine 5mg OD","Ramipril 2.5mg OD","Bisoprolol 2.5mg OD","Atorvastatin 40mg ON",
      "Metformin 500mg BD (titrate)","Insulin (basal-bolus regimen)",
      "Enoxaparin 1mg/kg BD SC","Apixaban 10mg BD x7d → 5mg BD","Warfarin (INR target 2–3)",
      "Aspirin 75mg OD","Clopidogrel 75mg OD","Ticagrelor 90mg BD",
      "Salbutamol 2.5mg nebuliser PRN","Prednisolone 40mg OD PO","Hydrocortisone 100mg QDS IV",
      "Ondansetron 4mg TDS","Metoclopramide 10mg TDS","Omeprazole 20mg OD",
      "Furosemide 40mg OD","Spironolactone 25mg OD","Levetiracetam 500mg BD",
      "Sertraline 50mg OD","Olanzapine 5mg ON","Haloperidol 0.5–2mg PRN (delirium)",
      "NGT insertion + enteral feeding","Urinary catheterisation","Central venous access"
    ],
    "Surgical": [
      "Appendicectomy (laparoscopic)","Cholecystectomy (laparoscopic)","Hernia repair (lap/open)",
      "Exploratory laparotomy","Bowel resection + anastomosis","Colostomy / ileostomy",
      "ORIF (fracture fixation)","TKR / THR (joint replacement)","Arthroscopy + debridement",
      "Splenectomy","Thyroidectomy (total/hemi)","Mastectomy (simple/modified radical)","LLETZ / cone biopsy",
      "TURP","Nephrectomy (laparoscopic)","Craniotomy","Chest drain insertion","Pleural aspiration",
      "Joint aspiration","I&D of abscess","Skin excision / WLE","Endovascular stenting","CABG","Valve replacement"
    ],
    "Conservative": [
      "Rest & activity modification","RICE (Rest, Ice, Compression, Elevation)","Physiotherapy referral",
      "Occupational therapy referral","Dietician referral","Weight management advice",
      "Smoking cessation counselling","Alcohol cessation support","CBT (psychology referral)",
      "Compression stockings (class II)","Peak flow diary","Fluid restriction (cardiac failure)",
      "Low-salt diet","Diabetic education + self-monitoring","Pelvic floor exercises"
    ],
    "Monitoring / Nursing": [
      "NEWS2 4-hourly","Fluid balance chart","Daily weights","IV fluid monitoring",
      "BGL monitoring (pre-meal + bedtime)","Neurological obs (GCS hourly)","Pain score (NRS 0–10)",
      "DVT prophylaxis (TED + LMWH)","Pressure area care","Continuous telemetry","SpO2 monitoring","Urine output hourly"
    ],
    "Referral": [
      "Cardiology","Gastroenterology","Respirology","Neurology","Orthopaedic surgery","General surgery",
      "Oncology","Nephrology","Haematology","Endocrinology","Rheumatology","Psychiatry",
      "Palliative care","Social work","Physiotherapy","Occupational therapy","Dietetics","Ophthalmology","ENT"
    ]
  },
  // ── DRUG SAFETY TABLES (advisory only; used for allergy warnings and cautions) ──────────
  // drugClasses: one entry per item in treatments.Medical. cls = drug class, keywords = names to look for in the
  // allergy text. null = not a medicine. cautionExempt = conditions that do NOT apply to this item (low-dose aspirin).
  drugClasses: {
    "IV access + fluid resuscitation (0.9% NaCl / Hartmann's)": null,
    "O2 therapy (target SpO2 94–98%)": null,
    "Paracetamol 1g QDS PO": {
      "cls": "paracetamol",
      "keywords": [
        "paracetamol",
        "acetaminophen",
        "panadol",
        "tylenol",
        "calpol"
      ]
    },
    "Ibuprofen 400mg TDS PO + PPI": {
      "cls": "nsaid",
      "keywords": [
        "ibuprofen",
        "brufen",
        "nurofen"
      ]
    },
    "Morphine 2.5–5mg IV PRN (titrate)": {
      "cls": "opioid",
      "keywords": [
        "morphine",
        "diamorphine",
        "codeine",
        "tramadol",
        "oxycodone",
        "fentanyl",
        "pethidine"
      ]
    },
    "Amoxicillin 500mg TDS PO": {
      "cls": "penicillin",
      "keywords": [
        "amoxicillin",
        "amoxycillin",
        "ampicillin",
        "flucloxacillin",
        "benzylpenicillin",
        "phenoxymethylpenicillin",
        "augmentin"
      ]
    },
    "Co-amoxiclav 625mg TDS PO": {
      "cls": "penicillin",
      "keywords": [
        "co-amoxiclav",
        "coamoxiclav",
        "amoxicillin-clavulanate",
        "amoxicillin clavulanate",
        "augmentin"
      ]
    },
    "Metronidazole 400mg TDS PO": {
      "cls": "nitroimidazole",
      "keywords": [
        "metronidazole",
        "flagyl",
        "tinidazole"
      ]
    },
    "Ceftriaxone 1g OD IV": {
      "cls": "cephalosporin",
      "keywords": [
        "ceftriaxone",
        "cefuroxime",
        "cefalexin",
        "cephalexin",
        "cefotaxime",
        "ceftazidime",
        "cefixime",
        "cefazolin",
        "cefepime",
        "rocephin"
      ]
    },
    "Piperacillin-tazobactam 4.5g TDS IV": {
      "cls": "penicillin",
      "keywords": [
        "piperacillin",
        "tazobactam",
        "tazocin",
        "pip-taz",
        "piptaz"
      ]
    },
    "Meropenem 1g TDS IV": {
      "cls": "carbapenem",
      "keywords": [
        "meropenem",
        "imipenem",
        "ertapenem"
      ]
    },
    "Amlodipine 5mg OD": {
      "cls": "calcium channel blocker",
      "keywords": [
        "amlodipine",
        "nifedipine",
        "felodipine",
        "diltiazem",
        "verapamil"
      ]
    },
    "Ramipril 2.5mg OD": {
      "cls": "ace inhibitor",
      "keywords": [
        "ramipril",
        "lisinopril",
        "enalapril",
        "captopril",
        "perindopril",
        "ace inhibitor",
        "ace-inhibitor"
      ]
    },
    "Bisoprolol 2.5mg OD": {
      "cls": "beta-blocker",
      "keywords": [
        "bisoprolol",
        "atenolol",
        "metoprolol",
        "propranolol",
        "carvedilol",
        "nebivolol",
        "beta blocker",
        "beta-blocker"
      ]
    },
    "Atorvastatin 40mg ON": {
      "cls": "statin",
      "keywords": [
        "atorvastatin",
        "simvastatin",
        "rosuvastatin",
        "pravastatin"
      ]
    },
    "Metformin 500mg BD (titrate)": {
      "cls": "biguanide",
      "keywords": [
        "metformin",
        "glucophage"
      ]
    },
    "Insulin (basal-bolus regimen)": {
      "cls": "insulin",
      "keywords": [
        "insulin"
      ]
    },
    "Enoxaparin 1mg/kg BD SC": {
      "cls": "heparin",
      "keywords": [
        "enoxaparin",
        "clexane",
        "dalteparin",
        "heparin",
        "lmwh",
        "tinzaparin"
      ]
    },
    "Apixaban 10mg BD x7d → 5mg BD": {
      "cls": "doac",
      "keywords": [
        "apixaban",
        "eliquis",
        "rivaroxaban",
        "xarelto",
        "dabigatran",
        "edoxaban",
        "doac",
        "noac"
      ]
    },
    "Warfarin (INR target 2–3)": {
      "cls": "coumarin",
      "keywords": [
        "warfarin",
        "coumadin",
        "marevan"
      ]
    },
    "Aspirin 75mg OD": {
      "cls": "nsaid",
      "keywords": [
        "aspirin",
        "acetylsalicylic",
        "disprin"
      ],
      "cautionExempt": [
        "ckd",
        "heart_failure"
      ]
    },
    "Clopidogrel 75mg OD": {
      "cls": "thienopyridine",
      "keywords": [
        "clopidogrel",
        "plavix",
        "prasugrel"
      ]
    },
    "Ticagrelor 90mg BD": {
      "cls": "ticagrelor",
      "keywords": [
        "ticagrelor",
        "brilique",
        "brilinta"
      ]
    },
    "Salbutamol 2.5mg nebuliser PRN": {
      "cls": "beta-agonist",
      "keywords": [
        "salbutamol",
        "albuterol",
        "ventolin"
      ]
    },
    "Prednisolone 40mg OD PO": {
      "cls": "corticosteroid",
      "keywords": [
        "prednisolone",
        "prednisone",
        "dexamethasone",
        "methylprednisolone",
        "steroid",
        "steroids"
      ]
    },
    "Hydrocortisone 100mg QDS IV": {
      "cls": "corticosteroid",
      "keywords": [
        "hydrocortisone",
        "cortisone",
        "steroid",
        "steroids"
      ]
    },
    "Ondansetron 4mg TDS": {
      "cls": "5-ht3 antagonist",
      "keywords": [
        "ondansetron",
        "granisetron",
        "zofran"
      ]
    },
    "Metoclopramide 10mg TDS": {
      "cls": "dopamine antagonist antiemetic",
      "keywords": [
        "metoclopramide",
        "maxolon",
        "domperidone"
      ]
    },
    "Omeprazole 20mg OD": {
      "cls": "ppi",
      "keywords": [
        "omeprazole",
        "lansoprazole",
        "pantoprazole",
        "esomeprazole",
        "ppi"
      ]
    },
    "Furosemide 40mg OD": {
      "cls": "loop diuretic",
      "keywords": [
        "furosemide",
        "frusemide",
        "lasix",
        "bumetanide"
      ]
    },
    "Spironolactone 25mg OD": {
      "cls": "potassium-sparing diuretic",
      "keywords": [
        "spironolactone",
        "eplerenone",
        "aldactone"
      ]
    },
    "Levetiracetam 500mg BD": {
      "cls": "levetiracetam",
      "keywords": [
        "levetiracetam",
        "keppra"
      ]
    },
    "Sertraline 50mg OD": {
      "cls": "ssri",
      "keywords": [
        "sertraline",
        "fluoxetine",
        "citalopram",
        "escitalopram",
        "paroxetine",
        "ssri"
      ]
    },
    "Olanzapine 5mg ON": {
      "cls": "antipsychotic",
      "keywords": [
        "olanzapine",
        "risperidone",
        "quetiapine",
        "haloperidol",
        "antipsychotic"
      ]
    },
    "Haloperidol 0.5–2mg PRN (delirium)": {
      "cls": "antipsychotic",
      "keywords": [
        "haloperidol",
        "haldol",
        "antipsychotic"
      ]
    },
    "NGT insertion + enteral feeding": null,
    "Urinary catheterisation": null,
    "Central venous access": null
  },

  // classAliases: other words people write for a class (used to read the allergy text).
  classAliases: {
    "penicillin": [
      "penicillin",
      "penicillins",
      "penicilin",
      "pencillin",
      "penicillian",
      "beta lactam",
      "beta-lactam",
      "betalactam",
      "b-lactam"
    ],
    "cephalosporin": [
      "cephalosporin",
      "cephalosporins",
      "cefalosporin",
      "cephalosphorin"
    ],
    "carbapenem": [
      "carbapenem",
      "carbapenems"
    ],
    "nsaid": [
      "nsaid",
      "nsaids",
      "non-steroidal",
      "non steroidal",
      "anti-inflammatory",
      "anti inflammatory",
      "nsaids"
    ],
    "opioid": [
      "opioid",
      "opioids",
      "opiate",
      "opiates"
    ],
    "nitroimidazole": [
      "nitroimidazole"
    ],
    "ace inhibitor": [
      "ace inhibitor",
      "ace inhibitors",
      "acei",
      "ace-i"
    ],
    "beta-blocker": [
      "beta blocker",
      "beta blockers",
      "beta-blocker",
      "beta-blockers"
    ],
    "statin": [
      "statin",
      "statins"
    ],
    "heparin": [
      "heparin",
      "heparins",
      "lmwh"
    ],
    "doac": [
      "doac",
      "doacs",
      "noac"
    ],
    "corticosteroid": [
      "corticosteroid",
      "corticosteroids"
    ],
    "ppi": [
      "proton pump inhibitor",
      "proton-pump inhibitor",
      "ppi"
    ],
    "ssri": [
      "ssri",
      "ssris"
    ],
    "antipsychotic": [
      "antipsychotic",
      "antipsychotics",
      "neuroleptic"
    ],
    "loop diuretic": [
      "loop diuretic"
    ],
    "calcium channel blocker": [
      "calcium channel blocker",
      "ccb"
    ],
    "insulin": [
      "insulin"
    ],
    "paracetamol": [
      "paracetamol",
      "acetaminophen"
    ]
  },

  // crossReactive: pairs of classes where an allergy to one may also affect the other (symmetrical).
  crossReactive: [
    {
      "a": "penicillin",
      "b": "cephalosporin",
      "note": "cross-reactivity is uncommon (about 1-2%), and higher with first-generation cephalosporins that share a similar side chain"
    },
    {
      "a": "penicillin",
      "b": "carbapenem",
      "note": "cross-reactivity is low (under 1%) but not zero"
    },
    {
      "a": "cephalosporin",
      "b": "carbapenem",
      "note": "cross-reactivity is low"
    }
  ],

  // conditionAliases: words that identify a condition or medicine in comorbidities, past history and drug history.
  conditionAliases: {
    "ckd": [
      "chronic kidney disease",
      "ckd",
      "renal impairment",
      "renal failure",
      "kidney disease",
      "kidney failure",
      "renal insufficiency",
      "low egfr",
      "reduced egfr",
      "dialysis"
    ],
    "peptic_ulcer": [
      "peptic ulcer",
      "gastric ulcer",
      "duodenal ulcer",
      "stomach ulcer",
      "pud",
      "upper gi bleed",
      "gi bleed",
      "gi bleeding",
      "gastrointestinal bleed",
      "gastrointestinal bleeding",
      "melaena",
      "melena"
    ],
    "heart_failure": [
      "heart failure",
      "ccf",
      "chf",
      "lvf",
      "cardiac failure",
      "congestive cardiac failure",
      "congestive heart failure",
      "hfref",
      "hfpef"
    ],
    "asthma": [
      "asthma",
      "asthmatic"
    ],
    "diabetes": [
      "diabetes",
      "diabetic",
      "t1dm",
      "t2dm",
      "niddm",
      "iddm"
    ],
    "bleeding_history": [
      "bleeding history",
      "history of bleeding",
      "bleeding disorder",
      "bleeding tendency",
      "haemophilia",
      "hemophilia",
      "von willebrand",
      "thrombocytopenia",
      "itp",
      "haemorrhage",
      "gi bleed",
      "gi bleeding",
      "gastrointestinal bleed",
      "intracranial haemorrhage",
      "intracranial hemorrhage",
      "haematemesis",
      "melaena",
      "melena"
    ],
    "anticoagulant": [
      "anticoagulant",
      "anticoagulation",
      "blood thinner",
      "warfarin",
      "coumadin",
      "apixaban",
      "rivaroxaban",
      "dabigatran",
      "edoxaban",
      "heparin",
      "enoxaparin",
      "clexane",
      "eliquis",
      "xarelto"
    ],
    "warfarin": [
      "warfarin",
      "coumadin",
      "marevan"
    ]
  },

  // cautions: when a plan item of one of these classes meets one of these conditions, show the note (wording: consider, never do not).
  cautions: [
    {
      "classes": [
        "nsaid"
      ],
      "conditions": [
        "ckd"
      ],
      "note": "NSAIDs can reduce kidney blood flow and worsen kidney function. Consider an alternative analgesic and check renal function."
    },
    {
      "classes": [
        "nsaid"
      ],
      "conditions": [
        "peptic_ulcer"
      ],
      "note": "NSAIDs raise the risk of ulceration and gastrointestinal bleeding. Consider an alternative, or gastroprotection if an NSAID is needed."
    },
    {
      "classes": [
        "nsaid"
      ],
      "conditions": [
        "heart_failure"
      ],
      "note": "NSAIDs cause salt and water retention and can worsen heart failure. Consider an alternative."
    },
    {
      "classes": [
        "nsaid"
      ],
      "conditions": [
        "anticoagulant"
      ],
      "note": "An NSAID with an anticoagulant raises bleeding risk. Consider an alternative analgesic."
    },
    {
      "classes": [
        "nsaid"
      ],
      "conditions": [
        "asthma"
      ],
      "note": "Some people with asthma react to NSAIDs with bronchospasm. Consider asking about past reactions."
    },
    {
      "classes": [
        "nsaid"
      ],
      "conditions": [
        "pregnancy"
      ],
      "note": "NSAIDs are generally avoided in pregnancy, especially from 20 weeks. Consider an alternative and check local guidance."
    },
    {
      "classes": [
        "biguanide"
      ],
      "conditions": [
        "ckd"
      ],
      "note": "Metformin builds up when kidney function is reduced (risk of lactic acidosis). Check eGFR; a lower dose or stopping may be needed."
    },
    {
      "classes": [
        "ace inhibitor"
      ],
      "conditions": [
        "ckd"
      ],
      "note": "ACE inhibitors can worsen kidney function and raise potassium. Consider checking urea, electrolytes and creatinine."
    },
    {
      "classes": [
        "ace inhibitor"
      ],
      "conditions": [
        "pregnancy"
      ],
      "note": "ACE inhibitors are generally avoided in pregnancy because of fetal harm. Consider an alternative and check local guidance."
    },
    {
      "classes": [
        "beta-blocker"
      ],
      "conditions": [
        "asthma"
      ],
      "note": "Beta-blockers can cause bronchospasm in asthma. Consider an alternative, or a cardioselective agent with caution."
    },
    {
      "classes": [
        "coumarin",
        "doac",
        "heparin"
      ],
      "conditions": [
        "bleeding_history"
      ],
      "note": "Anticoagulation raises bleeding risk. Consider the bleeding history and review the need and dose."
    },
    {
      "classes": [
        "coumarin",
        "doac"
      ],
      "conditions": [
        "pregnancy"
      ],
      "note": "Warfarin and DOACs are generally avoided in pregnancy. Consider heparin and check local guidance."
    },
    {
      "classes": [
        "heparin",
        "doac"
      ],
      "conditions": [
        "ckd"
      ],
      "note": "These drugs can accumulate when kidney function is reduced. Consider checking eGFR and adjusting the dose."
    },
    {
      "classes": [
        "nitroimidazole"
      ],
      "conditions": [
        "warfarin"
      ],
      "note": "Metronidazole increases the effect of warfarin (raised INR). Consider closer INR monitoring."
    },
    {
      "classes": [
        "corticosteroid"
      ],
      "conditions": [
        "diabetes"
      ],
      "note": "Corticosteroids raise blood glucose. Consider monitoring glucose and adjusting diabetes treatment."
    },
    {
      "classes": [
        "statin"
      ],
      "conditions": [
        "pregnancy"
      ],
      "note": "Statins are generally avoided in pregnancy. Consider stopping and check local guidance."
    }
  ]

};

const systemLabels = {
  CVS:'Cardiovascular', Resp:'Respiratory', GI:'Gastrointestinal',
  Neuro:'Neurological', GU:'Genitourinary', MSK:'Musculoskeletal',
  Endo:'Endocrine / Metabolic', Haem:'Haematological',
  Derm:'Dermatological', ENT:'ENT', Ophthalm:'Ophthalmology',
  Psych:'Psychiatric', Peds:'Paediatric', Vasc:'Vascular', Onco:'Oncology'
};
