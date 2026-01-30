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
};

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
  const daylight = getIntervalsForBand("daylight");
  if (daylight.length) {
    const match =
      daylight.find((iv) => iv[0] >= dayStartJd && iv[0] < dayEndJd) ||
      daylight.find((iv) => iv[0] < dayEndJd && iv[1] > dayStartJd);
    if (match) sunriseJd = match[0];
  }

  return { dayStartJd, sunriseJd };
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
      const { sunriseJd } = computeDayWindow(dateStr);
      const vara = getValueAtJd("vara", sunriseJd);
      const tithi = getValueAtJd("tithi", sunriseJd);
      const nak = getValueAtJd("nakshatra", sunriseJd);
      const yoga = getValueAtJd("yoga", sunriseJd);
      const karana = getValueAtJd("karana", sunriseJd);
      const endJd = sunriseJd + 1;
      const muhurtaKeys = collectMuhurtaKeys(sunriseJd, endJd);
      dayMeta.set(dateStr, { vara, tithi, nakshatra: nak, yoga, karana, muhurtaKeys });

      const tile = document.createElement("a");
      tile.className = "day-tile";
      tile.href = `./day.html?date=${dateStr}`;
      tile.dataset.date = dateStr;

      const top = document.createElement("div");
      top.className = "day-top";
      const num = document.createElement("div");
      num.className = "day-num";
      num.textContent = String(day);
      const sunrise = document.createElement("div");
      sunrise.className = "day-sunrise";
      sunrise.textContent = `Sunrise ${fmtTime(sunriseJd)}`;
      top.append(num, sunrise);

      const lines = document.createElement("div");
      lines.className = "day-lines";
      const items = [
        { icon: "✨", label: "Nakshatra", value: nak },
        { icon: "☾", label: "Tithi", value: tithi },
      ];
      items.forEach((item) => {
        const row = document.createElement("div");
        row.className = "day-line";
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

function buildFilterGroups() {
  if (!filterGroups || !data) return;
  filterGroups.innerHTML = "";

  const groups = [
    { key: "tithi", title: "Tithi", values: data.lookups?.tithi || [] },
    { key: "vara", title: "Vara", values: data.lookups?.vara || [] },
    { key: "nakshatra", title: "Nakshatra", values: data.lookups?.nakshatra || [] },
    { key: "yoga", title: "Yoga", values: data.lookups?.yoga || [] },
    { key: "karana", title: "Karana", values: data.lookups?.karana || [] },
  ];

  groups.forEach((group) => {
    const wrap = document.createElement("div");
    wrap.className = "filter-group collapsed";
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
    wrap.append(toggle, options);
    filterGroups.appendChild(wrap);
  });

  const muhurtaGroup = document.createElement("div");
  muhurtaGroup.className = "filter-group collapsed";
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
  muhurtaGroup.append(muhurtaToggle, muhurtaOptions);
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
    const match =
      (selectedFilters.tithi.size === 0 || selectedFilters.tithi.has(meta.tithi)) &&
      (selectedFilters.vara.size === 0 || selectedFilters.vara.has(meta.vara)) &&
      (selectedFilters.nakshatra.size === 0 || selectedFilters.nakshatra.has(meta.nakshatra)) &&
      (selectedFilters.yoga.size === 0 || selectedFilters.yoga.has(meta.yoga)) &&
      (selectedFilters.karana.size === 0 || selectedFilters.karana.has(meta.karana)) &&
      (selectedFilters.muhurta.size === 0 ||
        Array.from(selectedFilters.muhurta).some((key) => meta.muhurtaKeys.has(key)));
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
  const addEntries = (label, values) => {
    values.forEach((value) => entries.push({ label, value }));
  };

  addEntries("Vara", Array.from(selectedFilters.vara));
  addEntries("Tithi", Array.from(selectedFilters.tithi));
  addEntries("Nakshatra", Array.from(selectedFilters.nakshatra));
  addEntries("Yoga", Array.from(selectedFilters.yoga));
  addEntries("Karana", Array.from(selectedFilters.karana));
  addEntries(
    "Muhurta",
    Array.from(selectedFilters.muhurta).map((key) => {
      const [band, id] = key.split(":");
      return bandNames?.[band]?.[id] || key;
    })
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

jumpToday.addEventListener("click", scrollToCurrentMonth);

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
  filterGroups.querySelectorAll(".filter-chip.active").forEach((chip) => chip.classList.remove("active"));
  applyFilters();
});

filterApply.addEventListener("click", () => {
  applyFilters();
  filterBackdrop.classList.add("hidden");
});
