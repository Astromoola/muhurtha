import { bandColors, planetColors, nakshatraRulers, signRulers, lunarMonthNakIndex } from "./colors.js";

const dateInput = document.querySelector("#dateInput");
const todayBtn = document.querySelector("#todayBtn");
const bandFilters = document.querySelector("#bandFilters");
const timelineRoot = document.querySelector("#timeline");
const metaBar = document.querySelector("#metaBar");
const muhurthaSelect = document.querySelector("#muhurthaSelect");
const muhurthaCenterInput = document.querySelector("#muhurthaCenter");
const muhurthaWindowInput = document.querySelector("#muhurthaWindow");
const muhurthaMeta = document.querySelector("#muhurthaMeta");
const muhurthaTimeline = document.querySelector("#muhurthaTimeline");
const yogaList = document.querySelector("#yogaList");

let data = null;
let rules = null;
let tzHours = 0;
let selectedBands = new Set();
let bandNames = {};
let currentDayStart = null;
let currentDayEnd = null;
let cursorJd = null;
let boundaries = [];
let muhurthaIntervals = [];
let muhurthaAll = [];
let muhurthaViewStart = null;
let muhurthaViewEnd = null;

const groupedBands = {
  choghadiya: ["choghadiya_day", "choghadiya_night"],
  gowri: ["gowri_day", "gowri_night"],
  hora: ["hora_day", "hora_night"],
  kala: ["kala_day", "kala_night"],
};
const planetaryBands = new Set([
  "hora",
  "hora_day",
  "hora_night",
  "kala",
  "kala_day",
  "kala_night",
  "gowri",
  "gowri_day",
  "gowri_night",
  "choghadiya",
  "choghadiya_day",
  "choghadiya_night",
]);
const signBands = new Set([
  "lagna",
  "solar_month",
  "vara",
]);
const indexToPlanet = {
  0: "sun",
  1: "moon",
  2: "mars",
  3: "mercury",
  4: "jupiter",
  5: "venus",
  6: "saturn",
  "-1": "rahu",
};

todayBtn.addEventListener("click", () => {
  const now = new Date();
  dateInput.value = now.toISOString().slice(0, 10);
  render();
});

dateInput.addEventListener("change", render);
muhurthaSelect.addEventListener("change", () => {
  computeMuhurthas();
  renderMuhurtha();
});
muhurthaCenterInput.addEventListener("change", renderMuhurtha);
muhurthaWindowInput.addEventListener("input", renderMuhurtha);

function loadJson(path) {
  Promise.all([fetch(path), fetch("./rules.json")])
    .then(async ([resData, resRules]) => {
      if (!resData.ok) throw new Error(`Failed to load ${path}`);
      if (!resRules.ok) throw new Error("Failed to load rules.json");
      const jsonData = await resData.json();
      const jsonRules = await resRules.json();
      return { jsonData, jsonRules };
    })
    .then(({ jsonData, jsonRules }) => {
      data = jsonData;
      rules = jsonRules;
      tzHours = parseFloat(data.meta?.tz_hours ?? 0);
      bandNames = data.band_names || {};
      metaBar.textContent = `${data.meta?.city_name || ""} ${data.meta?.year || ""} — tz ${tzHours}`;
      const year = data.meta?.year || new Date().getFullYear();
      dateInput.value = `${year}-01-01`;
      muhurthaCenterInput.value = `${year}-07-01`;
      buildBandFilters();
      buildMuhurthaSelect();
      computeMuhurthas();
      render();
      renderMuhurtha();
    })
    .catch((err) => {
      metaBar.textContent = `Error: ${err.message}`;
      console.error(err);
    });
}

function buildBandFilters() {
  bandFilters.innerHTML = "";
  selectedBands = new Set();
  const groups = [
    { title: "Core Bands", items: [] },
    { title: "Lunar Months", items: [] },
    { title: "Planets — Nakshatra", items: [] },
    { title: "Planets — Pada", items: [] },
    { title: "Planets — Sign", items: [] },
  ];

  const bands = getDisplayBands();
  bands.forEach((band) => {
    const lower = band.toLowerCase();
    if (lower.includes("lunar_month")) {
      groups[1].items.push(band);
    } else if (lower.includes("nakshatra")) {
      groups[2].items.push(band);
    } else if (lower.includes("pada")) {
      groups[3].items.push(band);
    } else if (lower.includes("sign") || lower === "lagna") {
      groups[4].items.push(band);
    } else {
      groups[0].items.push(band);
    }
  });

  groups.forEach((group) => {
    if (!group.items.length) return;
    const groupDiv = document.createElement("div");
    groupDiv.className = "band-group";

    const title = document.createElement("div");
    title.textContent = group.title;
    title.style.fontWeight = "600";
    title.style.cursor = "pointer";
    title.dataset.target = `${group.title}-chips`;
    title.addEventListener("click", () => {
      chipList.classList.toggle("collapsed");
    });
    groupDiv.appendChild(title);

    const chipList = document.createElement("div");
    chipList.className = "chip-list";
    chipList.id = `${group.title}-chips`;

    group.items.forEach((band) => {
      const id = `band-${band}`;
      const chip = document.createElement("label");
      chip.className = "chip";
      chip.innerHTML =
        `<input type="checkbox" id="${id}" data-band="${band}" checked />` +
        `<span style="display:inline-block;width:12px;height:12px;border-radius:4px;background:${bandColors[band] || "#94a3b8"}"></span>` +
        `<span>${prettyBandName(band)}</span>`;
      const input = chip.querySelector("input");
      input.addEventListener("change", () => {
        if (input.checked) selectedBands.add(band);
        else selectedBands.delete(band);
        render();
      });
      chipList.appendChild(chip);
      selectedBands.add(band);
    });

    groupDiv.appendChild(chipList);
    bandFilters.appendChild(groupDiv);
  });
}

function jdToDate(jd) {
  return new Date((jd - 2440587.5) * 86400000);
}

function toLocal(dateUtc) {
  return new Date(dateUtc.getTime() + tzHours * 3600 * 1000);
}

function normalizeName(s) {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .replace(/oo/g, "u")
    .replace(/aa/g, "a");
}

function buildNameMap(arr) {
  const map = new Map();
  arr.forEach((v, idx) => {
    map.set(normalizeName(v), idx);
  });
  return map;
}

function jdToMs(jd) {
  return (jd - 2440587.5) * 86400000;
}

function render() {
  if (!data) return;
  const dateStr = dateInput.value || `${data.meta?.year || new Date().getFullYear()}-01-01`;
  const [y, m, d] = dateStr.split("-").map((x) => parseInt(x, 10));
  const dayStartUtcMs = Date.UTC(y, m - 1, d) - tzHours * 3600 * 1000; // midnight local converted to UTC
  const dayStartJd = msToJd(dayStartUtcMs);
  const dayEndJd = dayStartJd + 1.0;
  currentDayStart = dayStartJd;
  currentDayEnd = dayEndJd;
  boundaries = [];

  timelineRoot.innerHTML = "";

  const axis = document.createElement("div");
  axis.className = "axis";
  axis.textContent = `${dateStr} (local) — Showing selected bands`;
  timelineRoot.appendChild(axis);

  const activeBands = [...selectedBands];
  activeBands.forEach((band) => {
    const intervals = getIntervalsForBand(band);
    const row = document.createElement("div");
    row.className = "band-row";
    const label = document.createElement("div");
    label.className = "band-label";
    label.textContent = prettyBandName(band);
    row.appendChild(label);

    const segs = document.createElement("div");
    segs.className = "segments";
    intervals.forEach((iv) => {
      const [start, end, valueInt, quality] = iv;
      // clamp to visible day
      const s = Math.max(start, dayStartJd);
      const e = Math.min(end, dayEndJd);
      if (e <= s) return;
      boundaries.push(s, e);
      const pctStart = ((s - dayStartJd) / (dayEndJd - dayStartJd)) * 100;
      const pctWidth = ((e - s) / (dayEndJd - dayStartJd)) * 100;
      const valueLabel = lookupValueLabel(band, valueInt);
      const color = resolveColor(band, valueLabel, valueInt);
      const seg = document.createElement("div");
      seg.className = "segment";
      seg.style.left = `${pctStart}%`;
      seg.style.width = `${pctWidth}%`;
      seg.style.background = color;
      const label = document.createElement("span");
      label.textContent = valueLabel || valueInt || "";
      label.style.color = textColorForBg(color);
      seg.appendChild(label);
      seg.title = `${prettyBandName(band)} ${valueLabel || valueInt || ""}\n${fmtLocal(s)} → ${fmtLocal(e)}\nquality: ${quality ?? "–"}`;
      segs.appendChild(seg);
    });

    row.appendChild(segs);
    timelineRoot.appendChild(row);
  });

  addCursorOverlay();
}

function dateToJd(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function msToJd(ms) {
  return ms / 86400000 + 2440587.5;
}

function fmtLocal(jd) {
  const d = toLocal(jdToDate(jd));
  return d.toISOString().replace("T", " ").slice(0, 16);
}

function prettyBandName(band) {
  if (band.endsWith("_day")) return band.replace("_day", " (Day)").replace(/_/g, " ");
  if (band.endsWith("_night")) return band.replace("_night", " (Night)").replace(/_/g, " ");
  return band.replace(/_/g, " ");
}

function lookupValueLabel(band, valueInt) {
  if (valueInt === null || valueInt === undefined) return "";
  // Exact match from band_names if available
  const namesForBand = bandNames[band];
  if (namesForBand && namesForBand[valueInt]) return namesForBand[valueInt];

  // Try base band without day/night suffix
  const base = band.replace(/_(day|night)$/, "");
  const baseNames = bandNames[base];
  if (baseNames && baseNames[valueInt]) return baseNames[valueInt];

  // Try grouped child names
  if (groupedBands[band]) {
    for (const child of groupedBands[band]) {
      const childNames = bandNames[child];
      if (childNames && childNames[valueInt]) return childNames[valueInt];
    }
  }
  for (const [parent, children] of Object.entries(groupedBands)) {
    if (children.includes(band)) {
      const parentNames = bandNames[parent];
      if (parentNames && parentNames[valueInt]) return parentNames[valueInt];
    }
  }

  // Try lookups array
  const array = data.lookups?.[band] || data.lookups?.[base];
  if (Array.isArray(array) && array.length > 0) {
    if (valueInt - 1 >= 0 && valueInt - 1 < array.length) return array[valueInt - 1]; // 1-based values
    if (valueInt >= 0 && valueInt < array.length) return array[valueInt];             // fallback for 0-based
  }
  return "";
}

function resolveColor(band, valueLabel, valueInt) {
  // Nakshatra / pada by ruler (applies to planetary nak/pada bands too)
  const nakColor = resolveNakColor(band, valueInt);
  if (nakColor) return nakColor;
  // Sign-based bands (rashi) by ruler
  const signColor = resolveSignColor(band, valueInt);
  if (signColor) return signColor;
  // Lunar month by full-moon nakshatra ruler
  const monthColor = resolveLunarMonthColor(band, valueInt);
  if (monthColor) return monthColor;

  if (valueLabel) {
    const planetKey = valueLabel.split(/[\s(]/)[0].toLowerCase();
    if (planetColors[planetKey]) return planetColors[planetKey];
  }
  if (planetaryBands.has(band)) {
    const planet = indexToPlanet[valueInt] || indexToPlanet[String(valueInt)];
    if (planet && planetColors[planet]) return planetColors[planet];
  }
  if (band === "vara") {
    const planet = indexToPlanet[valueInt] || indexToPlanet[String(valueInt)];
    if (planet && planetColors[planet]) return planetColors[planet];
  }
  if (bandColors[band]) return bandColors[band];
  const base = band.replace(/_(day|night)$/, "");
  if (bandColors[base]) return bandColors[base];
  if (groupedBands[band] && groupedBands[band].length) {
    const first = groupedBands[band][0];
    if (bandColors[first]) return bandColors[first];
  }
  for (const [parent, children] of Object.entries(groupedBands)) {
    if (children.includes(band) && bandColors[parent]) return bandColors[parent];
  }
  return "#94a3b8";
}

function resolveNakColor(band, valueInt) {
  if (!valueInt) return null;
  const base = band.replace(/_(day|night)$/, "");
  if (base.includes("nak") || base.endsWith("_pada") || base.endsWith("_nakshatra")) {
    let nakIndex = null;
    if (base.includes("pada")) {
      nakIndex = Math.floor((valueInt - 1) / 4);
    } else {
      nakIndex = valueInt - 1;
    }
    if (nakIndex !== null && nakIndex >= 0 && nakIndex < nakshatraRulers.length) {
      const ruler = nakshatraRulers[nakIndex];
      if (planetColors[ruler]) return planetColors[ruler];
    }
  }
  return null;
}

function resolveSignColor(band, valueInt) {
  if (!valueInt) return null;
  const base = band.replace(/_(day|night)$/, "");
  if (base.includes("sign") || signBands.has(base)) {
    const idx = valueInt - 1;
    if (idx >= 0 && idx < signRulers.length) {
      const ruler = signRulers[idx];
      if (planetColors[ruler]) return planetColors[ruler];
    }
  }
  return null;
}

function resolveLunarMonthColor(band, valueInt) {
  if (!valueInt) return null;
  const base = band.replace(/_(day|night)$/, "");
  if (base.startsWith("lunar_month") && !base.includes("_type") && !base.includes("_lost")) {
    const idx = valueInt - 1;
    if (idx >= 0 && idx < lunarMonthNakIndex.length) {
      const nak = lunarMonthNakIndex[idx];
      if (nak && nak >= 1 && nak <= nakshatraRulers.length) {
        const ruler = nakshatraRulers[nak - 1];
        if (planetColors[ruler]) return planetColors[ruler];
      }
    }
  }
  return null;
}

function textColorForBg(bg) {
  // bg is hex #RRGGBB
  const c = bg.replace("#", "");
  if (c.length !== 6) return "#fff";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  // luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0f172a" : "#fff";
}

function getDisplayBands() {
  const all = Object.keys(data?.bands || {});
  const childBands = new Set(Object.values(groupedBands).flat());
  const display = [];
  const added = new Set();
  // Add grouped parents if any child exists
  for (const key of Object.keys(groupedBands)) {
    const anyPresent = groupedBands[key].some((child) => all.includes(child));
    if (anyPresent) {
      display.push(key);
      added.add(key);
    }
  }
  // Add non-grouped bands
  all.forEach((band) => {
    if (childBands.has(band)) return;
    if (added.has(band)) return;
    display.push(band);
  });
  return display.sort();
}

function getIntervalsForBand(band) {
  if (data?.bands?.[band]) return data.bands[band].intervals || [];
  if (groupedBands[band]) {
    const intervals = [];
    groupedBands[band].forEach((child) => {
      const rows = data?.bands?.[child]?.intervals || [];
      rows.forEach((r) => intervals.push(r));
    });
    return intervals.sort((a, b) => a[0] - b[0]);
  }
  const base = band.replace(/_(day|night)$/, "");
  if (groupedBands[base]) {
    const intervals = [];
    groupedBands[base].forEach((child) => {
      const rows = data?.bands?.[child]?.intervals || [];
      rows.forEach((r) => intervals.push(r));
    });
    return intervals.sort((a, b) => a[0] - b[0]);
  }
  return [];
}

function addCursorOverlay() {
  const oldLine = timelineRoot.querySelector(".cursor-line");
  const oldLabel = timelineRoot.querySelector(".cursor-label");
  if (oldLine) oldLine.remove();
  if (oldLabel) oldLabel.remove();

  if (!currentDayStart || !currentDayEnd) return;
  if (cursorJd === null) cursorJd = currentDayStart;

  const line = document.createElement("div");
  line.className = "cursor-line";
  const label = document.createElement("div");
  label.className = "cursor-label";

  timelineRoot.appendChild(line);
  timelineRoot.appendChild(label);

  const updatePos = () => {
    const rect = timelineRoot.getBoundingClientRect();
    const pct = (cursorJd - currentDayStart) / (currentDayEnd - currentDayStart);
    const pctClamped = Math.min(1, Math.max(0, pct));
    line.style.left = `${pctClamped * 100}%`;
    label.style.left = `${pctClamped * 100}%`;
    label.textContent = fmtLocal(cursorJd);
  };

  const snapToNearest = (jdVal) => {
    if (!boundaries.length) return jdVal;
    const rect = timelineRoot.getBoundingClientRect();
    const thresholdPx = 10;
    const jdPerPx = (currentDayEnd - currentDayStart) / rect.width;
    let nearest = jdVal;
    let minDiff = Infinity;
    boundaries.forEach((b) => {
      const diff = Math.abs(b - jdVal);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = b;
      }
    });
    if (minDiff <= thresholdPx * jdPerPx) return nearest;
    return jdVal;
  };

  let dragging = false;
  const onMove = (ev) => {
    if (!dragging) return;
    const rect = timelineRoot.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const pct = Math.min(1, Math.max(0, x / rect.width));
    cursorJd = currentDayStart + pct * (currentDayEnd - currentDayStart);
    updatePos();
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    cursorJd = snapToNearest(cursorJd);
    updatePos();
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };

  timelineRoot.addEventListener("mousedown", (ev) => {
    const rect = timelineRoot.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const pct = Math.min(1, Math.max(0, x / rect.width));
    cursorJd = currentDayStart + pct * (currentDayEnd - currentDayStart);
    dragging = true;
    updatePos();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  });

  updatePos();
}

// ------------- Muhurtha helper logic ---------------

function buildMuhurthaSelect() {
  if (!rules) return;
  muhurthaSelect.innerHTML = "";
  rules.yogas.forEach((y) => {
    const opt = document.createElement("option");
    opt.value = y.id;
    opt.textContent = y.name;
    muhurthaSelect.appendChild(opt);
  });
}

function getValueSetFromNames(array, lookup, nameMap) {
  const set = new Set();
  if (!Array.isArray(array)) return set;
  array.forEach((name) => {
    const norm = normalizeName(name);
    let idx = nameMap?.get(norm);
    if (idx === undefined || idx === null) {
      idx = lookup.findIndex((v) => normalizeName(v) === norm);
    }
    if (idx >= 0) set.add(idx); // zero-based
  });
  return set;
}

function collectIntervalsByValues(band, values) {
  const rows = getIntervalsForBand(band);
  if (!values || !values.size) return [];
  return rows.filter((r) => {
    if (r[2] === null) return false;
    const val = band === "vara" ? r[2] : r[2] - 1;
    return values.has(val);
  });
}

function intersectTwo(a, b) {
  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const s = Math.max(a[i][0], b[j][0]);
    const e = Math.min(a[i][1], b[j][1]);
    if (e > s) out.push([s, e]);
    if (a[i][1] < b[j][1]) i++;
    else j++;
  }
  return out;
}

function intersectAll(lists) {
  if (!lists.length) return [];
  let acc = lists[0];
  for (let k = 1; k < lists.length; k++) {
    acc = intersectTwo(acc, lists[k]);
    if (!acc.length) break;
  }
  return acc;
}

function computeMuhurthas() {
  if (!rules || !data) return;
  const selectedId = muhurthaSelect.value || rules.yogas[0].id;
  const lookups = data.lookups || {};
  const varaLookup = lookups.vara || [];
  const nakLookup = lookups.nakshatra || [];
  const tithiFamilies = rules.tithiFamilies || {};
  const varaMap = buildNameMap(varaLookup);
  const nakMap = buildNameMap(nakLookup);
  const missing = { vara: new Set(), nak: new Set() };

  const buildTithiSet = (obj) => {
    const set = new Set();
    if (Array.isArray(obj?.tithis)) obj.tithis.forEach((t) => set.add(t - 1));
    if (obj?.tithi) set.add(obj.tithi - 1);
    if (Array.isArray(obj?.tithiFamilies)) {
      obj.tithiFamilies.forEach((fam) => (tithiFamilies[fam] || []).forEach((t) => set.add(t - 1)));
    }
    return set;
  };

  const computeForYoga = (yoga) => {
    const windows = [];
    const addWindows = (overlaps) => overlaps.forEach((iv) => windows.push({ start: iv[0], end: iv[1], label: yoga.name }));

    const def = yoga.definition || {};
    const type = def.type;
    const combos = def.combos || def.pairs || def.list || def.triples || [];

    if (type === "varaTithiFamilies") {
      combos.forEach((combo) => {
        const varSet = getValueSetFromNames([combo.vara], varaLookup, varaMap);
        const tNumbers = [];
        (combo.tithiFamilies || []).forEach((fam) => (tithiFamilies[fam] || []).forEach((t) => tNumbers.push(t)));
        const tSet = new Set(tNumbers.map((x) => x - 1));
        const overlaps = intersectAll([
          collectIntervalsByValues("vara", varSet),
          collectIntervalsByValues("tithi", tSet),
        ]);
        addWindows(overlaps);
      });
    } else if (type === "varaTithi") {
      combos.forEach((combo) => {
        const varSet = getValueSetFromNames([].concat(combo.vara || []), varaLookup, varaMap);
        const tSet = buildTithiSet(combo);
        const overlaps = intersectAll([
          collectIntervalsByValues("vara", varSet),
          collectIntervalsByValues("tithi", tSet),
        ]);
        addWindows(overlaps);
      });
    } else if (type === "varaNakshatra" || type === "varaNakList") {
      combos.forEach((combo) => {
        const varSet = getValueSetFromNames([].concat(combo.vara || []), varaLookup, varaMap);
        const nakSet = getValueSetFromNames(combo.nakshatras || [], nakLookup, nakMap);
        const overlaps = intersectAll([
          collectIntervalsByValues("vara", varSet),
          collectIntervalsByValues("nakshatra", nakSet),
        ]);
        addWindows(overlaps);
      });
    } else if (type === "tithiNakshatra" || type === "tithiNakList") {
      combos.forEach((combo) => {
        const tSet = buildTithiSet(combo);
        const nakSet = getValueSetFromNames(combo.nakshatras || [], nakLookup, nakMap);
        const overlaps = intersectAll([
          collectIntervalsByValues("tithi", tSet),
          collectIntervalsByValues("nakshatra", nakSet),
        ]);
        addWindows(overlaps);
      });
    } else if (type === "varaTithiList") {
      combos.forEach((combo) => {
        const varSet = getValueSetFromNames([].concat(combo.vara || []), varaLookup, varaMap);
        const tSet = buildTithiSet(combo);
        const overlaps = intersectAll([
          collectIntervalsByValues("vara", varSet),
          collectIntervalsByValues("tithi", tSet),
        ]);
        addWindows(overlaps);
      });
    } else if (type === "triple" || type === "tripleList") {
      if (def.triples) {
        def.triples.forEach((tr) => {
          const varSet = getValueSetFromNames([tr.vara], varaLookup, varaMap);
          const tSet = buildTithiSet(tr);
          const nakSet = getValueSetFromNames(tr.nakshatras || [], nakLookup, nakMap);
          const overlaps = intersectAll([
            collectIntervalsByValues("vara", varSet),
            collectIntervalsByValues("tithi", tSet),
            collectIntervalsByValues("nakshatra", nakSet),
          ]);
          addWindows(overlaps);
        });
      } else {
        const varSet = getValueSetFromNames(def.maleficVaras, varaLookup, varaMap);
        const tNumbers = [];
        (def.tithiFamilies || []).forEach((fam) => (tithiFamilies[fam] || []).forEach((t) => tNumbers.push(t)));
        const tSet = new Set(tNumbers.map((x) => x - 1));
        const nakSet = getValueSetFromNames(def.nakshatras, nakLookup, nakMap);
        const overlaps = intersectAll([
          collectIntervalsByValues("vara", varSet),
          collectIntervalsByValues("tithi", tSet),
          collectIntervalsByValues("nakshatra", nakSet),
        ]);
        addWindows(overlaps);
      }
    } else {
      console.warn("Unsupported muhurtha rule type", type, yoga.id);
    }
    return windows;
  };

  const selectedYoga = rules.yogas.find((y) => y.id === selectedId) || rules.yogas[0];
  muhurthaIntervals = computeForYoga(selectedYoga);
  muhurthaAll = rules.yogas.map((y) => ({ yoga: y, windows: computeForYoga(y) }));
  renderYogaList();
}

function renderMuhurtha() {
  if (!data || !muhurthaIntervals) return;
  muhurthaTimeline.innerHTML = "";
  const year = data.meta?.year || new Date().getFullYear();
  const centerStr = muhurthaCenterInput.value || `${year}-07-01`;
  const windowDays = parseInt(muhurthaWindowInput.value || "30", 10);
  const [y, m, d] = centerStr.split("-").map((x) => parseInt(x, 10));
  const centerUtcMs = Date.UTC(y, m - 1, d);
  const centerJd = msToJd(centerUtcMs);
  muhurthaViewStart = centerJd - windowDays / 2;
  muhurthaViewEnd = centerJd + windowDays / 2;

  const axis = document.createElement("div");
  axis.className = "axis";
  axis.textContent = `${centerStr} ± ${windowDays / 2} days — ${muhurthaIntervals.length} windows`;
  muhurthaTimeline.appendChild(axis);

  muhurthaAll.forEach(({ yoga, windows }) => {
    const row = document.createElement("div");
    row.className = "band-row";
    const label = document.createElement("div");
    label.className = "band-label";
    label.textContent = yoga.name;
    row.appendChild(label);

    const segs = document.createElement("div");
    segs.className = "segments";

    windows.forEach((iv) => {
      const s = Math.max(iv.start, muhurthaViewStart);
      const e = Math.min(iv.end, muhurthaViewEnd);
      if (e <= s) return;
      const pctStart = ((s - muhurthaViewStart) / (muhurthaViewEnd - muhurthaViewStart)) * 100;
      const pctWidth = ((e - s) / (muhurthaViewEnd - muhurthaViewStart)) * 100;
      const seg = document.createElement("div");
      seg.className = "segment";
      seg.style.left = `${pctStart}%`;
      seg.style.width = `${pctWidth}%`;
      seg.style.background = "#a855f7";
      const l = document.createElement("span");
      l.textContent = yoga.name;
      l.style.color = textColorForBg("#a855f7");
      seg.appendChild(l);
      seg.title = `${yoga.name}\n${fmtLocal(s)} → ${fmtLocal(e)}`;
      segs.appendChild(seg);
    });

    row.appendChild(segs);
    muhurthaTimeline.appendChild(row);
  });
}

function renderYogaList() {
  if (!rules || !yogaList) return;
  const ul = document.createElement("ul");
  ul.style.listStyle = "none";
  ul.style.padding = "0";
  muhurthaAll.forEach(({ yoga, windows }) => {
    const li = document.createElement("li");
    li.style.marginBottom = "4px";
    li.textContent = `${yoga.id} (${yoga.definition?.type || "?"}) — ${windows.length} windows`;
    ul.appendChild(li);
  });
  yogaList.innerHTML = "";
  yogaList.appendChild(ul);
}

// Initialize defaults and load
loadJson("./panchanga_json/panchanga_bangalore_2026.json");
