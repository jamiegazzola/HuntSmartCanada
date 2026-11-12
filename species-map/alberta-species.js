// Alberta layer registry. Only datasets with verified commercial-use permissions
// and an identifiable biological distribution geometry may render as layers.
// A pending entry is a source reference, not a distribution estimate.
window.HUNTSMART_ALBERTA_SPECIES = [
  { key:'caribou', label:'Boreal Caribou (federal range)', type:'federal_boreal_range',
    sourceUrl:'https://open.canada.ca/data/en/dataset/63e1cda6-debe-4b9b-b075-3666443e30b4',
    description:'ECCC federally mapped boreal caribou herd ranges (2012 boundaries, published with 2020 disturbance mapping). Does not cover Alberta mountain caribou or imply presence throughout each range.' },
  { key:'elk', label:'Elk (source review)', type:'pending', sourceUrl:'https://abmi.ca/species/cervus-canadensis' },
  { key:'moose', label:'Moose (source review)', type:'pending', sourceUrl:'https://abmi.ca/abmi-home/data-resources/mapping-portal' },
  { key:'mule_deer', label:'Mule Deer (source review)', type:'pending', sourceUrl:'https://www.alberta.ca/aerial-wildlife-survey-reports' },
  { key:'white_tailed_deer', label:'White-tailed Deer (source review)', type:'pending', sourceUrl:'https://www.alberta.ca/aerial-wildlife-survey-reports' },
  { key:'bighorn_sheep', label:'Bighorn Sheep (permission required)', type:'pending', sourceUrl:'https://www.alberta.ca/wildlife-sensitivity-maps' },
  { key:'mountain_goat', label:'Mountain Goat (permission required)', type:'pending', sourceUrl:'https://www.alberta.ca/wildlife-sensitivity-maps' },
  { key:'grizzly_bear', label:'Grizzly Bear (permission required)', type:'pending', sourceUrl:'https://www.alberta.ca/wildlife-sensitivity-maps' },
  { key:'pronghorn', label:'Pronghorn (source review)', type:'pending', sourceUrl:'https://www.alberta.ca/aerial-wildlife-survey-reports' },
  { key:'wood_bison', label:'Wood Bison (source review)', type:'pending', sourceUrl:'https://www.alberta.ca/aerial-wildlife-survey-reports' },
];
