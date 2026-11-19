(() => {
  'use strict';
  // The public catalogue uses "elk" for the Rocky Mountain distribution layer.
  // BC's official ELK hunter-survey rows do not identify elk subspecies.
  const rocky = new Set(['elk', 'rocky_elk_kootenay']);
  const roosevelt = new Set(['roosevelt_elk']);
  const isRocky = key => rocky.has(key);
  const isRoosevelt = key => roosevelt.has(key);
  const isElk = key => isRocky(key) || isRoosevelt(key);
  const excludesFromSuccess = (key, wmu) =>
    isRocky(key) && /^[12]-(?:[1-9]|[1-9][0-9])$/.test(String(wmu));
  window.HUNTSMART_ELK_POLICY = Object.freeze({
    isRocky, isRoosevelt, isElk, excludesFromSuccess,
    surveyCategory: 'ELK',
    surveyLabel: 'Elk (all subspecies)'
  });
})();
