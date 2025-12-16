export function buildOptionsFromBandNames(bandNamesObj = {}) {
  return Object.keys(bandNamesObj)
    .map((key) => ({
      value: Number(key),
      label: bandNamesObj[key],
    }))
    .sort((a, b) => a.value - b.value);
}

export function getOptionsForFilterKey(filterKey, { FILTER_DEFS }, data, cache, labelMap) {
  if (!filterKey || !FILTER_DEFS?.[filterKey]) return [];
  if (cache[filterKey]) return cache[filterKey];
  const def = FILTER_DEFS[filterKey];
  if (def.customOptions) {
    cache[filterKey] = def.customOptions;
    labelMap[filterKey] = new Map(def.customOptions.map((opt) => [opt.value, opt.label]));
    return cache[filterKey];
  }
  const bandKey = def.bandKey;
  const names = data?.band_names?.[bandKey];
  if (!names) return [];
  const options = buildOptionsFromBandNames(names);
  cache[filterKey] = options;
  labelMap[filterKey] = new Map(options.map((opt) => [opt.value, opt.label]));
  return options;
}
