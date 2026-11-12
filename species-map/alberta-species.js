// Alberta provincial sensitivity data is personal BYO-file only. No Government
// of Alberta GIS features are served, stored or redistributed by HuntSmart.
// Entries marked pending remain references, not mapped animal density.
window.HUNTSMART_ALBERTA_SPECIES = [
  { key:'caribou', label:'Boreal Caribou (federal range)', type:'federal_boreal_range',
    sourceUrl:'https://open.canada.ca/data/en/dataset/63e1cda6-debe-4b9b-b075-3666443e30b4',
    description:'ECCC federally mapped boreal caribou herd ranges (2012 boundaries, published with 2020 disturbance mapping). Does not cover Alberta mountain caribou or imply presence throughout each range.' },
  { key:'caribou_provincial', label:'Caribou — Alberta Govt (personal)', type:'personal_government_file',
    governmentFile:'CaribouRange.zip', sourceUrl:'https://extranet.gov.ab.ca/srd/geodiscover/srd_pub/LAT/FWDSensitivity/CaribouRange.zip', displayName:'Provincial caribou ranges' },
  { key:'elk', label:'Elk (source review)', type:'pending', sourceUrl:'https://abmi.ca/species/cervus-canadensis' },
  { key:'moose', label:'Moose (source review)', type:'pending', sourceUrl:'https://abmi.ca/abmi-home/data-resources/mapping-portal' },
  { key:'mule_deer', label:'Mule Deer (source review)', type:'pending', sourceUrl:'https://www.alberta.ca/aerial-wildlife-survey-reports' },
  { key:'white_tailed_deer', label:'White-tailed Deer (source review)', type:'pending', sourceUrl:'https://www.alberta.ca/aerial-wildlife-survey-reports' },
  { key:'goat_sheep_areas', label:'Mountain Goat & Sheep Areas (personal)', type:'personal_government_file',
    governmentFile:'MountainGoatAndSheepAreas.zip', sourceUrl:'https://extranet.gov.ab.ca/srd/geodiscover/srd_pub/LAT/FWDSensitivity/MountainGoatAndSheepAreas.zip', displayName:'Mountain goat and sheep sensitivity areas' },
  { key:'grizzly_bear', label:'Grizzly Bear Zones (personal)', type:'personal_government_file',
    governmentFile:'GrizzlyBearZone.zip', sourceUrl:'https://extranet.gov.ab.ca/srd/geodiscover/srd_pub/LAT/FWDSensitivity/GrizzlyBearZone.zip', displayName:'Grizzly bear core and secondary zones' },
  { key:'pronghorn', label:'Pronghorn (source review)', type:'pending', sourceUrl:'https://www.alberta.ca/aerial-wildlife-survey-reports' },
  { key:'wood_bison', label:'Wood Bison (source review)', type:'pending', sourceUrl:'https://www.alberta.ca/aerial-wildlife-survey-reports' },
];
