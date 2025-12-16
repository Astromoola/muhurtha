const STORAGE_KEY = "compose_state_v1";
import { DATASETS, FILTER_DEFS } from "./muhurtha/context.js";
import { getOptionsForFilterKey } from "./shared/filter_options.js";
import { bandColors } from "./colors.js";

function debounce(fn, wait = 80) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), wait);
  };
}

const bandOptionsCache = {};
const optionLabelMap = {};

const state = {
  city: null,
  year: null,
  mode: "ALL",
  conditions: [],
  rules: null,
  conditionTypes: buildConditionTypes(),
  data: null,
  viewStart: 0,
  viewEnd: 365,
  datasetStart: 0,
  datasetEnd: 365,
  windowDays: 30,
  panRatio: 0,
  tzHours: 0,
  foldMode: "ALL",
};
let timelineStartInput;
let timelineWindowSlider;
let timelinePanSlider;
let timelineMeta;

const scheduleRecompute = debounce(() => {
  renderBands();
}, 80);

function buildConditionTypes() {
  return Object.keys(FILTER_DEFS).map((key) => ({
    key,
    label: FILTER_DEFS[key]?.label || key,
    bandKey: FILTER_DEFS[key]?.bandKey || key,
  }));
}

function getFilterLabel(filterKey, fallback) {
  return FILTER_DEFS[filterKey]?.label || fallback || "Condition";
}

function resolveBandColor(key) {
  if (!key) return "#94a3b8";
  const normalized = String(key).toLowerCase();
  if (bandColors[normalized]) return bandColors[normalized];
  const base = normalized.replace(/_(day|night)$/, "");
  if (bandColors[base]) return bandColors[base];
  return "#94a3b8";
}

function hexToRgba(hex, alpha = 1) {
  if (!hex) return `rgba(148, 163, 184, ${alpha})`;
  let value = hex.replace("#", "");
  if (value.length === 3) {
    value = value
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(value.slice(0, 2), 16) || 148;
  const g = parseInt(value.slice(2, 4), 16) || 163;
  const b = parseInt(value.slice(4, 6), 16) || 184;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function resetOptionCaches() {
  Object.keys(bandOptionsCache).forEach((key) => delete bandOptionsCache[key]);
  Object.keys(optionLabelMap).forEach((key) => delete optionLabelMap[key]);
}

function applyDataset(dataJson) {
  state.data = dataJson;
  resetOptionCaches();
  const [start, end] = getDatasetBounds(dataJson);
  state.datasetStart = start;
  state.datasetEnd = end;
  state.tzHours = dataJson.meta?.tz_hours || 0;
  const span = Math.max(end - start, 1);
  state.windowDays = Math.min(state.windowDays || 30, span);
  state.panRatio = 0;
  applyViewWindow(start, { silent: true });
  updateTimelineControls();
}

function loadDatasetOnly() {
  const datasetPath = buildDatasetPath();
  return fetch(datasetPath)
    .then((resp) => {
      if (!resp.ok) throw new Error("Failed to load dataset");
      return resp.json();
    })
    .then((dataJson) => {
      applyDataset(dataJson);
      triggerStateChange();
    })
    .catch((err) => {
      console.error(err);
      const panel = document.getElementById("composeTimelinePanel");
      if (panel) {
        const alert = document.createElement("div");
        alert.className = "state-card";
        alert.textContent = err.message || "Unable to load dataset.";
        panel.prepend(alert);
        setTimeout(() => alert.remove(), 4000);
      }
      throw err;
    });
}

function initializeCityYearSelectors() {
  const citySelect = document.getElementById("citySelect");
  const yearSelect = document.getElementById("yearSelect");
  const dateInput = document.getElementById("composeDate");
  const loadBtn = document.getElementById("composeLoad");
  if (!citySelect || !yearSelect) return;

  const populateCities = () => {
    citySelect.innerHTML = "";
    DATASETS.forEach((dataset) => {
      const opt = document.createElement("option");
      opt.value = dataset.slug;
      opt.textContent = dataset.name || dataset.slug;
      citySelect.appendChild(opt);
    });
    if (!state.city) state.city = DATASETS[0]?.slug;
    citySelect.value = state.city;
  };

  const populateYears = () => {
    const dataset = DATASETS.find((c) => c.slug === state.city) || DATASETS[0];
    const years = dataset?.years || [];
    yearSelect.innerHTML = "";
    years.forEach((year) => {
      const opt = document.createElement("option");
      opt.value = String(year);
      opt.textContent = year;
      yearSelect.appendChild(opt);
    });
    const yearStrings = years.map((y) => String(y));
    if (!yearStrings.includes(String(state.year))) {
      state.year = yearStrings[0] || String(new Date().getFullYear());
    }
    yearSelect.value = String(state.year);
  };

  const updateDateInput = (force = false) => {
    if (!dateInput) return;
    const defaultYear = state.year || DATASETS[0]?.years?.[0] || new Date().getFullYear();
    const defaultDate = `${defaultYear}-07-01`;
    if (force || !dateInput.value) dateInput.value = defaultDate;
  };

  populateCities();
  populateYears();
  updateDateInput();

  citySelect.addEventListener("change", () => {
    state.city = citySelect.value;
    populateYears();
    updateDateInput(true);
  });

  yearSelect.addEventListener("change", () => {
    state.year = yearSelect.value;
    updateDateInput(true);
  });

  if (loadBtn) {
    loadBtn.addEventListener("click", () => {
      loadDatasetOnly().catch(() => {});
    });
  }
}

function triggerStateChange() {
  saveState();
  scheduleRecompute();
}

function newId() {
  return `cond_${Math.random().toString(36).slice(2, 8)}`;
}

function addCondition(partial = {}) {
  const filterKey = partial.filterKey || "vara";
  const def = FILTER_DEFS[filterKey] || {};
  const bandKey = partial.bandKey || def.bandKey || filterKey;
  const condition = {
    id: newId(),
    label: partial.label || getFilterLabel(filterKey),
    filterKey,
    bandKey,
    op: partial.op || "AND",
    polarity: partial.polarity || "INCLUDE",
    selections: partial.selections || [],
  };
  state.conditions.push(condition);
  console.debug("Condition added", condition);
  return condition;
}

function removeCondition(id) {
  const idx = state.conditions.findIndex((c) => c.id === id);
  if (idx >= 0) {
    const removed = state.conditions.splice(idx, 1)[0];
    console.debug("Condition removed", removed);
    renderConditions();
    triggerStateChange();
  }
}

function updateCondition(id, patch = {}) {
  const cond = state.conditions.find((c) => c.id === id);
  if (!cond) return;
  Object.assign(cond, patch);
  console.debug("Condition updated", cond);
  renderConditions();
  triggerStateChange();
}

function renderConditions() {
  const listEl = document.getElementById("conditionsList");
  if (!listEl) return;
  listEl.innerHTML = "";
  if (!state.conditions.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No conditions yet.";
    listEl.appendChild(empty);
    return;
  }
  state.conditions.forEach((cond) => {
    const card = document.createElement("div");
    card.className = `condition-card ${cond.polarity === "EXCLUDE" ? "exclude" : "include"}`;

    const header = document.createElement("div");
    header.className = "condition-header";
    const titleWrap = document.createElement("div");
    titleWrap.className = "condition-title-wrap";
    const title = document.createElement("div");
    title.className = "condition-title";
    const displayLabel = getFilterLabel(cond.filterKey, cond.label);
    title.textContent = displayLabel;
    const badge = document.createElement("span");
    badge.className = `condition-badge ${cond.polarity === "EXCLUDE" ? "bad" : "good"}`;
    badge.textContent = cond.polarity === "EXCLUDE" ? "Exclude" : "Include";
    titleWrap.appendChild(title);
    titleWrap.appendChild(badge);
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "ghost-button";
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      removeCondition(cond.id);
      renderConditions();
    });
    header.appendChild(titleWrap);
    header.appendChild(removeBtn);
    card.appendChild(header);

    const meta = document.createElement("div");
    meta.className = "condition-meta";
    meta.textContent = `${cond.polarity === "INCLUDE" ? "Include" : "Exclude"} · ${cond.op}`;
    card.appendChild(meta);

    const chipWrapper = document.createElement("div");
    chipWrapper.className = "condition-chip-wrapper";
    const chipRow = document.createElement("div");
    chipRow.className = "condition-chip-row";
    const labels = getSelectionLabels(cond);
    if (!labels.length) {
      const placeholder = document.createElement("span");
      placeholder.className = "chip-placeholder";
      placeholder.textContent = "All values";
      chipRow.appendChild(placeholder);
    } else {
      const prefix = cond.polarity === "EXCLUDE" ? "−" : "+";
      labels.slice(0, 4).forEach((label) => {
        const chip = document.createElement("span");
        chip.className = `mini-chip ${cond.polarity === "EXCLUDE" ? "bad" : ""}`;
        chip.textContent = `${prefix} ${label}`;
        chipRow.appendChild(chip);
      });
      if (labels.length > 4) {
        const more = document.createElement("span");
        more.className = "mini-chip more";
        more.textContent = `+${labels.length - 4}`;
        chipRow.appendChild(more);
      }
    }
    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "condition-clear";
    clearBtn.textContent = "Clear";
    clearBtn.disabled = !cond.selections.length;
    clearBtn.addEventListener("click", () => updateCondition(cond.id, { selections: [] }));
    chipWrapper.appendChild(chipRow);
    chipWrapper.appendChild(clearBtn);
    card.appendChild(chipWrapper);

    const polarityToggle = document.createElement("div");
    polarityToggle.className = "mini-mode-toggle";
    ["INCLUDE", "EXCLUDE"].forEach((mode) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = mode === "INCLUDE" ? "Include" : "Exclude";
      const active = cond.polarity === mode;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
      btn.addEventListener("click", () => updateCondition(cond.id, { polarity: mode }));
      polarityToggle.appendChild(btn);
    });
    card.appendChild(polarityToggle);

    const opToggle = document.createElement("div");
    opToggle.className = "mini-mode-toggle small";
    ["AND", "OR"].forEach((mode) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = mode;
      btn.classList.toggle("active", cond.op === mode);
      btn.addEventListener("click", () => updateCondition(cond.id, { op: mode }));
      opToggle.appendChild(btn);
    });
    card.appendChild(opToggle);

    const selectBtn = document.createElement("button");
    selectBtn.type = "button";
    selectBtn.className = "add-button";
    selectBtn.textContent = "Select values…";
    selectBtn.addEventListener("click", () => {
      openSelectionModal(cond.id);
    });
    card.appendChild(selectBtn);

    listEl.appendChild(card);
  });
}

function renderBands() {
  const container = document.getElementById("composeBands");
  if (!container) return;
  container.innerHTML = "";
  const finalIntervals = composeFinalWindows();
  container.appendChild(
    createBandRow("Final Match", finalIntervals, {
      cssClass: "band-final",
      emptyText: "No matching windows.",
      colorKey: "final_match",
    })
  );
  state.conditions.forEach((cond) => {
    const label = getFilterLabel(cond.filterKey, cond.label);
    const windows = cond.selections?.length ? computeConditionWindows(cond) : [];
    const emptyText = cond.selections?.length ? "No matching segments." : "All values";
    container.appendChild(
      createBandRow(
        label,
        windows,
        {
          cssClass: `band-condition ${cond.polarity === "EXCLUDE" ? "exclude" : "include"}`,
          emptyText,
          colorKey: cond.filterKey || cond.bandKey,
        }
      )
    );
  });
  renderComposeSlots(buildSlots());
}

function createBandRow(name, intervals, opts = {}) {
  const { cssClass = "", emptyText = "", colorKey } = opts;
  const color = resolveBandColor(colorKey);
  const row = document.createElement("div");
  row.className = `band-row ${cssClass}`.trim();
  const label = document.createElement("div");
  label.className = "band-label";
  label.textContent = name;
  row.appendChild(label);
  const segments = document.createElement("div");
  segments.className = "segments";
  segments.style.background = hexToRgba(color, 0.12);
  segments.style.borderColor = hexToRgba(color, 0.25);
  const range = Math.max(state.viewEnd - state.viewStart, 1);
  if (!intervals.length) {
    const empty = document.createElement("div");
    empty.className = "band-empty";
    empty.textContent = emptyText || "No data";
    segments.appendChild(empty);
  } else {
    intervals.forEach(([s, e]) => {
      if (e <= s) return;
      const segment = document.createElement("div");
      segment.className = "segment";
      segment.style.left = `${((s - state.viewStart) / range) * 100}%`;
      segment.style.width = `${((e - s) / range) * 100}%`;
      segment.style.background = color;
      segment.style.borderColor = color;
      segments.appendChild(segment);
    });
  }
  row.appendChild(segments);
  return row;
}

function showAddMenu(trigger) {
  if (!state.conditionTypes.length) {
    addCondition();
    renderConditions();
    triggerStateChange();
    return;
  }
  let menu = document.getElementById("conditionMenu");
  if (menu) menu.remove();
  menu = document.createElement("div");
  menu.id = "conditionMenu";
  menu.className = "dropdown-menu";
  state.conditionTypes.forEach((type) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = type.label;
    btn.addEventListener("click", () => {
      addCondition({
        label: type.label,
        filterKey: type.key,
        bandKey: type.bandKey,
      });
      renderConditions();
      menu.remove();
    });
    menu.appendChild(btn);
  });
  document.body.appendChild(menu);
  const rect = trigger.getBoundingClientRect();
  menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
  menu.style.left = `${rect.left + window.scrollX}px`;
  const onClick = (ev) => {
    if (!menu.contains(ev.target)) {
      menu.remove();
      document.removeEventListener("click", onClick);
    }
  };
  document.addEventListener("click", onClick);
}

function loadRules() {
  const rulesReq = fetch("./rules.json").then((resp) => {
    if (!resp.ok) throw new Error("Failed to load rules");
    return resp.json();
  });
  const datasetPath = buildDatasetPath();
  const dataReq = fetch(datasetPath).then((resp) => {
    if (!resp.ok) throw new Error("Failed to load dataset");
    return resp.json();
  });
  return Promise.all([rulesReq, dataReq]).then(([rulesJson, dataJson]) => {
    state.rules = rulesJson;
    applyDataset(dataJson);
    renderBands();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("Compose page loaded");
  const params = new URLSearchParams(window.location.search);
  const city = params.get("city");
  const year = params.get("year");
  state.city = city || state.city || DATASETS[0].slug;
  state.year = String(year || state.year || DATASETS[0].years[0]);
  initializeCityYearSelectors();
  initTimelineControls();
  loadRules()
    .catch((err) => {
      const panel = document.getElementById("conditionsPanel");
      if (panel) {
        const error = document.createElement("div");
        error.className = "state-card";
        error.textContent = err.message || "Unable to load rules.";
        panel.prepend(error);
      }
      console.error(err);
    })
    .finally(() => {
      const restored = restoreState();
      if (!restored || !state.conditions.length) {
        addCondition();
      }
      renderConditions();
      triggerStateChange();
      const addBtn = document.getElementById("addConditionBtn");
      if (addBtn) {
        addBtn.addEventListener("click", (ev) => {
          showAddMenu(addBtn);
          ev.stopPropagation();
        });
      }
      const clearBtn = document.getElementById("clearConditionsBtn");
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          state.conditions = [];
          renderConditions();
          triggerStateChange();
        });
      }
      const allBtn = document.getElementById("matchAllBtn");
      const anyBtn = document.getElementById("matchAnyBtn");
      if (allBtn && anyBtn) {
        allBtn.addEventListener("click", () => setFoldMode("ALL"));
        anyBtn.addEventListener("click", () => setFoldMode("ANY"));
      }
      setFoldMode(state.foldMode);
    });
  console.debug("Compose params:", { city: state.city, year: state.year });
});
function openSelectionModal(conditionId) {
  const backdrop = document.getElementById("composeModalBackdrop");
  const titleEl = document.getElementById("composeModalTitle");
  const bodyEl = document.getElementById("composeModalBody");
  const applyBtn = document.getElementById("composeModalApply");
  const cancelBtn = document.getElementById("composeModalCancel");
  const closeBtn = document.getElementById("composeModalClose");
  if (!backdrop || !bodyEl || !applyBtn || !cancelBtn || !closeBtn) return;

  const condition = state.conditions.find((c) => c.id === conditionId);
  if (!condition) return;
  bodyEl.innerHTML = "";
  if (!state.data?.band_names) {
    const emptyMsg = document.createElement("div");
    emptyMsg.className = "muted";
    emptyMsg.innerHTML = "Dataset not loaded yet — select City/Year and try again.";
    const retryBtn = document.createElement("button");
    retryBtn.type = "button";
    retryBtn.className = "ghost-button";
    retryBtn.textContent = "Reload dataset";
    retryBtn.addEventListener("click", () => {
      loadDatasetOnly().catch(() => {});
    });
    bodyEl.appendChild(emptyMsg);
    bodyEl.appendChild(retryBtn);
  } else {
    const options = getOptionsForCondition(condition);
    if (!options.length) {
      const noOptions = document.createElement("div");
      noOptions.className = "muted";
      const bandKey = FILTER_DEFS[condition.filterKey]?.bandKey;
      noOptions.textContent = bandKey
        ? "This band has no label map in dataset (band_names missing)."
        : "No values available for this band yet.";
      bodyEl.appendChild(noOptions);
    } else {
      const search = document.createElement("input");
      search.type = "search";
      search.placeholder = "Search…";
    search.className = "input";
    bodyEl.appendChild(search);
    const list = document.createElement("div");
    list.className = "checkbox-list";
    bodyEl.appendChild(list);

    const renderList = () => {
      list.innerHTML = "";
      const term = search.value.trim().toLowerCase();
      options
        .filter((opt) => !term || opt.label.toLowerCase().includes(term))
        .forEach((opt) => {
          const label = document.createElement("label");
          label.className = "checkbox-item";
          const input = document.createElement("input");
          input.type = "checkbox";
          input.value = opt.value;
          input.checked = condition.selections.includes(opt.value);
          label.appendChild(input);
          label.appendChild(document.createTextNode(opt.label));
          list.appendChild(label);
        });
    };

      search.addEventListener("input", renderList);
      renderList();
    }
  }

  const closeModal = () => {
    backdrop.classList.add("hidden");
    applyBtn.removeEventListener("click", onApply);
    cancelBtn.removeEventListener("click", closeModal);
    closeBtn.removeEventListener("click", closeModal);
    backdrop.removeEventListener("click", onBackdrop);
    document.removeEventListener("keydown", onKey);
  };

  const onApply = () => {
    const list = bodyEl.querySelectorAll(".checkbox-item input");
    const selected = Array.from(list)
      .filter((input) => input.checked)
      .map((input) => input.value);
    updateCondition(conditionId, { selections: selected });
    closeModal();
  };

  const onBackdrop = (ev) => {
    if (ev.target === backdrop) closeModal();
  };

  const onKey = (ev) => {
    if (ev.key === "Escape") closeModal();
  };

  applyBtn.addEventListener("click", onApply);
  cancelBtn.addEventListener("click", closeModal);
  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", onBackdrop);
  document.addEventListener("keydown", onKey);
  const modalLabel = getFilterLabel(condition.filterKey, condition.label);
  titleEl.textContent = `Select values for ${modalLabel}`;
  backdrop.classList.remove("hidden");
}

function getOptionsForCondition(condition) {
  if (!condition?.filterKey) return [];
  if (!state.data) return [];
  return getOptionsForFilterKey(
    condition.filterKey,
    { FILTER_DEFS },
    state.data,
    bandOptionsCache,
    optionLabelMap
  ).map((opt) => ({
    value: String(opt.value),
    label: opt.label,
  }));
}
function buildDatasetPath() {
  const citySlug = state.city || "bangalore";
  const year = state.year || "2025";
  return `./panchanga_json/panchanga_${citySlug}_${year}.json`;
}

function getDatasetBounds(data) {
  if (!data?.bands) return [0, 365];
  let minStart = Infinity;
  let maxEnd = -Infinity;
  Object.values(data.bands).forEach((band) => {
    (band?.intervals || []).forEach(([s, e]) => {
      if (s < minStart) minStart = s;
      if (e > maxEnd) maxEnd = e;
    });
  });
  if (!Number.isFinite(minStart) || !Number.isFinite(maxEnd)) return [0, 365];
  return [minStart, maxEnd];
}

function saveState() {
  try {
    const payload = {
      city: state.city,
      year: state.year,
      mode: state.mode,
      foldMode: state.foldMode,
      conditions: state.conditions,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("Unable to persist compose state", err);
  }
}

function restoreState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed.city) state.city = parsed.city;
    if (parsed.year) state.year = String(parsed.year);
    if (parsed.mode) state.mode = parsed.mode;
    if (parsed.foldMode) state.foldMode = parsed.foldMode;
    if (Array.isArray(parsed.conditions)) {
      state.conditions = parsed.conditions.map((cond) => {
        const fallbackKey = cond.filterKey || cond.key || "vara";
        const def = FILTER_DEFS[fallbackKey] || {};
        return {
          id: cond.id || newId(),
          label: getFilterLabel(fallbackKey, cond.label),
          filterKey: fallbackKey,
          bandKey: cond.bandKey || def.bandKey || fallbackKey,
          op: cond.op || "AND",
          polarity: cond.polarity || "INCLUDE",
          selections: cond.selections || [],
        };
      });
    }
    return true;
  } catch (err) {
    console.warn("Unable to load compose state", err);
    return false;
  }
}

function mergeIntervals(intervals) {
  if (!intervals.length) return [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged = [sorted[0].slice()];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];
    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current.slice());
    }
  }
  return merged;
}

function intersectIntervals(a, b) {
  const mergedA = mergeIntervals(a);
  const mergedB = mergeIntervals(b);
  const out = [];
  let i = 0;
  let j = 0;
  while (i < mergedA.length && j < mergedB.length) {
    const [s1, e1] = mergedA[i];
    const [s2, e2] = mergedB[j];
    const start = Math.max(s1, s2);
    const end = Math.min(e1, e2);
    if (end > start) out.push([start, end]);
    if (e1 < e2) i++;
    else j++;
  }
  return out;
}

function unionIntervals(a, b) {
  return mergeIntervals([...a, ...b]);
}

function subtractIntervals(base, removal) {
  const mergedRemoval = mergeIntervals(removal);
  const result = [];
  mergeIntervals(base).forEach(([start, end]) => {
    let current = start;
    mergedRemoval.forEach(([rs, re]) => {
      if (re <= current || rs >= end) return;
      if (rs > current) result.push([current, Math.min(rs, end)]);
      current = Math.max(current, re);
    });
    if (current < end) result.push([current, end]);
  });
  return result;
}

function computeConditionWindows(condition) {
  const band = state.data?.bands?.[condition.bandKey];
  if (!band) return [];
  if (!condition.selections.length) return [];
  const intervals = band.intervals || [];
  return intervals
    .filter((row) => condition.selections.includes(String(row[2])))
    .map((row) => [row[0], row[1]]);
}

function composeFinalWindows() {
  if (!state.conditions.length) return [];
  let result = state.foldMode === "ALL" ? [[state.viewStart, state.viewEnd]] : [];
  state.conditions.forEach((condition) => {
    const windows = computeConditionWindows(condition);
    if (!windows.length && condition.polarity !== "EXCLUDE") return;
    if (condition.polarity === "EXCLUDE") {
      result = subtractIntervals(result, windows);
      return;
    }
    if (!result.length) {
      result = windows;
      return;
    }
    if (state.foldMode === "ANY") {
      result = unionIntervals(result, windows);
    } else {
      result = intersectIntervals(result, windows);
    }
  });
  return mergeIntervals(result);
}

function applyViewWindow(startJd, opts = {}) {
  if (!Number.isFinite(state.datasetStart) || !Number.isFinite(state.datasetEnd)) return;
  const maxStart = Math.max(state.datasetStart, state.datasetEnd - state.windowDays);
  const clampedStart = Math.min(Math.max(startJd, state.datasetStart), maxStart);
  state.viewStart = clampedStart;
  state.viewEnd = Math.min(clampedStart + state.windowDays, state.datasetEnd);
  const available = Math.max(state.datasetEnd - state.datasetStart - state.windowDays, 0);
  state.panRatio = available > 0 ? (state.viewStart - state.datasetStart) / available : 0;
  if (!opts.silent) {
    updateTimelineControls();
    renderBands();
  }
}

function setWindowDays(days) {
  if (!Number.isFinite(days) || days <= 0) return;
  const maxSpan = Math.max(state.datasetEnd - state.datasetStart, 1);
  state.windowDays = Math.min(days, maxSpan);
  applyViewWindow(state.viewStart);
}

function setPanRatio(ratio) {
  const clamped = Math.min(Math.max(ratio, 0), 1);
  const available = Math.max(state.datasetEnd - state.datasetStart - state.windowDays, 0);
  const start = state.datasetStart + clamped * available;
  applyViewWindow(start);
}

function renderComposeSlots(slots) {
  const list = document.getElementById("composeSlots");
  if (!list) return;
  list.innerHTML = "";
  if (!slots.length) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "No slots match the current conditions.";
    list.appendChild(empty);
    return;
  }
  slots.forEach((slot) => {
    list.appendChild(createComposeSlotCard(slot));
  });
}

function createComposeSlotCard(slot) {
  const card = document.createElement("div");
  card.className = "timeslot-card";
  const timeCol = document.createElement("div");
  timeCol.className = "slot-time";
  const range = formatTimeRange(slot.start, slot.end);
  const dateInfo =
    range.startDate === range.endDate
      ? `<div class="slot-date">${range.startDate}</div>`
      : `<div class="slot-date">${range.startDate} → ${range.endDate}</div>`;
  timeCol.innerHTML = `${dateInfo}<div class="slot-time-range"><strong>${range.startTime}</strong><span>→ ${range.endTime}</span></div>`;
  const body = document.createElement("div");
  body.className = "slot-body";
  const label = document.createElement("div");
  label.className = "label slot-title";
  label.textContent = `${formatDurationLabel(slot.start, slot.end)} • ${range.startDate} ${range.startTime} → ${range.endDate} ${range.endTime}`;
  body.appendChild(label);
  const chips = document.createElement("div");
  chips.className = "slot-yogas";
  slot.labels.slice(0, 3).forEach((entry) => {
    const chip = document.createElement("span");
    chip.className = "slot-chip";
    chip.textContent = entry.text;
    if (entry.color) {
      chip.style.background = hexToRgba(entry.color, 0.15);
      chip.style.borderColor = hexToRgba(entry.color, 0.4);
      chip.style.color = entry.color;
    }
    chips.appendChild(chip);
  });
  if (slot.labels.length > 3) {
    const more = document.createElement("span");
    more.className = "slot-chip slot-chip-more";
    more.textContent = `+${slot.labels.length - 3}`;
    chips.appendChild(more);
  }
  if (chips.childElementCount) body.appendChild(chips);
  card.appendChild(timeCol);
  card.appendChild(body);
  return card;
}

function buildSlots() {
  const intervals = composeFinalWindows();
  if (!intervals.length) return [];
  const contributions = new Map();
  state.conditions.forEach((cond) => contributions.set(cond.id, computeConditionWindows(cond)));
  return intervals.map(([start, end]) => {
    const labels = [];
    contributions.forEach((windows, id) => {
      if (windows.some(([s, e]) => s < end && e > start)) {
        const cond = state.conditions.find((c) => c.id === id);
        if (cond) {
          labels.push({
            text: cond.label,
            color: resolveBandColor(cond.filterKey || cond.bandKey),
          });
        }
      }
    });
    return { start, end, labels };
  });
}

function getSelectionLabels(condition) {
  if (!condition?.selections?.length) return [];
  if (!optionLabelMap[condition.filterKey]) {
    getOptionsForCondition(condition);
  }
  const labelMap = optionLabelMap[condition.filterKey];
  if (!labelMap) return condition.selections.slice();
  return condition.selections.map((value) => {
    if (labelMap.has(value)) return labelMap.get(value);
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && labelMap.has(numeric)) return labelMap.get(numeric);
    return value;
  });
}

function setFoldMode(mode) {
  if (state.foldMode === mode) return;
  state.foldMode = mode;
  const allBtn = document.getElementById("matchAllBtn");
  const anyBtn = document.getElementById("matchAnyBtn");
  if (allBtn && anyBtn) {
    allBtn.classList.toggle("slot-pill-active", mode === "ALL");
    anyBtn.classList.toggle("slot-pill-active", mode === "ANY");
  }
  triggerStateChange();
}

function jdToLocalDate(jd) {
  const ms = (jd - 2440587.5) * 86400000 + state.tzHours * 3600 * 1000;
  return new Date(ms);
}

function jdToLocalDateParts(jd) {
  const date = jdToLocalDate(jd);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function localDatePartsToJd(year, month, day) {
  const utcMs = Date.UTC(year, (month || 1) - 1, day || 1) - state.tzHours * 3600 * 1000;
  return utcMs / 86400000 + 2440587.5;
}

function formatTimeRange(startJd, endJd) {
  const start = jdToLocalDate(startJd);
  const end = jdToLocalDate(endJd);
  const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
  return {
    startTime: timeFmt.format(start),
    endTime: timeFmt.format(end),
    startDate: dateFmt.format(start),
    endDate: dateFmt.format(end),
  };
}

function formatDurationLabel(startJd, endJd) {
  const hours = (endJd - startJd) * 24;
  return `Duration ${formatDurationHours(hours)}`;
}

function formatDurationHours(hours) {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m || !parts.length) parts.push(`${m}m`);
  return parts.join(" ");
}

function initTimelineControls() {
  timelineStartInput = document.getElementById("timelineStartInput");
  timelineWindowSlider = document.getElementById("timelineWindowSlider");
  timelinePanSlider = document.getElementById("timelinePanSlider");
  timelineMeta = document.getElementById("timelineMeta");

  if (timelineStartInput) {
    timelineStartInput.addEventListener("change", () => {
      if (!timelineStartInput.value) return;
      const [year, month, day] = timelineStartInput.value.split("-").map((n) => Number(n));
      if (!year) return;
      const jd = localDatePartsToJd(year, month, day);
      applyViewWindow(jd);
    });
  }
  if (timelineWindowSlider) {
    timelineWindowSlider.addEventListener("input", () => {
      setWindowDays(Number(timelineWindowSlider.value));
    });
  }
  if (timelinePanSlider) {
    timelinePanSlider.addEventListener("input", () => {
      const ratio = Number(timelinePanSlider.value) / 100;
      setPanRatio(ratio);
    });
  }
}

function updateTimelineControls() {
  if (timelineStartInput && Number.isFinite(state.viewStart)) {
    const parts = jdToLocalDateParts(state.viewStart);
    timelineStartInput.value = [
      parts.year,
      String(parts.month).padStart(2, "0"),
      String(parts.day).padStart(2, "0"),
    ].join("-");
  }
  if (timelineWindowSlider && Number.isFinite(state.windowDays)) {
    timelineWindowSlider.value = String(Math.round(state.windowDays));
  }
  if (timelinePanSlider) {
    timelinePanSlider.value = String(Math.round((state.panRatio || 0) * 100));
  }
  if (timelineMeta) {
    timelineMeta.textContent = formatViewSummary();
  }
}

function formatViewSummary() {
  if (!Number.isFinite(state.viewStart) || !Number.isFinite(state.viewEnd)) return "";
  const start = jdToLocalDate(state.viewStart);
  const end = jdToLocalDate(state.viewEnd);
  const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit" });
  const startLabel = `${dateFmt.format(start)} ${timeFmt.format(start)}`;
  const endLabel = `${dateFmt.format(end)} ${timeFmt.format(end)}`;
  const spanDays = (state.viewEnd - state.viewStart).toFixed(1);
  return `View ${startLabel} → ${endLabel} (${spanDays} days)`;
}
