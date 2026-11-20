(() => {
  'use strict';
  // The public catalogue uses "elk" for the Rocky Mountain distribution layer.
  // BC's official ELK hunter-survey rows do not identify elk subspecies.
  const rocky = new Set(['elk', 'rocky_elk_kootenay']);
  const roosevelt = new Set(['roosevelt_elk']);
  const isRocky = key => rocky.has(key);
  const isRoosevelt = key => roosevelt.has(key);
  const isElk = key => isRocky(key) || isRoosevelt(key);
  // The provincial ELK harvest category does not distinguish subspecies.
  // Screen all-elk records geographically; these ARE NOT Roosevelt or Rocky
  // Mountain success probabilities or proof of occupancy throughout a WMU.
  const coastalWmu = wmu => /^[12]-(?:[1-9]|[1-9][0-9])$/.test(String(wmu));
  const excludesFromSuccess = (key, wmu) =>
    (isRocky(key) && coastalWmu(wmu)) ||
    (isRoosevelt(key) && !coastalWmu(wmu));
  window.HUNTSMART_ELK_POLICY = Object.freeze({
    isRocky, isRoosevelt, isElk, coastalWmu, excludesFromSuccess,
    surveyCategory: 'ELK',
    surveyLabel: 'Elk (all subspecies)'
  });
})();
