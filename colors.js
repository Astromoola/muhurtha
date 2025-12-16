// Color palette for band types and planets.
// Light-theme friendly; tweak as needed.
export const bandColors = {
  final_match: "#22c55e",
  vara: "#2563eb",
  daylight: "#22c55e",
  night: "#0f172a",
  // Vara directly mapped to planet colors via value_int (0=Sun..6=Saturn)
  // Hora lords (Sun..Saturn) - softer palette
  hora_day: "#a855f7",
  hora_night: "#7c3aed",
  hora: "#a855f7",
  tithi: "#8b5cf6",
  paksha: "#f59e0b",
  nakshatra: "#10b981",
  nak_pada: "#0ea5e9",
  yoga: "#ec4899",
  karana: "#ef4444",
  lagna: "#14b8a6",
  lunar_month_amanta: "#f97316",
  lunar_month_poornimanta: "#f97316",
  solar_month: "#f43f5e",
  // Kala Vela (planetary sons/upagrahas)
  kala_day: "#c084fc",
  kala_night: "#a855f7",
  kala: "#b874f6",
  // Gowri Panchanga (planetary)
  gowri_day: "#22c55e",
  gowri_night: "#16a34a",
  gowri: "#1fb15f",
  // Choghadiya (planetary)
  choghadiya_day: "#06b6d4",
  choghadiya_night: "#0891b2",
  choghadiya: "#08b8c9",
  sun_sign: "#f59e0b",
  moon_sign: "#38bdf8",
  mars_sign: "#ef4444",
  mercury_sign: "#22d3ee",
  jupiter_sign: "#facc15",
  venus_sign: "#fb7185",
  saturn_sign: "#475569",
  rahu_sign: "#0ea5e9",
  ketu_sign: "#0ea5e9",
  sun_nakshatra: "#f59e0b",
  moon_nakshatra: "#38bdf8",
  mars_nakshatra: "#ef4444",
  mercury_nakshatra: "#22d3ee",
  jupiter_nakshatra: "#facc15",
  venus_nakshatra: "#fb7185",
  saturn_nakshatra: "#475569",
  rahu_nakshatra: "#0ea5e9",
  ketu_nakshatra: "#0ea5e9",
  sun_pada: "#f59e0b",
  moon_pada: "#38bdf8",
  mars_pada: "#ef4444",
  mercury_pada: "#22d3ee",
  jupiter_pada: "#facc15",
  venus_pada: "#fb7185",
  saturn_pada: "#475569",
  rahu_pada: "#0ea5e9",
  ketu_pada: "#0ea5e9",
};

// Planet color mapping
export const planetColors = {
  sun: "#f59e0b",      // Orange
  moon: "#ffffff",    // White
  mars: "#ef4444",    // Red
  mercury: "#22c55e", // Green
  jupiter: "#facc15", // Yellow
  venus: "#ec4899",   // Pink
  saturn: "#3b82f6",  // Blue
  rahu: "#4b5563",    // Smoky Gray
  ketu: "#92400e",    // Brown
};

// Nakshatra ruling planet sequence (1-based nakshatra index → planet)
export const nakshatraRulers = [
  "ketu",    // Ashwini
  "venus",   // Bharani
  "sun",     // Krittika
  "moon",    // Rohini
  "mars",    // Mrigashirsha
  "rahu",    // Ardra
  "jupiter", // Punarvasu
  "saturn",  // Pushya
  "mercury", // Ashlesha
  "ketu",    // Magha
  "venus",   // Purva Phalguni
  "sun",     // Uttara Phalguni
  "moon",    // Hasta
  "mars",    // Chitra
  "rahu",    // Swati
  "jupiter", // Vishakha
  "saturn",  // Anuradha
  "mercury", // Jyeshtha
  "ketu",    // Mula
  "venus",   // Purva Ashadha
  "sun",     // Uttara Ashadha
  "moon",    // Shravana
  "mars",    // Dhanishta
  "rahu",    // Shatabhisha
  "jupiter", // Purva Bhadrapada
  "saturn",  // Uttara Bhadrapada
  "mercury", // Revati
];

// Signs (rashi) ruling planets in order Mesha..Meena (1..12)
export const signRulers = [
  "mars",    // Aries
  "venus",   // Taurus
  "mercury", // Gemini
  "moon",    // Cancer
  "sun",     // Leo
  "mercury", // Virgo
  "venus",   // Libra
  "mars",    // Scorpio
  "jupiter", // Sagittarius
  "saturn",  // Capricorn
  "saturn",  // Aquarius
  "jupiter", // Pisces
];

// Lunar month → full-moon nakshatra index (1-based Ashwini=1)
// Chaitra(Chitra), Vaishakha(Vishakha), Jyeshta(Jyeshtha), Ashadha(Purva Ashadha),
// Shravana(Shravana), Bhadrapada(Purva Bhadrapada), Ashwin(Ashwini),
// Kartika(Krittika), Margashirsha(Mrigashirsha), Pausha(Pushya),
// Magha(Magha), Phalguna(Uttara Phalguni)
export const lunarMonthNakIndex = [
  14, // Chaitra -> Chitra
  16, // Vaishakha -> Vishakha
  18, // Jyeshta -> Jyeshtha
  20, // Ashadha -> Purva Ashadha
  22, // Shravana -> Shravana
  25, // Bhadrapada -> Purva Bhadrapada
  1,  // Ashwin -> Ashwini
  3,  // Kartika -> Krittika
  5,  // Margashirsha -> Mrigashirsha
  8,  // Pausha -> Pushya
  10, // Magha -> Magha
  12, // Phalguna -> Uttara Phalguni
];
