import { bandColors, planetColors, nakshatraRulers, signRulers, lunarMonthNakIndex } from "./colors.js";

const dateInput = document.querySelector("#dateInput");
const todayBtn = document.querySelector("#todayBtn");
const metaBar = document.querySelector("#metaBar");
const cardsRoot = document.querySelector("#cards");

let data = null;
let rules = null;
let tzHours = 0;
let bandNames = {};

const groupedBands = {
  choghadiya: ["choghadiya_day", "choghadiya_night"],
  gowri: ["gowri_day", "gowri_night"],
  hora: ["hora_day", "hora_night"],
  kala: ["kala_day", "kala_night"],
};

const planetBandList = [
  { key: "sun", band: "sun_sign", label: "Sun", nakBand: "sun_nakshatra", padaBand: "sun_pada" },
  { key: "moon", band: "moon_sign", label: "Moon", nakBand: "moon_nakshatra", padaBand: "moon_pada" },
  {
    key: "mars",
    band: "mars_sign",
    label: "Mars",
    motionBand: "mars_motion",
    combustBand: "mars_combust",
    nakBand: "mars_nakshatra",
    padaBand: "mars_pada",
  },
  {
    key: "mercury",
    band: "mercury_sign",
    label: "Mercury",
    motionBand: "mercury_motion",
    combustBand: "mercury_combust",
    nakBand: "mercury_nakshatra",
    padaBand: "mercury_pada",
  },
  {
    key: "jupiter",
    band: "jupiter_sign",
    label: "Jupiter",
    motionBand: "jupiter_motion",
    combustBand: "jupiter_combust",
    nakBand: "jupiter_nakshatra",
    padaBand: "jupiter_pada",
  },
  {
    key: "venus",
    band: "venus_sign",
    label: "Venus",
    motionBand: "venus_motion",
    combustBand: "venus_combust",
    nakBand: "venus_nakshatra",
    padaBand: "venus_pada",
  },
  {
    key: "saturn",
    band: "saturn_sign",
    label: "Saturn",
    motionBand: "saturn_motion",
    combustBand: "saturn_combust",
    nakBand: "saturn_nakshatra",
    padaBand: "saturn_pada",
  },
  { key: "rahu", band: "rahu_sign", label: "Rahu", nakBand: "rahu_nakshatra", padaBand: "rahu_pada" },
  { key: "ketu", band: "ketu_sign", label: "Ketu", nakBand: "ketu_nakshatra", padaBand: "ketu_pada" },
];

const PLANET_ABBR = {
  sun: "Su",
  moon: "Mo",
  mars: "Ma",
  mercury: "Me",
  jupiter: "Ju",
  venus: "Ve",
  saturn: "Sa",
  rahu: "Ra",
  ketu: "Ke",
  lagna: "La",
};

const SIGN_SHORTS = ["Ari", "Tau", "Gem", "Can", "Leo", "Vir", "Lib", "Sco", "Sag", "Cap", "Aqu", "Pis"];

const KUNDALI_GRID = [
  ["Pis", "Ari", "Tau", "Gem"],
  ["Aqu", "", "", "Can"],
  ["Cap", "", "", "Leo"],
  ["Sag", "Sco", "Lib", "Vir"],
];

const nakShort = (label) => {
  if (!label || label === "--") return "--";
  const cleaned = label.replace(/[^A-Za-z\s]/g, "").trim();
  if (!cleaned) return "--";
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 3);
  return parts.map((p) => p[0]).join("");
};

const sunriseBands = [
  { band: "vara", label: "Vara" },
  { band: "tithi", label: "Tithi" },
  { band: "paksha", label: "Paksha" },
  { band: "nakshatra", label: "Nakshatra" },
  { band: "nak_pada", label: "Pada" },
  { band: "yoga", label: "Yoga" },
  { band: "karana", label: "Karana" },
  { band: "lagna", label: "Lagna" },
  { band: "solar_month", label: "Solar Month" },
  { band: "lunar_month_amanta", label: "Lunar Month (Amanta)" },
  { band: "lunar_month_poornimanta", label: "Lunar Month (Purnimanta)" },
  { band: "ritu", label: "Ritu" },
  { band: "ayana", label: "Ayana" },
];

const transitionBands = [
  "tithi",
  "nakshatra",
  "yoga",
  "karana",
  "solar_month",
  "lunar_month_amanta",
  "lunar_month_poornimanta",
];

const auspiciousBands = [
  { band: "amrita_gadiya", label: "Amrita" },
  { band: "brahma_muhurta", label: "Brahma" },
  { band: "pratah_sandhya", label: "Pratah" },
  { band: "abhijit_muhurta", label: "Abhijit" },
  { band: "vijaya_muhurta", label: "Vijaya" },
  { band: "godhuli_muhurta", label: "Godhuli" },
];

const inauspiciousBands = [
  { band: "rahu_kala", label: "Rahu" },
  { band: "yamaganda", label: "Yama" },
  { band: "gulika_kala", label: "Gulika" },
  { band: "durmuhurta", label: "Durmuhurta" },
  { band: "varjyam", label: "Varjyam" },
];

const muhurtaYogaBands = [
  { band: "muhurta_auspicious", title: "Auspicious Muhurtas" },
  { band: "muhurta_inauspicious", title: "Inauspicious Muhurtas" },
];

const muhurtaPeriodDefs = [
  { name: "Rudra", meaning: "Cryer / Howler", quality: "Inauspicious (Sunrise)", type: "bad" },
  { name: "Ahi", meaning: "Serpent", quality: "Inauspicious", type: "bad" },
  { name: "Mitra", meaning: "Friend", quality: "Auspicious", type: "good" },
  { name: "Pitri", meaning: "Father / Ancestors", quality: "Inauspicious", type: "bad" },
  { name: "Vasu", meaning: "Bright", quality: "Auspicious", type: "good" },
  { name: "Varaha", meaning: "Boar", quality: "Auspicious", type: "good" },
  { name: "Visvedeva", meaning: "Heavenly Lights", quality: "Auspicious", type: "good" },
  {
    name: "Vidhi / Abhijit",
    meaning: "Insight",
    quality: "Auspicious",
    type: "good",
    except: ["Monday", "Wednesday", "Friday"],
  },
  { name: "Sutamukhi", meaning: "Goat/Charioteer-Face", quality: "Auspicious", type: "good" },
  { name: "Puruhuta", meaning: "Many Offerings", quality: "Inauspicious", type: "bad" },
  { name: "Vahini / Vinda", meaning: "Possessed of Chariot", quality: "Inauspicious", type: "bad" },
  { name: "Naktanakara", meaning: "Night Maker", quality: "Inauspicious", type: "bad" },
  { name: "Varuna", meaning: "All-Enveloping Sky", quality: "Auspicious", type: "good" },
  {
    name: "Aryaman",
    meaning: "Nobility",
    quality: "Auspicious",
    type: "good",
    except: ["Sunday"],
  },
  { name: "Bhaga", meaning: "Share / Stake", quality: "Inauspicious", type: "bad" },
  { name: "Girisa", meaning: "Lord of the Mount", quality: "Inauspicious (Sunset)", type: "bad" },
  { name: "Ajapada", meaning: "Unborn / Goat Foot", quality: "Inauspicious", type: "bad" },
  { name: "Ahir Budhnya", meaning: "Serpent of the Depths", quality: "Auspicious", type: "good" },
  { name: "Pusya", meaning: "Nourishment / Blossom", quality: "Auspicious", type: "good" },
  { name: "Asvini", meaning: "Horsemen", quality: "Auspicious", type: "good" },
  { name: "Yama", meaning: "Restrainer / Death", quality: "Inauspicious", type: "bad" },
  { name: "Agni", meaning: "Fire / Ignition", quality: "Auspicious", type: "good" },
  { name: "Vidhatr", meaning: "Distributor", quality: "Auspicious", type: "good" },
  { name: "Kanda", meaning: "Ornament", quality: "Auspicious", type: "good" },
  { name: "Aditi", meaning: "Boundless", quality: "Auspicious", type: "good" },
  { name: "Jiva / Amrita", meaning: "Life / Immortal", quality: "Very Auspicious", type: "very" },
  { name: "Visnu", meaning: "All-Pervading", quality: "Auspicious", type: "good" },
  { name: "Dyumadgadyuti", meaning: "Resounding Light", quality: "Auspicious", type: "good" },
  { name: "Brahma", meaning: "Universe / Creator", quality: "Very Auspicious (Prayer/Mantra)", type: "very" },
  { name: "Samudram", meaning: "Ocean", quality: "Auspicious", type: "good" },
];

const MUHURTA_SKIP = new Set([
  "rahukalam",
  "rahukala",
  "gulikalam",
  "gulikakalam",
  "gulika",
  "yamaganda",
]);

const timeSystems = [{ title: "Hora", day: "hora_day", night: "hora_night" }];

const yearBands = [
  { band: "year_shaka_traditional", label: "Shaka (Trad)" },
  { band: "year_shaka_govt", label: "Shaka (Govt)" },
  { band: "year_vikrama_amanta", label: "Vikrama (A)" },
  { band: "year_vikrama_poornimanta", label: "Vikrama (P)" },
];

function loadJson(path) {
  return Promise.all([fetch(path), fetch("./rules.json")])
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
      metaBar.textContent = `${data.meta?.city_name || ""} ${data.meta?.year || ""} - tz ${tzHours}`;
      const year = data.meta?.year || new Date().getFullYear();
      const urlDate = new URLSearchParams(window.location.search).get("date");
      const urlYear = urlDate ? parseInt(urlDate.slice(0, 4), 10) : null;
      const today = new Date();
      if (urlDate && urlYear === year) {
        dateInput.value = urlDate;
      } else if (today.getFullYear() === year) {
        dateInput.value = today.toISOString().slice(0, 10);
      } else {
        dateInput.value = `${year}-01-01`;
      }
      render();
    })
    .catch((err) => {
      metaBar.textContent = `Error: ${err.message}`;
      console.error(err);
    });
}

function jdToDate(jd) {
  return new Date((jd - 2440587.5) * 86400000);
}

function msToJd(ms) {
  return ms / 86400000 + 2440587.5;
}

function toLocal(dateUtc) {
  return new Date(dateUtc.getTime() + tzHours * 3600 * 1000);
}

function fmtTime(jd) {
  if (jd === null || jd === undefined) return "--";
  const d = toLocal(jdToDate(jd));
  return d.toISOString().slice(11, 16);
}

function fmtRange(start, end) {
  return `${fmtTime(start)}-${fmtTime(end)}`;
}

function formatDuration(minutes) {
  if (!Number.isFinite(minutes)) return "--";
  const mins = Math.max(0, Math.round(minutes));
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function fmtDateHeader(dayStartJd) {
  const local = toLocal(jdToDate(dayStartJd));
  const formatted = local.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
  const city = data?.meta?.city_name || "";
  return city ? `${formatted} • ${city}` : formatted;
}

function normalizeMuhurtaLabel(label) {
  return String(label || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function shouldSkipMuhurtaLabel(label) {
  return MUHURTA_SKIP.has(normalizeMuhurtaLabel(label));
}

function lookupValueLabel(band, valueInt) {
  if (valueInt === null || valueInt === undefined) return "";
  const key = String(valueInt);
  const namesForBand = bandNames[band];
  if (namesForBand && namesForBand[key]) return namesForBand[key];

  const base = band.replace(/_(day|night)$/, "");
  const baseNames = bandNames[base];
  if (baseNames && baseNames[key]) return baseNames[key];

  if (groupedBands[band]) {
    for (const child of groupedBands[band]) {
      const childNames = bandNames[child];
      if (childNames && childNames[key]) return childNames[key];
    }
  }
  for (const [parent, children] of Object.entries(groupedBands)) {
    if (children.includes(band)) {
      const parentNames = bandNames[parent];
      if (parentNames && parentNames[key]) return parentNames[key];
    }
  }

  const array = data.lookups?.[band] || data.lookups?.[base];
  if (Array.isArray(array) && array.length > 0) {
    if (valueInt - 1 >= 0 && valueInt - 1 < array.length) return array[valueInt - 1];
    if (valueInt >= 0 && valueInt < array.length) return array[valueInt];
  }
  return "";
}

function resolveColor(band, valueLabel, valueInt) {
  const nakColor = resolveNakColor(band, valueInt);
  if (nakColor) return nakColor;
  const signColor = resolveSignColor(band, valueInt);
  if (signColor) return signColor;
  const monthColor = resolveLunarMonthColor(band, valueInt);
  if (monthColor) return monthColor;

  if (valueLabel) {
    const planetKey = valueLabel.split(/[\s(]/)[0].toLowerCase();
    if (planetColors[planetKey]) return planetColors[planetKey];
  }
  if (bandColors[band]) return bandColors[band];
  const base = band.replace(/_(day|night)$/, "");
  if (bandColors[base]) return bandColors[base];
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
  if (base.includes("sign") || base === "lagna" || base === "solar_month") {
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
  if (band.startsWith("lunar_month")) {
    const idx = valueInt - 1;
    if (idx >= 0 && idx < lunarMonthNakIndex.length) {
      const nak = lunarMonthNakIndex[idx];
      const ruler = nakshatraRulers[nak - 1];
      if (planetColors[ruler]) return planetColors[ruler];
    }
  }
  return null;
}

function signShortFromValue(valueInt) {
  if (!valueInt) return "";
  const idx = valueInt - 1;
  if (idx < 0 || idx >= SIGN_SHORTS.length) return "";
  return SIGN_SHORTS[idx];
}

function normalizeStateLabel(label) {
  return String(label || "").trim().toLowerCase();
}

function isRetrograde(label, valueInt) {
  const text = normalizeStateLabel(label);
  if (text.includes("retro") || text.includes("rx")) return true;
  if (Number.isFinite(valueInt) && valueInt < 0) return true;
  return false;
}

function isCombust(label, valueInt) {
  const text = normalizeStateLabel(label);
  if (text.includes("combust")) return true;
  if (text.includes("non") && text.includes("combust")) return false;
  if (text.includes("not") && text.includes("combust")) return false;
  if (text.includes("normal") || text.includes("direct") || text === "--") return false;
  if (valueInt === null || valueInt === undefined) return false;
  return valueInt !== 0;
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

function getIntervalContainingJd(band, jd) {
  const intervals = getIntervalsForBand(band);
  for (const iv of intervals) {
    if (iv[0] <= jd && jd < iv[1]) return iv;
  }
  return null;
}

function getYearRow(band, label, sunriseJd) {
  if (!data.bands?.[band]) return null;
  const iv = getIntervalContainingJd(band, sunriseJd);
  if (!iv) return { label, year: "--", day: "--", samvatsara: "--" };
  const valueInt = iv[2];
  const samvatsara = formatIntervalLabel(band, iv) || "--";
  const dayIndex = Math.floor(sunriseJd - iv[0]) + 1;
  return {
    label,
    year: valueInt !== null && valueInt !== undefined ? String(valueInt) : "--",
    day: Number.isFinite(dayIndex) ? String(dayIndex) : "--",
    samvatsara,
  };
}

function formatIntervalLabel(band, interval) {
  if (!interval) return "--";
  const valueInt = interval[2];
  const valueText = interval[3];
  if (valueText) return valueText;
  const label = lookupValueLabel(band, valueInt);
  if (label) return label;
  if (valueInt === null || valueInt === undefined) return "--";
  return String(valueInt);
}

function getValueAtJd(band, jd) {
  const interval = getIntervalContainingJd(band, jd);
  if (!interval) return { label: "--", valueInt: null };
  return { label: formatIntervalLabel(band, interval), valueInt: interval[2] };
}

function getTransitions(band, startJd, endJd) {
  const intervals = getIntervalsForBand(band).slice().sort((a, b) => a[0] - b[0]);
  if (!intervals.length) return [];
  const current = getIntervalContainingJd(band, startJd);
  let currentLabel = current ? formatIntervalLabel(band, current) : "--";
  const transitions = [];
  intervals.forEach((iv) => {
    if (iv[0] > startJd && iv[0] <= endJd) {
      const toLabel = formatIntervalLabel(band, iv);
      transitions.push({
        band,
        timeJd: iv[0],
        from: currentLabel,
        to: toLabel,
      });
      currentLabel = toLabel;
    }
  });
  return transitions;
}

function getWindows(band, startJd, endJd) {
  const intervals = getIntervalsForBand(band).slice().sort((a, b) => a[0] - b[0]);
  const ranges = [];
  intervals.forEach((iv) => {
    const start = Math.max(startJd, iv[0]);
    const end = Math.min(endJd, iv[1]);
    if (end > start) ranges.push({ start, end });
  });
  return ranges;
}

function getLabeledWindows(band, startJd, endJd) {
  const intervals = getIntervalsForBand(band).slice().sort((a, b) => a[0] - b[0]);
  const ranges = [];
  intervals.forEach((iv) => {
    const start = Math.max(startJd, iv[0]);
    const end = Math.min(endJd, iv[1]);
    if (end > start) {
      ranges.push({
        start,
        end,
        label: formatIntervalLabel(band, iv),
      });
    }
  });
  return ranges;
}

function computeDayWindow(dateStr) {
  const [y, m, d] = dateStr.split("-").map((x) => parseInt(x, 10));
  const dayStartUtcMs = Date.UTC(y, m - 1, d) - tzHours * 3600 * 1000;
  const dayStartJd = msToJd(dayStartUtcMs);
  const dayEndJd = dayStartJd + 1.0;

  let sunriseJd = dayStartJd;
  let sunsetJd = dayStartJd + 0.5;
  let nextSunriseJd = dayStartJd + 1.0;

  const daylight = getIntervalsForBand("daylight");
  if (daylight.length) {
    const match = daylight.find((iv) => iv[0] >= dayStartJd && iv[0] < dayEndJd) ||
      daylight.find((iv) => iv[0] < dayEndJd && iv[1] > dayStartJd);
    if (match) {
      sunriseJd = match[0];
      sunsetJd = match[1];
      const next = daylight.find((iv) => iv[0] > sunriseJd);
      if (next) nextSunriseJd = next[0];
    }
  }

  const dayMinutes = (sunsetJd - sunriseJd) * 24 * 60;
  const nightMinutes = (nextSunriseJd - sunsetJd) * 24 * 60;

  return {
    dateStr,
    dayStartJd,
    sunriseJd,
    sunsetJd,
    nextSunriseJd,
    dayLength: formatDuration(dayMinutes),
    nightLength: formatDuration(nightMinutes),
    noonJd: sunriseJd + (sunsetJd - sunriseJd) / 2,
    midnightJd: sunsetJd + (nextSunriseJd - sunsetJd) / 2,
  };
}

function buildRangeRows(bandDay, bandNight, sunriseJd, sunsetJd, nextSunriseJd, limit = 8) {
  const dayIntervals = getIntervalsForBand(bandDay)
    .filter((iv) => iv[1] > sunriseJd && iv[0] < sunsetJd)
    .sort((a, b) => a[0] - b[0])
    .slice(0, limit);
  const nightIntervals = getIntervalsForBand(bandNight)
    .filter((iv) => iv[1] > sunsetJd && iv[0] < nextSunriseJd)
    .sort((a, b) => a[0] - b[0])
    .slice(0, limit);

  const dayRows = dayIntervals.map((iv) => ({
    name: formatIntervalLabel(bandDay, iv),
    range: fmtRange(iv[0], iv[1]),
  }));
  const nightRows = nightIntervals.map((iv) => ({
    name: formatIntervalLabel(bandNight, iv),
    range: fmtRange(iv[0], iv[1]),
  }));

  while (dayRows.length < limit) dayRows.push({ name: "", range: "" });
  while (nightRows.length < limit) nightRows.push({ name: "", range: "" });

  return { dayRows, nightRows };
}

function buildSlotRows(band, windowStart, windowEnd) {
  if (!data.bands?.[band]) return [];
  const intervals = getIntervalsForBand(band)
    .filter((iv) => iv[1] > windowStart && iv[0] < windowEnd)
    .sort((a, b) => a[0] - b[0])
    .slice(0, 8);
  const rows = intervals.map((iv) => ({
    name: formatIntervalLabel(band, iv),
    start: fmtTime(iv[0]),
    end: fmtTime(iv[1]),
  }));
  while (rows.length < 8) rows.push({ name: "", start: "", end: "" });
  return rows;
}

function buildLagnaRows(day) {
  if (!data.bands?.lagna) return [];
  const intervals = getIntervalsForBand("lagna").slice().sort((a, b) => a[0] - b[0]);
  const rows = [];
  intervals.forEach((iv) => {
    const start = Math.max(day.sunriseJd, iv[0]);
    const end = Math.min(day.nextSunriseJd, iv[1]);
    if (end <= start) return;
    const sign = signShortFromValue(iv[2]) || formatIntervalLabel("lagna", iv) || "--";
    const duration = formatDuration((end - start) * 24 * 60);
    rows.push({ sign, start: fmtTime(start), end: fmtTime(end), duration });
  });
  if (!rows.length) rows.push({ sign: "--", start: "--", end: "--", duration: "--" });
  return rows;
}

function clearCards() {
  cardsRoot.innerHTML = "";
}

function createCard(title, full = false) {
  const section = document.createElement("section");
  section.className = `card${full ? " full" : ""}`;
  if (title) {
    const h = document.createElement("div");
    h.className = "card-title";
    h.textContent = title;
    section.appendChild(h);
  }
  return section;
}

function createTable(headers, rows, className = "table") {
  const table = document.createElement("table");
  table.className = className;
  if (headers && headers.length) {
    const thead = document.createElement("thead");
    const tr = document.createElement("tr");
    headers.forEach((text) => {
      const th = document.createElement("th");
      th.textContent = text;
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);
  }
  const tbody = document.createElement("tbody");
  rows.forEach((cols) => {
    const tr = document.createElement("tr");
    cols.forEach((col) => {
      tr.appendChild(col);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

function makeCell(tag, text, className) {
  const cell = document.createElement(tag);
  cell.textContent = text;
  if (className) cell.className = className;
  return cell;
}

function renderHeaderCard(day) {
  const card = createCard(null, true);
  const dateLine = document.createElement("div");
  dateLine.className = "date-line";
  dateLine.textContent = fmtDateHeader(day.dayStartJd);
  card.appendChild(dateLine);

  const rows = [
    [
      makeCell("th", "Sunrise", "label"),
      makeCell("td", fmtTime(day.sunriseJd), "time"),
      makeCell("th", "Sunset", "label"),
      makeCell("td", fmtTime(day.sunsetJd), "time"),
      makeCell("th", "Next", "label"),
      makeCell("td", fmtTime(day.nextSunriseJd), "time"),
      makeCell("th", "Noon", "label"),
      makeCell("td", fmtTime(day.noonJd), "time"),
    ],
    [
      makeCell("th", "Midnight", "label"),
      makeCell("td", fmtTime(day.midnightJd), "time"),
      makeCell("th", "Day", "label"),
      makeCell("td", day.dayLength, "time"),
      makeCell("th", "Night", "label"),
      makeCell("td", day.nightLength, "time"),
      makeCell("th", "", "label"),
      makeCell("td", "", "time"),
    ],
  ];

  const table = createTable(null, rows, "table small");
  const wrap = document.createElement("div");
  wrap.className = "table-wrap";
  wrap.appendChild(table);
  card.appendChild(wrap);
  return card;
}

function renderSunriseCard(day) {
  const card = createCard("At Sunrise");
  const flow = document.createElement("div");
  flow.className = "sunrise-flow";
  sunriseBands.forEach((item) => {
    if (!data.bands?.[item.band]) return;
    const value = getValueAtJd(item.band, day.sunriseJd);
    const color = resolveColor(item.band, value.label, value.valueInt);

    const pill = document.createElement("div");
    pill.className = "sunrise-pill";
    const badge = document.createElement("span");
    badge.className = "badge";
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = color;
    const label = document.createElement("span");
    label.textContent = item.label;
    badge.append(dot, label);

    const valueEl = document.createElement("div");
    valueEl.className = "sunrise-value";
    valueEl.textContent = value.label || "--";

    pill.append(badge, valueEl);
    flow.appendChild(pill);
  });

  card.appendChild(flow);
  return card;
}

function renderPlanetCard(day) {
  const card = createCard("Planetary Snapshot");
  const signToPlanets = {};
  KUNDALI_GRID.flat().forEach((sign) => {
    if (sign) signToPlanets[sign] = [];
  });

  planetBandList.forEach((planet) => {
    if (!data.bands?.[planet.band]) return;
    const value = getValueAtJd(planet.band, day.sunriseJd);
    const signShort = signShortFromValue(value.valueInt);
    if (!signShort) return;
    const nak = planet.nakBand && data.bands?.[planet.nakBand]
      ? getValueAtJd(planet.nakBand, day.sunriseJd)
      : null;
    const pada = planet.padaBand && data.bands?.[planet.padaBand]
      ? getValueAtJd(planet.padaBand, day.sunriseJd)
      : null;
    const nakLabel = nak ? nak.label : null;
    const padaLabel = pada ? pada.label : null;
    const padaNum = padaLabel && padaLabel.includes("-") ? padaLabel.split("-").pop() : null;
    const nakText = nakShort(nakLabel);
    const metaText = nakText && padaNum ? `${nakText}-${padaNum}` : nakText || null;
    const motion = planet.motionBand && data.bands?.[planet.motionBand]
      ? getValueAtJd(planet.motionBand, day.sunriseJd)
      : null;
    const combust = planet.combustBand && data.bands?.[planet.combustBand]
      ? getValueAtJd(planet.combustBand, day.sunriseJd)
      : null;
    signToPlanets[signShort]?.push({
      abbr: PLANET_ABBR[planet.key] || planet.label.slice(0, 2),
      meta: metaText,
      retro: motion ? isRetrograde(motion.label, motion.valueInt) : false,
      combust: combust ? isCombust(combust.label, combust.valueInt) : false,
    });
  });

  if (data.bands?.lagna) {
    const lagna = getValueAtJd("lagna", day.sunriseJd);
    const signShort = signShortFromValue(lagna.valueInt);
    if (signShort) {
      signToPlanets[signShort]?.push({ abbr: PLANET_ABBR.lagna, retro: false, combust: false });
    }
  }

  const grid = document.createElement("div");
  grid.className = "kundali-grid";

  KUNDALI_GRID.forEach((row, rIdx) => {
    row.forEach((sign, cIdx) => {
      if (!sign) return;
      const cell = document.createElement("div");
      cell.className = "kundali-cell";
      cell.style.gridRow = String(rIdx + 1);
      cell.style.gridColumn = String(cIdx + 1);

      const signLabel = document.createElement("div");
      signLabel.className = "kundali-sign";
      signLabel.textContent = sign;
      cell.appendChild(signLabel);

      const planetsWrap = document.createElement("div");
      planetsWrap.className = "kundali-planets";
      const planets = signToPlanets[sign] || [];
      if (!planets.length) {
        const empty = document.createElement("span");
        empty.className = "kundali-empty";
        empty.textContent = "—";
        planetsWrap.appendChild(empty);
      } else {
        planets.forEach((planet) => {
          const token = document.createElement("span");
          token.className = "kundali-planet";
          const main = document.createElement("span");
          main.className = "kundali-planet-main";
          main.textContent = planet.abbr;
          if (planet.retro) {
            const sup = document.createElement("sup");
            sup.className = "kundali-flag";
            sup.textContent = "R";
            main.appendChild(sup);
          }
          if (planet.combust) {
            const sup = document.createElement("sup");
            sup.className = "kundali-flag";
            sup.textContent = "C";
            main.appendChild(sup);
          }
          token.appendChild(main);
          if (planet.meta) {
            const meta = document.createElement("span");
            meta.className = "kundali-meta";
            meta.textContent = planet.meta;
            token.appendChild(meta);
          }
          planetsWrap.appendChild(token);
        });
      }

      cell.appendChild(planetsWrap);
      grid.appendChild(cell);
    });
  });

  const center = document.createElement("div");
  center.className = "kundali-center";
  const sunriseLabel = document.createElement("div");
  sunriseLabel.className = "kundali-center-label";
  sunriseLabel.textContent = "Sunrise";
  const sunriseValue = document.createElement("div");
  sunriseValue.className = "kundali-center-value";
  sunriseValue.textContent = fmtTime(day.sunriseJd);
  const lagnaAt = getValueAtJd("lagna", day.sunriseJd).label || "--";
  const lagnaText = document.createElement("div");
  lagnaText.className = "kundali-center-subtle";
  lagnaText.textContent = `Lagna: ${lagnaAt}`;
  center.append(sunriseLabel, sunriseValue, lagnaText);
  grid.appendChild(center);

  card.appendChild(grid);
  if (data.bands?.lagna) {
    const lagnaRows = buildLagnaRows(day);
    const rows = lagnaRows.map((row) => {
      const signCell = makeCell("td", row.sign, "label");
      signCell.setAttribute("data-label", "Sign");
      const timeText = `${row.start}-${row.end} (${row.duration})`;
      const timeCell = makeCell("td", timeText, "time");
      timeCell.setAttribute("data-label", "Time");
      return [signCell, timeCell];
    });
    const table = createTable(["Sign", "Time"], rows, "table small lagna-table");
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    wrap.appendChild(table);
    card.appendChild(wrap);
  }

  return card;
}

function renderYearCard(day) {
  const rows = [];
  yearBands.forEach((item) => {
    const info = getYearRow(item.band, item.label, day.sunriseJd);
    if (!info) return;
    rows.push([
      makeCell("td", info.label, "label"),
      makeCell("td", info.year),
      makeCell("td", info.day, "time"),
      makeCell("td", info.samvatsara),
    ]);
  });

  if (!rows.length) return null;
  const card = createCard("Year at Sunrise");
  const table = createTable(["Calendar", "Year", "Day", "Samvatsara"], rows, "table small");
  const wrap = document.createElement("div");
  wrap.className = "table-wrap";
  wrap.appendChild(table);
  card.appendChild(wrap);
  return card;
}

function renderTransitionsCard(day) {
  const card = createCard("Transitions");
  const rows = [];

  transitionBands.forEach((band) => {
    if (!data.bands?.[band]) return;
    const transitions = getTransitions(band, day.sunriseJd, day.nextSunriseJd);
    if (!transitions.length) return;
    transitions.forEach((item) => {
      rows.push([
        makeCell("td", titleCase(prettyBandName(band)), "label"),
        makeCell("td", titleCase(item.from || "--")),
        makeCell("td", fmtTime(item.timeJd), "time"),
        makeCell("td", titleCase(item.to || "--")),
      ]);
    });
  });

  if (!rows.length) {
    rows.push([
      makeCell("td", "--", "label"),
      makeCell("td", "--"),
      makeCell("td", "--", "time"),
      makeCell("td", "--"),
    ]);
  }

  const table = createTable(["Element", "From", "Time", "To"], rows, "table");
  const wrap = document.createElement("div");
  wrap.className = "table-wrap";
  wrap.appendChild(table);
  card.appendChild(wrap);
  return card;
}

function renderWindowCard(day, title, bands) {
  const rows = [];
  bands.forEach((item) => {
    if (!data.bands?.[item.band]) return;
    const ranges = getWindows(item.band, day.sunriseJd, day.nextSunriseJd);
    const text = ranges.length ? ranges.map((r) => fmtRange(r.start, r.end)).join("\n") : "--";
    const timeCell = makeCell("td", text, "time multiline");
    rows.push([makeCell("td", item.label, "label"), timeCell]);
  });
  if (!rows.length) return null;
  const card = createCard(title);
  const table = createTable(["Name", "Time Range(s)"], rows, "table");
  const wrap = document.createElement("div");
  wrap.className = "table-wrap";
  wrap.appendChild(table);
  card.appendChild(wrap);
  return card;
}

function renderMuhurtaYogaBlock(day) {
  const bands = [
    { band: "muhurta_auspicious", label: "Ausp", className: "good" },
    { band: "muhurta_inauspicious", label: "Inausp", className: "bad" },
  ];
  const rows = [];

  bands.forEach((item) => {
    if (!data.bands?.[item.band]) return;
    const windows = getLabeledWindows(item.band, day.sunriseJd, day.nextSunriseJd).filter(
      (window) => !shouldSkipMuhurtaLabel(window.label)
    );
    windows.forEach((window) => {
      rows.push({
        type: item.label,
        typeClass: item.className,
        label: window.label || "--",
        start: window.start,
        end: window.end,
      });
    });
  });

  if (!rows.length) return null;
  const typeRank = (type) => (type === "bad" ? 1 : 0);
  rows.sort((a, b) => {
    const rankDiff = typeRank(a.typeClass) - typeRank(b.typeClass);
    if (rankDiff) return rankDiff;
    return (a.start ?? 0) - (b.start ?? 0);
  });

  const card = createCard("Muhurta Yogas", true);
  const grid = document.createElement("div");
  grid.className = "muhurta-grid";

  rows.forEach((row) => {
    const item = document.createElement("div");
    item.className = "muhurta-item";
    const type = document.createElement("div");
    type.className = `muhurta-type ${row.typeClass}`;
    type.textContent = row.type;
    const name = document.createElement("div");
    name.className = "muhurta-name";
    name.textContent = row.label;
    const time = document.createElement("div");
    time.className = "muhurta-time";
    time.textContent = fmtRange(row.start, row.end);
    item.append(type, name, time);
    grid.appendChild(item);
  });

  card.appendChild(grid);
  return card;
}

function renderMuhurtaPeriodCard(day) {
  if (!muhurtaPeriodDefs.length) return null;
  const span = day.nextSunriseJd - day.sunriseJd;
  if (!Number.isFinite(span) || span <= 0) return null;
  const segment = span / muhurtaPeriodDefs.length;
  const weekday = getValueAtJd("vara", day.sunriseJd).label;

  const rows = muhurtaPeriodDefs.map((entry, idx) => {
    const start = day.sunriseJd + segment * idx;
    const end = start + segment;
    const isException = entry.except?.includes(weekday);
    const qualityText = isException ? "Inauspicious (Exception)" : entry.quality;
    const qualityClass = isException ? "bad" : entry.type;
    return [
      makeCell("td", String(idx + 1), "label"),
      makeCell("td", fmtRange(start, end), "time"),
      makeCell("td", entry.name, "label"),
      makeCell("td", entry.meaning, "subtle"),
      makeCell("td", qualityText, `quality ${qualityClass}`),
    ];
  });

  const card = createCard("Muhurta Periods", true);
  const table = createTable(["No", "Time", "Period", "Meaning", "Quality"], rows, "table small");
  const wrap = document.createElement("div");
  wrap.className = "table-wrap";
  wrap.appendChild(table);
  card.appendChild(wrap);
  return card;
}

function pickStartTime(idx, lists) {
  for (const list of lists) {
    const value = list?.[idx]?.start;
    if (value) return value;
  }
  return "--";
}

function makeSlotCell(text) {
  const td = document.createElement("td");
  if (!text || text === "--") {
    td.textContent = "--";
    return td;
  }
  const splitAt = text.indexOf(" (");
  if (splitAt === -1) {
    td.textContent = text;
    return td;
  }
  const main = document.createElement("span");
  main.className = "slot-main";
  main.textContent = text.slice(0, splitAt);
  const sub = document.createElement("span");
  sub.className = "slot-sub";
  sub.textContent = text.slice(splitAt);
  td.append(main, sub);
  return td;
}

function renderCombinedKalaCard(day) {
  const bands = [
    "kala_day",
    "kala_night",
    "gowri_day",
    "gowri_night",
    "choghadiya_day",
    "choghadiya_night",
  ];
  if (!bands.some((band) => data.bands?.[band])) return null;

  const kalaDay = buildSlotRows("kala_day", day.sunriseJd, day.sunsetJd);
  const kalaNight = buildSlotRows("kala_night", day.sunsetJd, day.nextSunriseJd);
  const gowriDay = buildSlotRows("gowri_day", day.sunriseJd, day.sunsetJd);
  const gowriNight = buildSlotRows("gowri_night", day.sunsetJd, day.nextSunriseJd);
  const choghDay = buildSlotRows("choghadiya_day", day.sunriseJd, day.sunsetJd);
  const choghNight = buildSlotRows("choghadiya_night", day.sunsetJd, day.nextSunriseJd);

  const rows = [];
  for (let i = 0; i < 8; i += 1) {
    const dayStart = pickStartTime(i, [kalaDay, gowriDay, choghDay]);
    const nightStart = pickStartTime(i, [kalaNight, gowriNight, choghNight]);
    rows.push([
      makeCell("td", dayStart, "time label"),
      makeSlotCell(gowriDay[i]?.name || "--"),
      makeSlotCell(choghDay[i]?.name || "--"),
      makeSlotCell(kalaDay[i]?.name || "--"),
      makeCell("td", nightStart, "time label"),
      makeSlotCell(gowriNight[i]?.name || "--"),
      makeSlotCell(choghNight[i]?.name || "--"),
      makeSlotCell(kalaNight[i]?.name || "--"),
    ]);
  }

  const card = createCard("Gowri, Choghadiya and Kala", true);
  const table = createTable(
    ["Start", "Gowri", "Choghadiya", "Kala", "Start", "Gowri", "Choghadiya", "Kala"],
    rows,
    "table small combined-kala"
  );
  const wrap = document.createElement("div");
  wrap.className = "table-wrap";
  wrap.appendChild(table);
  card.appendChild(wrap);
  return card;
}

function renderTimeSystemCards(day) {
  return timeSystems
    .filter((system) => data.bands?.[system.day] || data.bands?.[system.night])
    .map((system) => {
      const card = createCard(system.title);
      const rows = [];
      const limit = system.title === "Hora" ? 12 : 8;
      const entries = buildRangeRows(
        system.day,
        system.night,
        day.sunriseJd,
        day.sunsetJd,
        day.nextSunriseJd,
        limit
      );
      for (let i = 0; i < limit; i += 1) {
        rows.push([
          makeCell("td", entries.dayRows[i].name || "", "label"),
          makeCell("td", entries.dayRows[i].range || "", "time"),
          makeCell("td", entries.nightRows[i].name || "", "label"),
          makeCell("td", entries.nightRows[i].range || "", "time"),
        ]);
      }
      const table = createTable(["Day", "Range", "Night", "Range"], rows, "table small");
      const wrap = document.createElement("div");
      wrap.className = "table-wrap";
      wrap.appendChild(table);
      card.appendChild(wrap);
      return card;
    });
}

function prettyBandName(band) {
  if (band.endsWith("_day")) return band.replace("_day", " (Day)").replace(/_/g, " ");
  if (band.endsWith("_night")) return band.replace("_night", " (Night)").replace(/_/g, " ");
  return band.replace(/_/g, " ");
}

function titleCase(text) {
  return String(text || "--")
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ""))
    .join(" ");
}

function render() {
  if (!data) return;
  const dateStr = dateInput.value || `${data.meta?.year || new Date().getFullYear()}-01-01`;
  const day = computeDayWindow(dateStr);

  clearCards();
  cardsRoot.appendChild(renderHeaderCard(day));

  const sunriseCard = renderSunriseCard(day);
  sunriseCard.classList.add("full");
  cardsRoot.appendChild(sunriseCard);

  const muhurtaBlock = renderMuhurtaYogaBlock(day);
  if (muhurtaBlock) cardsRoot.appendChild(muhurtaBlock);

  const auspiciousCard = renderWindowCard(day, "Auspicious Timings", auspiciousBands);
  const inauspiciousCard = renderWindowCard(day, "Inauspicious Times", inauspiciousBands);
  const planetCard = renderPlanetCard(day);
  const horaCard = renderTimeSystemCards(day)[0] || null;

  const topColumns = document.createElement("div");
  topColumns.className = "card-two-col full";
  const topLeft = document.createElement("div");
  topLeft.className = "card-col";
  const topRight = document.createElement("div");
  topRight.className = "card-col";
  topColumns.append(topLeft, topRight);
  cardsRoot.appendChild(topColumns);

  planetCard.classList.add("grow");
  topLeft.appendChild(planetCard);
  const auspInauspRow = document.createElement("div");
  auspInauspRow.className = "card-row";
  if (auspiciousCard) auspInauspRow.appendChild(auspiciousCard);
  if (inauspiciousCard) auspInauspRow.appendChild(inauspiciousCard);
  if (auspInauspRow.childElementCount) topRight.appendChild(auspInauspRow);
  if (horaCard) {
    horaCard.classList.add("grow");
    topRight.appendChild(horaCard);
  }
  const transitionsCard = renderTransitionsCard(day);
  if (transitionsCard) {
    transitionsCard.classList.add("grow");
    topRight.appendChild(transitionsCard);
  }

  const combinedKalaCard = renderCombinedKalaCard(day);
  if (combinedKalaCard) cardsRoot.appendChild(combinedKalaCard);
  const muhurtaPeriodsCard = renderMuhurtaPeriodCard(day);
  if (muhurtaPeriodsCard) cardsRoot.appendChild(muhurtaPeriodsCard);
  const yearCard = renderYearCard(day);
  if (yearCard) yearCard.classList.add("full");
  if (yearCard) cardsRoot.appendChild(yearCard);
}

function setToday() {
  const now = new Date();
  dateInput.value = now.toISOString().slice(0, 10);
  render();
}

todayBtn.addEventListener("click", setToday);
dateInput.addEventListener("change", render);

loadJson("./panchanga_json/panchanga_bangalore_2026.json");
