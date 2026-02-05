const yearSelect = document.querySelector("#yearSelect");
const fromDate = document.querySelector("#fromDate");
const toDate = document.querySelector("#toDate");
const applyBtn = document.querySelector("#applyBtn");
const clearBtn = document.querySelector("#clearBtn");
const exportIcsBtn = document.querySelector("#exportIcs");
const exportPdfBtn = document.querySelector("#exportPdf");
const builderMeta = document.querySelector("#builderMeta");
const resultsMeta = document.querySelector("#resultsMeta");
const resultsRoot = document.querySelector("#results");
const filterGroups = document.querySelector("#filterGroups");
const quickRangeButtons = document.querySelectorAll(".quick-range [data-range]");
const kundliMode = document.querySelector("#kundliMode");

const strictMatch = document.querySelector("#strictMatch");

let data = null;
let tzHours = 0;
let bandNames = {};
let lastResults = [];

const years = [2025, 2026, 2027];

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

const selectedFilters = {
  vara: new Set(),
  tithi: new Set(),
  nakshatra: new Set(),
  pada: new Set(),
  yoga: new Set(),
  karana: new Set(),
  hora: new Set(),
  dayNight: new Set(),
  lagna: new Set(),
  ritu: new Set(),
  ayana: new Set(),
  solarMonth: new Set(),
  lunarAmanta: new Set(),
  lunarPurnimanta: new Set(),
  lunarAmantaType: new Set(),
  lunarPurnimantaType: new Set(),
  muhurtaGood: new Set(),
  muhurtaBad: new Set(),
  planetNakshatra: new Set(),
  planetMotion: new Set(),
  planetCombust: new Set(),
};

const filterModes = {
  vara: "or",
  tithi: "or",
  nakshatra: "or",
  pada: "or",
  yoga: "or",
  karana: "or",
  hora: "or",
  dayNight: "or",
  lagna: "or",
  ritu: "or",
  ayana: "or",
  solarMonth: "or",
  lunarAmanta: "or",
  lunarPurnimanta: "or",
  lunarAmantaType: "or",
  lunarPurnimantaType: "or",
  muhurtaGood: "or",
  muhurtaBad: "or",
  planetNakshatra: "or",
  planetMotion: "or",
  planetCombust: "or",
};

const filterPolarity = {
  vara: "include",
  tithi: "include",
  nakshatra: "include",
  pada: "include",
  yoga: "include",
  karana: "include",
  hora: "include",
  dayNight: "include",
  lagna: "include",
  ritu: "include",
  ayana: "include",
  solarMonth: "include",
  lunarAmanta: "include",
  lunarPurnimanta: "include",
  lunarAmantaType: "include",
  lunarPurnimantaType: "include",
  muhurtaGood: "include",
  muhurtaBad: "include",
  planetNakshatra: "include",
  planetMotion: "include",
  planetCombust: "include",
};

const PLANET_NAKSHATRA_BANDS = [
  { key: "sun", label: "Sun", short: "Su", band: "sun_nakshatra" },
  { key: "moon", label: "Moon", short: "Mo", band: "moon_nakshatra" },
  { key: "mars", label: "Mars", short: "Ma", band: "mars_nakshatra" },
  { key: "mercury", label: "Mercury", short: "Me", band: "mercury_nakshatra" },
  { key: "jupiter", label: "Jupiter", short: "Ju", band: "jupiter_nakshatra" },
  { key: "venus", label: "Venus", short: "Ve", band: "venus_nakshatra" },
  { key: "saturn", label: "Saturn", short: "Sa", band: "saturn_nakshatra" },
  { key: "rahu", label: "Rahu", short: "Ra", band: "rahu_nakshatra" },
  { key: "ketu", label: "Ketu", short: "Ke", band: "ketu_nakshatra" },
];

const PLANET_MOTION_BANDS = [
  { key: "mars", label: "Mars", short: "Ma", band: "mars_motion" },
  { key: "mercury", label: "Mercury", short: "Me", band: "mercury_motion" },
  { key: "jupiter", label: "Jupiter", short: "Ju", band: "jupiter_motion" },
  { key: "venus", label: "Venus", short: "Ve", band: "venus_motion" },
  { key: "saturn", label: "Saturn", short: "Sa", band: "saturn_motion" },
];

const PLANET_COMBUST_BANDS = [
  { key: "mars", label: "Mars", short: "Ma", band: "mars_combust" },
  { key: "mercury", label: "Mercury", short: "Me", band: "mercury_combust" },
  { key: "jupiter", label: "Jupiter", short: "Ju", band: "jupiter_combust" },
  { key: "venus", label: "Venus", short: "Ve", band: "venus_combust" },
  { key: "saturn", label: "Saturn", short: "Sa", band: "saturn_combust" },
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
  { band: "muhurta_auspicious", label: "Auspicious Muhurta Yogas" },
  { band: "muhurta_inauspicious", label: "Inauspicious Muhurta Yogas" },
];

const MUHURTA_SKIP = new Set([
  "rahukalam",
  "rahukala",
  "gulikalam",
  "gulikakalam",
  "gulika",
  "yamaganda",
]);

function shouldSkipMuhurtaLabel(text) {
  const normalized = String(text || "").toLowerCase().replace(/[^a-z]/g, "");
  for (const key of MUHURTA_SKIP) {
    if (normalized.includes(key)) return true;
  }
  return false;
}

function isRetrogradeLabel(label) {
  if (!label) return false;
  const text = String(label).toLowerCase();
  return text.includes("retro") || text.includes("rx");
}

function isCombustLabel(label) {
  if (!label) return false;
  const text = String(label).toLowerCase();
  if (text.includes("non") && text.includes("combust")) return false;
  if (text.includes("not") && text.includes("combust")) return false;
  if (text.includes("no") && text.includes("combust")) return false;
  return text.includes("combust");
}

function loadJson(year) {
  const path = `./panchanga_json/panchanga_bangalore_${year}.json`;
  return fetch(path)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load ${path}`);
      return res.json();
    })
    .then((json) => {
      data = json;
      tzHours = parseFloat(data.meta?.tz_hours ?? 0);
      bandNames = data.band_names || {};
      builderMeta.textContent = `${data.meta?.city_name || ""} ${data.meta?.year || ""} • tz ${tzHours}`;
      buildFilterGroups();
      setDefaultDates();
      renderResults([]);
    })
    .catch((err) => {
      builderMeta.textContent = `Error: ${err.message}`;
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

function fmtDateLabel(jd) {
  const local = toLocal(jdToDate(jd));
  return local.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getIntervalsForBand(band) {
  if (!data?.bands?.[band]) return [];
  return data.bands[band].intervals || [];
}

function getIntervalContainingJd(band, jd) {
  const intervals = getIntervalsForBand(band);
  for (const iv of intervals) {
    if (iv[0] <= jd && jd < iv[1]) return iv;
  }
  return null;
}

function getValueInfoAtJd(band, jd) {
  const interval = getIntervalContainingJd(band, jd);
  if (!interval) return { label: "--", valueInt: null };
  return { label: formatIntervalLabel(band, interval), valueInt: interval[2] };
}

function signShortFromValue(valueInt) {
  if (!valueInt || valueInt < 1 || valueInt > 12) return null;
  return SIGN_SHORTS[valueInt - 1];
}

function lookupValueLabel(band, valueInt) {
  if (valueInt === null || valueInt === undefined) return "";
  const key = String(valueInt);
  const namesForBand = bandNames[band];
  if (namesForBand && namesForBand[key]) return namesForBand[key];
  const array = data.lookups?.[band];
  if (Array.isArray(array) && array.length > 0) {
    const idx = valueInt - 1;
    if (idx >= 0 && idx < array.length) return array[idx];
  }
  return "";
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
  if (!interval) return "--";
  return formatIntervalLabel(band, interval);
}

function getHoraAtJd(jd) {
  const dayInterval = getIntervalContainingJd("hora_day", jd);
  if (dayInterval) return formatIntervalLabel("hora_day", dayInterval);
  const nightInterval = getIntervalContainingJd("hora_night", jd);
  if (nightInterval) return formatIntervalLabel("hora_night", nightInterval);
  return "--";
}

function getDayPartAtJd(jd) {
  const daylight = getIntervalContainingJd("daylight", jd);
  return daylight ? "Day" : "Night";
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

  return { dayStartJd, sunriseJd, sunsetJd, nextSunriseJd };
}

function uniqueValues(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (!value || value === "--") return false;
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function buildFilterGroups() {
  if (!filterGroups || !data) return;
  filterGroups.innerHTML = "";

  const makeModeToggle = (groupKey) => {
    const wrap = document.createElement("div");
    wrap.className = "filter-mode";
    const anyBtn = document.createElement("button");
    anyBtn.type = "button";
    anyBtn.className = "filter-mode-button";
    anyBtn.textContent = "Any";
    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "filter-mode-button";
    allBtn.textContent = "All";
    const sync = () => {
      const mode = filterModes[groupKey] || "or";
      anyBtn.classList.toggle("active", mode === "or");
      allBtn.classList.toggle("active", mode === "and");
    };
    anyBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      filterModes[groupKey] = "or";
      sync();
    });
    allBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      filterModes[groupKey] = "and";
      sync();
    });
    wrap.append(anyBtn, allBtn);
    sync();
    return wrap;
  };

  const makePolarityToggle = (groupKey) => {
    const wrap = document.createElement("div");
    wrap.className = "filter-polarity";
    const includeBtn = document.createElement("button");
    includeBtn.type = "button";
    includeBtn.className = "filter-polarity-button";
    includeBtn.textContent = "Include";
    const excludeBtn = document.createElement("button");
    excludeBtn.type = "button";
    excludeBtn.className = "filter-polarity-button";
    excludeBtn.textContent = "Exclude";
    const sync = () => {
      const mode = filterPolarity[groupKey] || "include";
      includeBtn.classList.toggle("active", mode === "include");
      excludeBtn.classList.toggle("active", mode === "exclude");
    };
    includeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      filterPolarity[groupKey] = "include";
      sync();
    });
    excludeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      filterPolarity[groupKey] = "exclude";
      sync();
    });
    wrap.append(includeBtn, excludeBtn);
    sync();
    return wrap;
  };

  const groups = [
    { key: "tithi", title: "Tithi", values: uniqueValues(data.lookups?.tithi || []) },
    { key: "vara", title: "Vara", values: uniqueValues(data.lookups?.vara || []) },
    { key: "nakshatra", title: "Nakshatra", values: uniqueValues(data.lookups?.nakshatra || []) },
    {
      key: "pada",
      title: "Nakshatra Pada",
      values: uniqueValues(
        (data.lookups?.nak_pada && data.lookups.nak_pada.length
          ? data.lookups.nak_pada
          : Object.values(data.band_names?.nak_pada || {}).length
          ? Object.values(data.band_names?.nak_pada || {})
          : ["1", "2", "3", "4"])
      ),
    },
    { key: "yoga", title: "Yoga", values: uniqueValues(data.lookups?.yoga || []) },
    { key: "karana", title: "Karana", values: uniqueValues(data.lookups?.karana || []) },
    {
      key: "hora",
      title: "Hora",
      values: uniqueValues(
        (data.lookups?.hora && data.lookups.hora.length
          ? data.lookups.hora
          : Object.values(data.band_names?.hora || {}))
      ),
    },
    { key: "dayNight", title: "Day / Night", values: ["Day", "Night"] },
    { key: "lagna", title: "Lagna", values: uniqueValues(data.lookups?.lagna || []) },
    { key: "ritu", title: "Ritu", values: uniqueValues(data.lookups?.ritu || []) },
    { key: "ayana", title: "Ayana", values: uniqueValues(data.lookups?.ayana || []) },
    { key: "solarMonth", title: "Solar Month", values: uniqueValues(Object.values(data.band_names?.solar_month || {})) },
    { key: "lunarAmanta", title: "Lunar Month (Amanta)", values: uniqueValues(Object.values(data.band_names?.lunar_month_amanta || {})) },
    { key: "lunarPurnimanta", title: "Lunar Month (Purnimanta)", values: uniqueValues(Object.values(data.band_names?.lunar_month_poornimanta || {})) },
    {
      key: "lunarAmantaType",
      title: "Maasa Type (Amanta)",
      values: uniqueValues(Object.values(data.band_names?.lunar_month_amanta_type || {})),
    },
    {
      key: "lunarPurnimantaType",
      title: "Maasa Type (Purnimanta)",
      values: uniqueValues(Object.values(data.band_names?.lunar_month_poornimanta_type || {})),
    },
  ].filter((group) => group.values && group.values.length);

  groups.forEach((group) => {
    const wrap = document.createElement("div");
    wrap.className = "filter-group collapsed";
    const header = document.createElement("div");
    header.className = "filter-group-header";
    const controls = document.createElement("div");
    controls.className = "filter-group-controls";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "filter-group-toggle";
    const title = document.createElement("div");
    title.className = "filter-group-title";
    title.textContent = group.title;
    const chevron = document.createElement("span");
    chevron.className = "chevron";
    chevron.textContent = "▾";
    toggle.append(title, chevron);
    toggle.addEventListener("click", () => wrap.classList.toggle("collapsed"));
    controls.append(makeModeToggle(group.key), makePolarityToggle(group.key));
    header.append(toggle, controls);
    const options = document.createElement("div");
    options.className = "filter-options";
    group.values.forEach((value) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "filter-chip";
      chip.textContent = value;
      chip.addEventListener("click", () => toggleFilter(group.key, value, chip));
      options.appendChild(chip);
    });
    wrap.append(header, options);
    filterGroups.appendChild(wrap);
  });

  const planetNakGroup = document.createElement("div");
  planetNakGroup.className = "filter-group collapsed";
  const planetNakHeader = document.createElement("div");
  planetNakHeader.className = "filter-group-header";
  const planetNakControls = document.createElement("div");
  planetNakControls.className = "filter-group-controls";
  const planetNakToggle = document.createElement("button");
  planetNakToggle.type = "button";
  planetNakToggle.className = "filter-group-toggle";
  const planetNakTitle = document.createElement("div");
  planetNakTitle.className = "filter-group-title";
  planetNakTitle.textContent = "Planet Nakshatra";
  const planetNakChevron = document.createElement("span");
  planetNakChevron.className = "chevron";
  planetNakChevron.textContent = "▾";
  planetNakToggle.append(planetNakTitle, planetNakChevron);
  planetNakToggle.addEventListener("click", () => planetNakGroup.classList.toggle("collapsed"));
  planetNakControls.append(makeModeToggle("planetNakshatra"), makePolarityToggle("planetNakshatra"));
  planetNakHeader.append(planetNakToggle, planetNakControls);
  const planetNakOptions = document.createElement("div");
  planetNakOptions.className = "filter-options";
  const nakshatras = uniqueValues(data.lookups?.nakshatra || []);
  PLANET_NAKSHATRA_BANDS.forEach((planet) => {
    nakshatras.forEach((nak) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "filter-chip";
      chip.textContent = `${planet.short} · ${nak}`;
      chip.addEventListener("click", () => toggleFilter("planetNakshatra", `${planet.key}:${nak}`, chip));
      planetNakOptions.appendChild(chip);
    });
  });
  planetNakGroup.append(planetNakHeader, planetNakOptions);
  filterGroups.appendChild(planetNakGroup);

  const planetMotionGroup = document.createElement("div");
  planetMotionGroup.className = "filter-group collapsed";
  const planetMotionHeader = document.createElement("div");
  planetMotionHeader.className = "filter-group-header";
  const planetMotionControls = document.createElement("div");
  planetMotionControls.className = "filter-group-controls";
  const planetMotionToggle = document.createElement("button");
  planetMotionToggle.type = "button";
  planetMotionToggle.className = "filter-group-toggle";
  const planetMotionTitle = document.createElement("div");
  planetMotionTitle.className = "filter-group-title";
  planetMotionTitle.textContent = "Planet Motion";
  const planetMotionChevron = document.createElement("span");
  planetMotionChevron.className = "chevron";
  planetMotionChevron.textContent = "▾";
  planetMotionToggle.append(planetMotionTitle, planetMotionChevron);
  planetMotionToggle.addEventListener("click", () => planetMotionGroup.classList.toggle("collapsed"));
  planetMotionControls.append(makeModeToggle("planetMotion"), makePolarityToggle("planetMotion"));
  planetMotionHeader.append(planetMotionToggle, planetMotionControls);
  const planetMotionOptions = document.createElement("div");
  planetMotionOptions.className = "filter-options";
  PLANET_MOTION_BANDS.forEach((planet) => {
    [
      { key: "direct", label: "Direct" },
      { key: "retro", label: "Retro" },
    ].forEach((state) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `filter-chip ${state.key === "retro" ? "bad" : "good"}`;
      chip.textContent = `${planet.short} · ${state.label}`;
      chip.addEventListener("click", () => toggleFilter("planetMotion", `${planet.key}:${state.key}`, chip));
      planetMotionOptions.appendChild(chip);
    });
  });
  planetMotionGroup.append(planetMotionHeader, planetMotionOptions);
  filterGroups.appendChild(planetMotionGroup);

  const planetCombustGroup = document.createElement("div");
  planetCombustGroup.className = "filter-group collapsed";
  const planetCombustHeader = document.createElement("div");
  planetCombustHeader.className = "filter-group-header";
  const planetCombustControls = document.createElement("div");
  planetCombustControls.className = "filter-group-controls";
  const planetCombustToggle = document.createElement("button");
  planetCombustToggle.type = "button";
  planetCombustToggle.className = "filter-group-toggle";
  const planetCombustTitle = document.createElement("div");
  planetCombustTitle.className = "filter-group-title";
  planetCombustTitle.textContent = "Planet Combust";
  const planetCombustChevron = document.createElement("span");
  planetCombustChevron.className = "chevron";
  planetCombustChevron.textContent = "▾";
  planetCombustToggle.append(planetCombustTitle, planetCombustChevron);
  planetCombustToggle.addEventListener("click", () => planetCombustGroup.classList.toggle("collapsed"));
  planetCombustControls.append(makeModeToggle("planetCombust"), makePolarityToggle("planetCombust"));
  planetCombustHeader.append(planetCombustToggle, planetCombustControls);
  const planetCombustOptions = document.createElement("div");
  planetCombustOptions.className = "filter-options";
  PLANET_COMBUST_BANDS.forEach((planet) => {
    [
      { key: "clear", label: "Clear", className: "good" },
      { key: "combust", label: "Combust", className: "bad" },
    ].forEach((state) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `filter-chip ${state.className}`;
      chip.textContent = `${planet.short} · ${state.label}`;
      chip.addEventListener("click", () => toggleFilter("planetCombust", `${planet.key}:${state.key}`, chip));
      planetCombustOptions.appendChild(chip);
    });
  });
  planetCombustGroup.append(planetCombustHeader, planetCombustOptions);
  filterGroups.appendChild(planetCombustGroup);

  const buildMuhurtaGroup = (band, label, groupKey, chipClass) => {
    const group = document.createElement("div");
    group.className = "filter-group collapsed";
    const header = document.createElement("div");
    header.className = "filter-group-header";
    const controls = document.createElement("div");
    controls.className = "filter-group-controls";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "filter-group-toggle";
    const title = document.createElement("div");
    title.className = "filter-group-title";
    title.textContent = label;
    const chevron = document.createElement("span");
    chevron.className = "chevron";
    chevron.textContent = "▾";
    toggle.append(title, chevron);
    toggle.addEventListener("click", () => group.classList.toggle("collapsed"));
    controls.append(makeModeToggle(groupKey), makePolarityToggle(groupKey));
    header.append(toggle, controls);
    const options = document.createElement("div");
    options.className = "filter-options";
    const names = bandNames[band] || {};
    Object.keys(names).forEach((key) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `filter-chip ${chipClass}`;
      chip.textContent = names[key];
      const value = `${band}:${key}`;
      chip.addEventListener("click", () => toggleFilter(groupKey, value, chip));
      options.appendChild(chip);
    });
    group.append(header, options);
    return group;
  };

  filterGroups.appendChild(
    buildMuhurtaGroup("muhurta_auspicious", "Muhurta Yogas (Auspicious)", "muhurtaGood", "good")
  );
  filterGroups.appendChild(
    buildMuhurtaGroup("muhurta_inauspicious", "Muhurta Yogas (Inauspicious)", "muhurtaBad", "bad")
  );
}

function toggleFilter(group, value, chip) {
  const set = selectedFilters[group];
  if (!set) return;
  if (set.has(value)) {
    set.delete(value);
    chip.classList.remove("active");
  } else {
    set.add(value);
    chip.classList.add("active");
  }
}

function matchSingle(value, set, mode) {
  if (set.size === 0) return true;
  if (mode === "and") return set.size === 1 && set.has(value);
  return set.has(value);
}

function matchSet(metaSet, set, mode) {
  if (set.size === 0) return true;
  if (mode === "and") return Array.from(set).every((key) => metaSet.has(key));
  return Array.from(set).some((key) => metaSet.has(key));
}

function matchSingleWithPolarity(value, set, mode, polarity) {
  if (set.size === 0) return true;
  if (polarity === "exclude") return !set.has(value);
  return matchSingle(value, set, mode);
}

function matchSetWithPolarity(metaSet, set, mode, polarity) {
  if (set.size === 0) return true;
  if (polarity === "exclude") return !Array.from(set).some((key) => metaSet.has(key));
  return matchSet(metaSet, set, mode);
}

function getWindows(band, startJd, endJd) {
  const intervals = getIntervalsForBand(band);
  return intervals
    .filter((iv) => iv[1] > startJd && iv[0] < endJd)
    .map((iv) => ({
      start: Math.max(startJd, iv[0]),
      end: Math.min(endJd, iv[1]),
      label: formatIntervalLabel(band, iv),
    }));
}

function getLabeledWindows(band, startJd, endJd) {
  const intervals = getIntervalsForBand(band);
  return intervals
    .filter((iv) => iv[1] > startJd && iv[0] < endJd)
    .map((iv) => ({
      start: Math.max(startJd, iv[0]),
      end: Math.min(endJd, iv[1]),
      label: formatIntervalLabel(band, iv),
    }))
    .filter((window) => window.label && window.label !== "--");
}

function getWindowsWithId(band, startJd, endJd) {
  const intervals = getIntervalsForBand(band);
  return intervals
    .filter((iv) => iv[1] > startJd && iv[0] < endJd)
    .map((iv) => ({
      start: Math.max(startJd, iv[0]),
      end: Math.min(endJd, iv[1]),
      label: formatIntervalLabel(band, iv),
      value: iv[2],
    }))
    .filter((window) => window.label && window.label !== "--");
}

function getDateRange() {
  if (!fromDate.value || !toDate.value) return [];
  const start = new Date(fromDate.value);
  const end = new Date(toDate.value);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  if (end < start) return [];
  const year = parseInt(yearSelect.value, 10);
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31));
  if (start < yearStart) start.setTime(yearStart.getTime());
  if (end > yearEnd) end.setTime(yearEnd.getTime());
  const dates = [];
  const current = new Date(start.getTime());
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function collectDayMeta(dateStr) {
  const { sunriseJd, sunsetJd, nextSunriseJd } = computeDayWindow(dateStr);
  const vara = getValueAtJd("vara", sunriseJd);
  const tithi = getValueAtJd("tithi", sunriseJd);
  const nakshatra = getValueAtJd("nakshatra", sunriseJd);
  const pada = getValueAtJd("nak_pada", sunriseJd);
  const yoga = getValueAtJd("yoga", sunriseJd);
  const karana = getValueAtJd("karana", sunriseJd);
  const hora = getHoraAtJd(sunriseJd);
  const dayPart = getDayPartAtJd(sunriseJd);
  const lagna = getValueAtJd("lagna", sunriseJd);
  const ritu = getValueAtJd("ritu", sunriseJd);
  const ayana = getValueAtJd("ayana", sunriseJd);
  const solarMonth = getValueAtJd("solar_month", sunriseJd);
  const lunarAmanta = getValueAtJd("lunar_month_amanta", sunriseJd);
  const lunarPurnimanta = getValueAtJd("lunar_month_poornimanta", sunriseJd);
  const lunarAmantaType = getValueAtJd("lunar_month_amanta_type", sunriseJd);
  const lunarPurnimantaType = getValueAtJd("lunar_month_poornimanta_type", sunriseJd);

  const muhurtaKeys = new Set();
  ["muhurta_auspicious", "muhurta_inauspicious"].forEach((band) => {
    const intervals = getIntervalsForBand(band);
    intervals.forEach((iv) => {
      const start = Math.max(sunriseJd, iv[0]);
      const end = Math.min(nextSunriseJd, iv[1]);
      if (end > start && iv[2] !== null && iv[2] !== undefined) {
        muhurtaKeys.add(`${band}:${iv[2]}`);
      }
    });
  });
  const muhurtaGoodKeys = new Set();
  const muhurtaBadKeys = new Set();
  muhurtaKeys.forEach((key) => {
    if (key.startsWith("muhurta_auspicious:")) muhurtaGoodKeys.add(key);
    if (key.startsWith("muhurta_inauspicious:")) muhurtaBadKeys.add(key);
  });

  const planetNakshatraKeys = new Set();
  PLANET_NAKSHATRA_BANDS.forEach((planet) => {
    const value = getValueAtJd(planet.band, sunriseJd);
    if (value && value !== "--") planetNakshatraKeys.add(`${planet.key}:${value}`);
  });

  const planetMotionKeys = new Set();
  PLANET_MOTION_BANDS.forEach((planet) => {
    const label = getValueAtJd(planet.band, sunriseJd);
    if (!label || label === "--") return;
    planetMotionKeys.add(`${planet.key}:${isRetrogradeLabel(label) ? "retro" : "direct"}`);
  });

  const planetCombustKeys = new Set();
  PLANET_COMBUST_BANDS.forEach((planet) => {
    const interval = getIntervalContainingJd(planet.band, sunriseJd);
    if (!interval) {
      planetCombustKeys.add(`${planet.key}:clear`);
      return;
    }
    const label = formatIntervalLabel(planet.band, interval);
    planetCombustKeys.add(`${planet.key}:${isCombustLabel(label) ? "combust" : "clear"}`);
  });

  return {
    dateStr,
    sunriseJd,
    sunsetJd,
    nextSunriseJd,
    vara,
    tithi,
    nakshatra,
    pada,
    yoga,
    karana,
    hora,
    dayPart,
    lagna,
    ritu,
    ayana,
    solarMonth,
    lunarAmanta,
    lunarPurnimanta,
    lunarAmantaType,
    lunarPurnimantaType,
    muhurtaKeys,
    muhurtaGoodKeys,
    muhurtaBadKeys,
    planetNakshatraKeys,
    planetMotionKeys,
    planetCombustKeys,
  };
}

function collectMetaAtJd(jd) {
  const vara = getValueAtJd("vara", jd);
  const tithi = getValueAtJd("tithi", jd);
  const nakshatra = getValueAtJd("nakshatra", jd);
  const pada = getValueAtJd("nak_pada", jd);
  const yoga = getValueAtJd("yoga", jd);
  const karana = getValueAtJd("karana", jd);
  const hora = getHoraAtJd(jd);
  const dayPart = getDayPartAtJd(jd);
  const lagna = getValueAtJd("lagna", jd);
  const ritu = getValueAtJd("ritu", jd);
  const ayana = getValueAtJd("ayana", jd);
  const solarMonth = getValueAtJd("solar_month", jd);
  const lunarAmanta = getValueAtJd("lunar_month_amanta", jd);
  const lunarPurnimanta = getValueAtJd("lunar_month_poornimanta", jd);
  const lunarAmantaType = getValueAtJd("lunar_month_amanta_type", jd);
  const lunarPurnimantaType = getValueAtJd("lunar_month_poornimanta_type", jd);

  const muhurtaKeys = new Set();
  ["muhurta_auspicious", "muhurta_inauspicious"].forEach((band) => {
    const interval = getIntervalContainingJd(band, jd);
    if (interval && interval[2] !== null && interval[2] !== undefined) {
      muhurtaKeys.add(`${band}:${interval[2]}`);
    }
  });
  const muhurtaGoodKeys = new Set();
  const muhurtaBadKeys = new Set();
  muhurtaKeys.forEach((key) => {
    if (key.startsWith("muhurta_auspicious:")) muhurtaGoodKeys.add(key);
    if (key.startsWith("muhurta_inauspicious:")) muhurtaBadKeys.add(key);
  });

  const planetNakshatraKeys = new Set();
  PLANET_NAKSHATRA_BANDS.forEach((planet) => {
    const value = getValueAtJd(planet.band, jd);
    if (value && value !== "--") planetNakshatraKeys.add(`${planet.key}:${value}`);
  });

  const planetMotionKeys = new Set();
  PLANET_MOTION_BANDS.forEach((planet) => {
    const label = getValueAtJd(planet.band, jd);
    if (!label || label === "--") return;
    planetMotionKeys.add(`${planet.key}:${isRetrogradeLabel(label) ? "retro" : "direct"}`);
  });

  const planetCombustKeys = new Set();
  PLANET_COMBUST_BANDS.forEach((planet) => {
    const interval = getIntervalContainingJd(planet.band, jd);
    if (!interval) {
      planetCombustKeys.add(`${planet.key}:clear`);
      return;
    }
    const label = formatIntervalLabel(planet.band, interval);
    planetCombustKeys.add(`${planet.key}:${isCombustLabel(label) ? "combust" : "clear"}`);
  });

  return {
    vara,
    tithi,
    nakshatra,
    pada,
    yoga,
    karana,
    hora,
    dayPart,
    lagna,
    ritu,
    ayana,
    solarMonth,
    lunarAmanta,
    lunarPurnimanta,
    lunarAmantaType,
    lunarPurnimantaType,
    muhurtaKeys,
    muhurtaGoodKeys,
    muhurtaBadKeys,
    planetNakshatraKeys,
    planetMotionKeys,
    planetCombustKeys,
  };
}

function matchesFilters(meta) {
  return (
    matchSingleWithPolarity(meta.tithi, selectedFilters.tithi, filterModes.tithi, filterPolarity.tithi) &&
    matchSingleWithPolarity(meta.vara, selectedFilters.vara, filterModes.vara, filterPolarity.vara) &&
    matchSingleWithPolarity(meta.nakshatra, selectedFilters.nakshatra, filterModes.nakshatra, filterPolarity.nakshatra) &&
    matchSingleWithPolarity(meta.pada, selectedFilters.pada, filterModes.pada, filterPolarity.pada) &&
    matchSingleWithPolarity(meta.yoga, selectedFilters.yoga, filterModes.yoga, filterPolarity.yoga) &&
    matchSingleWithPolarity(meta.karana, selectedFilters.karana, filterModes.karana, filterPolarity.karana) &&
    matchSingleWithPolarity(meta.hora, selectedFilters.hora, filterModes.hora, filterPolarity.hora) &&
    matchSingleWithPolarity(meta.dayPart, selectedFilters.dayNight, filterModes.dayNight, filterPolarity.dayNight) &&
    matchSingleWithPolarity(meta.lagna, selectedFilters.lagna, filterModes.lagna, filterPolarity.lagna) &&
    matchSingleWithPolarity(meta.ritu, selectedFilters.ritu, filterModes.ritu, filterPolarity.ritu) &&
    matchSingleWithPolarity(meta.ayana, selectedFilters.ayana, filterModes.ayana, filterPolarity.ayana) &&
    matchSingleWithPolarity(meta.solarMonth, selectedFilters.solarMonth, filterModes.solarMonth, filterPolarity.solarMonth) &&
    matchSingleWithPolarity(
      meta.lunarAmanta,
      selectedFilters.lunarAmanta,
      filterModes.lunarAmanta,
      filterPolarity.lunarAmanta
    ) &&
    matchSingleWithPolarity(
      meta.lunarPurnimanta,
      selectedFilters.lunarPurnimanta,
      filterModes.lunarPurnimanta,
      filterPolarity.lunarPurnimanta
    ) &&
    matchSingleWithPolarity(
      meta.lunarAmantaType,
      selectedFilters.lunarAmantaType,
      filterModes.lunarAmantaType,
      filterPolarity.lunarAmantaType
    ) &&
    matchSingleWithPolarity(
      meta.lunarPurnimantaType,
      selectedFilters.lunarPurnimantaType,
      filterModes.lunarPurnimantaType,
      filterPolarity.lunarPurnimantaType
    ) &&
    matchSetWithPolarity(
      meta.muhurtaGoodKeys,
      selectedFilters.muhurtaGood,
      filterModes.muhurtaGood,
      filterPolarity.muhurtaGood
    ) &&
    (filterPolarity.muhurtaBad === "exclude"
      ? true
      : matchSetWithPolarity(
          meta.muhurtaBadKeys,
          selectedFilters.muhurtaBad,
          filterModes.muhurtaBad,
          filterPolarity.muhurtaBad
        )) &&
    matchSetWithPolarity(
      meta.planetNakshatraKeys,
      selectedFilters.planetNakshatra,
      filterModes.planetNakshatra,
      filterPolarity.planetNakshatra
    ) &&
    matchSetWithPolarity(
      meta.planetMotionKeys,
      selectedFilters.planetMotion,
      filterModes.planetMotion,
      filterPolarity.planetMotion
    ) &&
    matchSetWithPolarity(
      meta.planetCombustKeys,
      selectedFilters.planetCombust,
      filterModes.planetCombust,
      filterPolarity.planetCombust
    )
  );
}

function buildFilterOnlySections(meta) {
  const sections = [];
  const useStrictMatch = !!strictMatch?.checked;

  const activeFilterCount = () => {
    return Object.values(selectedFilters).reduce((count, set) => count + (set.size ? 1 : 0), 0);
  };

  const mergeIntervals = (intervals) => {
    if (!intervals.length) return [];
    const sorted = intervals.slice().sort((a, b) => a.start - b.start);
    const merged = [sorted[0]];
    for (let i = 1; i < sorted.length; i += 1) {
      const last = merged[merged.length - 1];
      const current = sorted[i];
      if (current.start <= last.end) {
        last.end = Math.max(last.end, current.end);
      } else {
        merged.push({ start: current.start, end: current.end });
      }
    }
    return merged;
  };

  const subtractIntervals = (window, excludes) => {
    if (!excludes.length) return [window];
    let segments = [{ start: window.start, end: window.end }];
    excludes.forEach((block) => {
      segments = segments.flatMap((seg) => {
        if (block.end <= seg.start || block.start >= seg.end) return [seg];
        const next = [];
        if (block.start > seg.start) next.push({ start: seg.start, end: Math.min(block.start, seg.end) });
        if (block.end < seg.end) next.push({ start: Math.max(block.end, seg.start), end: seg.end });
        return next;
      });
    });
    return segments.filter((seg) => seg.end > seg.start);
  };

  const applyExclusions = (windows, excludes) => {
    if (!excludes.length) return windows;
    return windows.flatMap((window) =>
      subtractIntervals(window, excludes).map((seg) => ({
        ...window,
        start: seg.start,
        end: seg.end,
      }))
    );
  };

  let excludeIntervals = [];
  if (selectedFilters.muhurtaBad.size && filterPolarity.muhurtaBad === "exclude") {
    const grouped = new Set();
    selectedFilters.muhurtaBad.forEach((value) => {
      const [, id] = value.split(":");
      grouped.add(Number(id));
    });
    const windows = getWindowsWithId("muhurta_inauspicious", meta.sunriseJd, meta.nextSunriseJd).filter((window) =>
      grouped.has(window.value)
    );
    excludeIntervals = mergeIntervals(windows.map((window) => ({ start: window.start, end: window.end })));
  }

  const buildCombinedWindows = () => {
    const boundaries = new Set([meta.sunriseJd, meta.nextSunriseJd, meta.sunsetJd]);
    const addBandBoundaries = (band, start, end) => {
      getIntervalsForBand(band)
        .filter((iv) => iv[1] > start && iv[0] < end)
        .forEach((iv) => {
          boundaries.add(Math.max(start, iv[0]));
          boundaries.add(Math.min(end, iv[1]));
        });
    };

    if (selectedFilters.tithi.size) addBandBoundaries("tithi", meta.sunriseJd, meta.nextSunriseJd);
    if (selectedFilters.nakshatra.size) addBandBoundaries("nakshatra", meta.sunriseJd, meta.nextSunriseJd);
    if (selectedFilters.pada.size) addBandBoundaries("nak_pada", meta.sunriseJd, meta.nextSunriseJd);
    if (selectedFilters.yoga.size) addBandBoundaries("yoga", meta.sunriseJd, meta.nextSunriseJd);
    if (selectedFilters.karana.size) addBandBoundaries("karana", meta.sunriseJd, meta.nextSunriseJd);
    if (selectedFilters.ritu.size) addBandBoundaries("ritu", meta.sunriseJd, meta.nextSunriseJd);
    if (selectedFilters.ayana.size) addBandBoundaries("ayana", meta.sunriseJd, meta.nextSunriseJd);
    if (selectedFilters.solarMonth.size) addBandBoundaries("solar_month", meta.sunriseJd, meta.nextSunriseJd);
    if (selectedFilters.lunarAmanta.size) addBandBoundaries("lunar_month_amanta", meta.sunriseJd, meta.nextSunriseJd);
    if (selectedFilters.lunarPurnimanta.size) addBandBoundaries("lunar_month_poornimanta", meta.sunriseJd, meta.nextSunriseJd);
    if (selectedFilters.lunarAmantaType.size) addBandBoundaries("lunar_month_amanta_type", meta.sunriseJd, meta.nextSunriseJd);
    if (selectedFilters.lunarPurnimantaType.size) addBandBoundaries("lunar_month_poornimanta_type", meta.sunriseJd, meta.nextSunriseJd);

    if (selectedFilters.hora.size) {
      addBandBoundaries("hora_day", meta.sunriseJd, meta.sunsetJd);
      addBandBoundaries("hora_night", meta.sunsetJd, meta.nextSunriseJd);
    }

    if (selectedFilters.lagna.size) addBandBoundaries("lagna", meta.sunriseJd, meta.nextSunriseJd);
    if (selectedFilters.planetNakshatra.size) {
      PLANET_NAKSHATRA_BANDS.forEach((planet) => addBandBoundaries(planet.band, meta.sunriseJd, meta.nextSunriseJd));
    }
    if (selectedFilters.planetMotion.size) {
      PLANET_MOTION_BANDS.forEach((planet) => addBandBoundaries(planet.band, meta.sunriseJd, meta.nextSunriseJd));
    }
    if (selectedFilters.planetCombust.size) {
      PLANET_COMBUST_BANDS.forEach((planet) => addBandBoundaries(planet.band, meta.sunriseJd, meta.nextSunriseJd));
    }
    if (selectedFilters.muhurtaGood.size) addBandBoundaries("muhurta_auspicious", meta.sunriseJd, meta.nextSunriseJd);
    if (selectedFilters.muhurtaBad.size) addBandBoundaries("muhurta_inauspicious", meta.sunriseJd, meta.nextSunriseJd);

    const sorted = Array.from(boundaries).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
    const segments = [];
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const start = sorted[i];
      const end = sorted[i + 1];
      if (end <= start) continue;
      const mid = (start + end) / 2;
      const metaAt = collectMetaAtJd(mid);
      if (matchesFilters(metaAt)) {
        const labelParts = [];
        if (selectedFilters.tithi.size) labelParts.push(metaAt.tithi);
        if (selectedFilters.vara.size) labelParts.push(metaAt.vara);
        if (selectedFilters.nakshatra.size) labelParts.push(metaAt.nakshatra);
        if (selectedFilters.pada.size) labelParts.push(metaAt.pada);
        if (selectedFilters.yoga.size) labelParts.push(metaAt.yoga);
        if (selectedFilters.karana.size) labelParts.push(metaAt.karana);
        if (selectedFilters.hora.size) labelParts.push(metaAt.hora);
        if (selectedFilters.dayNight.size) labelParts.push(metaAt.dayPart);
        if (selectedFilters.lagna.size) labelParts.push(metaAt.lagna);
        if (selectedFilters.ritu.size) labelParts.push(metaAt.ritu);
        if (selectedFilters.ayana.size) labelParts.push(metaAt.ayana);
        if (selectedFilters.solarMonth.size) labelParts.push(metaAt.solarMonth);
        if (selectedFilters.lunarAmanta.size) labelParts.push(metaAt.lunarAmanta);
        if (selectedFilters.lunarPurnimanta.size) labelParts.push(metaAt.lunarPurnimanta);
        if (selectedFilters.lunarAmantaType.size) labelParts.push(metaAt.lunarAmantaType);
        if (selectedFilters.lunarPurnimantaType.size) labelParts.push(metaAt.lunarPurnimantaType);
        segments.push({ start, end, label: labelParts.join(" • ") || "Match" });
      }
    }
    const filtered = applyExclusions(segments, excludeIntervals).map((seg) => ({
      label: seg.label,
      ranges: [fmtRange(seg.start, seg.end)],
      startJd: seg.start,
      endJd: seg.end,
    }));
    if (!filtered.length) return [];
    return [
      {
        title: "Matching Windows",
        items: filtered,
      },
    ];
  };

  if (activeFilterCount() > 1 || useStrictMatch) {
    return buildCombinedWindows();
  }

  const addWindowSection = (title, band, selectedSet, polarityKey) => {
    if (!selectedSet.size) return;
    const polarity = filterPolarity[polarityKey] || "include";
    let windows = getLabeledWindows(band, meta.sunriseJd, meta.nextSunriseJd).filter((window) =>
      polarity === "exclude" ? !selectedSet.has(window.label) : selectedSet.has(window.label)
    );
    if (useStrictMatch) {
      windows = windows.filter((window) => matchesFilters(collectMetaAtJd((window.start + window.end) / 2)));
    }
    windows = applyExclusions(windows, excludeIntervals);
    if (!windows.length) return;
    sections.push({
      title,
      items: windows.map((window) => ({
        label: window.label,
        ranges: [fmtRange(window.start, window.end)],
        startJd: window.start,
        endJd: window.end,
      })),
    });
  };

  addWindowSection("Tithi", "tithi", selectedFilters.tithi, "tithi");
  addWindowSection("Nakshatra", "nakshatra", selectedFilters.nakshatra, "nakshatra");
  addWindowSection("Nakshatra Pada", "nak_pada", selectedFilters.pada, "pada");
  addWindowSection("Yoga", "yoga", selectedFilters.yoga, "yoga");
  addWindowSection("Karana", "karana", selectedFilters.karana, "karana");
  addWindowSection("Lagna", "lagna", selectedFilters.lagna, "lagna");
  addWindowSection("Ritu", "ritu", selectedFilters.ritu, "ritu");
  addWindowSection("Ayana", "ayana", selectedFilters.ayana, "ayana");
  addWindowSection("Solar Month", "solar_month", selectedFilters.solarMonth, "solarMonth");
  addWindowSection("Lunar Month (Amanta)", "lunar_month_amanta", selectedFilters.lunarAmanta, "lunarAmanta");
  addWindowSection("Lunar Month (Purnimanta)", "lunar_month_poornimanta", selectedFilters.lunarPurnimanta, "lunarPurnimanta");
  addWindowSection("Maasa Type (Amanta)", "lunar_month_amanta_type", selectedFilters.lunarAmantaType, "lunarAmantaType");
  addWindowSection("Maasa Type (Purnimanta)", "lunar_month_poornimanta_type", selectedFilters.lunarPurnimantaType, "lunarPurnimantaType");
  if (selectedFilters.hora.size) {
    const polarity = filterPolarity.hora || "include";
    const dayWindows = getLabeledWindows("hora_day", meta.sunriseJd, meta.sunsetJd);
    const nightWindows = getLabeledWindows("hora_night", meta.sunsetJd, meta.nextSunriseJd);
    let windows = [...dayWindows, ...nightWindows].filter((window) => {
      const has = selectedFilters.hora.has(window.label);
      return polarity === "exclude" ? !has : has;
    });
    if (useStrictMatch) {
      windows = windows.filter((window) => matchesFilters(collectMetaAtJd((window.start + window.end) / 2)));
    }
    windows = applyExclusions(windows, excludeIntervals);
    if (windows.length) {
      sections.push({
        title: "Hora",
        items: windows.map((window) => ({
          label: window.label,
          ranges: [fmtRange(window.start, window.end)],
          startJd: window.start,
          endJd: window.end,
        })),
      });
    }
  }

  if (selectedFilters.dayNight.size) {
    const polarity = filterPolarity.dayNight || "include";
    const dayWindow = { start: meta.sunriseJd, end: meta.sunsetJd, label: "Day" };
    const nightWindow = { start: meta.sunsetJd, end: meta.nextSunriseJd, label: "Night" };
    let windows = [dayWindow, nightWindow].filter((window) => {
      const has = selectedFilters.dayNight.has(window.label);
      return polarity === "exclude" ? !has : has;
    });
    if (useStrictMatch) {
      windows = windows.filter((window) => matchesFilters(collectMetaAtJd((window.start + window.end) / 2)));
    }
    windows = applyExclusions(windows, excludeIntervals);
    if (windows.length) {
      sections.push({
        title: "Day / Night",
        items: windows.map((window) => ({
          label: window.label,
          ranges: [fmtRange(window.start, window.end)],
          startJd: window.start,
          endJd: window.end,
        })),
      });
    }
  }

  if (selectedFilters.vara.size) {
    const polarity = filterPolarity.vara || "include";
    const match = polarity === "exclude" ? !selectedFilters.vara.has(meta.vara) : selectedFilters.vara.has(meta.vara);
    if (match) {
      let ranges = [{ start: meta.sunriseJd, end: meta.nextSunriseJd, label: meta.vara }];
      ranges = applyExclusions(ranges, excludeIntervals);
      sections.push({
        title: "Vara",
        items: ranges.map((seg) => ({
          label: meta.vara,
          ranges: [fmtRange(seg.start, seg.end)],
          startJd: seg.start,
          endJd: seg.end,
        })),
      });
    }
  }

  if (selectedFilters.planetNakshatra.size) {
    const grouped = {};
    selectedFilters.planetNakshatra.forEach((value) => {
      const [planet, nak] = value.split(":");
      if (!grouped[planet]) grouped[planet] = new Set();
      grouped[planet].add(nak);
    });
    const polarity = filterPolarity.planetNakshatra || "include";
    PLANET_NAKSHATRA_BANDS.forEach((planet) => {
      const wants = grouped[planet.key];
      if (!wants || wants.size === 0) return;
      let windows = getLabeledWindows(planet.band, meta.sunriseJd, meta.nextSunriseJd).filter((window) => {
        const has = wants.has(window.label);
        return polarity === "exclude" ? !has : has;
      });
      if (useStrictMatch) {
        windows = windows.filter((window) => matchesFilters(collectMetaAtJd((window.start + window.end) / 2)));
      }
      windows = applyExclusions(windows, excludeIntervals);
      if (!windows.length) return;
      sections.push({
        title: `${planet.label} Nakshatra`,
        items: windows.map((window) => ({
          label: window.label,
          ranges: [fmtRange(window.start, window.end)],
          startJd: window.start,
          endJd: window.end,
        })),
      });
    });
  }

  if (selectedFilters.planetMotion.size) {
    const grouped = {};
    selectedFilters.planetMotion.forEach((value) => {
      const [planet, state] = value.split(":");
      if (!grouped[planet]) grouped[planet] = new Set();
      grouped[planet].add(state);
    });
    const polarity = filterPolarity.planetMotion || "include";
    PLANET_MOTION_BANDS.forEach((planet) => {
      const wants = grouped[planet.key];
      if (!wants || wants.size === 0) return;
      let windows = getLabeledWindows(planet.band, meta.sunriseJd, meta.nextSunriseJd).filter((window) => {
        const state = isRetrogradeLabel(window.label) ? "retro" : "direct";
        const has = wants.has(state);
        return polarity === "exclude" ? !has : has;
      });
      if (useStrictMatch) {
        windows = windows.filter((window) => matchesFilters(collectMetaAtJd((window.start + window.end) / 2)));
      }
      windows = applyExclusions(windows, excludeIntervals);
      if (!windows.length) return;
      sections.push({
        title: `${planet.label} Motion`,
        items: windows.map((window) => ({
          label: isRetrogradeLabel(window.label) ? "Retro" : "Direct",
          ranges: [fmtRange(window.start, window.end)],
          startJd: window.start,
          endJd: window.end,
        })),
      });
    });
  }

  if (selectedFilters.planetCombust.size) {
    const grouped = {};
    selectedFilters.planetCombust.forEach((value) => {
      const [planet, state] = value.split(":");
      if (!grouped[planet]) grouped[planet] = new Set();
      grouped[planet].add(state);
    });
    const polarity = filterPolarity.planetCombust || "include";
    PLANET_COMBUST_BANDS.forEach((planet) => {
      const wants = grouped[planet.key];
      if (!wants || wants.size === 0) return;
      let windows = getLabeledWindows(planet.band, meta.sunriseJd, meta.nextSunriseJd).filter((window) => {
        const state = isCombustLabel(window.label) ? "combust" : "clear";
        const has = wants.has(state);
        return polarity === "exclude" ? !has : has;
      });
      if (useStrictMatch) {
        windows = windows.filter((window) => matchesFilters(collectMetaAtJd((window.start + window.end) / 2)));
      }
      windows = applyExclusions(windows, excludeIntervals);
      if (!windows.length) return;
      sections.push({
        title: `${planet.label} Combust`,
        items: windows.map((window) => ({
          label: isCombustLabel(window.label) ? "Combust" : "Clear",
          ranges: [fmtRange(window.start, window.end)],
          startJd: window.start,
          endJd: window.end,
        })),
      });
    });
  }

  if (selectedFilters.muhurtaGood.size) {
    const grouped = new Set();
    selectedFilters.muhurtaGood.forEach((value) => {
      const [, id] = value.split(":");
      grouped.add(Number(id));
    });
    const polarity = filterPolarity.muhurtaGood || "include";
    let windows = getWindowsWithId("muhurta_auspicious", meta.sunriseJd, meta.nextSunriseJd).filter((window) => {
      const has = grouped.has(window.value);
      return polarity === "exclude" ? !has : has;
    });
    if (useStrictMatch) {
      windows = windows.filter((window) => matchesFilters(collectMetaAtJd((window.start + window.end) / 2)));
    }
    windows = applyExclusions(windows, excludeIntervals);
    if (windows.length) {
      sections.push({
        title: "Auspicious Muhurta Yogas",
        items: windows
          .filter((window) => !shouldSkipMuhurtaLabel(window.label))
          .map((window) => ({
            label: window.label,
            ranges: [fmtRange(window.start, window.end)],
            startJd: window.start,
            endJd: window.end,
          })),
      });
    }
  }

  if (selectedFilters.muhurtaBad.size && filterPolarity.muhurtaBad !== "exclude") {
    const grouped = new Set();
    selectedFilters.muhurtaBad.forEach((value) => {
      const [, id] = value.split(":");
      grouped.add(Number(id));
    });
    const polarity = filterPolarity.muhurtaBad || "include";
    let windows = getWindowsWithId("muhurta_inauspicious", meta.sunriseJd, meta.nextSunriseJd).filter((window) => {
      const has = grouped.has(window.value);
      return polarity === "exclude" ? !has : has;
    });
    if (useStrictMatch) {
      windows = windows.filter((window) => matchesFilters(collectMetaAtJd((window.start + window.end) / 2)));
    }
    windows = applyExclusions(windows, excludeIntervals);
    if (windows.length) {
      sections.push({
        title: "Inauspicious Muhurta Yogas",
        items: windows
          .filter((window) => !shouldSkipMuhurtaLabel(window.label))
          .map((window) => ({
            label: window.label,
            ranges: [fmtRange(window.start, window.end)],
            startJd: window.start,
            endJd: window.end,
          })),
      });
    }
  }

  return sections;
}

function buildResults() {
  if (!data) return [];
  const dates = getDateRange();
  const output = [];
  const useStrictMatch = !!strictMatch?.checked;
  const filterOnly = true;

  dates.forEach((dateStr) => {
    const meta = collectDayMeta(dateStr);
    if (!useStrictMatch && !matchesFilters(meta)) return;

    const sections = [];
    if (filterOnly) {
      const filterSections = buildFilterOnlySections(meta);
      if (filterSections.length) {
        sections.push(...filterSections);
      }
    }

    if (sections.length) {
      output.push({
        dateStr,
        label: fmtDateLabel(meta.sunriseJd),
        sunriseJd: meta.sunriseJd,
        sections,
      });
    }
  });

  return output;
}

function renderResults(list) {
  resultsRoot.innerHTML = "";
  lastResults = list;
  if (!list.length) {
    resultsMeta.textContent = "No matching windows in the selected range.";
    const empty = document.createElement("div");
    empty.className = "result-empty";
    empty.textContent = "Adjust filters or date range to see results.";
    resultsRoot.appendChild(empty);
    return;
  }
  const summaryText = buildFilterSummary();
  resultsMeta.textContent = summaryText
    ? `${list.length} day(s) matched. ${summaryText}`
    : `${list.length} day(s) matched.`;

  list.forEach((item) => {
    const card = document.createElement("div");
    card.className = "result-card";
    const title = document.createElement("div");
    title.className = "result-title";
    title.textContent = item.label;
    card.appendChild(title);

    item.sections.forEach((section) => {
      const sectionWrap = document.createElement("div");
      sectionWrap.className = "result-section";
      const sectionTitle = document.createElement("div");
      sectionTitle.className = "label";
      sectionTitle.textContent = section.title;
      sectionWrap.appendChild(sectionTitle);

      section.items.forEach((entry) => {
        const row = document.createElement("div");
        row.className = "result-row";
        const label = document.createElement("div");
        label.className = "label";
        label.textContent = entry.group ? `${entry.group} · ${entry.label}` : entry.label;
        const value = document.createElement("div");
        value.textContent = entry.ranges.join(", ");
        row.append(label, value);
        sectionWrap.appendChild(row);

        if (kundliMode?.value === "slots" && entry.startJd) {
          sectionWrap.appendChild(renderKundliAtJd(entry.startJd));
        }
      });

      card.appendChild(sectionWrap);
    });

    if (kundliMode?.value === "sunrise" && item.sunriseJd) {
      card.appendChild(renderKundliAtJd(item.sunriseJd));
    }

    resultsRoot.appendChild(card);
  });
}

function setDefaultDates() {
  const year = data?.meta?.year || new Date().getFullYear();
  const today = new Date();
  const withinYear = today.getFullYear() === year;
  const start = withinYear ? today : new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  fromDate.value = start.toISOString().slice(0, 10);
  toDate.value = end.toISOString().slice(0, 10);
}

function exportICS() {
  if (!lastResults.length) return;
  const tzName = data?.meta?.tz_name || "Asia/Kolkata";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Panchanga Builder//EN", `X-WR-TIMEZONE:${tzName}`];

  lastResults.forEach((day) => {
    day.sections.forEach((section) => {
      section.items.forEach((entry) => {
        entry.ranges.forEach((range) => {
          const [startText, endText] = range.split("-");
          if (!startText || !endText) return;
          const dateParts = day.dateStr.split("-").map((x) => parseInt(x, 10));
          const start = `${dateParts[0]}${String(dateParts[1]).padStart(2, "0")}${String(dateParts[2]).padStart(2, "0")}T${startText.replace(":", "")}`;
          const end = `${dateParts[0]}${String(dateParts[1]).padStart(2, "0")}${String(dateParts[2]).padStart(2, "0")}T${endText.replace(":", "")}`;
          const title = entry.group ? `${entry.group}: ${entry.label}` : entry.label;
          lines.push("BEGIN:VEVENT");
          lines.push(`SUMMARY:${title}`);
          lines.push(`DTSTART:${start}`);
          lines.push(`DTEND:${end}`);
          lines.push("END:VEVENT");
        });
      });
    });
  });

  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `panchanga_builder_${data.meta?.year || ""}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportPDF() {
  if (!lastResults.length) return;
  const win = window.open("", "_blank");
  if (!win) return;
  const title = "Panchanga Builder Report";
  const styles = `
    <style>
      :root {
        --ink: #0f172a;
        --muted: #475569;
        --line: #e2e8f0;
        --soft: #f8fafc;
        --accent: #3b82f6;
        --bg: #ffffff;
      }
      * { box-sizing: border-box; }
      body {
        font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
        color: var(--ink);
        background: var(--bg);
        margin: 0;
      }
      :root {
        --footer-h: 36px;
      }
      .print-footer {
        position: fixed;
        left: 0;
        right: 0;
        padding: 12px 28px;
        background: #fff;
        z-index: 10;
      }
      .print-footer {
        bottom: 0;
        border-top: 1px solid var(--line);
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: var(--muted);
        height: var(--footer-h);
        align-items: center;
      }
      .page-count::after { content: counter(page); }
      .content {
        padding: 24px 28px calc(var(--footer-h) + 24px);
      }
      .summary {
        font-size: 12px;
        color: var(--muted);
        background: var(--soft);
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 10px 12px;
        margin: 0 0 14px;
        line-height: 1.5;
      }
      .days {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 14px 18px;
      }
      .day {
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 12px 14px 14px;
        background: #fff;
        break-inside: avoid;
        page-break-inside: avoid;
        overflow: hidden;
      }
      .day-title {
        font-size: 15px;
        font-weight: 600;
        margin: 0 0 6px;
      }
      .section {
        margin-top: 8px;
      }
      .section-title {
        font-size: 10px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
        margin: 6px 0;
      }
      .rows-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
        table-layout: fixed;
      }
      .rows-table thead { display: table-header-group; }
      .rows-table th,
      .rows-table td {
        text-align: left;
        padding: 4px 0;
        border-bottom: 1px dashed var(--line);
        vertical-align: top;
      }
      .rows-table th:last-child,
      .rows-table td:last-child { text-align: right; width: 86px; }
      .rows-table thead th {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
      }
      .label { color: var(--ink); word-break: break-word; }
      .time { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
      .kundli-inline {
        margin: 6px 0 10px;
        padding: 8px;
        background: var(--soft);
        border: 1px solid var(--line);
        border-radius: 10px;
        display: block;
        max-width: 100%;
      }
      .kundli-inline .kundali-grid { margin: 0; }
      .kundali-grid {
        width: 190px;
        height: 190px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        grid-template-rows: repeat(4, 1fr);
        gap: 4px;
        position: relative;
      }
      .kundali-cell {
        border: 1px solid rgba(148, 163, 184, 0.4);
        border-radius: 6px;
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .kundali-sign {
        font-size: 5px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .kundali-planets {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 2px 4px;
        font-size: 9px;
      }
      .kundali-cell.crowded .kundali-planets,
      .kundali-cell.packed .kundali-planets { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .kundali-planet-main { font-weight: 600; font-size: 9px; }
      .kundali-empty { color: var(--muted); font-size: 9px; }
      .kundali-center {
        position: absolute;
        inset: 30% 30%;
        border: 1px dashed rgba(59, 130, 246, 0.2);
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        text-align: center;
        background: #ffffffcc;
      }
      .kundali-center-label {
        font-size: 8px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .kundali-center-value { font-size: 11px; font-weight: 600; }
      .kundali-center-subtle { font-size: 8px; color: var(--muted); }
      .kundli-details {
        margin-top: 6px;
        display: grid;
        gap: 3px;
        font-size: 9px;
        color: var(--muted);
      }
      .kundli-detail {
        display: grid;
        grid-template-columns: 40px 1fr 24px;
        gap: 6px;
        align-items: center;
      }
      .kundli-detail span:last-child { text-align: right; }
      .kundli-detail-head {
        font-size: 8px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
      }
      .planet-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
      }
      .planet-table thead { display: table-header-group; }
      .planet-table th,
      .planet-table td {
        text-align: left;
        padding: 4px 0;
        border-bottom: 1px dashed var(--line);
      }
      .planet-table th:last-child,
      .planet-table td:last-child { text-align: right; }
      .planet-table thead th {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
      }
      @media print {
        @page { margin: 12mm 12mm 12mm; }
        :root { --footer-h: 12mm; }
        html, body { margin: 0; padding: 0; }
        .print-footer { height: var(--footer-h); padding: 3mm 12mm; }
        .content { padding: 16px 28px calc(var(--footer-h) + 24px); }
        .day { break-inside: avoid; page-break-inside: avoid; }
        .days { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .kundli-inline { break-inside: avoid; page-break-inside: avoid; }
      }
    </style>
  `;

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const renderPlanetTable = (section) => {
    const rows = section.items.map((entry) => {
      const label = entry.group ? `${entry.group}: ${entry.label}` : entry.label;
      const parts = String(label).split(":");
      const planet = parts.length > 1 ? parts[0].trim().replace(/^Planet/i, "").trim() : label;
      const detail = parts.length > 1 ? parts.slice(1).join(":").trim() : entry.ranges.join(", ");
      const flags = /\\bR\\b|\\bC\\b/.test(entry.ranges.join(", ")) ? entry.ranges.join(", ") : "—";
      return `<tr><td>${escapeHtml(planet)}</td><td>${escapeHtml(detail)}</td><td>${escapeHtml(flags)}</td></tr>`;
    });
    return `
      <table class="planet-table">
        <thead>
          <tr><th>Planet</th><th>Nak/Pada</th><th>R/C</th></tr>
        </thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    `;
  };

  const renderSection = (section) => {
    const title = escapeHtml(section.title);
    const isPlanet =
      /planet/i.test(section.title) ||
      section.items.some((entry) => /nak\/?pada/i.test(entry.label || "") || /r\/?c/i.test(entry.label || ""));
    if (isPlanet) {
      return `<div class="section"><div class="section-title">${title}</div>${renderPlanetTable(section)}</div>`;
    }
    const rows = section.items
      .map((entry) => {
        const label = entry.group ? `${entry.group}: ${entry.label}` : entry.label;
        return `<tr><td class="label">${escapeHtml(label)}</td><td class="time">${escapeHtml(entry.ranges.join(", "))}</td></tr>`;
      })
      .join("");
    return `
      <div class="section">
        <div class="section-title">${title}</div>
        <table class="rows-table">
          <thead><tr><th>Match</th><th>Time</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  };

  const summaryText = buildFilterSummary();
  const generatedAt = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  const cityText = `${data?.meta?.city_name || ""} ${data?.meta?.year || ""}`.trim();

  let body = `
    <footer class="print-footer">
      <div>Panchanga Builder</div>
      <div>Page <span class="page-count"></span></div>
    </footer>
    <main class="content">
  `;

  if (summaryText) {
    body += `<div class="summary">${escapeHtml(summaryText)}</div>`;
  }

  body += `<div class="days">`;
  lastResults.forEach((day) => {
    body += `<div class="day"><div class="day-title">${escapeHtml(day.label)}</div>`;
    if (kundliMode?.value === "sunrise" && day.sunriseJd) {
      body += buildKundliHtml(day.sunriseJd);
    }
    day.sections.forEach((section) => {
      body += renderSection(section);
      if (kundliMode?.value === "slots") {
        section.items.forEach((entry) => {
          if (entry.startJd) body += buildKundliHtml(entry.startJd);
        });
      }
    });
    body += `</div>`;
  });
  body += `</div></main>`;

  const doc = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        ${styles}
      </head>
      <body>${body}</body>
    </html>
  `;
  win.document.write(doc);
  win.document.close();
  win.focus();
  win.onload = () => win.print();
}

function buildFilterSummary() {
  const parts = [];
  const joinSet = (set) => Array.from(set).join(", ");
  const addSet = (label, set, polarityKey) => {
    if (!set.size) return;
    const prefix = filterPolarity[polarityKey] === "exclude" ? "Exclude" : "Include";
    parts.push(`${label} (${prefix}): ${joinSet(set)}`);
  };

  addSet("Tithi", selectedFilters.tithi, "tithi");
  addSet("Vara", selectedFilters.vara, "vara");
  addSet("Nakshatra", selectedFilters.nakshatra, "nakshatra");
  addSet("Nakshatra Pada", selectedFilters.pada, "pada");
  addSet("Yoga", selectedFilters.yoga, "yoga");
  addSet("Karana", selectedFilters.karana, "karana");
  addSet("Hora", selectedFilters.hora, "hora");
  addSet("Day / Night", selectedFilters.dayNight, "dayNight");
  addSet("Lagna", selectedFilters.lagna, "lagna");
  addSet("Ritu", selectedFilters.ritu, "ritu");
  addSet("Ayana", selectedFilters.ayana, "ayana");
  addSet("Solar Month", selectedFilters.solarMonth, "solarMonth");
  addSet("Lunar Month (Amanta)", selectedFilters.lunarAmanta, "lunarAmanta");
  addSet("Lunar Month (Purnimanta)", selectedFilters.lunarPurnimanta, "lunarPurnimanta");
  addSet("Maasa Type (Amanta)", selectedFilters.lunarAmantaType, "lunarAmantaType");
  addSet("Maasa Type (Purnimanta)", selectedFilters.lunarPurnimantaType, "lunarPurnimantaType");

  if (selectedFilters.planetNakshatra.size) {
    addSet("Planet Nakshatra", selectedFilters.planetNakshatra, "planetNakshatra");
  }
  if (selectedFilters.planetMotion.size) {
    addSet("Planet Motion", selectedFilters.planetMotion, "planetMotion");
  }
  if (selectedFilters.planetCombust.size) {
    addSet("Planet Combust", selectedFilters.planetCombust, "planetCombust");
  }
  if (selectedFilters.muhurtaGood.size) {
    addSet("Muhurta Yogas (Auspicious)", selectedFilters.muhurtaGood, "muhurtaGood");
  }
  if (selectedFilters.muhurtaBad.size) {
    addSet("Muhurta Yogas (Inauspicious)", selectedFilters.muhurtaBad, "muhurtaBad");
  }

  if (!parts.length) return "";
  return `Filters: ${parts.join(" • ")}`;
}

function buildKundliDataAtJd(jd) {
  const signToPlanets = {};
  KUNDALI_GRID.flat().forEach((sign) => {
    if (sign) signToPlanets[sign] = [];
  });
  const details = [];

  planetBandList.forEach((planet) => {
    if (!data.bands?.[planet.band]) return;
    const value = getValueInfoAtJd(planet.band, jd);
    const signShort = signShortFromValue(value.valueInt);
    if (!signShort) return;
    const nak = planet.nakBand && data.bands?.[planet.nakBand] ? getValueAtJd(planet.nakBand, jd) : "--";
    const pada = planet.padaBand && data.bands?.[planet.padaBand] ? getValueAtJd(planet.padaBand, jd) : "--";
    const motion = planet.motionBand && data.bands?.[planet.motionBand] ? getValueAtJd(planet.motionBand, jd) : null;
    const combust = planet.combustBand && data.bands?.[planet.combustBand] ? getValueAtJd(planet.combustBand, jd) : null;
    signToPlanets[signShort]?.push({
      abbr: PLANET_ABBR[planet.key] || planet.label.slice(0, 2),
    });
    const flags = [];
    if (motion && isRetrogradeLabel(motion)) flags.push("R");
    if (combust && isCombustLabel(combust)) flags.push("C");
    const detailParts = [];
    if (pada && pada !== "--") {
      detailParts.push(pada);
    } else if (nak && nak !== "--") {
      detailParts.push(nak);
    }
    const detailText = detailParts.length ? detailParts.join(" · ") : "--";
    details.push({
      name: PLANET_ABBR[planet.key] || planet.label.slice(0, 2),
      detail: detailText,
      flags: flags.join(" "),
    });
  });

  if (data.bands?.lagna) {
    const lagna = getValueInfoAtJd("lagna", jd);
    const signShort = signShortFromValue(lagna.valueInt);
    if (signShort) {
      signToPlanets[signShort]?.push({ abbr: PLANET_ABBR.lagna, retro: false, combust: false });
    }
    const lagnaLabel = getValueAtJd("lagna", jd);
    if (lagnaLabel && lagnaLabel !== "--") {
      details.unshift({ name: "La", detail: lagnaLabel, flags: "" });
    }
  }

  const lagnaLabel = data.bands?.lagna ? getValueAtJd("lagna", jd) : "--";

  return { signToPlanets, lagnaLabel, details };
}

function renderKundliAtJd(jd) {
  const { signToPlanets, lagnaLabel, details } = buildKundliDataAtJd(jd);
  const wrap = document.createElement("div");
  wrap.className = "kundli-inline";
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
      if (planets.length >= 7) {
        cell.classList.add("packed");
        planetsWrap.classList.add("packed");
      } else if (planets.length >= 5) {
        cell.classList.add("crowded");
        planetsWrap.classList.add("crowded");
      }
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
          token.appendChild(main);
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
  sunriseLabel.textContent = "Time";
  const sunriseValue = document.createElement("div");
  sunriseValue.className = "kundali-center-value";
  sunriseValue.textContent = fmtTime(jd);
  const lagnaText = document.createElement("div");
  lagnaText.className = "kundali-center-subtle";
  lagnaText.textContent = `Lagna: ${lagnaLabel || "--"}`;
  center.append(sunriseLabel, sunriseValue, lagnaText);
  grid.appendChild(center);

  wrap.appendChild(grid);
  if (details && details.length) {
    const table = document.createElement("div");
    table.className = "kundli-details";
    const header = document.createElement("div");
    header.className = "kundli-detail kundli-detail-head";
    header.innerHTML = `<span>Planet</span><span>Nak/Pada</span><span>R/C</span>`;
    table.appendChild(header);
    details.forEach((row) => {
      const item = document.createElement("div");
      item.className = "kundli-detail";
      item.innerHTML = `<span>${row.name}</span><span>${row.detail}</span><span>${row.flags || "—"}</span>`;
      table.appendChild(item);
    });
    wrap.appendChild(table);
  }
  return wrap;
}

function buildKundliHtml(jd) {
  const { signToPlanets, lagnaLabel, details } = buildKundliDataAtJd(jd);
  let html = `<div class="kundli-inline"><div class="kundali-grid">`;
  KUNDALI_GRID.forEach((row, rIdx) => {
    row.forEach((sign, cIdx) => {
      if (!sign) return;
      const planets = signToPlanets[sign] || [];
      const crowded = planets.length >= 5 ? "crowded" : "";
      const packed = planets.length >= 7 ? "packed" : "";
      html += `<div class="kundali-cell ${crowded} ${packed}" style="grid-row:${rIdx + 1};grid-column:${cIdx + 1};">`;
      html += `<div class="kundali-sign">${sign}</div>`;
      html += `<div class="kundali-planets ${crowded} ${packed}">`;
      if (!planets.length) {
        html += `<span class="kundali-empty">—</span>`;
      } else {
        planets.forEach((planet) => {
          html += `<span class="kundali-planet"><span class="kundali-planet-main">${planet.abbr}</span></span>`;
        });
      }
      html += `</div></div>`;
    });
  });
  html += `
    <div class="kundali-center">
      <div class="kundali-center-label">Time</div>
      <div class="kundali-center-value">${fmtTime(jd)}</div>
      <div class="kundali-center-subtle">Lagna: ${lagnaLabel || "--"}</div>
    </div>
  `;
  html += `</div></div>`;
  if (details && details.length) {
    html += `<div class="kundli-details">`;
    html += `<div class="kundli-detail kundli-detail-head"><span>Planet</span><span>Nak/Pada</span><span>R/C</span></div>`;
    details.forEach((row) => {
      html += `<div class="kundli-detail"><span>${row.name}</span><span>${row.detail}</span><span>${row.flags || "—"}</span></div>`;
    });
    html += `</div>`;
  }
  return html;
}

function applyFilters() {
  const list = buildResults();
  renderResults(list);
}

function clearAll() {
  Object.values(selectedFilters).forEach((set) => set.clear());
  Object.keys(filterModes).forEach((key) => {
    filterModes[key] = "or";
  });
  Object.keys(filterPolarity).forEach((key) => {
    filterPolarity[key] = "include";
  });
  filterGroups.querySelectorAll(".filter-chip.active").forEach((chip) => chip.classList.remove("active"));
  filterGroups.querySelectorAll(".filter-mode-button").forEach((btn) => btn.classList.remove("active"));
  filterGroups.querySelectorAll(".filter-mode").forEach((wrap) => {
    const buttons = wrap.querySelectorAll(".filter-mode-button");
    if (buttons[0]) buttons[0].classList.add("active");
  });
  filterGroups.querySelectorAll(".filter-polarity-button").forEach((btn) => btn.classList.remove("active"));
  filterGroups.querySelectorAll(".filter-polarity").forEach((wrap) => {
    const buttons = wrap.querySelectorAll(".filter-polarity-button");
    if (buttons[0]) buttons[0].classList.add("active");
  });
}

function initYearSelect() {
  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    yearSelect.appendChild(option);
  });
  const now = new Date().getFullYear();
  yearSelect.value = years.includes(now) ? String(now) : String(years[0]);
}

initYearSelect();
loadJson(parseInt(yearSelect.value, 10));

yearSelect.addEventListener("change", () => {
  loadJson(parseInt(yearSelect.value, 10));
});

applyBtn.addEventListener("click", applyFilters);
clearBtn.addEventListener("click", () => {
  clearAll();
  applyFilters();
});

exportIcsBtn.addEventListener("click", exportICS);
exportPdfBtn.addEventListener("click", exportPDF);
if (kundliMode) {
  kundliMode.addEventListener("change", () => {
    renderResults(lastResults);
  });
}

quickRangeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const year = parseInt(yearSelect.value, 10);
    const base = fromDate.value ? new Date(fromDate.value) : new Date();
    const start = Number.isNaN(base.getTime()) ? new Date() : base;
    let end = new Date(start.getTime());
    const range = btn.getAttribute("data-range");
    if (range === "3m") {
      end.setMonth(end.getMonth() + 3);
    } else if (range === "6m") {
      end.setMonth(end.getMonth() + 6);
    } else {
      end = new Date(Date.UTC(year, 11, 31));
    }
    const yearEnd = new Date(Date.UTC(year, 11, 31));
    if (end > yearEnd) end = yearEnd;
    fromDate.value = start.toISOString().slice(0, 10);
    toDate.value = end.toISOString().slice(0, 10);
    applyFilters();
  });
});
