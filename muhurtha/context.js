export const DOM = {
  centerDateInput: document.querySelector("#centerDate"),
  windowSlider: document.querySelector("#windowSlider"),
  panSlider: document.querySelector("#panSlider"),
  muhurthaTimeline: document.querySelector("#muhurthaTimeline"),
  muhurthaMeta: document.querySelector("#muhurthaMeta"),
  muhurthaSummary: document.querySelector("#muhurthaSummary"),
  cursorInfo: document.querySelector("#cursorInfo"),
  cursorSummary: document.querySelector("#cursorSummary"),
  stackedBar: document.querySelector("#stackedBar"),
  timeslotList: document.querySelector("#timeslotList"),
  slotModeToggleBtn: document.querySelector("#slotModeToggle"),
  slotYogaTrigger: document.querySelector("#slotYogaTrigger"),
  slotYogaMenu: document.querySelector("#slotYogaMenu"),
  citySelect: document.querySelector("#citySelect"),
  yearSelect: document.querySelector("#yearSelect"),
  goodFilterList: document.querySelector("#goodFilterList"),
  badFilterList: document.querySelector("#badFilterList"),
  jumpTodayBtn: document.querySelector("#jumpToday"),
  clearFiltersBtn: document.querySelector("#clearFilters"),
  heroTitleEl: document.querySelector("#heroTitle"),
  heroMetaEl: document.querySelector("#heroMeta"),
  heroWindowEl: document.querySelector("#heroWindow"),
  heroGoodEl: document.querySelector("#heroGoodHours"),
  heroBadEl: document.querySelector("#heroBadHours"),
  filterSearchInput: document.querySelector("#filterSearch"),
  summaryGoodEl: document.querySelector("#summaryGood"),
  summaryBadEl: document.querySelector("#summaryBad"),
  summaryGoodHoursEl: document.querySelector("#summaryGoodHours"),
  summaryBadHoursEl: document.querySelector("#summaryBadHours"),
  summaryRulesEl: document.querySelector("#summaryRules"),
  goodSummaryEl: document.querySelector("#goodSummary"),
  badSummaryEl: document.querySelector("#badSummary"),
  timelinePanel: document.querySelector(".timeline-panel"),
  activeFiltersBar: document.querySelector("#activeFiltersBar"),
};

export const state = {
  data: null,
  rules: null,
  tzHours: 0,
  muhurthaAll: [],
  currentView: [],
  viewStart: null,
  viewEnd: null,
  centerFocusJd: null,
  cursorJd: null,
  lastCursorPct: 0,
  goodSlotsOnly: true,
  timelineCursor: null,
  timelineLabel: null,
  timelineOverlay: null,
  stackedCursor: null,
  stackedLabel: null,
  overlayPadLeft: 0,
  overlayUsable: 0,
  selectedYogas: new Set(),
  yogaMenuOpen: false,
  rectCache: new WeakMap(),
  currentCitySlug: null,
  currentYear: null,
};

export const DATASETS = [
  {
    cityName: "Bangalore",
    slug: "bangalore",
    years: [2025, 2026, 2027],
  },
];

state.currentCitySlug = DATASETS[0].slug;
state.currentYear = DATASETS[0].years[0];

export const FILTER_DEFS = {
  vara: { key: "vara", bandKey: "vara", label: "Weekday (Vara)", helper: "Focus on weekdays ruled by specific planets." },
  paksha: {
    key: "paksha",
    bandKey: "paksha",
    label: "Paksha (Fortnight)",
    helper: "Choose waxing (Shukla) or waning (Krishna) halves.",
    customOptions: [
      { value: 0, label: "Shukla Paksha" },
      { value: 1, label: "Krishna Paksha" },
    ],
  },
  tithi: { key: "tithi", bandKey: "tithi", label: "Tithi", helper: "Select auspicious lunar days." },
  karana: { key: "karana", bandKey: "karana", label: "Karana", helper: "Fine tune half-day segments." },
  nakshatra: { key: "nakshatra", bandKey: "nakshatra", label: "Moon Nakshatra", helper: "Pick stellar influences of the Moon." },
  nak_pada: { key: "nak_pada", bandKey: "nak_pada", label: "Moon Nakshatra Pada", helper: "Focus on specific quarters." },
  yoga: { key: "yoga", bandKey: "yoga", label: "Yoga", helper: "Highlight benefic or malefic yogas." },
  hora_day: { key: "hora_day", bandKey: "hora_day", label: "Hora (Day)", helper: "Emphasize daytime planetary horas." },
  hora_night: { key: "hora_night", bandKey: "hora_night", label: "Hora (Night)", helper: "Emphasize nighttime planetary horas." },
  lagna: { key: "lagna", bandKey: "lagna", label: "Lagna (Ascendant)", helper: "Filter by rising sign windows." },
  lunar_month_amanta: {
    key: "lunar_month_amanta",
    bandKey: "lunar_month_amanta",
    label: "Lunar Month (Amanta)",
    helper: "Choose Amanta lunar months for planning rituals.",
  },
  lunar_month_poornimanta: {
    key: "lunar_month_poornimanta",
    bandKey: "lunar_month_poornimanta",
    label: "Lunar Month (Poornimanta)",
    helper: "Pick months using the Poornimanta convention.",
  },
  solar_month: { key: "solar_month", bandKey: "solar_month", label: "Solar Month", helper: "Align with Tamil/Malayalam solar months." },
  kala_day: { key: "kala_day", bandKey: "kala_day", label: "Kala Vela (Day)", helper: "Use daytime Kala sons (Kala, Paridhi, etc.)." },
  kala_night: { key: "kala_night", bandKey: "kala_night", label: "Kala Vela (Night)", helper: "Night-time Kala vela segments." },
  gowri_day: { key: "gowri_day", bandKey: "gowri_day", label: "Gowri (Day)", helper: "Daytime Gowri Panchanga parts." },
  gowri_night: { key: "gowri_night", bandKey: "gowri_night", label: "Gowri (Night)", helper: "Nighttime Gowri Panchanga parts." },
  choghadiya_day: { key: "choghadiya_day", bandKey: "choghadiya_day", label: "Choghadiya (Day)", helper: "Gujarati-style daytime choghadiya." },
  choghadiya_night: {
    key: "choghadiya_night",
    bandKey: "choghadiya_night",
    label: "Choghadiya (Night)",
    helper: "Night choghadiya sequence (5th-day hora order).",
  },
  sun_sign: { key: "sun_sign", bandKey: "sun_sign", label: "Sun Sign", helper: "Solar longitude zodiac sign." },
  sun_nakshatra: { key: "sun_nakshatra", bandKey: "sun_nakshatra", label: "Sun Nakshatra", helper: "Stellar region traversed by the Sun." },
  sun_pada: { key: "sun_pada", bandKey: "sun_pada", label: "Sun Nakshatra Pada", helper: "Quarter of the Sun's nakshatra." },
  mars_sign: { key: "mars_sign", bandKey: "mars_sign", label: "Mars Sign", helper: "Zodiac sign occupied by Mars." },
  mars_nakshatra: { key: "mars_nakshatra", bandKey: "mars_nakshatra", label: "Mars Nakshatra", helper: "Stellar backdrop of Mars." },
  mars_pada: { key: "mars_pada", bandKey: "mars_pada", label: "Mars Nakshatra Pada", helper: "Specific quarter for Mars." },
  mercury_sign: { key: "mercury_sign", bandKey: "mercury_sign", label: "Mercury Sign", helper: "Zodiac sign occupied by Mercury." },
  mercury_nakshatra: { key: "mercury_nakshatra", bandKey: "mercury_nakshatra", label: "Mercury Nakshatra", helper: "Stellar backdrop of Mercury." },
  mercury_pada: { key: "mercury_pada", bandKey: "mercury_pada", label: "Mercury Nakshatra Pada", helper: "Specific quarter for Mercury." },
  jupiter_sign: { key: "jupiter_sign", bandKey: "jupiter_sign", label: "Jupiter Sign", helper: "Zodiac sign occupied by Jupiter." },
  jupiter_nakshatra: { key: "jupiter_nakshatra", bandKey: "jupiter_nakshatra", label: "Jupiter Nakshatra", helper: "Stellar backdrop of Jupiter." },
  jupiter_pada: { key: "jupiter_pada", bandKey: "jupiter_pada", label: "Jupiter Nakshatra Pada", helper: "Specific quarter for Jupiter." },
  venus_sign: { key: "venus_sign", bandKey: "venus_sign", label: "Venus Sign", helper: "Zodiac sign occupied by Venus." },
  venus_nakshatra: { key: "venus_nakshatra", bandKey: "venus_nakshatra", label: "Venus Nakshatra", helper: "Stellar backdrop of Venus." },
  venus_pada: { key: "venus_pada", bandKey: "venus_pada", label: "Venus Nakshatra Pada", helper: "Specific quarter for Venus." },
  saturn_sign: { key: "saturn_sign", bandKey: "saturn_sign", label: "Saturn Sign", helper: "Zodiac sign occupied by Saturn." },
  saturn_nakshatra: { key: "saturn_nakshatra", bandKey: "saturn_nakshatra", label: "Saturn Nakshatra", helper: "Stellar backdrop of Saturn." },
  saturn_pada: { key: "saturn_pada", bandKey: "saturn_pada", label: "Saturn Nakshatra Pada", helper: "Specific quarter for Saturn." },
  rahu_sign: { key: "rahu_sign", bandKey: "rahu_sign", label: "Rahu Sign", helper: "Zodiac sign of mean Rahu." },
  rahu_nakshatra: { key: "rahu_nakshatra", bandKey: "rahu_nakshatra", label: "Rahu Nakshatra", helper: "Stellar backdrop of mean Rahu." },
  rahu_pada: { key: "rahu_pada", bandKey: "rahu_pada", label: "Rahu Nakshatra Pada", helper: "Specific quarter for Rahu." },
  ketu_sign: { key: "ketu_sign", bandKey: "ketu_sign", label: "Ketu Sign", helper: "Zodiac sign opposite Rahu (Ketu)." },
  ketu_nakshatra: { key: "ketu_nakshatra", bandKey: "ketu_nakshatra", label: "Ketu Nakshatra", helper: "Stellar backdrop of Ketu." },
  ketu_pada: { key: "ketu_pada", bandKey: "ketu_pada", label: "Ketu Nakshatra Pada", helper: "Specific quarter for Ketu." },
};

export const FILTER_KEYS = Object.keys(FILTER_DEFS);

export const FILTER_GROUPS = [
  {
    id: "coreFilters",
    level: "basic",
    icon: "🎛️",
    title: "Filters",
    helper: "Mix and match Panchanga components in one place.",
    filters: FILTER_KEYS,
  },
];

export const PRESET_DEFS = {
  tithi: [
    { name: "Shukla only", values: Array.from({ length: 15 }, (_, i) => i + 1) },
    { name: "Krishna only", values: Array.from({ length: 15 }, (_, i) => i + 16) },
    { name: "Common auspicious", values: [1, 2, 3, 5, 7, 8, 10, 11] },
  ],
  nakshatra: [
    { name: "Favorable", values: [1, 2, 4, 5, 7, 9, 13, 17, 18, 23] },
    { name: "Avoidable", values: [3, 6, 8, 10, 11, 14, 19, 21] },
  ],
};

export const filterState = {
  selected: new Set(),
  bandFilters: {},
};

export const uiState = {
  rules: {},
  advancedOpen: false,
  expertOpen: false,
};

export const chipContainers = {};
export const modeToggles = {};
export const optionLabelMap = {};
export const bandOptionsCache = {};
export const modalRefs = {
  state: null,
  trigger: null,
  keyHandler: null,
};
export const loadingState = {
  skeletonActive: false,
  timelineErrorEl: null,
};
