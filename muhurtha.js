import {
  DOM,
  state,
  filterState,
  uiState,
  chipContainers,
  modeToggles,
  optionLabelMap,
  bandOptionsCache,
  modalRefs,
  DATASETS,
  FILTER_DEFS,
  FILTER_GROUPS,
  PRESET_DEFS,
  loadingState,
} from "./muhurtha/context.js";
import { getOptionsForFilterKey } from "./shared/filter_options.js";

const {
  centerDateInput,
  windowSlider,
  panSlider,
  muhurthaTimeline,
  muhurthaMeta,
  muhurthaSummary,
  cursorInfo,
  cursorSummary,
  stackedBar,
  timeslotList,
  slotModeToggleBtn,
  slotYogaTrigger,
  slotYogaMenu,
  citySelect,
  yearSelect,
  goodFilterList,
  badFilterList,
  jumpTodayBtn,
  clearFiltersBtn,
  heroTitleEl,
  heroMetaEl,
  heroWindowEl,
  heroGoodEl,
  heroBadEl,
  filterSearchInput,
  summaryGoodEl,
  summaryBadEl,
  summaryGoodHoursEl,
  summaryBadHoursEl,
  summaryRulesEl,
  goodSummaryEl,
  badSummaryEl,
  timelinePanel,
  activeFiltersBar,
} = DOM;

const selectedYogas = state.selectedYogas;

const loadingTargets = [
  heroTitleEl,
  summaryGoodEl,
  summaryBadEl,
  summaryGoodHoursEl,
  summaryBadHoursEl,
  summaryRulesEl,
];

function updateSlotToggleHint() {
  if (!slotModeToggleBtn) return;
  slotModeToggleBtn.textContent = state.goodSlotsOnly ? "Good only" : "All windows";
  slotModeToggleBtn.classList.toggle("slot-pill-active", state.goodSlotsOnly);
  slotModeToggleBtn.setAttribute("aria-pressed", state.goodSlotsOnly ? "true" : "false");
}

function getSelectedYogaValues() {
  return Array.from(selectedYogas);
}

function updateYogaTriggerLabel() {
  if (!slotYogaTrigger) return;
  if (!selectedYogas.size) {
    slotYogaTrigger.textContent = "All yogas";
  } else if (selectedYogas.size === 1) {
    slotYogaTrigger.textContent = Array.from(selectedYogas)[0];
  } else {
    slotYogaTrigger.textContent = `${selectedYogas.size} yogas selected`;
  }
}

function populateYogaFilterOptions() {
  if (!slotYogaMenu || !state.rules?.yogas) return;
  const seen = new Set();
  state.rules.yogas.forEach((rule) => {
    const label = rule?.name;
    if (!label || seen.has(label)) return;
    seen.add(label);
  });
  slotYogaMenu.innerHTML = "";
  slotYogaMenu.innerHTML = "";
  Array.from(seen)
    .sort((a, b) => a.localeCompare(b))
    .forEach((name) => {
      const opt = document.createElement("label");
      opt.className = "slot-option";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = name;
      input.checked = selectedYogas.has(name);
      input.addEventListener("change", (ev) => {
        if (ev.target.checked) {
          selectedYogas.add(name);
        } else {
          selectedYogas.delete(name);
        }
        updateYogaTriggerLabel();
        render();
      });
      const text = document.createElement("span");
      text.textContent = name;
      opt.appendChild(input);
      opt.appendChild(text);
      slotYogaMenu.appendChild(opt);
    });
  updateYogaTriggerLabel();
}

function toggleYogaMenu(force) {
  if (!slotYogaMenu || !slotYogaTrigger) return;
  state.yogaMenuOpen = typeof force === "boolean" ? force : !state.yogaMenuOpen;
  slotYogaMenu.classList.toggle("hidden", !state.yogaMenuOpen);
  slotYogaTrigger.classList.toggle("slot-select-active", state.yogaMenuOpen);
  slotYogaTrigger.setAttribute("aria-expanded", state.yogaMenuOpen ? "true" : "false");
}

function updateYearSelectOptions() {
  if (!yearSelect) return;
  const dataset = DATASETS.find((c) => c.slug === state.currentCitySlug) || DATASETS[0];
  yearSelect.innerHTML = "";
  dataset.years.forEach((year) => {
    const opt = document.createElement("option");
    opt.value = String(year);
    opt.textContent = year;
    yearSelect.appendChild(opt);
  });
  if (!dataset.years.includes(state.currentYear)) {
    state.currentYear = dataset.years[0];
  }
  yearSelect.value = String(state.currentYear);
}

function syncCityYearSelectors() {
  if (citySelect) {
    citySelect.value = state.currentCitySlug;
  }
  updateYearSelectOptions();
}

function initializeCityYearSelectors() {
  if (!citySelect || !yearSelect) return;
  citySelect.innerHTML = "";
  DATASETS.forEach((city) => {
    const opt = document.createElement("option");
    opt.value = city.slug;
    opt.textContent = city.cityName;
    citySelect.appendChild(opt);
  });
  citySelect.addEventListener("change", () => {
    state.currentCitySlug = citySelect.value;
    const dataset = DATASETS.find((c) => c.slug === state.currentCitySlug);
    if (dataset) {
      if (!dataset.years.includes(state.currentYear)) {
        state.currentYear = dataset.years[0];
      }
    }
    updateYearSelectOptions();
    loadData(state.currentCitySlug, state.currentYear);
  });
  yearSelect.addEventListener("change", () => {
    const nextYear = parseInt(yearSelect.value, 10);
    if (Number.isNaN(nextYear)) return;
    state.currentYear = nextYear;
    loadData(state.currentCitySlug, state.currentYear);
  });
  syncCityYearSelectors();
}
function debounce(fn, wait = 100) {
  let timeoutId = null;
  return function debounced(...args) {
    const ctx = this;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn.apply(ctx, args);
    }, wait);
  };
}
const scheduleRender = debounce(() => render(), 60);

function clearRectCache() {
  state.rectCache = new WeakMap();
}

function getCachedRect(el) {
  if (!el) return null;
  let rect = state.rectCache.get(el);
  if (!rect) {
    rect = el.getBoundingClientRect();
    state.rectCache.set(el, rect);
  }
  return rect;
}

function ensureHelperStyles() {
  if (document.getElementById("muhurtha-helper-styles")) return;
  const style = document.createElement("style");
  style.id = "muhurtha-helper-styles";
  style.textContent = `
.skeleton-block{
  position:relative;
  overflow:hidden;
  border-radius:12px;
  background:linear-gradient(90deg,#f1f5f9 0%,#e3e8ef 50%,#f1f5f9 100%);
  animation:skeletonPulse 1.4s ease infinite;
}
@keyframes skeletonPulse{
  0%{background-position:-200px 0;}
  100%{background-position:200px 0;}
}
.timeline-error{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
  padding:12px 16px;
  border:1px solid rgba(239,68,68,0.3);
  border-radius:14px;
  background:rgba(239,68,68,0.08);
  color:#991b1b;
  margin-bottom:12px;
}
.timeline-error button{
  border:none;
  background:transparent;
  font-size:18px;
  cursor:pointer;
  color:inherit;
}
.empty-state{
  padding:16px;
  border:1px solid var(--border);
  border-radius:14px;
  background:#fff;
  color:var(--text);
  box-shadow:none;
}
.empty-state ul{
  margin:8px 0 0;
  padding-left:20px;
  color:var(--muted);
}
`;
  document.head.appendChild(style);
}

function applySkeleton(el, height = 18) {
  if (!el) return;
  ensureHelperStyles();
  el.textContent = "";
  el.classList.add("skeleton-block");
  el.style.minHeight = `${height}px`;
}

function clearSkeleton(el) {
  if (!el) return;
  el.classList.remove("skeleton-block");
  el.style.removeProperty("min-height");
}

function setContainerSkeleton(container, height) {
  if (!container) return;
  ensureHelperStyles();
  container.innerHTML = `<div class="skeleton-block" style="height:${height}px;"></div>`;
}

function showLoadingSkeletons() {
  loadingState.skeletonActive = true;
  applySkeleton(heroTitleEl, 26);
  loadingTargets.forEach((el) => applySkeleton(el, 18));
  setContainerSkeleton(muhurthaSummary, 52);
  setContainerSkeleton(stackedBar, 40);
  setContainerSkeleton(muhurthaTimeline, 120);
}

function clearLoadingSkeletons() {
  if (!loadingState.skeletonActive) return;
  loadingState.skeletonActive = false;
  clearSkeleton(heroTitleEl);
  loadingTargets.forEach((el) => clearSkeleton(el));
  [muhurthaSummary, stackedBar, muhurthaTimeline].forEach((container) => {
    if (container) container.innerHTML = "";
  });
}

function showTimelineError(message) {
  ensureHelperStyles();
  if (!timelinePanel) return;
  clearTimelineError();
  const banner = document.createElement("div");
  banner.className = "timeline-error";
  const text = document.createElement("span");
  text.textContent = message;
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Dismiss error");
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => {
    banner.remove();
    loadingState.timelineErrorEl = null;
  });
  banner.appendChild(text);
  banner.appendChild(closeBtn);
  timelinePanel.prepend(banner);
  loadingState.timelineErrorEl = banner;
}

function clearTimelineError() {
  if (loadingState.timelineErrorEl) {
    loadingState.timelineErrorEl.remove();
    loadingState.timelineErrorEl = null;
  }
}

function parseDateInputValue(rawValue, fallbackYear) {
  const fallback = new Date(Date.UTC(fallbackYear, 6, 1));
  if (centerDateInput && centerDateInput.valueAsDate instanceof Date) {
    const asDate = centerDateInput.valueAsDate;
    if (!Number.isNaN(asDate.valueOf())) {
      return new Date(Date.UTC(asDate.getUTCFullYear(), asDate.getUTCMonth(), asDate.getUTCDate()));
    }
  }
  if (!rawValue) return fallback;
  const parts = rawValue.split(/[-\/]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 3) {
    let year;
    let month;
    let day;
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else {
      year = parseInt(parts[2], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[0], 10);
    }
    if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
      return new Date(Date.UTC(year, month - 1, day));
    }
  }
  const parsed = new Date(rawValue);
  if (!Number.isNaN(parsed.valueOf())) {
    return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
  }
  return fallback;
}

function safeToISOString(dateObj) {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.valueOf())) return "";
  return dateObj.toISOString();
}

function isoDateFromDate(dateObj) {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.valueOf())) return "";
  return safeToISOString(new Date(dateObj.getTime())).slice(0, 10);
}

function jdFromDate(dateObj) {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.valueOf())) return NaN;
  return dateObj.getTime() / 86400000 + 2440587.5;
}

function normalizeName(s) {
  if (!s) return "";
  return s.toLowerCase().replace(/[^a-z]/g, "").replace(/oo/g, "u").replace(/aa/g, "a");
}

function buildNameMap(arr) {
  const map = new Map();
  arr.forEach((v, idx) => map.set(normalizeName(v), idx));
  return map;
}

function getValueSetFromNames(array, lookup, nameMap, oneBased = false) {
  const set = new Set();
  if (!Array.isArray(array)) return set;
  const offset = oneBased ? 1 : 0;
  array.forEach((name) => {
    const norm = normalizeName(name);
    let idx = nameMap?.get(norm);
    if (idx === undefined || idx === null) {
      idx = lookup.findIndex((v) => normalizeName(v) === norm);
    }
    if (idx >= 0) set.add(idx + offset);
  });
  return set;
}

function isGoodYoga(yoga) {
  return yoga.category === "benefic" || (yoga.strength || 0) > 0;
}

function jdToLocalStr(jd) {
  if (!Number.isFinite(jd)) return "–";
  const ms = (jd - 2440587.5) * 86400000 + state.tzHours * 3600 * 1000;
  if (!Number.isFinite(ms)) return "–";
  const d = new Date(ms);
  if (Number.isNaN(d.valueOf())) return "–";
  return safeToISOString(d).replace("T", " ").slice(0, 16);
}

function jdToLocalTime(jd) {
  const str = jdToLocalStr(jd);
  return str === "–" ? str : str.slice(11);
}

function jdToLocalDateParts(jd) {
  if (!Number.isFinite(jd)) return { iso: "", label: "" };
  const ms = (jd - 2440587.5) * 86400000 + state.tzHours * 3600 * 1000;
  const d = new Date(ms);
  if (Number.isNaN(d.valueOf())) return { iso: "", label: "" };
  const iso = safeToISOString(d).slice(0, 10);
  const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return { iso, label };
}

function formatTimeRange(startJd, endJd) {
  return { start: jdToLocalTime(startJd), end: jdToLocalTime(endJd) };
}

function formatDurationHours(hours) {
  const totalMinutes = Math.round(hours * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (!hrs) return `${mins}m`;
  if (!mins) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

function formatRangeList(ranges) {
  if (!ranges || !ranges.length) return "";
  return ranges.map((r) => `${jdToLocalTime(r.start)} → ${jdToLocalTime(r.end)}`).join(", ");
}

function jdToISODate(jd) {
  if (!Number.isFinite(jd)) return "";
  const d = new Date((jd - 2440587.5) * 86400000);
  if (Number.isNaN(d.valueOf())) return "";
  return safeToISOString(d).slice(0, 10);
}

function collectIntervalsByValues(band, values) {
  const rows = state.data?.bands?.[band]?.intervals || [];
  if (!values || !values.size) return [];
  return rows.filter((r) => r[2] !== null && values.has(r[2]));
}

function intersectTwo(a, b) {
  const out = [];
  let i = 0,
    j = 0;
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

function buildTithiSet(obj, tithiFamilies) {
  // Rules are treated as 0-based indices: 0..29
  const set = new Set();
  if (Array.isArray(obj?.tithis)) obj.tithis.forEach((t) => set.add(t));
  if (obj?.tithi !== undefined && obj?.tithi !== null) set.add(obj.tithi);
  if (Array.isArray(obj?.tithiFamilies)) {
    obj.tithiFamilies.forEach((fam) => (tithiFamilies[fam] || []).forEach((t) => set.add(t)));
  }
  return set;
}

function initializeFilters() {
  if (!state.rules) return;
  filterState.selected = new Set(state.rules.yogas.map((y) => y.id));
  uiState.rules = {};
  Object.keys(bandOptionsCache).forEach((key) => delete bandOptionsCache[key]);
  Object.keys(optionLabelMap).forEach((key) => delete optionLabelMap[key]);
  Object.keys(modeToggles).forEach((key) => delete modeToggles[key]);
  Object.keys(FILTER_DEFS).forEach((key) => {
    uiState.rules[key] = { include: new Set(), exclude: new Set(), mode: "include", overrideMode: null };
  });
  buildFilterPanel();
  renderSpecialComboLists();
  syncRulesToLegacyFilters();
}

function buildFilterPanel() {
  const basicContainer = document.querySelector("#basicFilterGroups");
  const advancedContainer = document.querySelector("#advancedFilterGroups");
  const expertContainer = document.querySelector("#expertFilterGroups");
  if (!basicContainer || !advancedContainer || !expertContainer) return;
  Object.keys(chipContainers).forEach((key) => delete chipContainers[key]);
  basicContainer.innerHTML = "";
  advancedContainer.innerHTML = "";
  expertContainer.innerHTML = "";

  FILTER_GROUPS.forEach((group) => {
    const section = document.createElement("section");
    section.className = "filter-group";
    const header = document.createElement("div");
    header.className = "filter-group-header";
    const textWrap = document.createElement("div");
    const title = document.createElement("div");
    title.className = "filter-group-title";
    title.textContent = `${group.icon} ${group.title}`;
    const helper = document.createElement("p");
    helper.className = "filter-group-helper";
    helper.textContent = group.helper;
    textWrap.appendChild(title);
    textWrap.appendChild(helper);
    header.appendChild(textWrap);
    if (group.filters && group.filters.length) {
      const collapseBtn = document.createElement("button");
      collapseBtn.type = "button";
      collapseBtn.className = "collapse-btn";
      collapseBtn.setAttribute("aria-label", "Toggle group");
      collapseBtn.textContent = "▾";
      collapseBtn.addEventListener("click", () => {
        section.classList.toggle("collapsed-body");
      });
      header.appendChild(collapseBtn);
    }
    section.appendChild(header);
    const body = document.createElement("div");
    body.className = "filter-group-body";
    group.filters.forEach((filterKey) => {
      body.appendChild(createFilterField(filterKey));
    });
    section.appendChild(body);

    if (group.level === "basic") basicContainer.appendChild(section);
    else advancedContainer.appendChild(section);
  });

  const advancedToggle = document.getElementById("advancedToggle");
  const specialSection = document.getElementById("specialCombosSection");
  const hasAdvanced = advancedContainer.childElementCount > 0;
  if (advancedToggle) {
    advancedToggle.style.display = hasAdvanced ? "" : "none";
  }
  if (!hasAdvanced) {
    advancedContainer.classList.add("collapsed");
    if (specialSection) {
      specialSection.classList.remove("collapsed");
    }
  }

  buildExpertOverrides(expertContainer);
  bindFilterPanelEvents();
  renderFilterChips();
  Object.keys(FILTER_DEFS).forEach((key) => updateModeToggle(key));
  setupFilterSearch();
}

function createFilterField(filterKey) {
  const def = FILTER_DEFS[filterKey];
  const field = document.createElement("div");
  field.className = "filter-field";
  const header = document.createElement("div");
  header.className = "field-header";
  const label = document.createElement("span");
  label.className = "field-label";
  label.textContent = def?.label || filterKey;
  header.appendChild(label);
  const controls = document.createElement("div");
  controls.className = "field-controls";
  const toggle = document.createElement("div");
  toggle.className = "mini-mode-toggle";
  const includeBtn = document.createElement("button");
  includeBtn.type = "button";
  includeBtn.dataset.mode = "include";
  includeBtn.textContent = "+ Include";
  includeBtn.addEventListener("click", () => setFilterMode(filterKey, "include"));
  const excludeBtn = document.createElement("button");
  excludeBtn.type = "button";
  excludeBtn.dataset.mode = "exclude";
  excludeBtn.textContent = "– Exclude";
  excludeBtn.addEventListener("click", () => setFilterMode(filterKey, "exclude"));
  toggle.appendChild(includeBtn);
  toggle.appendChild(excludeBtn);
  modeToggles[filterKey] = { includeBtn, excludeBtn, wrapper: toggle };
  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "add-button";
  addBtn.textContent = `Add ${def?.label || filterKey}`;
  addBtn.addEventListener("click", (ev) => openFilterModal(filterKey, ev.currentTarget));
  controls.appendChild(toggle);
  controls.appendChild(addBtn);
  header.appendChild(controls);
  field.appendChild(header);
  const chips = document.createElement("div");
  chips.className = "chip-collection";
  chips.innerHTML = '<span class="placeholder">No rules set</span>';
  chipContainers[filterKey] = chips;
  field.appendChild(chips);
  return field;
}

function buildExpertOverrides(container) {
  const list = document.createElement("div");
  list.className = "constraint-group";
  Object.keys(FILTER_DEFS).forEach((key) => {
    const def = FILTER_DEFS[key];
    const row = document.createElement("label");
    row.className = "pill-checkbox";
    const select = document.createElement("select");
    select.innerHTML = `
      <option value="inherit">Inherit mode</option>
      <option value="include">Always include</option>
      <option value="exclude">Always exclude</option>
    `;
    const entry = ensureRuleRecord(key);
    select.value = entry.overrideMode || "inherit";
    select.addEventListener("change", () => {
      setOverrideMode(key, select.value);
    });
    const span = document.createElement("span");
    span.textContent = def.label;
    row.appendChild(select);
    row.appendChild(span);
    list.appendChild(row);
  });
  container.appendChild(list);
}

function setupFilterSearch() {
  if (!filterSearchInput) return;
  const apply = () => {
    const term = filterSearchInput.value.trim().toLowerCase();
    document.querySelectorAll(".filter-field").forEach((field) => {
      const label = field.querySelector(".field-label");
      const matches = !term || (label?.textContent || "").toLowerCase().includes(term);
      field.style.display = matches ? "" : "none";
    });
  };
  const debouncedApply = debounce(apply, 120);
  filterSearchInput.addEventListener("input", debouncedApply);
  filterSearchInput.addEventListener("change", apply);
  apply();
}

function setOverrideMode(filterKey, value) {
  const entry = ensureRuleRecord(filterKey);
  if (value === "inherit") {
    entry.overrideMode = null;
  } else {
    entry.overrideMode = value;
    entry.mode = value;
  }
  updateModeToggle(filterKey);
}

function ensureRuleRecord(filterKey) {
  if (!uiState.rules[filterKey]) {
    uiState.rules[filterKey] = { include: new Set(), exclude: new Set(), mode: "include", overrideMode: null };
  }
  return uiState.rules[filterKey];
}

function getEffectiveMode(filterKey) {
  const entry = ensureRuleRecord(filterKey);
  return entry.overrideMode || entry.mode || "include";
}

function setFilterMode(filterKey, mode) {
  const entry = ensureRuleRecord(filterKey);
  if (entry.overrideMode) return;
  entry.mode = mode;
  updateModeToggle(filterKey);
}

function updateModeToggle(filterKey) {
  const controls = modeToggles[filterKey];
  if (!controls) return;
  const entry = ensureRuleRecord(filterKey);
  const mode = getEffectiveMode(filterKey);
  controls.includeBtn.classList.toggle("active", mode === "include");
  controls.excludeBtn.classList.toggle("active", mode === "exclude");
  const locked = !!entry.overrideMode;
  controls.includeBtn.disabled = locked;
  controls.excludeBtn.disabled = locked;
  if (locked) controls.wrapper.classList.add("locked");
  else controls.wrapper.classList.remove("locked");
}

function renderFilterChips() {
  Object.keys(FILTER_DEFS).forEach((key) => {
    const chipsEl = chipContainers[key];
    if (!chipsEl) return;
    const entry = ensureRuleRecord(key);
    if (!optionLabelMap[key]) {
      getOptionsForFilter(key);
    }
    chipsEl.innerHTML = "";
    if (!entry.include.size && !entry.exclude.size) {
      chipsEl.innerHTML = '<span class="placeholder">No rules set</span>';
      updateModeToggle(key);
      return;
    }
    entry.include.forEach((val) => chipsEl.appendChild(createRuleChip(key, val, "include")));
    entry.exclude.forEach((val) => chipsEl.appendChild(createRuleChip(key, val, "exclude")));
    updateModeToggle(key);
  });
}

function createRuleChip(filterKey, value, mode) {
  const def = FILTER_DEFS[filterKey];
  const labelMap = optionLabelMap[filterKey] || new Map();
  const chip = document.createElement("span");
  chip.className = `filter-chip ${mode === "exclude" ? "bad" : ""}`;
  const prefix = mode === "exclude" ? "–" : "+";
  chip.textContent = `${prefix} ${labelMap.get(value) || value}`;
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = "✕";
  removeBtn.addEventListener("click", () => {
    const entry = ensureRuleRecord(filterKey);
    const target = mode === "exclude" ? entry.exclude : entry.include;
    target.delete(value);
    renderFilterChips();
    syncRulesToLegacyFilters();
    render();
  });
  chip.appendChild(removeBtn);
  return chip;
}

function getActiveFilterItems() {
  const items = [];
  Object.keys(FILTER_DEFS).forEach((key) => {
    const entry = ensureRuleRecord(key);
    if (!entry.include.size && !entry.exclude.size) return;
    if (!optionLabelMap[key]) {
      getOptionsForFilter(key);
    }
    const labelMap = optionLabelMap[key] || new Map();
    entry.include.forEach((val) => {
      items.push({ mode: "include", text: `+ ${labelMap.get(val) || FILTER_DEFS[key].label}` });
    });
    entry.exclude.forEach((val) => {
      items.push({ mode: "exclude", text: `– ${labelMap.get(val) || FILTER_DEFS[key].label}` });
    });
  });
  if (state.rules?.yogas?.length) {
    const total = state.rules.yogas.length;
    const selected = filterState.selected.size || 0;
    if (selected && selected !== total) {
      items.push({ mode: "include", text: `Muhurthas ${selected}/${total}` });
    }
  }
  return items;
}

function renderActiveFiltersBar(goodCount = 0, badCount = 0) {
  if (!activeFiltersBar) return;
  const activeItems = getActiveFilterItems();
  const total = activeItems.length;
  activeFiltersBar.innerHTML = "";

  const left = document.createElement("div");
  left.className = "active-filters-meta";
  const label = document.createElement("span");
  label.textContent = "Active filters";
  const count = document.createElement("span");
  count.className = "count";
  count.textContent = total;
  left.appendChild(label);
  left.appendChild(count);
  activeFiltersBar.appendChild(left);

  const chipsWrap = document.createElement("div");
  chipsWrap.className = "active-filters-chips";
  if (!total) {
    const none = document.createElement("span");
    none.className = "muted";
    none.textContent = "None applied";
    chipsWrap.appendChild(none);
  } else {
    const maxChips = 5;
    activeItems.slice(0, maxChips).forEach((item) => {
      const chip = document.createElement("span");
      chip.className = `mini-chip ${item.mode === "exclude" ? "bad" : ""}`;
      chip.textContent = item.text;
      chipsWrap.appendChild(chip);
    });
    if (total > maxChips) {
      const moreChip = document.createElement("span");
      moreChip.className = "mini-chip more";
      moreChip.textContent = `+${total - maxChips}`;
      chipsWrap.appendChild(moreChip);
    }
  }
  activeFiltersBar.appendChild(chipsWrap);

  const right = document.createElement("div");
  right.className = "active-filters-actions";
  const counts = document.createElement("span");
  counts.className = "counts";
  counts.textContent = `Good ${goodCount} / Bad ${badCount}`;
  right.appendChild(counts);
  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "link-button";
  clearBtn.textContent = "Clear";
  clearBtn.disabled = total === 0;
  clearBtn.addEventListener("click", () => {
    if (clearBtn.disabled) return;
    resetFilters();
  });
  right.appendChild(clearBtn);
  activeFiltersBar.appendChild(right);
}

function bindFilterPanelEvents() {
  const advancedToggle = document.getElementById("advancedToggle");
  const advancedSection = document.getElementById("advancedFilterGroups");
  const specialSection = document.getElementById("specialCombosSection");
  if (advancedToggle && advancedSection) {
    advancedToggle.addEventListener("click", () => {
      advancedToggle.classList.toggle("open");
      advancedSection.classList.toggle("collapsed");
      if (specialSection) specialSection.classList.toggle("collapsed");
    });
  }
  const expertToggle = document.getElementById("expertToggle");
  const expertSection = document.getElementById("expertFilterGroups");
  if (expertToggle && expertSection) {
    expertToggle.addEventListener("click", () => {
      expertToggle.classList.toggle("open");
      expertSection.classList.toggle("collapsed");
    });
  }
}

function getOptionsForFilter(filterKey) {
  return getOptionsForFilterKey(filterKey, { FILTER_DEFS }, state.data, bandOptionsCache, optionLabelMap);
}

function openFilterModal(filterKey, triggerEl = null) {
  const def = FILTER_DEFS[filterKey];
  if (!def) return;
  const modal = document.getElementById("filterModal");
  if (!modal) return;
  const entry = ensureRuleRecord(filterKey);
  const defaultMode = getEffectiveMode(filterKey);
  modalRefs.trigger = triggerEl || document.activeElement;
  modalRefs.state = {
    filterKey,
    locked: !!entry.overrideMode,
    mode: defaultMode,
    search: "",
    selected: new Set(entry[defaultMode === "include" ? "include" : "exclude"]),
  };
  renderFilterModal(def);
  modal.classList.remove("hidden");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.removeAttribute("aria-hidden");
  const focusTarget = getFocusableElements(modal)[0];
  if (focusTarget) focusTarget.focus();
  modalRefs.keyHandler = (ev) => handleModalKeydown(ev, modal);
  document.addEventListener("keydown", modalRefs.keyHandler);
}

function renderFilterModal(def) {
  const modal = document.getElementById("filterModal");
  const title = document.getElementById("modalTitle");
  const helper = document.getElementById("modalHelper");
  const modeRow = document.getElementById("modalModeRow");
  const searchInput = document.getElementById("modalSearch");
  const optionsWrap = document.getElementById("modalOptions");
  const presetWrap = document.getElementById("modalPresets");
  if (!modal || !title || !helper || !modeRow || !searchInput || !optionsWrap || !presetWrap) return;
  title.textContent = `Add ${def.label}`;
  helper.textContent = def.helper || "Select values to include or exclude.";

  modeRow.innerHTML = "";
  const modeLabel = document.createElement("span");
  modeLabel.textContent = modalRefs.state.locked
    ? `Mode locked (${modalRefs.state.mode === "include" ? "Include" : "Exclude"})`
    : "Assign as";
  const toggle = document.createElement("div");
  toggle.className = "mini-mode-toggle small";
  ["include", "exclude"].forEach((mode) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.mode = mode;
    btn.textContent = mode === "include" ? "+ Include" : "– Exclude";
    btn.classList.toggle("active", modalRefs.state.mode === mode);
    btn.disabled = !!modalRefs.state.locked;
    btn.addEventListener("click", () => {
      if (modalRefs.state.locked) return;
      modalRefs.state.mode = mode;
      modalRefs.state.selected = new Set(
        ensureRuleRecord(modalRefs.state.filterKey)[mode === "include" ? "include" : "exclude"]
      );
      renderFilterModal(def);
    });
    toggle.appendChild(btn);
  });
  modeRow.appendChild(modeLabel);
  modeRow.appendChild(toggle);

  const presets = PRESET_DEFS[modalRefs.state.filterKey] || [];
  presetWrap.innerHTML = "";
  presets.forEach((preset) => {
    const chip = document.createElement("span");
    chip.className = "preset-chip";
    chip.textContent = preset.name;
    chip.addEventListener("click", () => {
      modalRefs.state.selected = new Set(preset.values);
      renderFilterModal(def);
    });
    presetWrap.appendChild(chip);
  });

  searchInput.value = modalRefs.state.search;
  searchInput.oninput = () => {
    modalRefs.state.search = searchInput.value.toLowerCase();
    renderFilterModal(def);
  };

  const options = getOptionsForFilter(modalRefs.state.filterKey);
  optionsWrap.innerHTML = "";
  options
    .filter((opt) => opt.label.toLowerCase().includes(modalRefs.state.search || ""))
    .forEach((opt) => {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = modalRefs.state.selected.has(opt.value);
      input.addEventListener("change", () => {
        if (input.checked) modalRefs.state.selected.add(opt.value);
        else modalRefs.state.selected.delete(opt.value);
      });
      label.appendChild(input);
      label.appendChild(document.createTextNode(opt.label));
      optionsWrap.appendChild(label);
    });

  document.getElementById("modalApply").onclick = applyModalSelection;
  document.getElementById("modalClear").onclick = clearModalSelection;
  document.getElementById("modalClose").onclick = closeFilterModal;
}

function getFocusableElements(modal) {
  if (!modal) return [];
  const selectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(modal.querySelectorAll(selectors.join(","))).filter(
    (el) => el.offsetParent !== null || el.getClientRects().length
  );
}

function handleModalKeydown(event, modal) {
  if (event.key === "Escape") {
    event.preventDefault();
    closeFilterModal();
    return;
  }
  if (event.key !== "Tab") return;
  const focusables = getFocusableElements(modal);
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;
  if (event.shiftKey) {
    if (active === first) {
      event.preventDefault();
      last.focus();
    }
  } else if (active === last) {
    event.preventDefault();
    first.focus();
  }
}

function closeFilterModal() {
  const modal = document.getElementById("filterModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    modal.removeAttribute("role");
    modal.removeAttribute("aria-modal");
  }
  if (modalRefs.keyHandler) {
    document.removeEventListener("keydown", modalRefs.keyHandler);
    modalRefs.keyHandler = null;
  }
  if (modalRefs.trigger && typeof modalRefs.trigger.focus === "function") {
    modalRefs.trigger.focus();
  }
  modalRefs.trigger = null;
  modalRefs.state = null;
}

function applyModalSelection() {
  if (!modalRefs.state) return;
  const entry = ensureRuleRecord(modalRefs.state.filterKey);
  const target = modalRefs.state.mode === "include" ? entry.include : entry.exclude;
  const opposite = modalRefs.state.mode === "include" ? entry.exclude : entry.include;
  modalRefs.state.selected.forEach((val) => {
    target.add(val);
    opposite.delete(val);
  });
  renderFilterChips();
  syncRulesToLegacyFilters();
  render();
  closeFilterModal();
}

function clearModalSelection() {
  if (!modalRefs.state) return;
  const entry = ensureRuleRecord(modalRefs.state.filterKey);
  const target = modalRefs.state.mode === "include" ? entry.include : entry.exclude;
  modalRefs.state.selected.forEach((val) => target.delete(val));
  renderFilterChips();
  syncRulesToLegacyFilters();
  render();
  closeFilterModal();
}

function renderSpecialComboLists() {
  if (!state.rules) return;
  if (goodFilterList) goodFilterList.innerHTML = "";
  if (badFilterList) badFilterList.innerHTML = "";
  const good = state.rules.yogas.filter((y) => isGoodYoga(y));
  const bad = state.rules.yogas.filter((y) => !isGoodYoga(y));
  const combinedBad = bad;
  const totals = {
    good: { include: 0, exclude: 0 },
    bad: { include: 0, exclude: 0 },
  };
  const renderGroup = (items, container, bucket, groupKey) => {
    if (!container) return;
    const chipWrap = document.createElement("div");
    chipWrap.className = "chip-collection special";
    const available = [];
    items.forEach((yoga) => {
      if (filterState.selected.has(yoga.id)) {
        bucket.include += 1;
        chipWrap.appendChild(createMuhurthaChip(yoga));
      } else {
        bucket.exclude += 1;
        available.push(yoga);
      }
    });
    if (!chipWrap.childElementCount) {
      const placeholder = document.createElement("span");
      placeholder.className = "placeholder";
      placeholder.textContent = "No muhurthas selected";
      chipWrap.appendChild(placeholder);
    }
    container.appendChild(chipWrap);
    container.appendChild(createMuhurthaAdder(available, groupKey));
  };
  renderGroup(good, goodFilterList, totals.good, "good");
  renderGroup(combinedBad, badFilterList, totals.bad, "bad");
  if (goodSummaryEl) {
    goodSummaryEl.textContent = `Good: ${totals.good.include} on / ${totals.good.exclude} off`;
  }
  if (badSummaryEl) {
    badSummaryEl.textContent = `Bad: ${totals.bad.include} on / ${totals.bad.exclude} off`;
  }
}

function createMuhurthaChip(yoga) {
  const chip = document.createElement("span");
  chip.className = "filter-chip";
  chip.textContent = `+ ${yoga.name} `;
  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = "✕";
  removeBtn.addEventListener("click", () => {
    filterState.selected.delete(yoga.id);
    render();
    renderSpecialComboLists();
  });
  chip.appendChild(removeBtn);
  return chip;
}

function createMuhurthaAdder(available, key) {
  const wrap = document.createElement("div");
  wrap.className = "muhurtha-adder";
  if (!available.length) {
    const span = document.createElement("span");
    span.className = "muted";
    span.textContent = "All muhurthas enabled";
    wrap.appendChild(span);
    return wrap;
  }
  const select = document.createElement("select");
  select.innerHTML = `<option value="">Add ${key === "good" ? "good" : "bad"} muhurtha…</option>`;
  available.forEach((y) => {
    const opt = document.createElement("option");
    opt.value = y.id;
    opt.textContent = y.name;
    select.appendChild(opt);
  });
  select.addEventListener("change", () => {
    const chosen = select.value;
    if (!chosen) return;
    filterState.selected.add(chosen);
    select.value = "";
    render();
    renderSpecialComboLists();
  });
  wrap.appendChild(select);
  return wrap;
}

function syncRulesToLegacyFilters() {
  filterState.bandFilters = {};
  Object.keys(FILTER_DEFS).forEach((key) => {
    const def = FILTER_DEFS[key];
    const entry = ensureRuleRecord(key);
    filterState.bandFilters[def.bandKey] = {
      require: new Set(entry.include),
      block: new Set(entry.exclude),
    };
  });
}

function resetFilters() {
  initializeFilters();
  render();
}

function computeWindowsForYoga(yoga, lookups, maps) {
  const { vara, nakshatra } = lookups;
  const { varaMap, nakMap } = maps;
  // Rule indices are 0-based; band interval values for tithi/nakshatra are normalized in collectIntervalsByValues.
  const tithiFamilies = state.rules.tithiFamilies || {};
  const def = yoga.definition || {};
  const type = def.type;
  const combos = def.combos || def.pairs || def.list || def.triples || [];
  const windows = [];
  const addWindows = (ov) => ov.forEach((iv) => windows.push({ start: iv[0], end: iv[1], yoga }));

  if (type === "varaTithiFamilies") {
    combos.forEach((combo) => {
      const varSet = getValueSetFromNames([combo.vara], vara, varaMap);
      const tNumbers = [];
      (combo.tithiFamilies || []).forEach((fam) => (tithiFamilies[fam] || []).forEach((t) => tNumbers.push(t)));
      const tSet = new Set(tNumbers);
      const ov = intersectAll([collectIntervalsByValues("vara", varSet), collectIntervalsByValues("tithi", tSet)]);
      addWindows(ov);
    });
  } else if (type === "varaTithi" || type === "varaTithiList") {
    combos.forEach((combo) => {
      const varSet = getValueSetFromNames([].concat(combo.vara || []), vara, varaMap);
      const tSet = buildTithiSet(combo, tithiFamilies);
      const ov = intersectAll([collectIntervalsByValues("vara", varSet), collectIntervalsByValues("tithi", tSet)]);
      addWindows(ov);
    });
  } else if (type === "varaNakshatra" || type === "varaNakList") {
    combos.forEach((combo) => {
      const varSet = getValueSetFromNames([].concat(combo.vara || []), vara, varaMap);
      const nakSet = getValueSetFromNames(combo.nakshatras || [], nakshatra, nakMap, true);
      const ov = intersectAll([collectIntervalsByValues("vara", varSet), collectIntervalsByValues("nakshatra", nakSet)]);
      addWindows(ov);
    });
  } else if (type === "tithiNakshatra" || type === "tithiNakList") {
    combos.forEach((combo) => {
      const tSet = buildTithiSet(combo, tithiFamilies);
      const nakSet = getValueSetFromNames(combo.nakshatras || [], nakshatra, nakMap, true);
      const ov = intersectAll([collectIntervalsByValues("tithi", tSet), collectIntervalsByValues("nakshatra", nakSet)]);
      addWindows(ov);
    });
  } else if (type === "triple" || type === "tripleList") {
    if (def.triples) {
      def.triples.forEach((tr) => {
        const varSet = getValueSetFromNames([tr.vara], vara, varaMap);
        const tSet = buildTithiSet(tr, tithiFamilies);
        const nakSet = getValueSetFromNames(tr.nakshatras || [], nakshatra, nakMap, true);
        const ov = intersectAll([
          collectIntervalsByValues("vara", varSet),
          collectIntervalsByValues("tithi", tSet),
          collectIntervalsByValues("nakshatra", nakSet),
        ]);
        addWindows(ov);
      });
    } else {
      const varSet = getValueSetFromNames(def.maleficVaras, vara, varaMap);
      const tNumbers = [];
      (def.tithiFamilies || []).forEach((fam) => (tithiFamilies[fam] || []).forEach((t) => tNumbers.push(t)));
      const tSet = new Set(tNumbers);
      const nakSet = getValueSetFromNames(def.nakshatras, nakshatra, nakMap, true);
      const ov = intersectAll([
        collectIntervalsByValues("vara", varSet),
        collectIntervalsByValues("tithi", tSet),
        collectIntervalsByValues("nakshatra", nakSet),
      ]);
      addWindows(ov);
    }
  } else if (type === "band") {
    const bandKey = def.band_type || def.band;
    const rows = bandKey ? state.data?.bands?.[bandKey]?.intervals || [] : [];
    if (rows.length) {
      const bandWindows = rows.map((row) => [row[0], row[1]]);
      addWindows(bandWindows);
    }
  }
  return windows;
}

function loadData(citySlug = state.currentCitySlug, year = state.currentYear) {
  state.currentCitySlug = citySlug;
  state.currentYear = year;
  showLoadingSkeletons();
  clearTimelineError();
  if (muhurthaMeta) muhurthaMeta.textContent = "Loading data…";
  const jsonPath = `./panchanga_json/panchanga_${citySlug}_${year}.json`;
  Promise.all([fetch(jsonPath), fetch("./rules.json")])
    .then(async ([r1, r2]) => {
      if (!r1.ok) throw new Error("Failed to load JSON");
      if (!r2.ok) throw new Error("Failed to load rules");
      const jsonData = await r1.json();
      const jsonRules = await r2.json();
      return { jsonData, jsonRules };
    })
    .then(({ jsonData, jsonRules }) => {
      clearTimelineError();
      clearLoadingSkeletons();
      state.data = jsonData;
      state.rules = jsonRules;
      state.tzHours = parseFloat(state.data.meta?.tz_hours ?? 0);
      selectedYogas.clear();
      toggleYogaMenu(false);
      updateYogaTriggerLabel();
      if (heroTitleEl) heroTitleEl.textContent = `${state.data.meta?.city_name || "City"} Panchanga`;
      if (heroMetaEl) {
        const tz = state.data.meta?.tz_name || "Timezone";
        const yearLabel = state.data.meta?.year ? `• ${state.data.meta.year}` : "";
        heroMetaEl.textContent = `${tz} ${yearLabel}`.trim();
      }
      const year = state.data.meta?.year || new Date().getFullYear();
      const today = new Date();
      const isoToday = today.toISOString().slice(0, 10);
      const useToday = today.getUTCFullYear() === year;
      centerDateInput.value = useToday ? isoToday : `${year}-07-01`;
      updatePanSliderFromDate();
      syncCityYearSelectors();
      initializeFilters();
      populateYogaFilterOptions();
      computeAll();
      render();
    })
    .catch((err) => {
      clearLoadingSkeletons();
      showTimelineError(err.message || "Failed to load data.");
      if (muhurthaMeta) muhurthaMeta.textContent = `Error: ${err.message}`;
      renderActiveFiltersBar(0, 0);
      renderEmptyState("Unable to load data for this year.");
    });
}

function computeAll() {
  if (!state.rules || !state.data) return;
  const lookups = {
    vara: state.data.lookups?.vara || [],
    nakshatra: state.data.lookups?.nakshatra || [],
  };
  const maps = { varaMap: buildNameMap(lookups.vara), nakMap: buildNameMap(lookups.nakshatra) };
  const yogasSorted = [...state.rules.yogas].sort((a, b) => {
    const scoreA = a.strength || 0;
    const scoreB = b.strength || 0;
    return scoreB - scoreA; // positives first
  });

  state.yogaStrengthMap = new Map();
  state.rules.yogas.forEach((yoga) => {
    state.yogaStrengthMap.set(yoga.name, yoga.strength || 0);
  });

  state.muhurthaAll = yogasSorted.map((yoga) => {
    const windows = computeWindowsForYoga(yoga, lookups, maps).sort((a, b) => a[0] - b[0]);
    return { yoga, windows };
  });
}

function render() {
  clearRectCache();
  if (!state.data || !state.rules) return;
  const year = state.data.meta?.year || new Date().getFullYear();
  const rawWindow = parseInt(windowSlider?.value ?? "", 10);
  const windowDays = Number.isFinite(rawWindow) && rawWindow > 0 ? rawWindow : 120;
  const centerDate = parseDateInputValue(centerDateInput.value, year);
  const isoCenter = isoDateFromDate(centerDate) || `${year}-07-01`;
  if (centerDateInput.value !== isoCenter) {
    centerDateInput.value = isoCenter;
  }
  const centerJd = jdFromDate(centerDate);
  state.viewStart = centerJd;
  state.viewEnd = centerJd + windowDays;
  state.centerFocusJd = centerJd;
  const filtered = getFilteredMuhurthas();
  state.currentView = filtered;
  muhurthaTimeline.innerHTML = "";
  state.timelineCursor = null;
  state.timelineLabel = null;
  state.timelineOverlay = null;
  state.stackedCursor = null;
  state.stackedLabel = null;
  stackedBar.innerHTML = "";
  stackedBar.classList.add("stacked-bar");

  const totalWindows = filtered.reduce((acc, m) => acc + m.windows.length, 0);
  const goodTotal = filtered.filter(({ yoga }) => isGoodYoga(yoga)).reduce((acc, m) => acc + m.windows.length, 0);
  const badTotal = filtered.filter(({ yoga }) => !isGoodYoga(yoga)).reduce((acc, m) => acc + m.windows.length, 0);
  const goodHours = categoryHours(filtered, true);
  const badHours = categoryHours(filtered, false);
  updateSummaryCards(goodTotal, badTotal, goodHours, badHours);
  renderActiveFiltersBar(goodTotal, badTotal);

  const centerStr = isoCenter;
  const totalSelected = filterState.selected.size || state.rules.yogas.length;
  const selectionText = totalSelected === state.rules.yogas.length ? "All muhurthas" : `${totalSelected} muhurthas`;
  const summaryText = `${centerStr} → +${windowDays} days — ${selectionText} • Good ${goodTotal} (${goodHours.toFixed(
    1
  )}h) · Bad ${badTotal} (${badHours.toFixed(1)}h)`;
  const metaText = `Showing ${filtered.length} / ${state.rules.yogas.length} yogas • Windows in view: ${totalWindows} • View ${jdToLocalStr(
    state.viewStart
  )} → ${jdToLocalStr(state.viewEnd)}`;
  if (muhurthaMeta) muhurthaMeta.textContent = metaText;
  if (muhurthaSummary) muhurthaSummary.textContent = summaryText;

  if (!filtered.length) {
    renderEmptyState(summaryText);
    return;
  }
  state.timelineOverlay = document.createElement("div");
  state.timelineOverlay.className = "cursor-overlay";
  muhurthaTimeline.appendChild(state.timelineOverlay);

  state.timelineCursor = document.createElement("div");
  state.timelineCursor.className = "cursor-line";
  state.timelineOverlay.appendChild(state.timelineCursor);

  state.timelineLabel = document.createElement("div");
  state.timelineLabel.className = "cursor-label";
  state.timelineOverlay.appendChild(state.timelineLabel);

  const onMove = (ev) => {
    const rect = muhurthaTimeline.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const pct = Math.min(1, Math.max(0, x / rect.width));
    setCursorByPct(pct);
  };
  const onClick = (ev) => {
    setCursorFromEvent(ev, muhurthaTimeline);
  };

  muhurthaTimeline.addEventListener("mousemove", onMove);
  muhurthaTimeline.addEventListener("mousedown", onClick);

  filtered.forEach(({ yoga, windows }) => {
    const row = document.createElement("div");
    row.className = "band-row";
    const label = document.createElement("div");
    label.className = "band-label";
    label.textContent = yoga.name;
    row.appendChild(label);

    const segs = document.createElement("div");
    segs.className = "segments";

    const color = isGoodYoga(yoga) ? "#22c55e" : "#ef4444";

    windows.forEach((iv) => {
      const s = Math.max(iv[0], state.viewStart);
      const e = Math.min(iv[1], state.viewEnd);
      if (e <= s) return;
      const pctStart = ((s - state.viewStart) / (state.viewEnd - state.viewStart)) * 100;
      const pctWidth = ((e - s) / (state.viewEnd - state.viewStart)) * 100;
      const seg = document.createElement("div");
      seg.className = "segment";
      seg.style.left = `${pctStart}%`;
      seg.style.width = `${pctWidth}%`;
      seg.style.background = color;
      const l = document.createElement("span");
      l.textContent = yoga.name;
      l.style.color = "#fff";
      seg.appendChild(l);
      seg.title = `${yoga.name}\n${jdToLocalStr(s)} → ${jdToLocalStr(e)}`;
      seg.addEventListener("mousedown", (ev) => {
        ev.stopPropagation();
        setCursorFromEvent(ev, muhurthaTimeline);
      });
      segs.appendChild(seg);
    });

    row.appendChild(segs);
    muhurthaTimeline.appendChild(row);
  });

  // Now that rows are present, size the overlay to the first segments row
  refreshOverlayPositions(true);
  renderStackedBar(false);
  setCursorByPct(state.lastCursorPct || 0);
  renderTimeslotList(filtered);
}

function updateSummaryCards(goodCount, badCount, goodHours, badHours) {
  if (summaryGoodEl) summaryGoodEl.textContent = goodCount;
  if (summaryBadEl) summaryBadEl.textContent = badCount;
  if (summaryGoodHoursEl) summaryGoodHoursEl.textContent = `${goodHours.toFixed(1)}h in view`;
  if (summaryBadHoursEl) summaryBadHoursEl.textContent = `${badHours.toFixed(1)}h in view`;
  const totalSelected = filterState.selected.size || state.rules?.yogas?.length || 0;
  if (summaryRulesEl) {
    const totalRules = state.rules?.yogas?.length || 0;
    let label = "All";
    if (state.rules) {
      if (totalSelected === 0) label = "None";
      else if (totalSelected !== totalRules) label = String(totalSelected);
    }
    summaryRulesEl.textContent = label;
  }
  updateHeroCard(goodHours, badHours);
}

function updateHeroCard(goodHours, badHours) {
  if (heroWindowEl && state.viewStart && state.viewEnd) {
    const startStr = jdToLocalStr(state.viewStart);
    const endStr = jdToLocalStr(state.viewEnd);
    heroWindowEl.innerHTML = `${startStr}<br><span aria-hidden="true">→</span><br>${endStr}`;
  }
  if (heroGoodEl) heroGoodEl.textContent = `${goodHours.toFixed(1)}h`;
  if (heroBadEl) heroBadEl.textContent = `${badHours.toFixed(1)}h`;
}

function renderTimeslotList(filtered) {
  if (!timeslotList) return;
  timeslotList.innerHTML = "";
  const focusBase = state.centerFocusJd ?? state.viewStart ?? 0;
  const base = state.cursorJd && state.cursorJd > focusBase ? state.cursorJd : focusBase;
  const goodOnly = state.goodSlotsOnly;
  const selectedYogas = getSelectedYogaValues();
  const hasYogaFilter = selectedYogas.length > 0;
  if (!filtered.length) {
    appendEmptySlotMessage("No matching windows in view.");
    return;
  }

  if (goodOnly) {
    const goodOnlySlots = computeGoodOnlySlots(filtered, base);
    if (!goodOnlySlots.length) {
      appendEmptySlotMessage("No windows without bad yogas in view.");
      return;
    }
    let slots = goodOnlySlots.map((slot) => ({
      start: slot.start,
      end: slot.end,
      label: slot.names.join(", ") || "Good window",
      badge: "Good only",
      good: true,
      yogas: slot.names,
      details: slot.details || [],
      intensitySegments: slot.intensitySegments || [],
      peak: slot.peak || null,
      avgIntensity: slot.avgIntensity || null,
    }));
    if (hasYogaFilter) {
      slots = slots.filter((slot) => slot.yogas?.some((name) => selectedYogas.includes(name)));
    }
    if (!slots.length) {
      appendEmptySlotMessage("No matching windows for the selected yoga.");
      return;
    }
    renderSlotGroups(slots);
    return;
  }

  const entries = [];
  filtered.forEach(({ yoga, windows }) => {
    windows.forEach((iv) => {
      if (iv[1] <= base) return;
      entries.push({ start: iv[0], end: iv[1], yoga });
    });
  });
  entries.sort((a, b) => a.start - b.start);
  if (!entries.length) {
    appendEmptySlotMessage("No matching windows in view.");
    return;
  }
  let slots = entries.map((slot) => ({
    start: slot.start,
    end: slot.end,
    label: slot.yoga.name,
    badge: isGoodYoga(slot.yoga) ? "Good" : "Bad",
    good: isGoodYoga(slot.yoga),
    yogas: [slot.yoga.name],
  }));
  if (hasYogaFilter) {
    slots = slots.filter((slot) => slot.yogas?.some((name) => selectedYogas.includes(name)));
  }
  if (!slots.length) {
    appendEmptySlotMessage("No matching windows for the selected yoga.");
    return;
  }
  renderSlotGroups(slots);
}

function appendEmptySlotMessage(text) {
  const empty = document.createElement("div");
  empty.className = "muted";
  empty.textContent = text;
  timeslotList.appendChild(empty);
}

function renderSlotGroups(slots) {
  timeslotList.innerHTML = "";
  if (!slots.length) {
    appendEmptySlotMessage("No matching windows in view.");
    return;
  }
  const groups = new Map();
  slots.forEach((slot) => {
    const dateInfo = jdToLocalDateParts(slot.start);
    const key = dateInfo.iso || slot.start;
    if (!groups.has(key)) {
      groups.set(key, { label: dateInfo.label || dateInfo.iso || "Date", items: [] });
    }
    groups.get(key).items.push(slot);
  });
  Array.from(groups.values()).forEach((group) => {
    const wrap = document.createElement("div");
    wrap.className = "timeslot-day";
    const heading = document.createElement("h5");
    heading.textContent = group.label;
    wrap.appendChild(heading);
    group.items.forEach((slot) => {
      wrap.appendChild(createTimeslotCard(slot));
    });
    timeslotList.appendChild(wrap);
  });
}

function copyFallback(text) {
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  } catch (err) {
    // silent
  }
}

function createTimeslotCard(slot) {
  const card = document.createElement("div");
  card.className = "timeslot-card";
  if (slot.good) card.classList.add("good");
  if (slot.start && slot.end) {
    card.title = `${jdToLocalStr(slot.start)} → ${jdToLocalStr(slot.end)}`;
  }
  const timeCol = document.createElement("div");
  timeCol.className = "slot-time";
  const range = formatTimeRange(slot.start, slot.end);
  timeCol.innerHTML = `<strong>${range.start}</strong><span>→ ${range.end}</span>`;
  const body = document.createElement("div");
  body.className = "slot-body";
  const label = document.createElement("div");
  label.className = "label slot-title";
  label.textContent = slot.label;
  const chips = document.createElement("div");
  chips.className = "slot-yogas";
  const details = slot.details && slot.details.length ? slot.details : [];
  const uniqueNames = new Map();
  details.forEach((entry) => {
    if (entry?.name && !uniqueNames.has(entry.name)) {
      uniqueNames.set(entry.name, entry);
    }
  });
  if (!uniqueNames.size && slot.yogas?.length) {
    slot.yogas.forEach((name) => {
      if (!uniqueNames.has(name)) {
        uniqueNames.set(name, { name, duration: (slot.end - slot.start), ranges: [{ start: slot.start, end: slot.end }] });
      }
    });
  }
  const uniqueEntries = Array.from(uniqueNames.values());

  // Helper to format date+time for range chips (local to this function)
  const formatChipRange = (startJd, endJd) => {
    if (!Number.isFinite(startJd) || !Number.isFinite(endJd)) return "";
    const startParts = jdToLocalDateParts(startJd);
    const endParts = jdToLocalDateParts(endJd);
    const startDT = jdToLocalStr(startJd).slice(0, 16); // YYYY-MM-DD HH:MM
    const endDT = jdToLocalStr(endJd).slice(0, 16);

    // If the local date is the same, keep the chip compact by repeating date only once.
    if (startParts.iso && startParts.iso === endParts.iso) {
      return `${startParts.iso} ${jdToLocalTime(startJd)} → ${jdToLocalTime(endJd)}`;
    }

    // If it crosses to next day, show both fully.
    return `${startDT} → ${endDT}`;
  };

  uniqueEntries.forEach((entry) => {
    const { name, duration, ranges } = entry;
    if (!name) return;

    const chip = document.createElement("span");
    chip.className = "slot-chip";

    // Build a per-chip time label from its ranges (preferred) or fall back to full slot.
    const safeRanges = Array.isArray(ranges) ? ranges.filter((r) => r && Number.isFinite(r.start) && Number.isFinite(r.end)) : [];
    const displayRanges = safeRanges.length
      ? safeRanges
      : Number.isFinite(slot.start) && Number.isFinite(slot.end)
        ? [{ start: slot.start, end: slot.end }]
        : [];

    const rangeTextList = displayRanges.map((r) => formatChipRange(r.start, r.end)).filter(Boolean);
    const primaryRangeText = rangeTextList[0] || "";
    const extraCount = rangeTextList.length > 1 ? rangeTextList.length - 1 : 0;

    // Tooltip: show all ranges for this chip, joined on newlines with date+time.
    if (rangeTextList.length) {
      chip.title = `${name}\n${rangeTextList.join("\n")}`;
    } else {
      chip.title = name;
    }

    const durationStr = duration ? formatDurationHours(duration * 24) : "";
    const rangeLabel = primaryRangeText ? (extraCount ? `${primaryRangeText} (+${extraCount})` : primaryRangeText) : "";

    chip.innerHTML = `
      <strong>${name}</strong>
      ${rangeLabel ? `<span>${rangeLabel}</span>` : ""}
      ${durationStr ? `<span>${durationStr}</span>` : ""}
    `;

    chips.appendChild(chip);
  });
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.style.background = slot.good ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)";
  badge.style.color = slot.good ? "#15803d" : "#b91c1c";
  badge.textContent = slot.badge || (slot.good ? "Good" : "Bad");
  body.appendChild(label);
  const slotDuration = Number.isFinite(slot.end) && Number.isFinite(slot.start) ? slot.end - slot.start : 0;
  const intensitySegments = Array.isArray(slot.intensitySegments) ? slot.intensitySegments : [];
  if (slot.good && intensitySegments.length && slotDuration > 0) {
    const intensityWrapper = document.createElement("div");
    intensityWrapper.className = "slot-intensity";
    const intensityBar = document.createElement("div");
    intensityBar.className = "intensity-bar";
    const maxIntensity = Math.max(...intensitySegments.map((seg) => seg.intensity));
    intensitySegments.forEach((seg) => {
      if (!(seg && seg.end > seg.start)) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "intensity-seg";
      const widthPct = slotDuration > 0 ? ((seg.end - seg.start) / slotDuration) * 100 : 100;
      btn.style.width = `${Math.max(0, widthPct)}%`;
      const normalized = maxIntensity > 0 ? seg.intensity / maxIntensity : 0;
      btn.style.opacity = `${Math.min(1, 0.15 + 0.85 * normalized)}`;
      const yogaNames = seg.yogas?.map((y) => y.name).filter(Boolean) || [];
      const tooltipParts = [
        `${jdToLocalTime(seg.start)} → ${jdToLocalTime(seg.end)}`,
        `Intensity ${seg.intensity}`,
        yogaNames.length ? yogaNames.join(", ") : null,
      ].filter(Boolean);
      btn.title = tooltipParts.join("\n");
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        setCursorByJd(seg.start);
      });
      intensityBar.appendChild(btn);
    });
    intensityWrapper.appendChild(intensityBar);
    body.appendChild(intensityWrapper);
    if (slot.peak) {
      const peakRow = document.createElement("div");
      peakRow.className = "slot-peak";
      const sortedYogas = [...(slot.peak.yogas || [])].sort((a, b) => {
        const diff = (b.strength || 0) - (a.strength || 0);
        return diff === 0 ? a.name.localeCompare(b.name) : diff;
      });
      const primaryNames = sortedYogas.slice(0, 3).map((y) => y.name);
      const extraCount = Math.max(0, sortedYogas.length - primaryNames.length);
      const namesDisplay = primaryNames.join(", ") + (extraCount ? ` +${extraCount}` : "");
      const peakText = document.createElement("span");
      peakText.className = "peak-summary";
      peakText.textContent = `Peak ${slot.peak.intensity} · ${jdToLocalTime(slot.peak.start)} → ${jdToLocalTime(
        slot.peak.end
      )} · ${namesDisplay}`;
      const actions = document.createElement("div");
      actions.className = "peak-actions";
      const jumpBtn = document.createElement("button");
      jumpBtn.type = "button";
      jumpBtn.className = "peak-action";
      jumpBtn.textContent = "Jump";
      jumpBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        setCursorByJd(slot.peak.start);
      });
      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "peak-action";
      copyBtn.textContent = "Copy";
      const formatCopyText = () => {
        const city = state.data?.meta?.city_name;
        const year = state.data?.meta?.year;
        const location = city && year ? `${city} ${year}` : city || (year ? `Year ${year}` : "Panchanga");
        const yogasList = sortedYogas.map((y) => y.name).join(", ");
        return `${location} — Peak ${jdToLocalTime(slot.peak.start)} → ${jdToLocalTime(slot.peak.end)} (Intensity ${
          slot.peak.intensity
        }): ${yogasList}`;
      };
      copyBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const text = formatCopyText();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(() => copyFallback(text));
        } else {
          copyFallback(text);
        }
      });
      actions.appendChild(jumpBtn);
      actions.appendChild(copyBtn);
      peakRow.appendChild(peakText);
      peakRow.appendChild(actions);
      body.appendChild(peakRow);
    }
  }
  if (chips.childElementCount) body.appendChild(chips);
  body.appendChild(badge);
  card.appendChild(timeCol);
  card.appendChild(body);
  card.addEventListener("click", () => {
    centerDateInput.value = jdToISODate(slot.start);
    updatePanSliderFromDate();
    render();
    setCursorByJd(slot.start);
  });
  return card;
}

function renderEmptyState(summaryText = "") {
  clearRectCache();
  ensureHelperStyles();
  if (muhurthaSummary) {
    const helper = summaryText ? `<span class="muted"> ${summaryText}</span>` : "";
    const fallback = '<span class="muted">Adjust filters or widen the window.</span>';
    muhurthaSummary.innerHTML = `<strong>No muhurthas match the current filters.</strong>${helper || fallback}`;
  }

  const timelineBlock = document.createElement("div");
  timelineBlock.className = "empty-state";
  timelineBlock.innerHTML = `<strong>Timeline will appear when matching windows exist.</strong>`;
  if (muhurthaTimeline) {
    muhurthaTimeline.innerHTML = "";
    muhurthaTimeline.appendChild(timelineBlock);
  }

  const densityBlock = document.createElement("div");
  densityBlock.className = "empty-state";
  densityBlock.innerHTML = `<strong>No density data for the current filters.</strong>`;
  if (stackedBar) {
    stackedBar.innerHTML = "";
    stackedBar.appendChild(densityBlock);
  }

  if (cursorInfo) cursorInfo.textContent = "";
  if (cursorSummary) cursorSummary.innerHTML = "";
  renderTimeslotList([]);
}

function computeGoodOnlySlots(filtered, baseJd) {
  // Treat windows as half-open [start, end) and snap JD values to avoid tiny floating overlaps.
  // Snap to the nearest second (1/86400 day). This is safe and prevents phantom overlaps at boundaries.
  const SNAP_PER_DAY = 86400;
  const snapJd = (jd) => (Number.isFinite(jd) ? Math.round(jd * SNAP_PER_DAY) / SNAP_PER_DAY : jd);
  const EPS = 0.5 / SNAP_PER_DAY; // half-second in days
  const focusBase = state.centerFocusJd ?? state.viewStart ?? baseJd;
  const startLimit = Math.max(baseJd, focusBase);
  const endLimit = state.viewEnd ?? startLimit + 1;
  const events = [];
  filtered.forEach(({ yoga, windows }) => {
    const good = isGoodYoga(yoga);
    windows.forEach((iv) => {
      let s = Math.max(iv[0], startLimit);
      let e = Math.min(iv[1], endLimit);
      s = snapJd(s);
      e = snapJd(e);

      // Half-open interval: ignore empty or negative spans.
      if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s + EPS) return;

      if (good) {
        events.push({ time: s, type: "goodStart", name: yoga.name, start: s, end: e });
        events.push({ time: e, type: "goodEnd", name: yoga.name });
      } else {
        events.push({ time: s, type: "badStart" });
        events.push({ time: e, type: "badEnd" });
      }
    });
  });
  if (!events.length) return [];
  const order = { goodEnd: 0, badEnd: 1, badStart: 2, goodStart: 3 };
  events.sort((a, b) => (a.time === b.time ? order[a.type] - order[b.type] : a.time - b.time));
  const activeGood = new Map();
  let badCount = 0;
  let prevTime = null;
  let slotActive = false;
  let slotStart = null;
  let slotSegments = new Map();
  let slotIntensitySegments = [];
  const slots = [];
  const accumulateSegments = (start, end) => {
    if (!slotActive || !activeGood.size || badCount !== 0) return;
    activeGood.forEach((info, name) => {
      const segStart = Math.max(start, info.start);
      const segEnd = Math.min(end, info.end);
      if (segEnd > segStart) {
        if (!slotSegments.has(name)) slotSegments.set(name, []);
        slotSegments.get(name).push([segStart, segEnd]);
      }
    });
  };
  const finalizeSlot = (endTime) => {
    if (!slotActive || !slotSegments.size) return;
    const details = Array.from(slotSegments.entries()).map(([name, segs]) => {
      const duration = segs.reduce((sum, [s, e]) => sum + (e - s), 0);
      return {
        name,
        duration,
        ranges: segs.map(([s, e]) => ({ start: s, end: e })),
      };
    });
    const mergeIntensitySegments = (segments) => {
      if (!segments || !segments.length) return [];
      const merged = [];
      const getKey = (seg) =>
        `${seg.intensity}-${seg.yogas.map((y) => `${y.name}:${y.strength}`).sort().join(",")}`;
      segments.forEach((seg) => {
        if (!seg || seg.end <= seg.start) return;
        const copy = { ...seg, yogas: seg.yogas.map((y) => ({ ...y })) };
        if (!merged.length) {
          merged.push(copy);
          return;
        }
        const last = merged[merged.length - 1];
        if (last.intensity === copy.intensity && getKey(last) === getKey(copy)) {
          last.end = copy.end;
        } else {
          merged.push(copy);
        }
      });
      return merged;
    };
    const mergedIntensity = mergeIntensitySegments(slotIntensitySegments);
    const slotDuration = endTime - slotStart;
    let peak = null;
    if (mergedIntensity.length) {
      peak = mergedIntensity.reduce((best, seg) => {
        if (!best) return seg;
        if (seg.intensity > best.intensity) return seg;
        if (seg.intensity === best.intensity) {
          const segDur = seg.end - seg.start;
          const bestDur = best.end - best.start;
          if (segDur > bestDur) return seg;
          if (segDur === bestDur && seg.start < best.start) return seg;
        }
        return best;
      }, null);
    }
    const avgIntensity =
      slotDuration > 0 && mergedIntensity.length
        ? mergedIntensity.reduce((sum, seg) => sum + seg.intensity * (seg.end - seg.start), 0) / slotDuration
        : 0;
    if (details.length) {
      slots.push({
        start: slotStart,
        end: endTime,
        names: details.map((d) => d.name),
        details,
        intensitySegments: mergedIntensity,
        peak,
        avgIntensity,
      });
    }
    slotSegments = new Map();
    slotIntensitySegments = [];
  };
  const pushIntensitySegment = (start, end) => {
    if (!slotActive || badCount !== 0 || !activeGood.size || end <= start) return;
    const yogaStrengthMap = state.yogaStrengthMap || new Map();
    const yogas = Array.from(activeGood.keys()).map((name) => ({
      name,
      strength: yogaStrengthMap.get(name) || 0,
    }));
    let intensity = yogas.reduce((sum, y) => sum + (y.strength || 0), 0);
    if (!intensity) intensity = yogas.length;
    slotIntensitySegments.push({
      start,
      end,
      intensity,
      yogas,
    });
  };
  events.forEach((event) => {
    const t = snapJd(event.time);
    event.time = t;

    if (prevTime !== null && t > prevTime + EPS) {
      accumulateSegments(prevTime, t);
      pushIntensitySegment(prevTime, t);
    }
    switch (event.type) {
      case "goodStart":
        activeGood.set(event.name, { start: event.start, end: event.end });
        break;
      case "goodEnd":
        activeGood.delete(event.name);
        break;
      case "badStart":
        badCount++;
        break;
      case "badEnd":
        badCount = Math.max(0, badCount - 1);
        break;
      default:
        break;
    }
    const nowActive = badCount === 0 && activeGood.size > 0;
    if (!slotActive && nowActive) {
      slotActive = true;
      slotStart = event.time;
      slotSegments = new Map();
      slotIntensitySegments = [];
    } else if (slotActive && !nowActive) {
      // Avoid producing a zero-length slot when boundaries coincide.
      if (Number.isFinite(slotStart) && event.time > slotStart + EPS) {
        finalizeSlot(event.time);
      } else {
        // Reset without emitting.
        slotSegments = new Map();
        slotIntensitySegments = [];
      }
      slotActive = false;
    }
    prevTime = event.time;
  });
  const endLimitSnapped = snapJd(endLimit);
  if (prevTime !== null && endLimitSnapped > prevTime + EPS) {
    accumulateSegments(prevTime, endLimitSnapped);
    pushIntensitySegment(prevTime, endLimitSnapped);
  }
  if (slotActive && Number.isFinite(slotStart) && endLimitSnapped > slotStart + EPS) {
    finalizeSlot(endLimitSnapped);
  }
  return slots.filter((slot) => Number.isFinite(slot.start) && Number.isFinite(slot.end) && slot.end > slot.start + EPS);
}

function getFilteredMuhurthas() {
  if (!state.muhurthaAll.length) return [];
  const totalRules = state.rules?.yogas?.length || 0;
  const allowAll = totalRules && filterState.selected.size === totalRules;
  const allowedSet = allowAll ? null : filterState.selected;
  if (allowedSet && allowedSet.size === 0) return [];
  return state.muhurthaAll
    .filter(({ yoga }) => !allowedSet || allowedSet.has(yoga.id))
    .map(({ yoga, windows }) => ({ yoga, windows: applyWindowFilters(windows) }))
    .filter(({ windows }) => windows.length);
}

function applyWindowFilters(windows) {
  let result = windows.map((iv) => [iv.start, iv.end]);
  if (!result.length) return result;

  Object.entries(filterState.bandFilters).forEach(([band, info]) => {
    if (info.require.size) {
      const allowed = mergeSegments(collectBandIntervalsSimple(band, info.require));
      result = intersectTwo(result, allowed);
    }
    if (info.block.size) {
      const blocked = mergeSegments(collectBandIntervalsSimple(band, info.block));
      result = subtractIntervals(result, blocked);
    }
  });
  return result;
}

function collectBandIntervalsSimple(band, valueSet) {
  const rows = state.data?.bands?.[band]?.intervals || [];
  if (!rows.length) return [];
  return rows
    .filter((row) => {
      if (!valueSet || !valueSet.size) return true;
      if (row[2] == null) return false;
      return valueSet.has(row[2]);
    })
    .map((row) => [row[0], row[1]]);
}

function subtractIntervals(base, removal) {
  if (!removal || !removal.length) return base.slice();
  const mergedRemoval = mergeSegments(removal);
  const result = [];
  base.forEach(([start, end]) => {
    let current = start;
    for (let i = 0; i < mergedRemoval.length && current < end; i++) {
      const cut = mergedRemoval[i];
      if (cut[1] <= current) continue;
      if (cut[0] >= end) break;
      if (cut[0] > current) {
        result.push([current, Math.min(cut[0], end)]);
      }
      current = Math.max(current, cut[1]);
    }
    if (current < end) {
      result.push([current, end]);
    }
  });
  return result.filter((iv) => iv[1] > iv[0]);
}

centerDateInput.addEventListener("change", () => {
  updatePanSliderFromDate();
  render();
});
if (windowSlider) {
  windowSlider.addEventListener("input", scheduleRender);
}
if (panSlider) {
  panSlider.addEventListener("input", () => {
    const year = state.data?.meta?.year || new Date().getFullYear();
    const day = parseInt(panSlider.value || "1", 10);
    const base = new Date(Date.UTC(year, 0, 1));
    base.setUTCDate(day);
    centerDateInput.value = base.toISOString().slice(0, 10);
    scheduleRender();
  });
}
if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener("click", resetFilters);
}
updateSlotToggleHint();
if (slotModeToggleBtn) {
  slotModeToggleBtn.addEventListener("click", () => {
    state.goodSlotsOnly = !state.goodSlotsOnly;
    updateSlotToggleHint();
    render();
  });
}
if (slotYogaTrigger && slotYogaMenu) {
  slotYogaTrigger.addEventListener("click", () => {
    toggleYogaMenu();
  });
  document.addEventListener("click", (ev) => {
    if (!slotYogaMenu.contains(ev.target) && ev.target !== slotYogaTrigger) {
      toggleYogaMenu(false);
    }
  });
}

renderActiveFiltersBar(0, 0);
initializeCityYearSelectors();
loadData(state.currentCitySlug, state.currentYear);
if (jumpTodayBtn) {
  jumpTodayBtn.addEventListener("click", () => {
    const today = new Date();
    centerDateInput.value = today.toISOString().slice(0, 10);
    updatePanSliderFromDate();
    render();
  });
}
const modalBackdrop = document.getElementById("filterModal");
if (modalBackdrop) {
  modalBackdrop.addEventListener("click", (ev) => {
    if (ev.target === modalBackdrop) closeFilterModal();
  });
}
const handleResize = debounce(() => {
  clearRectCache();
  refreshOverlayPositions();
}, 120);
window.addEventListener("resize", handleResize);

function updateActiveInfo() {
  if (state.cursorJd === null) return;
  const pct = Math.min(1, Math.max(0, (state.cursorJd - state.viewStart) / (state.viewEnd - state.viewStart)));
  state.lastCursorPct = pct;
  const activeGood = [];
  const activeBad = [];
  state.currentView.forEach(({ yoga, windows }) => {
    const found = windows.some((iv) => {
      const s = Math.max(iv[0], state.viewStart);
      const e = Math.min(iv[1], state.viewEnd);
      return e > s && state.cursorJd >= s && state.cursorJd <= e + 1e-9;
    });
    if (found) {
      if (isGoodYoga(yoga)) activeGood.push(yoga.name);
      else activeBad.push(yoga.name);
    }
  });
  if (cursorInfo) {
    cursorInfo.textContent = `At cursor ${jdToLocalStr(state.cursorJd)} — Good ${activeGood.length} • Bad ${activeBad.length}`;
  }
  if (cursorSummary) {
    renderActiveChips(cursorSummary, activeGood, activeBad);
  }
  if (state.stackedLabel && state.viewStart && state.viewEnd) {
    state.stackedLabel.textContent = `${jdToLocalStr(state.cursorJd)} • Good ${activeGood.length} / Bad ${activeBad.length}`;
    const { leftPx } = computeCursorLeft(stackedBar, pct);
    state.stackedLabel.style.left = `${leftPx}px`;
    if (state.stackedCursor) state.stackedCursor.style.left = `${leftPx}px`;
  }
  if (state.timelineCursor && state.timelineLabel && state.viewStart && state.viewEnd) {
    const firstSeg = muhurthaTimeline.querySelector(".segments");
    const clamped = Math.min(1, Math.max(0, pct));
    const { leftPx } = computeCursorLeft(muhurthaTimeline, clamped, firstSeg);
    state.timelineCursor.style.left = `${leftPx}px`;
    state.timelineLabel.style.left = `${leftPx}px`;
    state.timelineLabel.textContent = jdToLocalStr(state.cursorJd);
  }
}

function renderStackedBar(skipCursorUpdate = false) {
  if (!stackedBar || !state.viewStart || !state.viewEnd) return;
  stackedBar.innerHTML = "";
  stackedBar.classList.add("stacked-bar");
  state.stackedCursor = null;
  state.stackedLabel = null;

  // Build a merged list of all segments with type good/bad
  const segments = [];
  state.currentView.forEach(({ yoga, windows }) => {
    const good = isGoodYoga(yoga);
    windows.forEach((iv) => {
      const s = Math.max(iv[0], state.viewStart);
      const e = Math.min(iv[1], state.viewEnd);
      if (e <= s) return;
      segments.push({ start: s, end: e, good });
    });
  });
  // Sort and merge overlaps separately for good and bad
  const mergedGood = mergeSegments(segments.filter((s) => s.good));
  const mergedBad = mergeSegments(segments.filter((s) => !s.good));

  const totalSpan = state.viewEnd - state.viewStart;
  const addSegs = (arr, color, stackIndex) => {
    arr.forEach((s) => {
      const div = document.createElement("div");
      div.className = "stacked-segment";
      div.style.left = `${((s.start - state.viewStart) / totalSpan) * 100}%`;
      div.style.width = `${((s.end - s.start) / totalSpan) * 100}%`;
      div.style.background = color;
      div.style.height = "16px";
      div.style.bottom = `${stackIndex * 16}px`;
      div.addEventListener("mousedown", (ev) => {
        ev.stopPropagation();
        setCursorFromEvent(ev, stackedBar);
      });
      stackedBar.appendChild(div);
    });
  };
  addSegs(mergedBad, "rgba(239,68,68,0.5)", 0);
  addSegs(mergedGood, "rgba(34,197,94,0.5)", 1);

  state.stackedCursor = document.createElement("div");
  state.stackedCursor.className = "cursor-line";
  stackedBar.appendChild(state.stackedCursor);
  state.stackedLabel = document.createElement("div");
  state.stackedLabel.className = "stacked-label";
  stackedBar.appendChild(state.stackedLabel);

  const onMove = (ev) => {
    const { rect, padLeft, usable } = getRectInfo(stackedBar);
    if (!rect) return;
    const x = Math.min(Math.max(ev.clientX - rect.left - padLeft, 0), usable);
    const pct = usable ? x / usable : 0;
    setCursorByPct(pct);
  };
  stackedBar.addEventListener("mousemove", onMove);
  stackedBar.addEventListener("mousedown", onMove);

  if (!skipCursorUpdate) {
    setCursorByPct(0);
  }
}

function renderActiveChips(container, goodList, badList) {
  container.innerHTML = "";
  const add = (list, label, color) => {
    const group = document.createElement("div");
    group.style.display = "flex";
    group.style.flexWrap = "wrap";
    group.style.gap = "6px";
    const head = document.createElement("span");
    head.className = "chip";
    head.textContent = `${label} (${list.length || 0})`;
    head.style.background = color;
    head.style.color = "#fff";
    head.style.borderColor = color;
    group.appendChild(head);
    if (!list.length) {
      const none = document.createElement("span");
      none.className = "chip";
      none.textContent = "None";
      group.appendChild(none);
    } else {
      list.forEach((name) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = name;
        chip.style.background = "#fff";
        chip.style.color = "#111";
        group.appendChild(chip);
      });
    }
    container.appendChild(group);
  };
  add(goodList, "Good", "#22c55e");
  add(badList, "Bad", "#ef4444");
}

function mergeSegments(arr) {
  if (!arr.length) return [];
  const normalized = arr
    .map((seg) => {
      if (Array.isArray(seg)) return { start: seg[0], end: seg[1], __type: "array" };
      return { start: seg.start, end: seg.end, __type: "object" };
    })
    .filter((seg) => Number.isFinite(seg.start) && Number.isFinite(seg.end))
    .sort((a, b) => a.start - b.start);
  if (!normalized.length) return [];
  const merged = [normalized[0]];
  for (let i = 1; i < normalized.length; i++) {
    const last = merged[merged.length - 1];
    const curr = normalized[i];
    if (curr.start <= last.end) {
      last.end = Math.max(last.end, curr.end);
    } else {
      merged.push({ ...curr });
    }
  }
  if (Array.isArray(arr[0])) {
    return merged.map((seg) => [seg.start, seg.end]);
  }
  return merged.map((seg) => ({ start: seg.start, end: seg.end }));
}

function categoryHours(source, isGood) {
  if (!state.viewStart || !state.viewEnd) return 0;
  let totalHours = 0;
  source.forEach(({ yoga, windows }) => {
    const good = isGoodYoga(yoga);
    if (good !== isGood) return;
    windows.forEach((iv) => {
      const s = Math.max(iv[0], state.viewStart);
      const e = Math.min(iv[1], state.viewEnd);
      if (e > s) totalHours += (e - s) * 24;
    });
  });
  return totalHours;
}

function setCursorByPct(pct) {
  pct = Math.min(1, Math.max(0, pct));
  state.cursorJd = state.viewStart + pct * (state.viewEnd - state.viewStart);
  updateActiveInfo();
}

function setCursorByJd(jd) {
  if (!state.viewStart || !state.viewEnd) return;
  const pct = (jd - state.viewStart) / (state.viewEnd - state.viewStart);
  setCursorByPct(pct);
}

function setCursorFromEvent(ev, container) {
  const specificSeg = ev.target?.closest?.(".segments");
  const { rect, padLeft, usable } = getRectInfo(container, specificSeg);
  if (!rect) return;
  const x = Math.min(Math.max(ev.clientX - rect.left - padLeft, 0), usable);
  const pct = x / usable;
  setCursorByPct(pct);
}

function computeCursorLeft(container, pct, specificSeg = null) {
  const { padLeft, usable } = getRectInfo(container, specificSeg);
  const clamped = Math.min(1, Math.max(0, pct));
  const leftPx = padLeft + clamped * usable;
  return { leftPx, usable };
}

function getRectInfo(container, segOverride) {
  if (!container) {
    return { rect: null, padLeft: 0, padRight: 0, usable: 1 };
  }
  if (container === muhurthaTimeline) {
    const seg = segOverride || muhurthaTimeline.querySelector(".segments");
    if (seg) {
      const segRect = getCachedRect(seg);
      const baseRect = getCachedRect(muhurthaTimeline);
      if (segRect && baseRect) {
        const padLeft = segRect.left - baseRect.left;
        const padRight = baseRect.right - segRect.right;
        const usable = Math.max(1, segRect.width);
        return { rect: baseRect, padLeft, padRight, usable };
      }
    }
  }
  const rect = getCachedRect(container);
  if (!rect) return { rect: null, padLeft: 0, padRight: 0, usable: 1 };
  const styles = getComputedStyle(container);
  const padLeft = parseFloat(styles.paddingLeft || "0");
  const padRight = parseFloat(styles.paddingRight || "0");
  const usable = Math.max(1, rect.width - padLeft - padRight);
  return { rect, padLeft, padRight, usable };
}

function refreshOverlayPositions(resetCursor = false) {
  if (!state.timelineOverlay || !state.viewStart || !state.viewEnd) return;
  const firstSeg = muhurthaTimeline.querySelector(".segments");
  const { padLeft: tlPad, usable: tlWidth } = getRectInfo(muhurthaTimeline, firstSeg);
  state.overlayPadLeft = tlPad;
  state.overlayUsable = tlWidth;
  state.timelineOverlay.style.left = `${tlPad}px`;
  state.timelineOverlay.style.width = `${tlWidth}px`;
  if (state.timelineCursor && state.timelineLabel) {
    const clamped = resetCursor ? 0 : Math.min(1, Math.max(0, state.lastCursorPct));
    const { leftPx } = computeCursorLeft(muhurthaTimeline, clamped, firstSeg);
    state.timelineCursor.style.left = `${leftPx}px`;
    state.timelineLabel.style.left = `${leftPx}px`;
  }
}

function updatePanSliderFromDate() {
  if (!panSlider) return;
  const year = state.data?.meta?.year || new Date().getFullYear();
  const date = parseDateInputValue(centerDateInput.value, year);
  const iso = isoDateFromDate(date);
  if (centerDateInput.value !== iso) centerDateInput.value = iso;
  const start = Date.UTC(year, 0, 1);
  const day = Math.max(1, Math.floor((date.getTime() - start) / 86400000) + 1);
  panSlider.value = String(day);
}
