const calendar = document.querySelector("#calendar");
const yearSelect = document.querySelector("#yearSelect");
const jumpToday = document.querySelector("#jumpToday");
const landingMeta = document.querySelector("#landingMeta");
const filterBtn = document.querySelector("#filterBtn");
const filterBackdrop = document.querySelector("#filterBackdrop");
const filterGroups = document.querySelector("#filterGroups");
const filterClose = document.querySelector("#filterClose");
const filterClear = document.querySelector("#filterClear");
const filterApply = document.querySelector("#filterApply");
const activeFilters = document.querySelector("#activeFilters");

let data = null;
let tzHours = 0;
let bandNames = {};

const years = [2025, 2026, 2027];
const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dayMeta = new Map();
const selectedFilters = {
  vara: new Set(),
  tithi: new Set(),
  nakshatra: new Set(),
  yoga: new Set(),
  karana: new Set(),
  muhurta: new Set(),
  planetNakshatra: new Set(),
  planetMotion: new Set(),
  planetCombust: new Set(),
};

const filterModes = {
  vara: "or",
  tithi: "or",
  nakshatra: "or",
  yoga: "or",
  karana: "or",
  muhurta: "or",
  planetNakshatra: "or",
  planetMotion: "or",
  planetCombust: "or",
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
      landingMeta.textContent = `${data.meta?.city_name || ""} ${data.meta?.year || ""} • tz ${tzHours}`;
      buildFilterGroups();
      renderCalendar();
    })
    .catch((err) => {
      landingMeta.textContent = `Error: ${err.message}`;
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

function computeDayWindow(dateStr) {
  const [y, m, d] = dateStr.split("-").map((x) => parseInt(x, 10));
  const dayStartUtcMs = Date.UTC(y, m - 1, d) - tzHours * 3600 * 1000;
  const dayStartJd = msToJd(dayStartUtcMs);
  const dayEndJd = dayStartJd + 1.0;

  let sunriseJd = dayStartJd;
  let sunsetJd = dayStartJd + 0.5;
  const daylight = getIntervalsForBand("daylight");
  if (daylight.length) {
    const match =
      daylight.find((iv) => iv[0] >= dayStartJd && iv[0] < dayEndJd) ||
      daylight.find((iv) => iv[0] < dayEndJd && iv[1] > dayStartJd);
    if (match) {
      sunriseJd = match[0];
      sunsetJd = match[1];
    }
  }

  return { dayStartJd, sunriseJd, sunsetJd };
}

function weekdayIndexForDateStr(dateStr) {
  const { dayStartJd } = computeDayWindow(dateStr);
  const local = toLocal(jdToDate(dayStartJd));
  return local.getDay();
}

function pad2(num) {
  return String(num).padStart(2, "0");
}

function collectMuhurtaKeys(startJd, endJd) {
  const keys = new Set();
  ["muhurta_auspicious", "muhurta_inauspicious"].forEach((band) => {
    const intervals = getIntervalsForBand(band);
    intervals.forEach((iv) => {
      const start = Math.max(startJd, iv[0]);
      const end = Math.min(endJd, iv[1]);
      if (end > start && iv[2] !== null && iv[2] !== undefined) {
        keys.add(`${band}:${iv[2]}`);
      }
    });
  });
  return keys;
}

function renderCalendar() {
  if (!data) return;
  calendar.innerHTML = "";
  dayMeta.clear();
  const year = data.meta?.year || new Date().getFullYear();

  for (let month = 0; month < 12; month += 1) {
    const monthCard = document.createElement("section");
    monthCard.className = "month-card";
    monthCard.id = `month-${year}-${pad2(month + 1)}`;

    const header = document.createElement("div");
    header.className = "month-header";
    const title = document.createElement("div");
    title.className = "month-title";
    title.textContent = new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    const sub = document.createElement("div");
    sub.className = "month-sub";
    sub.textContent = "Tithi • Vara • Nakshatra • Yoga • Karana";
    header.append(title, sub);

    const grid = document.createElement("div");
    grid.className = "month-grid";

    weekdayLabels.forEach((label) => {
      const wd = document.createElement("div");
      wd.className = "weekday";
      wd.textContent = label;
      grid.appendChild(wd);
    });

    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const firstDateStr = `${year}-${pad2(month + 1)}-01`;
    const startDay = weekdayIndexForDateStr(firstDateStr);

    for (let i = 0; i < startDay; i += 1) {
      const empty = document.createElement("div");
      empty.className = "day-tile empty";
      grid.appendChild(empty);
    }

      for (let day = 1; day <= daysInMonth; day += 1) {
        const dateStr = `${year}-${pad2(month + 1)}-${pad2(day)}`;
      const { sunriseJd, sunsetJd } = computeDayWindow(dateStr);
      const vara = getValueAtJd("vara", sunriseJd);
      const tithi = getValueAtJd("tithi", sunriseJd);
      const nak = getValueAtJd("nakshatra", sunriseJd);
      const yoga = getValueAtJd("yoga", sunriseJd);
      const karana = getValueAtJd("karana", sunriseJd);
      const endJd = sunriseJd + 1;
      const muhurtaKeys = collectMuhurtaKeys(sunriseJd, endJd);
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

      dayMeta.set(dateStr, {
        vara,
        tithi,
        nakshatra: nak,
        yoga,
        karana,
        muhurtaKeys,
        planetNakshatraKeys,
        planetMotionKeys,
        planetCombustKeys,
      });

      const tile = document.createElement("a");
      tile.className = "day-tile";
      tile.href = `./day.html?date=${dateStr}`;
      tile.dataset.date = dateStr;

      const top = document.createElement("div");
      top.className = "day-top";
      const num = document.createElement("div");
      num.className = "day-num";
      num.textContent = String(day);
      const weekday = document.createElement("div");
      weekday.className = "day-weekday";
      weekday.textContent = weekdayLabels[weekdayIndexForDateStr(dateStr)] || "";
      const times = document.createElement("div");
      times.className = "day-times";
      const sunrise = document.createElement("div");
      sunrise.className = "day-sunrise";
      sunrise.textContent = `☀↑ ${fmtTime(sunriseJd)}`;
      const sunset = document.createElement("div");
      sunset.className = "day-sunset";
      sunset.textContent = `☀↓ ${fmtTime(sunsetJd)}`;
      times.append(sunrise, sunset);
      top.append(num, weekday, times);

      const lines = document.createElement("div");
      lines.className = "day-lines";
      const items = [
        { icon: "✨", label: "Nakshatra", value: nak, className: "nakshatra" },
        { icon: getTithiIcon(tithi), label: "Tithi", value: tithi, className: "tithi" },
      ];
      items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "day-line";
        if (item.className) row.classList.add(item.className);
        const icon = document.createElement("span");
        icon.className = "day-icon";
        icon.textContent = item.icon;
        const text = document.createElement("span");
        text.className = "day-text";
        text.textContent = shortValue(item.value || "--");
        row.append(icon, text);
        row.setAttribute("aria-label", `${item.label} ${item.value || "--"}`);
        lines.appendChild(row);
      });

      tile.append(top, lines);
      grid.appendChild(tile);
    }

    monthCard.append(header, grid);
    calendar.appendChild(monthCard);
  }

  highlightToday();
  applyFilters();
}

function shortValue(value) {
  const cleaned = String(value).replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned === "--") return "--";
  const words = cleaned.split(" ");
  if (words.length === 1) return words[0].slice(0, 8);
  const first = words[0].slice(0, 3);
  const second = words[1].slice(0, 3);
  return `${first} ${second}`.trim();
}

function getTithiIcon(tithi) {
  const text = String(tithi || "").toLowerCase();
  if (text.includes("amavasya")) return "🌑";
  if (text.includes("purnima")) return "🌕";
  if (text.includes("shukla")) return "🌔";
  if (text.includes("krishna")) return "🌘";
  return "☾";
}

function buildFilterGroups() {
  if (!filterGroups || !data) return;
  filterGroups.innerHTML = "";

  const uniqueValues = (values) => {
    const seen = new Set();
    return values.filter((value) => {
      if (!value || value === "--") return false;
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  };

  const groups = [
    { key: "tithi", title: "Tithi", values: uniqueValues(data.lookups?.tithi || []) },
    { key: "vara", title: "Vara", values: uniqueValues(data.lookups?.vara || []) },
    { key: "nakshatra", title: "Nakshatra", values: uniqueValues(data.lookups?.nakshatra || []) },
    { key: "yoga", title: "Yoga", values: uniqueValues(data.lookups?.yoga || []) },
    { key: "karana", title: "Karana", values: uniqueValues(data.lookups?.karana || []) },
  ];

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
      applyFilters();
    });
    allBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      filterModes[groupKey] = "and";
      sync();
      applyFilters();
    });
    wrap.append(anyBtn, allBtn);
    sync();
    return wrap;
  };

  groups.forEach((group) => {
    const wrap = document.createElement("div");
    wrap.className = "filter-group collapsed";
    const header = document.createElement("div");
    header.className = "filter-group-header";
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
    header.append(toggle, makeModeToggle(group.key));
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
  planetNakHeader.append(planetNakToggle, makeModeToggle("planetNakshatra"));
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
  planetMotionHeader.append(planetMotionToggle, makeModeToggle("planetMotion"));
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
      chip.addEventListener("click", () =>
        toggleFilter("planetMotion", `${planet.key}:${state.key}`, chip)
      );
      planetMotionOptions.appendChild(chip);
    });
  });
  planetMotionGroup.append(planetMotionHeader, planetMotionOptions);
  filterGroups.appendChild(planetMotionGroup);

  const planetCombustGroup = document.createElement("div");
  planetCombustGroup.className = "filter-group collapsed";
  const planetCombustHeader = document.createElement("div");
  planetCombustHeader.className = "filter-group-header";
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
  planetCombustHeader.append(planetCombustToggle, makeModeToggle("planetCombust"));
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
      chip.addEventListener("click", () =>
        toggleFilter("planetCombust", `${planet.key}:${state.key}`, chip)
      );
      planetCombustOptions.appendChild(chip);
    });
  });
  planetCombustGroup.append(planetCombustHeader, planetCombustOptions);
  filterGroups.appendChild(planetCombustGroup);

  const muhurtaGroup = document.createElement("div");
  muhurtaGroup.className = "filter-group collapsed";
  const muhurtaHeader = document.createElement("div");
  muhurtaHeader.className = "filter-group-header";
  const muhurtaToggle = document.createElement("button");
  muhurtaToggle.type = "button";
  muhurtaToggle.className = "filter-group-toggle";
  const muhurtaTitle = document.createElement("div");
  muhurtaTitle.className = "filter-group-title";
  muhurtaTitle.textContent = "Muhurta Yogas";
  const muhurtaChevron = document.createElement("span");
  muhurtaChevron.className = "chevron";
  muhurtaChevron.textContent = "▾";
  muhurtaToggle.append(muhurtaTitle, muhurtaChevron);
  muhurtaToggle.addEventListener("click", () => muhurtaGroup.classList.toggle("collapsed"));
  muhurtaHeader.append(muhurtaToggle, makeModeToggle("muhurta"));
  const muhurtaOptions = document.createElement("div");
  muhurtaOptions.className = "filter-options";
  ["muhurta_auspicious", "muhurta_inauspicious"].forEach((band) => {
    const names = bandNames[band] || {};
    Object.keys(names).forEach((key) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `filter-chip ${band === "muhurta_auspicious" ? "good" : "bad"}`;
      chip.textContent = names[key];
      const value = `${band}:${key}`;
      chip.addEventListener("click", () => toggleFilter("muhurta", value, chip));
      muhurtaOptions.appendChild(chip);
    });
  });
  muhurtaGroup.append(muhurtaHeader, muhurtaOptions);
  filterGroups.appendChild(muhurtaGroup);
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

function applyFilters() {
  if (!calendar) return;
  const hasFilters = Object.values(selectedFilters).some((set) => set.size > 0);
  const tiles = calendar.querySelectorAll(".day-tile");
  tiles.forEach((tile) => {
    const dateStr = tile.dataset.date;
    if (!dateStr || !dayMeta.has(dateStr)) return;
    if (!hasFilters) {
      tile.classList.remove("hidden");
      return;
    }
    const meta = dayMeta.get(dateStr);
    const matchSingle = (value, set, mode) => {
      if (set.size === 0) return true;
      if (mode === "and") return set.size === 1 && set.has(value);
      return set.has(value);
    };
    const matchSet = (metaSet, set, mode) => {
      if (set.size === 0) return true;
      if (mode === "and") {
        return Array.from(set).every((key) => metaSet.has(key));
      }
      return Array.from(set).some((key) => metaSet.has(key));
    };
    const match =
      matchSingle(meta.tithi, selectedFilters.tithi, filterModes.tithi) &&
      matchSingle(meta.vara, selectedFilters.vara, filterModes.vara) &&
      matchSingle(meta.nakshatra, selectedFilters.nakshatra, filterModes.nakshatra) &&
      matchSingle(meta.yoga, selectedFilters.yoga, filterModes.yoga) &&
      matchSingle(meta.karana, selectedFilters.karana, filterModes.karana) &&
      matchSet(meta.muhurtaKeys, selectedFilters.muhurta, filterModes.muhurta) &&
      matchSet(meta.planetNakshatraKeys, selectedFilters.planetNakshatra, filterModes.planetNakshatra) &&
      matchSet(meta.planetMotionKeys, selectedFilters.planetMotion, filterModes.planetMotion) &&
      matchSet(meta.planetCombustKeys, selectedFilters.planetCombust, filterModes.planetCombust);
    tile.classList.toggle("hidden", !match);
  });

  calendar.querySelectorAll(".month-card").forEach((month) => {
    const anyVisible = month.querySelector(".day-tile:not(.hidden)");
    month.style.display = anyVisible ? "" : "none";
  });

  renderActiveFilters();
}

function renderActiveFilters() {
  if (!activeFilters) return;
  activeFilters.innerHTML = "";
  const entries = [];
  const addEntries = (label, values, mode) => {
    const modeLabel = mode === "and" && values.length > 1 ? " (All)" : "";
    values.forEach((value) => entries.push({ label: `${label}${modeLabel}`, value }));
  };

  addEntries("Vara", Array.from(selectedFilters.vara), filterModes.vara);
  addEntries("Tithi", Array.from(selectedFilters.tithi), filterModes.tithi);
  addEntries("Nakshatra", Array.from(selectedFilters.nakshatra), filterModes.nakshatra);
  addEntries("Yoga", Array.from(selectedFilters.yoga), filterModes.yoga);
  addEntries("Karana", Array.from(selectedFilters.karana), filterModes.karana);
  addEntries(
    "Muhurta",
    Array.from(selectedFilters.muhurta).map((key) => {
      const [band, id] = key.split(":");
      return bandNames?.[band]?.[id] || key;
    }),
    filterModes.muhurta
  );
  addEntries(
    "Planet Nakshatra",
    Array.from(selectedFilters.planetNakshatra).map((key) => {
      const [planet, value] = key.split(":");
      const meta = PLANET_NAKSHATRA_BANDS.find((p) => p.key === planet);
      return meta ? `${meta.short} · ${value}` : key;
    }),
    filterModes.planetNakshatra
  );
  addEntries(
    "Planet Motion",
    Array.from(selectedFilters.planetMotion).map((key) => {
      const [planet, value] = key.split(":");
      const meta = PLANET_MOTION_BANDS.find((p) => p.key === planet);
      return meta ? `${meta.short} · ${value}` : key;
    }),
    filterModes.planetMotion
  );
  addEntries(
    "Planet Combust",
    Array.from(selectedFilters.planetCombust).map((key) => {
      const [planet, value] = key.split(":");
      const meta = PLANET_COMBUST_BANDS.find((p) => p.key === planet);
      return meta ? `${meta.short} · ${value}` : key;
    }),
    filterModes.planetCombust
  );

  if (!entries.length) {
    activeFilters.classList.add("hidden");
    return;
  }

  activeFilters.classList.remove("hidden");
  entries.forEach((entry) => {
    const pill = document.createElement("span");
    pill.className = "filter-pill";
    const label = document.createElement("span");
    label.textContent = `${entry.label}:`;
    const value = document.createElement("strong");
    value.textContent = entry.value;
    pill.append(label, value);
    activeFilters.appendChild(pill);
  });
}

function highlightToday() {
  const today = new Date();
  const year = data?.meta?.year;
  if (!year || today.getFullYear() !== year) return;
  const dateStr = today.toISOString().slice(0, 10);
  const tile = calendar.querySelector(`a[href$="${dateStr}"]`);
  if (tile) tile.classList.add("today");
}

function scrollToCurrentMonth() {
  const today = new Date();
  const year = data?.meta?.year;
  if (!year || today.getFullYear() !== year) return;
  const monthId = `month-${year}-${pad2(today.getMonth() + 1)}`;
  const el = document.getElementById(monthId);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function focusDate(dateStr) {
  if (!calendar) return;
  const tile = calendar.querySelector(`.day-tile[data-date="${dateStr}"]`);
  if (!tile) return;
  calendar.querySelectorAll(".day-tile.today-focus").forEach((el) => el.classList.remove("today-focus"));
  tile.classList.add("today-focus");
  tile.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
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
  const year = parseInt(yearSelect.value, 10);
  loadJson(year);
});

jumpToday.addEventListener("click", () => {
  const today = new Date();
  const year = data?.meta?.year;
  if (!year || today.getFullYear() !== year) {
    scrollToCurrentMonth();
    return;
  }
  const dateStr = today.toISOString().slice(0, 10);
  scrollToCurrentMonth();
  focusDate(dateStr);
});

filterBtn.addEventListener("click", () => {
  filterBackdrop.classList.remove("hidden");
});

filterClose.addEventListener("click", () => {
  filterBackdrop.classList.add("hidden");
});

filterBackdrop.addEventListener("click", (event) => {
  if (event.target === filterBackdrop) filterBackdrop.classList.add("hidden");
});

filterClear.addEventListener("click", () => {
  Object.values(selectedFilters).forEach((set) => set.clear());
  Object.keys(filterModes).forEach((key) => {
    filterModes[key] = "or";
  });
  filterGroups.querySelectorAll(".filter-chip.active").forEach((chip) => chip.classList.remove("active"));
  filterGroups.querySelectorAll(".filter-mode-button").forEach((btn) => btn.classList.remove("active"));
  filterGroups.querySelectorAll(".filter-mode").forEach((wrap) => {
    const buttons = wrap.querySelectorAll(".filter-mode-button");
    if (buttons[0]) buttons[0].classList.add("active");
  });
  applyFilters();
});

filterApply.addEventListener("click", () => {
  applyFilters();
  filterBackdrop.classList.add("hidden");
});
