// SYNOPSIS AUDIT V2.1: Corrected Region 7A/7B WMU routing, restored Thinhorn rows, fixed V8.6 date guard, and rebuilt alphabetical Big Game / Small Game / Birds selector.
// ══════════════════════════════════════════════════════════════
// BC GENERAL OPEN SEASONS MAP — HuntSmart Canada
// Map-first, region → WMU General Open Season planner.
// Uses the same Mapbox streets/satellite/topo styling language as the main map.
// ══════════════════════════════════════════════════════════════

const BC_OS_DATA_RAW = [{"region":1,"region_name":"Vancouver Island","species":"Mule Deer (Black-tailed)","management_units":"1-1 to 1-15","weapon_type":"Rifle","bag_limit":"Refer to Regional Bag Limits","notes":"","class":"Bucks","season_text":"Sept 10 - Dec 10","season_open":"Sept 10","season_close":"Dec 10"},{"region":1,"region_name":"Vancouver Island","species":"Mule Deer (Black-tailed)","management_units":"1-1, 1-2, 1-4, 1-5, 1-6","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Antlerless","season_text":"Sept 10 - Dec 10","season_open":"Sept 10","season_close":"Dec 10"},{"region":1,"region_name":"Vancouver Island","species":"Mule Deer (Black-tailed)","management_units":"1-1 to 1-15","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Aug 25 - Sept 9","season_open":"Aug 25","season_close":"Sept 9"},{"region":1,"region_name":"Vancouver Island","species":"Mule Deer (Black-tailed)","management_units":"1-1, 1-2, 1-4, 1-5, 1-6","weapon_type":"Youth Bow Only","bag_limit":"","notes":"","class":"Antlerless","season_text":"Aug 25 - Sept 9","season_open":"Aug 25","season_close":"Sept 9"},{"region":1,"region_name":"Vancouver Island","species":"Fallow Deer","management_units":"1-1 to 1-7","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Either Sex","season_text":"No Closed Season","season_open":"No closed season","season_close":"No closed season"},{"region":1,"region_name":"Vancouver Island","species":"Mountain Goat","management_units":"1-14, 1-15","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":1,"region_name":"Vancouver Island","species":"Black Bear","management_units":"1-1 to 1-15","weapon_type":"Rifle","bag_limit":"2","notes":"","class":"Any","season_text":"Sept 10 - Dec 10","season_open":"Sept 10","season_close":"Dec 10"},{"region":1,"region_name":"Vancouver Island","species":"Black Bear","management_units":"1-1 to 1-15","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Apr 1 - June 15","season_open":"Apr 1","season_close":"June 15"},{"region":1,"region_name":"Vancouver Island","species":"Black Bear","management_units":"1-1 to 1-15","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Any","season_text":"Aug 25 - Sept 9","season_open":"Aug 25","season_close":"Sept 9"},{"region":1,"region_name":"Vancouver Island","species":"Wolf","management_units":"1-1 to 1-15","weapon_type":"Rifle","bag_limit":"3","notes":"","class":"Any","season_text":"Sept 10 - Mar 31","season_open":"Sept 10","season_close":"Mar 31"},{"region":1,"region_name":"Vancouver Island","species":"Wolf","management_units":"1-1 to 1-15","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Apr 1 - June 15","season_open":"Apr 1","season_close":"June 15"},{"region":1,"region_name":"Vancouver Island","species":"Cougar","management_units":"1-1 to 1-15","weapon_type":"Rifle","bag_limit":"2","notes":"","class":"Any","season_text":"Sept 10 - Mar 31","season_open":"Sept 10","season_close":"Mar 31"},{"region":1,"region_name":"Vancouver Island","species":"Cougar","management_units":"1-1 to 1-15","weapon_type":"Rifle","bag_limit":"","notes":"Hunters may not hunt a cougar kitten or any cougar in its company. See Definitions section: cougar kitten. All cougars taken in Region 1 must be Compulsory Inspected.","class":"Any","season_text":"Apr 1 - June 15","season_open":"Apr 1","season_close":"June 15"},{"region":1,"region_name":"Vancouver Island","species":"Raccoon","management_units":"1-1 to 1-15","weapon_type":"Rifle","bag_limit":"10","notes":"","class":"Any","season_text":"No Closed Season","season_open":"No closed season","season_close":"No closed season"},{"region":1,"region_name":"Vancouver Island","species":"Snowshoe Hare","management_units":"1-14, 1-15","weapon_type":"Rifle","bag_limit":"10 (daily)","notes":"","class":"Any","season_text":"Aug 1 - Apr 30","season_open":"Aug 1","season_close":"Apr 30"},{"region":1,"region_name":"Vancouver Island","species":"Opossum, Skunk","management_units":"1-1 to 1-15","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"No Closed Season","season_open":"No closed season","season_close":"No closed season"},{"region":1,"region_name":"Vancouver Island","species":"Grouse: Sooty (Blue) & Ruffed","management_units":"1-1 to 1-15","weapon_type":"Rifle","bag_limit":"5 each (15 each)","notes":"","class":"Any","season_text":"Sept 1 - Dec 31","season_open":"Sept 1","season_close":"Dec 31"},{"region":1,"region_name":"Vancouver Island","species":"Grouse: Sooty (Blue) & Ruffed","management_units":"1-1 to 1-15","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Any","season_text":"Aug 20 - Aug 31","season_open":"Aug 20","season_close":"Aug 31"},{"region":1,"region_name":"Vancouver Island","species":"Ptarmigan","management_units":"1-14, 1-15","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":1,"region_name":"Vancouver Island","species":"California Quail","management_units":"1-1 to 1-15","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Oct 1 - Nov 30","season_open":"Oct 1","season_close":"Nov 30"},{"region":1,"region_name":"Vancouver Island","species":"Pheasant","management_units":"1-1 to 1-9","weapon_type":"Rifle","bag_limit":"2 (6)","notes":"","class":"Any","season_text":"Oct 1 - Nov 30","season_open":"Oct 1","season_close":"Nov 30"},{"region":1,"region_name":"Vancouver Island","species":"Turkey","management_units":"1-1 to 1-7","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any Turkey","season_text":"No Closed Season","season_open":"No closed season","season_close":"No closed season"},{"region":1,"region_name":"Vancouver Island","species":"Band-Tailed Pigeons","management_units":"1-1 to 1-15","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 15 - Sept 30","season_open":"Sept 15","season_close":"Sept 30"},{"region":1,"region_name":"Vancouver Island","species":"Common Snipe","management_units":"1-1 to 1-15","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Oct 12, 2024 - Jan 26, 2025 / Oct 11, 2025 - Jan 25, 2026","season_open":"Oct 12, 2024","season_close":"Jan 26, 2025"},{"region":1,"region_name":"Vancouver Island","species":"Coots","management_units":"1-1 to 1-15","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Oct 12, 2024 - Jan 26, 2025 / Oct 11, 2025 - Jan 25, 2026","season_open":"Oct 12, 2024","season_close":"Jan 26, 2025"},{"region":1,"region_name":"Vancouver Island","species":"Ducks","management_units":"1-1 to 1-15","weapon_type":"Rifle","bag_limit":"8 (24)","notes":"","class":"Any","season_text":"Oct 12, 2024 - Jan 26, 2025 / Oct 11, 2025 - Jan 25, 2026","season_open":"Oct 12, 2024","season_close":"Jan 26, 2025"},{"region":1,"region_name":"Vancouver Island","species":"Geese: Snow & Ross's","management_units":"1-1 to 1-15","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Oct 12, 2024 - Jan 26, 2025 / Oct 11, 2025 - Jan 25, 2026","season_open":"Oct 12, 2024","season_close":"Jan 26, 2025"},{"region":1,"region_name":"Vancouver Island","species":"Geese: White-Fronted","management_units":"1-1 to 1-15","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Oct 12, 2024 - Jan 26, 2025 / Oct 11, 2025 - Jan 25, 2026","season_open":"Oct 12, 2024","season_close":"Jan 26, 2025"},{"region":1,"region_name":"Vancouver Island","species":"Geese: Canada & Cackling","management_units":"1-3, 1-8 to 1-15","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Oct 12, 2024 - Jan 26, 2025 / Oct 11, 2025 - Jan 25, 2026","season_open":"Oct 12, 2024","season_close":"Jan 26, 2025"},{"region":1,"region_name":"Vancouver Island","species":"Geese: Canada & Cackling","management_units":"1-1, 1-2, 1-4 to 1-7","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Sept 7, 2024 - Sept 17, 2024 / Sept 6, 2025 - Sept 16, 2025","season_open":"Sept 7, 2024","season_close":"Sept 17, 2024"},{"region":1,"region_name":"Vancouver Island","species":"Geese: Canada & Cackling","management_units":"1-1, 1-2, 1-4 to 1-7","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Oct 12, 2024 - Nov 24, 2024 / Oct 11, 2025 - Nov 23, 2025","season_open":"Oct 12, 2024","season_close":"Nov 24, 2024"},{"region":1,"region_name":"Vancouver Island","species":"Geese: Canada & Cackling","management_units":"1-1, 1-2, 1-4 to 1-7","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Dec 21, 2024 - Jan 12, 2025 / Dec 20, 2025 - Jan 11, 2026","season_open":"Dec 21, 2024","season_close":"Jan 12, 2025"},{"region":1,"region_name":"Vancouver Island","species":"Geese: Canada & Cackling","management_units":"1-1, 1-2, 1-4 to 1-7","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Feb 10, 2025 - Mar 10, 2025 / Feb 10, 2026 - Mar 10, 2026","season_open":"Feb 10, 2025","season_close":"Mar 10, 2025"},{"region":1,"region_name":"Vancouver Island","species":"Geese: Canada & Cackling","management_units":"1-4 (Ex-Dinsdale property, See Map A8)","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Oct 12, 2024 - Oct 21, 2024 / Oct 11, 2025 - Oct 20, 2025 / Dec 21, 2024 - Dec 31, 2024 / Dec 20, 2025 - Dec 31, 2025 / Feb 15, 2025 - Mar 10, 2025 / Feb 21, 2026 - Mar 10, 2026","season_open":"Oct 12, 2024","season_close":"Oct 21, 2024"},{"region":2,"region_name":"Lower Mainland","species":"Mule Deer (Black-tailed)","management_units":"2-2 to 2-4, 2-6 to 2-8, 2-13 to 2-15, 2-17 to 2-19","weapon_type":"Rifle","bag_limit":"Refer to Regional Bag Limits","notes":"","class":"Bucks","season_text":"Sept 10 - Dec 15","season_open":"Sept 10","season_close":"Dec 15"},{"region":2,"region_name":"Lower Mainland","species":"Mule Deer (Black-tailed)","management_units":"2-9 to 2-11","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":2,"region_name":"Lower Mainland","species":"Mule Deer (Black-tailed)","management_units":"2-5, 2-12","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":2,"region_name":"Lower Mainland","species":"Mule Deer (Black-tailed)","management_units":"2-16","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 10 - Dec 15","season_open":"Sept 10","season_close":"Dec 15"},{"region":2,"region_name":"Lower Mainland","species":"Mule Deer (Black-tailed)","management_units":"2-16","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Antlerless","season_text":"Nov 5 - Nov 20","season_open":"Nov 5","season_close":"Nov 20"},{"region":2,"region_name":"Lower Mainland","species":"Mule Deer (Black-tailed)","management_units":"2-11","weapon_type":"Youth/Senior Only","bag_limit":"","notes":"","class":"Antlerless","season_text":"Sept 10 - Sept 30","season_open":"Sept 10","season_close":"Sept 30"},{"region":2,"region_name":"Lower Mainland","species":"Mule Deer (Black-tailed)","management_units":"2-16","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Antlerless","season_text":"Oct 21 - Oct 31","season_open":"Oct 21","season_close":"Oct 31"},{"region":2,"region_name":"Lower Mainland","species":"Mule Deer (Black-tailed)","management_units":"2-2 to 2-19","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":2,"region_name":"Lower Mainland","species":"Mule Deer (Black-tailed)","management_units":"2-16","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Dec 15","season_open":"Sept 1","season_close":"Dec 15"},{"region":2,"region_name":"Lower Mainland","species":"Mule Deer (Black-tailed)","management_units":"2-16","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Antlerless","season_text":"Nov 5 - Dec 5","season_open":"Nov 5","season_close":"Dec 5"},{"region":2,"region_name":"Lower Mainland","species":"Mule Deer (Black-tailed)","management_units":"2-16","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Either Sex","season_text":"Jan 1 - Jan 15","season_open":"Jan 1","season_close":"Jan 15"},{"region":2,"region_name":"Lower Mainland","species":"Mule Deer (Black-tailed)","management_units":"2-16","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Either Sex","season_text":"Dec 16 - Jan 15","season_open":"Dec 16","season_close":"Jan 15"},{"region":2,"region_name":"Lower Mainland","species":"Mountain Goat","management_units":"2-5","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Sept 10 - Oct 15","season_open":"Sept 10","season_close":"Oct 15"},{"region":2,"region_name":"Lower Mainland","species":"Mountain Goat","management_units":"2-6","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Sept 10 - Sept 30","season_open":"Sept 10","season_close":"Sept 30"},{"region":2,"region_name":"Lower Mainland","species":"Mountain Goat","management_units":"2-12 to 2-15","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Sept 10 - Oct 31","season_open":"Sept 10","season_close":"Oct 31"},{"region":2,"region_name":"Lower Mainland","species":"Black Bear","management_units":"2-2 to 2-19","weapon_type":"Rifle","bag_limit":"2","notes":"","class":"Any","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":2,"region_name":"Lower Mainland","species":"Black Bear","management_units":"2-2 to 2-19","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Apr 1 - June 15","season_open":"Apr 1","season_close":"June 15"},{"region":2,"region_name":"Lower Mainland","species":"Black Bear","management_units":"2-2 to 2-19","weapon_type":"Bow Only","bag_limit":"","notes":"The bag limit for black bears is two per license year (Apr 1 - Mar 31)","class":"Any","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":2,"region_name":"Lower Mainland","species":"Wolf","management_units":"2-5, 2-6, 2-11 to 2-16","weapon_type":"Rifle","bag_limit":"3","notes":"","class":"Any","season_text":"Sept 10 - Mar 31","season_open":"Sept 10","season_close":"Mar 31"},{"region":2,"region_name":"Lower Mainland","species":"Wolf","management_units":"2-5, 2-6, 2-11 to 2-16","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Apr 1 - June 15","season_open":"Apr 1","season_close":"June 15"},{"region":2,"region_name":"Lower Mainland","species":"Coyote","management_units":"2-2 to 2-19","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"Sept 10 - June 15","season_open":"Sept 10","season_close":"June 15"},{"region":2,"region_name":"Lower Mainland","species":"Raccoon, Skunk","management_units":"2-2 to 2-19","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"Sept 1 - Mar 31","season_open":"Sept 1","season_close":"Mar 31"},{"region":2,"region_name":"Lower Mainland","species":"Snowshoe Hare","management_units":"2-5 to 2-19","weapon_type":"Rifle","bag_limit":"10 (Daily)","notes":"","class":"Any","season_text":"Aug 1 - Apr 30","season_open":"Aug 1","season_close":"Apr 30"},{"region":2,"region_name":"Lower Mainland","species":"Bobcat","management_units":"2-2 to 2-19","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Nov 15 - Feb 15","season_open":"Nov 15","season_close":"Feb 15"},{"region":2,"region_name":"Lower Mainland","species":"Cougar","management_units":"2-2 to 2-19","weapon_type":"Rifle","bag_limit":"2","notes":"","class":"Any","season_text":"Sept 10 - Mar 31","season_open":"Sept 10","season_close":"Mar 31"},{"region":2,"region_name":"Lower Mainland","species":"Cougar","management_units":"2-2 to 2-19","weapon_type":"Rifle","bag_limit":"","notes":"Hunters may not hunt a cougar kitten or any cougar in its company. See Definitions section: cougar kitten. All cougars taken in Region 2 must be Compulsory Inspected.","class":"Any","season_text":"Apr 1 - June 15","season_open":"Apr 1","season_close":"June 15"},{"region":2,"region_name":"Lower Mainland","species":"Grouse: Sooty (Blue), Ruffed & Spruce","management_units":"2-2 to 2-19","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 10 - Dec 15","season_open":"Sept 10","season_close":"Dec 15"},{"region":2,"region_name":"Lower Mainland","species":"Grouse: Sooty (Blue), Ruffed & Spruce","management_units":"2-2 to 2-19","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Any","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":2,"region_name":"Lower Mainland","species":"Ptarmigan","management_units":"2-2, 2-3, 2-5 to 2-19","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 10 - Dec 15","season_open":"Sept 10","season_close":"Dec 15"},{"region":2,"region_name":"Lower Mainland","species":"Ptarmigan","management_units":"2-2, 2-3, 2-5 to 2-19","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Any","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":2,"region_name":"Lower Mainland","species":"Pheasant (Cocks)","management_units":"2-4, 2-8","weapon_type":"Rifle","bag_limit":"2(6)","notes":"","class":"Any","season_text":"Oct 12, 2024 - Nov 30, 2024 / Oct 11, 2025 - Nov 30, 2025","season_open":"Oct 12, 2024","season_close":"Nov 30, 2024"},{"region":2,"region_name":"Lower Mainland","species":"Band-Tailed Pigeons","management_units":"2-2 to 2-19","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 15 - Sept 30","season_open":"Sept 15","season_close":"Sept 30"},{"region":2,"region_name":"Lower Mainland","species":"Brant","management_units":"2-4","weapon_type":"Rifle","bag_limit":"3 (9)","notes":"","class":"Any","season_text":"Mar 1 - Mar 10","season_open":"Mar 1","season_close":"Mar 10"},{"region":2,"region_name":"Lower Mainland","species":"Common Snipe","management_units":"2-2 to 2-19","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Oct 12, 2024 - Jan 26, 2025 / Oct 11, 2025 - Jan 25, 2026","season_open":"Oct 12, 2024","season_close":"Jan 26, 2025"},{"region":2,"region_name":"Lower Mainland","species":"Coots","management_units":"2-2 to 2-19","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Oct 12, 2024 - Jan 26, 2025 / Oct 11, 2025 - Jan 25, 2026","season_open":"Oct 12, 2024","season_close":"Jan 26, 2025"},{"region":2,"region_name":"Lower Mainland","species":"Ducks","management_units":"2-2 to 2-19","weapon_type":"Rifle","bag_limit":"8 (24)","notes":"","class":"Any","season_text":"Oct 12, 2024 - Jan 26, 2025 / Oct 11, 2025 - Jan 25, 2026","season_open":"Oct 12, 2024","season_close":"Jan 26, 2025"},{"region":2,"region_name":"Lower Mainland","species":"Geese: Snow & Ross's","management_units":"2-2, 2-3, 2-4 s, 2-5 s, 2-6 to 2-19","weapon_type":"Rifle","bag_limit":"10 (30)H","notes":"","class":"Any","season_text":"Oct 12, 2024 - Jan 7, 2025 / Oct 11, 2025 - Jan 6, 2026","season_open":"Oct 12, 2024","season_close":"Jan 7, 2025"},{"region":2,"region_name":"Lower Mainland","species":"Geese: Snow & Ross's","management_units":"2-2, 2-3, 2-4 s, 2-5 s, 2-6 to 2-19","weapon_type":"Rifle","bag_limit":"Notes:","notes":"","class":"Any","season_text":"Feb 20, 2025 - Mar 10, 2025 / Feb 20, 2026 - Mar 10, 2026","season_open":"Feb 20, 2025","season_close":"Mar 10, 2025"},{"region":2,"region_name":"Lower Mainland","species":"Geese: White-Fronted","management_units":"2-2 to 2-19","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Oct 12, 2024 - Jan 26, 2025 / Oct 11, 2025 - Jan 25, 2026","season_open":"Oct 12, 2024","season_close":"Jan 26, 2025"},{"region":2,"region_name":"Lower Mainland","species":"Geese: Canada & Cackling","management_units":"2-2 to 2-19","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 7, 2024 - Sept 17, 2024 / Sept 6, 2025 - Sept 16, 2025","season_open":"Sept 7, 2024","season_close":"Sept 17, 2024"},{"region":2,"region_name":"Lower Mainland","species":"Geese: Canada & Cackling","management_units":"2-2 to 2-19","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Oct 12, 2024 - Nov 24, 2024 / Oct 11, 2025 - Nov 23, 2025","season_open":"Oct 12, 2024","season_close":"Nov 24, 2024"},{"region":2,"region_name":"Lower Mainland","species":"Geese: Canada & Cackling","management_units":"2-2 to 2-19","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Dec 21, 2024 - Jan 12, 2025 / Dec 20, 2025 - Jan 11, 2026","season_open":"Dec 21, 2024","season_close":"Jan 12, 2025"},{"region":2,"region_name":"Lower Mainland","species":"Geese: Canada & Cackling","management_units":"2-2 to 2-19","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Feb 10, 2025 - Mar 10 2025 / Feb 10, 2026 - Mar 10, 2026","season_open":"Feb 10, 2025","season_close":"Mar 10"},{"region":3,"region_name":"Thompson","species":"Mule Deer (Black-tailed)","management_units":"3-15, 3-16, 3-32, 3-33","weapon_type":"Rifle","bag_limit":"Refer to Regional Bag Limits","notes":"","class":"4 Point Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":3,"region_name":"Thompson","species":"Mule Deer (Black-tailed)","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"","notes":"","class":"4 Point Bucks","season_text":"Sept 10 - Sept 30","season_open":"Sept 10","season_close":"Sept 30"},{"region":3,"region_name":"Thompson","species":"Mule Deer (Black-tailed)","management_units":"3-46","weapon_type":"Rifle","bag_limit":"","notes":"","class":"4 Point Bucks","season_text":"Sept 20 - Sept 30","season_open":"Sept 20","season_close":"Sept 30"},{"region":3,"region_name":"Thompson","species":"Mule Deer (Black-tailed)","management_units":"3-12 to 3-20, 3-26 to 3-44, 3-46","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Bucks","season_text":"Oct 1 - Oct 31","season_open":"Oct 1","season_close":"Oct 31"},{"region":3,"region_name":"Thompson","species":"Mule Deer (Black-tailed)","management_units":"3-12 to 3-20, 3-26 to 3-44, 3-46","weapon_type":"Rifle","bag_limit":"","notes":"","class":"4 Point Bucks","season_text":"Nov 1 - Dec 10","season_open":"Nov 1","season_close":"Dec 10"},{"region":3,"region_name":"Thompson","species":"Mule Deer (Black-tailed)","management_units":"3-12 to 3-14, 3-17 to 3-20, 3-26 to 3-31, 3-34 to 3-44","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":3,"region_name":"Thompson","species":"Mule Deer (Black-tailed)","management_units":"3-12 to 3-14, 3-17 to 3-20, 3-26 to 3-31, 3-34 to 3-44","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":3,"region_name":"Thompson","species":"White-tailed Deer","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"Refer to Regional Bag Limits","notes":"","class":"Bucks","season_text":"Sept 10 - Dec 10","season_open":"Sept 10","season_close":"Dec 10"},{"region":3,"region_name":"Thompson","species":"White-tailed Deer","management_units":"3-46","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 20 - Dec 10","season_open":"Sept 20","season_close":"Dec 10"},{"region":3,"region_name":"Thompson","species":"White-tailed Deer","management_units":"3-12 to 3-20, 3-26 to 3-44, 3-46","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Antlerless","season_text":"Oct 10 - Oct 31","season_open":"Oct 10","season_close":"Oct 31"},{"region":3,"region_name":"Thompson","species":"White-tailed Deer","management_units":"3-12 to 3-20, 3-26 to 3-44, 3-46","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Either Sex","season_text":"Nov 1 - Nov 30","season_open":"Nov 1","season_close":"Nov 30"},{"region":3,"region_name":"Thompson","species":"White-tailed Deer","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":3,"region_name":"Thompson","species":"White-tailed Deer","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":3,"region_name":"Thompson","species":"Moose","management_units":"3-34 to 3-38, 3-40 to 3-44, 3-46","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Spike-fork Bulls","season_text":"Sept 20 - Oct 31","season_open":"Sept 20","season_close":"Oct 31"},{"region":3,"region_name":"Thompson","species":"Moose","management_units":"3-15 to 3-17, 3-31 to 3-33","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Spike-fork Bulls","season_text":"Oct 15 - Nov 15","season_open":"Oct 15","season_close":"Nov 15"},{"region":3,"region_name":"Thompson","species":"Moose","management_units":"3-12 to 3-14, 3-18 to 3-20, 3-26 to 3-30, 3-39","weapon_type":"Rifle","bag_limit":"","notes":"All individuals with a moose species licence must submit a Mandatory Hunter Report by January 15th. See page 16 for more details.","class":"Spike-fork Bulls","season_text":"Nov 1 - Nov 15","season_open":"Nov 1","season_close":"Nov 15"},{"region":3,"region_name":"Thompson","species":"Bighorn Mountain Sheep","management_units":"3-31, 3-32","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Full Curl Bighorn Rams","season_text":"Sept 10 - Oct 20","season_open":"Sept 10","season_close":"Oct 20"},{"region":3,"region_name":"Thompson","species":"Bighorn Mountain Sheep","management_units":"3-17","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Mature Bighorn Rams","season_text":"Sept 10 - Oct 20","season_open":"Sept 10","season_close":"Oct 20"},{"region":3,"region_name":"Thompson","species":"Black Bear","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"2","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":3,"region_name":"Thompson","species":"Black Bear","management_units":"3-46","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Sept 20 - Nov 30","season_open":"Sept 20","season_close":"Nov 30"},{"region":3,"region_name":"Thompson","species":"Black Bear","management_units":"3-12 to 3-20, 3-26 to 3-44, 3-46","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Apr 1 - June 30","season_open":"Apr 1","season_close":"June 30"},{"region":3,"region_name":"Thompson","species":"Wolf","management_units":"3-12 to 3-16, 3-18 to 3-20","weapon_type":"Rifle","bag_limit":"3","notes":"","class":"Any","season_text":"Sept 10 - June 15","season_open":"Sept 10","season_close":"June 15"},{"region":3,"region_name":"Thompson","species":"Wolf","management_units":"3-17, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"No closed season","season_open":"No closed season","season_close":"No closed season"},{"region":3,"region_name":"Thompson","species":"Coyote","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"Sept 1 - June 30","season_open":"Sept 1","season_close":"June 30"},{"region":3,"region_name":"Thompson","species":"Cougar","management_units":"3-12 to 3-20, 3-26 to 3-33","weapon_type":"Rifle","bag_limit":"2","notes":"","class":"Any","season_text":"Nov 15 - Mar 31","season_open":"Nov 15","season_close":"Mar 31"},{"region":3,"region_name":"Thompson","species":"Cougar","management_units":"3-34 to 3-44","weapon_type":"Rifle","bag_limit":"","notes":"Hunters may not hunt a cougar kitten or any cougar in its company. See Definitions Section: Cougar kitten. Compulsory Inspection required.","class":"Any","season_text":"Sept 10 - Mar 31","season_open":"Sept 10","season_close":"Mar 31"},{"region":3,"region_name":"Thompson","species":"Bobcat","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Nov 15 - Feb 15","season_open":"Nov 15","season_close":"Feb 15"},{"region":3,"region_name":"Thompson","species":"Lynx","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Nov 15 - Feb 15","season_open":"Nov 15","season_close":"Feb 15"},{"region":3,"region_name":"Thompson","species":"Raccoon","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"No Closed Season","season_open":"No closed season","season_close":"No closed season"},{"region":3,"region_name":"Thompson","species":"Snowshoe Hare","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"10 (daily)","notes":"","class":"Any","season_text":"Aug 1 - Apr 30","season_open":"Aug 1","season_close":"Apr 30"},{"region":3,"region_name":"Thompson","species":"Columbian Ground Squirrel","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"No Closed Season","season_open":"No closed season","season_close":"No closed season"},{"region":3,"region_name":"Thompson","species":"Grouse: Dusky (Blue), Ruffed & Spruce","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"5 each (15 each)","notes":"","class":"Any","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":3,"region_name":"Thompson","species":"Grouse: Dusky (Blue), Ruffed & Spruce","management_units":"3-46","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Sept 20 - Nov 30","season_open":"Sept 20","season_close":"Nov 30"},{"region":3,"region_name":"Thompson","species":"Sharp-Tailed Grouse","management_units":"3-30, 3-31","weapon_type":"Rifle","bag_limit":"5 (10)","notes":"","class":"Any","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":3,"region_name":"Thompson","species":"Ptarmigan","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":3,"region_name":"Thompson","species":"Chukar Partridge","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Oct 1 - Nov 30","season_open":"Oct 1","season_close":"Nov 30"},{"region":3,"region_name":"Thompson","species":"Gray Partridge (Hungarian)","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"3 (9)","notes":"","class":"Any","season_text":"Oct 1 - Nov 30","season_open":"Oct 1","season_close":"Nov 30"},{"region":3,"region_name":"Thompson","species":"Pheasant (Cocks)","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"2 (6)","notes":"","class":"Any","season_text":"Oct 1 - Nov 30","season_open":"Oct 1","season_close":"Nov 30"},{"region":3,"region_name":"Thompson","species":"Dove: Mourning, Eurasian Collared","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 1 - Sept 30","season_open":"Sept 1","season_close":"Sept 30"},{"region":3,"region_name":"Thompson","species":"Band-Tailed Pigeons","management_units":"3-13 to 3-17","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 15 - Sept 30","season_open":"Sept 15","season_close":"Sept 30"},{"region":3,"region_name":"Thompson","species":"Common Snipe","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 8 - Dec 23","season_open":"Sept 8","season_close":"Dec 23"},{"region":3,"region_name":"Thompson","species":"Coots","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 8 - Dec 23","season_open":"Sept 8","season_close":"Dec 23"},{"region":3,"region_name":"Thompson","species":"Ducks","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"8 (24)","notes":"","class":"Any","season_text":"Sept 8 - Dec 23","season_open":"Sept 8","season_close":"Dec 23"},{"region":3,"region_name":"Thompson","species":"Geese: Snow & Ross's","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 8 - Dec 23","season_open":"Sept 8","season_close":"Dec 23"},{"region":3,"region_name":"Thompson","species":"Geese: White-Fronted","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 8 - Dec 23","season_open":"Sept 8","season_close":"Dec 23"},{"region":3,"region_name":"Thompson","species":"Geese: Canada & Cackling","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 8 - Sept 20","season_open":"Sept 8","season_close":"Sept 20"},{"region":3,"region_name":"Thompson","species":"Geese: Canada & Cackling","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Oct 1 - Dec 23","season_open":"Oct 1","season_close":"Dec 23"},{"region":3,"region_name":"Thompson","species":"Geese: Canada & Cackling","management_units":"3-12 to 3-20, 3-26 to 3-44","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Mar 1 - Mar 10","season_open":"Mar 1","season_close":"Mar 10"},{"region":4,"region_name":"Kootenay","species":"Mule Deer (Black-tailed)","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"Refer to Regional Bag Limits","notes":"","class":"4 Point Bucks","season_text":"Sept 10 - Nov 10","season_open":"Sept 10","season_close":"Nov 10"},{"region":4,"region_name":"Kootenay","species":"Mule Deer (Black-tailed)","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":4,"region_name":"Kootenay","species":"Mule Deer (Black-tailed)","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":4,"region_name":"Kootenay","species":"White-tailed Deer","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"Refer to Regional Bag Limits","notes":"","class":"Bucks","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":4,"region_name":"Kootenay","species":"White-tailed Deer","management_units":"4-28 to 4-31, 4-38, 4-39","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Antlerless","season_text":"Oct 10 - Oct 31","season_open":"Oct 10","season_close":"Oct 31"},{"region":4,"region_name":"Kootenay","species":"White-tailed Deer","management_units":"4-1 to 4-6, 4-20 to 4-26, 4-34 to 4-37, 4-40","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Antlerless","season_text":"Oct 21 - Oct 31","season_open":"Oct 21","season_close":"Oct 31"},{"region":4,"region_name":"Kootenay","species":"White-tailed Deer","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Either Sex","season_text":"Nov 1 - Nov 30","season_open":"Nov 1","season_close":"Nov 30"},{"region":4,"region_name":"Kootenay","species":"White-tailed Deer","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":4,"region_name":"Kootenay","species":"White-tailed Deer","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":4,"region_name":"Kootenay","species":"White-tailed Deer","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Bow Only","bag_limit":"","notes":"Restricted to hunters under the age of 18. ** The bag limit for white-tailed deer is 2; one may be antlerless and one may be a buck.","class":"Either Sex","season_text":"Dec 1 - Dec 20","season_open":"Dec 1","season_close":"Dec 20"},{"region":4,"region_name":"Kootenay","species":"Elk","management_units":"4-1 to 4-7, 4-20 to 4-26, 4-34 to 4-36, 4-40","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"6 Point Bulls","season_text":"Sept 10 - Oct 20","season_open":"Sept 10","season_close":"Oct 20"},{"region":4,"region_name":"Kootenay","species":"Elk","management_units":"4-8, 4-9, 4-14 to 4-19, 4-27 to 4-33, 4-37, 4-38","weapon_type":"Rifle","bag_limit":"","notes":"","class":"6 Point Bulls","season_text":"Sept 10 - Oct 5","season_open":"Sept 10","season_close":"Oct 5"},{"region":4,"region_name":"Kootenay","species":"Elk","management_units":"4-1 to 4-7, 4-20 to 4-26, 4-34 to 4-36, 4-40","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bulls","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":4,"region_name":"Kootenay","species":"Elk","management_units":"4-8, 4-9, 4-14 to 4-19, 4-27 to 4-33, 4-37, 4-38","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"6 Point Bulls","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":4,"region_name":"Kootenay","species":"Moose","management_units":"4-7 to 4-9, 4-14 to 4-18, 4-27 to 4-33, 4-36 to 4-40","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Spike-fork Bulls","season_text":"Sept 20 - Oct 31","season_open":"Sept 20","season_close":"Oct 31"},{"region":4,"region_name":"Kootenay","species":"Moose","management_units":"4-1 to 4-6, 4-19 to 4-26, 4-34, 4-35","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Spike-fork Bulls","season_text":"Oct 15 - Oct 31","season_open":"Oct 15","season_close":"Oct 31"},{"region":4,"region_name":"Kootenay","species":"Moose","management_units":"4-7 to 4-9, 4-14 to 4-18, 4-27 to 4-33, 4-36 to 4-40","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Spike-fork Bulls","season_text":"Sept 1 - Sept 19","season_open":"Sept 1","season_close":"Sept 19"},{"region":4,"region_name":"Kootenay","species":"Moose","management_units":"4-1 to 4-6, 4-19 to 4-26, 4-34, 4-35","weapon_type":"Bow Only","bag_limit":"","notes":"All individuals with a moose species licence must submit a Mandatory Hunter Report by January 15th. See page 16 for more details.","class":"Spike-fork Bulls","season_text":"Sept 1 - Oct 14","season_open":"Sept 1","season_close":"Oct 14"},{"region":4,"region_name":"Kootenay","species":"Mountain Goat","management_units":"4-28 to 4-30, 4-37 (open season north and west of Windy Creek), 4-39, 4-40","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":4,"region_name":"Kootenay","species":"Black Bear","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"2","notes":"","class":"Any","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":4,"region_name":"Kootenay","species":"Black Bear","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Apr 1 - June 30","season_open":"Apr 1","season_close":"June 30"},{"region":4,"region_name":"Kootenay","species":"Black Bear","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Aug 1 - Aug 31","season_open":"Aug 1","season_close":"Aug 31"},{"region":4,"region_name":"Kootenay","species":"Black Bear","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Any","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":4,"region_name":"Kootenay","species":"Wolf","management_units":"4-5 to 4-8, 4-17, 4-18, 4-20, 4-27 to 4-31, 4-33, 4-37 to 4-40","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"Sept 1 - Jun 15","season_open":"Sept 1","season_close":"Jun 15"},{"region":4,"region_name":"Kootenay","species":"Wolf","management_units":"4-1 to 4-4, 4-9, 4-14 to 4-16, 4-19, 4-21 to 4-26, 4-32, 4-34 to 4-36","weapon_type":"Rifle","bag_limit":"3","notes":"","class":"Any","season_text":"Sept 10 - Jun 15","season_open":"Sept 10","season_close":"Jun 15"},{"region":4,"region_name":"Kootenay","species":"Coyote","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"Sept 10 - Mar 31","season_open":"Sept 10","season_close":"Mar 31"},{"region":4,"region_name":"Kootenay","species":"Lynx","management_units":"4-1, 4-2, 4-6 to 4-9, 4-14 to 4-19, 4-21 to 4-40","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Nov 15 - Dec 31","season_open":"Nov 15","season_close":"Dec 31"},{"region":4,"region_name":"Kootenay","species":"Lynx","management_units":"4-3 to 4-5, 4-20","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Dec 1 - Dec 31","season_open":"Dec 1","season_close":"Dec 31"},{"region":4,"region_name":"Kootenay","species":"Bobcat","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Nov 15 - Feb 15","season_open":"Nov 15","season_close":"Feb 15"},{"region":4,"region_name":"Kootenay","species":"Cougar","management_units":"4-1 to 4-5, 4-20 to 4-26, 4-34 to 4-36","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Sept 10 - Feb 28","season_open":"Sept 10","season_close":"Feb 28"},{"region":4,"region_name":"Kootenay","species":"Cougar","management_units":"4-6 to 4-8, 4-28 to 4-31, 4-38, 4-39","weapon_type":"Rifle","bag_limit":"2","notes":"","class":"Any","season_text":"Sept 10 - Mar 31","season_open":"Sept 10","season_close":"Mar 31"},{"region":4,"region_name":"Kootenay","species":"Cougar","management_units":"4-9 to 4-19, 4-27, 4-32, 4-33, 4-37, 4-40","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Sept 10 - Mar 31","season_open":"Sept 10","season_close":"Mar 31"},{"region":4,"region_name":"Kootenay","species":"Columbian Ground Squirrel","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"No Closed Season","season_open":"No closed season","season_close":"No closed season"},{"region":4,"region_name":"Kootenay","species":"Snowshoe Hare","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"10 (daily)","notes":"","class":"Any","season_text":"Aug 1 - Apr 30","season_open":"Aug 1","season_close":"Apr 30"},{"region":4,"region_name":"Kootenay","species":"Raccoon","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"Sept 10 - Mar 31","season_open":"Sept 10","season_close":"Mar 31"},{"region":4,"region_name":"Kootenay","species":"Skunk","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"Aug 1 - Apr 30","season_open":"Aug 1","season_close":"Apr 30"},{"region":4,"region_name":"Kootenay","species":"Grouse: Dusky (Blue), Ruffed & Spruce","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":4,"region_name":"Kootenay","species":"Pheasant (Cocks)","management_units":"4-6, 4-7","weapon_type":"Rifle","bag_limit":"3 (daily)","notes":"","class":"Any","season_text":"Oct 15 - Nov 30","season_open":"Oct 15","season_close":"Nov 30"},{"region":4,"region_name":"Kootenay","species":"Ptarmigan","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":4,"region_name":"Kootenay","species":"Turkey","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Bearded","season_text":"Apr 15 - May 25","season_open":"Apr 15","season_close":"May 25"},{"region":4,"region_name":"Kootenay","species":"Turkey","management_units":"4-1 to 4-4, 4-14 to 4-24, 4-26 to 4-40","weapon_type":"Rifle","bag_limit":"2","notes":"","class":"Any Turkey","season_text":"Oct 1 - Oct 15","season_open":"Oct 1","season_close":"Oct 15"},{"region":4,"region_name":"Kootenay","species":"Turkey","management_units":"4-5 to 4-9, 4-25","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any Turkey","season_text":"Oct 1 - Nov 30","season_open":"Oct 1","season_close":"Nov 30"},{"region":4,"region_name":"Kootenay","species":"Turkey","management_units":"4-7 to 4-9, 4-14 to 4-18","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any Turkey","season_text":"Dec 1 - Dec 31","season_open":"Dec 1","season_close":"Dec 31"},{"region":4,"region_name":"Kootenay","species":"Turkey","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Bow Only","bag_limit":"","notes":"The aggregate bag limit for turkey is 3, only one may be taken in the spring and two in the fall. s Restricted to private land only, must have permission from landowners prior to access.","class":"Bearded","season_text":"Sept 1 - Sept 30","season_open":"Sept 1","season_close":"Sept 30"},{"region":4,"region_name":"Kootenay","species":"Dove: Mourning, Eurasian Collared","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 1 - Sept 30","season_open":"Sept 1","season_close":"Sept 30"},{"region":4,"region_name":"Kootenay","species":"Common Snipe","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 8 - Dec 23","season_open":"Sept 8","season_close":"Dec 23"},{"region":4,"region_name":"Kootenay","species":"Coots","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 8 - Dec 23","season_open":"Sept 8","season_close":"Dec 23"},{"region":4,"region_name":"Kootenay","species":"Ducks","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"8 (24)","notes":"","class":"Any","season_text":"Sept 8 - Dec 23","season_open":"Sept 8","season_close":"Dec 23"},{"region":4,"region_name":"Kootenay","species":"Geese: Snow & Ross's","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 8 - Dec 23","season_open":"Sept 8","season_close":"Dec 23"},{"region":4,"region_name":"Kootenay","species":"Geese: White-Fronted","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 8 - Dec 23","season_open":"Sept 8","season_close":"Dec 23"},{"region":4,"region_name":"Kootenay","species":"Geese: Canada & Cackling","management_units":"4-1 to 4-9, 4-14 to 4-40","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 8 - Dec 23","season_open":"Sept 8","season_close":"Dec 23"},{"region":5,"region_name":"Cariboo","species":"Mule Deer (Black-tailed)","management_units":"5-4, 5-5, 5-6, 5-15","weapon_type":"Rifle","bag_limit":"Refer to Regional Bag Limits","notes":"","class":"4 Point Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":5,"region_name":"Cariboo","species":"Mule Deer (Black-tailed)","management_units":"5-1 to 5-6, 5-10 to 5-15","weapon_type":"Rifle","bag_limit":"","notes":"","class":"4 Point Bucks","season_text":"Sept 10 - Sept 30","season_open":"Sept 10","season_close":"Sept 30"},{"region":5,"region_name":"Cariboo","species":"Mule Deer (Black-tailed)","management_units":"5-1 to 5-6, 5-10 to 5-15","weapon_type":"Rifle","bag_limit":"","notes":"","class":"4 Point Bucks","season_text":"Nov 1 - Nov 10","season_open":"Nov 1","season_close":"Nov 10"},{"region":5,"region_name":"Cariboo","species":"Mule Deer (Black-tailed)","management_units":"5-1 to 5-6, 5-10 to 5-15","weapon_type":"Rifle","bag_limit":"","notes":"","class":"4 Point Bucks","season_text":"Nov 21 - Nov 30","season_open":"Nov 21","season_close":"Nov 30"},{"region":5,"region_name":"Cariboo","species":"Mule Deer (Black-tailed)","management_units":"5-7 to 5-9","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":5,"region_name":"Cariboo","species":"Mule Deer (Black-tailed)","management_units":"5-1 to 5-15","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Bucks","season_text":"Oct 1 - Oct 31","season_open":"Oct 1","season_close":"Oct 31"},{"region":5,"region_name":"Cariboo","species":"Mule Deer (Black-tailed)","management_units":"5-1 to 5-3, 5-7 to 5-9, 5-12 to 5-14","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":5,"region_name":"Cariboo","species":"Mule Deer (Black-tailed)","management_units":"5-1 to 5-6, 5-13 and 5-14","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Dec 1 - Dec 10","season_open":"Dec 1","season_close":"Dec 10"},{"region":5,"region_name":"Cariboo","species":"Mule Deer (Black-tailed)","management_units":"5-8, 5-11","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Dec 1 - Dec 24","season_open":"Dec 1","season_close":"Dec 24"},{"region":5,"region_name":"Cariboo","species":"White-tailed Deer","management_units":"5-1 to 5-6, 5-12 to 5-15","weapon_type":"Rifle","bag_limit":"Refer to Regional Bag Limits","notes":"","class":"Bucks","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":5,"region_name":"Cariboo","species":"White-tailed Deer","management_units":"5-1 to 5-6, 5-12 to 5-15","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Antlerless","season_text":"Oct 10 - Oct 31","season_open":"Oct 10","season_close":"Oct 31"},{"region":5,"region_name":"Cariboo","species":"White-tailed Deer","management_units":"5-1 to 5-6, 5-12 to 5-15","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Either Sex","season_text":"Nov 1 - Nov 30","season_open":"Nov 1","season_close":"Nov 30"},{"region":5,"region_name":"Cariboo","species":"White-tailed Deer","management_units":"5-1 to 5-6, 5-12 to 5-15","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":5,"region_name":"Cariboo","species":"White-tailed Deer","management_units":"5-1 to 5-6, 5-12 to 5-15","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":5,"region_name":"Cariboo","species":"White-tailed Deer","management_units":"5-1, 5-2, 5-13, 5-14","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Dec 1 - Dec 10","season_open":"Dec 1","season_close":"Dec 10"},{"region":5,"region_name":"Cariboo","species":"Bighorn Mountain Sheep","management_units":"5-2","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Full Curl Bighorn Rams","season_text":"Sept 10 - Oct 20","season_open":"Sept 10","season_close":"Oct 20"},{"region":5,"region_name":"Cariboo","species":"Mountain Goat","management_units":"5-5 to 5-9, 5-11, 5-15","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Sept 1 - Oct 31","season_open":"Sept 1","season_close":"Oct 31"},{"region":5,"region_name":"Cariboo","species":"Black Bear","management_units":"5-1 to 5-10, 5-12 to 5-15","weapon_type":"Rifle","bag_limit":"2","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":5,"region_name":"Cariboo","species":"Black Bear","management_units":"5-1 to 5-10, 5-12 to 5-15","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Apr 1 - June 30","season_open":"Apr 1","season_close":"June 30"},{"region":5,"region_name":"Cariboo","species":"Black Bear","management_units":"5-11","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":5,"region_name":"Cariboo","species":"Black Bear","management_units":"5-11","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Apr 1 - May 31","season_open":"Apr 1","season_close":"May 31"},{"region":5,"region_name":"Cariboo","species":"Wolf","management_units":"5-7 to 5-9","weapon_type":"Rifle","bag_limit":"3","notes":"","class":"Any","season_text":"Apr 1 - June 15","season_open":"Apr 1","season_close":"June 15"},{"region":5,"region_name":"Cariboo","species":"Wolf","management_units":"5-7 to 5-9","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Aug 1 - Mar 31","season_open":"Aug 1","season_close":"Mar 31"},{"region":5,"region_name":"Cariboo","species":"Wolf","management_units":"5-10, 5-11","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Sept 1 - Mar 31","season_open":"Sept 1","season_close":"Mar 31"},{"region":5,"region_name":"Cariboo","species":"Wolf","management_units":"5-1 to 5-6, 5-12 to 5-15","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"No Closed Season","season_open":"No closed season","season_close":"No closed season"},{"region":5,"region_name":"Cariboo","species":"Coyote","management_units":"5-1 to 5-15","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"Sept 1 - Mar 31","season_open":"Sept 1","season_close":"Mar 31"},{"region":5,"region_name":"Cariboo","species":"Lynx","management_units":"5-1 to 5-9, 5-12 to 5-15","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Nov 1 - Jan 31","season_open":"Nov 1","season_close":"Jan 31"},{"region":5,"region_name":"Cariboo","species":"Cougar","management_units":"5-1 to 5-9, 5-12 to 5-15","weapon_type":"Rifle","bag_limit":"2","notes":"","class":"Any","season_text":"Sept 10 - Apr 30","season_open":"Sept 10","season_close":"Apr 30"},{"region":5,"region_name":"Cariboo","species":"Cougar","management_units":"5-11","weapon_type":"Rifle","bag_limit":"","notes":"Hunters may not hunt a cougar kitten or any cougar in its company. See Definitions section: cougar kitten. Compulsory Inspection required.","class":"Any","season_text":"Nov 15 - Mar 31","season_open":"Nov 15","season_close":"Mar 31"},{"region":5,"region_name":"Cariboo","species":"Bobcat","management_units":"5-1 to 5-9, 5-12 to 5-15","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Dec 1 - Dec 31","season_open":"Dec 1","season_close":"Dec 31"},{"region":5,"region_name":"Cariboo","species":"Raccoon","management_units":"5-1 to 5-15","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"No Closed Season","season_open":"No closed season","season_close":"No closed season"},{"region":5,"region_name":"Cariboo","species":"Snowshoe Hare","management_units":"5-1 to 5-9, 5-12 to 5-15","weapon_type":"Rifle","bag_limit":"10 (daily)","notes":"","class":"Any","season_text":"Aug 1 - Apr 30","season_open":"Aug 1","season_close":"Apr 30"},{"region":5,"region_name":"Cariboo","species":"Columbian Ground Squirrel","management_units":"5-1 to 5-9, 5-12 to 5-15","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"No Closed Season","season_open":"No closed season","season_close":"No closed season"},{"region":5,"region_name":"Cariboo","species":"Grouse: Sooty/Dusky (Blue), Ruffed & Spruce","management_units":"5-1 to 5-15","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":5,"region_name":"Cariboo","species":"Sharp-Tailed Grouse","management_units":"5-1 to 5-6, 5-12 to 5-14","weapon_type":"Rifle","bag_limit":"5 (10)","notes":"","class":"Any","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":5,"region_name":"Cariboo","species":"Ptarmigan","management_units":"5-3 to 5-6, 5-10 to 5-12, 5-15","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 1 - Nov 1","season_open":"Sept 1","season_close":"Nov 1"},{"region":5,"region_name":"Cariboo","species":"Chukar Partridge","management_units":"5-3","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 10 - Nov 20","season_open":"Sept 10","season_close":"Nov 20"},{"region":5,"region_name":"Cariboo","species":"Raven","management_units":"5-1 to 5-9, 5-12 to 5-15; private land only","weapon_type":"Rifle","bag_limit":"5","notes":"","class":"Any","season_text":"Mar 1 - Mar 31","season_open":"Mar 1","season_close":"Mar 31"},{"region":5,"region_name":"Cariboo","species":"Raven","management_units":"5-1 to 5-9, 5-12 to 5-15; private land only","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Apr 1 - May 31","season_open":"Apr 1","season_close":"May 31"},{"region":5,"region_name":"Cariboo","species":"Common Snipe","management_units":"5-1 to 5-15","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 13 - Dec 25","season_open":"Sept 13","season_close":"Dec 25"},{"region":5,"region_name":"Cariboo","species":"Coots","management_units":"5-1 to 5-15","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 13 - Dec 25","season_open":"Sept 13","season_close":"Dec 25"},{"region":5,"region_name":"Cariboo","species":"Ducks","management_units":"5-1 to 5-15","weapon_type":"Rifle","bag_limit":"8 (24)","notes":"","class":"Any","season_text":"Sept 13 - Dec 25","season_open":"Sept 13","season_close":"Dec 25"},{"region":5,"region_name":"Cariboo","species":"Geese: Snow & Ross's","management_units":"5-1 to 5-15","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 13 - Dec 25","season_open":"Sept 13","season_close":"Dec 25"},{"region":5,"region_name":"Cariboo","species":"Geese: White-Fronted","management_units":"5-1 to 5-15","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 13 - Dec 25","season_open":"Sept 13","season_close":"Dec 25"},{"region":5,"region_name":"Cariboo","species":"Geese: Canada & Cackling","management_units":"5-1 to 5-15","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 13 - Dec 25","season_open":"Sept 13","season_close":"Dec 25"},{"region":6,"region_name":"Skeena","species":"Mule Deer (Black-tailed)","management_units":"6-12, 6-13","weapon_type":"Rifle","bag_limit":"15 (15)","notes":"","class":"Bucks","season_text":"June 1 - Feb 28","season_open":"June 1","season_close":"Feb 28"},{"region":6,"region_name":"Skeena","species":"Mule Deer (Black-tailed)","management_units":"6-12, 6-13","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Antlerless","season_text":"Sept 1 - Feb 28","season_open":"Sept 1","season_close":"Feb 28"},{"region":6,"region_name":"Skeena","species":"Mule Deer (Black-tailed)","management_units":"6-1, 6-2, 6-4 to 6-9, 6-30","weapon_type":"Rifle","bag_limit":"Refer to Regional Bag Limits","notes":"","class":"4 Point Bucks","season_text":"Sept 10 - Sept 30","season_open":"Sept 10","season_close":"Sept 30"},{"region":6,"region_name":"Skeena","species":"Mule Deer (Black-tailed)","management_units":"6-3, 6-10, 6-11, 6-14, 6-15","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":6,"region_name":"Skeena","species":"Mule Deer (Black-tailed)","management_units":"6-1, 6-2, 6-4 to 6-9, 6-30","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Bucks","season_text":"Oct 1 - Oct 19","season_open":"Oct 1","season_close":"Oct 19"},{"region":6,"region_name":"Skeena","species":"Mule Deer (Black-tailed)","management_units":"6-7 to 6-9, 6-30","weapon_type":"Rifle","bag_limit":"","notes":"","class":"4 Point Bucks","season_text":"Oct 20 - Nov 30","season_open":"Oct 20","season_close":"Nov 30"},{"region":6,"region_name":"Skeena","species":"Mule Deer (Black-tailed)","management_units":"6-1, 6-2, 6-4 to 6-6","weapon_type":"Rifle","bag_limit":"","notes":"","class":"4 Point Bucks","season_text":"Oct 20 - Nov 15","season_open":"Oct 20","season_close":"Nov 15"},{"region":6,"region_name":"Skeena","species":"Mule Deer (Black-tailed)","management_units":"6-1 to 6-11, 6-14, 6-15, 6-30","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":6,"region_name":"Skeena","species":"Mule Deer (Black-tailed)","management_units":"6-3, 6-10, 6-11, 6-14, 6-15","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Dec 1 - Dec 10","season_open":"Dec 1","season_close":"Dec 10"},{"region":6,"region_name":"Skeena","species":"Mule Deer (Black-tailed)","management_units":"6-7 to 6-9, 6-30","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"4 Point Bucks","season_text":"Dec 1 - Dec 10","season_open":"Dec 1","season_close":"Dec 10"},{"region":6,"region_name":"Skeena","species":"Mule Deer (Black-tailed)","management_units":"6-10, 6-11, 6-14, 6-15","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Antlerless","season_text":"Dec 1 - Dec 10","season_open":"Dec 1","season_close":"Dec 10"},{"region":6,"region_name":"Skeena","species":"White-tailed Deer","management_units":"6-1 to 6-11, 6-14, 6-15, 6-30","weapon_type":"Rifle","bag_limit":"Refer to Regional Bag Limits","notes":"","class":"Bucks","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":6,"region_name":"Skeena","species":"White-tailed Deer","management_units":"6-1 to 6-11, 6-14, 6-15, 6-30","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":6,"region_name":"Skeena","species":"White-tailed Deer","management_units":"6-1 to 6-11, 6-14, 6-15, 6-30","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":6,"region_name":"Skeena","species":"White-tailed Deer","management_units":"6-3, 6-7 to 6-11, 6-14, 6-15, 6-30","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Either Sex","season_text":"Dec 1 - Dec 20","season_open":"Dec 1","season_close":"Dec 20"},{"region":6,"region_name":"Skeena","species":"Moose","management_units":"6-1, 6-2","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Bulls","season_text":"Oct 20 - Oct 22","season_open":"Oct 20","season_close":"Oct 22"},{"region":6,"region_name":"Skeena","species":"Moose","management_units":"6-17 to 6-29","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Bulls","season_text":"Aug 23 - Oct 31","season_open":"Aug 23","season_close":"Oct 31"},{"region":6,"region_name":"Skeena","species":"Moose","management_units":"6-28, 6-29","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Bulls+","season_text":"Sept 1 - Oct 31","season_open":"Sept 1","season_close":"Oct 31"},{"region":6,"region_name":"Skeena","species":"Moose","management_units":"6-1, 6-2","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bulls","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":6,"region_name":"Skeena","species":"Moose","management_units":"6-1, 6-2","weapon_type":"Bow Only","bag_limit":"","notes":"All individuals with a moose species licence must submit a Mandatory Hunter Report by January 15th. See page 16 for more details.","class":"Bulls","season_text":"Nov 16 - Nov 20","season_open":"Nov 16","season_close":"Nov 20"},{"region":6,"region_name":"Skeena","species":"Elk","management_units":"6-1, 6-2, 6-4 to 6-6, 6-8, 6-9","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"6 Point Bulls","season_text":"Oct 1 - Oct 9","season_open":"Oct 1","season_close":"Oct 9"},{"region":6,"region_name":"Skeena","species":"Elk","management_units":"6-13","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Bulls","season_text":"Sept 15 - Nov 15","season_open":"Sept 15","season_close":"Nov 15"},{"region":6,"region_name":"Skeena","species":"Elk","management_units":"6-13","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bulls","season_text":"Sept 1 - Sept 14","season_open":"Sept 1","season_close":"Sept 14"},{"region":6,"region_name":"Skeena","species":"Thinhorn Mountain Sheep","management_units":"6-17, 6-18 to 6-26, 6-27","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Full Curl Thinhorn Rams","season_text":"Aug 1 - Oct 15","season_open":"Aug 1","season_close":"Oct 15"},{"region":6,"region_name":"Skeena","species":"Mountain Goat","management_units":"6-7, 6-17 to 6-30","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Aug 1 - Oct 15","season_open":"Aug 1","season_close":"Oct 15"},{"region":6,"region_name":"Skeena","species":"Mountain Goat","management_units":"6-3, 6-11, 6-14 to 6-16, 6-9","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Aug 1 - Nov 15","season_open":"Aug 1","season_close":"Nov 15"},{"region":6,"region_name":"Skeena","species":"Mountain Goat","management_units":"6-14","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Aug 1 - Feb 28","season_open":"Aug 1","season_close":"Feb 28"},{"region":6,"region_name":"Skeena","species":"Black Bear","management_units":"6-1 to 6-11, 6-14 to 6-30","weapon_type":"Rifle","bag_limit":"2","notes":"","class":"Any","season_text":"Aug 15 - Nov 30","season_open":"Aug 15","season_close":"Nov 30"},{"region":6,"region_name":"Skeena","species":"Black Bear","management_units":"6-1 to 6-11, 6-14 to 6-30","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Apr 1 - June 30","season_open":"Apr 1","season_close":"June 30"},{"region":6,"region_name":"Skeena","species":"Wolf","management_units":"6-1 to 6-30","weapon_type":"Rifle","bag_limit":"3","notes":"","class":"Any","season_text":"Aug 1 - June 15","season_open":"Aug 1","season_close":"June 15"},{"region":6,"region_name":"Skeena","species":"Cougar","management_units":"6-1 to 6-11","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Sept 10 - Apr 30","season_open":"Sept 10","season_close":"Apr 30"},{"region":6,"region_name":"Skeena","species":"Coyote","management_units":"6-1 to 6-11, 6-14 to 6-30","weapon_type":"Rifle","bag_limit":"10","notes":"","class":"Any","season_text":"Sept 1 - Mar 31","season_open":"Sept 1","season_close":"Mar 31"},{"region":6,"region_name":"Skeena","species":"Wolverine","management_units":"6-1 to 6-11, 6-14 to 6-30","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Sept 15 - Feb 28","season_open":"Sept 15","season_close":"Feb 28"},{"region":6,"region_name":"Skeena","species":"Lynx","management_units":"6-1, 6-2, 6-4 to 6-9, 6-15 to 6-30","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Nov 15 - Feb 15","season_open":"Nov 15","season_close":"Feb 15"},{"region":6,"region_name":"Skeena","species":"Raccoon","management_units":"6-12, 6-13","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"No Closed Season","season_open":"No closed season","season_close":"No closed season"},{"region":6,"region_name":"Skeena","species":"Snowshoe Hare","management_units":"6-1 to 6-30","weapon_type":"Rifle","bag_limit":"10 (daily)","notes":"","class":"Any","season_text":"Aug 1 - Apr 30","season_open":"Aug 1","season_close":"Apr 30"},{"region":6,"region_name":"Skeena","species":"Grouse: Sooty/Dusky (Blue), Ruffed & Spruce","management_units":"6-1 to 6-11, 6-14 to 6-30","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 10 - Nov 15","season_open":"Sept 10","season_close":"Nov 15"},{"region":6,"region_name":"Skeena","species":"Grouse: Sooty/Dusky (Blue), Ruffed & Spruce","management_units":"6-12, 6-13","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 10 - Nov 15","season_open":"Sept 10","season_close":"Nov 15"},{"region":6,"region_name":"Skeena","species":"Grouse: Sooty/Dusky (Blue), Ruffed & Spruce","management_units":"6-1 to 6-11, 6-14 to 6-30","weapon_type":"Bow Only","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":6,"region_name":"Skeena","species":"Grouse: Sooty/Dusky (Blue), Ruffed & Spruce","management_units":"6-12, 6-13","weapon_type":"Bow Only","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":6,"region_name":"Skeena","species":"Ptarmigan","management_units":"6-1 to 6-6, 6-8 to 6-11, 6-15 and 6-30","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Aug 15 - Feb 28","season_open":"Aug 15","season_close":"Feb 28"},{"region":6,"region_name":"Skeena","species":"Ptarmigan","management_units":"6-7, 6-14, 6-16 to 6-29","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Aug 15 - Feb 28","season_open":"Aug 15","season_close":"Feb 28"},{"region":6,"region_name":"Skeena","species":"Common Snipe","management_units":"6-1, 6-2, 6-4 to 6-10, 6-15 to 6-30","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":6,"region_name":"Skeena","species":"Common Snipe","management_units":"6-3, 6-11 to 6-14","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Oct 1 - Jan 15","season_open":"Oct 1","season_close":"Jan 15"},{"region":6,"region_name":"Skeena","species":"Coots","management_units":"6-1, 6-2, 6-4 to 6-10, 6-15 to 6-30","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":6,"region_name":"Skeena","species":"Coots","management_units":"6-3, 6-11 to 6-14","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Oct 1 - Jan 15","season_open":"Oct 1","season_close":"Jan 15"},{"region":6,"region_name":"Skeena","species":"Ducks","management_units":"6-1, 6-2, 6-4 to 6-10, 6-15 to 6-30","weapon_type":"Rifle","bag_limit":"8 (24)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":6,"region_name":"Skeena","species":"Ducks","management_units":"6-3, 6-11 to 6-14","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Oct 1 - Jan 15","season_open":"Oct 1","season_close":"Jan 15"},{"region":6,"region_name":"Skeena","species":"Geese: Snow & Ross's","management_units":"6-1, 6-2, 6-4 to 6-10, 6-15 to 6-30","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":6,"region_name":"Skeena","species":"Geese: Snow & Ross's","management_units":"6-3, 6-11 to 6-14","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Oct 1 - Jan 15","season_open":"Oct 1","season_close":"Jan 15"},{"region":6,"region_name":"Skeena","species":"Geese: White-Fronted","management_units":"6-1, 6-2, 6-4 to 6-10, 6-15 to 6-30","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":6,"region_name":"Skeena","species":"Geese: White-Fronted","management_units":"6-3, 6-11 to 6-14","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Oct 1 - Jan 15","season_open":"Oct 1","season_close":"Jan 15"},{"region":6,"region_name":"Skeena","species":"Geese: Canada & Cackling","management_units":"6-1, 6-2, 6-4 to 6-10, 6-15 to 6-30","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":6,"region_name":"Skeena","species":"Geese: Canada & Cackling","management_units":"6-3, 6-11 to 6-14","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Oct 1 - Jan 15","season_open":"Oct 1","season_close":"Jan 15"},{"region":7,"region_name":"Omineca","species":"Mule Deer (Black-tailed)","management_units":"7-2 to 7-11, 7-15 to 7-18, 7-23, 7-26 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"Refer to Regional Bag Limits","notes":"","class":"Bucks","season_text":"Oct 1 - Oct 31","season_open":"Oct 1","season_close":"Oct 31"},{"region":7,"region_name":"Omineca","species":"Mule Deer (Black-tailed)","management_units":"7-12 to 7-14, 7-24, 7-25","weapon_type":"Rifle","bag_limit":"","notes":"","class":"4 Point Bucks","season_text":"Oct 1 - Nov 15","season_open":"Oct 1","season_close":"Nov 15"},{"region":7,"region_name":"Omineca","species":"Mule Deer (Black-tailed)","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"","notes":"","class":"4 Point Bucks","season_text":"Sept 10 - Sept 30","season_open":"Sept 10","season_close":"Sept 30"},{"region":7,"region_name":"Omineca","species":"Mule Deer (Black-tailed)","management_units":"7-2 to 7-11, 7-15 to 7-18, 7-23, 7-26 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"","notes":"","class":"4 Point Bucks","season_text":"Nov 1 - Nov 30","season_open":"Nov 1","season_close":"Nov 30"},{"region":7,"region_name":"Omineca","species":"Mule Deer (Black-tailed)","management_units":"7-2 to 7-11, 7-15 to 7-18, 7-23, 7-26 to 7-30, 7-37 to 7-41","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 10 - Sept 30","season_open":"Sept 10","season_close":"Sept 30"},{"region":7,"region_name":"Omineca","species":"Mule Deer (Black-tailed)","management_units":"7-12 to 7-14, 7-24, 7-25","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Either Sex","season_text":"Oct 1 - Oct 19","season_open":"Oct 1","season_close":"Oct 19"},{"region":7,"region_name":"Omineca","species":"Mule Deer (Black-tailed)","management_units":"7-12 to 7-14, 7-24, 7-25","weapon_type":"Youth Bow Only","bag_limit":"","notes":"","class":"Antlerless","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":7,"region_name":"Omineca","species":"Mule Deer (Black-tailed)","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":7,"region_name":"Omineca","species":"White-tailed Deer","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"Refer to Regional Bag Limits","notes":"","class":"Bucks","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":7,"region_name":"Omineca","species":"White-tailed Deer","management_units":"7-2 to 7-5, 7-7 to 7-10, 7-12, 7-13, 7-15, 7-17","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Antlerless","season_text":"Oct 10 - Oct 31","season_open":"Oct 10","season_close":"Oct 31"},{"region":7,"region_name":"Omineca","species":"White-tailed Deer","management_units":"7-2 to 7-5, 7-7 to 7-10, 7-12, 7-13, 7-15, 7-17","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Either Sex","season_text":"Nov 1 - Nov 30","season_open":"Nov 1","season_close":"Nov 30"},{"region":7,"region_name":"Omineca","species":"White-tailed Deer","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":7,"region_name":"Omineca","species":"White-tailed Deer","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":7,"region_name":"Omineca","species":"Moose","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-38","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Spike-fork Bulls","season_text":"Sept 10 - Nov 5","season_open":"Sept 10","season_close":"Nov 5"},{"region":7,"region_name":"Omineca","species":"Moose","management_units":"7-37, 7-39 to 7-41","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Spike-fork Bulls","season_text":"Aug 15 - Nov 5","season_open":"Aug 15","season_close":"Nov 5"},{"region":7,"region_name":"Omineca","species":"Moose","management_units":"7-2 to 7-15","weapon_type":"Bow Only","bag_limit":"","notes":"All individuals with a moose species licence must submit a Mandatory Hunter Report by January 15th. See page 16 for more details.","class":"Spike-fork Bulls","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":7,"region_name":"Omineca","species":"Elk","management_units":"7-37, 7-41","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"6 Point Bulls","season_text":"Aug 15 - Oct 31","season_open":"Aug 15","season_close":"Oct 31"},{"region":7,"region_name":"Omineca","species":"Elk","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-38 to 7-40","weapon_type":"Rifle","bag_limit":"","notes":"","class":"6 Point Bulls","season_text":"Sept 10 - Oct 9","season_open":"Sept 10","season_close":"Oct 9"},{"region":7,"region_name":"Omineca","species":"Elk","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-38 to 7-40","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"6 Point Bulls","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":7,"region_name":"Omineca","species":"Bighorn Mountain Sheep","management_units":"7-18","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Full Curl Bighorn Rams","season_text":"Aug 15 - Sept 30","season_open":"Aug 15","season_close":"Sept 30"},{"region":7,"region_name":"Omineca","species":"Thinhorn Mountain Sheep","management_units":"7-37, 7-39 to 7-41","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Full Curl Thinhorn Rams","season_text":"Aug 1 - Oct 15","season_open":"Aug 1","season_close":"Oct 15"},{"region":7,"region_name":"Omineca","species":"Mountain Goat","management_units":"7-3 to 7-5, 7-17, 7-18, 7-27 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Aug 15 - Oct 15","season_open":"Aug 15","season_close":"Oct 15"},{"region":7,"region_name":"Omineca","species":"Black Bear","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"2","notes":"","class":"Any","season_text":"Aug 15 - Nov 15","season_open":"Aug 15","season_close":"Nov 15"},{"region":7,"region_name":"Omineca","species":"Black Bear","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Apr 1 - June 30","season_open":"Apr 1","season_close":"June 30"},{"region":7,"region_name":"Omineca","species":"Wolf","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"Aug 1 - June 30","season_open":"Aug 1","season_close":"June 30"},{"region":7,"region_name":"Omineca","species":"Cougar","management_units":"7-2 to 7-8, 7-16 to 7-18, 7-23","weapon_type":"Rifle","bag_limit":"2","notes":"","class":"Any","season_text":"Sept 10 - Mar 31","season_open":"Sept 10","season_close":"Mar 31"},{"region":7,"region_name":"Omineca","species":"Cougar","management_units":"7-9 to 7-15, 7-24, 7-25","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Sept 10 - Mar 31","season_open":"Sept 10","season_close":"Mar 31"},{"region":7,"region_name":"Omineca","species":"Coyote","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"Sept 1 - Mar 31","season_open":"Sept 1","season_close":"Mar 31"},{"region":7,"region_name":"Omineca","species":"Wolverine","management_units":"7-3, 7-17, 7-18, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Oct 15 - Jan 15","season_open":"Oct 15","season_close":"Jan 15"},{"region":7,"region_name":"Omineca","species":"Lynx","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Nov 1 - Feb 15","season_open":"Nov 1","season_close":"Feb 15"},{"region":7,"region_name":"Omineca","species":"Raccoon","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"Apr 1-Mar 31","season_open":"Apr 1","season_close":"Mar 31"},{"region":7,"region_name":"Omineca","species":"Snowshoe Hare","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"10 (daily)","notes":"","class":"Any","season_text":"Aug 1 - Apr 30","season_open":"Aug 1","season_close":"Apr 30"},{"region":7,"region_name":"Omineca","species":"Columbian Ground Squirrel","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"No Closed Season","season_open":"No closed season","season_close":"No closed season"},{"region":7,"region_name":"Omineca","species":"Dusky (Blue) Grouse","management_units":"7-2 to 7-7, 7-17, 7-18, 7-23, 7-27, 7-28, 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 1 - Nov 15","season_open":"Sept 1","season_close":"Nov 15"},{"region":7,"region_name":"Omineca","species":"Spruce & Ruffed Grouse","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 1 - Nov 15","season_open":"Sept 1","season_close":"Nov 15"},{"region":7,"region_name":"Omineca","species":"Ptarmigan","management_units":"7-2 to 7-6, 7-17, 7-18, 7-23, 7-27 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Aug 15 - Feb 28","season_open":"Aug 15","season_close":"Feb 28"},{"region":7,"region_name":"Omineca","species":"Common Snipe","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":7,"region_name":"Omineca","species":"Coots","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":7,"region_name":"Omineca","species":"Ducks","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"8 (24)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":7,"region_name":"Omineca","species":"Geese: Snow & Ross's","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":7,"region_name":"Omineca","species":"Geese: White-Fronted","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":7,"region_name":"Omineca","species":"Geese: Canada & Cackling","management_units":"7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":7,"region_name":"Peace","species":"Mule Deer (Black-tailed)","management_units":"7-19, 7-36, 7-42, 7-43, 7-48 to 7-52, 7-57, 7-58","weapon_type":"Rifle","bag_limit":"Refer to Regional Bag Limits","notes":"","class":"4 Point Bucks","season_text":"Sept 10 - Oct 5","season_open":"Sept 10","season_close":"Oct 5"},{"region":7,"region_name":"Peace","species":"Mule Deer (Black-tailed)","management_units":"7-20 to 7-22, 7-31 to 7-35, 7-43 to 7-47, 7-54","weapon_type":"Rifle","bag_limit":"","notes":"","class":"4 Point Bucks","season_text":"Nov 1 - Nov 30","season_open":"Nov 1","season_close":"Nov 30"},{"region":7,"region_name":"Peace","species":"Mule Deer (Black-tailed)","management_units":"7-20, 7-21, 7-32 to 7-35, 7-44 to 7-47","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 30","season_open":"Sept 1","season_close":"Sept 30"},{"region":7,"region_name":"Peace","species":"White-tailed Deer","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-50, 7-54 to 7-58","weapon_type":"Rifle","bag_limit":"Refer to Regional Bag Limits","notes":"","class":"Bucks","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":7,"region_name":"Peace","species":"White-tailed Deer","management_units":"7-20*, 7-21*, 7-32, 7-33, 7-34, 7-35*, 7-45*, 7-46*","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Antlerless","season_text":"Oct 10 - Oct 31","season_open":"Oct 10","season_close":"Oct 31"},{"region":7,"region_name":"Peace","species":"White-tailed Deer","management_units":"7-20*, 7-21*, 7-32, 7-33, 7-34, 7-35*, 7-45*, 7-46*","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Either Sex","season_text":"Nov 1 - Nov 30","season_open":"Nov 1","season_close":"Nov 30"},{"region":7,"region_name":"Peace","species":"White-tailed Deer","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-50, 7-54 to 7-58","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":7,"region_name":"Peace","species":"White-tailed Deer","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-50, 7-54 to 7-58","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":7,"region_name":"Peace","species":"Moose","management_units":"7-19 to 7-22, 7-31, 7-33, 7-35, 7-46 to 7-49, 7-55","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Restricted Bulls","season_text":"Oct 25 - Oct 26 / Nov 10 - Nov 11","season_open":"Oct 25","season_close":"Oct 26"},{"region":7,"region_name":"Peace","species":"Moose","management_units":"7-36, 7-42, 7-43, 7-50, 7-51, 7-52 to 7-54, 7-57","weapon_type":"Rifle","bag_limit":"","notes":"All individuals with a moose species licence must submit a Mandatory Hunter Report by January 15th. See page 16 for more details.","class":"Restricted Bulls","season_text":"Sept 1 - Sept 30 / Oct 16 - Oct 31","season_open":"Sept 1","season_close":"Sept 30"},{"region":7,"region_name":"Peace","species":"Elk","management_units":"7-42, 7-57","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"6 Point Bulls","season_text":"Aug 15 - Oct 31","season_open":"Aug 15","season_close":"Oct 31"},{"region":7,"region_name":"Peace","species":"Elk","management_units":"7-42, 7-49, 7-50","weapon_type":"Rifle","bag_limit":"","notes":"","class":"3 Point Bulls","season_text":"Aug 15 - Sept 9","season_open":"Aug 15","season_close":"Sept 9"},{"region":7,"region_name":"Peace","species":"Elk","management_units":"7-42, 7-48, 7-49, 7-50","weapon_type":"Rifle","bag_limit":"","notes":"","class":"6 Point Bulls","season_text":"Sept 10 - Oct 31","season_open":"Sept 10","season_close":"Oct 31"},{"region":7,"region_name":"Peace","species":"Elk","management_units":"7-51 to 7-54","weapon_type":"Rifle","bag_limit":"","notes":"","class":"6 Point Bulls","season_text":"Sept 5 - Sept 15","season_open":"Sept 5","season_close":"Sept 15"},{"region":7,"region_name":"Peace","species":"Elk","management_units":"7-19,7-20, 7-21, 7-22, 7-31, 7-36, 7-43","weapon_type":"Rifle","bag_limit":"","notes":"","class":"6 Point Bulls","season_text":"Sept 1 - Oct 31","season_open":"Sept 1","season_close":"Oct 31"},{"region":7,"region_name":"Peace","species":"Elk","management_units":"7-20, 7-21, 7-32 to 7-35, 7-43, 7-44, 7-45, 7-46, 7-58","weapon_type":"Rifle","bag_limit":"","notes":"","class":"3 Point Bulls","season_text":"Sept 1 - Oct 31","season_open":"Sept 1","season_close":"Oct 31"},{"region":7,"region_name":"Peace","species":"Elk","management_units":"7-20, 7-21, 7-32 to 7-35, 7-43, 7-44, 7-45, 7-46","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Antlerless","season_text":"Sept 15 - Oct 15","season_open":"Sept 15","season_close":"Oct 15"},{"region":7,"region_name":"Peace","species":"Elk","management_units":"7-58","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Antlerless","season_text":"Sept 15 - Oct 31","season_open":"Sept 15","season_close":"Oct 31"},{"region":7,"region_name":"Peace","species":"Elk","management_units":"7-50","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"3 Point Bulls","season_text":"Sept 10 - Oct 31","season_open":"Sept 10","season_close":"Oct 31"},{"region":7,"region_name":"Peace","species":"Bighorn Mountain Sheep","management_units":"7-19","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Full Curl Bighorn Rams","season_text":"Aug 15 - Sept 30","season_open":"Aug 15","season_close":"Sept 30"},{"region":7,"region_name":"Peace","species":"Thinhorn Mountain Sheep","management_units":"7-36, 7-42, 7-43, 7-50, 7-51, 7-52, 7-54, 7-57","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Full Curl Thinhorn Rams","season_text":"Aug 1 - Oct 15","season_open":"Aug 1","season_close":"Oct 15"},{"region":7,"region_name":"Peace","species":"Mountain Goat","management_units":"7-36, 7-42, 7-43, 7-50, 7-51, 7-52, 7-54, 7-57","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Aug 25 - Oct 15","season_open":"Aug 25","season_close":"Oct 15"},{"region":7,"region_name":"Peace","species":"Bison","management_units":"7-42, 7-57, 7-58","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Either Sex","season_text":"Sept 1 - Jan 31","season_open":"Sept 1","season_close":"Jan 31"},{"region":7,"region_name":"Peace","species":"Black Bear","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-58","weapon_type":"Rifle","bag_limit":"2","notes":"","class":"Any","season_text":"Aug 15 - Nov 15","season_open":"Aug 15","season_close":"Nov 15"},{"region":7,"region_name":"Peace","species":"Black Bear","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-58","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Apr 1 - June 30","season_open":"Apr 1","season_close":"June 30"},{"region":7,"region_name":"Peace","species":"Wolf","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-58","weapon_type":"Rifle","bag_limit":"3","notes":"","class":"Any","season_text":"Aug 1 - Mar 31","season_open":"Aug 1","season_close":"Mar 31"},{"region":7,"region_name":"Peace","species":"Wolf","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-58","weapon_type":"Rifle","bag_limit":"","notes":"t No closed season below 1100 m elevation.","class":"Any","season_text":"Apr 1 - June 15","season_open":"Apr 1","season_close":"June 15"},{"region":7,"region_name":"Peace","species":"Cougar","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-58","weapon_type":"Rifle","bag_limit":"2","notes":"","class":"Any","season_text":"Sept 10 - Mar 31","season_open":"Sept 10","season_close":"Mar 31"},{"region":7,"region_name":"Peace","species":"Coyote","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-58","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"Sept 1 - Mar 31","season_open":"Sept 1","season_close":"Mar 31"},{"region":7,"region_name":"Peace","species":"Wolverine","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42, 7-43, 7-47 to 7-58","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Oct 15 - Jan 15","season_open":"Oct 15","season_close":"Jan 15"},{"region":7,"region_name":"Peace","species":"Lynx","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-58","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Nov 15 - Feb 15","season_open":"Nov 15","season_close":"Feb 15"},{"region":7,"region_name":"Peace","species":"Snowshoe Hare","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-58","weapon_type":"Rifle","bag_limit":"10 (daily)","notes":"","class":"Any","season_text":"Aug 1 - Apr 30","season_open":"Aug 1","season_close":"Apr 30"},{"region":7,"region_name":"Peace","species":"Dusky (Blue) Grouse","management_units":"7-21, 7-22, 7-31, 7-36, 7-42, 7-43, 7-50 to 7-52, 7-54, 7-57, 7-58","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 1 - Nov 15","season_open":"Sept 1","season_close":"Nov 15"},{"region":7,"region_name":"Peace","species":"Spruce & Ruffed Grouse","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-58","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 1 - Nov 15","season_open":"Sept 1","season_close":"Nov 15"},{"region":7,"region_name":"Peace","species":"Sharp-Tailed Grouse","management_units":"7-20 to 7-22, 7-32 to 7-35, 7-44 to 7-49, 7-52 to 7-56, 7-58","weapon_type":"Rifle","bag_limit":"3 (6)","notes":"","class":"Any","season_text":"Sept 1 - Nov 15","season_open":"Sept 1","season_close":"Nov 15"},{"region":7,"region_name":"Peace","species":"Ptarmigan","management_units":"7-19, 7-21,7-22, 7-31, 7-36, 7-42,7-43, 7-50 to 7-55, 7-57","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Aug 15 - Feb 28","season_open":"Aug 15","season_close":"Feb 28"},{"region":7,"region_name":"Peace","species":"Raven","management_units":"7-20, 7-21, 7-32 to 7-35, 7-45, 7-46","weapon_type":"Rifle","bag_limit":"5","notes":"","class":"Any","season_text":"No Closed Season","season_open":"No closed season","season_close":"No closed season"},{"region":7,"region_name":"Peace","species":"Common Snipe","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-58","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":7,"region_name":"Peace","species":"Coots","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-58","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":7,"region_name":"Peace","species":"Ducks","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-58","weapon_type":"Rifle","bag_limit":"8 (24)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":7,"region_name":"Peace","species":"Geese: Snow & Ross's","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-58","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":7,"region_name":"Peace","species":"Geese: White-Fronted","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-58","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":7,"region_name":"Peace","species":"Geese: Canada & Cackling","management_units":"7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-58","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":7,"region_name":"Peace","species":"Geese: Canada & Cackling","management_units":"7-20","weapon_type":"Rifle","bag_limit":"","notes":"","class":"No Shooting Area","season_text":"(MU 7-20), from June 1 - Oct 15.","season_open":"(MU 7-20), from June 1 - Oct 15.","season_close":""},{"region":8,"region_name":"Okanagan","species":"Mule Deer (Black-tailed)","management_units":"8-1 to 8-11, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"Refer to Regional Bag Limits","notes":"","class":"4 Point Bucks","season_text":"Sept 10 - Sept 30","season_open":"Sept 10","season_close":"Sept 30"},{"region":8,"region_name":"Okanagan","species":"Mule Deer (Black-tailed)","management_units":"8-12 to 8-15","weapon_type":"Rifle","bag_limit":"","notes":"","class":"4 Point Bucks","season_text":"Sept 10 - Nov 10","season_open":"Sept 10","season_close":"Nov 10"},{"region":8,"region_name":"Okanagan","species":"Mule Deer (Black-tailed)","management_units":"8-1 to 8-11, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Bucks","season_text":"Oct 1 - Oct 31","season_open":"Oct 1","season_close":"Oct 31"},{"region":8,"region_name":"Okanagan","species":"Mule Deer (Black-tailed)","management_units":"8-1 to 8-11, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"","notes":"","class":"4 Point Bucks","season_text":"Nov 1 - Nov 10","season_open":"Nov 1","season_close":"Nov 10"},{"region":8,"region_name":"Okanagan","species":"Mule Deer (Black-tailed)","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 30","season_open":"Sept 1","season_close":"Sept 30"},{"region":8,"region_name":"Okanagan","species":"Mule Deer (Black-tailed)","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":8,"region_name":"Okanagan","species":"White-tailed Deer","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"Refer to Regional Bag Limits","notes":"","class":"Bucks","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":8,"region_name":"Okanagan","species":"White-tailed Deer","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Antlerless","season_text":"Oct 10 - Oct 31","season_open":"Oct 10","season_close":"Oct 31"},{"region":8,"region_name":"Okanagan","species":"White-tailed Deer","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":8,"region_name":"Okanagan","species":"White-tailed Deer","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Either Sex","season_text":"Nov 1 - Nov 30","season_open":"Nov 1","season_close":"Nov 30"},{"region":8,"region_name":"Okanagan","species":"White-tailed Deer","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Bucks","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":8,"region_name":"Okanagan","species":"White-tailed Deer","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Either Sex","season_text":"Dec 1 - Dec 20","season_open":"Dec 1","season_close":"Dec 20"},{"region":8,"region_name":"Okanagan","species":"Moose","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Spike-fork Bulls","season_text":"Nov 1 - Nov 15","season_open":"Nov 1","season_close":"Nov 15"},{"region":8,"region_name":"Okanagan","species":"Elk","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"6 Point Bulls","season_text":"Sept 10 - Oct 20","season_open":"Sept 10","season_close":"Oct 20"},{"region":8,"region_name":"Okanagan","species":"Elk","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"6 Point Bulls","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":8,"region_name":"Okanagan","species":"Black Bear","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"2","notes":"","class":"Any","season_text":"Apr 1 - June 30","season_open":"Apr 1","season_close":"June 30"},{"region":8,"region_name":"Okanagan","species":"Black Bear","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Aug 1 - Aug 31","season_open":"Aug 1","season_close":"Aug 31"},{"region":8,"region_name":"Okanagan","species":"Black Bear","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Sept 1 - Nov 30","season_open":"Sept 1","season_close":"Nov 30"},{"region":8,"region_name":"Okanagan","species":"Wolf","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"3","notes":"","class":"Any","season_text":"Apr 1 - June 15","season_open":"Apr 1","season_close":"June 15"},{"region":8,"region_name":"Okanagan","species":"Coyote","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"Sept 1 - June 30","season_open":"Sept 1","season_close":"June 30"},{"region":8,"region_name":"Okanagan","species":"Bobcat","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Nov 15 - Feb 28","season_open":"Nov 15","season_close":"Feb 28"},{"region":8,"region_name":"Okanagan","species":"Lynx","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Nov 15 - Feb 28","season_open":"Nov 15","season_close":"Feb 28"},{"region":8,"region_name":"Okanagan","species":"Cougar","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Any","season_text":"Nov 15 - Mar 31","season_open":"Nov 15","season_close":"Mar 31"},{"region":8,"region_name":"Okanagan","species":"Skunk, Raccoon","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"NBL","notes":"","class":"Any","season_text":"No Closed Season","season_open":"No closed season","season_close":"No closed season"},{"region":8,"region_name":"Okanagan","species":"Snowshoe Hare","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"10 (daily)","notes":"","class":"Any","season_text":"Aug 1 - Apr 30","season_open":"Aug 1","season_close":"Apr 30"},{"region":8,"region_name":"Okanagan","species":"Grouse: Dusky (Blue), Ruffed & Spruce","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 10 - Nov 30","season_open":"Sept 10","season_close":"Nov 30"},{"region":8,"region_name":"Okanagan","species":"Grouse: Dusky (Blue), Ruffed & Spruce","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Youth Only","bag_limit":"","notes":"","class":"Any","season_text":"Sept 1 - Sept 9","season_open":"Sept 1","season_close":"Sept 9"},{"region":8,"region_name":"Okanagan","species":"Grouse: Dusky (Blue), Ruffed & Spruce","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Bow Only","bag_limit":"","notes":"","class":"Any","season_text":"Dec 1 - Dec 10","season_open":"Dec 1","season_close":"Dec 10"},{"region":8,"region_name":"Okanagan","species":"Chukar Partridge","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Oct 1 - Nov 30","season_open":"Oct 1","season_close":"Nov 30"},{"region":8,"region_name":"Okanagan","species":"Gray (Hungarian) Partridge","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"3 (9)","notes":"","class":"Any","season_text":"Oct 1 - Nov 30","season_open":"Oct 1","season_close":"Nov 30"},{"region":8,"region_name":"Okanagan","species":"Pheasant (Cocks)","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"2 (6)","notes":"","class":"Any","season_text":"Oct 1 - Nov 30","season_open":"Oct 1","season_close":"Nov 30"},{"region":8,"region_name":"Okanagan","species":"Quail","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Oct 1 - Nov 30","season_open":"Oct 1","season_close":"Nov 30"},{"region":8,"region_name":"Okanagan","species":"Turkey","management_units":"8-1, 8-9, 8-10, 8-12, 8-14, 8-15, 8-22, 8-26","weapon_type":"Rifle","bag_limit":"1","notes":"","class":"Bearded","season_text":"Apr 15 - May 15","season_open":"Apr 15","season_close":"May 15"},{"region":8,"region_name":"Okanagan","species":"Turkey","management_units":"8-10, 8-12, 8-14, 8-15, 8-22, 8-26","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any Turkey","season_text":"Oct 1 - Oct 15","season_open":"Oct 1","season_close":"Oct 15"},{"region":8,"region_name":"Okanagan","species":"Turkey","management_units":"8-1, 8-9","weapon_type":"Rifle","bag_limit":"","notes":"The aggregate regional bag limit is 2 and only one turkey may be taken in each of the spring and fall.","class":"Any Turkey","season_text":"Oct 1 - Nov 30","season_open":"Oct 1","season_close":"Nov 30"},{"region":8,"region_name":"Okanagan","species":"Dove: Mourning, Eurasian Collared","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 1 - Sept 30","season_open":"Sept 1","season_close":"Sept 30"},{"region":8,"region_name":"Okanagan","species":"Common Snipe","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 23 - Jan 7","season_open":"Sept 23","season_close":"Jan 7"},{"region":8,"region_name":"Okanagan","species":"Coots","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 23 - Jan 7","season_open":"Sept 23","season_close":"Jan 7"},{"region":8,"region_name":"Okanagan","species":"Ducks","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"8 (24)","notes":"","class":"Any","season_text":"Sept 23 - Jan 7","season_open":"Sept 23","season_close":"Jan 7"},{"region":8,"region_name":"Okanagan","species":"Geese: Snow & Ross's","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 23 - Jan 7","season_open":"Sept 23","season_close":"Jan 7"},{"region":8,"region_name":"Okanagan","species":"Geese: White-Fronted","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"5 (15)","notes":"","class":"Any","season_text":"Sept 23 - Jan 7","season_open":"Sept 23","season_close":"Jan 7"},{"region":8,"region_name":"Okanagan","species":"Geese: Canada & Cackling","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"10 (30)","notes":"","class":"Any","season_text":"Sept 20 - Nov 28","season_open":"Sept 20","season_close":"Nov 28"},{"region":8,"region_name":"Okanagan","species":"Geese: Canada & Cackling","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Dec 20 - Jan 5","season_open":"Dec 20","season_close":"Jan 5"},{"region":8,"region_name":"Okanagan","species":"Geese: Canada & Cackling","management_units":"8-1 to 8-15, 8-21 to 8-26","weapon_type":"Rifle","bag_limit":"","notes":"","class":"Any","season_text":"Feb 21 - Mar 10","season_open":"Feb 21","season_close":"Mar 10"}];


const OS_REGION_LABELS = {
  '1':'Region 1 – Vancouver Island',
  '2':'Region 2 – Lower Mainland',
  '3':'Region 3 – Thompson',
  '4':'Region 4 – Kootenay',
  '5':'Region 5 – Cariboo',
  '6':'Region 6 – Skeena',
  '7A':'Region 7A – Omineca',
  '7B':'Region 7B – Peace',
  '8':'Region 8 – Okanagan'
};

const OS_REGION_COLORS = {
  '1':'#4a8f5a','2':'#6aab76','3':'#9bc46a','4':'#c49a35',
  '5':'#c06828','6':'#7a8fd4','7A':'#7b5fb3','7B':'#a064c8','8':'#5ab8c4'
};

const OS_MAP_STYLES = {
  streets:   'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  topo:      'mapbox://styles/mapbox/outdoors-v12'
};

const OS_BIG_ORDER = [
  'Mule Deer (Black-tailed)','White-tailed Deer','Deer','Fallow Deer','Moose','Elk','Caribou','Bison',
  'Bighorn Mountain Sheep','Thinhorn Mountain Sheep','Mountain Sheep','Mountain Goat','Black Bear','Grizzly Bear',
  'Cougar','Wolf','Coyote','Bobcat','Lynx','Wolverine'
];
const OS_BIG_GAME = new Set(OS_BIG_ORDER);

const OS_WMU_SRC = 'os-wmu-src';
const OS_REGION_SRC = 'os-region-src';
const OS_WMU_FILL = 'os-wmu-fill';
const OS_WMU_LINE = 'os-wmu-line';
const OS_REGION_FILL = 'os-region-fill';
const OS_REGION_LINE = 'os-region-line';
const OS_REGION_HIT = 'os-region-hit';

let osSelectedRegion = null;       // '3'
let osSelectedWMU = null;          // '3-32'
let osSelSpecies = '';             // broad species selected from side panel or dropdown
let osSelMonth = '';               // optional only — default is all dates
let osSelMethod = '';              // optional only
let osSelectedOpportunity = '';    // exact species/class/method/date key from the right panel
let osMapInitialized = false;
let osMapInstance = null;
let osMapStyle = 'streets';
let osTerrain3D = false;
let osHoveredWMU = null;
let osHoveredRegion = null;
let osOverlayVisibility = 1;
let osIsFullscreen = false;

// Build a cleaned, usable data set from the parser output.
const BC_OS_DATA = BC_OS_DATA_RAW.map(osSanitizeRow).filter(osValidRow);

function osClean(s) {
  return String(s || '')
    .replace(/[\u0000-\u001f]/g, ' ')
    .replace(/^[\]\[\*\+\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function osEscape(s) {
  return String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function osJsArg(s) { return osEscape(JSON.stringify(String(s || ''))); }
function osNormalizeWMU(mu) {
  return String(mu || '').replace(/[\*\+]+$/,'').trim().replace(/^(\d+)\s*-\s*0*(\d+)$/, '$1-$2');
}
let OS_WMU_REGION_INDEX = null;
function osRegionKeyFromWMUID(id) {
  const m = String(id || '').match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) return '';
  const reg = parseInt(m[1], 10);
  const unit = parseInt(m[2], 10);

  // The synopsis splits numeric Region 7 into regulatory Region 7A and 7B.
  // Do this explicitly instead of trusting GeoJSON region IDs, because many
  // WMU files only store REGION_RESPONSIBLE_ID as "7" for both Omineca/Peace.
  // 7A: 7-1 to 7-18, 7-23 to 7-30, 7-37 to 7-41
  // 7B: 7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-58
  if (reg === 7) {
    if ((unit >= 1 && unit <= 18) || (unit >= 23 && unit <= 30) || (unit >= 37 && unit <= 41)) return '7A';
    if ((unit >= 19 && unit <= 22) || (unit >= 31 && unit <= 36) || (unit >= 42 && unit <= 58)) return '7B';
    return '7';
  }
  return String(reg);
}
function osBuildWMURegionIndex() {
  if (OS_WMU_REGION_INDEX) return OS_WMU_REGION_INDEX;
  OS_WMU_REGION_INDEX = {};
  const geo = (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON);
  (geo?.features || []).forEach(f => {
    const id = osNormalizeWMU(f.properties?.wmu_id || f.properties?.WMUNIT_NUM || '');
    if (!id) return;
    let rid = String(f.properties?.REGION_RESPONSIBLE_ID || '').trim().toUpperCase();
    const derived = osRegionKeyFromWMUID(id);
    if (!rid || rid === '7') rid = derived;
    OS_WMU_REGION_INDEX[id] = rid || derived || String(id).split('-')[0] || '';
  });
  return OS_WMU_REGION_INDEX;
}
function osWMURegion(wmu) {
  const id = osNormalizeWMU(wmu);
  const derived = osRegionKeyFromWMUID(id);
  if (derived === '7A' || derived === '7B') return derived;
  const index = osBuildWMURegionIndex();
  return String(index[id] || derived || id.split('-')[0] || '');
}
function osRegionNumberFromKey(key) {
  const m = String(key || '').match(/^\d+/);
  return m ? parseInt(m[0], 10) : null;
}
function osRegionName(key) { return OS_REGION_LABELS[String(key)] || ('Region ' + key); }
function osRegionColor(key) { return OS_REGION_COLORS[String(key)] || '#5cb86a'; }
function osRegionSortValue(key) {
  const s = String(key || '');
  const n = parseInt(s, 10);
  if (s === '7A') return 7.1;
  if (s === '7B') return 7.2;
  return Number.isFinite(n) ? n : 99;
}

function osSanitizeRow(row) {
  const r = { ...row };
  const rawWeapon = osClean(r.weapon_type || '');
  const rawBag = osClean(r.bag_limit || '');
  const rawClass = osClean(r.class || '');
  const rawCombined = `${rawWeapon} ${rawBag} ${rawClass} ${osClean(r.notes || '')}`;

  r.region = parseInt(String(r.region || '').replace(/\D+$/,''), 10);
  r.region_name = osClean(r.region_name);
  r.species = osClean(r.species);
  r.management_units = osClean(r.management_units);
  r.bag_limit = rawBag;
  r.notes = osClean(r.notes);
  r.class = rawClass || 'Any';
  r.season_text = osClean(r.season_text || ((r.season_open || '') + (r.season_close ? ' - ' + r.season_close : '')));
  r.season_open = osClean(r.season_open || r.season_text);
  r.season_close = osClean(r.season_close || '');

  // Common PDF/OCR fragment repairs from the synopsis tables.
  const lc = r.class.toLowerCase();
  if (lc === 'cks') r.class = 'Bucks';
  if (lc === 'lls') r.class = 'Bulls';
  if (lc === 'ws') r.class = 'Ewes';
  if (lc === 'rs') r.class = 'Rams';
  if (lc === 'erless') r.class = 'Antlerless';
  if (/^either\s+sex$/i.test(r.class)) r.class = 'Either Sex';
  if (/^any\s+turkey$/i.test(r.class)) r.class = 'Any Turkey';

  if (/youth\s+bow\s+only|youth\s+archery/i.test(rawCombined)) r.weapon_type = 'Youth Bow Only';
  else if (/bow\s+only|archery/i.test(rawCombined)) r.weapon_type = 'Bow Only';
  else if (/youth\s+only/i.test(rawCombined)) r.weapon_type = 'Youth Only';
  else if (/shotgun/i.test(rawCombined)) r.weapon_type = 'Shotgun';
  else r.weapon_type = rawWeapon || 'Rifle';

  if (/ow only/i.test(r.bag_limit) || /youth bow only/i.test(r.bag_limit) || /bow only/i.test(r.bag_limit)) r.bag_limit = '';
  if (/^refer to$/i.test(r.bag_limit)) r.bag_limit = 'Refer to synopsis';
  if (/^nbl$/i.test(r.bag_limit)) r.bag_limit = 'NBL';

  return r;
}
function osValidRow(r) {
  if (!r || !Number.isFinite(r.region) || r.region < 1 || r.region > 8 || !r.species) return false;
  const blob = [r.species, r.management_units, r.class, r.weapon_type, r.bag_limit, r.notes, r.season_text, r.season_open, r.season_close]
    .map(x => String(x || '')).join(' ').toLowerCase();

  // Region 6 caribou GOS rows in the parsed source are not real open-season rows.
  // The 2024-2026 Region 6 synopsis notes that caribou general open seasons were replaced by LEH,
  // and the extracted fragments here came from nearby goat/MVP notes such as Telkwa River/Meat Cache.
  if (r.region === 6 && /caribou/i.test(r.species)) return false;

  // Parser sometimes pulled map notes / access notes as fake species rows.
  if (/motor vehicle prohibition|shooting area|meat cache|grizzly plateau|telkwa river|mountain goats only|billy \(male\)/i.test(blob)) return false;
  if (!osParseMUs(r.management_units).length) return false;
  if (!r.season_text && !r.season_open) return false;
  // Parser sometimes pulled note sentences as fake season rows.
  if (/season restricted to hunters/i.test(r.season_text) && !osMonthNum(r.season_text)) return false;
  return true;
}

function osParseMUs(text) {
  const out = new Set();
  let s = String(text || '')
    .replace(/\([^)]*portion[^)]*\)/ig, '')
    .replace(/[\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ');

  // Ranges: 8-1 to 8-15, 8-21 to 8-26
  s = s.replace(/(\d+)\s*-\s*0*(\d+)\s+to\s+\d+\s*-\s*0*(\d+)/gi, (m, reg, a, b) => {
    const start = parseInt(a, 10), end = parseInt(b, 10), region = parseInt(reg, 10);
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start && end - start < 90) {
      for (let i = start; i <= end; i++) out.add(`${region}-${i}`);
    }
    return ' ';
  });

  let m;
  const singleRe = /\b(\d+)\s*-\s*0*(\d+)\b/g;
  while ((m = singleRe.exec(s)) !== null) out.add(`${parseInt(m[1],10)}-${parseInt(m[2],10)}`);
  return [...out];
}
function osRowAppliesToWMU(row, wmu) {
  const id = osNormalizeWMU(wmu);
  return osParseMUs(row.management_units).includes(id);
}
function osMonthNum(txt) {
  const s = String(txt || '').toLowerCase();
  const names = [['jan',1],['feb',2],['mar',3],['apr',4],['may',5],['jun',6],['jul',7],['aug',8],['sept',9],['sep',9],['oct',10],['nov',11],['dec',12]];
  for (const [name,n] of names) if (s.includes(name)) return n;
  return null;
}
function osRowInMonth(row, month) {
  if (!month) return true;
  if (/no closed/i.test(row.season_text || row.season_open || '')) return true;
  const open = osMonthNum(row.season_open || row.season_text);
  const close = osMonthNum(row.season_close || row.season_text);
  if (!open || !close) return true;
  const n = parseInt(month, 10);
  return open <= close ? (n >= open && n <= close) : (n >= open || n <= close);
}
function osSeasonText(row) {
  if (/no closed/i.test(row.season_text || row.season_open || '')) return 'No closed season';
  if (row.season_text && row.season_text.includes('/')) return row.season_text;
  const a = row.season_open || '';
  const b = row.season_close || '';
  return b ? `${a} – ${b}` : (row.season_text || a || '—');
}
function osOpportunityKey(row) {
  return [row.species, row.class || 'Any', row.weapon_type || 'Rifle', osSeasonText(row)].join('|||');
}
function osOpportunityLabel(key) {
  const p = String(key || '').split('|||');
  return { species:p[0] || '', cls:p[1] || '', method:p[2] || '', season:p[3] || '' };
}
function osRowsSameOpportunity(row, key) { return osOpportunityKey(row) === key; }
function osSortRows(rows) {
  return (rows || []).slice().sort((a,b) =>
    String(a.species).localeCompare(String(b.species)) ||
    String(a.class).localeCompare(String(b.class), undefined, { numeric:true }) ||
    osSeasonText(a).localeCompare(osSeasonText(b)) ||
    String(a.management_units).localeCompare(String(b.management_units), undefined, { numeric:true })
  );
}
function osSortedSpeciesForRows(rows) {
  const all = [...new Set((rows || []).map(r => r.species))];
  const big = OS_BIG_ORDER.filter(s => all.includes(s));
  const rest = all.filter(s => !OS_BIG_GAME.has(s)).sort((a,b)=>a.localeCompare(b));
  return big.concat(rest);
}

function osMethodDisplayName(method) {
  const m = String(method || '');
  if (/bow/i.test(m)) return m === 'Youth Bow Only' ? 'Youth Archery / Bow Only' : 'Archery / Bow Only';
  return m || 'Rifle';
}
function osMethodMatches(row, method) {
  if (!method) return true;
  const wm = String(row.weapon_type || '').toLowerCase();
  const m = String(method || '').toLowerCase();
  if (m.includes('bow')) return wm.includes('bow') || wm.includes('archery');
  if (m.includes('youth')) return wm.includes('youth');
  return wm === m;
}
function osRowPassesGlobalFilters(row, ignoreSpecies=false) {
  if (!ignoreSpecies && osSelSpecies && row.species !== osSelSpecies) return false;
  if (osSelMethod && !osMethodMatches(row, osSelMethod)) return false;
  if (osSelMonth && !osRowInMonth(row, osSelMonth)) return false;
  return true;
}
function osRowHasAnyWMUInRegion(row, regionKey) {
  if (!regionKey) return true;
  return osParseMUs(row.management_units).some(mu => osWMURegion(mu) === String(regionKey));
}
function osRegionRows(regionKey, opts={}) {
  const n = osRegionNumberFromKey(regionKey);
  return BC_OS_DATA.filter(r => r.region === n && osRowHasAnyWMUInRegion(r, regionKey) && osRowPassesGlobalFilters(r, !!opts.ignoreSpecies));
}
function osPanelRows() {
  let rows = osSelectedRegion ? osRegionRows(osSelectedRegion) : BC_OS_DATA.filter(r => osRowPassesGlobalFilters(r));
  if (osSelectedOpportunity) rows = rows.filter(r => osRowsSameOpportunity(r, osSelectedOpportunity));
  if (osSelectedWMU) rows = rows.filter(r => osRowAppliesToWMU(r, osSelectedWMU));
  return osSortRows(rows);
}
function osRowsForRegionNoPanelFilter(regionKey) {
  const n = osRegionNumberFromKey(regionKey);
  return BC_OS_DATA.filter(r => r.region === n && osRowHasAnyWMUInRegion(r, regionKey));
}
function osActiveRegions() {
  const active = new Set();
  let rows = BC_OS_DATA.filter(r => osRowPassesGlobalFilters(r));
  if (osSelectedOpportunity) rows = rows.filter(r => osRowsSameOpportunity(r, osSelectedOpportunity));
  rows.forEach(row => osParseMUs(row.management_units).forEach(mu => {
    const rid = osWMURegion(mu);
    if (OS_REGION_LABELS[rid]) active.add(rid);
  }));
  return active;
}
function osActiveWMUs() {
  const active = new Set();
  if (!osSelectedRegion) return active;
  let rows = osRegionRows(osSelectedRegion);
  if (osSelectedOpportunity) rows = rows.filter(r => osRowsSameOpportunity(r, osSelectedOpportunity));
  rows.forEach(row => osParseMUs(row.management_units).forEach(mu => {
    if (osWMURegion(mu) === String(osSelectedRegion)) active.add(mu);
  }));
  return active;
}
function osRegionHasRows(regionKey) {
  return osRowsForRegionNoPanelFilter(regionKey).length > 0;
}
function osWMUsForRows(rows) {
  const s = new Set();
  (rows || []).forEach(r => osParseMUs(r.management_units).forEach(mu => {
    if (!osSelectedRegion || osWMURegion(mu) === String(osSelectedRegion)) s.add(mu);
  }));
  return [...s].sort((a,b)=>a.localeCompare(b, undefined, { numeric:true }));
}

function osBuildFilters() {
  const sp = document.getElementById('osSpeciesSel');
  if (sp && !sp.dataset.built) {
    const all = [...new Set(BC_OS_DATA.map(r => r.species))];
    const big = OS_BIG_ORDER.filter(s => all.includes(s));
    const small = all.filter(s => !OS_BIG_GAME.has(s)).sort((a,b)=>a.localeCompare(b));
    sp.innerHTML = '<option value="">Choose species first or select region</option>' +
      (big.length ? `<optgroup label="Big Game">${big.map(s => `<option value="${osEscape(s)}">${osEscape(s)}</option>`).join('')}</optgroup>` : '') +
      (small.length ? `<optgroup label="Small Game & Birds">${small.map(s => `<option value="${osEscape(s)}">${osEscape(s)}</option>`).join('')}</optgroup>` : '');
    sp.dataset.built = '1';
  }
  const mt = document.getElementById('osMethodSel');
  if (mt && !mt.dataset.built) {
    const methods = [...new Set(BC_OS_DATA.map(r => r.weapon_type || 'Rifle'))]
      .sort((a,b)=>osMethodDisplayName(a).localeCompare(osMethodDisplayName(b)));
    mt.innerHTML = '<option value="">All methods</option>' + methods.map(m => `<option value="${osEscape(m)}">${osEscape(osMethodDisplayName(m))}</option>`).join('');
    mt.dataset.built = '1';
  }
  const mo = document.getElementById('osMonthSel');
  if (mo && !mo.dataset.built) {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    mo.innerHTML = '<option value="">Any month</option>' + months.map((m,i) => `<option value="${i+1}">${m}</option>`).join('');
    mo.dataset.built = '1';
  }
  osSyncFilterControls();
}
function osSyncFilterControls() {
  const sp = document.getElementById('osSpeciesSel'); if (sp) sp.value = osSelSpecies || '';
  const mt = document.getElementById('osMethodSel'); if (mt) mt.value = osSelMethod || '';
  const mo = document.getElementById('osMonthSel'); if (mo) mo.value = osSelMonth || '';
}
function osRegionColorExpr(propName) {
  return ['match', ['to-string', ['get', propName]],
    '1', OS_REGION_COLORS['1'], '2', OS_REGION_COLORS['2'], '3', OS_REGION_COLORS['3'], '4', OS_REGION_COLORS['4'],
    '5', OS_REGION_COLORS['5'], '6', OS_REGION_COLORS['6'], '7A', OS_REGION_COLORS['7A'], '7B', OS_REGION_COLORS['7B'], '8', OS_REGION_COLORS['8'], '#5cb86a'];
}
function osWMURegionColorExpr() {
  return ['case',
    ['==', ['get','REGION_RESPONSIBLE_ID'], '7A'], OS_REGION_COLORS['7A'],
    ['==', ['get','REGION_RESPONSIBLE_ID'], '7B'], OS_REGION_COLORS['7B'],
    ['match', ['slice', ['get','wmu_id'], 0, ['index-of','-', ['get','wmu_id']]],
      '1', OS_REGION_COLORS['1'], '2', OS_REGION_COLORS['2'], '3', OS_REGION_COLORS['3'], '4', OS_REGION_COLORS['4'],
      '5', OS_REGION_COLORS['5'], '6', OS_REGION_COLORS['6'], '8', OS_REGION_COLORS['8'], '#5cb86a']
  ];
}

function osInitMap() {
  if (osMapInitialized) { if (osMapInstance) setTimeout(() => osMapInstance.resize(), 80); return; }
  const el = document.getElementById('osMap');
  if (!el) return;
  const token = (typeof MAPBOX_TOKEN !== 'undefined') ? MAPBOX_TOKEN : '';
  if (!token || !window.mapboxgl) {
    el.innerHTML = '<div class="os-map-error">Mapbox is unavailable. Check config.js and Mapbox GL loading.</div>';
    return;
  }
  const wmuGeo = (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON);
  const regGeo = (typeof BC_REGION_GEOJSON !== 'undefined' && BC_REGION_GEOJSON) ? BC_REGION_GEOJSON : null;
  if (!wmuGeo) { el.innerHTML = '<div class="os-map-error">BC WMU layer missing.</div>'; return; }
  osMapInitialized = true;
  mapboxgl.accessToken = token;
  osMapInstance = new mapboxgl.Map({
    container: 'osMap', style: OS_MAP_STYLES[osMapStyle], center: [-126.3, 54.4], zoom: 4.15,
    minZoom: 3, maxZoom: 20, projection: 'mercator'
  });
  osMapInstance.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-left');
  osMapInstance.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
  osInjectMapControls();
  osMapInstance.on('load', () => osAddMapLayers(wmuGeo, regGeo));
  osMapInstance.on('error', e => console.warn('[Open Seasons map]', e.error || e));
}
function osAddMapLayers(wmuGeo, regGeo) {
  const map = osMapInstance;
  if (!map) return;
  if (!map.getSource(OS_WMU_SRC)) map.addSource(OS_WMU_SRC, { type:'geojson', data:wmuGeo, generateId:true });
  if (regGeo && !map.getSource(OS_REGION_SRC)) map.addSource(OS_REGION_SRC, { type:'geojson', data:regGeo, generateId:true });

  if (!map.getLayer(OS_WMU_FILL)) {
    map.addLayer({ id: OS_WMU_FILL, type:'fill', source: OS_WMU_SRC, paint: {
      'fill-color': ['case',
        ['boolean', ['feature-state','selectedWMU'], false], '#4ade80',
        ['boolean', ['feature-state','outsideRegion'], false], '#151918',
        ['boolean', ['feature-state','noMatch'], false], '#202624',
        osWMURegionColorExpr()
      ],
      'fill-opacity': ['case',
        ['boolean', ['feature-state','provinceMode'], false], 0,
        ['boolean', ['feature-state','selectedWMU'], false], 0.62,
        ['boolean', ['feature-state','outsideRegion'], false], 0.03,
        ['boolean', ['feature-state','activeMatch'], false], 0.46,
        ['boolean', ['feature-state','noMatch'], false], 0.10,
        ['boolean', ['feature-state','inRegion'], false], 0.34,
        0.18
      ]
    }});
  }
  if (!map.getLayer(OS_WMU_LINE)) {
    map.addLayer({ id: OS_WMU_LINE, type:'line', source: OS_WMU_SRC, paint: {
      'line-color': ['case',
        ['boolean', ['feature-state','selectedWMU'], false], '#ffffff',
        ['boolean', ['feature-state','activeMatch'], false], '#f0b429',
        ['boolean', ['feature-state','inRegion'], false], 'rgba(255,255,255,0.26)',
        'rgba(255,255,255,0.10)'
      ],
      'line-width': ['case',
        ['boolean', ['feature-state','provinceMode'], false], 0,
        ['boolean', ['feature-state','selectedWMU'], false], 3.6,
        ['boolean', ['feature-state','activeMatch'], false], 3.0,
        ['boolean', ['feature-state','inRegion'], false], 0.62,
        0.18
      ],
      'line-opacity': ['case',
        ['boolean', ['feature-state','provinceMode'], false], 0,
        ['boolean', ['feature-state','selectedWMU'], false], 1,
        ['boolean', ['feature-state','activeMatch'], false], 1,
        ['boolean', ['feature-state','inRegion'], false], 0.52,
        0.10
      ]
    }});
  }
  if (regGeo && !map.getLayer(OS_REGION_FILL)) {
    map.addLayer({ id: OS_REGION_FILL, type:'fill', source: OS_REGION_SRC, paint: {
      'fill-color': osRegionColorExpr('region_id'),
      'fill-opacity': ['case',
        ['boolean', ['feature-state','selected'], false], 0.34,
        ['boolean', ['feature-state','activeMatch'], false], 0.44,
        ['boolean', ['feature-state','noMatch'], false], 0.055,
        ['boolean', ['feature-state','dimmed'], false], 0.045,
        ['boolean', ['feature-state','hovered'], false], 0.46,
        0.32
      ]
    }});
  }
  if (regGeo && !map.getLayer(OS_REGION_LINE)) {
    map.addLayer({ id: OS_REGION_LINE, type:'line', source: OS_REGION_SRC, paint: {
      'line-color': ['case',
        ['boolean', ['feature-state','activeMatch'], false], '#f0b429',
        ['boolean', ['feature-state','selected'], false], '#ffffff',
        ['boolean', ['feature-state','hovered'], false], '#ffffff',
        osRegionColorExpr('region_id')],
      'line-width': ['case',
        ['boolean', ['feature-state','activeMatch'], false], 4.2,
        ['boolean', ['feature-state','selected'], false], 4.5,
        ['boolean', ['feature-state','hovered'], false], 3.7,
        2.2],
      'line-opacity': ['case',
        ['boolean', ['feature-state','noMatch'], false], 0.24,
        ['boolean', ['feature-state','dimmed'], false], 0.22,
        0.95]
    }});
  }
  osBindMapEvents();
  osRefreshMapStates();
  osApplyOverlayOpacity(osOverlayVisibility);
  osFitBC();
}
function osBindMapEvents() {
  const map = osMapInstance;
  if (!map || map._osEventsBoundClean) return;
  map._osEventsBoundClean = true;

  if (map.getLayer(OS_REGION_FILL)) {
    map.on('mousemove', OS_REGION_FILL, e => {
      if (osSelectedRegion || !e.features?.length) return;
      const f = e.features[0];
      const rid = String(f.properties?.region_id || '');
      if (osHoveredRegion !== null && osHoveredRegion !== f.id) map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false });
      osHoveredRegion = f.id;
      map.setFeatureState({ source: OS_REGION_SRC, id:f.id }, { hovered:true });
      map.getCanvas().style.cursor = 'pointer';
      const rows = osRowsForRegionNoPanelFilter(rid);
      const speciesCount = [...new Set(rows.map(r => r.species))].length;
      osShowTooltip(e, `<b style="color:${osRegionColor(rid)}">${osEscape(osRegionName(rid))}</b><br><span style="font-size:11px;color:#aaa">${speciesCount} species/categories · ${rows.length} season rows</span><br><span style="font-size:11px;color:#777">Tap to select the full region</span>`);
    });
    map.on('mouseleave', OS_REGION_FILL, () => {
      if (osHoveredRegion !== null) map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false });
      osHoveredRegion = null;
      if (!osSelectedRegion) map.getCanvas().style.cursor = '';
      osHideTooltip();
    });
    map.on('click', OS_REGION_FILL, e => {
      if (osSelectedRegion || !e.features?.length) return;
      e.originalEvent._osHandledClick = true;
      const rid = String(e.features[0].properties?.region_id || '');
      if (rid) osSelectRegion(rid);
    });
  }

  map.on('click', e => {
    if (!osSelectedRegion || e.originalEvent?._osHandledClick) return;
    const hits = map.queryRenderedFeatures(e.point, { layers: [OS_WMU_FILL].filter(id => map.getLayer(id)) });
    if (!hits.length) { osBackToProvince(); return; }
    const id = osNormalizeWMU(hits[0].properties?.wmu_id);
    const rid = osWMURegion(id);
    if (rid !== String(osSelectedRegion)) { osBackToProvince(); return; }
    // If no opportunity/species is selected yet, a second tap in the selected region closes it.
    if (!osSelSpecies && !osSelectedOpportunity) { osBackToProvince(); return; }
  });

  map.on('mousemove', OS_WMU_FILL, e => {
    if (!osSelectedRegion || !e.features?.length) return;
    const f = e.features[0];
    const id = osNormalizeWMU(f.properties?.wmu_id);
    if (osWMURegion(id) !== String(osSelectedRegion)) return;
    if (osHoveredWMU !== null && osHoveredWMU !== f.id) map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false });
    osHoveredWMU = f.id;
    map.setFeatureState({ source: OS_WMU_SRC, id:f.id }, { hovered:true });
    map.getCanvas().style.cursor = 'pointer';
    osShowTooltip(e, osTooltipForWMU(id));
  });
  map.on('mouseleave', OS_WMU_FILL, () => {
    if (osHoveredWMU !== null) map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false });
    osHoveredWMU = null;
    map.getCanvas().style.cursor = '';
    osHideTooltip();
  });
  map.on('click', OS_WMU_FILL, e => {
    if (!osSelectedRegion || !e.features?.length) return;
    e.originalEvent._osHandledClick = true;
    const id = osNormalizeWMU(e.features[0].properties?.wmu_id);
    if (osWMURegion(id) !== String(osSelectedRegion)) { osBackToProvince(); return; }
    if (!osSelSpecies && !osSelectedOpportunity) { osBackToProvince(); return; }
    osSelectWMU(id);
  });
}
function osTooltipForWMU(id) {
  const rows = BC_OS_DATA.filter(r => r.region === osRegionNumberFromKey(osSelectedRegion) && osRowPassesGlobalFilters(r) && (!osSelectedOpportunity || osRowsSameOpportunity(r, osSelectedOpportunity)) && osRowAppliesToWMU(r, id));
  const species = [...new Set(rows.map(r => r.species))];
  const sp = species.length ? species.slice(0,4).map(osEscape).join(', ') + (species.length > 4 ? ` +${species.length - 4} more` : '') : 'No rows match current filters';
  return `<b style="color:#f0b429">WMU ${osEscape(id)}</b><br><span style="font-size:11px;color:#aaa">${rows.length} season row${rows.length === 1 ? '' : 's'} · ${sp}</span>`;
}

function osRefreshMapStates() {
  const map = osMapInstance;
  if (!map || !map.getSource(OS_WMU_SRC)) return;
  const wmuGeo = (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON);
  const regGeo = (typeof BC_REGION_GEOJSON !== 'undefined') ? BC_REGION_GEOJSON : null;
  const active = osActiveWMUs();
  const activeRegions = osActiveRegions();
  const selectedRegion = String(osSelectedRegion || '');
  const hasHighlight = !!(osSelSpecies || osSelectedOpportunity || osSelMethod || osSelMonth);

  (wmuGeo?.features || []).forEach((feat, i) => {
    const id = osNormalizeWMU(feat.properties?.wmu_id);
    const reg = osWMURegion(id);
    const inRegion = selectedRegion && reg === selectedRegion;
    const activeMatch = inRegion && hasHighlight && active.has(id);
    map.setFeatureState({ source: OS_WMU_SRC, id:i }, {
      provinceMode: !selectedRegion,
      inRegion: !!inRegion,
      outsideRegion: !!(selectedRegion && !inRegion),
      noMatch: !!(selectedRegion && inRegion && hasHighlight && !active.has(id)),
      activeMatch: !!activeMatch,
      selectedWMU: !!(osSelectedWMU && id === osSelectedWMU),
      hovered:false
    });
  });

  (regGeo?.features || []).forEach((feat, i) => {
    const rid = String(feat.properties?.region_id || '');
    const provinceActive = !selectedRegion && hasHighlight && activeRegions.has(rid);
    const provinceNoMatch = !selectedRegion && hasHighlight && !activeRegions.has(rid);
    map.setFeatureState({ source: OS_REGION_SRC, id:i }, {
      selected: !!(selectedRegion && rid === selectedRegion),
      dimmed: !!(selectedRegion && rid !== selectedRegion),
      activeMatch: !!provinceActive,
      noMatch: !!provinceNoMatch,
      hovered:false
    });
  });

  // Province mode uses dissolved region polygons. Region mode hides the region fill so exact WMUs can receive clicks.
  if (map.getLayer(OS_REGION_FILL)) map.setLayoutProperty(OS_REGION_FILL, 'visibility', selectedRegion ? 'none' : 'visible');
  if (map.getLayer(OS_REGION_LINE)) map.setLayoutProperty(OS_REGION_LINE, 'visibility', 'visible');
  osUpdateMapStatus();
  osApplyOverlayOpacity(osOverlayVisibility);
}
function osUpdateMapStatus() {
  const el = document.getElementById('osMapStatus');
  if (!el) return;
  if (!osSelectedRegion) {
    if (osSelectedOpportunity) {
      const lab = osOpportunityLabel(osSelectedOpportunity);
      const regs = osActiveRegions().size;
      el.innerHTML = `<b>${osEscape(lab.species)} · ${osEscape(lab.cls)}</b><span>${regs} matching region${regs === 1 ? '' : 's'} highlighted with gold borders. Tap a region for WMUs and dates.</span>`;
    } else if (osSelSpecies || osSelMethod || osSelMonth) {
      const regs = osActiveRegions().size;
      const label = osSelSpecies || (osSelMethod ? osMethodDisplayName(osSelMethod) : 'Filtered opportunities');
      el.innerHTML = `<b>${osEscape(label)}</b><span>${regs} matching region${regs === 1 ? '' : 's'} highlighted. Tap a region to drill into WMUs.</span>`;
    } else {
      el.innerHTML = `<b>Select a hunting region</b><span>WMUs are merged here. Tap a full coloured region, or choose a species to preview regions.</span>`;
    }
    return;
  }
  const rows = osPanelRows();
  if (osSelectedWMU) el.innerHTML = `<b>WMU ${osEscape(osSelectedWMU)}</b><span>${osEscape(osRegionName(osSelectedRegion))} · ${rows.length} matching season row${rows.length === 1 ? '' : 's'}</span>`;
  else if (osSelectedOpportunity) {
    const lab = osOpportunityLabel(osSelectedOpportunity);
    el.innerHTML = `<b>${osEscape(lab.species)} · ${osEscape(lab.cls)}</b><span>${osWMUsForRows(rows).length} matching WMUs in ${osEscape(osRegionName(osSelectedRegion))}</span>`;
  } else if (osSelSpecies) el.innerHTML = `<b>${osEscape(osSelSpecies)}</b><span>${osWMUsForRows(rows).length} matching WMUs in ${osEscape(osRegionName(osSelectedRegion))}</span>`;
  else el.innerHTML = `<b>${osEscape(osRegionName(osSelectedRegion))}</b><span>Choose an opportunity from the right panel to highlight matching WMUs.</span>`;
}
function osFitBC() {
  if (!osMapInstance) return;
  osMapInstance.fitBounds([[-139.3,48.1],[-113.8,60.2]], { padding: 24, duration: 0, bearing:0, pitch:0 });
}
function osFitRegion(regionKey) {
  if (!osMapInstance) return;
  const regGeo = (typeof BC_REGION_GEOJSON !== 'undefined') ? BC_REGION_GEOJSON : null;
  const f = regGeo?.features?.find(x => String(x.properties?.region_id) === String(regionKey));
  if (!f) return;
  const b = osFeatureBBox(f);
  if (b) osMapInstance.fitBounds([[b[0],b[1]],[b[2],b[3]]], { padding: { top: 60, bottom: 60, left: 60, right: 430 }, maxZoom: 8.8, duration: 900 });
}
function osFeatureBBox(f) {
  if (window.turf && turf.bbox) return turf.bbox(f);
  const coords=[];
  (function walk(x){ if (!x) return; if (typeof x[0] === 'number') coords.push(x); else x.forEach(walk); })(f.geometry?.coordinates);
  if (!coords.length) return null;
  const xs=coords.map(c=>c[0]), ys=coords.map(c=>c[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
function osZoomToRows(rows) {
  if (!osMapInstance) return;
  const wmus = new Set(osWMUsForRows(rows || osPanelRows()));
  const wmuGeo = (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON);
  const feats = (wmuGeo?.features || []).filter(f => wmus.has(osNormalizeWMU(f.properties?.wmu_id)));
  if (!feats.length) return;
  const boxes = feats.map(osFeatureBBox).filter(Boolean);
  const b = [Math.min(...boxes.map(x=>x[0])), Math.min(...boxes.map(x=>x[1])), Math.max(...boxes.map(x=>x[2])), Math.max(...boxes.map(x=>x[3]))];
  osMapInstance.fitBounds([[b[0],b[1]],[b[2],b[3]]], { padding: { top:70, bottom:70, left:70, right:430 }, maxZoom: 10.5, duration: 850 });
}

function osSelectRegion(regionKey) {
  const next = String(regionKey || '');
  if (osSelectedRegion && osSelectedRegion === next) { osBackToProvince(); return; }
  osSelectedRegion = next;
  osSelectedWMU = null;
  // Keep species/method/opportunity filters if the user chose them before the region.
  osSyncFilterControls();
  osRefreshMapStates();
  osRenderPanel();
  osFitRegion(osSelectedRegion);
}
function osSelectWMU(wmu) {
  osSelectedWMU = osNormalizeWMU(wmu);
  osRefreshMapStates();
  osRenderPanel();
}
function osSelectSpecies(species) {
  osSelSpecies = String(species || '');
  osSelectedOpportunity = '';
  osSelectedWMU = null;
  osSyncFilterControls();
  osRefreshMapStates();
  osRenderPanel();
  if (osSelectedRegion && osSelSpecies) osZoomToRows(osPanelRows());
  else osFitBC();
}
function osSelectOpportunity(key) {
  osSelectedOpportunity = String(key || '');
  const lab = osOpportunityLabel(osSelectedOpportunity);
  osSelSpecies = lab.species || osSelSpecies;
  osSelectedWMU = null;
  osSyncFilterControls();
  osRefreshMapStates();
  osRenderPanel();
  if (osSelectedRegion) osZoomToRows(osPanelRows());
  else osFitBC();
}
function osOnSpecies(v) { osSelectSpecies(v); }
function osOnMethod(v) { osSelMethod = v || ''; osSelectedWMU = null; osSelectedOpportunity = ''; osRefreshMapStates(); osRenderPanel(); if (!osSelectedRegion) osFitBC(); }
function osOnMonth(v) { osSelMonth = v || ''; osSelectedWMU = null; osSelectedOpportunity = ''; osRefreshMapStates(); osRenderPanel(); if (!osSelectedRegion) osFitBC(); }
function osClearFilters() { osSelSpecies = ''; osSelMonth = ''; osSelMethod = ''; osSelectedOpportunity = ''; osSelectedWMU = null; osSyncFilterControls(); osRefreshMapStates(); osRenderPanel(); if (!osSelectedRegion) osFitBC(); }
function osBackToProvince() { osSelectedRegion = null; osSelectedWMU = null; osSelectedOpportunity = ''; osSyncFilterControls(); osRefreshMapStates(); osRenderPanel(); osFitBC(); }
function osClearWMU() { osSelectedWMU = null; osRefreshMapStates(); osRenderPanel(); }

let _osTooltipEl = null;
function osEnsureTooltip() {
  if (!_osTooltipEl) {
    _osTooltipEl = document.createElement('div');
    _osTooltipEl.className = 'os-map-tooltip';
    document.body.appendChild(_osTooltipEl);
  }
  return _osTooltipEl;
}
function osShowTooltip(e, html) {
  const el = osEnsureTooltip();
  el.innerHTML = html;
  el.style.display = 'block';
  const ev = e.originalEvent || e;
  el.style.left = (ev.clientX + 14) + 'px';
  el.style.top = (ev.clientY - 10) + 'px';
}
function osHideTooltip() { if (_osTooltipEl) _osTooltipEl.style.display = 'none'; }

function osRenderPanel() {
  const panel = document.getElementById('osResultsPanel');
  const title = document.getElementById('osPanelTitle');
  const count = document.getElementById('osPanelCount');
  const crumbs = document.getElementById('osCrumbs');
  if (!panel) return;
  const rows = osPanelRows();
  if (title) title.textContent = osSelectedRegion ? osRegionName(osSelectedRegion) : (osSelSpecies ? `${osSelSpecies} across BC` : 'BC General Open Seasons');
  if (count) count.textContent = osSelectedRegion ? `${rows.length} season rows` : (osSelSpecies || osSelectedOpportunity || osSelMethod || osSelMonth ? `${rows.length} matching rows` : 'Select a region');
  if (crumbs) crumbs.innerHTML = osCrumbsHTML();

  if (!osSelectedRegion) {
    panel.innerHTML = osProvincePanel();
    return;
  }
  if (osSelectedWMU) {
    panel.innerHTML = osWMUPanel(rows);
    return;
  }
  if (osSelectedOpportunity) {
    panel.innerHTML = osOpportunityPanel(rows);
    return;
  }
  if (osSelSpecies) {
    panel.innerHTML = osSpeciesPanel(rows);
    return;
  }
  panel.innerHTML = osRegionPanel(rows);
}
function osCrumbsHTML() {
  if (!osSelectedRegion) return `<span>BC</span>`;
  let html = `<button type="button" onclick="osBackToProvince()">BC</button><span>/</span><span>${osEscape(osRegionName(osSelectedRegion))}</span>`;
  if (osSelSpecies) html += `<span>/</span><button type="button" onclick="osSelectSpecies(${osJsArg(osSelSpecies)})">${osEscape(osSelSpecies)}</button>`;
  if (osSelectedOpportunity) {
    const lab = osOpportunityLabel(osSelectedOpportunity);
    html += `<span>/</span><span>${osEscape(lab.cls)}</span>`;
  }
  if (osSelectedWMU) html += `<span>/</span><span>WMU ${osEscape(osSelectedWMU)}</span>`;
  return html;
}
function osProvincePanel() {
  const rows = osPanelRows();
  const activeRegs = osActiveRegions();
  const cards = Object.keys(OS_REGION_LABELS).sort((a,b)=>osRegionSortValue(a)-osRegionSortValue(b)).map(key => {
    const rRows = osRowsForRegionNoPanelFilter(key).filter(r => osRowPassesGlobalFilters(r));
    const species = [...new Set(rRows.map(r => r.species))].length;
    const wmus = new Set();
    rRows.forEach(r => osParseMUs(r.management_units).forEach(mu => { if (osWMURegion(mu) === String(key)) wmus.add(mu); }));
    const isMatch = (osSelSpecies || osSelectedOpportunity || osSelMethod || osSelMonth) && activeRegs.has(key);
    return `<button class="os-region-card${isMatch ? ' matching' : ''}" type="button" onclick="osSelectRegion('${key}')" style="border-left:4px solid ${osRegionColor(key)}">
      <strong>${osEscape(osRegionName(key))}</strong>
      <span>${wmus.size} WMUs · ${rRows.length} matching rows · ${species} species/categories</span>
    </button>`;
  }).join('');
  const intro = (osSelSpecies || osSelectedOpportunity || osSelMethod || osSelMonth)
    ? `<div class="os-region-summary"><b>${osSelectedOpportunity ? osEscape(osOpportunityLabel(osSelectedOpportunity).species + ' · ' + osOpportunityLabel(osSelectedOpportunity).cls) : osEscape(osSelSpecies || (osSelMethod ? osMethodDisplayName(osSelMethod) : 'Filtered opportunities'))}</b><span>${activeRegs.size} regions have matching General Open Season rows. Gold borders on the map show where this applies.</span></div>`
    : `<div class="os-empty"><h3>Select a full region from the map</h3><p>WMUs are hidden at this step so the map stays clean. You can also choose a species below to preview which regions have it.</p></div>`;
  return `${intro}<div class="os-region-grid">${cards}</div><div class="os-panel-section-title">Species / opportunity explorer</div>${osOpportunityList(rows)}`;
}
function osRegionPanel(rows) {
  const speciesCount = [...new Set(rows.map(r => r.species))].length;
  return `<div class="os-region-summary"><b>Everything huntable in ${osEscape(osRegionName(osSelectedRegion))}</b><span>${speciesCount} species/categories · ${rows.length} General Open Season rows. Choose a species or exact opportunity below to highlight matching WMUs.</span></div>${osOpportunityList(rows)}`;
}
function osSpeciesPanel(rows) {
  const wmus = osWMUsForRows(rows);
  return `<div class="os-region-summary"><b>${osEscape(osSelSpecies)} in ${osEscape(osRegionName(osSelectedRegion))}</b><span>${wmus.length} matching WMUs. Gold outlines on the map show every WMU with this species in the selected region.</span></div>${osWmuChips(wmus)}${osRowsGroupedByOpportunity(rows)}`;
}
function osOpportunityPanel(rows) {
  const lab = osOpportunityLabel(osSelectedOpportunity);
  const wmus = osWMUsForRows(rows);
  return `<div class="os-region-summary"><b>${osEscape(lab.species)} · ${osEscape(lab.cls)}</b><span>${osEscape(lab.season)} · ${wmus.length} matching WMUs. Tap a highlighted WMU for exact area details.</span></div>${osWmuChips(wmus)}${osRowsGroupedByWMU(rows)}`;
}
function osWMUPanel(rows) {
  const all = osSortRows(BC_OS_DATA.filter(r => r.region === osRegionNumberFromKey(osSelectedRegion) && osRowPassesGlobalFilters(r, true) && osRowAppliesToWMU(r, osSelectedWMU)));
  const primary = rows.length ? rows : all.filter(r => !osSelSpecies || r.species === osSelSpecies);
  const other = all.filter(r => !primary.includes(r));
  return `<div class="os-region-summary"><b>WMU ${osEscape(osSelectedWMU)}</b><span>${osEscape(osRegionName(osSelectedRegion))}. Selected opportunity is shown first. Other species are below.</span></div>${osSeasonCards(primary, 'primary')}${other.length ? osCollapsibleBlock('Other species in this WMU', `${other.length} additional rows`, osSeasonCards(other, 'other'), false) : ''}`;
}
function osOpportunityList(rows) {
  const bySpecies = {};
  rows.forEach(r => { (bySpecies[r.species] ||= []).push(r); });
  return osSortedSpeciesForRows(rows).map(sp => {
    const rs = osSortRows(bySpecies[sp] || []);
    const wmus = osWMUsForRows(rs).length;
    const open = osSelSpecies === sp;
    const bodyId = 'ossp-' + String(sp).replace(/[^a-z0-9]+/ig,'-');
    return `<div class="os-species-group${open ? ' active' : ''}">
      <button class="os-species-head" type="button" onclick="osSelectSpecies(${osJsArg(sp)})">
        <span><strong>${osEscape(sp)}</strong><em>${wmus} ${osSelectedRegion ? 'WMUs' : 'regions/WMUs'} · ${rs.length} season rows</em></span><span>${open ? 'Selected' : 'Highlight'}</span>
      </button>
      <div class="os-opportunity-list" id="${bodyId}" style="display:${open ? 'grid' : 'none'}">${osRowsGroupedByOpportunity(rs, true)}</div>
    </div>`;
  }).join('');
}
function osRowsGroupedByOpportunity(rows, compact=false) {
  const by = new Map();
  rows.forEach(r => { const key = osOpportunityKey(r); if (!by.has(key)) by.set(key, []); by.get(key).push(r); });
  return [...by.entries()].map(([key, rs]) => {
    const lab = osOpportunityLabel(key);
    const wmus = osWMUsForRows(rs).length;
    return `<button class="os-opportunity-row${compact ? ' compact' : ''}${osSelectedOpportunity === key ? ' active' : ''}" type="button" onclick="osSelectOpportunity(${osJsArg(key)})">
      <span><b>${osEscape(lab.cls || 'Any')}</b><em>${osEscape(lab.season)} · ${osEscape(osMethodDisplayName(lab.method))} · ${wmus} WMUs</em></span>
      <span class="os-gold-dot"></span>
    </button>`;
  }).join('');
}
function osRowsGroupedByWMU(rows) {
  const by = new Map();
  rows.forEach(row => osParseMUs(row.management_units).forEach(mu => {
    if (osSelectedRegion && osWMURegion(mu) !== String(osSelectedRegion)) return;
    if (!by.has(mu)) by.set(mu, []);
    by.get(mu).push(row);
  }));
  return [...by.entries()].sort((a,b)=>a[0].localeCompare(b[0], undefined, { numeric:true })).map(([mu, rs]) => {
    return `<div class="os-wmu-card">
      <button type="button" class="os-wmu-head" onclick="osSelectWMU('${osEscape(mu)}')">
        <span><strong>WMU ${osEscape(mu)}</strong><em>${rs.length} season row${rs.length === 1 ? '' : 's'}</em></span><span>View exact</span>
      </button>
      <div class="os-wmu-body">${osSeasonCards(rs, 'wmu-' + mu.replace(/[^a-z0-9]/ig,'-'))}</div>
    </div>`;
  }).join('');
}
function osWmuChips(wmus) {
  if (!wmus.length) return `<div class="os-warning">No WMUs match the current filters.</div>`;
  return `<div class="os-wmu-chip-row">${wmus.map(mu => `<button type="button" onclick="osSelectWMU('${osEscape(mu)}')">${osEscape(mu)}</button>`).join('')}</div>`;
}
function osCollapsibleBlock(title, sub, html, open) {
  const id = 'oscoll-' + Math.random().toString(36).slice(2,8);
  return `<div class="os-season-card"><button type="button" class="os-season-head" onclick="osToggleCard('${id}')"><span><strong>${osEscape(title)}</strong><em>${osEscape(sub || '')}</em></span><span class="os-chevron">⌄</span></button><div class="os-season-body" id="${id}" style="display:${open ? 'block' : 'none'}">${html}</div></div>`;
}
function osSeasonCards(rows, prefix) {
  const bySpecies = {};
  osSortRows(rows).forEach(r => { (bySpecies[r.species] ||= []).push(r); });
  return osSortedSpeciesForRows(rows).map((sp, i) => {
    const rs = bySpecies[sp] || [];
    const bodyId = `${prefix || 'card'}-osbody-${i}-${String(sp).replace(/[^a-z0-9]+/ig,'-')}`;
    const shouldOpen = osSelSpecies === sp || prefix === 'primary' || rs.length <= 4;
    return `<div class="os-season-card">
      <button type="button" class="os-season-head" onclick="osToggleCard('${bodyId}')">
        <span><strong>${osEscape(sp)}</strong><em>${rs.length} row${rs.length === 1 ? '' : 's'}</em></span><span class="os-chevron">⌄</span>
      </button>
      <div class="os-season-body" id="${bodyId}" style="display:${shouldOpen ? 'block' : 'none'}">${rs.map(osSeasonRowHTML).join('')}</div>
    </div>`;
  }).join('');
}
function osSeasonRowHTML(row) {
  return `<div class="os-season-row">
    <div class="os-season-main"><div class="os-season-class">${osEscape(row.class || 'Any')}</div><div class="os-season-date">${osEscape(osSeasonText(row))}</div><div class="os-season-mus">${osEscape(row.management_units)}</div>${row.notes ? `<div class="os-warning mini">${osEscape(row.notes)}</div>` : ''}</div>
    <div class="os-season-side"><span class="os-badge ${row.weapon_type === 'Rifle' ? 'muted' : ''}">${osEscape(osMethodDisplayName(row.weapon_type || 'Rifle'))}</span><span class="os-badge muted">Bag: ${osEscape(row.bag_limit || '—')}</span></div>
  </div>`;
}
function osToggleCard(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function osInjectMapControls() {
  const wrap = document.querySelector('.os-map-wrap');
  if (!wrap || document.getElementById('osMapControls')) return;
  const div = document.createElement('div');
  div.id = 'osMapControls';
  div.className = 'os-map-controls full-style collapsed';
  div.innerHTML = `
    <button type="button" id="osControlsToggle" class="os-controls-toggle" onclick="osToggleControlTray()">Layers</button>
    <div id="osControlsTray" class="os-control-tray">
      <button type="button" id="osTile_streets" onclick="osSetTile('streets')">Streets</button>
      <button type="button" id="osTile_satellite" onclick="osSetTile('satellite')">Satellite</button>
      <button type="button" id="osTile_topo" onclick="osSetTile('topo')">Topo</button>
      <button type="button" id="os3DBtn" onclick="osToggle3D()">3D</button>
      <label class="os-opacity-control"><span>Opacity</span><input id="osOpacityRange" type="range" min="0" max="1" step="0.05" value="1" oninput="osSetOverlayOpacity(this.value)"></label>
      <button type="button" id="osFullscreenBtn" onclick="osToggleFullscreen()">⛶</button>
    </div>`;
  wrap.appendChild(div);
  osSyncTileButtons();
}
function osToggleControlTray() {
  document.getElementById('osMapControls')?.classList.toggle('collapsed');
}
function osSyncTileButtons() {
  ['streets','satellite','topo'].forEach(t => document.getElementById('osTile_' + t)?.classList.toggle('active', osMapStyle === t));
  document.getElementById('os3DBtn')?.classList.toggle('active', osTerrain3D);
  const r = document.getElementById('osOpacityRange'); if (r) r.value = String(osOverlayVisibility);
}
function osSetOverlayOpacity(val) {
  osOverlayVisibility = Math.max(0, Math.min(1, parseFloat(val == null ? 1 : val)));
  osApplyOverlayOpacity(osOverlayVisibility);
}
function osApplyOverlayOpacity(m) {
  if (!osMapInstance) return;
  m = Math.max(0, Math.min(1, Number(m == null ? 1 : m)));
  try {
    if (osMapInstance.getLayer(OS_WMU_FILL)) {
      osMapInstance.setPaintProperty(OS_WMU_FILL, 'fill-opacity', ['case',
        ['boolean', ['feature-state','provinceMode'], false], 0,
        ['boolean', ['feature-state','selectedWMU'], false], 0.62 * m,
        ['boolean', ['feature-state','outsideRegion'], false], 0.03 * m,
        ['boolean', ['feature-state','activeMatch'], false], 0.46 * m,
        ['boolean', ['feature-state','noMatch'], false], 0.10 * m,
        ['boolean', ['feature-state','inRegion'], false], 0.34 * m,
        0.18 * m
      ]);
    }
    if (osMapInstance.getLayer(OS_WMU_LINE)) {
      osMapInstance.setPaintProperty(OS_WMU_LINE, 'line-opacity', ['case',
        ['boolean', ['feature-state','provinceMode'], false], 0,
        ['boolean', ['feature-state','selectedWMU'], false], 1,
        ['boolean', ['feature-state','activeMatch'], false], 1,
        ['boolean', ['feature-state','inRegion'], false], 0.52 * Math.max(m, .25),
        0.10 * Math.max(m, .25)
      ]);
    }
    if (osMapInstance.getLayer(OS_REGION_FILL)) {
      osMapInstance.setPaintProperty(OS_REGION_FILL, 'fill-opacity', ['case',
        ['boolean', ['feature-state','selected'], false], 0.34 * m,
        ['boolean', ['feature-state','activeMatch'], false], 0.44 * m,
        ['boolean', ['feature-state','noMatch'], false], 0.055 * m,
        ['boolean', ['feature-state','dimmed'], false], 0.045 * m,
        ['boolean', ['feature-state','hovered'], false], 0.46 * m,
        0.32 * m
      ]);
    }
    if (osMapInstance.getLayer(OS_REGION_LINE)) {
      osMapInstance.setPaintProperty(OS_REGION_LINE, 'line-opacity', ['case',
        ['boolean', ['feature-state','noMatch'], false], 0.24 * Math.max(m, .35),
        ['boolean', ['feature-state','dimmed'], false], 0.22 * Math.max(m, .35),
        0.95 * Math.max(m, .45)
      ]);
    }
  } catch(e) {}
}
function osToggleFilterPanel() {
  document.querySelector('.os-filter-popover')?.classList.toggle('open');
}
function osCloseFilterPanel() {
  document.querySelector('.os-filter-popover')?.classList.remove('open');
}
function osSetTile(type) {
  if (!OS_MAP_STYLES[type] || !osMapInstance) return;
  osMapStyle = type;
  osSyncTileButtons();
  const center = osMapInstance.getCenter();
  const zoom = osMapInstance.getZoom();
  const bearing = osMapInstance.getBearing();
  const pitch = osMapInstance.getPitch();
  osMapInstance.setStyle(OS_MAP_STYLES[type]);
  osMapInstance.once('style.load', () => {
    const wmuGeo = (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON);
    const regGeo = (typeof BC_REGION_GEOJSON !== 'undefined') ? BC_REGION_GEOJSON : null;
    osAddMapLayers(wmuGeo, regGeo);
    osMapInstance.jumpTo({ center, zoom, bearing: osTerrain3D ? bearing : 0, pitch: osTerrain3D ? pitch : 0 });
    if (osTerrain3D) osApplyTerrain(true);
  });
}
function osToggle3D() { osTerrain3D = !osTerrain3D; osApplyTerrain(osTerrain3D); osSyncTileButtons(); }
function osApplyTerrain(on) {
  if (!osMapInstance) return;
  if (on) {
    if (!osMapInstance.getSource('os-mapbox-dem')) osMapInstance.addSource('os-mapbox-dem', { type:'raster-dem', url:'mapbox://mapbox.mapbox-terrain-dem-v1', tileSize:512, maxzoom:14 });
    osMapInstance.setTerrain({ source:'os-mapbox-dem', exaggeration:1.55 });
    osMapInstance.easeTo({ pitch:58, bearing:-12, duration:800 });
  } else {
    osMapInstance.setTerrain(null);
    osMapInstance.easeTo({ pitch:0, bearing:0, duration:600 });
  }
}
function osToggleFullscreen() {
  const page = document.querySelector('.os-page');
  if (!page) return;
  osIsFullscreen = !osIsFullscreen;
  page.classList.toggle('is-fullscreen', osIsFullscreen);
  document.body.style.overflow = osIsFullscreen ? 'hidden' : '';
  const b = document.getElementById('osFullscreenBtn');
  if (b) b.textContent = osIsFullscreen ? '✕' : '⛶';
  setTimeout(() => osMapInstance && osMapInstance.resize(), 80);
}

function initOpenSeasonsPage() {
  osBuildFilters();
  osRenderPanel();
  setTimeout(() => {
    osInitMap();
    if (osMapInstance) { osMapInstance.resize(); osRefreshMapStates(); }
  }, 80);
}

window.initOpenSeasonsPage = initOpenSeasonsPage;
window.osOnSpecies = osOnSpecies;
window.osOnMethod = osOnMethod;
window.osOnMonth = osOnMonth;
window.osClearFilters = osClearFilters;
window.osBackToProvince = osBackToProvince;
window.osClearWMU = osClearWMU;
window.osSelectRegion = osSelectRegion;
window.osSelectWMU = osSelectWMU;
window.osSelectSpecies = osSelectSpecies;
window.osSelectOpportunity = osSelectOpportunity;
window.osToggleCard = osToggleCard;
window.osSetTile = osSetTile;
window.osToggleControlTray = osToggleControlTray;
window.osToggleFilterPanel = osToggleFilterPanel;
window.osCloseFilterPanel = osCloseFilterPanel;
window.osToggle3D = osToggle3D;
window.osZoomToRows = osZoomToRows;
window.osSetOverlayOpacity = osSetOverlayOpacity;
window.osToggleFullscreen = osToggleFullscreen;

// ══════════════════════════════════════════════════════════════
// GOS REGION-FIRST PROFESSIONAL OVERRIDE — multi-region + clean map states
// This override keeps the original data payload but replaces the interaction
// model so the first map action is always full-region selection.
// ══════════════════════════════════════════════════════════════

var osSelectedRegions = (typeof osSelectedRegions !== 'undefined' && osSelectedRegions) ? osSelectedRegions : new Set();
var osMultiRegionMode = false;

function osSelectedRegionKeys() {
  return [...osSelectedRegions].filter(Boolean).sort((a,b)=>osRegionSortValue(a)-osRegionSortValue(b));
}
function osHasSelectedRegions() { return osSelectedRegions.size > 0; }
function osRegionIsSelected(key) { return osSelectedRegions.has(String(key || '')); }
function osSyncSelectedRegionVar() {
  const keys = osSelectedRegionKeys();
  osSelectedRegion = keys.length === 1 ? keys[0] : (keys[0] || null);
  return keys;
}
function osSelectedRegionLabel() {
  const keys = osSelectedRegionKeys();
  if (!keys.length) return 'BC';
  if (keys.length === 1) return osRegionName(keys[0]);
  return keys.map(osRegionName).join(', ');
}
function osSelectedRegionSetOrAll() {
  return osSelectedRegionKeys();
}
function osSetMultiRegionMode(on) {
  osMultiRegionMode = !!on;
  const cb = document.getElementById('osMultiRegionMode');
  if (cb) cb.checked = osMultiRegionMode;
  if (!osMultiRegionMode && osSelectedRegions.size > 1) {
    const first = osSelectedRegionKeys()[0];
    osSelectedRegions = new Set(first ? [first] : []);
    osSyncSelectedRegionVar();
    osSelectedWMU = null;
    osRefreshMapStates();
    osRenderPanel();
    osFitSelectionOrBC();
  }
}

// Correct 7A / 7B from the WMU properties. Do not collapse all Region 7 into 7A.
OS_WMU_REGION_INDEX = null;
osBuildWMURegionIndex = function() {
  if (OS_WMU_REGION_INDEX) return OS_WMU_REGION_INDEX;
  OS_WMU_REGION_INDEX = {};
  const geo = (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON);
  (geo?.features || []).forEach(f => {
    const id = osNormalizeWMU(f.properties?.wmu_id || f.properties?.WMUNIT_NUM || '');
    if (!id) return;
    let rid = String(f.properties?.REGION_RESPONSIBLE_ID || id.split('-')[0] || '').trim().toUpperCase();
    // Some layers store region 7 as a numeric prefix in the WMU but include the real
    // 7A/7B split in REGION_RESPONSIBLE_ID. If that value is missing, use a safe
    // fallback based on the official split in the provided WMU layer.
    if (rid === '7' || rid === '') {
      const n = parseInt(id.split('-')[1], 10);
      rid = Number.isFinite(n) && n >= 32 ? '7B' : '7A';
    }
    OS_WMU_REGION_INDEX[id] = rid;
  });
  return OS_WMU_REGION_INDEX;
};

// Rebuild the cleaned data so archery/bow-only rows are actually searchable/filterable.
osSanitizeRow = function(row) {
  const r = { ...row };
  const rawWeapon = osClean(r.weapon_type || '');
  const rawBag = osClean(r.bag_limit || '');
  const rawClass = osClean(r.class || '');
  const rawNotes = osClean(r.notes || '');
  const rawCombined = `${rawWeapon} ${rawBag} ${rawClass} ${rawNotes}`;

  r.region = parseInt(String(r.region || '').replace(/\D+$/,''), 10);
  r.region_name = osClean(r.region_name);
  r.species = osClean(r.species);
  r.management_units = osClean(r.management_units);
  r.bag_limit = rawBag;
  r.notes = rawNotes;
  r.class = rawClass || 'Any';
  r.season_text = osClean(r.season_text || ((r.season_open || '') + (r.season_close ? ' - ' + r.season_close : '')));
  r.season_open = osClean(r.season_open || r.season_text);
  r.season_close = osClean(r.season_close || '');

  const lc = r.class.toLowerCase();
  if (lc === 'cks' || lc === 'buck' || lc === 'bck' || lc === 'ucks') r.class = 'Bucks';
  if (lc === 'lls' || lc === 'bull' || lc === 'ulls') r.class = 'Bulls';
  if (lc === 'ws') r.class = 'Ewes';
  if (lc === 'rs') r.class = 'Rams';
  if (lc === 'erless') r.class = 'Antlerless';
  if (/^4\s*point\s*b/i.test(r.class)) r.class = '4 Point Bucks';
  if (/^6\s*point\s*b/i.test(r.class)) r.class = '6 Point Bulls';
  if (/^either\s+sex$/i.test(r.class)) r.class = 'Either Sex';
  if (/^any\s+turkey$/i.test(r.class)) r.class = 'Any Turkey';

  // OCR sometimes dropped the B in Bow Only and put it in bag_limit.
  if (/youth\s+(bow|archery)|youth\s+ow\s+only/i.test(rawCombined)) r.weapon_type = 'Youth Bow Only';
  else if (/(^|\s)(bow|archery)\s+only|\bbow\b|\barchery\b|\bow\s+only/i.test(rawCombined)) r.weapon_type = 'Bow Only';
  else if (/\bbow\s+only/i.test(rawCombined)) r.weapon_type = 'Bow Only';
  else if (/youth\s+only/i.test(rawCombined)) r.weapon_type = 'Youth Only';
  else if (/shotgun/i.test(rawCombined)) r.weapon_type = 'Shotgun';
  else r.weapon_type = rawWeapon || 'Rifle';

  if (/ow only/i.test(r.bag_limit) || /youth bow only/i.test(r.bag_limit) || /bow only/i.test(r.bag_limit) || /archery/i.test(r.bag_limit)) r.bag_limit = '';
  if (/^refer to$/i.test(r.bag_limit)) r.bag_limit = 'Refer to synopsis';
  if (/^nbl$/i.test(r.bag_limit)) r.bag_limit = 'NBL';
  return r;
};
try {
  BC_OS_DATA.length = 0;
  BC_OS_DATA_RAW.map(osSanitizeRow).filter(osValidRow).forEach(r => BC_OS_DATA.push(r));
} catch(e) { console.warn('[GOS data rebuild]', e); }

function osSelectedRegionContainsWMU(mu) {
  if (!osHasSelectedRegions()) return true;
  return osSelectedRegions.has(osWMURegion(mu));
}
function osRowHasAnyWMUInSelectedRegions(row) {
  if (!osHasSelectedRegions()) return true;
  return osParseMUs(row.management_units).some(mu => osSelectedRegions.has(osWMURegion(mu)));
}
function osRowHasAnyWMUInRegion(row, regionKey) {
  if (!regionKey) return true;
  return osParseMUs(row.management_units).some(mu => osWMURegion(mu) === String(regionKey));
}
function osRegionRows(regionKey, opts={}) {
  const n = osRegionNumberFromKey(regionKey);
  return BC_OS_DATA.filter(r => r.region === n && osRowHasAnyWMUInRegion(r, regionKey) && osRowPassesGlobalFilters(r, !!opts.ignoreSpecies));
}
function osSelectedRegionsRows(opts={}) {
  if (!osHasSelectedRegions()) return BC_OS_DATA.filter(r => osRowPassesGlobalFilters(r, !!opts.ignoreSpecies));
  return BC_OS_DATA.filter(r => osRowHasAnyWMUInSelectedRegions(r) && osRowPassesGlobalFilters(r, !!opts.ignoreSpecies));
}
function osPanelRows() {
  let rows = osSelectedRegionsRows();
  if (osSelectedOpportunity) rows = rows.filter(r => osRowsSameOpportunity(r, osSelectedOpportunity));
  if (osSelectedWMU) rows = rows.filter(r => osRowAppliesToWMU(r, osSelectedWMU));
  return osSortRows(rows);
}
function osRowsForRegionNoPanelFilter(regionKey) {
  const n = osRegionNumberFromKey(regionKey);
  return BC_OS_DATA.filter(r => r.region === n && osRowHasAnyWMUInRegion(r, regionKey));
}
function osActiveRegions() {
  const active = new Set();
  let rows = BC_OS_DATA.filter(r => osRowPassesGlobalFilters(r));
  if (osSelectedOpportunity) rows = rows.filter(r => osRowsSameOpportunity(r, osSelectedOpportunity));
  rows.forEach(row => osParseMUs(row.management_units).forEach(mu => {
    const rid = osWMURegion(mu);
    if (OS_REGION_LABELS[rid]) active.add(rid);
  }));
  return active;
}
function osActiveWMUs() {
  const active = new Set();
  if (!osHasSelectedRegions()) return active;
  let rows = osSelectedRegionsRows();
  if (osSelectedOpportunity) rows = rows.filter(r => osRowsSameOpportunity(r, osSelectedOpportunity));
  rows.forEach(row => osParseMUs(row.management_units).forEach(mu => {
    const id = osNormalizeWMU(mu);
    if (osSelectedRegionContainsWMU(id)) active.add(id);
  }));
  return active;
}
function osWMUsForRows(rows) {
  const s = new Set();
  (rows || []).forEach(r => osParseMUs(r.management_units).forEach(mu => {
    const id = osNormalizeWMU(mu);
    if (!osHasSelectedRegions() || osSelectedRegions.has(osWMURegion(id))) s.add(id);
  }));
  return [...s].sort((a,b)=>a.localeCompare(b, undefined, { numeric:true }));
}
function osRegionsForRows(rows) {
  const s = new Set();
  (rows || []).forEach(r => osParseMUs(r.management_units).forEach(mu => {
    const rid = osWMURegion(mu);
    if (OS_REGION_LABELS[rid]) s.add(rid);
  }));
  return [...s].sort((a,b)=>osRegionSortValue(a)-osRegionSortValue(b));
}

function osBuildFilters() {
  const sp = document.getElementById('osSpeciesSel');
  if (sp) {
    const current = osSelSpecies || sp.value || '';
    const all = [...new Set(BC_OS_DATA.map(r => r.species))];
    const big = OS_BIG_ORDER.filter(s => all.includes(s));
    const small = all.filter(s => !OS_BIG_GAME.has(s)).sort((a,b)=>a.localeCompare(b));
    sp.innerHTML = '<option value="">Choose species or select region</option>' +
      (big.length ? `<optgroup label="Big Game">${big.map(s => `<option value="${osEscape(s)}">${osEscape(s)}</option>`).join('')}</optgroup>` : '') +
      (small.length ? `<optgroup label="Small Game & Birds">${small.map(s => `<option value="${osEscape(s)}">${osEscape(s)}</option>`).join('')}</optgroup>` : '');
    sp.value = current;
  }
  const mt = document.getElementById('osMethodSel');
  if (mt) {
    const current = osSelMethod || mt.value || '';
    const methods = [...new Set(BC_OS_DATA.map(r => r.weapon_type || 'Rifle'))]
      .sort((a,b)=>osMethodDisplayName(a).localeCompare(osMethodDisplayName(b)));
    const extra = methods.some(m => /bow|archery/i.test(m)) ? '' : '<option value="Bow Only">Archery / Bow Only</option>';
    mt.innerHTML = '<option value="">All methods</option>' + extra + methods.map(m => `<option value="${osEscape(m)}">${osEscape(osMethodDisplayName(m))}</option>`).join('');
    mt.value = current;
  }
  const mo = document.getElementById('osMonthSel');
  if (mo) {
    const current = osSelMonth || mo.value || '';
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    mo.innerHTML = '<option value="">Any month</option>' + months.map((m,i) => `<option value="${i+1}">${m}</option>`).join('');
    mo.value = current;
  }
  osSyncFilterControls();
}
function osSyncFilterControls() {
  const sp = document.getElementById('osSpeciesSel'); if (sp) sp.value = osSelSpecies || '';
  const mt = document.getElementById('osMethodSel'); if (mt) mt.value = osSelMethod || '';
  const mo = document.getElementById('osMonthSel'); if (mo) mo.value = osSelMonth || '';
  const cb = document.getElementById('osMultiRegionMode'); if (cb) cb.checked = osMultiRegionMode;
}

function osAnyHighlightActive() { return !!(osSelSpecies || osSelectedOpportunity || osSelMethod || osSelMonth); }
function osWMUInteractionActive() { return osHasSelectedRegions() && !!(osSelSpecies || osSelectedOpportunity); }

function osAddMapLayers(wmuGeo, regGeo) {
  const map = osMapInstance;
  if (!map) return;
  if (!map.getSource(OS_WMU_SRC)) map.addSource(OS_WMU_SRC, { type:'geojson', data:wmuGeo, generateId:true });
  if (regGeo && !map.getSource(OS_REGION_SRC)) map.addSource(OS_REGION_SRC, { type:'geojson', data:regGeo, generateId:true });

  if (!map.getLayer(OS_REGION_FILL) && regGeo) {
    map.addLayer({ id: OS_REGION_FILL, type:'fill', source: OS_REGION_SRC, paint: {
      'fill-color': osRegionColorExpr('region_id'),
      'fill-opacity': ['case',
        ['boolean', ['feature-state','selected'], false], 0.42,
        ['boolean', ['feature-state','activeMatch'], false], 0.52,
        ['boolean', ['feature-state','noMatch'], false], 0.055,
        ['boolean', ['feature-state','dimmed'], false], 0.055,
        ['boolean', ['feature-state','hovered'], false], 0.48,
        0.36]
    }});
  }
  if (!map.getLayer(OS_REGION_LINE) && regGeo) {
    map.addLayer({ id: OS_REGION_LINE, type:'line', source: OS_REGION_SRC, paint: {
      'line-color': ['case',
        ['boolean', ['feature-state','activeMatch'], false], '#f0b429',
        ['boolean', ['feature-state','selected'], false], '#ffffff',
        ['boolean', ['feature-state','hovered'], false], '#ffffff',
        osRegionColorExpr('region_id')],
      'line-width': ['case',
        ['boolean', ['feature-state','activeMatch'], false], 4.4,
        ['boolean', ['feature-state','selected'], false], 4.8,
        ['boolean', ['feature-state','hovered'], false], 3.7,
        2.3],
      'line-opacity': ['case',
        ['boolean', ['feature-state','noMatch'], false], 0.24,
        ['boolean', ['feature-state','dimmed'], false], 0.24,
        0.96]
    }});
  }
  if (!map.getLayer(OS_REGION_HIT) && regGeo) {
    map.addLayer({ id: OS_REGION_HIT, type:'fill', source: OS_REGION_SRC, paint: { 'fill-color':'#000000', 'fill-opacity':0 } });
  }
  if (!map.getLayer(OS_WMU_FILL)) {
    map.addLayer({ id: OS_WMU_FILL, type:'fill', source: OS_WMU_SRC, paint: {
      'fill-color': ['case',
        ['boolean', ['feature-state','selectedWMU'], false], '#4ade80',
        ['boolean', ['feature-state','outsideRegion'], false], '#151918',
        ['boolean', ['feature-state','noMatch'], false], '#202624',
        osWMURegionColorExpr()],
      'fill-opacity': ['case',
        ['boolean', ['feature-state','wmuHidden'], false], 0,
        ['boolean', ['feature-state','selectedWMU'], false], 0.62,
        ['boolean', ['feature-state','outsideRegion'], false], 0.025,
        ['boolean', ['feature-state','activeMatch'], false], 0.46,
        ['boolean', ['feature-state','noMatch'], false], 0.09,
        ['boolean', ['feature-state','inRegion'], false], 0.28,
        0]
    }});
  }
  if (!map.getLayer(OS_WMU_LINE)) {
    map.addLayer({ id: OS_WMU_LINE, type:'line', source: OS_WMU_SRC, paint: {
      'line-color': ['case',
        ['boolean', ['feature-state','selectedWMU'], false], '#ffffff',
        ['boolean', ['feature-state','activeMatch'], false], '#f0b429',
        ['boolean', ['feature-state','inRegion'], false], 'rgba(255,255,255,0.28)',
        'rgba(255,255,255,0.08)'],
      'line-width': ['case',
        ['boolean', ['feature-state','wmuHidden'], false], 0,
        ['boolean', ['feature-state','selectedWMU'], false], 3.7,
        ['boolean', ['feature-state','activeMatch'], false], 3.1,
        ['boolean', ['feature-state','inRegion'], false], 0.55,
        0],
      'line-opacity': ['case',
        ['boolean', ['feature-state','wmuHidden'], false], 0,
        ['boolean', ['feature-state','selectedWMU'], false], 1,
        ['boolean', ['feature-state','activeMatch'], false], 1,
        ['boolean', ['feature-state','inRegion'], false], 0.50,
        0]
    }});
  }
  osBindMapEvents();
  osRefreshMapStates();
  osApplyOverlayOpacity(osOverlayVisibility);
  osFitBC();
}

function osBindMapEvents() {
  const map = osMapInstance;
  if (!map || map._osEventsBoundV5) return;
  map._osEventsBoundV5 = true;

  const regionLayers = [OS_REGION_HIT, OS_REGION_FILL, OS_REGION_LINE].filter(id => map.getLayer(id));
  regionLayers.forEach(layerId => {
    map.on('mousemove', layerId, e => {
      if (!e.features?.length) return;
      const f = e.features[0];
      const rid = String(f.properties?.region_id || '');
      if (osHoveredRegion !== null && osHoveredRegion !== f.id) map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false });
      osHoveredRegion = f.id;
      map.setFeatureState({ source: OS_REGION_SRC, id:f.id }, { hovered:true });
      map.getCanvas().style.cursor = 'pointer';
      const rRows = osRowsForRegionNoPanelFilter(rid).filter(r => osRowPassesGlobalFilters(r));
      const speciesCount = [...new Set(rRows.map(r => r.species))].length;
      const selected = osRegionIsSelected(rid) ? '<br><span style="font-size:11px;color:#f0b429">Selected · tap again to remove</span>' : '<br><span style="font-size:11px;color:#777">Tap to select the full region</span>';
      osShowTooltip(e, `<b style="color:${osRegionColor(rid)}">${osEscape(osRegionName(rid))}</b><br><span style="font-size:11px;color:#aaa">${speciesCount} species/categories · ${rRows.length} season rows</span>${selected}`);
    });
    map.on('mouseleave', layerId, () => {
      if (osHoveredRegion !== null) map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false });
      osHoveredRegion = null;
      map.getCanvas().style.cursor = '';
      osHideTooltip();
    });
    map.on('click', layerId, e => {
      if (!e.features?.length) return;
      // Region hit is disabled in WMU detail mode, but keep a guard so WMU clicks win.
      if (osWMUInteractionActive() && layerId === OS_REGION_HIT) return;
      e.originalEvent._osHandledClick = true;
      const rid = String(e.features[0].properties?.region_id || '');
      if (rid) osToggleRegionSelection(rid);
    });
  });

  map.on('mousemove', OS_WMU_FILL, e => {
    if (!osWMUInteractionActive() || !e.features?.length) return;
    const f = e.features[0];
    const id = osNormalizeWMU(f.properties?.wmu_id);
    if (!osSelectedRegionContainsWMU(id)) return;
    if (osHoveredWMU !== null && osHoveredWMU !== f.id) map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false });
    osHoveredWMU = f.id;
    map.setFeatureState({ source: OS_WMU_SRC, id:f.id }, { hovered:true });
    map.getCanvas().style.cursor = 'pointer';
    osShowTooltip(e, osTooltipForWMU(id));
  });
  map.on('mouseleave', OS_WMU_FILL, () => {
    if (osHoveredWMU !== null) map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false });
    osHoveredWMU = null;
    map.getCanvas().style.cursor = '';
    osHideTooltip();
  });
  map.on('click', OS_WMU_FILL, e => {
    if (!osWMUInteractionActive() || !e.features?.length) return;
    e.originalEvent._osHandledClick = true;
    const id = osNormalizeWMU(e.features[0].properties?.wmu_id);
    if (!osSelectedRegionContainsWMU(id)) return;
    const active = osActiveWMUs();
    if (active.size && !active.has(id)) return;
    osSelectWMU(id);
  });

  map.on('click', e => {
    if (e.originalEvent?._osHandledClick) return;
    if (osHasSelectedRegions()) {
      osSelectedRegions.clear();
      osSyncSelectedRegionVar();
      osSelectedWMU = null;
      osRefreshMapStates();
      osRenderPanel();
      osFitBC();
    } else {
      osFitBC();
    }
  });
}

function osTooltipForWMU(id) {
  const rows = osSelectedRegionsRows().filter(r => (!osSelectedOpportunity || osRowsSameOpportunity(r, osSelectedOpportunity)) && osRowAppliesToWMU(r, id));
  const species = [...new Set(rows.map(r => r.species))];
  const sp = species.length ? species.slice(0,4).map(osEscape).join(', ') + (species.length > 4 ? ` +${species.length - 4} more` : '') : 'No rows match current filters';
  return `<b style="color:#f0b429">WMU ${osEscape(id)}</b><br><span style="font-size:11px;color:#aaa">${rows.length} season row${rows.length === 1 ? '' : 's'} · ${sp}</span>`;
}

function osRefreshMapStates() {
  const map = osMapInstance;
  if (!map || !map.getSource(OS_WMU_SRC)) return;
  const wmuGeo = (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON);
  const regGeo = (typeof BC_REGION_GEOJSON !== 'undefined') ? BC_REGION_GEOJSON : null;
  const activeWMUs = osActiveWMUs();
  const activeRegions = osActiveRegions();
  const selectedKeys = osSelectedRegionKeys();
  const hasRegion = selectedKeys.length > 0;
  const hasHighlight = osAnyHighlightActive();
  const showWMUs = hasRegion && !!(osSelSpecies || osSelectedOpportunity);

  (wmuGeo?.features || []).forEach((feat, i) => {
    const id = osNormalizeWMU(feat.properties?.wmu_id);
    const reg = osWMURegion(id);
    const inRegion = hasRegion && osSelectedRegions.has(reg);
    const activeMatch = showWMUs && inRegion && activeWMUs.has(id);
    map.setFeatureState({ source: OS_WMU_SRC, id:i }, {
      wmuHidden: !showWMUs,
      provinceMode: !showWMUs,
      inRegion: !!inRegion,
      outsideRegion: !!(hasRegion && !inRegion),
      noMatch: !!(showWMUs && inRegion && !activeWMUs.has(id)),
      activeMatch: !!activeMatch,
      selectedWMU: !!(osSelectedWMU && id === osSelectedWMU),
      hovered:false
    });
  });

  (regGeo?.features || []).forEach((feat, i) => {
    const rid = String(feat.properties?.region_id || '');
    const selected = osSelectedRegions.has(rid);
    const provinceActive = !hasRegion && hasHighlight && activeRegions.has(rid);
    const provinceNoMatch = !hasRegion && hasHighlight && !activeRegions.has(rid);
    map.setFeatureState({ source: OS_REGION_SRC, id:i }, {
      selected,
      dimmed: !!(hasRegion && !selected),
      activeMatch: !!(provinceActive || (hasRegion && selected && hasHighlight && !showWMUs)),
      noMatch: !!provinceNoMatch,
      hovered:false
    });
  });

  if (map.getLayer(OS_REGION_FILL)) map.setLayoutProperty(OS_REGION_FILL, 'visibility', 'visible');
  if (map.getLayer(OS_REGION_LINE)) map.setLayoutProperty(OS_REGION_LINE, 'visibility', 'visible');
  if (map.getLayer(OS_REGION_HIT)) map.setLayoutProperty(OS_REGION_HIT, 'visibility', showWMUs ? 'none' : 'visible');
  osUpdateMapStatus();
  osApplyOverlayOpacity(osOverlayVisibility);
}

function osUpdateMapStatus() {
  const el = document.getElementById('osMapStatus');
  if (!el) return;
  if (!osHasSelectedRegions()) {
    if (osSelectedOpportunity) {
      const lab = osOpportunityLabel(osSelectedOpportunity);
      const regs = osActiveRegions().size;
      el.innerHTML = `<b>${osEscape(lab.species)} · ${osEscape(lab.cls)}</b><span>${regs} matching region${regs === 1 ? '' : 's'} highlighted with gold borders. Select a region to see WMUs and dates.</span>`;
    } else if (osSelSpecies || osSelMethod || osSelMonth) {
      const regs = osActiveRegions().size;
      const label = osSelSpecies || (osSelMethod ? osMethodDisplayName(osSelMethod) : 'Filtered opportunities');
      el.innerHTML = `<b>${osEscape(label)}</b><span>${regs} matching region${regs === 1 ? '' : 's'} highlighted. Regions without it are dimmed.</span>`;
    } else {
      el.innerHTML = `<b>Select a hunting region</b><span>WMUs are merged at this step. Tap a full coloured region, or choose a species first to preview regions.</span>`;
    }
    return;
  }
  const label = osSelectedRegionLabel();
  const rows = osPanelRows();
  if (osSelectedWMU) el.innerHTML = `<b>WMU ${osEscape(osSelectedWMU)}</b><span>${osEscape(label)} · ${rows.length} matching season row${rows.length === 1 ? '' : 's'}</span>`;
  else if (osSelectedOpportunity) {
    const lab = osOpportunityLabel(osSelectedOpportunity);
    el.innerHTML = `<b>${osEscape(lab.species)} · ${osEscape(lab.cls)}</b><span>${osWMUsForRows(rows).length} matching WMUs in ${osEscape(label)}</span>`;
  } else if (osSelSpecies) el.innerHTML = `<b>${osEscape(osSelSpecies)}</b><span>${osWMUsForRows(rows).length} matching WMUs in ${osEscape(label)}</span>`;
  else el.innerHTML = `<b>${osEscape(label)}</b><span>Choose a species or exact opportunity from the right panel to reveal matching WMUs.</span>`;
}

function osFitBC(animated=false) {
  if (!osMapInstance) return;
  osMapInstance.fitBounds([[-139.3,48.1],[-113.8,60.2]], { padding: 24, duration: animated ? 600 : 0, bearing:0, pitch: osTerrain3D ? osMapInstance.getPitch() : 0 });
}
function osFitRegions(regionKeys) {
  if (!osMapInstance) return;
  const regGeo = (typeof BC_REGION_GEOJSON !== 'undefined') ? BC_REGION_GEOJSON : null;
  const keys = (regionKeys || osSelectedRegionKeys()).map(String);
  if (!keys.length) { osFitBC(true); return; }
  const feats = (regGeo?.features || []).filter(x => keys.includes(String(x.properties?.region_id)));
  const boxes = feats.map(osFeatureBBox).filter(Boolean);
  if (!boxes.length) return;
  const b = [Math.min(...boxes.map(x=>x[0])), Math.min(...boxes.map(x=>x[1])), Math.max(...boxes.map(x=>x[2])), Math.max(...boxes.map(x=>x[3]))];
  osMapInstance.fitBounds([[b[0],b[1]],[b[2],b[3]]], { padding: { top: 100, bottom: 60, left: 60, right: 450 }, maxZoom: keys.length === 1 ? 8.8 : 7.4, duration: 900 });
}
function osFitRegion(regionKey) { osFitRegions([regionKey]); }
function osFitSelectionOrBC() { osHasSelectedRegions() ? osFitRegions() : osFitBC(true); }
function osZoomToRows(rows) {
  if (!osMapInstance) return;
  const wmus = new Set(osWMUsForRows(rows || osPanelRows()));
  const wmuGeo = (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON);
  const feats = (wmuGeo?.features || []).filter(f => wmus.has(osNormalizeWMU(f.properties?.wmu_id)));
  if (!feats.length) return;
  const boxes = feats.map(osFeatureBBox).filter(Boolean);
  const b = [Math.min(...boxes.map(x=>x[0])), Math.min(...boxes.map(x=>x[1])), Math.max(...boxes.map(x=>x[2])), Math.max(...boxes.map(x=>x[3]))];
  osMapInstance.fitBounds([[b[0],b[1]],[b[2],b[3]]], { padding: { top:95, bottom:70, left:70, right:450 }, maxZoom: 10.3, duration: 850 });
}

function osToggleRegionSelection(regionKey) {
  const key = String(regionKey || '');
  if (!key) return;
  if (osMultiRegionMode) {
    if (osSelectedRegions.has(key)) osSelectedRegions.delete(key);
    else osSelectedRegions.add(key);
  } else {
    if (osSelectedRegions.size === 1 && osSelectedRegions.has(key)) osSelectedRegions.clear();
    else osSelectedRegions = new Set([key]);
  }
  osSyncSelectedRegionVar();
  osSelectedWMU = null;
  osRefreshMapStates();
  osRenderPanel();
  osFitSelectionOrBC();
}
function osSelectRegion(regionKey) { osToggleRegionSelection(regionKey); }
function osSelectWMU(wmu) {
  const id = osNormalizeWMU(wmu);
  if (!osSelectedRegionContainsWMU(id)) return;
  osSelectedWMU = id;
  osRefreshMapStates();
  osRenderPanel();
}
function osSelectSpecies(species) {
  const next = String(species || '');
  osSelSpecies = (osSelSpecies === next) ? '' : next;
  osSelectedOpportunity = '';
  osSelectedWMU = null;
  osSyncFilterControls();
  osRefreshMapStates();
  osRenderPanel();
  if (osHasSelectedRegions() && osSelSpecies) osZoomToRows(osPanelRows());
  else if (osHasSelectedRegions()) osFitRegions();
  else osFitBC(true);
}
function osSelectOpportunity(key) {
  const next = String(key || '');
  if (osSelectedOpportunity === next) {
    osSelectedOpportunity = '';
  } else {
    osSelectedOpportunity = next;
    const lab = osOpportunityLabel(osSelectedOpportunity);
    osSelSpecies = lab.species || osSelSpecies;
  }
  osSelectedWMU = null;
  osSyncFilterControls();
  osRefreshMapStates();
  osRenderPanel();
  if (osHasSelectedRegions() && osSelectedOpportunity) osZoomToRows(osPanelRows());
  else if (osHasSelectedRegions()) osFitRegions();
  else osFitBC(true);
}
function osOnSpecies(v) { osSelectSpecies(v); }
function osOnMethod(v) { osSelMethod = v || ''; osSelectedWMU = null; osSelectedOpportunity = ''; osRefreshMapStates(); osRenderPanel(); if (!osHasSelectedRegions()) osFitBC(true); }
function osOnMonth(v) { osSelMonth = v || ''; osSelectedWMU = null; osSelectedOpportunity = ''; osRefreshMapStates(); osRenderPanel(); if (!osHasSelectedRegions()) osFitBC(true); }
function osClearFilters() { osSelSpecies = ''; osSelMonth = ''; osSelMethod = ''; osSelectedOpportunity = ''; osSelectedWMU = null; osSyncFilterControls(); osRefreshMapStates(); osRenderPanel(); if (!osHasSelectedRegions()) osFitBC(true); }
function osBackToProvince() { osSelectedRegions.clear(); osSyncSelectedRegionVar(); osSelectedWMU = null; osRefreshMapStates(); osRenderPanel(); osFitBC(true); }
function osClearWMU() { osSelectedWMU = null; osRefreshMapStates(); osRenderPanel(); }

function osCrumbsHTML() {
  if (!osHasSelectedRegions()) return `<span>BC</span>`;
  let html = `<button type="button" onclick="osBackToProvince()">BC</button><span>/</span><span>${osEscape(osSelectedRegionLabel())}</span>`;
  if (osSelSpecies) html += `<span>/</span><button type="button" onclick="osSelectSpecies(${osJsArg(osSelSpecies)})">${osEscape(osSelSpecies)}</button>`;
  if (osSelectedOpportunity) { const lab = osOpportunityLabel(osSelectedOpportunity); html += `<span>/</span><span>${osEscape(lab.cls)}</span>`; }
  if (osSelectedWMU) html += `<span>/</span><span>WMU ${osEscape(osSelectedWMU)}</span>`;
  return html;
}
function osRenderPanel() {
  const panel = document.getElementById('osResultsPanel');
  const title = document.getElementById('osPanelTitle');
  const count = document.getElementById('osPanelCount');
  const crumbs = document.getElementById('osCrumbs');
  if (!panel) return;
  const rows = osPanelRows();
  if (title) title.textContent = osHasSelectedRegions() ? osSelectedRegionLabel() : (osSelSpecies ? `${osSelSpecies} across BC` : 'BC General Open Seasons');
  if (count) count.textContent = osHasSelectedRegions() ? `${rows.length} season rows` : (osAnyHighlightActive() ? `${rows.length} matching rows` : 'Select a region');
  if (crumbs) crumbs.innerHTML = osCrumbsHTML();
  if (!osHasSelectedRegions()) { panel.innerHTML = osProvincePanel(); return; }
  if (osSelectedWMU) { panel.innerHTML = osWMUPanel(rows); return; }
  if (osSelectedOpportunity) { panel.innerHTML = osOpportunityPanel(rows); return; }
  if (osSelSpecies) { panel.innerHTML = osSpeciesPanel(rows); return; }
  panel.innerHTML = osRegionPanel(rows);
}
function osProvincePanel() {
  const rows = osPanelRows();
  const activeRegs = osActiveRegions();
  const cards = Object.keys(OS_REGION_LABELS).sort((a,b)=>osRegionSortValue(a)-osRegionSortValue(b)).map(key => {
    const rRows = osRowsForRegionNoPanelFilter(key).filter(r => osRowPassesGlobalFilters(r));
    const species = [...new Set(rRows.map(r => r.species))].length;
    const wmus = new Set();
    rRows.forEach(r => osParseMUs(r.management_units).forEach(mu => { if (osWMURegion(mu) === String(key)) wmus.add(mu); }));
    const isMatch = osAnyHighlightActive() && activeRegs.has(key);
    const selected = osRegionIsSelected(key);
    return `<button class="os-region-card${isMatch ? ' matching' : ''}${selected ? ' selected' : ''}" type="button" onclick="osSelectRegion('${key}')" style="border-left:4px solid ${osRegionColor(key)}">
      <strong>${osEscape(osRegionName(key))}</strong>
      <span>${wmus.size} WMUs · ${rRows.length} matching rows · ${species} species/categories</span>
    </button>`;
  }).join('');
  const intro = osAnyHighlightActive()
    ? `<div class="os-region-summary"><b>${osSelectedOpportunity ? osEscape(osOpportunityLabel(osSelectedOpportunity).species + ' · ' + osOpportunityLabel(osSelectedOpportunity).cls) : osEscape(osSelSpecies || (osSelMethod ? osMethodDisplayName(osSelMethod) : 'Filtered opportunities'))}</b><span>${activeRegs.size} regions have matching General Open Season rows. Gold borders on the map show where this applies.</span></div>`
    : `<div class="os-empty"><h3>Select a full region from the map</h3><p>WMUs are hidden/merged at this step so the province view stays clean. Select a region, or choose a species above to preview where it exists.</p></div>`;
  return `${intro}<div class="os-region-grid">${cards}</div><div class="os-panel-section-title">Species / opportunity explorer</div>${osOpportunityList(rows)}`;
}
function osRegionPanel(rows) {
  const speciesCount = [...new Set(rows.map(r => r.species))].length;
  return `<div class="os-region-summary"><b>Everything huntable in ${osEscape(osSelectedRegionLabel())}</b><span>${speciesCount} species/categories · ${rows.length} General Open Season rows. Choose a species or exact opportunity below to highlight matching WMUs.</span></div>${osOpportunityList(rows)}`;
}
function osSpeciesPanel(rows) {
  const wmus = osWMUsForRows(rows);
  return `<div class="os-region-summary"><b>${osEscape(osSelSpecies)} in ${osEscape(osSelectedRegionLabel())}</b><span>${wmus.length} matching WMUs. Gold outlines on the map show every WMU with this species in the selected region set.</span></div>${osWmuChips(wmus)}${osRowsGroupedByOpportunity(rows)}`;
}
function osOpportunityPanel(rows) {
  const lab = osOpportunityLabel(osSelectedOpportunity);
  const wmus = osWMUsForRows(rows);
  return `<div class="os-region-summary"><b>${osEscape(lab.species)} · ${osEscape(lab.cls)}</b><span>${osEscape(lab.season)} · ${wmus.length} matching WMUs. Tap a highlighted WMU for exact area details.</span></div>${osWmuChips(wmus)}${osRowsGroupedByWMU(rows)}`;
}
function osWMUPanel(rows) {
  const all = osSortRows(BC_OS_DATA.filter(r => osRowHasAnyWMUInSelectedRegions(r) && osRowPassesGlobalFilters(r, true) && osRowAppliesToWMU(r, osSelectedWMU)));
  const primary = rows.length ? rows : all.filter(r => !osSelSpecies || r.species === osSelSpecies);
  const other = all.filter(r => !primary.includes(r));
  return `<div class="os-region-summary"><b>WMU ${osEscape(osSelectedWMU)}</b><span>${osEscape(osSelectedRegionLabel())}. Selected opportunity is shown first. Other species are collapsed below.</span></div>${osSeasonCards(primary, 'primary')}${other.length ? osCollapsibleBlock('Other species in this WMU', `${other.length} additional rows`, osSeasonCards(other, 'other'), false) : ''}`;
}
function osRowsGroupedByWMU(rows) {
  const by = new Map();
  rows.forEach(row => osParseMUs(row.management_units).forEach(mu => {
    const id = osNormalizeWMU(mu);
    if (osHasSelectedRegions() && !osSelectedRegions.has(osWMURegion(id))) return;
    if (!by.has(id)) by.set(id, []);
    by.get(id).push(row);
  }));
  return [...by.entries()].sort((a,b)=>a[0].localeCompare(b[0], undefined, { numeric:true })).map(([mu, rs]) => {
    return `<div class="os-wmu-card">
      <button type="button" class="os-wmu-head" onclick="osSelectWMU('${osEscape(mu)}')">
        <span><strong>WMU ${osEscape(mu)}</strong><em>${rs.length} season row${rs.length === 1 ? '' : 's'}</em></span><span>View exact</span>
      </button>
      <div class="os-wmu-body">${osSeasonCards(rs, 'wmu-' + mu.replace(/[^a-z0-9]/ig,'-'))}</div>
    </div>`;
  }).join('');
}
function osSeasonCards(rows, prefix) {
  const bySpecies = {};
  osSortRows(rows).forEach(r => { (bySpecies[r.species] ||= []).push(r); });
  return osSortedSpeciesForRows(rows).map((sp, i) => {
    const rs = bySpecies[sp] || [];
    const bodyId = `${prefix || 'card'}-osbody-${i}-${String(sp).replace(/[^a-z0-9]+/ig,'-')}`;
    const shouldOpen = osSelSpecies === sp || prefix === 'primary';
    return `<div class="os-season-card">
      <button type="button" class="os-season-head" onclick="osToggleCard('${bodyId}')">
        <span><strong>${osEscape(sp)}</strong><em>${rs.length} row${rs.length === 1 ? '' : 's'}</em></span><span class="os-chevron">⌄</span>
      </button>
      <div class="os-season-body" id="${bodyId}" style="display:${shouldOpen ? 'block' : 'none'}">${rs.map(osSeasonRowHTML).join('')}</div>
    </div>`;
  }).join('');
}
function osRowsGroupedByOpportunity(rows, compact=false) {
  const by = new Map();
  rows.forEach(r => { const key = osOpportunityKey(r); if (!by.has(key)) by.set(key, []); by.get(key).push(r); });
  return [...by.entries()].map(([key, rs]) => {
    const lab = osOpportunityLabel(key);
    const wmus = osWMUsForRows(rs).length;
    const regs = osRegionsForRows(rs).length;
    const unitLabel = osHasSelectedRegions() ? `${wmus} WMUs` : `${regs} regions`;
    return `<button class="os-opportunity-row${compact ? ' compact' : ''}${osSelectedOpportunity === key ? ' active' : ''}" type="button" onclick="osSelectOpportunity(${osJsArg(key)})">
      <span><b>${osEscape(lab.cls || 'Any')}</b><em>${osEscape(lab.season)} · ${osEscape(osMethodDisplayName(lab.method))} · ${unitLabel}</em></span>
      <span class="os-gold-dot"></span>
    </button>`;
  }).join('');
}
function osOpportunityList(rows) {
  const bySpecies = {};
  rows.forEach(r => { (bySpecies[r.species] ||= []).push(r); });
  return osSortedSpeciesForRows(rows).map(sp => {
    const rs = osSortRows(bySpecies[sp] || []);
    const wmus = osWMUsForRows(rs).length;
    const regs = osRegionsForRows(rs).length;
    const open = osSelSpecies === sp;
    const bodyId = 'ossp-' + String(sp).replace(/[^a-z0-9]+/ig,'-');
    const sub = osHasSelectedRegions() ? `${wmus} WMUs · ${rs.length} season rows` : `${regs} regions · ${rs.length} season rows`;
    return `<div class="os-species-group${open ? ' active' : ''}">
      <button class="os-species-head" type="button" onclick="osSelectSpecies(${osJsArg(sp)})">
        <span><strong>${osEscape(sp)}</strong><em>${sub}</em></span><span>${open ? 'Selected' : 'Highlight'}</span>
      </button>
      <div class="os-opportunity-list" id="${bodyId}" style="display:${open ? 'grid' : 'none'}">${osRowsGroupedByOpportunity(rs, true)}</div>
    </div>`;
  }).join('');
}

function osSetOverlayOpacity(val) {
  const n = Number(val == null ? 1 : val);
  osOverlayVisibility = Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
  osApplyOverlayOpacity(osOverlayVisibility);
  const r = document.getElementById('osOpacityRange'); if (r) r.value = String(osOverlayVisibility);
  const lab = document.getElementById('osOpacityValue'); if (lab) lab.textContent = Math.round(osOverlayVisibility * 100) + '%';
}
function osApplyOverlayOpacity(m) {
  if (!osMapInstance) return;
  m = Math.max(0, Math.min(1, Number(m == null ? 1 : m)));
  try {
    if (osMapInstance.getLayer(OS_WMU_FILL)) {
      osMapInstance.setPaintProperty(OS_WMU_FILL, 'fill-opacity', ['case',
        ['boolean', ['feature-state','wmuHidden'], false], 0,
        ['boolean', ['feature-state','selectedWMU'], false], 0.62 * m,
        ['boolean', ['feature-state','outsideRegion'], false], 0.025 * m,
        ['boolean', ['feature-state','activeMatch'], false], 0.46 * m,
        ['boolean', ['feature-state','noMatch'], false], 0.09 * m,
        ['boolean', ['feature-state','inRegion'], false], 0.28 * m,
        0]);
    }
    if (osMapInstance.getLayer(OS_WMU_LINE)) {
      osMapInstance.setPaintProperty(OS_WMU_LINE, 'line-opacity', ['case',
        ['boolean', ['feature-state','wmuHidden'], false], 0,
        ['boolean', ['feature-state','selectedWMU'], false], Math.max(m, .35),
        ['boolean', ['feature-state','activeMatch'], false], Math.max(m, .45),
        ['boolean', ['feature-state','inRegion'], false], 0.50 * m,
        0]);
    }
    if (osMapInstance.getLayer(OS_REGION_FILL)) {
      osMapInstance.setPaintProperty(OS_REGION_FILL, 'fill-opacity', ['case',
        ['boolean', ['feature-state','selected'], false], 0.42 * m,
        ['boolean', ['feature-state','activeMatch'], false], 0.52 * m,
        ['boolean', ['feature-state','noMatch'], false], 0.055 * m,
        ['boolean', ['feature-state','dimmed'], false], 0.055 * m,
        ['boolean', ['feature-state','hovered'], false], 0.48 * m,
        0.36 * m]);
    }
    if (osMapInstance.getLayer(OS_REGION_LINE)) {
      osMapInstance.setPaintProperty(OS_REGION_LINE, 'line-opacity', ['case',
        ['boolean', ['feature-state','noMatch'], false], 0.24 * Math.max(m, .30),
        ['boolean', ['feature-state','dimmed'], false], 0.24 * Math.max(m, .30),
        0.96 * Math.max(m, .40)]);
    }
  } catch(e) { console.warn('[GOS opacity]', e); }
}
function osInjectMapControls() {
  const wrap = document.querySelector('.os-map-wrap');
  if (!wrap || document.getElementById('osMapControls')) return;
  const div = document.createElement('div');
  div.id = 'osMapControls';
  div.className = 'os-map-controls full-style collapsed';
  div.innerHTML = `
    <button type="button" id="osControlsToggle" class="os-controls-toggle" onclick="osToggleControlTray()">Map Tools</button>
    <div id="osControlsTray" class="os-control-tray">
      <button type="button" id="osTile_streets" onclick="osSetTile('streets')">Streets</button>
      <button type="button" id="osTile_satellite" onclick="osSetTile('satellite')">Satellite</button>
      <button type="button" id="osTile_topo" onclick="osSetTile('topo')">Topo</button>
      <button type="button" id="os3DBtn" onclick="osToggle3D()">3D</button>
      <label class="os-opacity-control"><span>Opacity</span><input id="osOpacityRange" type="range" min="0" max="1" step="0.05" value="1" oninput="osSetOverlayOpacity(this.value)"><b id="osOpacityValue">100%</b></label>
      <button type="button" id="osFullscreenBtn" onclick="osToggleFullscreen()">⛶</button>
    </div>`;
  wrap.appendChild(div);
  osSyncTileButtons();
}
function osSyncTileButtons() {
  ['streets','satellite','topo'].forEach(t => document.getElementById('osTile_' + t)?.classList.toggle('active', osMapStyle === t));
  document.getElementById('os3DBtn')?.classList.toggle('active', osTerrain3D);
  const r = document.getElementById('osOpacityRange'); if (r) r.value = String(osOverlayVisibility);
  const lab = document.getElementById('osOpacityValue'); if (lab) lab.textContent = Math.round(osOverlayVisibility * 100) + '%';
}
function osToggleFullscreen() {
  const page = document.querySelector('.os-page');
  if (!page) return;
  osIsFullscreen = !osIsFullscreen;
  page.classList.toggle('is-fullscreen', osIsFullscreen);
  document.body.style.overflow = osIsFullscreen ? 'hidden' : '';
  const b = document.getElementById('osFullscreenBtn');
  if (b) b.textContent = osIsFullscreen ? '✕' : '⛶';
  setTimeout(() => osMapInstance && osMapInstance.resize(), 80);
}

function initOpenSeasonsPage() {
  osBuildFilters();
  osSyncSelectedRegionVar();
  osRenderPanel();
  setTimeout(() => {
    osInitMap();
    if (osMapInstance) { osMapInstance.resize(); osRefreshMapStates(); }
  }, 80);
}

Object.assign(window, {
  initOpenSeasonsPage, osOnSpecies, osOnMethod, osOnMonth, osClearFilters,
  osBackToProvince, osClearWMU, osSelectRegion, osSelectWMU, osSelectSpecies,
  osSelectOpportunity, osToggleCard, osSetTile, osToggleControlTray,
  osToggleFilterPanel, osCloseFilterPanel, osToggle3D, osZoomToRows,
  osSetOverlayOpacity, osToggleFullscreen, osSetMultiRegionMode
});

// ══════════════════════════════════════════════════════════════
// GOS V6 HARDENED UI + INTERACTION PATCH
// Region-select is map-first. WMUs are hidden until region + species/opportunity.
// The right panel, filters, and map tools start collapsed so the province map is dominant.
// ══════════════════════════════════════════════════════════════

let osPanelOpen = false;
let osUserClosedPanel = false;

function osEnsureProfessionalShell() {
  const wrap = document.querySelector('.os-map-wrap');
  const panel = document.querySelector('.os-panel');
  if (!wrap) return;

  if (!document.getElementById('osPanelToggle')) {
    const btn = document.createElement('button');
    btn.id = 'osPanelToggle';
    btn.type = 'button';
    btn.className = 'os-panel-toggle';
    btn.innerHTML = '<span>Open Seasons</span><b id="osPanelToggleCount">0</b>';
    btn.onclick = () => osSetPanelOpen(!osPanelOpen, true);
    wrap.appendChild(btn);
  }

  if (panel && !document.getElementById('osPanelCloseBtn')) {
    const top = panel.querySelector('.os-panel-top');
    if (top) {
      const close = document.createElement('button');
      close.id = 'osPanelCloseBtn';
      close.type = 'button';
      close.className = 'os-panel-close';
      close.textContent = '×';
      close.title = 'Collapse panel';
      close.onclick = () => osSetPanelOpen(false, true);
      top.appendChild(close);
    }
  }
}

function osSetPanelOpen(open, userAction=false) {
  osPanelOpen = !!open;
  if (userAction && !open) osUserClosedPanel = true;
  if (userAction && open) osUserClosedPanel = false;
  const panel = document.querySelector('.os-panel');
  const btn = document.getElementById('osPanelToggle');
  if (panel) panel.classList.toggle('open', osPanelOpen);
  if (btn) btn.classList.toggle('active', osPanelOpen);
  setTimeout(() => osMapInstance && osMapInstance.resize(), 90);
}

function osShouldAutoOpenPanel() {
  return osHasSelectedRegions() || !!osSelSpecies || !!osSelectedOpportunity || !!osSelectedWMU || !!osSelMethod || !!osSelMonth;
}

function osMaybeAutoPanel() {
  osEnsureProfessionalShell();
  if (osShouldAutoOpenPanel() && !osUserClosedPanel) osSetPanelOpen(true, false);
  if (!osShouldAutoOpenPanel()) { osUserClosedPanel = false; osSetPanelOpen(false, false); }
  const cnt = document.getElementById('osPanelToggleCount');
  const rows = osPanelRows ? osPanelRows() : [];
  if (cnt) cnt.textContent = osHasSelectedRegions() ? String(rows.length) : (osAnyHighlightActive() ? String(rows.length) : '');
}

// Add layers in a safer order: regions below WMU detail, transparent region hit on top.
function osAddMapLayers(wmuGeo, regGeo) {
  const map = osMapInstance;
  if (!map) return;
  if (!map.getSource(OS_WMU_SRC)) map.addSource(OS_WMU_SRC, { type:'geojson', data:wmuGeo, generateId:true });
  if (regGeo && !map.getSource(OS_REGION_SRC)) map.addSource(OS_REGION_SRC, { type:'geojson', data:regGeo, generateId:true });

  if (regGeo && !map.getLayer(OS_REGION_FILL)) {
    map.addLayer({ id: OS_REGION_FILL, type:'fill', source: OS_REGION_SRC, paint: {
      'fill-color': osRegionColorExpr('region_id'),
      'fill-opacity': ['case',
        ['boolean', ['feature-state','selected'], false], 0.46,
        ['boolean', ['feature-state','activeMatch'], false], 0.50,
        ['boolean', ['feature-state','noMatch'], false], 0.055,
        ['boolean', ['feature-state','dimmed'], false], 0.055,
        ['boolean', ['feature-state','hovered'], false], 0.44,
        0.34]
    }});
  }

  if (regGeo && !map.getLayer(OS_REGION_LINE)) {
    map.addLayer({ id: OS_REGION_LINE, type:'line', source: OS_REGION_SRC, paint: {
      'line-color': ['case',
        ['boolean', ['feature-state','activeMatch'], false], '#f0b429',
        ['boolean', ['feature-state','selected'], false], '#ffffff',
        ['boolean', ['feature-state','hovered'], false], '#ffffff',
        osRegionColorExpr('region_id')],
      'line-width': ['case',
        ['boolean', ['feature-state','activeMatch'], false], 4.0,
        ['boolean', ['feature-state','selected'], false], 4.3,
        ['boolean', ['feature-state','hovered'], false], 3.4,
        2.1],
      'line-opacity': ['case',
        ['boolean', ['feature-state','noMatch'], false], 0.24,
        ['boolean', ['feature-state','dimmed'], false], 0.24,
        0.92]
    }});
  }

  if (!map.getLayer(OS_WMU_FILL)) {
    map.addLayer({ id: OS_WMU_FILL, type:'fill', source: OS_WMU_SRC, paint: {
      'fill-color': ['case',
        ['boolean', ['feature-state','selectedWMU'], false], '#4ade80',
        ['boolean', ['feature-state','outsideRegion'], false], '#151918',
        ['boolean', ['feature-state','noMatch'], false], '#202624',
        ['boolean', ['feature-state','activeMatch'], false], osWMURegionColorExpr(),
        osWMURegionColorExpr()],
      'fill-opacity': ['case',
        ['boolean', ['feature-state','wmuHidden'], false], 0,
        ['boolean', ['feature-state','selectedWMU'], false], 0.64,
        ['boolean', ['feature-state','outsideRegion'], false], 0,
        ['boolean', ['feature-state','activeMatch'], false], 0.40,
        ['boolean', ['feature-state','noMatch'], false], 0.06,
        ['boolean', ['feature-state','inRegion'], false], 0.16,
        0]
    }});
  }

  if (!map.getLayer(OS_WMU_LINE)) {
    map.addLayer({ id: OS_WMU_LINE, type:'line', source: OS_WMU_SRC, paint: {
      'line-color': ['case',
        ['boolean', ['feature-state','selectedWMU'], false], '#ffffff',
        ['boolean', ['feature-state','activeMatch'], false], '#f0b429',
        ['boolean', ['feature-state','inRegion'], false], 'rgba(255,255,255,0.22)',
        'rgba(255,255,255,0.05)'],
      'line-width': ['case',
        ['boolean', ['feature-state','wmuHidden'], false], 0,
        ['boolean', ['feature-state','selectedWMU'], false], 3.6,
        ['boolean', ['feature-state','activeMatch'], false], 3.0,
        ['boolean', ['feature-state','inRegion'], false], 0.45,
        0],
      'line-opacity': ['case',
        ['boolean', ['feature-state','wmuHidden'], false], 0,
        ['boolean', ['feature-state','selectedWMU'], false], 1,
        ['boolean', ['feature-state','activeMatch'], false], 1,
        ['boolean', ['feature-state','inRegion'], false], 0.42,
        0]
    }});
  }

  // Invisible region hit layer must be last/top so province-mode clicks select full regions, not WMUs.
  if (regGeo && !map.getLayer(OS_REGION_HIT)) {
    map.addLayer({ id: OS_REGION_HIT, type:'fill', source: OS_REGION_SRC, paint: { 'fill-color':'#000000', 'fill-opacity':0 } });
  }

  osBindMapEvents();
  osRefreshMapStates();
  osApplyOverlayOpacity(osOverlayVisibility);
  osFitBC(false);
}

function osTopRegionFeatureAtPoint(point) {
  if (!osMapInstance || !osMapInstance.getLayer(OS_REGION_HIT)) return null;
  const hits = osMapInstance.queryRenderedFeatures(point, { layers: [OS_REGION_HIT, OS_REGION_LINE, OS_REGION_FILL].filter(id => osMapInstance.getLayer(id)) });
  return hits && hits.length ? hits[0] : null;
}

function osTopWMUFeatureAtPoint(point) {
  if (!osMapInstance || !osMapInstance.getLayer(OS_WMU_FILL)) return null;
  const hits = osMapInstance.queryRenderedFeatures(point, { layers: [OS_WMU_LINE, OS_WMU_FILL].filter(id => osMapInstance.getLayer(id)) });
  return hits && hits.length ? hits[0] : null;
}

function osBindMapEvents() {
  const map = osMapInstance;
  if (!map || map._osEventsBoundV6) return;
  map._osEventsBoundV6 = true;

  map.on('mousemove', e => {
    const wmuMode = osWMUInteractionActive();
    if (wmuMode) {
      const wf = osTopWMUFeatureAtPoint(e.point);
      if (wf) {
        const id = osNormalizeWMU(wf.properties?.wmu_id);
        if (osSelectedRegionContainsWMU(id)) {
          if (osHoveredWMU !== null && osHoveredWMU !== wf.id) map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false });
          osHoveredWMU = wf.id;
          map.setFeatureState({ source: OS_WMU_SRC, id:wf.id }, { hovered:true });
          map.getCanvas().style.cursor = 'pointer';
          osShowTooltip(e, osTooltipForWMU(id));
          return;
        }
      }
    }

    if (osHoveredWMU !== null) { map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false }); osHoveredWMU = null; }
    const rf = osTopRegionFeatureAtPoint(e.point);
    if (rf) {
      const rid = String(rf.properties?.region_id || '');
      if (osHoveredRegion !== null && osHoveredRegion !== rf.id) map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false });
      osHoveredRegion = rf.id;
      map.setFeatureState({ source: OS_REGION_SRC, id: rf.id }, { hovered:true });
      map.getCanvas().style.cursor = 'pointer';
      const rRows = osRowsForRegionNoPanelFilter(rid).filter(r => osRowPassesGlobalFilters(r));
      const speciesCount = [...new Set(rRows.map(r => r.species))].length;
      const selected = osRegionIsSelected(rid) ? '<br><span style="font-size:11px;color:#f0b429">Selected · tap again to remove</span>' : '<br><span style="font-size:11px;color:#777">Tap to select this full region</span>';
      osShowTooltip(e, `<b style="color:${osRegionColor(rid)}">${osEscape(osRegionName(rid))}</b><br><span style="font-size:11px;color:#aaa">${speciesCount} species/categories · ${rRows.length} season rows</span>${selected}`);
      return;
    }

    if (osHoveredRegion !== null) { map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false }); osHoveredRegion = null; }
    map.getCanvas().style.cursor = '';
    osHideTooltip();
  });

  map.on('mouseleave', () => {
    if (osHoveredWMU !== null) { map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false }); osHoveredWMU = null; }
    if (osHoveredRegion !== null) { map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false }); osHoveredRegion = null; }
    map.getCanvas().style.cursor = '';
    osHideTooltip();
  });

  map.on('click', e => {
    const wmuMode = osWMUInteractionActive();
    if (wmuMode) {
      const wf = osTopWMUFeatureAtPoint(e.point);
      if (wf) {
        const id = osNormalizeWMU(wf.properties?.wmu_id);
        if (osSelectedRegionContainsWMU(id)) {
          const active = osActiveWMUs();
          if (!active.size || active.has(id)) { osSelectWMU(id); return; }
        }
      }
    }

    const rf = osTopRegionFeatureAtPoint(e.point);
    if (rf) {
      const rid = String(rf.properties?.region_id || '');
      if (rid) { osToggleRegionSelection(rid); return; }
    }

    // Click outside the region/province features: reset to clean province view.
    if (osHasSelectedRegions()) {
      osSelectedRegions.clear();
      osSyncSelectedRegionVar();
      osSelectedWMU = null;
      osRefreshMapStates();
      osRenderPanel();
      osFitBC(true);
      return;
    }
    osFitBC(true);
  });
}

function osRefreshMapStates() {
  const map = osMapInstance;
  if (!map || !map.getSource(OS_WMU_SRC)) return;
  const wmuGeo = (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON);
  const regGeo = (typeof BC_REGION_GEOJSON !== 'undefined') ? BC_REGION_GEOJSON : null;
  const activeWMUs = osActiveWMUs();
  const activeRegions = osActiveRegions();
  const selectedKeys = osSelectedRegionKeys();
  const hasRegion = selectedKeys.length > 0;
  const hasHighlight = osAnyHighlightActive();
  const showWMUs = hasRegion && !!(osSelSpecies || osSelectedOpportunity);

  (wmuGeo?.features || []).forEach((feat, i) => {
    const id = osNormalizeWMU(feat.properties?.wmu_id);
    const reg = osWMURegion(id);
    const inRegion = hasRegion && osSelectedRegions.has(reg);
    const activeMatch = showWMUs && inRegion && activeWMUs.has(id);
    map.setFeatureState({ source: OS_WMU_SRC, id:i }, {
      wmuHidden: !showWMUs,
      inRegion: !!inRegion,
      outsideRegion: !!(hasRegion && !inRegion),
      noMatch: !!(showWMUs && inRegion && !activeWMUs.has(id)),
      activeMatch: !!activeMatch,
      selectedWMU: !!(osSelectedWMU && id === osSelectedWMU),
      hovered:false
    });
  });

  (regGeo?.features || []).forEach((feat, i) => {
    const rid = String(feat.properties?.region_id || '');
    const selected = osSelectedRegions.has(rid);
    const activeWhenPreviewing = !hasRegion && hasHighlight && activeRegions.has(rid);
    const noMatchWhenPreviewing = !hasRegion && hasHighlight && !activeRegions.has(rid);
    map.setFeatureState({ source: OS_REGION_SRC, id:i }, {
      selected,
      dimmed: !!(hasRegion && !selected),
      activeMatch: !!activeWhenPreviewing,
      noMatch: !!noMatchWhenPreviewing,
      hovered:false
    });
  });

  if (map.getLayer(OS_REGION_HIT)) map.setLayoutProperty(OS_REGION_HIT, 'visibility', showWMUs ? 'none' : 'visible');
  if (map.getLayer(OS_WMU_FILL)) map.setLayoutProperty(OS_WMU_FILL, 'visibility', 'visible');
  if (map.getLayer(OS_WMU_LINE)) map.setLayoutProperty(OS_WMU_LINE, 'visibility', 'visible');
  osUpdateMapStatus();
  osApplyOverlayOpacity(osOverlayVisibility);
}

function osRenderPanel() {
  osEnsureProfessionalShell();
  const panel = document.getElementById('osResultsPanel');
  const title = document.getElementById('osPanelTitle');
  const count = document.getElementById('osPanelCount') || document.getElementById('osResultsCount');
  const crumbs = document.getElementById('osCrumbs');
  if (!panel) return;
  const rows = osPanelRows();
  if (title) title.textContent = osHasSelectedRegions() ? osSelectedRegionLabel() : (osSelSpecies ? `${osSelSpecies} across BC` : 'General Open Seasons');
  if (count) count.textContent = osHasSelectedRegions() ? `${rows.length} rows` : (osAnyHighlightActive() ? `${rows.length} matching rows` : '');
  if (crumbs) crumbs.innerHTML = osCrumbsHTML();
  if (!osHasSelectedRegions()) panel.innerHTML = osProvincePanel();
  else if (osSelectedWMU) panel.innerHTML = osWMUPanel(rows);
  else if (osSelectedOpportunity) panel.innerHTML = osOpportunityPanel(rows);
  else if (osSelSpecies) panel.innerHTML = osSpeciesPanel(rows);
  else panel.innerHTML = osRegionPanel(rows);
  osMaybeAutoPanel();
}

function osToggleRegionSelection(regionKey) {
  const key = String(regionKey || '');
  if (!key) return;
  if (osMultiRegionMode) {
    if (osSelectedRegions.has(key)) osSelectedRegions.delete(key);
    else osSelectedRegions.add(key);
  } else {
    if (osSelectedRegions.size === 1 && osSelectedRegions.has(key)) osSelectedRegions.clear();
    else osSelectedRegions = new Set([key]);
  }
  osSyncSelectedRegionVar();
  osSelectedWMU = null;
  osUserClosedPanel = false;
  osRefreshMapStates();
  osRenderPanel();
  osFitSelectionOrBC();
}
function osSelectRegion(regionKey) { osToggleRegionSelection(regionKey); }

function osSelectSpecies(species) {
  const next = String(species || '');
  osSelSpecies = (osSelSpecies === next) ? '' : next;
  osSelectedOpportunity = '';
  osSelectedWMU = null;
  osUserClosedPanel = false;
  osSyncFilterControls();
  osRefreshMapStates();
  osRenderPanel();
  if (osHasSelectedRegions() && osSelSpecies) osZoomToRows(osPanelRows());
  else if (osHasSelectedRegions()) osFitRegions();
  else osFitBC(true);
}

function osSelectOpportunity(key) {
  const next = String(key || '');
  if (osSelectedOpportunity === next) osSelectedOpportunity = '';
  else {
    osSelectedOpportunity = next;
    const lab = osOpportunityLabel(osSelectedOpportunity);
    osSelSpecies = lab.species || osSelSpecies;
  }
  osSelectedWMU = null;
  osUserClosedPanel = false;
  osSyncFilterControls();
  osRefreshMapStates();
  osRenderPanel();
  if (osHasSelectedRegions() && osSelectedOpportunity) osZoomToRows(osPanelRows());
  else if (osHasSelectedRegions()) osFitRegions();
  else osFitBC(true);
}

function osOnSpecies(v) { osSelectSpecies(v); }
function osOnMethod(v) { osSelMethod = v || ''; osSelectedWMU = null; osSelectedOpportunity = ''; osUserClosedPanel = false; osRefreshMapStates(); osRenderPanel(); if (!osHasSelectedRegions()) osFitBC(true); }
function osOnMonth(v) { osSelMonth = v || ''; osSelectedWMU = null; osSelectedOpportunity = ''; osUserClosedPanel = false; osRefreshMapStates(); osRenderPanel(); if (!osHasSelectedRegions()) osFitBC(true); }
function osClearFilters() { osSelSpecies = ''; osSelMonth = ''; osSelMethod = ''; osSelectedOpportunity = ''; osSelectedWMU = null; osUserClosedPanel = false; osSyncFilterControls(); osRefreshMapStates(); osRenderPanel(); if (!osHasSelectedRegions()) osFitBC(true); }
function osBackToProvince() { osSelectedRegions.clear(); osSyncSelectedRegionVar(); osSelectedWMU = null; osUserClosedPanel = false; osRefreshMapStates(); osRenderPanel(); osFitBC(true); }
function osClearWMU() { osSelectedWMU = null; osUserClosedPanel = false; osRefreshMapStates(); osRenderPanel(); }

function osSetOverlayOpacity(val) {
  const n = Number(val == null ? 1 : val);
  osOverlayVisibility = Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
  osApplyOverlayOpacity(osOverlayVisibility);
  const r = document.getElementById('osOpacityRange'); if (r) r.value = String(osOverlayVisibility);
  const lab = document.getElementById('osOpacityValue'); if (lab) lab.textContent = Math.round(osOverlayVisibility * 100) + '%';
}
function osApplyOverlayOpacity(m) {
  if (!osMapInstance) return;
  m = Math.max(0, Math.min(1, Number(m == null ? 1 : m)));
  try {
    if (osMapInstance.getLayer(OS_WMU_FILL)) osMapInstance.setPaintProperty(OS_WMU_FILL, 'fill-opacity', ['case',
      ['boolean', ['feature-state','wmuHidden'], false], 0,
      ['boolean', ['feature-state','selectedWMU'], false], 0.64 * m,
      ['boolean', ['feature-state','outsideRegion'], false], 0,
      ['boolean', ['feature-state','activeMatch'], false], 0.40 * m,
      ['boolean', ['feature-state','noMatch'], false], 0.06 * m,
      ['boolean', ['feature-state','inRegion'], false], 0.16 * m,
      0]);
    if (osMapInstance.getLayer(OS_WMU_LINE)) osMapInstance.setPaintProperty(OS_WMU_LINE, 'line-opacity', ['case',
      ['boolean', ['feature-state','wmuHidden'], false], 0,
      ['boolean', ['feature-state','selectedWMU'], false], Math.max(m, .35),
      ['boolean', ['feature-state','activeMatch'], false], Math.max(m, .45),
      ['boolean', ['feature-state','inRegion'], false], 0.42 * m,
      0]);
    if (osMapInstance.getLayer(OS_REGION_FILL)) osMapInstance.setPaintProperty(OS_REGION_FILL, 'fill-opacity', ['case',
      ['boolean', ['feature-state','selected'], false], 0.46 * m,
      ['boolean', ['feature-state','activeMatch'], false], 0.50 * m,
      ['boolean', ['feature-state','noMatch'], false], 0.055 * m,
      ['boolean', ['feature-state','dimmed'], false], 0.055 * m,
      ['boolean', ['feature-state','hovered'], false], 0.44 * m,
      0.34 * m]);
    if (osMapInstance.getLayer(OS_REGION_LINE)) osMapInstance.setPaintProperty(OS_REGION_LINE, 'line-opacity', ['case',
      ['boolean', ['feature-state','noMatch'], false], 0.24 * Math.max(m, .30),
      ['boolean', ['feature-state','dimmed'], false], 0.24 * Math.max(m, .30),
      0.92 * Math.max(m, .40)]);
  } catch(e) { console.warn('[GOS opacity]', e); }
}

function initOpenSeasonsPage() {
  osBuildFilters();
  osSyncSelectedRegionVar();
  osEnsureProfessionalShell();
  osRenderPanel();
  setTimeout(() => {
    osInitMap();
    if (osMapInstance) { osMapInstance.resize(); osRefreshMapStates(); osFitBC(false); }
  }, 80);
}

Object.assign(window, {
  initOpenSeasonsPage, osOnSpecies, osOnMethod, osOnMonth, osClearFilters,
  osBackToProvince, osClearWMU, osSelectRegion, osSelectWMU, osSelectSpecies,
  osSelectOpportunity, osToggleCard, osSetTile, osToggleControlTray,
  osToggleFilterPanel, osCloseFilterPanel, osToggle3D, osZoomToRows,
  osSetOverlayOpacity, osToggleFullscreen, osSetMultiRegionMode,
  osSetPanelOpen
});

// ══════════════════════════════════════════════════════════════
// GOS V5.2 hotfix: Map-tab style toolbar + robust region fallback
// - Makes BC GOS work even when bc-region-geojson.js is absent by using
//   WMU polygons as region-coloured fallback features.
// - Syncs the new direct basemap buttons and 2D/3D segmented toggle.
// ══════════════════════════════════════════════════════════════
function osGetWMUGeoJSON() {
  return (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) ||
         (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON) || null;
}
let _osRegionFallbackGeoJSON = null;
function osGetRegionGeoJSON() {
  if (typeof BC_REGION_GEOJSON !== 'undefined' && BC_REGION_GEOJSON) return BC_REGION_GEOJSON;
  if (_osRegionFallbackGeoJSON) return _osRegionFallbackGeoJSON;
  const wmuGeo = osGetWMUGeoJSON();
  if (!wmuGeo || !Array.isArray(wmuGeo.features)) return null;
  _osRegionFallbackGeoJSON = {
    type: 'FeatureCollection',
    features: wmuGeo.features.map((f, idx) => {
      const id = osNormalizeWMU(f.properties && (f.properties.wmu_id || f.properties.MU || f.properties.mu));
      const regionId = osWMURegion(id) || '';
      return {
        type: 'Feature',
        id: idx,
        properties: {
          region_id: regionId,
          region_name: OS_REGION_LABELS[regionId] || (regionId ? 'Region ' + regionId : ''),
          wmu_id: id,
          fallback_region_piece: true
        },
        geometry: f.geometry
      };
    }).filter(f => f.properties.region_id && f.geometry)
  };
  return _osRegionFallbackGeoJSON;
}

function osInitMap() {
  if (osMapInitialized) { if (osMapInstance) setTimeout(() => osMapInstance.resize(), 80); return; }
  const el = document.getElementById('osMap');
  if (!el) return;
  const token = (typeof MAPBOX_TOKEN !== 'undefined') ? MAPBOX_TOKEN : '';
  if (!token || !window.mapboxgl) {
    el.innerHTML = '<div class="os-map-error">Mapbox is unavailable. Check config.js and Mapbox GL loading.</div>';
    return;
  }
  const wmuGeo = osGetWMUGeoJSON();
  const regGeo = osGetRegionGeoJSON();
  if (!wmuGeo) { el.innerHTML = '<div class="os-map-error">BC WMU layer missing.</div>'; return; }
  osMapInitialized = true;
  mapboxgl.accessToken = token;
  osMapInstance = new mapboxgl.Map({
    container: 'osMap',
    style: OS_MAP_STYLES[osMapStyle] || OS_MAP_STYLES.streets,
    center: [-126.3, 54.4],
    zoom: 4.15,
    minZoom: 3,
    maxZoom: 20,
    projection: 'mercator',
    attributionControl: true
  });
  osMapInstance.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
  osMapInstance.on('load', () => {
    osAddMapLayers(wmuGeo, regGeo);
    osRefreshMapStates();
    osFitBC(false);
  });
  osMapInstance.on('error', e => console.warn('[Open Seasons map]', e.error || e));
}

function osRefreshMapStates() {
  const map = osMapInstance;
  if (!map || !map.getSource(OS_WMU_SRC)) return;
  const wmuGeo = osGetWMUGeoJSON();
  const regGeo = osGetRegionGeoJSON();
  const activeWMUs = osActiveWMUs();
  const activeRegions = osActiveRegions();
  const selectedKeys = osSelectedRegionKeys();
  const hasRegion = selectedKeys.length > 0;
  const hasHighlight = osAnyHighlightActive();
  const forceShowWMUs = !!window.osShowWMUs;
  const showWMUs = forceShowWMUs || (hasRegion && !!(osSelSpecies || osSelectedOpportunity || osSelectedWMU));

  (wmuGeo && wmuGeo.features || []).forEach((feat, i) => {
    const id = osNormalizeWMU(feat.properties && (feat.properties.wmu_id || feat.properties.MU || feat.properties.mu));
    const reg = osWMURegion(id);
    const inRegion = hasRegion && osSelectedRegions.has(reg);
    const activeMatch = showWMUs && (!hasRegion || inRegion) && activeWMUs.has(id);
    try {
      map.setFeatureState({ source: OS_WMU_SRC, id:i }, {
        wmuHidden: !showWMUs,
        inRegion: !!inRegion,
        outsideRegion: !!(hasRegion && !inRegion),
        noMatch: !!(showWMUs && (!hasRegion || inRegion) && !activeWMUs.has(id)),
        activeMatch: !!activeMatch,
        selectedWMU: !!(osSelectedWMU && id === osSelectedWMU),
        hovered:false
      });
    } catch(e) {}
  });

  (regGeo && regGeo.features || []).forEach((feat, i) => {
    const rid = String(feat.properties && feat.properties.region_id || '');
    const selected = osSelectedRegions.has(rid);
    const activeWhenPreviewing = !hasRegion && hasHighlight && activeRegions.has(rid);
    const noMatchWhenPreviewing = !hasRegion && hasHighlight && !activeRegions.has(rid);
    try {
      map.setFeatureState({ source: OS_REGION_SRC, id:i }, {
        selected,
        dimmed: !!(hasRegion && !selected),
        activeMatch: !!activeWhenPreviewing,
        noMatch: !!noMatchWhenPreviewing,
        hovered:false
      });
    } catch(e) {}
  });

  if (map.getLayer(OS_REGION_HIT)) map.setLayoutProperty(OS_REGION_HIT, 'visibility', showWMUs && !hasRegion ? 'none' : 'visible');
  if (map.getLayer(OS_WMU_FILL)) map.setLayoutProperty(OS_WMU_FILL, 'visibility', 'visible');
  if (map.getLayer(OS_WMU_LINE)) map.setLayoutProperty(OS_WMU_LINE, 'visibility', 'visible');
  osUpdateMapStatus();
  osApplyOverlayOpacity(osOverlayVisibility);
}

function osSet3D(on) {
  osTerrain3D = !!on;
  osApplyTerrain(osTerrain3D);
  osSyncTileButtons();
}
function osToggle3D() { osSet3D(!osTerrain3D); }
function osSyncTileButtons() {
  ['streets','satellite','topo'].forEach(t => {
    document.querySelectorAll('#osTile_' + t).forEach(el => el.classList.toggle('active', osMapStyle === t));
  });
  document.getElementById('os3DBtn')?.classList.toggle('active', osTerrain3D);
  document.getElementById('osTop3DBtn')?.classList.toggle('active', osTerrain3D);
  document.getElementById('osGos2DBtn')?.classList.toggle('active', !osTerrain3D);
  document.getElementById('osGos3DBtn')?.classList.toggle('active', osTerrain3D);
  const r = document.getElementById('osOpacityRange'); if (r) r.value = String(osOverlayVisibility);
  const lab = document.getElementById('osOpacityValue'); if (lab) lab.textContent = Math.round(osOverlayVisibility * 100) + '%';
}
function osSetTile(tile) {
  osMapStyle = OS_MAP_STYLES[tile] ? tile : 'streets';
  if (osMapInstance) {
    osMapInstance.setStyle(OS_MAP_STYLES[osMapStyle]);
    osMapInstance.once('styledata', () => {
      const wmuGeo = osGetWMUGeoJSON();
      const regGeo = osGetRegionGeoJSON();
      if (wmuGeo) osAddMapLayers(wmuGeo, regGeo);
      if (osTerrain3D) osApplyTerrain(true);
    });
  }
  osSyncTileButtons();
}

function initOpenSeasonsPage() {
  osBuildFilters();
  osSyncSelectedRegionVar();
  osEnsureProfessionalShell();
  osRenderPanel();
  osSyncTileButtons();
  setTimeout(() => {
    osInitMap();
    if (osMapInstance) { osMapInstance.resize(); osRefreshMapStates(); osFitBC(false); }
  }, 80);
}

Object.assign(window, {
  initOpenSeasonsPage, osInitMap, osRefreshMapStates, osSet3D,
  osToggle3D, osSetTile, osSyncTileButtons
});

// ══════════════════════════════════════════════════════════════
// GOS V5.3 BULLETPROOF HOTFIX
// Fixes missing toolbar functions, search suggestions, fixed hover labels,
// wildfire controls, no fullscreen control, and safer BC fit.
// ══════════════════════════════════════════════════════════════
const OS_LOCAL_CITIES = [
  {label:'Vancouver', sub:'City · Lower Mainland', coords:[-123.1207,49.2827]},
  {label:'Victoria', sub:'City · Vancouver Island', coords:[-123.3656,48.4284]},
  {label:'Kelowna', sub:'City · Okanagan', coords:[-119.4960,49.8880]},
  {label:'Kamloops', sub:'City · Thompson', coords:[-120.3273,50.6745]},
  {label:'Prince George', sub:'City · Omineca', coords:[-122.7497,53.9171]},
  {label:'Williams Lake', sub:'City · Cariboo', coords:[-122.1418,52.1418]},
  {label:'Smithers', sub:'City · Skeena', coords:[-127.1669,54.7825]},
  {label:'Cranbrook', sub:'City · Kootenay', coords:[-115.7688,49.5096]},
  {label:'Fort St. John', sub:'City · Peace', coords:[-120.8462,56.2524]},
  {label:'Terrace', sub:'City · Skeena', coords:[-128.6035,54.5182]},
  {label:'Prince Rupert', sub:'City · Skeena', coords:[-130.3208,54.3150]},
  {label:'Penticton', sub:'City · Okanagan', coords:[-119.5937,49.4991]},
  {label:'Nelson', sub:'City · Kootenay', coords:[-117.2948,49.4928]},
  {label:'Revelstoke', sub:'City · Kootenay', coords:[-118.2023,50.9981]},
  {label:'Merritt', sub:'City · Thompson', coords:[-120.7896,50.1123]},
  // Extra BC community index for GOS search. The main Map can use Mapbox's
  // geocoder fallback, but GOS needs a strong local list so common hunting
  // towns resolve instantly and work even before the network fallback returns.
  {label:'Cache Creek', sub:'Village · Thompson', coords:[-121.3236,50.8103]},
  {label:'Ashcroft', sub:'Village · Thompson', coords:[-121.2806,50.7235]},
  {label:'Clinton', sub:'Village · Cariboo', coords:[-121.5853,51.0892]},
  {label:'100 Mile House', sub:'District · Cariboo', coords:[-121.2950,51.6420]},
  {label:'Lillooet', sub:'District · Thompson', coords:[-121.9367,50.6942]},
  {label:'Lytton', sub:'Village · Thompson', coords:[-121.5787,50.2316]},
  {label:'Hope', sub:'District · Lower Mainland', coords:[-121.4417,49.3797]},
  {label:'Chilliwack', sub:'City · Lower Mainland', coords:[-121.9509,49.1579]},
  {label:'Abbotsford', sub:'City · Lower Mainland', coords:[-122.3295,49.0504]},
  {label:'Squamish', sub:'District · Lower Mainland', coords:[-123.1558,49.7016]},
  {label:'Whistler', sub:'Resort municipality · Lower Mainland', coords:[-122.9574,50.1163]},
  {label:'Pemberton', sub:'Village · Lower Mainland', coords:[-122.8058,50.3220]},
  {label:'Princeton', sub:'Town · Thompson/Okanagan', coords:[-120.5113,49.4580]},
  {label:'Osoyoos', sub:'Town · Okanagan', coords:[-119.4682,49.0323]},
  {label:'Vernon', sub:'City · Okanagan', coords:[-119.2720,50.2670]},
  {label:'Salmon Arm', sub:'City · Okanagan', coords:[-119.2827,50.7001]},
  {label:'Golden', sub:'Town · Kootenay', coords:[-116.9670,51.2992]},
  {label:'Invermere', sub:'District · Kootenay', coords:[-116.0354,50.5065]},
  {label:'Fernie', sub:'City · Kootenay', coords:[-115.0631,49.5041]},
  {label:'Sparwood', sub:'District · Kootenay', coords:[-114.8854,49.7331]},
  {label:'Creston', sub:'Town · Kootenay', coords:[-116.5135,49.0955]},
  {label:'Castlegar', sub:'City · Kootenay', coords:[-117.6666,49.3237]},
  {label:'Trail', sub:'City · Kootenay', coords:[-117.7022,49.0950]},
  {label:'Nakusp', sub:'Village · Kootenay', coords:[-117.8024,50.2397]},
  {label:'Quesnel', sub:'City · Cariboo', coords:[-122.4949,52.9784]},
  {label:'Bella Coola', sub:'Community · Cariboo/Coast', coords:[-126.7530,52.3721]},
  {label:'Clearwater', sub:'District · Thompson', coords:[-120.0270,51.6516]},
  {label:'Barriere', sub:'District · Thompson', coords:[-120.1265,51.1810]},
  {label:'Valemount', sub:'Village · Omineca', coords:[-119.2659,52.8312]},
  {label:'Burns Lake', sub:'Village · Omineca', coords:[-125.7533,54.2297]},
  {label:'Houston', sub:'District · Skeena', coords:[-126.6496,54.3970]},
  {label:'Vanderhoof', sub:'District · Omineca', coords:[-124.0086,54.0140]},
  {label:'Mackenzie', sub:'District · Omineca', coords:[-123.0963,55.3364]},
  {label:'Chetwynd', sub:'District · Peace', coords:[-121.6404,55.6998]},
  {label:'Dawson Creek', sub:'City · Peace', coords:[-120.2362,55.7596]},
  {label:'Tumbler Ridge', sub:'District · Peace', coords:[-121.0018,55.1303]},
  {label:'Fort Nelson', sub:'Northern Rockies · Peace', coords:[-122.7002,58.8053]},
  {label:'Campbell River', sub:'City · Vancouver Island', coords:[-125.2446,50.0331]},
  {label:'Courtenay', sub:'City · Vancouver Island', coords:[-124.9936,49.6841]},
  {label:'Port Alberni', sub:'City · Vancouver Island', coords:[-124.8055,49.2339]},
  {label:'Port Hardy', sub:'District · Vancouver Island', coords:[-127.4199,50.7124]},
  {label:'Tofino', sub:'District · Vancouver Island', coords:[-125.9066,49.1520]},
  {label:'Ucluelet', sub:'District · Vancouver Island', coords:[-125.5463,48.9416]},
  {label:'Powell River', sub:'City · Lower Mainland', coords:[-124.5247,49.8352]}
];
let _osSearchItems = [];
let _osGeocodeCtrl = null;
let _osHoverPopup = null;
let _osWildfireLoaded = false;
let _osWildfireVisible = false;
let _osWildfireOpacity = 0.38;
let _osWildfireYears = new Set();
const OS_WILDFIRE_SRC = 'os-wildfire-src';
const OS_WILDFIRE_FILL = 'os-wildfire-fill';
const OS_WILDFIRE_LINE = 'os-wildfire-line';

function osCloseDockPanels() {
  ['osSpeciesPanel','osFilterPanel','osLayersPanel','osMapToolsPanel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('visible','open','active');
  });
  document.querySelectorAll('#bcOpenSeasonsPage .os-dock-btn').forEach(b => b.classList.remove('active'));
}
function osTogglePanelById(id, btnText) {
  const el = document.getElementById(id);
  if (!el) return;
  const willOpen = !el.classList.contains('visible');
  osCloseDockPanels();
  if (willOpen) {
    el.classList.add('visible');
    document.querySelectorAll('#bcOpenSeasonsPage .os-dock-btn').forEach(b => {
      if ((b.textContent || '').trim().toLowerCase() === String(btnText || '').toLowerCase()) b.classList.add('active');
    });
  }
}
function osToggleSpeciesPanel() { osTogglePanelById('osSpeciesPanel', 'Species'); }
function osToggleLayersPanel() { osBuildWildfireYearControls(); osTogglePanelById('osLayersPanel', 'Layers'); }
function osToggleFilterPanel() { osTogglePanelById('osFilterPanel', 'Filters'); }
function osCloseFilterPanel() { osCloseDockPanels(); }

function osClearAllGOS() {
  osSelSpecies = '';
  osSelMonth = '';
  osSelMethod = '';
  osSelectedOpportunity = '';
  osSelectedWMU = null;
  if (typeof osSelectedRegions !== 'undefined' && osSelectedRegions) osSelectedRegions.clear();
  osSyncSelectedRegionVar && osSyncSelectedRegionVar();
  osSyncFilterControls && osSyncFilterControls();
  const input = document.getElementById('osSearchInput'); if (input) input.value = '';
  osHideSearchResults();
  osSetPanelOpen && osSetPanelOpen(false, false);
  osCloseDockPanels();
  osRefreshMapStates();
  osRenderPanel();
  osFitBC(true);
}

function osSearchRank(text, q) {
  const t = String(text || '').toLowerCase();
  if (!q) return 99;
  if (t === q) return 0;
  if (t.startsWith(q)) return 1;
  if (t.includes(q)) return 3;
  return 99;
}
function osParseCoords(query) {
  const raw = String(query || '').trim();
  if (!raw) return null;
  const nums = raw.replace(/,/g,' ').replace(/([NSEW])/gi,' $1 ').match(/[-+]?\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 2) return null;
  let a = parseFloat(nums[0]), b = parseFloat(nums[1]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  let lat = a, lng = b;
  if (Math.abs(a) > 90 && Math.abs(b) <= 90) { lng = a; lat = b; }
  const upper = raw.toUpperCase();
  if (/(^|[^A-Z])S\s*\d|\d\s*S/.test(upper)) lat = -Math.abs(lat);
  if (/(^|[^A-Z])W\s*\d|\d\s*W/.test(upper)) lng = -Math.abs(lng);
  if (!/(^|[^A-Z])E\s*\d|\d\s*E/.test(upper) && lng > 90) lng = -Math.abs(lng);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (!(lat >= 48 && lat <= 61 && lng >= -140 && lng <= -109)) return null;
  return [lng, lat];
}
function osGeometryBBox(geom) {
  const coords = [];
  (function walk(x) {
    if (!x) return;
    if (typeof x[0] === 'number' && typeof x[1] === 'number') coords.push(x);
    else if (Array.isArray(x)) x.forEach(walk);
  })(geom && geom.coordinates);
  if (!coords.length) return null;
  const lngs = coords.map(c => c[0]), lats = coords.map(c => c[1]);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}
function osFeatureCenter(feature) {
  const b = osGeometryBBox(feature && feature.geometry);
  return b ? [(b[0]+b[2])/2, (b[1]+b[3])/2] : null;
}
function osBuildSearchItems(query) {
  const q = String(query || '').trim().toLowerCase();
  const items = [];
  const coord = osParseCoords(query);
  if (coord) items.push({type:'Coordinates', label:`${coord[1].toFixed(5)}, ${coord[0].toFixed(5)}`, sub:'Coordinates', coords:coord, score:0, action:()=>osFlyToCoords(coord)});

  OS_LOCAL_CITIES.forEach(c => {
    const score = osSearchRank(c.label, q);
    if (score < 99) items.push({type:'City', label:c.label, sub:c.sub, coords:c.coords, score:10+score, action:()=>osFlyToCoords(c.coords)});
  });

  Object.entries(OS_REGION_LABELS).forEach(([key,label]) => {
    const score = Math.min(osSearchRank(label, q), osSearchRank('region ' + key, q), osSearchRank(key, q));
    if (score < 99) items.push({type:'Region', label, sub:'BC hunting region', score:20+score, action:()=>osSearchSelectRegion(key)});
  });

  const geo = osGetWMUGeoJSON ? osGetWMUGeoJSON() : ((typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON));
  (geo && geo.features || []).forEach(f => {
    const id = osNormalizeWMU(f.properties && (f.properties.wmu_id || f.properties.MU || f.properties.WMUNIT_NUM || ''));
    if (!id) return;
    const score = Math.min(osSearchRank(id, q), osSearchRank('wmu ' + id, q));
    if (score < 99) items.push({type:'WMU', label:'WMU ' + id, sub:OS_REGION_LABELS[osWMURegion(id)] || 'BC WMU', feature:f, id, score:30+score, action:()=>osSearchSelectWMU(id, f)});
  });
  const seen = new Set();
  return items.sort((a,b)=>a.score-b.score || a.label.localeCompare(b.label)).filter(x => {
    const k = x.type + '|' + x.label;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  }).slice(0,3);
}
function osRenderSearchItems(items, emptyText) {
  const box = document.getElementById('osSearchResults');
  if (!box) return;
  _osSearchItems = Array.isArray(items) ? items.slice(0, 3) : [];
  box.innerHTML = _osSearchItems.length ? _osSearchItems.map((it,i)=>
    `<button type="button" class="os-search-result" onmousedown="event.preventDefault();osSelectSearchResult(${i})"><b>${osEscape(it.label)}</b><span>${osEscape(it.sub || '')}</span><em>${osEscape(it.type)}</em></button>`
  ).join('') : `<div class="os-search-empty">${osEscape(emptyText || 'No results found')}</div>`;
  box.classList.add('visible');
}
function osFetchPlaceSuggestions(query, localItems) {
  const token = (typeof MAPBOX_TOKEN !== 'undefined') ? MAPBOX_TOKEN : '';
  if (!token) { if (!localItems.length) osRenderSearchItems([], 'No results found'); return; }
  if (_osGeocodeCtrl) { try { _osGeocodeCtrl.abort(); } catch(e) {} }
  _osGeocodeCtrl = new AbortController();
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?access_token=${token}&bbox=-139.1,48.3,-114.0,60.1&types=place,locality,neighborhood,poi&limit=${Math.max(1, 3 - localItems.length)}&country=CA`;
  fetch(url, { signal: _osGeocodeCtrl.signal })
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      const current = document.getElementById('osSearchInput');
      if (!current || String(current.value || '').trim().toLowerCase() !== String(query || '').trim().toLowerCase()) return;
      const geoItems = ((data && data.features) || []).map(f => ({
        type:'City',
        label:f.text || f.place_name,
        sub:f.place_name || 'BC place',
        coords:f.center,
        score:90,
        action:()=>osFlyToCoords(f.center)
      }));
      const combined = [];
      const seen = new Set();
      [...localItems, ...geoItems].forEach(it => {
        const k = it.type + '|' + String(it.label || '').toLowerCase();
        if (!seen.has(k) && combined.length < 3) { seen.add(k); combined.push(it); }
      });
      osRenderSearchItems(combined, 'No results found');
    })
    .catch(err => { if (err && err.name !== 'AbortError' && !localItems.length) osRenderSearchItems([], 'No results found'); });
}
function osHandleSearchInput(val) {
  const clear = document.getElementById('osSearchClear');
  if (clear) clear.classList.toggle('visible', !!String(val || '').trim());
  const q = String(val || '').trim();
  if (!q) { osHideSearchResults(); return; }
  const localItems = osBuildSearchItems(q);
  if (localItems.length) osRenderSearchItems(localItems, 'Searching…');
  else osRenderSearchItems([], 'Searching…');
  if (localItems.length < 3) osFetchPlaceSuggestions(q, localItems);
}
function osHandleSearchKey(e) {
  if (e.key === 'Enter') { e.preventDefault(); if (_osSearchItems[0]) osSelectSearchResult(0); }
  if (e.key === 'Escape') { osHideSearchResults(); e.currentTarget.blur(); }
}
function osSelectSearchResult(i) {
  const item = _osSearchItems[i];
  if (!item) return;
  const input = document.getElementById('osSearchInput');
  if (input) input.value = item.label;
  osHideSearchResults();
  item.action && item.action();
}
function osClearSearch() {
  const input = document.getElementById('osSearchInput');
  if (input) input.value = '';
  const clear = document.getElementById('osSearchClear'); if (clear) clear.classList.remove('visible');
  osHideSearchResults();
}
function osHideSearchResults() {
  const box = document.getElementById('osSearchResults');
  if (box) box.classList.remove('visible');
  _osSearchItems = [];
  if (_osGeocodeCtrl) { try { _osGeocodeCtrl.abort(); } catch(e) {} _osGeocodeCtrl = null; }
}
function osFlyToCoords(coords) {
  if (!osMapInstance) return;
  osMapInstance.easeTo({ center: coords, zoom: 8.8, duration: 700, pitch: osTerrain3D ? 55 : 0 });
}
function osSearchSelectRegion(key) {
  osSelectedRegions.clear(); osSelectedRegions.add(String(key)); osSyncSelectedRegionVar && osSyncSelectedRegionVar();
  osSelectedWMU = null; osUserClosedPanel = false;
  osRefreshMapStates(); osRenderPanel(); osSetPanelOpen && osSetPanelOpen(true, false); osFitRegions([String(key)]);
}
function osSearchSelectWMU(id, feature) {
  const reg = osWMURegion(id);
  osSelectedRegions.clear(); osSelectedRegions.add(String(reg)); osSyncSelectedRegionVar && osSyncSelectedRegionVar();
  osSelectedWMU = id; osUserClosedPanel = false;
  osRefreshMapStates(); osRenderPanel(); osSetPanelOpen && osSetPanelOpen(true, false);
  const b = osGeometryBBox(feature && feature.geometry);
  if (b && osMapInstance) osMapInstance.fitBounds([[b[0],b[1]],[b[2],b[3]]], { padding:{top:120,bottom:70,left:70,right:430}, maxZoom:9.2, duration:800 });
}

function osToggleShowWMUs(checked) {
  window.osShowWMUs = !!checked;
  osRefreshMapStates();
}
function osBuildWildfireYearControls() {
  const wrap = document.getElementById('osWildfireYearChecks');
  if (!wrap) return;
  const years = [];
  for (let y = 2023; y >= 2013; y--) years.push(y);
  if (!_osWildfireYears.size) years.slice(0,10).forEach(y => _osWildfireYears.add(String(y)));
  wrap.innerHTML = years.map(y => `<label><input type="checkbox" value="${y}" ${_osWildfireYears.has(String(y))?'checked':''} onchange="osToggleWildfireYear('${y}', this.checked)"><span>${y}</span></label>`).join('');
}
function osToggleWildfireYear(year, checked) {
  if (checked) _osWildfireYears.add(String(year)); else _osWildfireYears.delete(String(year));
  osApplyWildfireFilter();
}
function osSetWildfireYearPreset(mode) {
  _osWildfireYears.clear();
  const years = Array.from({length:11},(_,i)=>String(2023-i));
  if (mode === 'all') years.forEach(y=>_osWildfireYears.add(y));
  if (mode === 'last5') years.slice(0,5).forEach(y=>_osWildfireYears.add(y));
  if (mode === 'last10') years.slice(0,10).forEach(y=>_osWildfireYears.add(y));
  osBuildWildfireYearControls();
  osApplyWildfireFilter();
}
function osSetWildfireOpacity(val) {
  _osWildfireOpacity = Math.max(0.05, Math.min(0.85, Number(val) || 0.38));
  const lab = document.getElementById('osWildfireOpacityValue'); if (lab) lab.textContent = Math.round(_osWildfireOpacity * 100) + '%';
  if (osMapInstance && osMapInstance.getLayer(OS_WILDFIRE_FILL)) osMapInstance.setPaintProperty(OS_WILDFIRE_FILL, 'fill-opacity', _osWildfireOpacity);
}
function osToggleWildfireLayer(checked) {
  _osWildfireVisible = !!checked;
  if (!_osWildfireVisible) { osSetWildfireVisibility(false); return; }
  osLoadWildfireLayer().then(()=>{ osSetWildfireVisibility(true); osApplyWildfireFilter(); });
}
function osSetWildfireVisibility(on) {
  if (!osMapInstance) return;
  [OS_WILDFIRE_FILL, OS_WILDFIRE_LINE].forEach(id => { if (osMapInstance.getLayer(id)) osMapInstance.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); });
}
async function osLoadWildfireLayer() {
  if (_osWildfireLoaded || !osMapInstance) return;
  const res = await fetch('./historical_wildfires_simplified_50m.geojson');
  if (!res.ok) throw new Error('Wildfire GeoJSON failed to load');
  const data = await res.json();
  if (!osMapInstance.getSource(OS_WILDFIRE_SRC)) osMapInstance.addSource(OS_WILDFIRE_SRC, { type:'geojson', data });
  if (!osMapInstance.getLayer(OS_WILDFIRE_FILL)) osMapInstance.addLayer({ id:OS_WILDFIRE_FILL, type:'fill', source:OS_WILDFIRE_SRC, paint:{ 'fill-color':'#e45a2a', 'fill-opacity':_osWildfireOpacity } }, osMapInstance.getLayer(OS_REGION_HIT) ? OS_REGION_HIT : undefined);
  if (!osMapInstance.getLayer(OS_WILDFIRE_LINE)) osMapInstance.addLayer({ id:OS_WILDFIRE_LINE, type:'line', source:OS_WILDFIRE_SRC, paint:{ 'line-color':'#ffb36a', 'line-width':1.2, 'line-opacity':0.85 } }, osMapInstance.getLayer(OS_REGION_HIT) ? OS_REGION_HIT : undefined);
  osMapInstance.on('click', OS_WILDFIRE_FILL, e => {
    const p = e.features && e.features[0] && e.features[0].properties || {};
    const year = p.year || p.YEAR || 'Year unavailable';
    const size = Number(p.size_ha || p.SIZE_HA || p.area_ha || p.AREA_HA);
    const sizeText = Number.isFinite(size) ? size.toLocaleString(undefined,{maximumFractionDigits:0}) + ' ha' : 'Size unavailable';
    new mapboxgl.Popup({ closeButton:true, className:'os-wildfire-popup' })
      .setLngLat(e.lngLat)
      .setHTML(`<div class="os-wf-pop"><b>Wildfire · ${osEscape(year)}</b><span>${osEscape(sizeText)}</span></div>`)
      .addTo(osMapInstance);
  });
  _osWildfireLoaded = true;
}
function osApplyWildfireFilter() {
  if (!osMapInstance || !osMapInstance.getLayer(OS_WILDFIRE_FILL)) return;
  const years = Array.from(_osWildfireYears);
  const filter = years.length ? ['in', ['to-string', ['get','year']], ['literal', years]] : ['==', ['get','year'], '__none__'];
  try { osMapInstance.setFilter(OS_WILDFIRE_FILL, filter); osMapInstance.setFilter(OS_WILDFIRE_LINE, filter); } catch(e) {}
}

function osShowHoverLabel(lngLat, html) {
  if (!osMapInstance || !lngLat) return;
  if (!_osHoverPopup) _osHoverPopup = new mapboxgl.Popup({ closeButton:false, closeOnClick:false, offset:0, className:'os-hover-fixed-label' });
  _osHoverPopup.setLngLat(lngLat).setHTML(html).addTo(osMapInstance);
}
function osHideHoverLabel() { if (_osHoverPopup) _osHoverPopup.remove(); }
function osShowTooltip() { /* disabled: no mouse-follow tooltip */ }
function osHideTooltip() { osHideHoverLabel(); }

function osBindMapEvents() {
  const map = osMapInstance;
  if (!map || map._osEventsBoundV53) return;
  map._osEventsBoundV53 = true;
  map.on('mousemove', e => {
    const wmuMode = osWMUInteractionActive && osWMUInteractionActive();
    if (wmuMode) {
      const wf = osTopWMUFeatureAtPoint(e.point);
      if (wf) {
        const id = osNormalizeWMU(wf.properties && (wf.properties.wmu_id || wf.properties.MU || ''));
        if (osSelectedRegionContainsWMU && osSelectedRegionContainsWMU(id)) {
          if (osHoveredWMU !== null && osHoveredWMU !== wf.id) map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false });
          osHoveredWMU = wf.id;
          map.setFeatureState({ source: OS_WMU_SRC, id:wf.id }, { hovered:true });
          map.getCanvas().style.cursor = 'pointer';
          const rows = osSelectedRegionsRows ? osSelectedRegionsRows().filter(r => osRowAppliesToWMU(r, id) && osRowPassesGlobalFilters(r)) : [];
          osShowHoverLabel(osFeatureCenter(wf), `<b>WMU ${osEscape(id)}</b><span>${rows.length} season row${rows.length===1?'':'s'}</span>`);
          return;
        }
      }
    }
    if (osHoveredWMU !== null) { map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false }); osHoveredWMU = null; }
    const rf = osTopRegionFeatureAtPoint(e.point);
    if (rf) {
      const rid = String(rf.properties && rf.properties.region_id || '');
      if (osHoveredRegion !== null && osHoveredRegion !== rf.id) map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false });
      osHoveredRegion = rf.id;
      map.setFeatureState({ source: OS_REGION_SRC, id: rf.id }, { hovered:true });
      map.getCanvas().style.cursor = 'pointer';
      const rRows = (osRowsForRegionNoPanelFilter ? osRowsForRegionNoPanelFilter(rid) : []).filter(r => osRowPassesGlobalFilters(r));
      const speciesCount = [...new Set(rRows.map(r => r.species))].length;
      osShowHoverLabel(osFeatureCenter(rf), `<b>${osEscape(osRegionName(rid))}</b><span>${speciesCount} species · ${rRows.length} season rows</span>`);
      return;
    }
    if (osHoveredRegion !== null) { map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false }); osHoveredRegion = null; }
    map.getCanvas().style.cursor = '';
    osHideHoverLabel();
  });
  map.on('mouseleave', () => {
    if (osHoveredWMU !== null) { map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false }); osHoveredWMU = null; }
    if (osHoveredRegion !== null) { map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false }); osHoveredRegion = null; }
    map.getCanvas().style.cursor = '';
    osHideHoverLabel();
  });
  map.on('click', e => {
    const wmuMode = osWMUInteractionActive && osWMUInteractionActive();
    if (wmuMode) {
      const wf = osTopWMUFeatureAtPoint(e.point);
      if (wf) {
        const id = osNormalizeWMU(wf.properties && (wf.properties.wmu_id || wf.properties.MU || ''));
        if (osSelectedRegionContainsWMU && osSelectedRegionContainsWMU(id)) {
          const active = osActiveWMUs ? osActiveWMUs() : new Set();
          if (!active.size || active.has(id)) { osSelectWMU(id); return; }
        }
      }
    }
    const rf = osTopRegionFeatureAtPoint(e.point);
    if (rf) {
      const rid = String(rf.properties && rf.properties.region_id || '');
      if (rid) { osToggleRegionSelection(rid); return; }
    }
  });
}

function osFitBC(animated=false) {
  if (!osMapInstance) return;
  osMapInstance.fitBounds([[-140.2,47.6],[-112.8,60.6]], {
    padding:{ top:120, bottom:70, left:55, right:55 },
    duration:animated ? 650 : 0,
    bearing:0,
    pitch: osTerrain3D ? osMapInstance.getPitch() : 0
  });
}
function osEnsureProfessionalShell() {
  const panel = document.querySelector('.os-panel');
  const status = document.getElementById('osMapStatus');
  if (status) status.style.display = 'none';
  const oldToggle = document.getElementById('osPanelToggle'); if (oldToggle) oldToggle.remove();
  const fs = document.getElementById('osFullscreenBtn'); if (fs) fs.remove();
  if (panel && !document.getElementById('osPanelCloseBtn')) {
    const top = panel.querySelector('.os-panel-top');
    if (top) {
      const close = document.createElement('button');
      close.id = 'osPanelCloseBtn'; close.type = 'button'; close.className = 'os-panel-close'; close.textContent = '×'; close.title = 'Collapse panel';
      close.onclick = () => osSetPanelOpen(false, true); top.appendChild(close);
    }
  }
}
function initOpenSeasonsPage() {
  osBuildFilters && osBuildFilters();
  osSyncSelectedRegionVar && osSyncSelectedRegionVar();
  osEnsureProfessionalShell();
  osRenderPanel && osRenderPanel();
  osSyncTileButtons && osSyncTileButtons();
  osBuildWildfireYearControls();
  setTimeout(() => {
    osInitMap && osInitMap();
    if (osMapInstance) { osMapInstance.resize(); osRefreshMapStates(); osFitBC(false); }
  }, 80);
}
Object.assign(window, {
  initOpenSeasonsPage, osToggleSpeciesPanel, osToggleLayersPanel, osToggleFilterPanel,
  osCloseDockPanels, osCloseFilterPanel, osClearAllGOS, osHandleSearchInput,
  osHandleSearchKey, osSelectSearchResult, osClearSearch, osToggleShowWMUs,
  osToggleWildfireLayer, osSetWildfireYearPreset, osToggleWildfireYear,
  osSetWildfireOpacity, osSet3D, osToggle3D, osSetTile, osFitBC
});

// ══════════════════════════════════════════════════════════════
// GOS V5.4 CONTROL + HOVER AUDIT HOTFIX
// Finalizes the panel buttons, removes cursor-follow text, and keeps labels short.
// ══════════════════════════════════════════════════════════════
function osCloseDockPanels() {
  ['osSpeciesPanel','osFilterPanel','osLayersPanel','osMapToolsPanel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('visible','open','active');
  });
  document.querySelectorAll('#bcOpenSeasonsPage .os-dock-btn').forEach(b => b.classList.remove('active'));
}
function osTogglePanelById(id, btnText) {
  const el = document.getElementById(id);
  if (!el) return;
  const willOpen = !(el.classList.contains('visible') || el.classList.contains('open'));
  osCloseDockPanels();
  if (willOpen) {
    el.classList.add('visible','open');
    document.querySelectorAll('#bcOpenSeasonsPage .os-dock-btn').forEach(b => {
      const label = (b.textContent || '').trim().toLowerCase();
      if (label === String(btnText || '').toLowerCase()) b.classList.add('active');
    });
  }
}
function osToggleSpeciesPanel() {
  if (typeof osBuildFilters === 'function') osBuildFilters();
  osTogglePanelById('osSpeciesPanel', 'Species');
}
function osToggleFilterPanel() {
  if (typeof osBuildFilters === 'function') osBuildFilters();
  osTogglePanelById('osFilterPanel', 'Filters');
}
function osToggleLayersPanel() {
  if (typeof osBuildWildfireYearControls === 'function') osBuildWildfireYearControls();
  osTogglePanelById('osLayersPanel', 'Layers');
}
function osCloseFilterPanel() { osCloseDockPanels(); }

function osShowHoverLabel(lngLat, html) {
  if (!osMapInstance || !lngLat) return;
  if (!_osHoverPopup) {
    _osHoverPopup = new mapboxgl.Popup({
      closeButton:false,
      closeOnClick:false,
      offset:0,
      className:'os-hover-fixed-label'
    });
  }
  _osHoverPopup.setLngLat(lngLat).setHTML(html).addTo(osMapInstance);
}
function osHideHoverLabel() { if (_osHoverPopup) _osHoverPopup.remove(); }
function osShowTooltip() { /* removed: no cursor-follow tooltip */ }
function osHideTooltip() { osHideHoverLabel(); }

function osBindMapEvents() {
  const map = osMapInstance;
  if (!map || map._osEventsBoundV54) return;
  map._osEventsBoundV54 = true;

  map.on('mousemove', e => {
    const wmuMode = typeof osWMUInteractionActive === 'function' && osWMUInteractionActive();
    if (wmuMode) {
      const wf = typeof osTopWMUFeatureAtPoint === 'function' ? osTopWMUFeatureAtPoint(e.point) : null;
      if (wf) {
        const id = osNormalizeWMU(wf.properties && (wf.properties.wmu_id || wf.properties.MU || wf.properties.WMUNIT_NUM || ''));
        if (typeof osSelectedRegionContainsWMU !== 'function' || osSelectedRegionContainsWMU(id)) {
          if (osHoveredWMU !== null && osHoveredWMU !== wf.id) {
            try { map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false }); } catch(err) {}
          }
          osHoveredWMU = wf.id;
          try { map.setFeatureState({ source: OS_WMU_SRC, id:wf.id }, { hovered:true }); } catch(err) {}
          map.getCanvas().style.cursor = 'pointer';
          osShowHoverLabel(osFeatureCenter(wf), `<b>WMU ${osEscape(id)}</b>`);
          return;
        }
      }
    }

    if (osHoveredWMU !== null) {
      try { map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false }); } catch(err) {}
      osHoveredWMU = null;
    }

    const rf = typeof osTopRegionFeatureAtPoint === 'function' ? osTopRegionFeatureAtPoint(e.point) : null;
    if (rf) {
      const rid = String(rf.properties && rf.properties.region_id || '');
      if (osHoveredRegion !== null && osHoveredRegion !== rf.id) {
        try { map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false }); } catch(err) {}
      }
      osHoveredRegion = rf.id;
      try { map.setFeatureState({ source: OS_REGION_SRC, id: rf.id }, { hovered:true }); } catch(err) {}
      map.getCanvas().style.cursor = 'pointer';
      osShowHoverLabel(osFeatureCenter(rf), `<b>${osEscape(osRegionName(rid))}</b>`);
      return;
    }

    if (osHoveredRegion !== null) {
      try { map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false }); } catch(err) {}
      osHoveredRegion = null;
    }
    map.getCanvas().style.cursor = '';
    osHideHoverLabel();
  });

  map.on('mouseleave', () => {
    if (osHoveredWMU !== null) { try { map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false }); } catch(err) {} osHoveredWMU = null; }
    if (osHoveredRegion !== null) { try { map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false }); } catch(err) {} osHoveredRegion = null; }
    map.getCanvas().style.cursor = '';
    osHideHoverLabel();
  });

  map.on('click', e => {
    const wmuMode = typeof osWMUInteractionActive === 'function' && osWMUInteractionActive();
    if (wmuMode) {
      const wf = typeof osTopWMUFeatureAtPoint === 'function' ? osTopWMUFeatureAtPoint(e.point) : null;
      if (wf) {
        const id = osNormalizeWMU(wf.properties && (wf.properties.wmu_id || wf.properties.MU || wf.properties.WMUNIT_NUM || ''));
        if (typeof osSelectedRegionContainsWMU !== 'function' || osSelectedRegionContainsWMU(id)) {
          const active = typeof osActiveWMUs === 'function' ? osActiveWMUs() : new Set();
          if (!active.size || active.has(id)) { osSelectWMU(id); return; }
        }
      }
    }
    const rf = typeof osTopRegionFeatureAtPoint === 'function' ? osTopRegionFeatureAtPoint(e.point) : null;
    if (rf) {
      const rid = String(rf.properties && rf.properties.region_id || '');
      if (rid && typeof osToggleRegionSelection === 'function') { osToggleRegionSelection(rid); return; }
    }
  });
}

function osRenderPanel() {
  const panel = document.getElementById('osResultsPanel');
  const title = document.getElementById('osPanelTitle');
  const count = document.getElementById('osResultsCount') || document.getElementById('osPanelCount');
  const crumbs = document.getElementById('osCrumbs');
  if (!panel) return;
  const rows = typeof osPanelRows === 'function' ? osPanelRows() : [];
  if (title) title.textContent = osHasSelectedRegions && osHasSelectedRegions() ? osSelectedRegionLabel() : (osSelSpecies ? `${osSelSpecies} across BC` : 'BC General Open Seasons');
  if (count) count.textContent = osHasSelectedRegions && osHasSelectedRegions() ? `${rows.length} rows` : (osAnyHighlightActive && osAnyHighlightActive() ? `${rows.length} matching rows` : 'Select a region');
  if (crumbs && typeof osCrumbsHTML === 'function') crumbs.innerHTML = osCrumbsHTML();

  if (!(osHasSelectedRegions && osHasSelectedRegions())) {
    if (typeof osSetPanelOpen === 'function') osSetPanelOpen(false, false);
    panel.innerHTML = '';
    return;
  }
  if (typeof osSetPanelOpen === 'function') osSetPanelOpen(true, false);
  if (osSelectedWMU && typeof osWMUPanel === 'function') panel.innerHTML = osWMUPanel(rows);
  else if (osSelectedOpportunity && typeof osOpportunityPanel === 'function') panel.innerHTML = osOpportunityPanel(rows);
  else if (osSelSpecies && typeof osSpeciesPanel === 'function') panel.innerHTML = osSpeciesPanel(rows);
  else if (typeof osRegionPanel === 'function') panel.innerHTML = osRegionPanel(rows);
}

Object.assign(window, {
  osToggleSpeciesPanel, osToggleFilterPanel, osToggleLayersPanel,
  osCloseDockPanels, osCloseFilterPanel, osRenderPanel,
  osBindMapEvents, osShowTooltip, osHideTooltip
});

function osRemoveConstructionNotes() {
  document.querySelectorAll('#bcOpenSeasonsPage *').forEach(el => {
    const txt = (el.textContent || '').trim().toLowerCase();
    if (txt.startsWith('under construction')) el.remove();
  });
}
function initOpenSeasonsPage() {
  if (typeof osBuildFilters === 'function') osBuildFilters();
  if (typeof osSyncSelectedRegionVar === 'function') osSyncSelectedRegionVar();
  if (typeof osEnsureProfessionalShell === 'function') osEnsureProfessionalShell();
  osRemoveConstructionNotes();
  if (typeof osRenderPanel === 'function') osRenderPanel();
  if (typeof osSyncTileButtons === 'function') osSyncTileButtons();
  if (typeof osBuildWildfireYearControls === 'function') osBuildWildfireYearControls();
  setTimeout(() => {
    if (typeof osInitMap === 'function') osInitMap();
    osRemoveConstructionNotes();
    if (osMapInstance) {
      osMapInstance.resize();
      if (typeof osRefreshMapStates === 'function') osRefreshMapStates();
      if (typeof osFitBC === 'function') osFitBC(false);
    }
  }, 80);
}
window.initOpenSeasonsPage = initOpenSeasonsPage;


// ══════════════════════════════════════════════════════════════
// GOS V5.5 CONTROL REWIRE
// Direct species dropdown + working filters/layers panels + short hover labels.
// ══════════════════════════════════════════════════════════════
function osCloseDockPanels() {
  ['osFilterPanel','osLayersPanel','osMapToolsPanel','osSpeciesPanel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('visible','open','active');
  });
  document.querySelectorAll('#bcOpenSeasonsPage .os-dock-btn').forEach(b => b.classList.remove('active'));
}
function osTogglePanelById(id, buttonId) {
  const el = document.getElementById(id);
  if (!el) return;
  const willOpen = !(el.classList.contains('visible') || el.classList.contains('open'));
  osCloseDockPanels();
  if (willOpen) {
    el.classList.add('visible','open');
    const btn = document.getElementById(buttonId);
    if (btn) btn.classList.add('active');
  }
}
function osToggleFilterPanel() {
  if (typeof osBuildFilters === 'function') osBuildFilters();
  osTogglePanelById('osFilterPanel', 'osFilterBtn');
}
function osToggleLayersPanel() {
  if (typeof osBuildWildfireYearControls === 'function') osBuildWildfireYearControls();
  osTogglePanelById('osLayersPanel', 'osLayersBtn');
}
function osCloseFilterPanel() { osCloseDockPanels(); }
function osToggleSpeciesPanel() { /* Species is now a direct toolbar select. */ }
function osWireGOSToolbarControls() {
  const filterBtn = document.getElementById('osFilterBtn');
  if (filterBtn) filterBtn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); osToggleFilterPanel(); };
  const layersBtn = document.getElementById('osLayersBtn');
  if (layersBtn) layersBtn.onclick = function(e){ e.preventDefault(); e.stopPropagation(); osToggleLayersPanel(); };
  const sp = document.getElementById('osSpeciesSel');
  if (sp) {
    if (typeof osBuildFilters === 'function') osBuildFilters();
    sp.value = osSelSpecies || '';
    sp.onchange = function(){ if (typeof osOnSpecies === 'function') osOnSpecies(this.value); };
  }
  if (!window.__hsGOSOutsideClickBound) {
    window.__hsGOSOutsideClickBound = true;
    document.addEventListener('click', function(e){
      const page = document.getElementById('bcOpenSeasonsPage');
      if (!page || page.style.display === 'none') return;
      if (e.target.closest && e.target.closest('#bcOpenSeasonsPage .os-topbar')) return;
      osCloseDockPanels();
    }, { once:false });
  }
}
function osShowHoverLabel(lngLat, html) {
  if (!osMapInstance || !lngLat) return;
  if (!_osHoverPopup) {
    _osHoverPopup = new mapboxgl.Popup({ closeButton:false, closeOnClick:false, offset:0, className:'os-hover-fixed-label' });
  }
  _osHoverPopup.setLngLat(lngLat).setHTML(html).addTo(osMapInstance);
}
function osBindMapEvents() {
  const map = osMapInstance;
  if (!map || map._osEventsBoundV55) return;
  map._osEventsBoundV55 = true;
  map.on('mousemove', e => {
    const wmuMode = typeof osWMUInteractionActive === 'function' && osWMUInteractionActive();
    if (wmuMode) {
      const wf = typeof osTopWMUFeatureAtPoint === 'function' ? osTopWMUFeatureAtPoint(e.point) : null;
      if (wf) {
        const id = osNormalizeWMU(wf.properties && (wf.properties.wmu_id || wf.properties.MU || wf.properties.WMUNIT_NUM || ''));
        if (typeof osSelectedRegionContainsWMU !== 'function' || osSelectedRegionContainsWMU(id)) {
          if (osHoveredWMU !== null && osHoveredWMU !== wf.id) {
            try { map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false }); } catch(err) {}
          }
          osHoveredWMU = wf.id;
          try { map.setFeatureState({ source: OS_WMU_SRC, id:wf.id }, { hovered:true }); } catch(err) {}
          map.getCanvas().style.cursor = 'pointer';
          osShowHoverLabel(osFeatureCenter(wf), `<b>WMU ${osEscape(id)}</b>`);
          return;
        }
      }
    }
    if (osHoveredWMU !== null) {
      try { map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false }); } catch(err) {}
      osHoveredWMU = null;
    }
    const rf = typeof osTopRegionFeatureAtPoint === 'function' ? osTopRegionFeatureAtPoint(e.point) : null;
    if (rf) {
      const rid = String(rf.properties && rf.properties.region_id || '');
      if (osHoveredRegion !== null && osHoveredRegion !== rf.id) {
        try { map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false }); } catch(err) {}
      }
      osHoveredRegion = rf.id;
      try { map.setFeatureState({ source: OS_REGION_SRC, id: rf.id }, { hovered:true }); } catch(err) {}
      map.getCanvas().style.cursor = 'pointer';
      osShowHoverLabel(osFeatureCenter(rf), `<b>${osEscape(osRegionName(rid))}</b>`);
      return;
    }
    if (osHoveredRegion !== null) {
      try { map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false }); } catch(err) {}
      osHoveredRegion = null;
    }
    map.getCanvas().style.cursor = '';
    if (typeof osHideHoverLabel === 'function') osHideHoverLabel();
  });
  map.on('mouseleave', () => {
    if (osHoveredWMU !== null) { try { map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false }); } catch(err) {} osHoveredWMU = null; }
    if (osHoveredRegion !== null) { try { map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false }); } catch(err) {} osHoveredRegion = null; }
    map.getCanvas().style.cursor = '';
    if (typeof osHideHoverLabel === 'function') osHideHoverLabel();
  });
  map.on('click', e => {
    const wmuMode = typeof osWMUInteractionActive === 'function' && osWMUInteractionActive();
    if (wmuMode) {
      const wf = typeof osTopWMUFeatureAtPoint === 'function' ? osTopWMUFeatureAtPoint(e.point) : null;
      if (wf) {
        const id = osNormalizeWMU(wf.properties && (wf.properties.wmu_id || wf.properties.MU || wf.properties.WMUNIT_NUM || ''));
        if (typeof osSelectedRegionContainsWMU !== 'function' || osSelectedRegionContainsWMU(id)) {
          const active = typeof osActiveWMUs === 'function' ? osActiveWMUs() : new Set();
          if (!active.size || active.has(id)) { osSelectWMU(id); return; }
        }
      }
    }
    const rf = typeof osTopRegionFeatureAtPoint === 'function' ? osTopRegionFeatureAtPoint(e.point) : null;
    if (rf) {
      const rid = String(rf.properties && rf.properties.region_id || '');
      if (rid && typeof osToggleRegionSelection === 'function') { osToggleRegionSelection(rid); return; }
    }
  });
}
// V5.6: final non-recursive initializer. Do not wrap window.initOpenSeasonsPage here;
// function declarations are hoisted and wrapping it can call itself recursively.
function initOpenSeasonsPage() {
  if (typeof osBuildFilters === 'function') osBuildFilters();
  if (typeof osSyncSelectedRegionVar === 'function') osSyncSelectedRegionVar();
  if (typeof osEnsureProfessionalShell === 'function') osEnsureProfessionalShell();
  if (typeof osRemoveConstructionNotes === 'function') osRemoveConstructionNotes();
  if (typeof osRenderPanel === 'function') osRenderPanel();
  if (typeof osSyncTileButtons === 'function') osSyncTileButtons();
  if (typeof osBuildWildfireYearControls === 'function') osBuildWildfireYearControls();
  if (typeof osWireGOSToolbarControls === 'function') osWireGOSToolbarControls();

  const oldFs = document.getElementById('osFullscreenBtn');
  if (oldFs) oldFs.remove();

  setTimeout(() => {
    if (typeof osInitMap === 'function') osInitMap();
    if (typeof osRemoveConstructionNotes === 'function') osRemoveConstructionNotes();
    if (typeof osWireGOSToolbarControls === 'function') osWireGOSToolbarControls();
    if (typeof osSyncTileButtons === 'function') osSyncTileButtons();
    if (window.osMapInstance) {
      try { window.osMapInstance.resize(); } catch(e) {}
      if (typeof osRefreshMapStates === 'function') osRefreshMapStates();
      if (typeof osFitBC === 'function') osFitBC(false);
    }
  }, 80);
}
window.initOpenSeasonsPage = initOpenSeasonsPage;
Object.assign(window, {
  initOpenSeasonsPage, osToggleFilterPanel, osToggleLayersPanel, osToggleSpeciesPanel,
  osCloseDockPanels, osCloseFilterPanel, osWireGOSToolbarControls, osBindMapEvents
});

// ══════════════════════════════════════════════════════════════
// GOS V5.7 — species reset + always-on multi-region selection
// - Changing species resets selected region/WMU/opportunity and previews all matching regions across BC.
// - Region clicks always toggle multiple selected regions, including while a species is selected.
// - Species + selected regions stays in region-selection mode so users can add/remove regions.
//   WMU click mode starts after choosing an exact opportunity or enabling Show WMUs.
// ══════════════════════════════════════════════════════════════
(function(){
  function safeSetPanelOpen(open, userAction) {
    if (typeof osSetPanelOpen === 'function') osSetPanelOpen(!!open, !!userAction);
    else {
      const panel = document.querySelector('.os-panel');
      if (panel) panel.classList.toggle('open', !!open);
    }
  }

  function gosSelectedKeys() {
    return (typeof osSelectedRegionKeys === 'function') ? osSelectedRegionKeys() : [];
  }

  // Multi-region is now the default/only behavior.
  window.osMultiRegionMode = true;
  osMultiRegionMode = true;
  osSetMultiRegionMode = function(){
    osMultiRegionMode = true;
    const cb = document.getElementById('osMultiRegionMode');
    if (cb) cb.checked = true;
  };

  // Keep the details panel closed until the user actually selects a region/WMU/opportunity.
  osShouldAutoOpenPanel = function() {
    return (typeof osHasSelectedRegions === 'function' && osHasSelectedRegions()) || !!osSelectedWMU || !!osSelectedOpportunity;
  };

  // With a species selected, stay in region-select mode so users can select multiple regions.
  // WMU mode starts after exact opportunity selection, an already-selected WMU, or manual Show WMUs.
  osWMUInteractionActive = function() {
    return (typeof osHasSelectedRegions === 'function' && osHasSelectedRegions()) && (!!osSelectedOpportunity || !!osSelectedWMU || !!window.osShowWMUs);
  };

  osToggleRegionSelection = function(regionKey) {
    const key = String(regionKey || '');
    if (!key) return;

    if (!osSelectedRegions || !(osSelectedRegions instanceof Set)) osSelectedRegions = new Set();
    if (osSelectedRegions.has(key)) osSelectedRegions.delete(key);
    else osSelectedRegions.add(key);

    if (typeof osSyncSelectedRegionVar === 'function') osSyncSelectedRegionVar();
    osSelectedWMU = null;
    // Do not clear species; this is exactly the species + multi-region workflow.
    if (typeof osRefreshMapStates === 'function') osRefreshMapStates();
    if (typeof osRenderPanel === 'function') osRenderPanel();

    const hasRegions = gosSelectedKeys().length > 0;
    if (hasRegions) {
      safeSetPanelOpen(true, false);
      // If a species is active, do not auto-zoom after every region click. It keeps the full-province
      // preview usable so the user can keep selecting multiple matching regions.
      if (!osSelSpecies && !osSelectedOpportunity && typeof osFitRegions === 'function') osFitRegions();
    } else {
      safeSetPanelOpen(false, false);
      if (typeof osFitBC === 'function') osFitBC(true);
    }
  };
  osSelectRegion = function(regionKey) { osToggleRegionSelection(regionKey); };

  osSelectSpecies = function(species) {
    const next = String(species || '');
    osSelSpecies = next;
    osSelectedOpportunity = '';
    osSelectedWMU = null;
    // Reset regions when changing species so all matching regions across BC are shown.
    if (!osSelectedRegions || !(osSelectedRegions instanceof Set)) osSelectedRegions = new Set();
    osSelectedRegions.clear();
    if (typeof osSyncSelectedRegionVar === 'function') osSyncSelectedRegionVar();

    if (typeof osSyncFilterControls === 'function') osSyncFilterControls();
    if (typeof osRefreshMapStates === 'function') osRefreshMapStates();
    if (typeof osRenderPanel === 'function') osRenderPanel();
    safeSetPanelOpen(false, false);
    if (typeof osFitBC === 'function') osFitBC(true);
  };
  osOnSpecies = function(v) { osSelectSpecies(v); };

  // Keep the toolbar select wired to the direct species reset function.
  const oldWire = (typeof osWireGOSToolbarControls === 'function') ? osWireGOSToolbarControls : null;
  osWireGOSToolbarControls = function() {
    if (oldWire) oldWire();
    const sp = document.getElementById('osSpeciesSel');
    if (sp) {
      sp.value = osSelSpecies || '';
      sp.onchange = function(){ osSelectSpecies(this.value); };
    }
  };

  // Override refresh so species + selected regions does not hide the region hit layer.
  const oldRefresh = (typeof osRefreshMapStates === 'function') ? osRefreshMapStates : null;
  osRefreshMapStates = function() {
    const map = osMapInstance;
    if (!map || !map.getSource || !map.getSource(OS_WMU_SRC)) { if (oldRefresh) oldRefresh(); return; }
    const wmuGeo = (typeof osGetWMUGeoJSON === 'function') ? osGetWMUGeoJSON() : ((typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON));
    const regGeo = (typeof osGetRegionGeoJSON === 'function') ? osGetRegionGeoJSON() : ((typeof BC_REGION_GEOJSON !== 'undefined') ? BC_REGION_GEOJSON : null);
    const activeWMUs = (typeof osActiveWMUs === 'function') ? osActiveWMUs() : new Set();
    const activeRegions = (typeof osActiveRegions === 'function') ? osActiveRegions() : new Set();
    const selectedKeys = gosSelectedKeys();
    const hasRegion = selectedKeys.length > 0;
    const hasHighlight = (typeof osAnyHighlightActive === 'function') ? osAnyHighlightActive() : !!osSelSpecies;
    const showWMUs = !!window.osShowWMUs || (hasRegion && (!!osSelectedOpportunity || !!osSelectedWMU));

    (wmuGeo && wmuGeo.features || []).forEach((feat, i) => {
      const id = osNormalizeWMU(feat.properties && (feat.properties.wmu_id || feat.properties.MU || feat.properties.WMUNIT_NUM || feat.properties.mu || ''));
      const reg = osWMURegion(id);
      const inRegion = hasRegion && osSelectedRegions.has(reg);
      const activeMatch = showWMUs && (!hasRegion || inRegion) && activeWMUs.has(id);
      try {
        map.setFeatureState({ source: OS_WMU_SRC, id:i }, {
          wmuHidden: !showWMUs,
          inRegion: !!inRegion,
          outsideRegion: !!(hasRegion && !inRegion),
          noMatch: !!(showWMUs && (!hasRegion || inRegion) && !activeWMUs.has(id)),
          activeMatch: !!activeMatch,
          selectedWMU: !!(osSelectedWMU && id === osSelectedWMU),
          hovered:false
        });
      } catch(e) {}
    });

    (regGeo && regGeo.features || []).forEach((feat, i) => {
      const rid = String(feat.properties && feat.properties.region_id || '');
      const selected = osSelectedRegions && osSelectedRegions.has(rid);
      const activeWhenPreviewing = !hasRegion && hasHighlight && activeRegions.has(rid);
      const noMatchWhenPreviewing = !hasRegion && hasHighlight && !activeRegions.has(rid);
      try {
        map.setFeatureState({ source: OS_REGION_SRC, id:i }, {
          selected,
          dimmed: !!(hasRegion && !selected),
          activeMatch: !!activeWhenPreviewing,
          noMatch: !!noMatchWhenPreviewing,
          hovered:false
        });
      } catch(e) {}
    });

    try { if (map.getLayer(OS_REGION_HIT)) map.setLayoutProperty(OS_REGION_HIT, 'visibility', showWMUs ? 'none' : 'visible'); } catch(e) {}
    try { if (map.getLayer(OS_WMU_FILL)) map.setLayoutProperty(OS_WMU_FILL, 'visibility', 'visible'); } catch(e) {}
    try { if (map.getLayer(OS_WMU_LINE)) map.setLayoutProperty(OS_WMU_LINE, 'visibility', 'visible'); } catch(e) {}
    if (typeof osUpdateMapStatus === 'function') osUpdateMapStatus();
    if (typeof osApplyOverlayOpacity === 'function') osApplyOverlayOpacity(osOverlayVisibility);
  };

  Object.assign(window, {
    osSetMultiRegionMode,
    osToggleRegionSelection,
    osSelectRegion,
    osSelectSpecies,
    osOnSpecies,
    osWMUInteractionActive,
    osShouldAutoOpenPanel,
    osRefreshMapStates,
    osWireGOSToolbarControls
  });
})();

// ══════════════════════════════════════════════════════════════
// GOS V5.9 — Species-specific LEH-only zones + synopsis links
// Uses uploaded leh_zones.json. LEH zones are only shown after both a species and a WMU are selected.
// ══════════════════════════════════════════════════════════════
(function(){
  const OS_LEH_SRC = 'os-leh-zones-src';
  const OS_LEH_FILL = 'os-leh-zones-fill';
  const OS_LEH_LINE = 'os-leh-zones-line';
  const OS_LEH_LABEL = 'os-leh-zones-label';
  const OS_SYNOPSIS_PDF = './2024-2026%20hunting%20synopsis.pdf';
  const OS_SYNOPSIS_REGION_PAGE = { '1':21, '2':28, '3':34, '4':38, '5':44, '6':50, '7A':57, '7B':62, '8':68 };
  // Map reference -> PDF page lookup extracted from the 2024–2026 synopsis.
  // Uses the highest matching PDF page when a map is referenced in both tables and map pages.
  const OS_SYNOPSIS_MAP_PAGE = {
    'A1':24,
    'A2':24,
    'A3':24,
    'A4':24,
    'A5':24,
    'A6':24,
    'A7':24,
    'A8':24,
    'A9':24,
    'A10':24,
    'A11':25,
    'A12':25,
    'A13':25,
    'A14':25,
    'A15':25,
    'A16':26,
    'A17':26,
    'A18':26,
    'A19':26,
    'A20':26,
    'A21':26,
    'A22':26,
    'A23':26,
    'A24':26,
    'A25':26,
    'A26':26,
    'A27':26,
    'A28':26,
    'A29':26,
    'A30':27,
    'A31':27,
    'A32':27,
    'A33':27,
    'A34':27,
    'A35':27,
    'A36':27,
    'A37':27,
    'B1':31,
    'B2':31,
    'B3':31,
    'B4':31,
    'B5':31,
    'B6':31,
    'B7':31,
    'B8':31,
    'B9':31,
    'B10':31,
    'B11':31,
    'B12':32,
    'B13':32,
    'B14':32,
    'B15':32,
    'B16':32,
    'B17':32,
    'B18':32,
    'B19':32,
    'B20':32,
    'B21':32,
    'B22':32,
    'B23':33,
    'B24':33,
    'B25':33,
    'B26':33,
    'B27':33,
    'B28':33,
    'B29':33,
    'B30':33,
    'B31':33,
    'B32':33,
    'B33':33,
    'C1':37,
    'C2':37,
    'C3':37,
    'C4':37,
    'C5':37,
    'C6':37,
    'C7':37,
    'C8':37,
    'C9':37,
    'C10':37,
    'C11':37,
    'C12':37,
    'C13':37,
    'C14':35,
    'C15':37,
    'C17':37,
    'C18':37,
    'C19':37,
    'C20':37,
    'C21':37,
    'C22':37,
    'C23':37,
    'D1':42,
    'D2':42,
    'D3':42,
    'D4':42,
    'D5':42,
    'D6':42,
    'D7':42,
    'D8':42,
    'D9':42,
    'D10':42,
    'D11':42,
    'D12':43,
    'D13':43,
    'D14':43,
    'D15':43,
    'D16':43,
    'D17':43,
    'D18':43,
    'D19':43,
    'D20':43,
    'D21':43,
    'D22':43,
    'D23':43,
    'D24':43,
    'D25':43,
    'D26':43,
    'E1':47,
    'E2':47,
    'E3':47,
    'E4':47,
    'E5':47,
    'E6':47,
    'E7':47,
    'E8':47,
    'E9':47,
    'E10':48,
    'E11':48,
    'E12':48,
    'E13':48,
    'E14':48,
    'E15':48,
    'E16':48,
    'E17':48,
    'E18':48,
    'E19':49,
    'E20':49,
    'E21':49,
    'E22':49,
    'E23':49,
    'E24':49,
    'E25':49,
    'E26':49,
    'F1':53,
    'F2':53,
    'F3':53,
    'F4':53,
    'F5':53,
    'F6':53,
    'F7':53,
    'F8':53,
    'F9':53,
    'F10':53,
    'F11':53,
    'F12':53,
    'F13':54,
    'F14':54,
    'F15':54,
    'F16':54,
    'F17':54,
    'F19':54,
    'F20':54,
    'F21':54,
    'F22':54,
    'F23':54,
    'F24':54,
    'F25':54,
    'F26':54,
    'F27':54,
    'F28':55,
    'F29':55,
    'F30':55,
    'F31':55,
    'F32':55,
    'F33':55,
    'F34':55,
    'F35':55,
    'F36':55,
    'F37':55,
    'F38':55,
    'F39':56,
    'F40':56,
    'F41':56,
    'G1':60,
    'G2':60,
    'G5':60,
    'G6':60,
    'G7':60,
    'G8':60,
    'G9':60,
    'G10':60,
    'G11':60,
    'G12':60,
    'G13':60,
    'G14':60,
    'G15':60,
    'G16':60,
    'G17':61,
    'G18':61,
    'G19':61,
    'G20':61,
    'G21':61,
    'G22':61,
    'G23':61,
    'G24':61,
    'G25':61,
    'H1':65,
    'H2':65,
    'H3':65,
    'H4':65,
    'H5':66,
    'H6':66,
    'H7':66,
    'H8':66,
    'H9':66,
    'H10':66,
    'H11':66,
    'H12':66,
    'H13':63,
    'H14':66,
    'H15':66,
    'H16':66,
    'H17':66,
    'H18':66,
    'H19':67,
    'H20':67,
    'H21':67,
    'H22':67,
    'H23':67,
    'H24':67,
    'H25':67,
    'H26':67,
    'H27':67,
    'H28':67,
    'H29':67,
    'H30':67,
    'H31':67,
    'H32':67
  };

  window.osShowLEHZones = window.osShowLEHZones !== false;
  let _osLehRaw = null;
  let _osLehFeatures = null;
  let _osLehLoading = null;
  let _osLehLastCount = 0;

  function normTxt(v) {
    return String(v || '')
      .toLowerCase()
      .replace(/\([^)]*\)/g, ' ')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }
  function compactTxt(v) { return normTxt(v).replace(/\s+/g, ''); }
  function selectedSpecies() { return String(window.osSelSpecies || osSelSpecies || '').trim(); }

  function speciesMatches(zoneSpecies, selected) {
    const z = normTxt(zoneSpecies);
    const s = normTxt(selected);
    const zc = compactTxt(zoneSpecies);
    const sc = compactTxt(selected);
    if (!z || !s) return false;
    if (z === s || zc === sc) return true;
    if (z === 'mountain sheep' && /sheep/.test(s)) return true;
    if (z === 'mule deer' && (s.includes('mule deer') || s.includes('black tailed'))) return true;
    if (z === 'white tailed deer' && (s.includes('white tailed') || s.includes('white tail') || s.includes('whitetail'))) return true;
    if (z === 'mountain goat' && s.includes('mountain goat')) return true;
    return false;
  }

  function emptyFC() { return { type:'FeatureCollection', features:[] }; }

  function loadLEHZones() {
    if (_osLehFeatures) return Promise.resolve(_osLehFeatures);
    if (_osLehLoading) return _osLehLoading;
    _osLehLoading = fetch('./leh_zones.json')
      .then(r => {
        if (!r.ok) throw new Error('leh_zones.json failed to load');
        return r.json();
      })
      .then(data => {
        _osLehRaw = data;
        const zones = data && data.zones ? data.zones : {};
        _osLehFeatures = Object.entries(zones).map(([key, z]) => ({
          type:'Feature',
          id:key,
          properties:{
            id:key,
            mu:String(z.mu || ''),
            species:String(z.zt || ''),
            label:String(z.lb || key),
            source:'BC LEH zone'
          },
          geometry:z.g
        })).filter(f => f.geometry && f.properties.mu && f.properties.species);
        return _osLehFeatures;
      })
      .catch(err => {
        console.warn('[GOS LEH zones]', err);
        _osLehLoading = null;
        return [];
      });
    return _osLehLoading;
  }

  function selectedRegionKeysSafe() {
    if (typeof osSelectedRegionKeys === 'function') return osSelectedRegionKeys().map(String);
    if (window.osSelectedRegions && window.osSelectedRegions instanceof Set) return [...window.osSelectedRegions].map(String);
    if (typeof osSelectedRegions !== 'undefined' && osSelectedRegions instanceof Set) return [...osSelectedRegions].map(String);
    return [];
  }

  function currentLEHFeatures(allFeatures) {
    const sp = selectedSpecies();
    const selectedWmu = String(window.osSelectedWMU || osSelectedWMU || '').trim();
    // LEH-only zones are intentionally a zoomed-in context layer. Do not show them
    // for species-only or region-only browsing, because that creates too much clutter
    // and can imply restrictions apply everywhere.
    if (!sp || !selectedWmu || !Array.isArray(allFeatures)) return [];
    return allFeatures.filter(f => {
      const p = f.properties || {};
      const mu = osNormalizeWMU ? osNormalizeWMU(p.mu) : String(p.mu || '');
      if (!speciesMatches(p.species, sp)) return false;
      return mu === selectedWmu;
    });
  }

  function ensureLEHLayers() {
    const map = window.osMapInstance || osMapInstance;
    if (!map || !map.getStyle) return false;
    try {
      if (!map.getSource(OS_LEH_SRC)) {
        map.addSource(OS_LEH_SRC, { type:'geojson', data:emptyFC() });
      }
      const before = map.getLayer(OS_REGION_HIT) ? OS_REGION_HIT : undefined;
      if (!map.getLayer(OS_LEH_FILL)) {
        map.addLayer({
          id:OS_LEH_FILL,
          type:'fill',
          source:OS_LEH_SRC,
          layout:{ visibility:'none' },
          paint:{
            'fill-color':'#b91c35',
            'fill-opacity':0.20,
            'fill-outline-color':'#7f0020'
          }
        }, before);
      }
      if (!map.getLayer(OS_LEH_LINE)) {
        map.addLayer({
          id:OS_LEH_LINE,
          type:'line',
          source:OS_LEH_SRC,
          layout:{ visibility:'none' },
          paint:{
            'line-color':'#7f0020',
            'line-width':['interpolate',['linear'],['zoom'],4,1.4,8,2.4,11,3.4],
            'line-opacity':0.95
          }
        }, before);
      }
      if (!map.getLayer(OS_LEH_LABEL)) {
        map.addLayer({
          id:OS_LEH_LABEL,
          type:'symbol',
          source:OS_LEH_SRC,
          minzoom:7.2,
          layout:{
            visibility:'none',
            'text-field':['coalesce',['get','label'],['get','id']],
            'text-size':11,
            'text-font':['Open Sans Semibold','Arial Unicode MS Bold'],
            'text-anchor':'center',
            'text-allow-overlap':false
          },
          paint:{
            'text-color':'#ffd2dc',
            'text-halo-color':'rgba(24,4,8,.88)',
            'text-halo-width':1.35
          }
        }, before);
      }
      if (!map._osLehClickBound) {
        map._osLehClickBound = true;
        map.on('click', OS_LEH_FILL, e => {
          const p = e.features && e.features[0] && e.features[0].properties || {};
          const html = `<div class="os-leh-pop"><b>${osEscape(p.species || 'LEH-only zone')}</b><span>${osEscape(p.label || p.id || '')}</span><span>WMU ${osEscape(p.mu || '')}</span></div>`;
          new mapboxgl.Popup({ closeButton:true, className:'os-leh-popup' }).setLngLat(e.lngLat).setHTML(html).addTo(map);
        });
      }
      return true;
    } catch (err) {
      console.warn('[GOS LEH layer setup]', err);
      return false;
    }
  }

  function setLEHVisibility(on) {
    const map = window.osMapInstance || osMapInstance;
    if (!map) return;
    [OS_LEH_FILL, OS_LEH_LINE, OS_LEH_LABEL].forEach(id => {
      try { if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); } catch(e) {}
    });
  }

  function osRefreshLEHZones() {
    const map = window.osMapInstance || osMapInstance;
    const sp = selectedSpecies();
    const enabled = window.osShowLEHZones !== false;
    const selectedWmu = String(window.osSelectedWMU || osSelectedWMU || '').trim();
    if (!map || !sp || !selectedWmu || !enabled) {
      _osLehLastCount = 0;
      try { if (map && ensureLEHLayers()) map.getSource(OS_LEH_SRC).setData(emptyFC()); } catch(e) {}
      setLEHVisibility(false);
      return;
    }
    loadLEHZones().then(all => {
      if (!ensureLEHLayers()) return;
      const feats = currentLEHFeatures(all);
      _osLehLastCount = feats.length;
      const src = map.getSource(OS_LEH_SRC);
      if (src) src.setData({ type:'FeatureCollection', features:feats });
      setLEHVisibility(feats.length > 0);
    });
  }

  function osToggleLEHZones(checked) {
    window.osShowLEHZones = !!checked;
    osRefreshLEHZones();
  }

  function synopsisPageForRegion(key) {
    return OS_SYNOPSIS_REGION_PAGE[String(key || '')] || 1;
  }
  function synopsisHref(page) {
    return `${OS_SYNOPSIS_PDF}#page=${encodeURIComponent(String(page || 1))}`;
  }
  function selectedOrRowRegions(rows) {
    const keys = selectedRegionKeysSafe();
    if (keys.length) return keys;
    if (typeof osRegionsForRows === 'function' && rows && rows.length) return osRegionsForRows(rows).map(String);
    return [];
  }
  function osRowMapRefs(rows) {
    const found = new Set();
    (rows || []).forEach(r => {
      const hay = [r.species, r.management_units, r.weapon_type, r.bag_limit, r.notes, r.class, r.season_text, r.season_open, r.season_close]
        .map(v => String(v || '')).join(' ');
      hay.replace(/\bMap\s+([A-H]\d{1,2})\b/g, (_, ref) => { found.add(ref); return _; });
    });
    return [...found].sort((a,b) => a.localeCompare(b, undefined, { numeric:true }));
  }
  function osSynopsisMapLinksForRows(rows) {
    const refs = osRowMapRefs(rows);
    return refs.map(ref => {
      const page = OS_SYNOPSIS_MAP_PAGE[ref];
      if (!page) return `<span class="os-leh-muted">Map ${osEscape(ref)}</span>`;
      return `<a href="${synopsisHref(page)}" target="_blank" rel="noopener">Open Map ${osEscape(ref)}</a>`;
    }).join('');
  }

  function osLEHSynopsisNotice(rows) {
    const sp = selectedSpecies();
    const exactWmu = String(window.osSelectedWMU || osSelectedWMU || '').trim();
    // Only show LEH-zone context when the map is at a meaningful WMU-level context.
    if (!sp || !exactWmu) return '';
    const regs = selectedOrRowRegions(rows).slice(0, 4);
    const zones = _osLehLastCount;
    const zoneText = zones > 0
      ? `${zones} LEH-only zone${zones === 1 ? '' : 's'} shown for ${sp} in WMU ${exactWmu}.`
      : `No matching LEH-only zone polygons found for ${sp} in WMU ${exactWmu}.`;
    const regionLinks = regs.map(k => `<a href="${synopsisHref(synopsisPageForRegion(k))}" target="_blank" rel="noopener">Open ${osEscape(osRegionName ? osRegionName(k) : 'Region ' + k)} synopsis</a>`).join('');
    const mapLinks = osSynopsisMapLinksForRows(rows || []);
    return `<div class="os-leh-note">
      <strong>LEH-only zone context</strong>
      <span>${osEscape(zoneText)} Maroon/red areas are LEH zone polygons for the selected species and WMU only. Closed/special-map areas still need the synopsis map until we have official closed-area polygons.</span>
      ${zones > 0 ? `<span class="os-leh-zone-count">${zones} zone${zones === 1 ? '' : 's'} on map</span>` : ''}
      <div class="os-leh-actions">${regionLinks}${mapLinks}</div>
    </div>`;
  }

  function prependNotice(fn) {
    return function(rows) {
      const html = fn.apply(this, arguments);
      return osLEHSynopsisNotice(rows || []) + html;
    };
  }

  const _oldRefresh = (typeof osRefreshMapStates === 'function') ? osRefreshMapStates : null;
  if (_oldRefresh && !_oldRefresh._osLehWrapped) {
    const wrapped = function() {
      const r = _oldRefresh.apply(this, arguments);
      setTimeout(osRefreshLEHZones, 0);
      return r;
    };
    wrapped._osLehWrapped = true;
    osRefreshMapStates = wrapped;
    window.osRefreshMapStates = wrapped;
  }

  const _oldSetTile = (typeof osSetTile === 'function') ? osSetTile : null;
  if (_oldSetTile && !_oldSetTile._osLehWrapped) {
    const wrappedTile = function() {
      const r = _oldSetTile.apply(this, arguments);
      setTimeout(osRefreshLEHZones, 650);
      return r;
    };
    wrappedTile._osLehWrapped = true;
    osSetTile = wrappedTile;
    window.osSetTile = wrappedTile;
  }

  if (typeof osWMUPanel === 'function' && !osWMUPanel._osLehWrapped) { osWMUPanel = prependNotice(osWMUPanel); osWMUPanel._osLehWrapped = true; window.osWMUPanel = osWMUPanel; }
  if (typeof osSpeciesPanel === 'function' && !osSpeciesPanel._osLehWrapped) { osSpeciesPanel = prependNotice(osSpeciesPanel); osSpeciesPanel._osLehWrapped = true; window.osSpeciesPanel = osSpeciesPanel; }
  if (typeof osOpportunityPanel === 'function' && !osOpportunityPanel._osLehWrapped) { osOpportunityPanel = prependNotice(osOpportunityPanel); osOpportunityPanel._osLehWrapped = true; window.osOpportunityPanel = osOpportunityPanel; }

  const _oldWire = (typeof osWireGOSToolbarControls === 'function') ? osWireGOSToolbarControls : null;
  if (_oldWire && !_oldWire._osLehWrapped) {
    const wrappedWire = function() {
      const r = _oldWire.apply(this, arguments);
      const t = document.getElementById('osShowLEHZonesToggle');
      if (t) t.checked = window.osShowLEHZones !== false;
      return r;
    };
    wrappedWire._osLehWrapped = true;
    osWireGOSToolbarControls = wrappedWire;
    window.osWireGOSToolbarControls = wrappedWire;
  }

  Object.assign(window, { osToggleLEHZones, osRefreshLEHZones });
})();

// ══════════════════════════════════════════════════════════════
// GOS V6.1 — Region species WMU visibility + region-level LEH overlay fix
// - Region + species now reliably lights matching WMUs on the map.
// - LEH zones still require species + selected WMU, but include all matching
//   LEH zones in the selected region(s), because some LEH zones cross WMU lines.
// ══════════════════════════════════════════════════════════════
(function(){
  const LEH_SRC = 'os-leh-zones-src';
  const LEH_FILL = 'os-leh-zones-fill';
  const LEH_LINE = 'os-leh-zones-line';
  const LEH_LABEL = 'os-leh-zones-label';
  const SYN_PDF = './2024-2026%20hunting%20synopsis.pdf';
  const SYN_REGION_PAGE = { '1':21, '2':28, '3':34, '4':38, '5':44, '6':50, '7A':57, '7B':62, '8':68 };
  let _lehFeaturesV61 = null;
  let _lehLoadingV61 = null;
  let _lehLastCountV61 = 0;

  function safeNormText(v) {
    return String(v || '').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
  }
  function safeCompactText(v) { return safeNormText(v).replace(/\s+/g,''); }
  function v61SelectedSpecies() { return String((typeof osSelSpecies !== 'undefined' && osSelSpecies) || window.osSelSpecies || '').trim(); }
  function v61SelectedWMU() { return String((typeof osSelectedWMU !== 'undefined' && osSelectedWMU) || window.osSelectedWMU || '').trim(); }
  function v61SelectedRegionKeys() {
    try { if (typeof osSelectedRegionKeys === 'function') return osSelectedRegionKeys().map(String).filter(Boolean); } catch(e) {}
    try { if (typeof osSelectedRegions !== 'undefined' && osSelectedRegions instanceof Set) return [...osSelectedRegions].map(String).filter(Boolean); } catch(e) {}
    return [];
  }
  function v61SpeciesMatches(zoneSpecies, selected) {
    const z = safeNormText(zoneSpecies), s = safeNormText(selected);
    const zc = safeCompactText(zoneSpecies), sc = safeCompactText(selected);
    if (!z || !s) return false;
    if (z === s || zc === sc) return true;
    if (z === 'mountain goat' && s.includes('mountain goat')) return true;
    if (z === 'mule deer' && (s.includes('mule deer') || s.includes('black tailed'))) return true;
    if (z === 'white tailed deer' && (s.includes('white tailed') || s.includes('white tail') || s.includes('whitetail'))) return true;
    if (z === 'mountain sheep' && s.includes('sheep')) return true;
    return false;
  }
  function emptyFC() { return { type:'FeatureCollection', features:[] }; }

  function v61LoadLEH() {
    if (_lehFeaturesV61) return Promise.resolve(_lehFeaturesV61);
    if (_lehLoadingV61) return _lehLoadingV61;
    _lehLoadingV61 = fetch('./leh_zones.json')
      .then(r => { if (!r.ok) throw new Error('leh_zones.json failed to load'); return r.json(); })
      .then(data => {
        const zones = data && data.zones ? data.zones : {};
        _lehFeaturesV61 = Object.entries(zones).map(([key,z]) => ({
          type:'Feature',
          id:key,
          properties:{
            id:key,
            mu:String(z.mu || ''),
            species:String(z.zt || ''),
            label:String(z.lb || key),
            source:'BC LEH zone'
          },
          geometry:z.g
        })).filter(f => f.geometry && f.properties.mu && f.properties.species);
        return _lehFeaturesV61;
      })
      .catch(err => { console.warn('[GOS LEH V6.1]', err); _lehLoadingV61 = null; return []; });
    return _lehLoadingV61;
  }

  function v61EnsureLEHLayers() {
    const map = (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance;
    if (!map || !map.getStyle) return false;
    try {
      if (!map.getSource(LEH_SRC)) map.addSource(LEH_SRC, { type:'geojson', data:emptyFC() });
      const before = map.getLayer(OS_REGION_HIT) ? OS_REGION_HIT : undefined;
      if (!map.getLayer(LEH_FILL)) map.addLayer({ id:LEH_FILL, type:'fill', source:LEH_SRC, layout:{ visibility:'none' }, paint:{ 'fill-color':'#b91c35', 'fill-opacity':0.20, 'fill-outline-color':'#7f0020' } }, before);
      if (!map.getLayer(LEH_LINE)) map.addLayer({ id:LEH_LINE, type:'line', source:LEH_SRC, layout:{ visibility:'none' }, paint:{ 'line-color':'#7f0020', 'line-width':['interpolate',['linear'],['zoom'],4,1.4,8,2.5,11,3.5], 'line-opacity':0.96 } }, before);
      if (!map.getLayer(LEH_LABEL)) map.addLayer({ id:LEH_LABEL, type:'symbol', source:LEH_SRC, minzoom:7.2, layout:{ visibility:'none', 'text-field':['coalesce',['get','label'],['get','id']], 'text-size':11, 'text-font':['Open Sans Semibold','Arial Unicode MS Bold'], 'text-anchor':'center', 'text-allow-overlap':false }, paint:{ 'text-color':'#ffd2dc', 'text-halo-color':'rgba(24,4,8,.90)', 'text-halo-width':1.35 } }, before);
      if (!map._osLehClickBoundV61) {
        map._osLehClickBoundV61 = true;
        map.on('click', LEH_FILL, e => {
          const p = (e.features && e.features[0] && e.features[0].properties) || {};
          const html = `<div class="os-leh-pop"><b>${osEscape(p.species || 'LEH-only zone')}</b><span>${osEscape(p.label || p.id || '')}</span><span>Reference WMU ${osEscape(p.mu || '')}</span></div>`;
          new mapboxgl.Popup({ closeButton:true, className:'os-leh-popup' }).setLngLat(e.lngLat).setHTML(html).addTo(map);
        });
      }
      // Always force the intended style, even if an older patch created the layers.
      if (map.getLayer(LEH_FILL)) { map.setPaintProperty(LEH_FILL, 'fill-color', '#b91c35'); map.setPaintProperty(LEH_FILL, 'fill-opacity', 0.20); }
      if (map.getLayer(LEH_LINE)) { map.setPaintProperty(LEH_LINE, 'line-color', '#7f0020'); map.setPaintProperty(LEH_LINE, 'line-opacity', 0.96); }
      return true;
    } catch(e) { console.warn('[GOS LEH V6.1 layers]', e); return false; }
  }
  function v61SetLEHVisible(on) {
    const map = (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance;
    if (!map) return;
    [LEH_FILL, LEH_LINE, LEH_LABEL].forEach(id => { try { if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); } catch(e) {} });
  }

  function v61CurrentLEHFeatures(all) {
    const sp = v61SelectedSpecies();
    const selectedWmu = v61SelectedWMU();
    if (!sp || !selectedWmu || !Array.isArray(all)) return [];
    let regionKeys = v61SelectedRegionKeys();
    if (!regionKeys.length && typeof osWMURegion === 'function') regionKeys = [String(osWMURegion(selectedWmu) || '')].filter(Boolean);
    const selectedRegionSet = new Set(regionKeys.map(String));
    return all.filter(f => {
      const p = f.properties || {};
      if (!v61SpeciesMatches(p.species, sp)) return false;
      const zoneMu = (typeof osNormalizeWMU === 'function') ? osNormalizeWMU(p.mu) : String(p.mu || '');
      const zoneRegion = (typeof osWMURegion === 'function') ? String(osWMURegion(zoneMu) || '') : '';
      // Important: show all matching LEH zones that are in the selected region(s),
      // not only zones whose reference MU equals the selected WMU. Some zones cross
      // WMU boundaries, and filtering by exact MU can hide them.
      return selectedRegionSet.size ? selectedRegionSet.has(zoneRegion) : zoneMu === selectedWmu;
    });
  }

  function osRefreshLEHZonesV61() {
    const map = (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance;
    const sp = v61SelectedSpecies();
    const selectedWmu = v61SelectedWMU();
    const enabled = window.osShowLEHZones !== false;
    if (!map || !sp || !selectedWmu || !enabled) {
      _lehLastCountV61 = 0;
      try { if (map && v61EnsureLEHLayers()) map.getSource(LEH_SRC).setData(emptyFC()); } catch(e) {}
      v61SetLEHVisible(false);
      return;
    }
    v61LoadLEH().then(all => {
      if (!v61EnsureLEHLayers()) return;
      const feats = v61CurrentLEHFeatures(all);
      _lehLastCountV61 = feats.length;
      const src = map.getSource(LEH_SRC);
      if (src) src.setData({ type:'FeatureCollection', features:feats });
      v61SetLEHVisible(feats.length > 0);
    });
  }

  function v61ActiveWMUSet() {
    try {
      const rows = (typeof osPanelRows === 'function') ? osPanelRows() : [];
      const ids = (typeof osWMUsForRows === 'function') ? osWMUsForRows(rows) : [];
      return new Set(ids.map(id => (typeof osNormalizeWMU === 'function' ? osNormalizeWMU(id) : String(id))));
    } catch(e) { return new Set(); }
  }

  function osRefreshMapStatesV61() {
    const map = (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance;
    if (!map || !map.getSource || !map.getSource(OS_WMU_SRC)) return;
    const wmuGeo = (typeof osGetWMUGeoJSON === 'function') ? osGetWMUGeoJSON() : ((typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON));
    const regGeo = (typeof osGetRegionGeoJSON === 'function') ? osGetRegionGeoJSON() : (typeof BC_REGION_GEOJSON !== 'undefined' ? BC_REGION_GEOJSON : null);
    const selectedKeys = (typeof osSelectedRegionKeys === 'function') ? osSelectedRegionKeys().map(String) : v61SelectedRegionKeys();
    const hasRegion = selectedKeys.length > 0;
    const hasHighlight = (typeof osAnyHighlightActive === 'function') ? osAnyHighlightActive() : !!v61SelectedSpecies();
    const activeRegions = (typeof osActiveRegions === 'function') ? osActiveRegions() : new Set();
    const activeWMUs = v61ActiveWMUSet();
    const forceShowWMUs = !!window.osShowWMUs;
    const showWMUs = !!(forceShowWMUs || (hasRegion && (v61SelectedSpecies() || (typeof osSelectedOpportunity !== 'undefined' && osSelectedOpportunity) || v61SelectedWMU())));

    (wmuGeo && wmuGeo.features || []).forEach((feat, i) => {
      const props = feat.properties || {};
      const id = (typeof osNormalizeWMU === 'function') ? osNormalizeWMU(props.wmu_id || props.WMUNIT_NUM || props.MU || props.mu) : String(props.wmu_id || props.WMUNIT_NUM || '');
      const reg = (typeof osWMURegion === 'function') ? String(osWMURegion(id) || '') : '';
      const inRegion = hasRegion && selectedKeys.includes(reg);
      const activeMatch = showWMUs && (!hasRegion || inRegion) && activeWMUs.has(id);
      try {
        map.setFeatureState({ source:OS_WMU_SRC, id:i }, {
          wmuHidden: !showWMUs,
          inRegion: !!inRegion,
          outsideRegion: !!(hasRegion && !inRegion),
          noMatch: !!(showWMUs && (!hasRegion || inRegion) && !activeWMUs.has(id)),
          activeMatch: !!activeMatch,
          selectedWMU: !!(v61SelectedWMU() && id === v61SelectedWMU()),
          hovered:false
        });
      } catch(e) {}
    });

    (regGeo && regGeo.features || []).forEach((feat, i) => {
      const rid = String((feat.properties || {}).region_id || '');
      const selected = selectedKeys.includes(rid);
      const activeWhenPreviewing = !hasRegion && hasHighlight && activeRegions.has(rid);
      const noMatchWhenPreviewing = !hasRegion && hasHighlight && !activeRegions.has(rid);
      try {
        map.setFeatureState({ source:OS_REGION_SRC, id:i }, {
          selected,
          dimmed: !!(hasRegion && !selected),
          activeMatch: !!activeWhenPreviewing,
          noMatch: !!noMatchWhenPreviewing,
          hovered:false
        });
      } catch(e) {}
    });

    try { if (map.getLayer(OS_REGION_HIT)) map.setLayoutProperty(OS_REGION_HIT, 'visibility', showWMUs ? 'none' : 'visible'); } catch(e) {}
    try { if (map.getLayer(OS_WMU_FILL)) map.setLayoutProperty(OS_WMU_FILL, 'visibility', 'visible'); } catch(e) {}
    try { if (map.getLayer(OS_WMU_LINE)) map.setLayoutProperty(OS_WMU_LINE, 'visibility', 'visible'); } catch(e) {}
    try { if (typeof osUpdateMapStatus === 'function') osUpdateMapStatus(); } catch(e) {}
    try { if (typeof osApplyOverlayOpacity === 'function') osApplyOverlayOpacity(osOverlayVisibility); } catch(e) {}
    setTimeout(osRefreshLEHZonesV61, 0);
  }

  function v61SynopsisHref(page) { return `${SYN_PDF}#page=${encodeURIComponent(String(page || 1))}`; }
  function v61RegionLinks() {
    const regs = v61SelectedRegionKeys();
    return regs.slice(0,4).map(k => `<a href="${v61SynopsisHref(SYN_REGION_PAGE[k] || 1)}" target="_blank" rel="noopener">Open ${osEscape(typeof osRegionName === 'function' ? osRegionName(k) : 'Region ' + k)} synopsis</a>`).join('');
  }
  function v61LEHNotice(rows) {
    const sp = v61SelectedSpecies();
    const wmu = v61SelectedWMU();
    if (!sp || !wmu) return '';
    const regs = v61SelectedRegionKeys();
    const regLabel = regs.length ? regs.map(k => (typeof osRegionName === 'function' ? osRegionName(k) : 'Region ' + k)).join(', ') : 'selected region';
    const zoneText = _lehLastCountV61 > 0
      ? `${_lehLastCountV61} LEH-only zone${_lehLastCountV61 === 1 ? '' : 's'} shown for ${sp} in ${regLabel} while WMU ${wmu} is selected.`
      : `No matching LEH-only zone polygons found for ${sp} in ${regLabel} while WMU ${wmu} is selected.`;
    return `<div class="os-leh-note os-leh-note-v61"><strong>LEH-only zone context</strong><span>${osEscape(zoneText)} Maroon/red areas are LEH zone polygons. Some zones can cross WMU boundaries, so this layer shows matching zones from the selected region instead of only exact-WMU matches.</span><div class="os-leh-actions">${v61RegionLinks()}</div></div>`;
  }

  // Replace the already-wrapped WMU panel with a clean version that uses region-level LEH context.
  if (typeof osSeasonCards === 'function') {
    osWMUPanel = function(rows) {
      const all = osSortRows(BC_OS_DATA.filter(r => osRowHasAnyWMUInSelectedRegions(r) && osRowPassesGlobalFilters(r, true) && osRowAppliesToWMU(r, v61SelectedWMU())));
      const primary = rows && rows.length ? rows : all.filter(r => !v61SelectedSpecies() || r.species === v61SelectedSpecies());
      const other = all.filter(r => !primary.includes(r));
      return `${v61LEHNotice(primary)}<div class="os-region-summary"><b>WMU ${osEscape(v61SelectedWMU())}</b><span>${osEscape(typeof osSelectedRegionLabel === 'function' ? osSelectedRegionLabel() : 'Selected region')}. Selected species/opportunity is shown first. Other species are collapsed below.</span></div>${osSeasonCards(primary, 'primary')}${other.length ? osCollapsibleBlock('Other species in this WMU', `${other.length} additional rows`, osSeasonCards(other, 'other'), false) : ''}`;
    };
    window.osWMUPanel = osWMUPanel;
  }

  function osToggleLEHZonesV61(checked) {
    window.osShowLEHZones = !!checked;
    osRefreshLEHZonesV61();
  }

  osRefreshMapStates = osRefreshMapStatesV61;
  window.osRefreshMapStates = osRefreshMapStatesV61;
  window.osRefreshLEHZones = osRefreshLEHZonesV61;
  window.osToggleLEHZones = osToggleLEHZonesV61;

  // Repaint after this patch loads and after the current style finishes.
  setTimeout(() => { try { osRefreshMapStatesV61(); osRefreshLEHZonesV61(); } catch(e) {} }, 250);
})();

// ══════════════════════════════════════════════════════════════
// GOS V6.2 — WMU click stability + true WMU-intersecting LEH zones
// - WMU clicks are consumed in WMU mode so they do not fall through to region reset.
// - LEH-only zones show only when species + WMU are selected AND the zone polygon intersects that WMU.
// - LEH note is compact and placed below the selected species card.
// - LEH zones have hover labels showing the zone name.
// ══════════════════════════════════════════════════════════════
(function(){
  const LEH_SRC = 'os-leh-zones-src';
  const LEH_FILL = 'os-leh-zones-fill';
  const LEH_LINE = 'os-leh-zones-line';
  const LEH_LABEL = 'os-leh-zones-label';
  const SYN_PDF = './2024-2026%20hunting%20synopsis.pdf';
  const SYN_REGION_PAGE = { '1':21, '2':28, '3':34, '4':38, '5':44, '6':50, '7A':57, '7B':62, '8':68 };
  let _lehFeaturesV62 = null;
  let _lehLoadingV62 = null;
  let _lehLastCountV62 = 0;
  let _lehHoverPopupV62 = null;

  function v62Norm(v) {
    return String(v || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  }
  function v62Compact(v) { return v62Norm(v).replace(/\s+/g, ''); }
  function v62Species() { return String((typeof osSelSpecies !== 'undefined' && osSelSpecies) || '').trim(); }
  function v62WMU() { return String((typeof osSelectedWMU !== 'undefined' && osSelectedWMU) || '').trim(); }
  function v62SpeciesMatches(zoneSpecies, selected) {
    const z = v62Norm(zoneSpecies), s = v62Norm(selected), zc = v62Compact(zoneSpecies), sc = v62Compact(selected);
    if (!z || !s) return false;
    if (z === s || zc === sc) return true;
    if (z === 'mountain sheep' && /sheep/.test(s)) return true;
    if (z === 'mule deer' && (s.includes('mule deer') || s.includes('black tailed'))) return true;
    if (z === 'white tailed deer' && (s.includes('white tailed') || s.includes('white tail') || s.includes('whitetail'))) return true;
    if (z === 'mountain goat' && s.includes('mountain goat')) return true;
    return false;
  }
  function v62EmptyFC() { return { type:'FeatureCollection', features:[] }; }
  function v62CoordsOf(geom) {
    const out = [];
    (function walk(x){
      if (!x) return;
      if (typeof x[0] === 'number' && typeof x[1] === 'number') out.push(x);
      else if (Array.isArray(x)) x.forEach(walk);
    })(geom && geom.coordinates);
    return out;
  }
  function v62BBox(geom) {
    const coords = v62CoordsOf(geom);
    if (!coords.length) return null;
    const xs = coords.map(c=>c[0]), ys = coords.map(c=>c[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }
  function v62BboxIntersects(a,b) {
    return !!(a && b && a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]);
  }
  function v62Rings(geom) {
    if (!geom) return [];
    if (geom.type === 'Polygon') return geom.coordinates || [];
    if (geom.type === 'MultiPolygon') return (geom.coordinates || []).flat();
    return [];
  }
  function v62PointInRing(pt, ring) {
    let inside = false;
    const x = pt[0], y = pt[1];
    for (let i=0, j=ring.length-1; i<ring.length; j=i++) {
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
  function v62PointInGeom(pt, geom) {
    const rings = v62Rings(geom);
    // Treat any ring containment as an intersection test. This is enough for hunting-context overlays,
    // and avoids hiding cross-boundary zones when only a small part intersects the selected WMU.
    return rings.some(r => r && r.length > 2 && v62PointInRing(pt, r));
  }
  function v62Orient(a,b,c) { return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]); }
  function v62OnSeg(a,b,p) {
    return Math.min(a[0],b[0]) <= p[0] && p[0] <= Math.max(a[0],b[0]) && Math.min(a[1],b[1]) <= p[1] && p[1] <= Math.max(a[1],b[1]) && Math.abs(v62Orient(a,b,p)) < 1e-10;
  }
  function v62SegsIntersect(a,b,c,d) {
    const o1 = v62Orient(a,b,c), o2 = v62Orient(a,b,d), o3 = v62Orient(c,d,a), o4 = v62Orient(c,d,b);
    if ((o1 > 0) !== (o2 > 0) && (o3 > 0) !== (o4 > 0)) return true;
    return v62OnSeg(a,b,c) || v62OnSeg(a,b,d) || v62OnSeg(c,d,a) || v62OnSeg(c,d,b);
  }
  function v62GeomSegments(geom, maxSegs) {
    const segs = [];
    const rings = v62Rings(geom);
    for (const ring of rings) {
      if (!ring || ring.length < 2) continue;
      const step = Math.max(1, Math.ceil(ring.length / Math.max(10, maxSegs || 800)));
      for (let i=0; i<ring.length-1; i += step) segs.push([ring[i], ring[Math.min(i+step, ring.length-1)]]);
    }
    return segs;
  }
  function v62GeomsIntersect(a, b) {
    if (!a || !b) return false;
    const ab = v62BBox(a), bb = v62BBox(b);
    if (!v62BboxIntersects(ab, bb)) return false;
    const aPts = v62CoordsOf(a), bPts = v62CoordsOf(b);
    const aStep = Math.max(1, Math.ceil(aPts.length / 120));
    const bStep = Math.max(1, Math.ceil(bPts.length / 120));
    for (let i=0; i<aPts.length; i+=aStep) if (v62PointInGeom(aPts[i], b)) return true;
    for (let i=0; i<bPts.length; i+=bStep) if (v62PointInGeom(bPts[i], a)) return true;
    const as = v62GeomSegments(a, 500), bs = v62GeomSegments(b, 500);
    for (const s1 of as) for (const s2 of bs) if (v62SegsIntersect(s1[0], s1[1], s2[0], s2[1])) return true;
    return false;
  }
  function v62GetWMUFeature(wmu) {
    const geo = (typeof osGetWMUGeoJSON === 'function') ? osGetWMUGeoJSON() : ((typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON));
    const id = (typeof osNormalizeWMU === 'function') ? osNormalizeWMU(wmu) : String(wmu || '');
    return (geo && geo.features || []).find(f => {
      const p = f.properties || {};
      const fid = (typeof osNormalizeWMU === 'function') ? osNormalizeWMU(p.wmu_id || p.WMUNIT_NUM || p.MU || p.mu || '') : String(p.wmu_id || p.WMUNIT_NUM || '');
      return fid === id;
    }) || null;
  }
  function v62LoadLEH() {
    if (_lehFeaturesV62) return Promise.resolve(_lehFeaturesV62);
    if (_lehLoadingV62) return _lehLoadingV62;
    _lehLoadingV62 = fetch('./leh_zones.json')
      .then(r => { if (!r.ok) throw new Error('leh_zones.json failed to load'); return r.json(); })
      .then(data => {
        const zones = data && data.zones ? data.zones : {};
        _lehFeaturesV62 = Object.entries(zones).map(([key,z]) => ({
          type:'Feature',
          id:key,
          properties:{ id:key, mu:String(z.mu || ''), species:String(z.zt || ''), label:String(z.lb || key), source:'BC LEH zone' },
          geometry:z.g,
          _bbox:v62BBox(z.g)
        })).filter(f => f.geometry && f.properties.species);
        return _lehFeaturesV62;
      })
      .catch(err => { console.warn('[GOS LEH V6.2]', err); _lehLoadingV62 = null; return []; });
    return _lehLoadingV62;
  }
  function v62EnsureLEHLayers() {
    const map = (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance;
    if (!map || !map.getStyle) return false;
    try {
      if (!map.getSource(LEH_SRC)) map.addSource(LEH_SRC, { type:'geojson', data:v62EmptyFC() });
      const before = map.getLayer(OS_REGION_HIT) ? OS_REGION_HIT : undefined;
      if (!map.getLayer(LEH_FILL)) map.addLayer({ id:LEH_FILL, type:'fill', source:LEH_SRC, layout:{visibility:'none'}, paint:{ 'fill-color':'#b91c35', 'fill-opacity':0.20, 'fill-outline-color':'#7f0020' } }, before);
      if (!map.getLayer(LEH_LINE)) map.addLayer({ id:LEH_LINE, type:'line', source:LEH_SRC, layout:{visibility:'none'}, paint:{ 'line-color':'#7f0020', 'line-width':['interpolate',['linear'],['zoom'],4,1.4,8,2.5,11,3.4], 'line-opacity':0.96 } }, before);
      if (!map.getLayer(LEH_LABEL)) map.addLayer({ id:LEH_LABEL, type:'symbol', source:LEH_SRC, minzoom:7.0, layout:{ visibility:'none', 'text-field':['coalesce',['get','label'],['get','id']], 'text-size':11, 'text-font':['Open Sans Semibold','Arial Unicode MS Bold'], 'text-anchor':'center', 'text-allow-overlap':false }, paint:{ 'text-color':'#ffd2dc', 'text-halo-color':'rgba(24,4,8,.88)', 'text-halo-width':1.35 } }, before);
      if (!map._osLehHoverBoundV62) {
        map._osLehHoverBoundV62 = true;
        map.on('mousemove', LEH_FILL, e => {
          const p = (e.features && e.features[0] && e.features[0].properties) || {};
          map.getCanvas().style.cursor = 'pointer';
          if (!_lehHoverPopupV62) _lehHoverPopupV62 = new mapboxgl.Popup({ closeButton:false, closeOnClick:false, offset:12, className:'os-leh-hover-label' });
          _lehHoverPopupV62.setLngLat(e.lngLat).setHTML(`<div class="os-leh-hover"><b>${osEscape(p.label || p.id || 'LEH zone')}</b><span>${osEscape(p.species || '')}</span></div>`).addTo(map);
        });
        map.on('mouseleave', LEH_FILL, () => { map.getCanvas().style.cursor = ''; if (_lehHoverPopupV62) _lehHoverPopupV62.remove(); });
        map.on('click', LEH_FILL, e => {
          const p = (e.features && e.features[0] && e.features[0].properties) || {};
          new mapboxgl.Popup({ closeButton:true, className:'os-leh-popup' })
            .setLngLat(e.lngLat)
            .setHTML(`<div class="os-leh-pop"><b>${osEscape(p.label || p.id || 'LEH zone')}</b><span>${osEscape(p.species || '')}</span><span>Reference WMU ${osEscape(p.mu || '')}</span></div>`)
            .addTo(map);
        });
      }
      return true;
    } catch(e) { console.warn('[GOS LEH V6.2 layers]', e); return false; }
  }
  function v62SetLEHVisible(on) {
    const map = (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance;
    if (!map) return;
    [LEH_FILL, LEH_LINE, LEH_LABEL].forEach(id => { try { if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); } catch(e) {} });
  }
  function v62CurrentLEHFeatures(all) {
    const sp = v62Species();
    const wmu = v62WMU();
    if (!sp || !wmu || !Array.isArray(all)) return [];
    const wmuFeature = v62GetWMUFeature(wmu);
    if (!wmuFeature || !wmuFeature.geometry) return [];
    const wmuBox = v62BBox(wmuFeature.geometry);
    return all.filter(f => {
      const p = f.properties || {};
      if (!v62SpeciesMatches(p.species, sp)) return false;
      if (!v62BboxIntersects(f._bbox || v62BBox(f.geometry), wmuBox)) return false;
      return v62GeomsIntersect(f.geometry, wmuFeature.geometry);
    });
  }
  function osRefreshLEHZonesV62() {
    const map = (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance;
    const sp = v62Species(), wmu = v62WMU();
    const enabled = window.osShowLEHZones !== false;
    if (!map || !sp || !wmu || !enabled) {
      _lehLastCountV62 = 0;
      try { if (map && v62EnsureLEHLayers()) map.getSource(LEH_SRC).setData(v62EmptyFC()); } catch(e) {}
      v62SetLEHVisible(false);
      return;
    }
    v62LoadLEH().then(all => {
      if (!v62EnsureLEHLayers()) return;
      const feats = v62CurrentLEHFeatures(all);
      _lehLastCountV62 = feats.length;
      const src = map.getSource(LEH_SRC);
      if (src) src.setData({ type:'FeatureCollection', features:feats });
      v62SetLEHVisible(feats.length > 0);
      // Re-render once after async count resolves so the compact note is accurate.
      try { if (typeof osRenderPanel === 'function' && v62WMU()) osRenderPanel(); } catch(e) {}
    });
  }
  function v62CandidateRowsForWMU(id) {
    try {
      return BC_OS_DATA.filter(r =>
        (!osHasSelectedRegions || !osHasSelectedRegions() || osRowHasAnyWMUInSelectedRegions(r)) &&
        osRowPassesGlobalFilters(r) &&
        (!osSelectedOpportunity || osRowsSameOpportunity(r, osSelectedOpportunity)) &&
        osRowAppliesToWMU(r, id)
      );
    } catch(e) { return []; }
  }
  function v62WMUFeatureNearPoint(point) {
    const map = (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance;
    if (!map || !map.getLayer(OS_WMU_FILL)) return null;
    const p = point;
    const box = [[p.x - 5, p.y - 5], [p.x + 5, p.y + 5]];
    const layers = [OS_WMU_LINE, OS_WMU_FILL].filter(id => map.getLayer(id));
    const hits = map.queryRenderedFeatures(box, { layers });
    return hits && hits.length ? hits[0] : null;
  }
  function osBindMapEventsV62() {
    const map = (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance;
    if (!map || map._osEventsBoundV62) return;
    map._osEventsBoundV62 = true;
    map.on('mousemove', e => {
      const wmuMode = typeof osWMUInteractionActive === 'function' && osWMUInteractionActive();
      if (wmuMode) {
        const wf = v62WMUFeatureNearPoint(e.point);
        if (wf) {
          const p = wf.properties || {};
          const id = osNormalizeWMU(p.wmu_id || p.MU || p.WMUNIT_NUM || p.mu || '');
          if (!id) return;
          if (typeof osSelectedRegionContainsWMU !== 'function' || osSelectedRegionContainsWMU(id)) {
            if (osHoveredWMU !== null && osHoveredWMU !== wf.id) { try { map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false }); } catch(err) {} }
            osHoveredWMU = wf.id;
            try { map.setFeatureState({ source: OS_WMU_SRC, id:wf.id }, { hovered:true }); } catch(err) {}
            map.getCanvas().style.cursor = 'pointer';
            if (typeof osShowHoverLabel === 'function') osShowHoverLabel(osFeatureCenter(wf), `<b>WMU ${osEscape(id)}</b>`);
            return;
          }
        }
      }
      if (osHoveredWMU !== null) { try { map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false }); } catch(err) {} osHoveredWMU = null; }
      const rf = typeof osTopRegionFeatureAtPoint === 'function' ? osTopRegionFeatureAtPoint(e.point) : null;
      if (rf) {
        const rid = String((rf.properties || {}).region_id || '');
        if (osHoveredRegion !== null && osHoveredRegion !== rf.id) { try { map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false }); } catch(err) {} }
        osHoveredRegion = rf.id;
        try { map.setFeatureState({ source: OS_REGION_SRC, id: rf.id }, { hovered:true }); } catch(err) {}
        map.getCanvas().style.cursor = 'pointer';
        if (typeof osShowHoverLabel === 'function') osShowHoverLabel(osFeatureCenter(rf), `<b>${osEscape(osRegionName(rid))}</b>`);
        return;
      }
      if (osHoveredRegion !== null) { try { map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false }); } catch(err) {} osHoveredRegion = null; }
      map.getCanvas().style.cursor = '';
      if (typeof osHideHoverLabel === 'function') osHideHoverLabel();
    });
    map.on('mouseleave', () => {
      if (osHoveredWMU !== null) { try { map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false }); } catch(err) {} osHoveredWMU = null; }
      if (osHoveredRegion !== null) { try { map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false }); } catch(err) {} osHoveredRegion = null; }
      map.getCanvas().style.cursor = '';
      if (typeof osHideHoverLabel === 'function') osHideHoverLabel();
    });
    map.on('click', e => {
      const wmuMode = typeof osWMUInteractionActive === 'function' && osWMUInteractionActive();
      if (wmuMode) {
        const wf = v62WMUFeatureNearPoint(e.point);
        if (wf) {
          const p = wf.properties || {};
          const id = osNormalizeWMU(p.wmu_id || p.MU || p.WMUNIT_NUM || p.mu || '');
          if (id && (typeof osSelectedRegionContainsWMU !== 'function' || osSelectedRegionContainsWMU(id))) {
            const rows = v62CandidateRowsForWMU(id);
            if (rows.length) { osSelectWMU(id); return; }
            // Consume non-matching WMU clicks in region/species mode so the map never falls through and zooms back out.
            return;
          }
        }
        return;
      }
      const rf = typeof osTopRegionFeatureAtPoint === 'function' ? osTopRegionFeatureAtPoint(e.point) : null;
      if (rf) {
        const rid = String((rf.properties || {}).region_id || '');
        if (rid && typeof osToggleRegionSelection === 'function') osToggleRegionSelection(rid);
      }
    });
  }
  function osRefreshMapStatesV62() {
    // Use the latest WMU/region styling from V6.1, then replace LEH filtering with true WMU intersection logic.
    try {
      if (typeof osRefreshMapStatesV61 === 'function') osRefreshMapStatesV61();
      else if (window.osRefreshMapStates && window.osRefreshMapStates !== osRefreshMapStatesV62) window.osRefreshMapStates();
    } catch(e) {}
    setTimeout(osRefreshLEHZonesV62, 0);
  }
  function v62SynopsisHref(page) { return `${SYN_PDF}#page=${encodeURIComponent(String(page || 1))}`; }
  function v62RegionLinks() {
    const regs = (typeof osSelectedRegionKeys === 'function') ? osSelectedRegionKeys().map(String) : [];
    return regs.slice(0,2).map(k => `<a href="${v62SynopsisHref(SYN_REGION_PAGE[k] || 1)}" target="_blank" rel="noopener">Open ${osEscape(typeof osRegionName === 'function' ? osRegionName(k) : 'Region ' + k)} synopsis</a>`).join('');
  }
  function v62LEHNotice() {
    const sp = v62Species(), wmu = v62WMU();
    if (!sp || !wmu) return '';
    const count = _lehLastCountV62 || 0;
    const text = count > 0
      ? `${count} LEH zone${count === 1 ? '' : 's'} intersect WMU ${wmu}.`
      : `No LEH zone polygons intersect WMU ${wmu}.`;
    return `<div class="os-leh-note os-leh-note-compact"><strong>LEH-only zones</strong><span>${osEscape(text)}</span><div class="os-leh-actions">${v62RegionLinks()}</div></div>`;
  }
  if (typeof osSeasonCards === 'function') {
    osWMUPanel = function(rows) {
      const currentWmu = v62WMU();
      const all = osSortRows(BC_OS_DATA.filter(r => osRowHasAnyWMUInSelectedRegions(r) && osRowPassesGlobalFilters(r, true) && osRowAppliesToWMU(r, currentWmu)));
      const primary = rows && rows.length ? rows : all.filter(r => !v62Species() || r.species === v62Species());
      const other = all.filter(r => !primary.includes(r));
      return `<div class="os-region-summary"><b>WMU ${osEscape(currentWmu)}</b><span>${osEscape(typeof osSelectedRegionLabel === 'function' ? osSelectedRegionLabel() : 'Selected region')}. Selected species/opportunity is shown first.</span></div>${osSeasonCards(primary, 'primary')}${v62LEHNotice()}${other.length ? osCollapsibleBlock('Other species in this WMU', `${other.length} additional rows`, osSeasonCards(other, 'other'), false) : ''}`;
    };
    window.osWMUPanel = osWMUPanel;
  }
  function osSelectWMUV62(wmu) {
    const id = (typeof osNormalizeWMU === 'function') ? osNormalizeWMU(wmu) : String(wmu || '');
    if (!id) return;
    if (typeof osSelectedRegionContainsWMU === 'function' && !osSelectedRegionContainsWMU(id)) return;
    osSelectedWMU = id;
    if (typeof osUserClosedPanel !== 'undefined') osUserClosedPanel = false;
    if (typeof osRefreshMapStates === 'function') osRefreshMapStates();
    if (typeof osRenderPanel === 'function') osRenderPanel();
    setTimeout(osRefreshLEHZonesV62, 0);
  }
  function osToggleLEHZonesV62(checked) {
    window.osShowLEHZones = !!checked;
    osRefreshLEHZonesV62();
  }
  osBindMapEvents = osBindMapEventsV62;
  osSelectWMU = osSelectWMUV62;
  osRefreshMapStates = osRefreshMapStatesV62;
  window.osBindMapEvents = osBindMapEventsV62;
  window.osSelectWMU = osSelectWMUV62;
  window.osRefreshMapStates = osRefreshMapStatesV62;
  window.osRefreshLEHZones = osRefreshLEHZonesV62;
  window.osToggleLEHZones = osToggleLEHZonesV62;
  setTimeout(() => { try { osRefreshMapStatesV62(); osRefreshLEHZonesV62(); } catch(e) {} }, 250);
})();

// ══════════════════════════════════════════════════════════════
// GOS V6.3 — final WMU click + LEH intersection hotfix
// - Species + selected region now enters WMU click mode, so tapping a matching WMU selects it.
// - WMU clicks no longer fall through and toggle/zoom the region view.
// - LEH zones are filtered by true polygon intersection with the selected WMU.
// - LEH notice is compact and placed below the selected species card.
// - LEH zones show a hover label with the zone name.
// ══════════════════════════════════════════════════════════════
(function(){
  const LEH_SRC = 'os-leh-zones-src';
  const LEH_FILL = 'os-leh-zones-fill';
  const LEH_LINE = 'os-leh-zones-line';
  const LEH_LABEL = 'os-leh-zones-label';
  const SYN_PDF = './2024-2026%20hunting%20synopsis.pdf';
  const SYN_REGION_PAGE = { '1':21, '2':28, '3':34, '4':38, '5':44, '6':50, '7A':57, '7B':62, '8':68 };
  let lehFeatures = null;
  let lehLoading = null;
  let lehLastCount = 0;
  let lehHoverPopup = null;

  function normSpecies(v) {
    return String(v || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
  }
  function compactSpecies(v) { return normSpecies(v).replace(/\s+/g, ''); }
  function currentSpecies() { return String((typeof osSelSpecies !== 'undefined' && osSelSpecies) || '').trim(); }
  function currentWMU() { return String((typeof osSelectedWMU !== 'undefined' && osSelectedWMU) || '').trim(); }
  function speciesMatches(zoneSpecies, selectedSpecies) {
    const z = normSpecies(zoneSpecies), s = normSpecies(selectedSpecies);
    const zc = compactSpecies(zoneSpecies), sc = compactSpecies(selectedSpecies);
    if (!z || !s) return false;
    if (z === s || zc === sc) return true;
    if (z === 'mountain goat' && s.includes('mountain goat')) return true;
    if (z === 'mule deer' && (s.includes('mule deer') || s.includes('black tailed'))) return true;
    if (z === 'white tailed deer' && (s.includes('white tailed') || s.includes('white tail') || s.includes('whitetail'))) return true;
    if (z === 'mountain sheep' && s.includes('sheep')) return true;
    return false;
  }
  function emptyFC() { return { type:'FeatureCollection', features:[] }; }
  function coordsOf(geom) {
    const out = [];
    (function walk(x){
      if (!x) return;
      if (typeof x[0] === 'number' && typeof x[1] === 'number') out.push(x);
      else if (Array.isArray(x)) x.forEach(walk);
    })(geom && geom.coordinates);
    return out;
  }
  function bboxOf(geom) {
    const c = coordsOf(geom);
    if (!c.length) return null;
    const xs = c.map(p=>p[0]), ys = c.map(p=>p[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  }
  function bboxIntersects(a,b) { return !!(a && b && a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]); }
  function ringsOf(geom) {
    if (!geom) return [];
    if (geom.type === 'Polygon') return geom.coordinates || [];
    if (geom.type === 'MultiPolygon') return (geom.coordinates || []).flat();
    return [];
  }
  function pointInRing(pt, ring) {
    let inside = false;
    const x = pt[0], y = pt[1];
    for (let i=0, j=ring.length-1; i<ring.length; j=i++) {
      const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
      const hit = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-12) + xi);
      if (hit) inside = !inside;
    }
    return inside;
  }
  function pointInGeom(pt, geom) { return ringsOf(geom).some(r => r && r.length > 2 && pointInRing(pt, r)); }
  function orient(a,b,c) { return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]); }
  function onSeg(a,b,p) { return Math.min(a[0],b[0]) <= p[0] && p[0] <= Math.max(a[0],b[0]) && Math.min(a[1],b[1]) <= p[1] && p[1] <= Math.max(a[1],b[1]) && Math.abs(orient(a,b,p)) < 1e-10; }
  function segIntersects(a,b,c,d) {
    const o1 = orient(a,b,c), o2 = orient(a,b,d), o3 = orient(c,d,a), o4 = orient(c,d,b);
    if ((o1 > 0) !== (o2 > 0) && (o3 > 0) !== (o4 > 0)) return true;
    return onSeg(a,b,c) || onSeg(a,b,d) || onSeg(c,d,a) || onSeg(c,d,b);
  }
  function segmentsOf(geom, maxSegs) {
    const segs = [];
    for (const ring of ringsOf(geom)) {
      if (!ring || ring.length < 2) continue;
      const step = Math.max(1, Math.ceil(ring.length / Math.max(10, maxSegs || 800)));
      for (let i=0; i<ring.length-1; i += step) segs.push([ring[i], ring[Math.min(i+step, ring.length-1)]]);
    }
    return segs;
  }
  function geomsIntersect(a,b) {
    if (!a || !b) return false;
    const ab = bboxOf(a), bb = bboxOf(b);
    if (!bboxIntersects(ab, bb)) return false;
    const aPts = coordsOf(a), bPts = coordsOf(b);
    const aStep = Math.max(1, Math.ceil(aPts.length / 160));
    const bStep = Math.max(1, Math.ceil(bPts.length / 160));
    for (let i=0; i<aPts.length; i += aStep) if (pointInGeom(aPts[i], b)) return true;
    for (let i=0; i<bPts.length; i += bStep) if (pointInGeom(bPts[i], a)) return true;
    const as = segmentsOf(a, 650), bs = segmentsOf(b, 650);
    for (const s1 of as) for (const s2 of bs) if (segIntersects(s1[0], s1[1], s2[0], s2[1])) return true;
    return false;
  }
  function getWMUFeature(wmu) {
    const geo = (typeof osGetWMUGeoJSON === 'function') ? osGetWMUGeoJSON() : ((typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON));
    const target = (typeof osNormalizeWMU === 'function') ? osNormalizeWMU(wmu) : String(wmu || '');
    return (geo && geo.features || []).find(f => {
      const p = f.properties || {};
      const id = (typeof osNormalizeWMU === 'function') ? osNormalizeWMU(p.wmu_id || p.WMUNIT_NUM || p.MU || p.mu || '') : String(p.wmu_id || p.WMUNIT_NUM || '');
      return id === target;
    }) || null;
  }
  function loadLEH() {
    if (lehFeatures) return Promise.resolve(lehFeatures);
    if (lehLoading) return lehLoading;
    lehLoading = fetch('./leh_zones.json')
      .then(r => { if (!r.ok) throw new Error('leh_zones.json failed to load'); return r.json(); })
      .then(data => {
        const zones = data && data.zones ? data.zones : {};
        lehFeatures = Object.entries(zones).map(([key,z]) => ({
          type:'Feature',
          id:key,
          properties:{ id:key, mu:String(z.mu || ''), species:String(z.zt || ''), label:String(z.lb || key), source:'BC LEH zone' },
          geometry:z.g,
          _bbox:bboxOf(z.g)
        })).filter(f => f.geometry && f.properties.species);
        return lehFeatures;
      })
      .catch(err => { console.warn('[GOS LEH V6.3]', err); lehLoading = null; return []; });
    return lehLoading;
  }
  function ensureLEHLayers() {
    const map = (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance;
    if (!map || !map.getStyle) return false;
    try {
      if (!map.getSource(LEH_SRC)) map.addSource(LEH_SRC, { type:'geojson', data:emptyFC() });
      const before = map.getLayer(OS_REGION_HIT) ? OS_REGION_HIT : undefined;
      if (!map.getLayer(LEH_FILL)) map.addLayer({ id:LEH_FILL, type:'fill', source:LEH_SRC, layout:{visibility:'none'}, paint:{ 'fill-color':'#b91c35', 'fill-opacity':0.20, 'fill-outline-color':'#7f0020' } }, before);
      if (!map.getLayer(LEH_LINE)) map.addLayer({ id:LEH_LINE, type:'line', source:LEH_SRC, layout:{visibility:'none'}, paint:{ 'line-color':'#7f0020', 'line-width':['interpolate',['linear'],['zoom'],4,1.4,8,2.5,11,3.4], 'line-opacity':0.96 } }, before);
      if (!map.getLayer(LEH_LABEL)) map.addLayer({ id:LEH_LABEL, type:'symbol', source:LEH_SRC, minzoom:7.0, layout:{ visibility:'none', 'text-field':['coalesce',['get','label'],['get','id']], 'text-size':11, 'text-font':['Open Sans Semibold','Arial Unicode MS Bold'], 'text-anchor':'center', 'text-allow-overlap':false }, paint:{ 'text-color':'#ffd2dc', 'text-halo-color':'rgba(24,4,8,.88)', 'text-halo-width':1.35 } }, before);
      if (!map._osLehHoverBoundV63) {
        map._osLehHoverBoundV63 = true;
        map.on('mousemove', LEH_FILL, e => {
          const p = (e.features && e.features[0] && e.features[0].properties) || {};
          map.getCanvas().style.cursor = 'pointer';
          if (!lehHoverPopup) lehHoverPopup = new mapboxgl.Popup({ closeButton:false, closeOnClick:false, offset:12, className:'os-leh-hover-label' });
          lehHoverPopup.setLngLat(e.lngLat).setHTML(`<div class="os-leh-hover"><b>${osEscape(p.label || p.id || 'LEH zone')}</b><span>${osEscape(p.species || '')}</span></div>`).addTo(map);
        });
        map.on('mouseleave', LEH_FILL, () => { map.getCanvas().style.cursor = ''; if (lehHoverPopup) lehHoverPopup.remove(); });
        map.on('click', LEH_FILL, e => {
          const p = (e.features && e.features[0] && e.features[0].properties) || {};
          new mapboxgl.Popup({ closeButton:true, className:'os-leh-popup' })
            .setLngLat(e.lngLat)
            .setHTML(`<div class="os-leh-pop"><b>${osEscape(p.label || p.id || 'LEH zone')}</b><span>${osEscape(p.species || '')}</span><span>Reference WMU ${osEscape(p.mu || '')}</span></div>`)
            .addTo(map);
        });
      }
      return true;
    } catch(e) { console.warn('[GOS LEH V6.3 layers]', e); return false; }
  }
  function setLEHVisible(on) {
    const map = (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance;
    if (!map) return;
    [LEH_FILL, LEH_LINE, LEH_LABEL].forEach(id => { try { if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); } catch(e) {} });
  }
  function currentLEHFeatures(all) {
    const sp = currentSpecies();
    const wmu = currentWMU();
    if (!sp || !wmu || !Array.isArray(all)) return [];
    const wmuFeature = getWMUFeature(wmu);
    if (!wmuFeature || !wmuFeature.geometry) return [];
    const wmuBox = bboxOf(wmuFeature.geometry);
    return all.filter(f => {
      const p = f.properties || {};
      if (!speciesMatches(p.species, sp)) return false;
      if (!bboxIntersects(f._bbox || bboxOf(f.geometry), wmuBox)) return false;
      return geomsIntersect(f.geometry, wmuFeature.geometry);
    });
  }
  function refreshLEHZones() {
    const map = (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance;
    const sp = currentSpecies(), wmu = currentWMU();
    const enabled = window.osShowLEHZones !== false;
    if (!map || !sp || !wmu || !enabled) {
      lehLastCount = 0;
      try { if (map && ensureLEHLayers()) map.getSource(LEH_SRC).setData(emptyFC()); } catch(e) {}
      setLEHVisible(false);
      return;
    }
    loadLEH().then(all => {
      if (!ensureLEHLayers()) return;
      const feats = currentLEHFeatures(all);
      lehLastCount = feats.length;
      const src = map.getSource(LEH_SRC);
      if (src) src.setData({ type:'FeatureCollection', features:feats });
      setLEHVisible(feats.length > 0);
      try { if (typeof osRenderPanel === 'function' && currentWMU()) osRenderPanel(); } catch(e) {}
    });
  }
  function activeWMUSet() {
    try {
      const rows = (typeof osPanelRows === 'function') ? osPanelRows() : [];
      const ids = (typeof osWMUsForRows === 'function') ? osWMUsForRows(rows) : [];
      return new Set(ids.map(id => (typeof osNormalizeWMU === 'function' ? osNormalizeWMU(id) : String(id))));
    } catch(e) { return new Set(); }
  }
  function refreshMapStatesV63() {
    const map = (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance;
    if (!map || !map.getSource || !map.getSource(OS_WMU_SRC)) return;
    const wmuGeo = (typeof osGetWMUGeoJSON === 'function') ? osGetWMUGeoJSON() : ((typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON));
    const regGeo = (typeof osGetRegionGeoJSON === 'function') ? osGetRegionGeoJSON() : (typeof BC_REGION_GEOJSON !== 'undefined' ? BC_REGION_GEOJSON : null);
    const selectedKeys = (typeof osSelectedRegionKeys === 'function') ? osSelectedRegionKeys().map(String) : [];
    const hasRegion = selectedKeys.length > 0;
    const hasHighlight = (typeof osAnyHighlightActive === 'function') ? osAnyHighlightActive() : !!currentSpecies();
    const activeRegions = (typeof osActiveRegions === 'function') ? osActiveRegions() : new Set();
    const activeWMUs = activeWMUSet();
    const showWMUs = !!(window.osShowWMUs || (hasRegion && (currentSpecies() || osSelectedOpportunity || currentWMU())));
    (wmuGeo && wmuGeo.features || []).forEach((feat, i) => {
      const p = feat.properties || {};
      const id = osNormalizeWMU(p.wmu_id || p.WMUNIT_NUM || p.MU || p.mu || '');
      const reg = osWMURegion(id);
      const inRegion = hasRegion && selectedKeys.includes(String(reg));
      const activeMatch = showWMUs && (!hasRegion || inRegion) && activeWMUs.has(id);
      try {
        map.setFeatureState({ source:OS_WMU_SRC, id:i }, {
          wmuHidden: !showWMUs,
          inRegion: !!inRegion,
          outsideRegion: !!(hasRegion && !inRegion),
          noMatch: !!(showWMUs && (!hasRegion || inRegion) && !activeWMUs.has(id)),
          activeMatch: !!activeMatch,
          selectedWMU: !!(currentWMU() && id === currentWMU()),
          hovered:false
        });
      } catch(e) {}
    });
    (regGeo && regGeo.features || []).forEach((feat, i) => {
      const rid = String((feat.properties || {}).region_id || '');
      const selected = selectedKeys.includes(rid);
      const activeWhenPreviewing = !hasRegion && hasHighlight && activeRegions.has(rid);
      const noMatchWhenPreviewing = !hasRegion && hasHighlight && !activeRegions.has(rid);
      try {
        map.setFeatureState({ source:OS_REGION_SRC, id:i }, {
          selected,
          dimmed: !!(hasRegion && !selected),
          activeMatch: !!activeWhenPreviewing,
          noMatch: !!noMatchWhenPreviewing,
          hovered:false
        });
      } catch(e) {}
    });
    try { if (map.getLayer(OS_REGION_HIT)) map.setLayoutProperty(OS_REGION_HIT, 'visibility', showWMUs ? 'none' : 'visible'); } catch(e) {}
    try { if (map.getLayer(OS_WMU_FILL)) map.setLayoutProperty(OS_WMU_FILL, 'visibility', 'visible'); } catch(e) {}
    try { if (map.getLayer(OS_WMU_LINE)) map.setLayoutProperty(OS_WMU_LINE, 'visibility', 'visible'); } catch(e) {}
    try { if (typeof osUpdateMapStatus === 'function') osUpdateMapStatus(); } catch(e) {}
    try { if (typeof osApplyOverlayOpacity === 'function') osApplyOverlayOpacity(osOverlayVisibility); } catch(e) {}
    setTimeout(refreshLEHZones, 0);
  }
  function candidateRowsForWMU(id) {
    try {
      return BC_OS_DATA.filter(r =>
        (!osHasSelectedRegions || !osHasSelectedRegions() || osRowHasAnyWMUInSelectedRegions(r)) &&
        osRowPassesGlobalFilters(r) &&
        (!osSelectedOpportunity || osRowsSameOpportunity(r, osSelectedOpportunity)) &&
        osRowAppliesToWMU(r, id)
      );
    } catch(e) { return []; }
  }
  function wmuFeatureNearPoint(point) {
    const map = (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance;
    if (!map || !map.getLayer(OS_WMU_FILL)) return null;
    const p = point;
    const box = [[p.x - 5, p.y - 5], [p.x + 5, p.y + 5]];
    const layers = [OS_WMU_LINE, OS_WMU_FILL].filter(id => map.getLayer(id));
    const hits = map.queryRenderedFeatures(box, { layers });
    return hits && hits.length ? hits[0] : null;
  }
  function bindMapEventsV63() {
    const map = (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance;
    if (!map || map._osEventsBoundV63) return;
    map._osEventsBoundV63 = true;
    map.on('mousemove', e => {
      const wmuMode = typeof osWMUInteractionActive === 'function' && osWMUInteractionActive();
      if (wmuMode) {
        const wf = wmuFeatureNearPoint(e.point);
        if (wf) {
          const p = wf.properties || {};
          const id = osNormalizeWMU(p.wmu_id || p.MU || p.WMUNIT_NUM || p.mu || '');
          if (id && (!osSelectedRegionContainsWMU || osSelectedRegionContainsWMU(id))) {
            if (osHoveredWMU !== null && osHoveredWMU !== wf.id) { try { map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false }); } catch(err) {} }
            osHoveredWMU = wf.id;
            try { map.setFeatureState({ source: OS_WMU_SRC, id:wf.id }, { hovered:true }); } catch(err) {}
            map.getCanvas().style.cursor = 'pointer';
            if (typeof osShowHoverLabel === 'function') osShowHoverLabel(osFeatureCenter(wf), `<b>WMU ${osEscape(id)}</b>`);
            return;
          }
        }
      }
      if (osHoveredWMU !== null) { try { map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false }); } catch(err) {} osHoveredWMU = null; }
      const rf = typeof osTopRegionFeatureAtPoint === 'function' ? osTopRegionFeatureAtPoint(e.point) : null;
      if (rf) {
        const rid = String((rf.properties || {}).region_id || '');
        if (osHoveredRegion !== null && osHoveredRegion !== rf.id) { try { map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false }); } catch(err) {} }
        osHoveredRegion = rf.id;
        try { map.setFeatureState({ source: OS_REGION_SRC, id: rf.id }, { hovered:true }); } catch(err) {}
        map.getCanvas().style.cursor = 'pointer';
        if (typeof osShowHoverLabel === 'function') osShowHoverLabel(osFeatureCenter(rf), `<b>${osEscape(osRegionName(rid))}</b>`);
        return;
      }
      if (osHoveredRegion !== null) { try { map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false }); } catch(err) {} osHoveredRegion = null; }
      map.getCanvas().style.cursor = '';
      if (typeof osHideHoverLabel === 'function') osHideHoverLabel();
    });
    map.on('mouseleave', () => {
      if (osHoveredWMU !== null) { try { map.setFeatureState({ source: OS_WMU_SRC, id: osHoveredWMU }, { hovered:false }); } catch(err) {} osHoveredWMU = null; }
      if (osHoveredRegion !== null) { try { map.setFeatureState({ source: OS_REGION_SRC, id: osHoveredRegion }, { hovered:false }); } catch(err) {} osHoveredRegion = null; }
      map.getCanvas().style.cursor = '';
      if (typeof osHideHoverLabel === 'function') osHideHoverLabel();
    });
    map.on('click', e => {
      const wmuMode = typeof osWMUInteractionActive === 'function' && osWMUInteractionActive();
      if (wmuMode) {
        const wf = wmuFeatureNearPoint(e.point);
        if (wf) {
          const p = wf.properties || {};
          const id = osNormalizeWMU(p.wmu_id || p.MU || p.WMUNIT_NUM || p.mu || '');
          if (id && (!osSelectedRegionContainsWMU || osSelectedRegionContainsWMU(id))) {
            const rows = candidateRowsForWMU(id);
            if (rows.length) { osSelectWMU(id); return; }
            return; // consume non-matching WMU clicks in WMU mode
          }
        }
        return; // don't fall through to region reset while WMUs are visible
      }
      const rf = typeof osTopRegionFeatureAtPoint === 'function' ? osTopRegionFeatureAtPoint(e.point) : null;
      if (rf) {
        const rid = String((rf.properties || {}).region_id || '');
        if (rid && typeof osToggleRegionSelection === 'function') osToggleRegionSelection(rid);
      }
    });
  }
  function synopsisHref(page) { return `${SYN_PDF}#page=${encodeURIComponent(String(page || 1))}`; }
  function regionLinks() {
    const regs = (typeof osSelectedRegionKeys === 'function') ? osSelectedRegionKeys().map(String) : [];
    return regs.slice(0,2).map(k => `<a href="${synopsisHref(SYN_REGION_PAGE[k] || 1)}" target="_blank" rel="noopener">Open ${osEscape(typeof osRegionName === 'function' ? osRegionName(k) : 'Region ' + k)} synopsis</a>`).join('');
  }
  function lehNotice() {
    const sp = currentSpecies(), wmu = currentWMU();
    if (!sp || !wmu) return '';
    const count = lehLastCount || 0;
    const text = count > 0 ? `${count} LEH zone${count === 1 ? '' : 's'} intersect WMU ${wmu}.` : `No LEH zone polygons intersect WMU ${wmu}.`;
    return `<div class="os-leh-note os-leh-note-compact"><strong>LEH-only zones</strong><span>${osEscape(text)}</span><div class="os-leh-actions">${regionLinks()}</div></div>`;
  }
  if (typeof osSeasonCards === 'function') {
    osWMUPanel = function(rows) {
      const wmu = currentWMU();
      const all = osSortRows(BC_OS_DATA.filter(r => osRowHasAnyWMUInSelectedRegions(r) && osRowPassesGlobalFilters(r, true) && osRowAppliesToWMU(r, wmu)));
      const primary = rows && rows.length ? rows : all.filter(r => !currentSpecies() || r.species === currentSpecies());
      const other = all.filter(r => !primary.includes(r));
      return `<div class="os-region-summary"><b>WMU ${osEscape(wmu)}</b><span>${osEscape(typeof osSelectedRegionLabel === 'function' ? osSelectedRegionLabel() : 'Selected region')}. Selected species/opportunity is shown first.</span></div>${osSeasonCards(primary, 'primary')}${lehNotice()}${other.length ? osCollapsibleBlock('Other species in this WMU', `${other.length} additional rows`, osSeasonCards(other, 'other'), false) : ''}`;
    };
    window.osWMUPanel = osWMUPanel;
  }
  osWMUInteractionActive = function() {
    return (typeof osHasSelectedRegions === 'function' && osHasSelectedRegions()) && !!(currentSpecies() || osSelectedOpportunity || currentWMU() || window.osShowWMUs);
  };
  osSelectWMU = function(wmu) {
    const id = (typeof osNormalizeWMU === 'function') ? osNormalizeWMU(wmu) : String(wmu || '');
    if (!id) return;
    if (typeof osSelectedRegionContainsWMU === 'function' && !osSelectedRegionContainsWMU(id)) return;
    osSelectedWMU = id;
    if (typeof osUserClosedPanel !== 'undefined') osUserClosedPanel = false;
    refreshMapStatesV63();
    if (typeof osRenderPanel === 'function') osRenderPanel();
    setTimeout(refreshLEHZones, 0);
  };
  osToggleLEHZones = function(checked) { window.osShowLEHZones = !!checked; refreshLEHZones(); };
  osBindMapEvents = bindMapEventsV63;
  osRefreshMapStates = refreshMapStatesV63;
  window.osWMUInteractionActive = osWMUInteractionActive;
  window.osSelectWMU = osSelectWMU;
  window.osBindMapEvents = bindMapEventsV63;
  window.osRefreshMapStates = refreshMapStatesV63;
  window.osRefreshLEHZones = refreshLEHZones;
  window.osToggleLEHZones = osToggleLEHZones;
  setTimeout(() => { try { refreshMapStatesV63(); refreshLEHZones(); } catch(e) {} }, 250);
})();

// ══════════════════════════════════════════════════════════════
// GOS V6.4 — LEH hover styling + legend cleanup + WMU toggle-off
// - LEH zones use map-tab style hover layers, but maroon border / light red fill.
// - Clicking the selected WMU again unselects it.
// - LEH note stays small and reminds users to check unit-specific closed-area maps.
// - Bottom legend only shows Matching WMU + Synopsis changes.
// ══════════════════════════════════════════════════════════════
(function(){
  const LEH_SRC = 'os-leh-zones-src';
  const LEH_FILL = 'os-leh-zones-fill';
  const LEH_LINE = 'os-leh-zones-line';
  const LEH_HOVER_FILL = 'os-leh-zones-hover-fill';
  const LEH_HOVER_LINE = 'os-leh-zones-hover-line';
  let activeHoverId = null;
  let activeTapId = null;

  function getMap(){ return (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance || null; }
  function esc(v){ return (typeof osEscape === 'function') ? osEscape(v) : String(v == null ? '' : v).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function currSpecies(){ return String((typeof osSelSpecies !== 'undefined' && osSelSpecies) || '').trim(); }
  function currWMU(){ return String((typeof osSelectedWMU !== 'undefined' && osSelectedWMU) || '').trim(); }

  function cleanupLegend(){
    document.querySelectorAll('#bcOpenSeasonsPage .os-map-legend').forEach(el => {
      el.innerHTML = '<span><i class="selected matching"></i> Matching WMU</span><a class="os-synopsis-link" href="https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/regulations-synopsis/regulation-synopsis-corrections-and-updates" target="_blank" rel="noopener">Synopsis changes</a>';
    });
  }

  function setHoverFilter(id){
    const map = getMap();
    if (!map) return;
    const fid = id == null ? '__none__' : String(id);
    const filter = ['any', ['==', ['get', 'id'], fid], ['==', ['to-string', ['id']], fid]];
    [LEH_HOVER_FILL, LEH_HOVER_LINE].forEach(layerId => {
      try { if (map.getLayer(layerId)) map.setFilter(layerId, filter); } catch(e) {}
    });
  }

  function getTopLEH(e){
    const map = getMap();
    if (!map || !e || !e.point) return null;
    const layers = [LEH_HOVER_FILL, LEH_HOVER_LINE, LEH_FILL, LEH_LINE].filter(id => map.getLayer(id));
    if (!layers.length) return null;
    const hits = map.queryRenderedFeatures(e.point, { layers });
    return hits && hits.length ? hits[0] : null;
  }

  function ensureLEHHoverLayers(){
    const map = getMap();
    if (!map || !map.getSource || !map.getSource(LEH_SRC)) return false;
    try {
      const before = map.getLayer('os-region-hit') ? 'os-region-hit' : undefined;
      if (map.getLayer(LEH_FILL)) {
        map.setPaintProperty(LEH_FILL, 'fill-color', '#ef4444');
        map.setPaintProperty(LEH_FILL, 'fill-opacity', 0.16);
      }
      if (map.getLayer(LEH_LINE)) {
        map.setPaintProperty(LEH_LINE, 'line-color', '#800020');
        map.setPaintProperty(LEH_LINE, 'line-width', ['interpolate',['linear'],['zoom'],4,1.6,8,2.7,11,3.6]);
        map.setPaintProperty(LEH_LINE, 'line-opacity', 0.98);
      }
      const emptyFilter = ['==', ['get', 'id'], '__none__'];
      if (!map.getLayer(LEH_HOVER_FILL)) {
        map.addLayer({ id:LEH_HOVER_FILL, type:'fill', source:LEH_SRC, filter: emptyFilter, paint:{ 'fill-color':'#ef4444', 'fill-opacity':0.42 } }, before);
      }
      if (!map.getLayer(LEH_HOVER_LINE)) {
        map.addLayer({ id:LEH_HOVER_LINE, type:'line', source:LEH_SRC, filter: emptyFilter, paint:{ 'line-color':'#800020', 'line-width':['interpolate',['linear'],['zoom'],4,4.0,8,6.4,11,7.4], 'line-opacity':1 } }, before);
      }
      if (!map._osLehV64HoverBound) {
        map._osLehV64HoverBound = true;
        const show = (e, f) => {
          if (!f) f = getTopLEH(e);
          if (!f) return;
          const id = f.id ?? f.properties?.id;
          activeHoverId = id;
          setHoverFilter(id);
          map.getCanvas().style.cursor = 'pointer';
          if (typeof osShowHoverLabel === 'function') {
            const p = f.properties || {};
            const html = `<b>${esc(p.label || p.id || 'LEH zone')}</b>`;
            const center = (typeof osFeatureCenter === 'function') ? osFeatureCenter(f) : e.lngLat;
            osShowHoverLabel(center, html);
          }
        };
        [LEH_FILL, LEH_LINE, LEH_HOVER_FILL, LEH_HOVER_LINE].forEach(layerId => {
          if (!map.getLayer(layerId)) return;
          map.on('mousemove', layerId, e => show(e, e.features && e.features[0]));
          map.on('mouseenter', layerId, e => show(e, e.features && e.features[0]));
          map.on('mouseleave', layerId, () => {
            activeHoverId = null;
            setHoverFilter(activeTapId);
            map.getCanvas().style.cursor = '';
            if (typeof osHideHoverLabel === 'function') osHideHoverLabel();
          });
          map.on('click', layerId, e => {
            const f = (e.features && e.features[0]) || getTopLEH(e);
            if (!f) return;
            activeTapId = f.id ?? f.properties?.id;
            setHoverFilter(activeTapId);
          });
        });
      }
      setHoverFilter(activeTapId);
      return true;
    } catch(e) { console.warn('[GOS V6.4 LEH hover]', e); return false; }
  }

  // Wrap refresh so hover layers/style are re-applied after the LEH source is populated.
  if (typeof window.osRefreshLEHZones === 'function') {
    const prev = window.osRefreshLEHZones;
    window.osRefreshLEHZones = function(){
      const out = prev.apply(this, arguments);
      setTimeout(ensureLEHHoverLayers, 60);
      setTimeout(ensureLEHHoverLayers, 250);
      return out;
    };
    try { osRefreshLEHZones = window.osRefreshLEHZones; } catch(e) {}
  }

  // Clicking an already selected WMU should unselect it instead of reselecting.
  if (typeof window.osSelectWMU === 'function') {
    const prevSelect = window.osSelectWMU;
    window.osSelectWMU = function(wmu){
      const id = (typeof osNormalizeWMU === 'function') ? osNormalizeWMU(wmu) : String(wmu || '');
      if (id && currWMU() === id) {
        try { osSelectedWMU = null; } catch(e) {}
        try { if (typeof osRefreshMapStates === 'function') osRefreshMapStates(); } catch(e) {}
        try { if (typeof osRenderPanel === 'function') osRenderPanel(); } catch(e) {}
        try { if (typeof window.osRefreshLEHZones === 'function') window.osRefreshLEHZones(); } catch(e) {}
        return;
      }
      return prevSelect.apply(this, arguments);
    };
    try { osSelectWMU = window.osSelectWMU; } catch(e) {}
  }

  // Keep the LEH note compact and specific.
  if (typeof osSeasonCards === 'function') {
    window.osWMUPanel = function(rows) {
      const wmu = currWMU();
      const all = (typeof osSortRows === 'function') ? osSortRows(BC_OS_DATA.filter(r =>
        (!osRowHasAnyWMUInSelectedRegions || osRowHasAnyWMUInSelectedRegions(r)) &&
        osRowPassesGlobalFilters(r, true) &&
        osRowAppliesToWMU(r, wmu)
      )) : (rows || []);
      const primary = rows && rows.length ? rows : all.filter(r => !currSpecies() || r.species === currSpecies());
      const other = all.filter(r => !primary.includes(r));
      const regLabel = (typeof osSelectedRegionLabel === 'function') ? osSelectedRegionLabel() : 'Selected region';
      const note = currSpecies() && wmu ? `<div class="os-leh-note os-leh-note-compact os-leh-note-inline"><strong>LEH / closed-area context</strong><span>Maroon/red overlay shows LEH zones that intersect this WMU when available. Check the synopsis for unit-specific hunting closed-area maps.</span></div>` : '';
      return `<div class="os-region-summary"><b>WMU ${esc(wmu)}</b><span>${esc(regLabel)}. Selected species/opportunity is shown first.</span></div>${osSeasonCards(primary, 'primary')}${note}${other.length ? osCollapsibleBlock('Other species in this WMU', `${other.length} additional rows`, osSeasonCards(other, 'other'), false) : ''}`;
    };
    try { osWMUPanel = window.osWMUPanel; } catch(e) {}
  }

  const prevInit = window.initOpenSeasonsPage;
  if (typeof prevInit === 'function' && !window._osV64InitWrapped) {
    window._osV64InitWrapped = true;
    window.initOpenSeasonsPage = function(){
      const out = prevInit.apply(this, arguments);
      cleanupLegend();
      setTimeout(() => { cleanupLegend(); ensureLEHHoverLayers(); }, 250);
      setTimeout(() => { cleanupLegend(); ensureLEHHoverLayers(); }, 900);
      return out;
    };
    try { initOpenSeasonsPage = window.initOpenSeasonsPage; } catch(e) {}
  }

  document.addEventListener('DOMContentLoaded', cleanupLegend);
  setTimeout(() => { cleanupLegend(); ensureLEHHoverLayers(); }, 500);
})();

// ══════════════════════════════════════════════════════
// GOS V6.7 — green synopsis link + hunting layer opacity slider
// Keeps existing behavior, but makes the Layers-panel opacity slider control
// GOS region/WMU overlays and LEH-only overlays down to fully invisible.
// Also allows wildfire opacity to reach 0%.
// ══════════════════════════════════════════════════════
(function(){
  const LEH_FILL = 'os-leh-zones-fill';
  const LEH_LINE = 'os-leh-zones-line';
  const LEH_HOVER_FILL = 'os-leh-zones-hover-fill';
  const LEH_HOVER_LINE = 'os-leh-zones-hover-line';

  function map(){ return (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance || null; }
  function clamp01(v){ const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1; }
  function syncHuntingOpacityUI(v){
    const m = clamp01(v);
    const r = document.getElementById('osOpacityRange');
    const lab = document.getElementById('osOpacityValue');
    if (r) r.value = String(m);
    if (lab) lab.textContent = Math.round(m * 100) + '%';
  }
  function applyLEHOpacity(m){
    const mp = map();
    if (!mp || !mp.getLayer) return;
    m = clamp01(m);
    try {
      if (mp.getLayer(LEH_FILL)) mp.setPaintProperty(LEH_FILL, 'fill-opacity', 0.16 * m);
      if (mp.getLayer(LEH_LINE)) mp.setPaintProperty(LEH_LINE, 'line-opacity', 0.98 * m);
      if (mp.getLayer(LEH_HOVER_FILL)) mp.setPaintProperty(LEH_HOVER_FILL, 'fill-opacity', 0.42 * m);
      if (mp.getLayer(LEH_HOVER_LINE)) mp.setPaintProperty(LEH_HOVER_LINE, 'line-opacity', m > 0 ? 1 : 0);
    } catch(e) { console.warn('[GOS V6.7 LEH opacity]', e); }
  }

  const prevOverlay = window.osSetOverlayOpacity || (typeof osSetOverlayOpacity === 'function' ? osSetOverlayOpacity : null);
  window.osSetOverlayOpacity = function(val){
    const m = clamp01(val);
    try { osOverlayVisibility = m; } catch(e) {}
    if (prevOverlay && prevOverlay !== window.osSetOverlayOpacity) {
      try { prevOverlay.call(this, m); } catch(e) { if (typeof osApplyOverlayOpacity === 'function') osApplyOverlayOpacity(m); }
    } else if (typeof osApplyOverlayOpacity === 'function') {
      osApplyOverlayOpacity(m);
    }
    syncHuntingOpacityUI(m);
    applyLEHOpacity(m);
  };
  try { osSetOverlayOpacity = window.osSetOverlayOpacity; } catch(e) {}

  const prevWildfire = window.osSetWildfireOpacity || (typeof osSetWildfireOpacity === 'function' ? osSetWildfireOpacity : null);
  window.osSetWildfireOpacity = function(val){
    const n = Number(val);
    const m = Number.isFinite(n) ? Math.max(0, Math.min(0.85, n)) : 0.38;
    try { _osWildfireOpacity = m; } catch(e) {}
    const lab = document.getElementById('osWildfireOpacityValue');
    const r = document.getElementById('osWildfireOpacityRange');
    if (r) r.value = String(m);
    if (lab) lab.textContent = Math.round(m * 100) + '%';
    const mp = map();
    try {
      if (mp && mp.getLayer && mp.getLayer('os-wildfire-fill')) mp.setPaintProperty('os-wildfire-fill', 'fill-opacity', m);
      if (mp && mp.getLayer && mp.getLayer('os-wildfire-line')) mp.setPaintProperty('os-wildfire-line', 'line-opacity', m > 0 ? 0.85 : 0);
    } catch(e) { console.warn('[GOS V6.7 wildfire opacity]', e); }
    if (prevWildfire && prevWildfire !== window.osSetWildfireOpacity && m > 0) {
      try { prevWildfire.call(this, m); } catch(e) {}
    }
  };
  try { osSetWildfireOpacity = window.osSetWildfireOpacity; } catch(e) {}

  function polishLegend(){
    document.querySelectorAll('#bcOpenSeasonsPage .os-map-legend').forEach(el => {
      el.innerHTML = '<span><i class="selected matching"></i> Matching WMU</span><a class="os-synopsis-link" href="https://www2.gov.bc.ca/gov/content/sports-culture/recreation/fishing-hunting/hunting/regulations-synopsis/regulation-synopsis-corrections-and-updates" target="_blank" rel="noopener">Synopsis changes</a>';
    });
  }

  const prevInit = window.initOpenSeasonsPage;
  if (typeof prevInit === 'function' && !window._osV67InitWrapped) {
    window._osV67InitWrapped = true;
    window.initOpenSeasonsPage = function(){
      const out = prevInit.apply(this, arguments);
      setTimeout(() => { polishLegend(); syncHuntingOpacityUI(typeof osOverlayVisibility !== 'undefined' ? osOverlayVisibility : 1); applyLEHOpacity(typeof osOverlayVisibility !== 'undefined' ? osOverlayVisibility : 1); }, 120);
      setTimeout(() => { polishLegend(); syncHuntingOpacityUI(typeof osOverlayVisibility !== 'undefined' ? osOverlayVisibility : 1); applyLEHOpacity(typeof osOverlayVisibility !== 'undefined' ? osOverlayVisibility : 1); }, 650);
      return out;
    };
    try { initOpenSeasonsPage = window.initOpenSeasonsPage; } catch(e) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    polishLegend();
    syncHuntingOpacityUI(typeof osOverlayVisibility !== 'undefined' ? osOverlayVisibility : 1);
    setTimeout(() => applyLEHOpacity(typeof osOverlayVisibility !== 'undefined' ? osOverlayVisibility : 1), 500);
  });
})();

// ══════════════════════════════════════════════════════════════
// GOS V6.8 — data guard, species reset shortcut, share view, smarter layers, mobile-safe hooks
// - Adds another protective row-quality gate so parsed note fragments don't surface as seasons.
// - Adds “Back to all selected-species regions” and “Share view” actions.
// - Applies shared GOS URLs when opened.
// - Keeps Layers organized and mobile-safe without changing the core map renderer.
// ══════════════════════════════════════════════════════════════
(function(){
  if (window._hsGOSV68Applied) return;
  window._hsGOSV68Applied = true;

  function esc(v){ return (typeof osEscape === 'function') ? osEscape(v) : String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function normWMU(v){ return (typeof osNormalizeWMU === 'function') ? osNormalizeWMU(v) : String(v || '').trim(); }
  function currentSpecies(){ return String((typeof osSelSpecies !== 'undefined' && osSelSpecies) || '').trim(); }
  function currentWMU(){ return String((typeof osSelectedWMU !== 'undefined' && osSelectedWMU) || '').trim(); }
  function selectedRegionKeys(){
    try { if (typeof osSelectedRegionKeys === 'function') return osSelectedRegionKeys().map(String); } catch(e) {}
    try { if (typeof osSelectedRegions !== 'undefined' && osSelectedRegions && osSelectedRegions.size) return Array.from(osSelectedRegions).map(String); } catch(e) {}
    try { if (typeof osSelectedRegion !== 'undefined' && osSelectedRegion) return [String(osSelectedRegion)]; } catch(e) {}
    return [];
  }
  function refreshGOS(fitMode){
    try { if (typeof osSyncFilterControls === 'function') osSyncFilterControls(); } catch(e) {}
    try { if (typeof osRefreshMapStates === 'function') osRefreshMapStates(); } catch(e) {}
    try { if (typeof osRenderPanel === 'function') osRenderPanel(); } catch(e) {}
    try { if (typeof osRefreshLEHZones === 'function') osRefreshLEHZones(); } catch(e) {}
    setTimeout(() => {
      try {
        if (fitMode === 'bc' && typeof osFitBC === 'function') osFitBC(true);
        else if (fitMode === 'selection' && typeof osFitSelectionOrBC === 'function') osFitSelectionOrBC();
        else if (fitMode === 'regions' && typeof osFitRegions === 'function') osFitRegions();
      } catch(e) {}
    }, 80);
  }

  // ---- 2) GOS data cleanup guard -------------------------------------------------
  function rowQualityIssue(row){
    if (!row) return 'missing row';
    const species = String(row.species || '').trim();
    const mu = String(row.management_units || '').trim();
    const blob = [row.species, row.management_units, row.class, row.weapon_type, row.bag_limit, row.notes, row.season_text, row.season_open, row.season_close]
      .map(x => String(x || '')).join(' ').toLowerCase();
    if (!species || !mu) return 'missing species or MU';
    if (/\b(no hunting|no shooting|motor vehicle|mvp|pipeline|access|road\s*closed)\b/i.test(species)) return 'note parsed as species';
    if (/\b(meat cache|telkwa river|grizzly plateau|mountain goats only|billy\s*\(male\)|skip mountain)\b/i.test(blob) && !/mountain goat/i.test(species)) return 'goat/map note under other species';
    if (/\bcaribou\b/i.test(species) && Number(row.region) === 6) return 'Region 6 caribou GOS false-positive';
    if (/\bseason restricted to hunters\b/i.test(String(row.season_text || '')) && !(typeof osMonthNum === 'function' && osMonthNum(row.season_text))) return 'note sentence parsed as season';
    try { if (typeof osParseMUs === 'function' && !osParseMUs(mu).length) return 'no valid WMUs parsed'; } catch(e) {}
    return '';
  }
  window.osGOSRowQualityIssue = rowQualityIssue;

  const prevRowPasses = window.osRowPassesGlobalFilters || (typeof osRowPassesGlobalFilters === 'function' ? osRowPassesGlobalFilters : null);
  if (prevRowPasses && !prevRowPasses._hsV68Wrapped) {
    const wrapped = function(row, ignoreSpecies){
      if (rowQualityIssue(row)) return false;
      return prevRowPasses.call(this, row, ignoreSpecies);
    };
    wrapped._hsV68Wrapped = true;
    window.osRowPassesGlobalFilters = wrapped;
    try { osRowPassesGlobalFilters = wrapped; } catch(e) {}
  }
  window.osRunGOSDataAudit = function(){
    const raw = (typeof BC_OS_DATA_RAW !== 'undefined' ? BC_OS_DATA_RAW : []);
    const clean = (typeof BC_OS_DATA !== 'undefined' ? BC_OS_DATA : []);
    const rejected = clean.filter(r => rowQualityIssue(r)).map(r => ({ region:r.region, species:r.species, mu:r.management_units, season:r.season_text, issue:rowQualityIssue(r) }));
    console.info('[HuntSmart GOS audit]', { rawRows: raw.length, cleanRows: clean.length, guardedRows: rejected.length });
    if (rejected.length) console.table(rejected.slice(0, 30));
    return { rawRows:raw.length, cleanRows:clean.length, guardedRows:rejected.length, sample:rejected.slice(0,30) };
  };

  // ---- 5) Reset to species view ---------------------------------------------------
  window.osBackToSpeciesView = function(){
    const sp = currentSpecies();
    if (!sp) { if (typeof osBackToProvince === 'function') return osBackToProvince(); return; }
    try { if (typeof osSelectedRegions !== 'undefined' && osSelectedRegions) osSelectedRegions.clear(); } catch(e) {}
    try { osSelectedRegion = null; } catch(e) {}
    try { osSelectedWMU = null; } catch(e) {}
    try { osSelectedOpportunity = ''; } catch(e) {}
    try { if (typeof osUserClosedPanel !== 'undefined') osUserClosedPanel = false; } catch(e) {}
    refreshGOS('bc');
  };

  // ---- 7) Share/copy current view -------------------------------------------------
  function viewParams(){
    const p = new URLSearchParams();
    p.set('gos','1');
    const sp = currentSpecies(); if (sp) p.set('species', sp);
    const regs = selectedRegionKeys(); if (regs.length) p.set('regions', regs.join(','));
    const w = currentWMU(); if (w) p.set('wmu', w);
    try { if (typeof osSelMonth !== 'undefined' && osSelMonth) p.set('month', osSelMonth); } catch(e) {}
    try { if (typeof osSelMethod !== 'undefined' && osSelMethod) p.set('method', osSelMethod); } catch(e) {}
    try { if (typeof osMapInstance !== 'undefined' && osMapInstance) {
      const c = osMapInstance.getCenter();
      p.set('map', [c.lng.toFixed(5), c.lat.toFixed(5), osMapInstance.getZoom().toFixed(2)].join(','));
    }} catch(e) {}
    return p;
  }
  window.osBuildShareURL = function(){
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = 'bcgos?' + viewParams().toString();
    return url.toString();
  };
  window.osShareGOSView = async function(){
    const url = window.osBuildShareURL();
    try { await navigator.clipboard.writeText(url); osToast('View link copied'); }
    catch(e) { window.prompt('Copy this HuntSmart view link:', url); }
  };
  function osToast(msg){
    let el = document.getElementById('osMiniToast');
    if (!el) { el = document.createElement('div'); el.id = 'osMiniToast'; el.className = 'os-mini-toast'; document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 1800);
  }
  function applySharedView(){
    const h = String(window.location.hash || '');
    if (!/^#bcgos\?/i.test(h)) return false;
    const p = new URLSearchParams(h.split('?')[1] || '');
    if (p.get('gos') !== '1') return false;
    try { if (typeof showPage === 'function') showPage('bcOpenSeasons'); } catch(e) {}
    const sp = p.get('species') || '';
    const regs = (p.get('regions') || '').split(',').map(x => x.trim()).filter(Boolean);
    const w = normWMU(p.get('wmu') || '');
    try { osSelSpecies = sp; } catch(e) {}
    try { osSelMonth = p.get('month') || ''; } catch(e) {}
    try { osSelMethod = p.get('method') || ''; } catch(e) {}
    try { osSelectedOpportunity = ''; } catch(e) {}
    try { osSelectedWMU = w || null; } catch(e) {}
    try { if (typeof osSelectedRegions !== 'undefined') osSelectedRegions = new Set(regs); } catch(e) {}
    try { if (typeof osSyncSelectedRegionVar === 'function') osSyncSelectedRegionVar(); } catch(e) {}
    refreshGOS(regs.length ? 'selection' : 'bc');
    return true;
  }
  window.osApplySharedGOSView = applySharedView;

  // ---- 5/7) Panel actions ---------------------------------------------------------
  function enhancePanelActions(){
    const actions = document.querySelector('#bcOpenSeasonsPage .os-panel-actions');
    if (!actions) return;
    const sp = currentSpecies();
    const hasRegion = selectedRegionKeys().length > 0;
    if (sp && hasRegion && !document.getElementById('osBackSpeciesBtn')) {
      const b = document.createElement('button');
      b.id = 'osBackSpeciesBtn';
      b.type = 'button';
      b.className = 'os-panel-action-secondary';
      b.textContent = `All ${sp} regions`;
      b.onclick = window.osBackToSpeciesView;
      actions.insertBefore(b, actions.firstChild ? actions.firstChild.nextSibling : null);
    }
    if (!sp || !hasRegion) document.getElementById('osBackSpeciesBtn')?.remove();
    if (!document.getElementById('osShareViewBtn')) {
      const s = document.createElement('button');
      s.id = 'osShareViewBtn';
      s.type = 'button';
      s.className = 'os-panel-action-share';
      s.textContent = 'Share view';
      s.onclick = window.osShareGOSView;
      actions.appendChild(s);
    }
  }

  // ---- 6) Layers panel organization ----------------------------------------------
  function enhanceLayersPanel(){
    const panel = document.getElementById('osLayersPanel');
    if (!panel || panel.dataset.v68Enhanced === '1') return;
    panel.dataset.v68Enhanced = '1';
    const wmu = panel.querySelector('#osShowWMUToggle')?.closest('label');
    const leh = panel.querySelector('#osShowLEHZonesToggle')?.closest('label');
    const opacity = panel.querySelector('#osOpacityRange')?.closest('label');
    const wildfire = panel.querySelector('#osWildfireToggle')?.closest('label');
    if (wmu || leh || opacity) {
      const section = document.createElement('div'); section.className = 'os-layer-section os-hunting-layer-section';
      section.innerHTML = '<div class="os-layer-group-title">Hunting layers</div>';
      [wmu, leh, opacity].forEach(node => node && section.appendChild(node));
      const firstTitle = panel.querySelector('.os-layer-group-title');
      if (firstTitle) firstTitle.replaceWith(section); else panel.appendChild(section);
    }
    if (wildfire) {
      const section = document.createElement('div'); section.className = 'os-layer-section os-context-layer-section';
      section.innerHTML = '<div class="os-layer-group-title">Context layers</div>';
      section.appendChild(wildfire);
      const yrs = panel.querySelector('#osWildfireYearControls'); if (yrs) section.appendChild(yrs);
      const wfOpacity = panel.querySelector('#osWildfireOpacityRange')?.closest('label'); if (wfOpacity) section.appendChild(wfOpacity);
      panel.appendChild(section);
    }
  }

  const prevRender = window.osRenderPanel || (typeof osRenderPanel === 'function' ? osRenderPanel : null);
  if (prevRender && !prevRender._hsV68Wrapped) {
    const renderWrapped = function(){
      const out = prevRender.apply(this, arguments);
      setTimeout(() => { enhancePanelActions(); enhanceLayersPanel(); }, 0);
      return out;
    };
    renderWrapped._hsV68Wrapped = true;
    window.osRenderPanel = renderWrapped;
    try { osRenderPanel = renderWrapped; } catch(e) {}
  }

  const prevLayers = window.osToggleLayersPanel || (typeof osToggleLayersPanel === 'function' ? osToggleLayersPanel : null);
  if (prevLayers && !prevLayers._hsV68Wrapped) {
    const layersWrapped = function(){
      const out = prevLayers.apply(this, arguments);
      setTimeout(enhanceLayersPanel, 0);
      return out;
    };
    layersWrapped._hsV68Wrapped = true;
    window.osToggleLayersPanel = layersWrapped;
    try { osToggleLayersPanel = layersWrapped; } catch(e) {}
  }

  const prevInit = window.initOpenSeasonsPage || (typeof initOpenSeasonsPage === 'function' ? initOpenSeasonsPage : null);
  if (prevInit && !prevInit._hsV68Wrapped) {
    const initWrapped = function(){
      const out = prevInit.apply(this, arguments);
      setTimeout(() => { applySharedView(); enhancePanelActions(); enhanceLayersPanel(); }, 140);
      setTimeout(() => { applySharedView(); enhancePanelActions(); enhanceLayersPanel(); }, 900);
      return out;
    };
    initWrapped._hsV68Wrapped = true;
    window.initOpenSeasonsPage = initWrapped;
    try { initOpenSeasonsPage = initWrapped; } catch(e) {}
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(() => { applySharedView(); enhanceLayersPanel(); enhancePanelActions(); }, 500));
})();

// ══════════════════════════════════════════════════════════════
// GOS V6.9 — LEH zones are manual, WMU-intersected, and style-safe
// - LEH polygons start hidden.
// - A red View LEH Zones / Hide LEH Zones button controls visibility.
// - Polygons are filtered to the selected species and polygons that intersect the selected WMU.
// - Changing species/region/WMU hides stale LEH polygons so old red zones never persist.
// - Tile changes preserve the exact current camera and re-add overlays without zooming out.
// ══════════════════════════════════════════════════════════════
(function(){
  const SRC = 'os-leh-zones-src';
  const FILL = 'os-leh-zones-fill';
  const LINE = 'os-leh-zones-line';
  const LABEL = 'os-leh-zones-label';
  const HOVER_FILL = 'os-leh-zones-hover-fill';
  const HOVER_LINE = 'os-leh-zones-hover-line';
  let cache = null;
  let loading = null;
  let lastCount = 0;
  let activeHoverId = '__none__';

  window.osLEHZonesManualVisible = false;

  function map(){ return (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance || null; }
  function esc(v){ return (typeof osEscape === 'function') ? osEscape(v) : String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function sp(){ return String((typeof osSelSpecies !== 'undefined' && osSelSpecies) || '').trim(); }
  function wmu(){ return String((typeof osSelectedWMU !== 'undefined' && osSelectedWMU) || '').trim(); }
  function normWMU(v){ return (typeof osNormalizeWMU === 'function') ? osNormalizeWMU(v) : String(v || '').trim(); }
  function norm(v){ return String(v || '').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' '); }
  function compact(v){ return norm(v).replace(/\s+/g,''); }
  function speciesMatch(zone, selected){
    const z = norm(zone), s = norm(selected), zc = compact(zone), sc = compact(selected);
    if (!z || !s) return false;
    if (z === s || zc === sc) return true;
    if (z === 'mountain goat' && s.includes('mountain goat')) return true;
    if (z === 'mountain sheep' && s.includes('sheep')) return true;
    if (z === 'mule deer' && (s.includes('mule deer') || s.includes('black tailed'))) return true;
    if (z === 'white tailed deer' && (s.includes('white tailed') || s.includes('white tail') || s.includes('whitetail'))) return true;
    return false;
  }
  function emptyFC(){ return { type:'FeatureCollection', features:[] }; }
  function coordsOf(geom){
    const out = [];
    (function walk(x){
      if (!x) return;
      if (Array.isArray(x) && typeof x[0] === 'number' && typeof x[1] === 'number') out.push(x);
      else if (Array.isArray(x)) x.forEach(walk);
    })(geom && geom.coordinates);
    return out;
  }
  function bbox(geom){
    const cs = coordsOf(geom);
    if (!cs.length) return null;
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    cs.forEach(([x,y]) => { if(x<minX)minX=x; if(y<minY)minY=y; if(x>maxX)maxX=x; if(y>maxY)maxY=y; });
    return [minX,minY,maxX,maxY];
  }
  function bboxHit(a,b){ return !!(a && b && a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]); }
  function rings(geom){ if (!geom) return []; if (geom.type === 'Polygon') return geom.coordinates || []; if (geom.type === 'MultiPolygon') return (geom.coordinates || []).flat(); return []; }
  function pointInRing(pt, ring){
    let inside = false; const x=pt[0], y=pt[1];
    for (let i=0,j=ring.length-1; i<ring.length; j=i++) {
      const xi=ring[i][0], yi=ring[i][1], xj=ring[j][0], yj=ring[j][1];
      const hit = ((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/((yj-yi)||1e-12)+xi);
      if (hit) inside = !inside;
    }
    return inside;
  }
  function pointInGeom(pt, geom){ return rings(geom).some(r => r && r.length > 2 && pointInRing(pt, r)); }
  function orient(a,b,c){ return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]); }
  function onSeg(a,b,p){ return Math.min(a[0],b[0]) <= p[0] && p[0] <= Math.max(a[0],b[0]) && Math.min(a[1],b[1]) <= p[1] && p[1] <= Math.max(a[1],b[1]) && Math.abs(orient(a,b,p)) < 1e-10; }
  function segHit(a,b,c,d){ const o1=orient(a,b,c), o2=orient(a,b,d), o3=orient(c,d,a), o4=orient(c,d,b); if ((o1>0)!==(o2>0) && (o3>0)!==(o4>0)) return true; return onSeg(a,b,c)||onSeg(a,b,d)||onSeg(c,d,a)||onSeg(c,d,b); }
  function segs(geom, max){
    const out=[];
    rings(geom).forEach(r => {
      if (!r || r.length < 2) return;
      const step = Math.max(1, Math.ceil(r.length / Math.max(20, max || 900)));
      for (let i=0; i<r.length-1; i+=step) out.push([r[i], r[Math.min(i+step, r.length-1)]]);
    });
    return out;
  }
  function geomHit(a,b){
    if (!a || !b || !bboxHit(bbox(a), bbox(b))) return false;
    const ac=coordsOf(a), bc=coordsOf(b);
    const as=Math.max(1, Math.ceil(ac.length/160)), bs=Math.max(1, Math.ceil(bc.length/160));
    for (let i=0; i<ac.length; i+=as) if (pointInGeom(ac[i], b)) return true;
    for (let i=0; i<bc.length; i+=bs) if (pointInGeom(bc[i], a)) return true;
    const aSegs=segs(a,700), bSegs=segs(b,700);
    for (const x of aSegs) for (const y of bSegs) if (segHit(x[0],x[1],y[0],y[1])) return true;
    return false;
  }
  function getWMUFeature(id){
    const geo = (typeof osGetWMUGeoJSON === 'function') ? osGetWMUGeoJSON() : ((typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON));
    const wanted = normWMU(id);
    return (geo && geo.features || []).find(f => {
      const p = f.properties || {};
      const fid = normWMU(p.wmu_id || p.WMUNIT_NUM || p.MU || p.mu || '');
      return fid === wanted;
    }) || null;
  }
  function load(){
    if (cache) return Promise.resolve(cache);
    if (loading) return loading;
    loading = fetch('./leh_zones.json').then(r => { if (!r.ok) throw new Error('leh_zones.json failed'); return r.json(); }).then(data => {
      const zones = data && data.zones ? data.zones : {};
      cache = Object.entries(zones).map(([key,z]) => ({
        type:'Feature', id:key,
        properties:{ id:key, mu:String(z.mu || ''), species:String(z.zt || ''), label:String(z.lb || key), source:'BC LEH zone' },
        geometry:z.g,
        _bbox:bbox(z.g)
      })).filter(f => f.geometry && f.properties.species);
      return cache;
    }).catch(err => { console.warn('[GOS LEH v6.9]', err); loading = null; return []; });
    return loading;
  }
  function visibleLayers(on){
    const m = map(); if (!m) return;
    [FILL, LINE, LABEL, HOVER_FILL, HOVER_LINE].forEach(id => { try { if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); } catch(e) {} });
    if (!on) setHover('__none__');
  }
  function setHover(id){
    const m = map(); if (!m) return;
    const fid = id == null ? '__none__' : String(id);
    const filter = ['any', ['==', ['get','id'], fid], ['==', ['to-string', ['id']], fid]];
    [HOVER_FILL, HOVER_LINE].forEach(l => { try { if (m.getLayer(l)) m.setFilter(l, filter); } catch(e) {} });
  }
  function centerOf(f){
    if (typeof osFeatureCenter === 'function') return osFeatureCenter(f);
    const cs = coordsOf(f.geometry); if (!cs.length) return null;
    const b = bbox(f.geometry); return [(b[0]+b[2])/2, (b[1]+b[3])/2];
  }
  function topFeature(e){
    const m = map(); if (!m || !e || !e.point) return null;
    const layers = [HOVER_FILL, HOVER_LINE, FILL, LINE].filter(id => m.getLayer(id));
    const hits = layers.length ? m.queryRenderedFeatures(e.point, { layers }) : [];
    return hits && hits[0] ? hits[0] : null;
  }
  function ensure(){
    const m = map(); if (!m || !m.getStyle) return false;
    try {
      if (!m.getSource(SRC)) m.addSource(SRC, { type:'geojson', data:emptyFC(), generateId:false });
      const before = m.getLayer('os-region-hit') ? 'os-region-hit' : undefined;
      if (!m.getLayer(FILL)) m.addLayer({ id:FILL, type:'fill', source:SRC, layout:{visibility:'none'}, paint:{ 'fill-color':'#ef4444', 'fill-opacity':0.20 } }, before);
      if (!m.getLayer(LINE)) m.addLayer({ id:LINE, type:'line', source:SRC, layout:{visibility:'none'}, paint:{ 'line-color':'#800020', 'line-width':['interpolate',['linear'],['zoom'],4,1.8,8,2.8,11,3.8], 'line-opacity':0.98 } }, before);
      if (!m.getLayer(LABEL)) m.addLayer({ id:LABEL, type:'symbol', source:SRC, minzoom:7.2, layout:{visibility:'none','text-field':['coalesce',['get','label'],['get','id']],'text-size':10.5,'text-font':['Open Sans Semibold','Arial Unicode MS Bold'],'text-anchor':'center','text-allow-overlap':false}, paint:{ 'text-color':'#ffd7df','text-halo-color':'rgba(30,4,9,.92)','text-halo-width':1.25 } }, before);
      if (!m.getLayer(HOVER_FILL)) m.addLayer({ id:HOVER_FILL, type:'fill', source:SRC, layout:{visibility:'none'}, filter:['==',['get','id'],'__none__'], paint:{ 'fill-color':'#ef4444', 'fill-opacity':0.46 } }, before);
      if (!m.getLayer(HOVER_LINE)) m.addLayer({ id:HOVER_LINE, type:'line', source:SRC, layout:{visibility:'none'}, filter:['==',['get','id'],'__none__'], paint:{ 'line-color':'#800020','line-width':['interpolate',['linear'],['zoom'],4,4.2,8,6.2,11,7.2], 'line-opacity':1 } }, before);
      if (!m._osLehV69Events) {
        m._osLehV69Events = true;
        const show = (e) => {
          const f = topFeature(e); if (!f) return;
          const id = (f.properties && f.properties.id) || f.id;
          activeHoverId = id || '__none__';
          setHover(activeHoverId);
          m.getCanvas().style.cursor = 'pointer';
          if (typeof osShowHoverLabel === 'function') {
            const p = f.properties || {};
            osShowHoverLabel(centerOf(f) || e.lngLat, `<b>${esc(p.label || p.id || 'LEH zone')}</b>`);
          }
        };
        [FILL, LINE, HOVER_FILL, HOVER_LINE].forEach(layer => {
          m.on('mousemove', layer, show);
          m.on('mouseenter', layer, show);
          m.on('mouseleave', layer, () => { activeHoverId='__none__'; setHover('__none__'); m.getCanvas().style.cursor=''; if (typeof osHideHoverLabel === 'function') osHideHoverLabel(); });
          m.on('click', layer, e => { if (e && e.originalEvent) e.originalEvent.stopPropagation(); });
        });
      }
      return true;
    } catch(e) { console.warn('[GOS LEH v6.9 layers]', e); return false; }
  }
  function matchingFeatures(all){
    const selectedSpecies = sp();
    const selectedWMU = wmu();
    if (!selectedSpecies || !selectedWMU) return [];
    const wf = getWMUFeature(selectedWMU);
    if (!wf || !wf.geometry) return [];
    const wb = bbox(wf.geometry);
    return (all || []).filter(f => {
      const p = f.properties || {};
      if (!speciesMatch(p.species, selectedSpecies)) return false;
      if (!bboxHit(f._bbox || bbox(f.geometry), wb)) return false;
      return geomHit(f.geometry, wf.geometry);
    });
  }
  function refresh(){
    const m = map();
    const shouldShow = !!(window.osLEHZonesManualVisible && sp() && wmu());
    if (!m || !shouldShow) {
      lastCount = 0;
      try { if (m && ensure()) m.getSource(SRC).setData(emptyFC()); } catch(e) {}
      visibleLayers(false);
      return Promise.resolve([]);
    }
    return load().then(all => {
      if (!ensure()) return [];
      const feats = matchingFeatures(all);
      lastCount = feats.length;
      const src = m.getSource(SRC);
      if (src) src.setData({ type:'FeatureCollection', features:feats });
      visibleLayers(feats.length > 0);
      return feats;
    });
  }
  function resetVisible(){
    window.osLEHZonesManualVisible = false;
    refresh();
  }
  window.osToggleManualLEHZones = function(){
    window.osLEHZonesManualVisible = !window.osLEHZonesManualVisible;
    refresh().then(() => { try { if (typeof osRenderPanel === 'function') osRenderPanel(); } catch(e) {} });
  };
  window.osRefreshLEHZones = refresh;
  try { osRefreshLEHZones = refresh; } catch(e) {}

  // Replace earlier toggle so checkbox/panel code cannot auto-show stale LEH polygons.
  window.osToggleLEHZones = function(checked){
    window.osLEHZonesManualVisible = !!checked;
    refresh().then(() => { try { if (typeof osRenderPanel === 'function') osRenderPanel(); } catch(e) {} });
  };
  try { osToggleLEHZones = window.osToggleLEHZones; } catch(e) {}

  // Changing species or WMU resets the LEH overlay until user explicitly asks for it again.
  const prevSelectWMU = window.osSelectWMU || (typeof osSelectWMU === 'function' ? osSelectWMU : null);
  if (prevSelectWMU && !prevSelectWMU._hsV69Wrapped) {
    const wrapped = function(id){
      const before = wmu();
      const normalized = normWMU(id);
      if (before === normalized) resetVisible();
      else window.osLEHZonesManualVisible = false;
      const out = prevSelectWMU.apply(this, arguments);
      refresh();
      return out;
    };
    wrapped._hsV69Wrapped = true;
    window.osSelectWMU = wrapped;
    try { osSelectWMU = wrapped; } catch(e) {}
  }
  const prevSelectSpecies = window.osSelectSpecies || (typeof osSelectSpecies === 'function' ? osSelectSpecies : null);
  if (prevSelectSpecies && !prevSelectSpecies._hsV69Wrapped) {
    const wrapped = function(){ window.osLEHZonesManualVisible = false; const out = prevSelectSpecies.apply(this, arguments); refresh(); return out; };
    wrapped._hsV69Wrapped = true;
    window.osSelectSpecies = wrapped;
    try { osSelectSpecies = wrapped; } catch(e) {}
  }

  // WMU panel: put the small LEH control beneath the primary species card, not as a large top alert.
  function regionLink(){
    try {
      const regs = (typeof osSelectedRegionKeys === 'function') ? osSelectedRegionKeys() : [];
      const k = regs && regs[0];
      const pages = { '1':21, '2':28, '3':34, '4':38, '5':44, '6':50, '7A':57, '7B':62, '8':68 };
      const label = (typeof osRegionName === 'function' && k) ? osRegionName(k) : 'region synopsis';
      return k ? `<a href="./2024-2026%20hunting%20synopsis.pdf#page=${pages[String(k)] || 1}" target="_blank" rel="noopener">Open ${esc(label)} synopsis</a>` : '';
    } catch(e) { return ''; }
  }
  function noteHtml(){
    if (!sp() || !wmu()) return '';
    const isOn = !!window.osLEHZonesManualVisible;
    const msg = isOn ? (lastCount ? `${lastCount} LEH zone${lastCount === 1 ? '' : 's'} shown.` : 'No mapped LEH zones intersect this WMU.') : 'LEH zones are hidden.';
    return `<div class="os-leh-note os-leh-note-compact os-leh-note-inline os-leh-manual-note"><div><strong>LEH / closed-area context</strong><span>${esc(msg)} Check the synopsis for unit-specific hunting closed-area maps.</span></div><div class="os-leh-actions"><button type="button" class="os-view-leh-btn${isOn ? ' active' : ''}" onclick="osToggleManualLEHZones()">${isOn ? 'Hide LEH Zones' : 'View LEH Zones'}</button>${regionLink()}</div></div>`;
  }
  if (typeof osSeasonCards === 'function') {
    const buildPanel = function(rows){
      const selected = wmu();
      let all = [];
      try { all = osSortRows(BC_OS_DATA.filter(r => osRowHasAnyWMUInSelectedRegions(r) && osRowPassesGlobalFilters(r, true) && osRowAppliesToWMU(r, selected))); } catch(e) { all = rows || []; }
      const primary = rows && rows.length ? rows : all.filter(r => !sp() || r.species === sp());
      const other = all.filter(r => !primary.includes(r));
      const regLabel = (typeof osSelectedRegionLabel === 'function') ? osSelectedRegionLabel() : 'Selected region';
      return `<div class="os-region-summary"><b>WMU ${esc(selected)}</b><span>${esc(regLabel)}. Selected species/opportunity is shown first.</span></div>${osSeasonCards(primary, 'primary')}${noteHtml()}${other.length ? osCollapsibleBlock('Other species in this WMU', `${other.length} additional rows`, osSeasonCards(other, 'other'), false) : ''}`;
    };
    window.osWMUPanel = buildPanel;
    try { osWMUPanel = buildPanel; } catch(e) {}
  }

  // Preserve exact camera when changing map type. Do not fit bounds/reset selection.
  if (typeof window.osSetTile === 'function' || typeof osSetTile === 'function') {
    const setTile = function(type){
      const m = map();
      if (!m || !OS_MAP_STYLES || !OS_MAP_STYLES[type]) return;
      osMapStyle = type;
      try { osSyncTileButtons(); } catch(e) {}
      const camera = { center:m.getCenter(), zoom:m.getZoom(), bearing:m.getBearing(), pitch:m.getPitch() };
      const keep3d = !!(typeof osTerrain3D !== 'undefined' && osTerrain3D);
      m.setStyle(OS_MAP_STYLES[type]);
      m.once('style.load', () => {
        try {
          const wmuGeo = (typeof osGetWMUGeoJSON === 'function') ? osGetWMUGeoJSON() : ((typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON));
          const regGeo = (typeof osGetRegionGeoJSON === 'function') ? osGetRegionGeoJSON() : (typeof BC_REGION_GEOJSON !== 'undefined' ? BC_REGION_GEOJSON : null);
          osAddMapLayers(wmuGeo, regGeo);
        } catch(e) {}
        try { m.jumpTo(camera); } catch(e) {}
        try { if (keep3d && typeof osApplyTerrain === 'function') osApplyTerrain(true); } catch(e) {}
        try { if (typeof osRefreshMapStates === 'function') osRefreshMapStates(); } catch(e) {}
        setTimeout(() => { ensure(); refresh(); }, 80);
      });
    };
    window.osSetTile = setTile;
    try { osSetTile = setTile; } catch(e) {}
  }

  // Ensure stale overlays are gone on init and after style changes.
  const prevInit = window.initOpenSeasonsPage || (typeof initOpenSeasonsPage === 'function' ? initOpenSeasonsPage : null);
  if (prevInit && !prevInit._hsV69Wrapped) {
    const wrapped = function(){
      window.osLEHZonesManualVisible = false;
      const out = prevInit.apply(this, arguments);
      setTimeout(() => { ensure(); refresh(); }, 300);
      setTimeout(() => { ensure(); refresh(); }, 1000);
      return out;
    };
    wrapped._hsV69Wrapped = true;
    window.initOpenSeasonsPage = wrapped;
    try { initOpenSeasonsPage = wrapped; } catch(e) {}
  }
  setTimeout(() => { ensure(); resetVisible(); }, 650);
})();

// ══════════════════════════════════════════════════════════════
// GOS V7.0 — clean LEH controls + manual-only overlay
// - Replaces Share / All-species-region actions with a single View LEH Zones button.
// - Keeps LEH overlays hidden until the user explicitly clicks View LEH Zones.
// - Shows only LEH zones that intersect the selected WMU for the selected species.
// - Moves LEH layers above hunting polygons so they are not buried in the background.
// - Removes the large LEH alert card and replaces it with a tiny note under the species card.
// ══════════════════════════════════════════════════════════════
(function(){
  if (window.__HS_GOS_V70_LEH_CLEAN__) return;
  window.__HS_GOS_V70_LEH_CLEAN__ = true;

  const SRC = 'os-leh-zones-src';
  const FILL = 'os-leh-zones-fill';
  const LINE = 'os-leh-zones-line';
  const LABEL = 'os-leh-zones-label';
  const HOVER_FILL = 'os-leh-zones-hover-fill';
  const HOVER_LINE = 'os-leh-zones-hover-line';
  const PDF = './2024-2026%20hunting%20synopsis.pdf';
  const REGION_PAGE = { '1':21, '2':28, '3':34, '4':38, '5':44, '6':50, '7A':57, '7B':62, '8':68 };
  let allLeh = null;
  let loading = null;
  let hoverId = '';
  let hoverPopup = null;
  let lastCount = 0;

  window.osLEHZonesManualVisible = false;

  function esc(v){
    if (typeof osEscape === 'function') return osEscape(v);
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function map(){ return (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance || null; }
  function sp(){ return String((typeof osSelSpecies !== 'undefined' && osSelSpecies) || window.osSelSpecies || '').trim(); }
  function wmu(){ return normWMU((typeof osSelectedWMU !== 'undefined' && osSelectedWMU) || window.osSelectedWMU || ''); }
  function normWMU(v){ return (typeof osNormalizeWMU === 'function') ? osNormalizeWMU(v) : String(v || '').trim(); }
  function normSpecies(v){ return String(v || '').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' '); }
  function compact(v){ return normSpecies(v).replace(/\s+/g,''); }
  function speciesMatch(zoneSpecies, selected){
    const z = normSpecies(zoneSpecies), s = normSpecies(selected), zc = compact(zoneSpecies), sc = compact(selected);
    if (!z || !s) return false;
    if (z === s || zc === sc) return true;
    if (z === 'mountain goat' && s.includes('mountain goat')) return true;
    if (z === 'mule deer' && (s.includes('mule deer') || s.includes('black tailed'))) return true;
    if (z === 'white tailed deer' && (s.includes('white tailed') || s.includes('white tail') || s.includes('whitetail'))) return true;
    if (z === 'mountain sheep' && s.includes('sheep')) return true;
    return false;
  }
  function emptyFC(){ return { type:'FeatureCollection', features:[] }; }

  function coordsOf(geom){
    const out=[];
    (function walk(x){
      if (!x) return;
      if (Array.isArray(x) && typeof x[0] === 'number' && typeof x[1] === 'number') out.push(x);
      else if (Array.isArray(x)) x.forEach(walk);
    })(geom && geom.coordinates);
    return out;
  }
  function bboxOf(geom){
    const c = coordsOf(geom);
    if (!c.length) return null;
    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    c.forEach(p => { if (p[0]<minX) minX=p[0]; if (p[0]>maxX) maxX=p[0]; if (p[1]<minY) minY=p[1]; if (p[1]>maxY) maxY=p[1]; });
    return [minX,minY,maxX,maxY];
  }
  function bboxHit(a,b){ return !!(a && b && a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]); }
  function ringsOf(geom){
    if (!geom) return [];
    if (geom.type === 'Polygon') return geom.coordinates || [];
    if (geom.type === 'MultiPolygon') return (geom.coordinates || []).flat();
    return [];
  }
  function pointInRing(pt, ring){
    let inside=false, x=pt[0], y=pt[1];
    for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
      const xi=ring[i][0], yi=ring[i][1], xj=ring[j][0], yj=ring[j][1];
      const hit=((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/((yj-yi)||1e-12)+xi);
      if (hit) inside=!inside;
    }
    return inside;
  }
  function pointInGeom(pt, geom){ return ringsOf(geom).some(r => r && r.length > 2 && pointInRing(pt, r)); }
  function orient(a,b,c){ return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]); }
  function onSeg(a,b,p){ return Math.min(a[0],b[0]) <= p[0] && p[0] <= Math.max(a[0],b[0]) && Math.min(a[1],b[1]) <= p[1] && p[1] <= Math.max(a[1],b[1]) && Math.abs(orient(a,b,p)) < 1e-10; }
  function segHit(a,b,c,d){
    const o1=orient(a,b,c), o2=orient(a,b,d), o3=orient(c,d,a), o4=orient(c,d,b);
    if ((o1>0)!==(o2>0) && (o3>0)!==(o4>0)) return true;
    return onSeg(a,b,c)||onSeg(a,b,d)||onSeg(c,d,a)||onSeg(c,d,b);
  }
  function segmentsOf(geom, maxSegs){
    const segs=[];
    for (const ring of ringsOf(geom)) {
      if (!ring || ring.length < 2) continue;
      const step = Math.max(1, Math.ceil(ring.length / Math.max(25, maxSegs || 700)));
      for (let i=0;i<ring.length-1;i+=step) segs.push([ring[i], ring[Math.min(i+step, ring.length-1)]]);
    }
    return segs;
  }
  function geomHit(a,b){
    if (!a || !b) return false;
    const ab=bboxOf(a), bb=bboxOf(b);
    if (!bboxHit(ab, bb)) return false;
    const aPts=coordsOf(a), bPts=coordsOf(b);
    const aStep=Math.max(1, Math.ceil(aPts.length / 180));
    const bStep=Math.max(1, Math.ceil(bPts.length / 180));
    for (let i=0;i<aPts.length;i+=aStep) if (pointInGeom(aPts[i], b)) return true;
    for (let i=0;i<bPts.length;i+=bStep) if (pointInGeom(bPts[i], a)) return true;
    const as=segmentsOf(a, 700), bs=segmentsOf(b, 700);
    for (const s1 of as) for (const s2 of bs) if (segHit(s1[0], s1[1], s2[0], s2[1])) return true;
    return false;
  }
  function getWMUFeature(id){
    const geo = (typeof osGetWMUGeoJSON === 'function') ? osGetWMUGeoJSON() : ((typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON));
    const target = normWMU(id);
    return (geo && geo.features || []).find(f => {
      const p=f.properties||{};
      const fid=normWMU(p.wmu_id || p.WMUNIT_NUM || p.MU || p.mu || p.wmu || '');
      return fid === target;
    }) || null;
  }
  function load(){
    if (allLeh) return Promise.resolve(allLeh);
    if (loading) return loading;
    loading = fetch('./leh_zones.json')
      .then(r => { if (!r.ok) throw new Error('leh_zones.json failed to load'); return r.json(); })
      .then(data => {
        const zones = data && data.zones ? data.zones : {};
        allLeh = Object.entries(zones).map(([key,z]) => ({
          type:'Feature', id:key,
          properties:{ id:key, mu:String(z.mu||''), species:String(z.zt||''), label:String(z.lb||key), source:'BC LEH zone' },
          geometry:z.g,
          _bbox:bboxOf(z.g)
        })).filter(f => f.geometry && f.properties.species);
        return allLeh;
      })
      .catch(err => { console.warn('[GOS LEH V7]', err); loading=null; return []; });
    return loading;
  }

  function selectedFeatures(features){
    const species=sp(), selected=wmu();
    if (!species || !selected || !Array.isArray(features)) return [];
    const wf = getWMUFeature(selected);
    if (!wf || !wf.geometry) return [];
    const wb = bboxOf(wf.geometry);
    return features.filter(f => {
      const p=f.properties||{};
      if (!speciesMatch(p.species, species)) return false;
      if (!bboxHit(f._bbox || bboxOf(f.geometry), wb)) return false;
      return geomHit(f.geometry, wf.geometry);
    });
  }

  function source(){
    const m = map();
    return m && m.getSource && m.getSource(SRC);
  }
  function ensureLayers(){
    const m = map();
    if (!m || !m.getStyle) return false;
    try {
      if (!m.getSource(SRC)) m.addSource(SRC, { type:'geojson', data:emptyFC() });
      if (!m.getLayer(FILL)) m.addLayer({ id:FILL, type:'fill', source:SRC, layout:{visibility:'none'}, paint:{ 'fill-color':'#b91c35', 'fill-opacity':0.28, 'fill-outline-color':'#7f0020' } });
      if (!m.getLayer(LINE)) m.addLayer({ id:LINE, type:'line', source:SRC, layout:{visibility:'none'}, paint:{ 'line-color':'#7f0020', 'line-width':['interpolate',['linear'],['zoom'],4,2.0,8,3.0,11,4.2], 'line-opacity':0.98 } });
      if (!m.getLayer(HOVER_FILL)) m.addLayer({ id:HOVER_FILL, type:'fill', source:SRC, layout:{visibility:'none'}, filter:['==',['get','id'],'__none__'], paint:{ 'fill-color':'#f43f5e', 'fill-opacity':0.42 } });
      if (!m.getLayer(HOVER_LINE)) m.addLayer({ id:HOVER_LINE, type:'line', source:SRC, layout:{visibility:'none'}, filter:['==',['get','id'],'__none__'], paint:{ 'line-color':'#8a001f', 'line-width':['interpolate',['linear'],['zoom'],4,3.0,8,4.8,11,6.2], 'line-opacity':1 } });
      if (!m.getLayer(LABEL)) m.addLayer({ id:LABEL, type:'symbol', source:SRC, minzoom:8.5, layout:{ visibility:'none', 'text-field':['coalesce',['get','label'],['get','id']], 'text-size':11, 'text-font':['Open Sans Semibold','Arial Unicode MS Bold'], 'text-anchor':'center', 'text-allow-overlap':false }, paint:{ 'text-color':'#ffd2dc', 'text-halo-color':'rgba(24,4,8,.88)', 'text-halo-width':1.35 } });
      // Keep the LEH context above the GOS region/WMU polygons so it does not look buried in the background.
      [FILL, LINE, HOVER_FILL, HOVER_LINE, LABEL].forEach(id => { try { if (m.getLayer(id)) m.moveLayer(id); } catch(e) {} });
      if (!m._hsV70LehHoverBound) {
        m._hsV70LehHoverBound = true;
        m.on('mousemove', FILL, e => {
          const f = e.features && e.features[0];
          const p = f && f.properties || {};
          hoverId = String(p.id || f.id || '');
          m.getCanvas().style.cursor = 'pointer';
          try { if (m.getLayer(HOVER_FILL)) m.setFilter(HOVER_FILL, ['==',['get','id'], hoverId]); } catch(e) {}
          try { if (m.getLayer(HOVER_LINE)) m.setFilter(HOVER_LINE, ['==',['get','id'], hoverId]); } catch(e) {}
          if (!hoverPopup) hoverPopup = new mapboxgl.Popup({ closeButton:false, closeOnClick:false, offset:12, className:'os-leh-hover-label os-leh-hover-label-v70' });
          hoverPopup.setLngLat(e.lngLat).setHTML(`<div class="os-leh-hover"><b>${esc(p.label || p.id || 'LEH zone')}</b><span>${esc(p.species || '')}</span></div>`).addTo(m);
        });
        m.on('mouseleave', FILL, () => {
          m.getCanvas().style.cursor = '';
          hoverId = '';
          try { if (m.getLayer(HOVER_FILL)) m.setFilter(HOVER_FILL, ['==',['get','id'], '__none__']); } catch(e) {}
          try { if (m.getLayer(HOVER_LINE)) m.setFilter(HOVER_LINE, ['==',['get','id'], '__none__']); } catch(e) {}
          if (hoverPopup) hoverPopup.remove();
        });
        m.on('click', FILL, e => {
          const p = e.features && e.features[0] && e.features[0].properties || {};
          new mapboxgl.Popup({ closeButton:true, className:'os-leh-popup' })
            .setLngLat(e.lngLat)
            .setHTML(`<div class="os-leh-pop"><b>${esc(p.label || p.id || 'LEH zone')}</b><span>${esc(p.species || '')}</span></div>`)
            .addTo(m);
        });
      }
      return true;
    } catch(e) { console.warn('[GOS LEH V7 layers]', e); return false; }
  }
  function setVisible(on){
    const m = map(); if (!m) return;
    [FILL, LINE, LABEL, HOVER_FILL, HOVER_LINE].forEach(id => { try { if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); } catch(e) {} });
    if (!on && hoverPopup) hoverPopup.remove();
  }
  function clearLayer(){
    const m = map();
    lastCount = 0;
    try { if (m && ensureLayers()) { const s = m.getSource(SRC); if (s) s.setData(emptyFC()); } } catch(e) {}
    setVisible(false);
    updateHeaderButton();
  }
  function refresh(){
    const m = map();
    if (!m || !sp() || !wmu() || !window.osLEHZonesManualVisible) { clearLayer(); return Promise.resolve([]); }
    return load().then(features => {
      if (!ensureLayers()) return [];
      const feats = selectedFeatures(features);
      lastCount = feats.length;
      const s = source(); if (s) s.setData({ type:'FeatureCollection', features:feats });
      setVisible(feats.length > 0);
      updateHeaderButton();
      return feats;
    });
  }
  window.osRefreshLEHZones = refresh;
  window.osToggleManualLEHZones = function(){ window.osLEHZonesManualVisible = !window.osLEHZonesManualVisible; refresh(); updateHeaderButton(); renderSoon(); };
  window.osToggleLEHZones = function(checked){ window.osLEHZonesManualVisible = !!checked; refresh(); updateHeaderButton(); renderSoon(); };

  function selectedRegions(){ try { return (typeof osSelectedRegionKeys === 'function') ? osSelectedRegionKeys().map(String) : []; } catch(e){ return []; } }
  function regionLinkHtml(){
    const k = selectedRegions()[0];
    if (!k) return '';
    const label = (typeof osRegionName === 'function') ? osRegionName(k) : ('Region ' + k);
    const page = REGION_PAGE[String(k)] || 1;
    return `<a class="os-leh-mini-link" href="${PDF}#page=${page}" target="_blank" rel="noopener">Synopsis</a>`;
  }
  function updateHeaderButton(){
    const btn = document.getElementById('osPanelViewLEHBtn');
    if (!btn) return;
    const can = !!(sp() && wmu());
    btn.style.display = can ? '' : 'none';
    btn.classList.toggle('active', !!window.osLEHZonesManualVisible);
    btn.textContent = window.osLEHZonesManualVisible ? 'Hide LEH Zones' : 'View LEH Zones';
    btn.title = can ? `${lastCount || 0} intersecting LEH zone${lastCount === 1 ? '' : 's'}` : 'Select a species and WMU first';
  }
  function miniNoteHtml(){
    if (!sp() || !wmu()) return '';
    const status = window.osLEHZonesManualVisible ? `${lastCount || 0} LEH zone${lastCount === 1 ? '' : 's'} shown.` : 'LEH zones hidden.';
    return `<div class="os-leh-mini-note"><span>${esc(status)} Check synopsis for unit-specific closed-area maps.</span>${regionLinkHtml()}</div>`;
  }
  function cleanPanel(){
    const page = document.getElementById('bcOpenSeasonsPage');
    if (!page) return;
    page.querySelectorAll('#osShareViewBtn, #osBackSpeciesBtn, .os-panel-action-share').forEach(el => el.remove());
    page.querySelectorAll('.os-leh-note, .os-leh-note-v61, .os-leh-manual-note').forEach(el => el.remove());
    const actions = page.querySelector('.os-panel-actions');
    if (actions && !document.getElementById('osPanelViewLEHBtn')) {
      const b = document.createElement('button');
      b.id = 'osPanelViewLEHBtn';
      b.type = 'button';
      b.className = 'os-panel-view-leh-btn';
      b.onclick = function(ev){ ev.preventDefault(); ev.stopPropagation(); window.osToggleManualLEHZones(); };
      actions.appendChild(b);
    }
    updateHeaderButton();
    const body = page.querySelector('.os-results-panel');
    if (body && sp() && wmu() && !body.querySelector('.os-leh-mini-note')) {
      const firstCard = body.querySelector('.os-season-card');
      if (firstCard) firstCard.insertAdjacentHTML('afterend', miniNoteHtml());
    }
  }
  function renderSoon(){ setTimeout(cleanPanel, 0); setTimeout(cleanPanel, 100); }

  const prevRender = window.osRenderPanel || (typeof osRenderPanel === 'function' ? osRenderPanel : null);
  if (prevRender && !prevRender._hsV70CleanLehWrapped) {
    const wrapped = function(){ const out = prevRender.apply(this, arguments); renderSoon(); return out; };
    wrapped._hsV70CleanLehWrapped = true;
    window.osRenderPanel = wrapped;
    try { osRenderPanel = wrapped; } catch(e) {}
  }

  const prevSelectWMU = window.osSelectWMU || (typeof osSelectWMU === 'function' ? osSelectWMU : null);
  if (prevSelectWMU && !prevSelectWMU._hsV70CleanLehWrapped) {
    const wrapped = function(){ window.osLEHZonesManualVisible = false; const out = prevSelectWMU.apply(this, arguments); refresh(); renderSoon(); return out; };
    wrapped._hsV70CleanLehWrapped = true;
    window.osSelectWMU = wrapped;
    try { osSelectWMU = wrapped; } catch(e) {}
  }
  const prevSelectSpecies = window.osSelectSpecies || (typeof osSelectSpecies === 'function' ? osSelectSpecies : null);
  if (prevSelectSpecies && !prevSelectSpecies._hsV70CleanLehWrapped) {
    const wrapped = function(){ window.osLEHZonesManualVisible = false; const out = prevSelectSpecies.apply(this, arguments); refresh(); renderSoon(); return out; };
    wrapped._hsV70CleanLehWrapped = true;
    window.osSelectSpecies = wrapped;
    try { osSelectSpecies = wrapped; } catch(e) {}
  }

  // Hide LEH zones whenever the style reloads until user asks again; then rebuild cleanly.
  const prevSetTile = window.osSetTile || (typeof osSetTile === 'function' ? osSetTile : null);
  if (prevSetTile && !prevSetTile._hsV70CleanLehWrapped) {
    const wrapped = function(){ const out = prevSetTile.apply(this, arguments); setTimeout(() => { ensureLayers(); refresh(); renderSoon(); }, 500); return out; };
    wrapped._hsV70CleanLehWrapped = true;
    window.osSetTile = wrapped;
    try { osSetTile = wrapped; } catch(e) {}
  }

  setTimeout(() => { ensureLayers(); clearLayer(); cleanPanel(); }, 350);
  setTimeout(() => { ensureLayers(); clearLayer(); cleanPanel(); }, 1200);
})();

// ══════════════════════════════════════════════════════════════
// GOS V7.1 — rebuild LEH zones as manual-only, WMU-intersected, top-layer context
// - Old auto LEH refreshers are disabled by keeping osShowLEHZones false.
// - Red LEH overlays are hidden until the red View LEH Zones button is pressed.
// - When visible, only LEH zones that intersect the selected WMU for the selected species are drawn.
// - LEH zones are moved above GOS/WMU fills so they do not look buried in the background.
// ══════════════════════════════════════════════════════════════
(function(){
  if (window.__HS_GOS_V71_LEH_REBUILD__) return;
  window.__HS_GOS_V71_LEH_REBUILD__ = true;

  const SRC = 'os-leh-zones-src';
  const FILL = 'os-leh-zones-fill';
  const LINE = 'os-leh-zones-line';
  const HOVER_FILL = 'os-leh-zones-hover-fill';
  const HOVER_LINE = 'os-leh-zones-hover-line';
  const LABEL = 'os-leh-zones-label';
  const PDF = './2024-2026%20hunting%20synopsis.pdf';
  const REGION_PAGE = { '1':21, '2':28, '3':34, '4':38, '5':44, '6':50, '7A':57, '7B':62, '8':68 };

  let cache = null;
  let loading = null;
  let lastCount = 0;
  let hoverPopup = null;

  // Disable every older auto-refresh implementation. V7.1 uses manual visibility only.
  window.osShowLEHZones = false;
  window.osLEHZonesManualVisible = false;

  function esc(v){
    if (typeof osEscape === 'function') return osEscape(v);
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function m(){ return (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance || null; }
  function selectedSpecies(){ return String((typeof osSelSpecies !== 'undefined' && osSelSpecies) || window.osSelSpecies || '').trim(); }
  function selectedWMU(){ return normWMU((typeof osSelectedWMU !== 'undefined' && osSelectedWMU) || window.osSelectedWMU || ''); }
  function normWMU(v){ return (typeof osNormalizeWMU === 'function') ? osNormalizeWMU(v) : String(v || '').trim(); }
  function normSpecies(v){ return String(v || '').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' '); }
  function compact(v){ return normSpecies(v).replace(/\s+/g,''); }
  function speciesMatch(zoneSpecies, selected){
    const z = normSpecies(zoneSpecies), s = normSpecies(selected), zc = compact(zoneSpecies), sc = compact(selected);
    if (!z || !s) return false;
    if (z === s || zc === sc) return true;
    if (z === 'mountain goat' && s.includes('mountain goat')) return true;
    if (z === 'mountain sheep' && s.includes('sheep')) return true;
    if (z === 'mule deer' && (s.includes('mule deer') || s.includes('black tailed'))) return true;
    if (z === 'white tailed deer' && (s.includes('white tailed') || s.includes('white tail') || s.includes('whitetail'))) return true;
    return false;
  }
  function emptyFC(){ return { type:'FeatureCollection', features:[] }; }
  function coordsOf(geom){
    const out=[];
    (function walk(x){
      if (!x) return;
      if (Array.isArray(x) && typeof x[0] === 'number' && typeof x[1] === 'number') out.push(x);
      else if (Array.isArray(x)) x.forEach(walk);
    })(geom && geom.coordinates);
    return out;
  }
  function bboxOf(geom){
    const pts = coordsOf(geom);
    if (!pts.length) return null;
    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    pts.forEach(([x,y]) => { if (x<minX) minX=x; if (x>maxX) maxX=x; if (y<minY) minY=y; if (y>maxY) maxY=y; });
    return [minX,minY,maxX,maxY];
  }
  function bboxHit(a,b){ return !!(a && b && a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]); }
  function ringsOf(geom){
    if (!geom) return [];
    if (geom.type === 'Polygon') return geom.coordinates || [];
    if (geom.type === 'MultiPolygon') return (geom.coordinates || []).flat();
    return [];
  }
  function pointInRing(pt, ring){
    let inside=false, x=pt[0], y=pt[1];
    for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
      const xi=ring[i][0], yi=ring[i][1], xj=ring[j][0], yj=ring[j][1];
      const hit=((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/((yj-yi)||1e-12)+xi);
      if (hit) inside=!inside;
    }
    return inside;
  }
  function pointInGeom(pt, geom){ return ringsOf(geom).some(r => r && r.length > 2 && pointInRing(pt, r)); }
  function orient(a,b,c){ return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]); }
  function onSeg(a,b,p){ return Math.min(a[0],b[0]) <= p[0] && p[0] <= Math.max(a[0],b[0]) && Math.min(a[1],b[1]) <= p[1] && p[1] <= Math.max(a[1],b[1]) && Math.abs(orient(a,b,p)) < 1e-10; }
  function segHit(a,b,c,d){
    const o1=orient(a,b,c), o2=orient(a,b,d), o3=orient(c,d,a), o4=orient(c,d,b);
    if ((o1>0)!==(o2>0) && (o3>0)!==(o4>0)) return true;
    return onSeg(a,b,c)||onSeg(a,b,d)||onSeg(c,d,a)||onSeg(c,d,b);
  }
  function segmentsOf(geom, maxSegs){
    const segs=[];
    for (const ring of ringsOf(geom)) {
      if (!ring || ring.length < 2) continue;
      const step = Math.max(1, Math.ceil(ring.length / Math.max(30, maxSegs || 800)));
      for (let i=0;i<ring.length-1;i+=step) segs.push([ring[i], ring[Math.min(i+step, ring.length-1)]]);
    }
    return segs;
  }
  function geomIntersects(a,b){
    if (!a || !b) return false;
    if (!bboxHit(bboxOf(a), bboxOf(b))) return false;
    const aPts=coordsOf(a), bPts=coordsOf(b);
    const aStep=Math.max(1, Math.ceil(aPts.length / 180));
    const bStep=Math.max(1, Math.ceil(bPts.length / 180));
    for (let i=0;i<aPts.length;i+=aStep) if (pointInGeom(aPts[i], b)) return true;
    for (let i=0;i<bPts.length;i+=bStep) if (pointInGeom(bPts[i], a)) return true;
    const as=segmentsOf(a, 800), bs=segmentsOf(b, 800);
    for (const s1 of as) for (const s2 of bs) if (segHit(s1[0], s1[1], s2[0], s2[1])) return true;
    return false;
  }
  function getWMUGeo(){
    if (typeof osGetWMUGeoJSON === 'function') return osGetWMUGeoJSON();
    return (typeof BC_WMU_GEOJSON !== 'undefined' && BC_WMU_GEOJSON) || (typeof bcWmuGeoJSON !== 'undefined' && bcWmuGeoJSON) || null;
  }
  function getWMUFeature(id){
    const geo = getWMUGeo();
    const target = normWMU(id);
    return (geo && geo.features || []).find(f => {
      const p = f.properties || {};
      const fid = normWMU(p.wmu_id || p.WMUNIT_NUM || p.MU || p.mu || p.wmu || '');
      return fid === target;
    }) || null;
  }
  function loadZones(){
    if (cache) return Promise.resolve(cache);
    if (loading) return loading;
    loading = fetch('./leh_zones.json')
      .then(r => { if (!r.ok) throw new Error('leh_zones.json failed to load'); return r.json(); })
      .then(data => {
        const zones = data && data.zones ? data.zones : {};
        cache = Object.entries(zones).map(([key,z]) => ({
          type:'Feature',
          id:key,
          properties:{ id:key, mu:String(z.mu || ''), species:String(z.zt || ''), label:String(z.lb || key), source:'BC LEH zone' },
          geometry:z.g,
          _bbox:bboxOf(z.g)
        })).filter(f => f.geometry && f.properties.species);
        return cache;
      })
      .catch(err => { console.warn('[GOS LEH V7.1]', err); loading=null; return []; });
    return loading;
  }
  function selectedZoneFeatures(features){
    const species = selectedSpecies();
    const selected = selectedWMU();
    if (!species || !selected || !Array.isArray(features)) return [];
    const wmuFeature = getWMUFeature(selected);
    if (!wmuFeature || !wmuFeature.geometry) return [];
    const wmuBBox = bboxOf(wmuFeature.geometry);
    return features.filter(f => {
      const p = f.properties || {};
      if (!speciesMatch(p.species, species)) return false;
      if (!bboxHit(f._bbox || bboxOf(f.geometry), wmuBBox)) return false;
      return geomIntersects(f.geometry, wmuFeature.geometry);
    });
  }
  function applyOpacity(){
    const map = m(); if (!map) return;
    const op = Number(window.osLayerOpacity);
    const o = Number.isFinite(op) ? Math.max(0, Math.min(1, op)) : 1;
    try { if (map.getLayer(FILL)) map.setPaintProperty(FILL, 'fill-opacity', 0.28 * o); } catch(e) {}
    try { if (map.getLayer(LINE)) map.setPaintProperty(LINE, 'line-opacity', 0.98 * o); } catch(e) {}
    try { if (map.getLayer(HOVER_FILL)) map.setPaintProperty(HOVER_FILL, 'fill-opacity', 0.45 * o); } catch(e) {}
    try { if (map.getLayer(HOVER_LINE)) map.setPaintProperty(HOVER_LINE, 'line-opacity', o); } catch(e) {}
  }
  function moveLEHToTop(){
    const map = m(); if (!map) return;
    [FILL, LINE, HOVER_FILL, HOVER_LINE, LABEL].forEach(id => { try { if (map.getLayer(id)) map.moveLayer(id); } catch(e) {} });
  }
  function ensureLayers(){
    const map = m();
    if (!map || !map.getStyle) return false;
    try {
      if (!map.getSource(SRC)) map.addSource(SRC, { type:'geojson', data:emptyFC() });
      if (!map.getLayer(FILL)) map.addLayer({ id:FILL, type:'fill', source:SRC, layout:{ visibility:'none' }, paint:{ 'fill-color':'#b91c35', 'fill-opacity':0.28, 'fill-outline-color':'#7f0020' } });
      if (!map.getLayer(LINE)) map.addLayer({ id:LINE, type:'line', source:SRC, layout:{ visibility:'none' }, paint:{ 'line-color':'#7f0020', 'line-width':['interpolate',['linear'],['zoom'],4,2.1,8,3.2,11,4.6], 'line-opacity':0.98 } });
      if (!map.getLayer(HOVER_FILL)) map.addLayer({ id:HOVER_FILL, type:'fill', source:SRC, layout:{ visibility:'none' }, filter:['==',['get','id'],'__none__'], paint:{ 'fill-color':'#f43f5e', 'fill-opacity':0.45 } });
      if (!map.getLayer(HOVER_LINE)) map.addLayer({ id:HOVER_LINE, type:'line', source:SRC, layout:{ visibility:'none' }, filter:['==',['get','id'],'__none__'], paint:{ 'line-color':'#7f0020', 'line-width':['interpolate',['linear'],['zoom'],4,3.2,8,5.2,11,6.8], 'line-opacity':1 } });
      if (!map.getLayer(LABEL)) map.addLayer({ id:LABEL, type:'symbol', source:SRC, minzoom:8.3, layout:{ visibility:'none', 'text-field':['coalesce',['get','label'],['get','id']], 'text-size':11, 'text-font':['Open Sans Semibold','Arial Unicode MS Bold'], 'text-anchor':'center', 'text-allow-overlap':false }, paint:{ 'text-color':'#ffd2dc', 'text-halo-color':'rgba(24,4,8,.9)', 'text-halo-width':1.35 } });
      applyOpacity();
      moveLEHToTop();
      if (!map._hsV71LehStyleBound) {
        map._hsV71LehStyleBound = true;
        map.on('styledata', () => { setTimeout(() => { if (window.osLEHZonesManualVisible) refresh(); else clear(); }, 180); });
        map.on('idle', () => { if (window.osLEHZonesManualVisible) moveLEHToTop(); });
      }
      if (!map._hsV71LehHoverBound) {
        map._hsV71LehHoverBound = true;
        map.on('mousemove', FILL, e => {
          const f = e.features && e.features[0];
          const p = f && f.properties || {};
          const id = String(p.id || f.id || '');
          map.getCanvas().style.cursor = 'pointer';
          try { if (map.getLayer(HOVER_FILL)) map.setFilter(HOVER_FILL, ['==',['get','id'], id]); } catch(e) {}
          try { if (map.getLayer(HOVER_LINE)) map.setFilter(HOVER_LINE, ['==',['get','id'], id]); } catch(e) {}
          if (!hoverPopup) hoverPopup = new mapboxgl.Popup({ closeButton:false, closeOnClick:false, offset:12, className:'os-leh-hover-label os-leh-hover-label-v71' });
          hoverPopup.setLngLat(e.lngLat).setHTML(`<div class="os-leh-hover"><b>${esc(p.label || p.id || 'LEH zone')}</b><span>${esc(p.species || '')}</span></div>`).addTo(map);
        });
        map.on('mouseleave', FILL, () => {
          map.getCanvas().style.cursor = '';
          try { if (map.getLayer(HOVER_FILL)) map.setFilter(HOVER_FILL, ['==',['get','id'], '__none__']); } catch(e) {}
          try { if (map.getLayer(HOVER_LINE)) map.setFilter(HOVER_LINE, ['==',['get','id'], '__none__']); } catch(e) {}
          if (hoverPopup) hoverPopup.remove();
        });
      }
      return true;
    } catch(err) { console.warn('[GOS LEH V7.1 layers]', err); return false; }
  }
  function setVisible(on){
    const map = m(); if (!map) return;
    [FILL, LINE, LABEL, HOVER_FILL, HOVER_LINE].forEach(id => { try { if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); } catch(e) {} });
    if (!on && hoverPopup) hoverPopup.remove();
    if (on) moveLEHToTop();
  }
  function clear(){
    window.osShowLEHZones = false;
    lastCount = 0;
    const map = m();
    try { if (map && ensureLayers()) { const src = map.getSource(SRC); if (src) src.setData(emptyFC()); } } catch(e) {}
    setVisible(false);
    updatePanelButtonAndNote();
  }
  function refresh(){
    // Keep legacy auto implementations disabled. Manual button is the single source of truth.
    window.osShowLEHZones = false;
    const map = m();
    if (!map || !selectedSpecies() || !selectedWMU() || !window.osLEHZonesManualVisible) { clear(); return Promise.resolve([]); }
    return loadZones().then(features => {
      if (!ensureLayers()) return [];
      const feats = selectedZoneFeatures(features);
      lastCount = feats.length;
      const src = map.getSource(SRC);
      if (src) src.setData({ type:'FeatureCollection', features:feats });
      setVisible(feats.length > 0);
      updatePanelButtonAndNote();
      // Older wrappers can still run after us; repeat the final ordering/data/visibility once.
      setTimeout(() => { if (window.osLEHZonesManualVisible) { setVisible(feats.length > 0); moveLEHToTop(); } }, 160);
      return feats;
    });
  }
  function selectedRegions(){ try { return (typeof osSelectedRegionKeys === 'function') ? osSelectedRegionKeys().map(String) : []; } catch(e){ return []; } }
  function regionLinkHtml(){
    const k = selectedRegions()[0];
    if (!k) return '';
    const page = REGION_PAGE[String(k)] || 1;
    return `<a class="os-leh-mini-link" href="${PDF}#page=${page}" target="_blank" rel="noopener">Synopsis</a>`;
  }
  function miniNoteHtml(){
    if (!selectedSpecies() || !selectedWMU()) return '';
    const status = window.osLEHZonesManualVisible ? `${lastCount || 0} LEH zone${lastCount === 1 ? '' : 's'} shown.` : 'LEH zones hidden.';
    return `<div class="os-leh-mini-note"><span>${esc(status)} Check synopsis for unit-specific closed-area maps.</span>${regionLinkHtml()}</div>`;
  }
  function updatePanelButtonAndNote(){
    const page = document.getElementById('bcOpenSeasonsPage');
    if (!page) return;
    page.querySelectorAll('#osShareViewBtn, #osBackSpeciesBtn, .os-panel-action-share, .os-leh-note, .os-leh-note-v61, .os-leh-manual-note').forEach(el => el.remove());
    const actions = page.querySelector('.os-panel-actions');
    if (actions && !document.getElementById('osPanelViewLEHBtn')) {
      const b = document.createElement('button');
      b.id = 'osPanelViewLEHBtn';
      b.type = 'button';
      b.className = 'os-panel-view-leh-btn';
      b.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); toggle(); });
      actions.appendChild(b);
    }
    const btn = document.getElementById('osPanelViewLEHBtn');
    if (btn) {
      const can = !!(selectedSpecies() && selectedWMU());
      btn.style.display = can ? '' : 'none';
      btn.classList.toggle('active', !!window.osLEHZonesManualVisible);
      btn.textContent = window.osLEHZonesManualVisible ? 'Hide LEH Zones' : 'View LEH Zones';
      btn.title = can ? `${lastCount || 0} intersecting LEH zone${lastCount === 1 ? '' : 's'}` : 'Select a species and WMU first';
    }
    page.querySelectorAll('.os-leh-mini-note').forEach(el => el.remove());
    const body = page.querySelector('.os-results-panel');
    if (body && selectedSpecies() && selectedWMU()) {
      const firstCard = body.querySelector('.os-season-card');
      if (firstCard) firstCard.insertAdjacentHTML('afterend', miniNoteHtml());
    }
  }
  function toggle(){
    window.osLEHZonesManualVisible = !window.osLEHZonesManualVisible;
    if (!window.osLEHZonesManualVisible) clear();
    else {
      // Repeat because legacy delayed refreshes may run after the click.
      refresh(); setTimeout(refresh, 120); setTimeout(refresh, 320);
    }
    updatePanelButtonAndNote();
  }
  function hideBecauseContextChanged(){
    window.osLEHZonesManualVisible = false;
    clear();
    setTimeout(updatePanelButtonAndNote, 50);
  }

  window.osRefreshLEHZones = refresh;
  window.osToggleManualLEHZones = toggle;
  window.osToggleLEHZones = function(checked){
    window.osLEHZonesManualVisible = !!checked;
    if (window.osLEHZonesManualVisible) { refresh(); setTimeout(refresh, 140); }
    else clear();
  };

  const prevRender = window.osRenderPanel || (typeof osRenderPanel === 'function' ? osRenderPanel : null);
  if (prevRender && !prevRender._hsV71Wrapped) {
    const wrapped = function(){ const out = prevRender.apply(this, arguments); setTimeout(updatePanelButtonAndNote, 0); return out; };
    wrapped._hsV71Wrapped = true;
    window.osRenderPanel = wrapped;
    try { osRenderPanel = wrapped; } catch(e) {}
  }
  const prevSelectWMU = window.osSelectWMU || (typeof osSelectWMU === 'function' ? osSelectWMU : null);
  if (prevSelectWMU && !prevSelectWMU._hsV71Wrapped) {
    const wrapped = function(){ hideBecauseContextChanged(); const out = prevSelectWMU.apply(this, arguments); setTimeout(updatePanelButtonAndNote, 0); return out; };
    wrapped._hsV71Wrapped = true;
    window.osSelectWMU = wrapped;
    try { osSelectWMU = wrapped; } catch(e) {}
  }
  const prevSelectSpecies = window.osSelectSpecies || (typeof osSelectSpecies === 'function' ? osSelectSpecies : null);
  if (prevSelectSpecies && !prevSelectSpecies._hsV71Wrapped) {
    const wrapped = function(){ hideBecauseContextChanged(); const out = prevSelectSpecies.apply(this, arguments); setTimeout(updatePanelButtonAndNote, 0); return out; };
    wrapped._hsV71Wrapped = true;
    window.osSelectSpecies = wrapped;
    try { osSelectSpecies = wrapped; } catch(e) {}
  }
  const prevSelectRegion = window.osSelectRegion || (typeof osSelectRegion === 'function' ? osSelectRegion : null);
  if (prevSelectRegion && !prevSelectRegion._hsV71Wrapped) {
    const wrapped = function(){ hideBecauseContextChanged(); const out = prevSelectRegion.apply(this, arguments); setTimeout(updatePanelButtonAndNote, 0); return out; };
    wrapped._hsV71Wrapped = true;
    window.osSelectRegion = wrapped;
    try { osSelectRegion = wrapped; } catch(e) {}
  }
  const prevRefreshMapStates = window.osRefreshMapStates || (typeof osRefreshMapStates === 'function' ? osRefreshMapStates : null);
  if (prevRefreshMapStates && !prevRefreshMapStates._hsV71Wrapped) {
    const wrapped = function(){
      const out = prevRefreshMapStates.apply(this, arguments);
      if (window.osLEHZonesManualVisible) { setTimeout(refresh, 40); setTimeout(refresh, 180); }
      else { setTimeout(clear, 40); }
      return out;
    };
    wrapped._hsV71Wrapped = true;
    window.osRefreshMapStates = wrapped;
    try { osRefreshMapStates = wrapped; } catch(e) {}
  }

  setTimeout(() => { clear(); updatePanelButtonAndNote(); }, 250);
  setTimeout(() => { clear(); updatePanelButtonAndNote(); }, 1200);
})();

// ══════════════════════════════════════════════════════════════
// GOS V7.2 — LEH quarantine + clean manual-only renderer
// Fixes stale/legacy LEH layers that could make neighbouring WMUs/zones look active.
// This block is intentionally last and is the single source of truth for LEH display.
// ══════════════════════════════════════════════════════════════
(function(){
  const LEGACY_SRC = 'os-leh-zones-src';
  const LEGACY_LAYERS = [
    'os-leh-zones-fill','os-leh-zones-line','os-leh-zones-label',
    'os-leh-zones-hover-fill','os-leh-zones-hover-line'
  ];
  const SRC = 'hs-os-leh-clean-src';
  const FILL = 'hs-os-leh-clean-fill';
  const LINE = 'hs-os-leh-clean-line';
  const HOVER_FILL = 'hs-os-leh-clean-hover-fill';
  const HOVER_LINE = 'hs-os-leh-clean-hover-line';
  const LAYERS = [FILL, LINE, HOVER_FILL, HOVER_LINE];
  let cache = null;
  let loading = null;
  let hoverPopup = null;
  let lastCount = 0;

  function map(){ return (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance || null; }
  function emptyFC(){ return { type:'FeatureCollection', features:[] }; }
  function esc(v){ return (typeof osEscape === 'function') ? osEscape(v) : String(v == null ? '' : v).replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }
  function norm(v){ return String(v || '').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' '); }
  function compact(v){ return norm(v).replace(/\s+/g,''); }
  function selectedSpecies(){ return String((typeof osSelSpecies !== 'undefined' && osSelSpecies) || window.osSelSpecies || '').trim(); }
  function selectedWMU(){ return String((typeof osSelectedWMU !== 'undefined' && osSelectedWMU) || window.osSelectedWMU || '').trim(); }
  function speciesMatch(zoneSpecies, species){
    const z = norm(zoneSpecies), s = norm(species), zc = compact(zoneSpecies), sc = compact(species);
    if (!z || !s) return false;
    if (z === s || zc === sc) return true;
    if (z === 'mountain goat' && s.includes('mountain goat')) return true;
    if (z === 'moose' && s.includes('moose')) return true;
    if (z === 'elk' && s.includes('elk')) return true;
    if (z === 'bison' && s.includes('bison')) return true;
    if (z === 'caribou' && s.includes('caribou')) return true;
    if (z === 'mountain sheep' && s.includes('sheep')) return true;
    if (z === 'mule deer' && (s.includes('mule deer') || s.includes('black tailed'))) return true;
    if (z === 'white tailed deer' && (s.includes('white tailed') || s.includes('white tail') || s.includes('whitetail'))) return true;
    return false;
  }
  function coordsOf(geom){
    const out=[];
    (function walk(x){
      if (!x) return;
      if (Array.isArray(x) && typeof x[0] === 'number' && typeof x[1] === 'number') out.push(x);
      else if (Array.isArray(x)) x.forEach(walk);
    })(geom && geom.coordinates);
    return out;
  }
  function bboxOf(geom){
    const c = coordsOf(geom); if (!c.length) return null;
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    c.forEach(p => { minX=Math.min(minX,p[0]); minY=Math.min(minY,p[1]); maxX=Math.max(maxX,p[0]); maxY=Math.max(maxY,p[1]); });
    return [minX,minY,maxX,maxY];
  }
  function bboxHit(a,b){ return !!(a && b && a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]); }
  function rings(geom){
    if (!geom) return [];
    if (geom.type === 'Polygon') return geom.coordinates || [];
    if (geom.type === 'MultiPolygon') return (geom.coordinates || []).flat();
    return [];
  }
  function pointInRing(pt, ring){
    const x=pt[0], y=pt[1]; let inside=false;
    for (let i=0,j=ring.length-1; i<ring.length; j=i++) {
      const xi=ring[i][0], yi=ring[i][1], xj=ring[j][0], yj=ring[j][1];
      const hit = ((yi>y)!=(yj>y)) && (x < (xj-xi)*(y-yi)/((yj-yi)||1e-12)+xi);
      if (hit) inside = !inside;
    }
    return inside;
  }
  function pointInPoly(pt, geom){ return rings(geom).some(r => pointInRing(pt, r)); }
  function segs(geom){
    const out=[];
    rings(geom).forEach(r => { for (let i=1;i<r.length;i++) out.push([r[i-1], r[i]]); });
    return out;
  }
  function orient(a,b,c){ return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]); }
  function between(a,b,c){ return Math.min(a,b)-1e-10 <= c && c <= Math.max(a,b)+1e-10; }
  function segHit(a,b,c,d){
    const o1=orient(a,b,c), o2=orient(a,b,d), o3=orient(c,d,a), o4=orient(c,d,b);
    if (((o1>0&&o2<0)||(o1<0&&o2>0)) && ((o3>0&&o4<0)||(o3<0&&o4>0))) return true;
    if (Math.abs(o1)<1e-10 && between(a[0],b[0],c[0]) && between(a[1],b[1],c[1])) return true;
    if (Math.abs(o2)<1e-10 && between(a[0],b[0],d[0]) && between(a[1],b[1],d[1])) return true;
    if (Math.abs(o3)<1e-10 && between(c[0],d[0],a[0]) && between(c[1],d[1],a[1])) return true;
    if (Math.abs(o4)<1e-10 && between(c[0],d[0],b[0]) && between(c[1],d[1],b[1])) return true;
    return false;
  }
  function geomIntersects(a,b){
    if (!bboxHit(bboxOf(a), bboxOf(b))) return false;
    const ac = coordsOf(a), bc = coordsOf(b);
    if (ac.some(p => pointInPoly(p,b)) || bc.some(p => pointInPoly(p,a))) return true;
    const as=segs(a), bs=segs(b);
    for (const s1 of as) for (const s2 of bs) if (segHit(s1[0],s1[1],s2[0],s2[1])) return true;
    return false;
  }
  function wmuGeo(){ return (typeof osGetWMUGeoJSON === 'function') ? osGetWMUGeoJSON() : (window.BC_WMU_GEOJSON || window.bcWmuGeoJSON || null); }
  function normWMU(v){ return (typeof osNormalizeWMU === 'function') ? osNormalizeWMU(v) : String(v || '').trim().replace(/^0+/, ''); }
  function wmuFeature(id){
    const target = normWMU(id);
    const geo = wmuGeo();
    return (geo && geo.features || []).find(f => {
      const p=f.properties||{};
      return normWMU(p.wmu_id || p.WMUNIT_NUM || p.MU || p.mu || p.wmu || '') === target;
    }) || null;
  }
  function loadZones(){
    if (cache) return Promise.resolve(cache);
    if (loading) return loading;
    loading = fetch('./leh_zones.json').then(r => { if (!r.ok) throw new Error('leh_zones.json failed'); return r.json(); }).then(data => {
      const zones = data && data.zones ? data.zones : {};
      cache = Object.entries(zones).map(([id,z]) => ({
        type:'Feature', id,
        properties:{ id, mu:String(z.mu || ''), species:String(z.zt || ''), label:String(z.lb || id) },
        geometry:z.g,
        _bbox:bboxOf(z.g)
      })).filter(f => f.geometry && f.properties.species);
      return cache;
    }).catch(err => { console.warn('[GOS LEH V7.2]', err); loading=null; return []; });
    return loading;
  }
  function filteredZones(all){
    const sp = selectedSpecies(), wm = selectedWMU();
    if (!sp || !wm) return [];
    const wf = wmuFeature(wm);
    if (!wf || !wf.geometry) return [];
    const wb = bboxOf(wf.geometry);
    return (all || []).filter(f => speciesMatch(f.properties && f.properties.species, sp) && bboxHit(f._bbox || bboxOf(f.geometry), wb) && geomIntersects(f.geometry, wf.geometry));
  }
  function hideLegacy(){
    const mp = map(); if (!mp || !mp.getStyle) return;
    LEGACY_LAYERS.forEach(id => { try { if (mp.getLayer(id)) mp.setLayoutProperty(id, 'visibility', 'none'); } catch(e) {} });
    try { const s = mp.getSource(LEGACY_SRC); if (s) s.setData(emptyFC()); } catch(e) {}
  }
  function ensure(){
    const mp = map(); if (!mp || !mp.getStyle) return false;
    try {
      hideLegacy();
      if (!mp.getSource(SRC)) mp.addSource(SRC, { type:'geojson', data:emptyFC() });
      if (!mp.getLayer(FILL)) mp.addLayer({ id:FILL, type:'fill', source:SRC, layout:{ visibility:'none' }, paint:{ 'fill-color':'#b91c35', 'fill-opacity':0.30, 'fill-outline-color':'#7f0020' } });
      if (!mp.getLayer(LINE)) mp.addLayer({ id:LINE, type:'line', source:SRC, layout:{ visibility:'none' }, paint:{ 'line-color':'#7f0020', 'line-width':['interpolate',['linear'],['zoom'],4,2.2,8,3.4,11,5.2], 'line-opacity':1 } });
      if (!mp.getLayer(HOVER_FILL)) mp.addLayer({ id:HOVER_FILL, type:'fill', source:SRC, layout:{ visibility:'none' }, filter:['==',['get','id'],'__none__'], paint:{ 'fill-color':'#f43f5e', 'fill-opacity':0.46 } });
      if (!mp.getLayer(HOVER_LINE)) mp.addLayer({ id:HOVER_LINE, type:'line', source:SRC, layout:{ visibility:'none' }, filter:['==',['get','id'],'__none__'], paint:{ 'line-color':'#5f0018', 'line-width':['interpolate',['linear'],['zoom'],4,3.2,8,5.4,11,7.0], 'line-opacity':1 } });
      if (!mp._hsV72LehHover) {
        mp._hsV72LehHover = true;
        mp.on('mousemove', FILL, e => {
          const f=e.features && e.features[0], p=f && f.properties || {}, id=String(p.id || f.id || '');
          try { mp.setFilter(HOVER_FILL, ['==',['get','id'], id]); mp.setFilter(HOVER_LINE, ['==',['get','id'], id]); } catch(err) {}
          mp.getCanvas().style.cursor = 'pointer';
          if (!hoverPopup) hoverPopup = new mapboxgl.Popup({ closeButton:false, closeOnClick:false, offset:12, className:'os-leh-hover-label os-leh-hover-label-v72' });
          hoverPopup.setLngLat(e.lngLat).setHTML(`<div class="os-leh-hover"><b>${esc(p.label || p.id || 'LEH zone')}</b><span>${esc(p.species || '')}</span></div>`).addTo(mp);
        });
        mp.on('mouseleave', FILL, () => { mp.getCanvas().style.cursor=''; try { mp.setFilter(HOVER_FILL, ['==',['get','id'],'__none__']); mp.setFilter(HOVER_LINE, ['==',['get','id'],'__none__']); } catch(err) {} if (hoverPopup) hoverPopup.remove(); });
        mp.on('styledata', () => setTimeout(() => { if (window.osLEHZonesManualVisible) refresh(); else clear(); }, 220));
      }
      [FILL,LINE,HOVER_FILL,HOVER_LINE].forEach(id => { try { mp.moveLayer(id); } catch(e) {} });
      return true;
    } catch(err) { console.warn('[GOS LEH V7.2 ensure]', err); return false; }
  }
  function visible(on){
    const mp = map(); if (!mp) return;
    LAYERS.forEach(id => { try { if (mp.getLayer(id)) mp.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); } catch(e) {} });
    if (!on && hoverPopup) hoverPopup.remove();
  }
  function updateButton(){
    const page = document.getElementById('bcOpenSeasonsPage'); if (!page) return;
    // Remove legacy LEH notice cards. The dynamic one-line note was causing panel jitter/shaking
    // because older refresh hooks kept removing/reinserting it. The red button + synopsis button
    // are the stable controls now.
    page.querySelectorAll('.os-leh-note,.os-leh-note-v61,.os-leh-manual-note,.os-leh-mini-note').forEach(el => el.remove());
    const btn = document.getElementById('osPanelViewLEHBtn');
    if (btn) {
      const can = !!(selectedSpecies() && selectedWMU());
      btn.style.display = can ? '' : 'none';
      btn.classList.toggle('active', !!window.osLEHZonesManualVisible);
      btn.textContent = window.osLEHZonesManualVisible ? 'Hide LEH Zones' : 'View LEH Zones';
      btn.title = 'Show LEH zone polygons that intersect this WMU. Check the synopsis for unit-specific closed-area maps.';
    }
  }
  function clear(silent){
    window.osLEHZonesManualVisible = false;
    window.osShowLEHZones = false;
    lastCount = 0;
    const mp = map();
    hideLegacy();
    try { if (mp && ensure()) { const s=mp.getSource(SRC); if (s) s.setData(emptyFC()); } } catch(e) {}
    visible(false);
    if (!silent) updateButton();
    return Promise.resolve([]);
  }
  function refresh(){
    window.osShowLEHZones = false;
    if (!window.osLEHZonesManualVisible || !selectedSpecies() || !selectedWMU()) return clear();
    return loadZones().then(all => {
      if (!ensure()) return [];
      const feats = filteredZones(all);
      lastCount = feats.length;
      const mp = map();
      try { const s=mp && mp.getSource(SRC); if (s) s.setData({ type:'FeatureCollection', features:feats }); } catch(e) {}
      visible(feats.length > 0);
      updateButton();
      hideLegacy();
      return feats;
    });
  }
  function toggle(){
    window.osLEHZonesManualVisible = !window.osLEHZonesManualVisible;
    if (window.osLEHZonesManualVisible) return refresh();
    return clear();
  }
  function contextChanged(){ clear(); setTimeout(updateButton, 60); }

  window.osRefreshLEHZones = refresh;
  window.osToggleManualLEHZones = toggle;
  window.osToggleLEHZones = checked => { window.osLEHZonesManualVisible = !!checked; return window.osLEHZonesManualVisible ? refresh() : clear(); };

  const prevRender = window.osRenderPanel || (typeof osRenderPanel === 'function' ? osRenderPanel : null);
  if (prevRender && !prevRender._hsV72Wrapped) {
    const wrapped = function(){ const out = prevRender.apply(this, arguments); setTimeout(updateButton, 20); return out; };
    wrapped._hsV72Wrapped = true; window.osRenderPanel = wrapped; try { osRenderPanel = wrapped; } catch(e) {}
  }
  ['osSelectSpecies','osSelectRegion','osSelectWMU'].forEach(name => {
    const prev = window[name] || (typeof globalThis[name] === 'function' ? globalThis[name] : null);
    if (prev && !prev._hsV72Wrapped) {
      const wrapped = function(){ contextChanged(); const out = prev.apply(this, arguments); setTimeout(updateButton, 50); return out; };
      wrapped._hsV72Wrapped = true; window[name] = wrapped; try { globalThis[name] = wrapped; } catch(e) {}
    }
  });
  const prevMapStates = window.osRefreshMapStates || (typeof osRefreshMapStates === 'function' ? osRefreshMapStates : null);
  if (prevMapStates && !prevMapStates._hsV72Wrapped) {
    const wrapped = function(){ const out = prevMapStates.apply(this, arguments); setTimeout(() => { if (window.osLEHZonesManualVisible) refresh(); else clear(); }, 70); return out; };
    wrapped._hsV72Wrapped = true; window.osRefreshMapStates = wrapped; try { osRefreshMapStates = wrapped; } catch(e) {}
  }

  // Aggressive quarantine for the first few seconds and after style changes, because older builds may still schedule stale LEH refreshes.
  let ticks = 0;
  const timer = setInterval(() => {
    ticks++;
    if (!window.osLEHZonesManualVisible) clear(true);
    if (ticks > 12) clearInterval(timer);
  }, 350);
  setTimeout(() => clear(true), 250);
  setTimeout(() => clear(true), 1250);
})();

// ══════════════════════════════════════════════════════════════
// GOS V7.4 — final LEH hover/paint fix
// Purpose: one clean LEH renderer only. No flickering cursor-follow popups.
// Hover behaves like the Map tab: stable label + stronger maroon border/red fill.
// ══════════════════════════════════════════════════════════════
(function(){
  if (window.__HS_GOS_V74_LEH_HOVER_FIX__) return;
  window.__HS_GOS_V74_LEH_HOVER_FIX__ = true;

  const OLD_SOURCES = ['os-leh-zones-src', 'hs-os-leh-clean-src'];
  const OLD_LAYERS = [
    'os-leh-zones-fill','os-leh-zones-line','os-leh-zones-label','os-leh-zones-hover-fill','os-leh-zones-hover-line',
    'hs-os-leh-clean-fill','hs-os-leh-clean-line','hs-os-leh-clean-hover-fill','hs-os-leh-clean-hover-line'
  ];
  const SRC = 'hs-os-leh-v74-src';
  const FILL = 'hs-os-leh-v74-fill';
  const LINE = 'hs-os-leh-v74-line';
  const HOVER_FILL = 'hs-os-leh-v74-hover-fill';
  const HOVER_LINE = 'hs-os-leh-v74-hover-line';
  const V74_LAYERS = [FILL, LINE, HOVER_FILL, HOVER_LINE];
  let cache = null;
  let loading = null;
  let hoverId = null;
  let hoverPopup = null;
  let currentData = { type:'FeatureCollection', features:[] };

  function mp(){ return (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance || null; }
  function emptyFC(){ return { type:'FeatureCollection', features:[] }; }
  function esc(v){
    if (typeof osEscape === 'function') return osEscape(v);
    return String(v == null ? '' : v).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }
  function norm(v){ return String(v || '').toLowerCase().replace(/\([^)]*\)/g,' ').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' '); }
  function compact(v){ return norm(v).replace(/\s+/g,''); }
  function species(){ return String((typeof osSelSpecies !== 'undefined' && osSelSpecies) || window.osSelSpecies || '').trim(); }
  function wmu(){ return String((typeof osSelectedWMU !== 'undefined' && osSelectedWMU) || window.osSelectedWMU || '').trim(); }
  function speciesMatch(a,b){
    const aa = norm(a), bb = norm(b), ac = compact(a), bc = compact(b);
    if (!aa || !bb) return false;
    if (aa === bb || ac === bc) return true;
    if (aa === 'mountain goat' && bb.includes('mountain goat')) return true;
    if (aa === 'mule deer' && (bb.includes('mule deer') || bb.includes('black tailed'))) return true;
    if (aa === 'white tailed deer' && (bb.includes('white tailed') || bb.includes('white tail') || bb.includes('whitetail'))) return true;
    if (aa === 'mountain sheep' && bb.includes('sheep')) return true;
    return false;
  }
  function coordsOf(g){
    const out=[];
    (function walk(x){
      if (!x) return;
      if (typeof x[0] === 'number' && typeof x[1] === 'number') out.push(x);
      else if (Array.isArray(x)) x.forEach(walk);
    })(g && g.coordinates);
    return out;
  }
  function bboxOf(g){
    const c=coordsOf(g);
    if (!c.length) return null;
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    c.forEach(p => { minX=Math.min(minX,p[0]); minY=Math.min(minY,p[1]); maxX=Math.max(maxX,p[0]); maxY=Math.max(maxY,p[1]); });
    return [minX,minY,maxX,maxY];
  }
  function centerOf(g){
    const b=bboxOf(g);
    return b ? [(b[0]+b[2])/2, (b[1]+b[3])/2] : null;
  }
  function bboxHit(a,b){ return !!(a && b && a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]); }
  function ringsOf(g){
    if (!g) return [];
    if (g.type === 'Polygon') return g.coordinates || [];
    if (g.type === 'MultiPolygon') return (g.coordinates || []).flat();
    return [];
  }
  function pointInRing(pt, ring){
    let inside=false, x=pt[0], y=pt[1];
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const xi=ring[i][0], yi=ring[i][1], xj=ring[j][0], yj=ring[j][1];
      const hit=((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/((yj-yi)||1e-12)+xi);
      if(hit) inside=!inside;
    }
    return inside;
  }
  function pointInGeom(pt,g){ return ringsOf(g).some(r => r && r.length > 2 && pointInRing(pt,r)); }
  function segments(g){
    const out=[];
    ringsOf(g).forEach(r => { if (!r) return; for(let i=1;i<r.length;i++) out.push([r[i-1], r[i]]); });
    return out;
  }
  function orient(a,b,c){ return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0]); }
  function between(a,b,c){ return Math.min(a,b)-1e-10 <= c && c <= Math.max(a,b)+1e-10; }
  function segHit(a,b,c,d){
    const o1=orient(a,b,c), o2=orient(a,b,d), o3=orient(c,d,a), o4=orient(c,d,b);
    if (((o1>0&&o2<0)||(o1<0&&o2>0)) && ((o3>0&&o4<0)||(o3<0&&o4>0))) return true;
    if (Math.abs(o1)<1e-10 && between(a[0],b[0],c[0]) && between(a[1],b[1],c[1])) return true;
    if (Math.abs(o2)<1e-10 && between(a[0],b[0],d[0]) && between(a[1],b[1],d[1])) return true;
    if (Math.abs(o3)<1e-10 && between(c[0],d[0],a[0]) && between(c[1],d[1],a[1])) return true;
    if (Math.abs(o4)<1e-10 && between(c[0],d[0],b[0]) && between(c[1],d[1],b[1])) return true;
    return false;
  }
  function geomIntersects(a,b){
    if (!bboxHit(bboxOf(a), bboxOf(b))) return false;
    const ac=coordsOf(a), bc=coordsOf(b);
    if (ac.some(p => pointInGeom(p,b)) || bc.some(p => pointInGeom(p,a))) return true;
    const as=segments(a), bs=segments(b);
    for (const s1 of as) for (const s2 of bs) if (segHit(s1[0],s1[1],s2[0],s2[1])) return true;
    return false;
  }
  function wmuGeo(){ return (typeof osGetWMUGeoJSON === 'function') ? osGetWMUGeoJSON() : (window.BC_WMU_GEOJSON || window.bcWmuGeoJSON || null); }
  function normWMU(v){ return (typeof osNormalizeWMU === 'function') ? osNormalizeWMU(v) : String(v || '').trim().replace(/^0+/, ''); }
  function wmuFeature(id){
    const target = normWMU(id);
    const geo = wmuGeo();
    return (geo && geo.features || []).find(f => {
      const p=f.properties||{};
      return normWMU(p.wmu_id || p.WMUNIT_NUM || p.MU || p.mu || p.wmu || '') === target;
    }) || null;
  }
  function layerOpacity(){
    let n = 1;
    try { if (typeof osOverlayVisibility === 'number') n = osOverlayVisibility; } catch(e) {}
    const range = document.getElementById('osOpacityRange');
    if (range && range.value !== '') n = Number(range.value);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
  }
  function clearOldPopups(){
    document.querySelectorAll('.mapboxgl-popup.os-leh-hover-label, .mapboxgl-popup.os-leh-popup').forEach(el => el.remove());
  }
  function hideOldLayers(){
    const m=mp(); if (!m || !m.getStyle) return;
    OLD_LAYERS.forEach(id => { try { if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', 'none'); } catch(e) {} });
    OLD_SOURCES.forEach(id => { try { const s=m.getSource(id); if (s) s.setData(emptyFC()); } catch(e) {} });
    clearOldPopups();
  }
  function loadZones(){
    if (cache) return Promise.resolve(cache);
    if (loading) return loading;
    loading = fetch('./leh_zones.json').then(r => { if (!r.ok) throw new Error('leh_zones.json failed'); return r.json(); }).then(data => {
      const zones = data && data.zones ? data.zones : {};
      cache = Object.entries(zones).map(([id,z]) => ({
        type:'Feature', id,
        properties:{ id, mu:String(z.mu || ''), species:String(z.zt || ''), label:String(z.lb || id) },
        geometry:z.g,
        _bbox:bboxOf(z.g)
      })).filter(f => f.geometry && f.properties.species);
      return cache;
    }).catch(err => { console.warn('[GOS LEH V7.4]', err); loading=null; return []; });
    return loading;
  }
  function filtered(all){
    const sp=species(), wm=wmu();
    if (!sp || !wm) return [];
    const wf=wmuFeature(wm);
    if (!wf || !wf.geometry) return [];
    const wb=bboxOf(wf.geometry);
    return (all || []).filter(f => speciesMatch(f.properties && f.properties.species, sp) && bboxHit(f._bbox || bboxOf(f.geometry), wb) && geomIntersects(f.geometry, wf.geometry));
  }
  function addLayers(){
    const m=mp(); if (!m || !m.getStyle) return false;
    try {
      hideOldLayers();
      if (!m.getSource(SRC)) m.addSource(SRC, { type:'geojson', data:currentData });
      const o = layerOpacity();
      if (!m.getLayer(FILL)) m.addLayer({ id:FILL, type:'fill', source:SRC, layout:{ visibility:'none' }, paint:{ 'fill-color':'#b91c35', 'fill-opacity':0.26 * o, 'fill-outline-color':'#7f0020' } });
      if (!m.getLayer(LINE)) m.addLayer({ id:LINE, type:'line', source:SRC, layout:{ visibility:'none' }, paint:{ 'line-color':'#7f0020', 'line-width':['interpolate',['linear'],['zoom'],4,2.0,8,3.1,11,4.8], 'line-opacity':0.98 * o } });
      if (!m.getLayer(HOVER_FILL)) m.addLayer({ id:HOVER_FILL, type:'fill', source:SRC, layout:{ visibility:'none' }, filter:['==',['get','id'],'__none__'], paint:{ 'fill-color':'#ef4444', 'fill-opacity':0.48 * o } });
      if (!m.getLayer(HOVER_LINE)) m.addLayer({ id:HOVER_LINE, type:'line', source:SRC, layout:{ visibility:'none' }, filter:['==',['get','id'],'__none__'], paint:{ 'line-color':'#5f0018', 'line-width':['interpolate',['linear'],['zoom'],4,3.4,8,5.6,11,7.2], 'line-opacity': o > 0 ? 1 : 0 } });
      if (!m._hsV74LehHoverBound) {
        m._hsV74LehHoverBound = true;
        m.on('mousemove', FILL, e => {
          const f = e.features && e.features[0];
          if (!f) return;
          const p = f.properties || {};
          const id = String(p.id || f.id || '');
          if (!id) return;
          m.getCanvas().style.cursor = 'pointer';
          if (hoverId !== id) {
            hoverId = id;
            try { m.setFilter(HOVER_FILL, ['==',['get','id'], id]); m.setFilter(HOVER_LINE, ['==',['get','id'], id]); } catch(err) {}
            clearOldPopups();
            if (hoverPopup) hoverPopup.remove();
            const ll = centerOf(f.geometry) || (e.lngLat && [e.lngLat.lng, e.lngLat.lat]);
            if (ll) {
              hoverPopup = new mapboxgl.Popup({ closeButton:false, closeOnClick:false, offset:12, className:'os-leh-fixed-label-v74' })
                .setLngLat(ll)
                .setHTML(`<div class="os-leh-hover-v74"><b>${esc(p.label || p.id || 'LEH zone')}</b><span>${esc(p.species || '')}</span></div>`)
                .addTo(m);
            }
          }
        });
        m.on('mouseleave', FILL, () => {
          m.getCanvas().style.cursor = '';
          hoverId = null;
          try { m.setFilter(HOVER_FILL, ['==',['get','id'],'__none__']); m.setFilter(HOVER_LINE, ['==',['get','id'],'__none__']); } catch(err) {}
          if (hoverPopup) { hoverPopup.remove(); hoverPopup = null; }
        });
        m.on('styledata', () => setTimeout(() => { if (window.osLEHZonesManualVisible) refresh(); else clear(true); }, 220));
      }
      V74_LAYERS.forEach(id => { try { m.moveLayer(id); } catch(e) {} });
      return true;
    } catch(err) { console.warn('[GOS LEH V7.4 layers]', err); return false; }
  }
  function setVisible(on){
    const m=mp(); if (!m) return;
    V74_LAYERS.forEach(id => { try { if (m.getLayer(id)) m.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'); } catch(e) {} });
    if (!on) {
      hoverId = null;
      try { if (m.getLayer(HOVER_FILL)) m.setFilter(HOVER_FILL, ['==',['get','id'],'__none__']); } catch(e) {}
      try { if (m.getLayer(HOVER_LINE)) m.setFilter(HOVER_LINE, ['==',['get','id'],'__none__']); } catch(e) {}
      if (hoverPopup) { hoverPopup.remove(); hoverPopup = null; }
    }
  }
  function applyOpacity(){
    const m=mp(); if (!m || !m.getLayer) return;
    const o = layerOpacity();
    try { if (m.getLayer(FILL)) m.setPaintProperty(FILL, 'fill-opacity', 0.26 * o); } catch(e) {}
    try { if (m.getLayer(LINE)) m.setPaintProperty(LINE, 'line-opacity', 0.98 * o); } catch(e) {}
    try { if (m.getLayer(HOVER_FILL)) m.setPaintProperty(HOVER_FILL, 'fill-opacity', 0.48 * o); } catch(e) {}
    try { if (m.getLayer(HOVER_LINE)) m.setPaintProperty(HOVER_LINE, 'line-opacity', o > 0 ? 1 : 0); } catch(e) {}
  }
  function updateButton(){
    const page = document.getElementById('bcOpenSeasonsPage'); if (!page) return;
    page.querySelectorAll('.os-leh-note,.os-leh-note-v61,.os-leh-manual-note,.os-leh-mini-note').forEach(el => el.remove());
    const btn = document.getElementById('osPanelViewLEHBtn');
    if (btn) {
      const can = !!(species() && wmu());
      btn.style.display = can ? '' : 'none';
      btn.classList.toggle('active', !!window.osLEHZonesManualVisible);
      btn.textContent = window.osLEHZonesManualVisible ? 'Hide LEH Zones' : 'View LEH Zones';
      btn.title = 'Show LEH zones that overlap this selected WMU.';
    }
  }
  function clear(silent){
    window.osLEHZonesManualVisible = false;
    window.osShowLEHZones = false;
    currentData = emptyFC();
    const m=mp();
    hideOldLayers();
    try { if (m && addLayers()) { const s=m.getSource(SRC); if (s) s.setData(currentData); } } catch(e) {}
    setVisible(false);
    if (!silent) updateButton();
    return Promise.resolve([]);
  }
  function refresh(){
    window.osShowLEHZones = false;
    hideOldLayers();
    if (!window.osLEHZonesManualVisible || !species() || !wmu()) return clear();
    return loadZones().then(all => {
      if (!addLayers()) return [];
      const feats = filtered(all);
      currentData = { type:'FeatureCollection', features:feats };
      const m=mp();
      try { const s=m && m.getSource(SRC); if (s) s.setData(currentData); } catch(e) {}
      applyOpacity();
      setVisible(feats.length > 0);
      updateButton();
      hideOldLayers();
      return feats;
    });
  }
  function toggle(){
    window.osLEHZonesManualVisible = !window.osLEHZonesManualVisible;
    return window.osLEHZonesManualVisible ? refresh() : clear();
  }
  function contextChanged(){ clear(true); setTimeout(updateButton, 60); }

  window.osRefreshLEHZones = refresh;
  window.osToggleManualLEHZones = toggle;
  window.osToggleLEHZones = checked => { window.osLEHZonesManualVisible = !!checked; return window.osLEHZonesManualVisible ? refresh() : clear(); };

  const prevOverlay = window.osSetOverlayOpacity || (typeof osSetOverlayOpacity === 'function' ? osSetOverlayOpacity : null);
  if (prevOverlay && !prevOverlay._hsV74Wrapped) {
    const wrapped = function(v){ const out = prevOverlay.apply(this, arguments); setTimeout(() => { applyOpacity(); if (window.osLEHZonesManualVisible) refresh(); }, 0); return out; };
    wrapped._hsV74Wrapped = true;
    window.osSetOverlayOpacity = wrapped; try { osSetOverlayOpacity = wrapped; } catch(e) {}
  }

  const prevRender = window.osRenderPanel || (typeof osRenderPanel === 'function' ? osRenderPanel : null);
  if (prevRender && !prevRender._hsV74Wrapped) {
    const wrapped = function(){ const out = prevRender.apply(this, arguments); setTimeout(updateButton, 20); return out; };
    wrapped._hsV74Wrapped = true; window.osRenderPanel = wrapped; try { osRenderPanel = wrapped; } catch(e) {}
  }
  ['osSelectSpecies','osSelectRegion','osSelectWMU'].forEach(name => {
    const prev = window[name] || (typeof globalThis[name] === 'function' ? globalThis[name] : null);
    if (prev && !prev._hsV74Wrapped) {
      const wrapped = function(){ contextChanged(); const out = prev.apply(this, arguments); setTimeout(updateButton, 80); return out; };
      wrapped._hsV74Wrapped = true; window[name] = wrapped; try { globalThis[name] = wrapped; } catch(e) {}
    }
  });
  const prevMapStates = window.osRefreshMapStates || (typeof osRefreshMapStates === 'function' ? osRefreshMapStates : null);
  if (prevMapStates && !prevMapStates._hsV74Wrapped) {
    const wrapped = function(){ const out = prevMapStates.apply(this, arguments); setTimeout(() => { if (window.osLEHZonesManualVisible) refresh(); else clear(true); }, 120); return out; };
    wrapped._hsV74Wrapped = true; window.osRefreshMapStates = wrapped; try { osRefreshMapStates = wrapped; } catch(e) {}
  }

  // Initial cleanup; prevents old delayed hover/popups from earlier patches.
  setTimeout(() => clear(true), 180);
  setTimeout(() => clear(true), 900);
})();

// ══════════════════════════════════════════════════════════════
// GOS V7.5 — clean Layers panel
// Purpose: remove sloppy checkbox UI, remove Show WMUs, replace wildfire years
// with a simple range slider, and use one Layer Opacity slider.
// ══════════════════════════════════════════════════════════════
(function(){
  if (window.__HS_GOS_V75_CLEAN_LAYERS__) return;
  window.__HS_GOS_V75_CLEAN_LAYERS__ = true;

  const MIN_YEAR = 2013;
  const MAX_YEAR = 2023;

  function qs(id){ return document.getElementById(id); }

  function currentLayerOpacity(){
    const r = qs('osOpacityRange');
    const n = r ? Number(r.value) : Number(typeof osOverlayVisibility !== 'undefined' ? osOverlayVisibility : 1);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
  }

  function setWildfirePaintOpacity(v){
    const m = (typeof osMapInstance !== 'undefined' && osMapInstance) || window.osMapInstance;
    const n = Math.max(0, Math.min(1, Number(v) || 0));
    try { _osWildfireOpacity = 0.38 * n; } catch(e) {}
    try { const lab = qs('osWildfireOpacityValue'); if (lab) lab.textContent = Math.round(n * 100) + '%'; } catch(e) {}
    try { if (m && m.getLayer(OS_WILDFIRE_FILL)) m.setPaintProperty(OS_WILDFIRE_FILL, 'fill-opacity', 0.38 * n); } catch(e) {}
    try { if (m && m.getLayer(OS_WILDFIRE_LINE)) m.setPaintProperty(OS_WILDFIRE_LINE, 'line-opacity', 0.85 * n); } catch(e) {}
  }

  window.osSetLayerOpacityClean = function(val){
    const n = Math.max(0, Math.min(1, Number(val == null ? 1 : val)));
    const r = qs('osOpacityRange'); if (r) r.value = String(n);
    const lab = qs('osOpacityValue'); if (lab) lab.textContent = Math.round(n * 100) + '%';
    try { if (typeof osSetOverlayOpacity === 'function') osSetOverlayOpacity(n); } catch(e) {}
    setWildfirePaintOpacity(n);
    try { if (window.osLEHZonesManualVisible && typeof window.osRefreshLEHZones === 'function') window.osRefreshLEHZones(); } catch(e) {}
  };

  function yearsInRange(){
    const startEl = qs('osWildfireStartRange');
    const endEl = qs('osWildfireEndRange');
    let a = startEl ? Number(startEl.value) : MIN_YEAR;
    let b = endEl ? Number(endEl.value) : MAX_YEAR;
    if (!Number.isFinite(a)) a = MIN_YEAR;
    if (!Number.isFinite(b)) b = MAX_YEAR;
    a = Math.max(MIN_YEAR, Math.min(MAX_YEAR, Math.round(a)));
    b = Math.max(MIN_YEAR, Math.min(MAX_YEAR, Math.round(b)));
    if (a > b) { const t = a; a = b; b = t; }
    return [a,b];
  }

  window.osUpdateWildfireYearRange = function(){
    const [a,b] = yearsInRange();
    const startEl = qs('osWildfireStartRange'); if (startEl) startEl.value = String(a);
    const endEl = qs('osWildfireEndRange'); if (endEl) endEl.value = String(b);
    const lab = qs('osWildfireRangeLabel'); if (lab) lab.textContent = a === b ? String(a) : `${a}–${b}`;
    try {
      _osWildfireYears.clear();
      for (let y = a; y <= b; y++) _osWildfireYears.add(String(y));
      if (typeof osApplyWildfireFilter === 'function') osApplyWildfireFilter();
    } catch(e) {}
  };

  window.osToggleWildfireClean = function(){
    const next = !(typeof _osWildfireVisible !== 'undefined' && _osWildfireVisible);
    window.osUpdateWildfireYearRange();
    try { osToggleWildfireLayer(next); } catch(e) {}
    setTimeout(syncCleanLayersUI, 40);
  };

  function buildCleanLayersPanel(){
    const panel = qs('osLayersPanel');
    if (!panel) return;
    panel.dataset.v68Enhanced = '1';
    panel.classList.add('os-clean-layers-panel');
    // Preserve open/visible state while rebuilding.
    const wasOpen = panel.classList.contains('visible') || panel.classList.contains('open');
    panel.innerHTML = `
      <div class="os-filter-popover-head">
        <strong>Layers</strong>
        <button type="button" onclick="osCloseDockPanels()">✕</button>
      </div>
      <div class="os-clean-layers" data-clean-layers="1">
        <button type="button" id="osWildfireCleanBtn" class="os-layer-toggle-btn" onclick="osToggleWildfireClean()">Historical Wildfires</button>
        <div id="osWildfireRangeWrap" class="os-year-range-wrap">
          <div class="os-layer-row-head"><span>Wildfire year range</span><b id="osWildfireRangeLabel">${MIN_YEAR}–${MAX_YEAR}</b></div>
          <div class="os-dual-range">
            <input id="osWildfireStartRange" type="range" min="${MIN_YEAR}" max="${MAX_YEAR}" step="1" value="${MIN_YEAR}" oninput="osUpdateWildfireYearRange()" aria-label="Wildfire start year">
            <input id="osWildfireEndRange" type="range" min="${MIN_YEAR}" max="${MAX_YEAR}" step="1" value="${MAX_YEAR}" oninput="osUpdateWildfireYearRange()" aria-label="Wildfire end year">
          </div>
          <div class="os-range-years"><span>${MIN_YEAR}</span><span>${MAX_YEAR}</span></div>
        </div>
        <label class="os-layer-opacity os-clean-opacity"><span>Layer Opacity</span><input id="osOpacityRange" type="range" min="0" max="1" step="0.05" value="${currentLayerOpacity()}" oninput="osSetLayerOpacityClean(this.value)"><b id="osOpacityValue">${Math.round(currentLayerOpacity()*100)}%</b></label>
      </div>`;
    if (wasOpen) panel.classList.add('visible','open');
    window.osUpdateWildfireYearRange();
    syncCleanLayersUI();
  }

  function syncCleanLayersUI(){
    const btn = qs('osWildfireCleanBtn');
    const on = !!(typeof _osWildfireVisible !== 'undefined' && _osWildfireVisible);
    if (btn) {
      btn.classList.toggle('active', on);
      btn.textContent = on ? 'Hide Historical Wildfires' : 'Historical Wildfires';
    }
    const op = currentLayerOpacity();
    const lab = qs('osOpacityValue'); if (lab) lab.textContent = Math.round(op * 100) + '%';
  }

  window.osBuildCleanLayersPanel = buildCleanLayersPanel;

  // Override the Layers button so it always opens the clean panel.
  window.osToggleLayersPanel = function(){
    buildCleanLayersPanel();
    try { osTogglePanelById('osLayersPanel', 'Layers'); } catch(e) {
      const panel = qs('osLayersPanel');
      if (panel) panel.classList.toggle('visible');
    }
    syncCleanLayersUI();
  };

  const prevWildfire = window.osToggleWildfireLayer || (typeof osToggleWildfireLayer === 'function' ? osToggleWildfireLayer : null);
  if (prevWildfire && !prevWildfire._hsV75Wrapped) {
    const wrapped = function(){ const out = prevWildfire.apply(this, arguments); setTimeout(syncCleanLayersUI, 40); return out; };
    wrapped._hsV75Wrapped = true;
    window.osToggleWildfireLayer = wrapped;
    try { osToggleWildfireLayer = wrapped; } catch(e) {}
  }

  const prevRender = window.osRenderPanel || (typeof osRenderPanel === 'function' ? osRenderPanel : null);
  if (prevRender && !prevRender._hsV75LayersWrapped) {
    const wrapped = function(){ const out = prevRender.apply(this, arguments); setTimeout(() => { if (qs('osLayersPanel')?.classList.contains('visible')) buildCleanLayersPanel(); }, 0); return out; };
    wrapped._hsV75LayersWrapped = true;
    window.osRenderPanel = wrapped;
    try { osRenderPanel = wrapped; } catch(e) {}
  }

  document.addEventListener('DOMContentLoaded', () => setTimeout(buildCleanLayersPanel, 120));
  setTimeout(buildCleanLayersPanel, 600);
})();

// ══════════════════════════════════════════════════════════════
// GOS V7.8 — remove snow layer, clean layers top-right, wildfire non-clickable + separate opacity
(function(){
  const qs = id => document.getElementById(id);
  const clamp01 = v => Math.max(0, Math.min(1, Number(v) || 0));
  function map(){ return (typeof osMapInstance !== 'undefined' && osMapInstance) ? osMapInstance : null; }

  function removeSnowCompletely(){
    window.osSnowVisible = false;
    const m = map();
    if (!m || !m.getStyle) return;
    try {
      const style = m.getStyle() || {};
      (style.layers || []).map(l => l.id).filter(id => /^os-snow-|^os-snow-v76-/.test(String(id))).forEach(id => {
        try { if (m.getLayer(id)) m.removeLayer(id); } catch(e) {}
      });
      Object.keys(style.sources || {}).filter(id => /^os-snow-|^os-snow-v76-/.test(String(id))).forEach(id => {
        try { if (m.getSource(id)) m.removeSource(id); } catch(e) {}
      });
    } catch(e) {}
  }
  window.osHideSnowLayer = removeSnowCompletely;
  window.osToggleSnowLayer = function(){ removeSnowCompletely(); };
  window.osSetSnowType = function(){};
  window.osSetSnowDateIndex = function(){};

  function wildfireVisible(){
    try { return !!_osWildfireVisible; } catch(e) { return false; }
  }
  window.osSetWildfireOpacity = function(val){
    const n = clamp01(val);
    try { _osWildfireOpacity = n * 0.60; } catch(e) {}
    const lab = qs('osWildfireOpacityValue'); if (lab) lab.textContent = Math.round(n * 100) + '%';
    const range = qs('osWildfireOpacityRange'); if (range) range.value = String(n);
    const m = map();
    if (m) {
      try { if (m.getLayer(OS_WILDFIRE_FILL)) m.setPaintProperty(OS_WILDFIRE_FILL, 'fill-opacity', n * 0.60); } catch(e) {}
      try { if (m.getLayer(OS_WILDFIRE_LINE)) m.setPaintProperty(OS_WILDFIRE_LINE, 'line-opacity', n * 0.95); } catch(e) {}
    }
  };
  try { osSetWildfireOpacity = window.osSetWildfireOpacity; } catch(e) {}

  window.osLoadWildfireLayer = async function(){
    if (typeof _osWildfireLoaded !== 'undefined' && _osWildfireLoaded && map()) return;
    const m = map();
    if (!m) return;
    const res = await fetch('./historical_wildfires_simplified_50m.geojson', { cache:'force-cache' });
    if (!res.ok) throw new Error('Wildfire GeoJSON failed to load');
    const data = await res.json();
    if (!m.getSource(OS_WILDFIRE_SRC)) m.addSource(OS_WILDFIRE_SRC, { type:'geojson', data });
    const before = m.getLayer(OS_REGION_HIT) ? OS_REGION_HIT : undefined;
    if (!m.getLayer(OS_WILDFIRE_FILL)) {
      m.addLayer({ id:OS_WILDFIRE_FILL, type:'fill', source:OS_WILDFIRE_SRC,
        paint:{ 'fill-color':'#e45a2a', 'fill-opacity': (typeof _osWildfireOpacity !== 'undefined' ? _osWildfireOpacity : 0.30) }
      }, before);
    }
    if (!m.getLayer(OS_WILDFIRE_LINE)) {
      m.addLayer({ id:OS_WILDFIRE_LINE, type:'line', source:OS_WILDFIRE_SRC,
        paint:{ 'line-color':'#ffb36a', 'line-width':1.15, 'line-opacity':0.75 }
      }, before);
    }
    // Important: no click handlers. Wildfire layer is visual context only.
    _osWildfireLoaded = true;
  };
  try { osLoadWildfireLayer = window.osLoadWildfireLayer; } catch(e) {}

  window.osToggleWildfireClean = function(){
    const next = !wildfireVisible();
    try { _osWildfireVisible = next; } catch(e) {}
    if (!next) {
      try { osSetWildfireVisibility(false); } catch(e) {}
      syncV78LayersUI();
      return;
    }
    try { osUpdateWildfireYearRange(); } catch(e) {}
    window.osLoadWildfireLayer().then(() => {
      try { osSetWildfireVisibility(true); } catch(e) {}
      try { osApplyWildfireFilter(); } catch(e) {}
      window.osSetWildfireOpacity(qs('osWildfireOpacityRange')?.value || 0.5);
      syncV78LayersUI();
    }).catch(console.warn);
  };
  try { osToggleWildfireClean = window.osToggleWildfireClean; } catch(e) {}

  function getLayerOpacity(){
    const r = qs('osOpacityRange');
    if (r) return clamp01(r.value);
    return 1;
  }
  const oldLayerOpacity = window.osSetLayerOpacityClean;
  window.osSetLayerOpacityClean = function(val){
    const n = clamp01(val);
    const lab = qs('osOpacityValue'); if (lab) lab.textContent = Math.round(n * 100) + '%';
    const range = qs('osOpacityRange'); if (range) range.value = String(n);
    const out = (typeof oldLayerOpacity === 'function') ? oldLayerOpacity(n) : undefined;
    removeSnowCompletely();
    return out;
  };
  try { osSetLayerOpacityClean = window.osSetLayerOpacityClean; } catch(e) {}

  function updateWildfireYearLabelsV78(){
    const startEl = qs('osWildfireStartRange'), endEl = qs('osWildfireEndRange');
    if (!startEl || !endEl) return;
    let a = Math.min(Number(startEl.value), Number(endEl.value));
    let b = Math.max(Number(startEl.value), Number(endEl.value));
    startEl.value = String(a); endEl.value = String(b);
    const range = qs('osWildfireRangeLabel'); if (range) range.textContent = a === b ? String(a) : `${a}–${b}`;
    const sv = qs('osWildfireStartValue'); if (sv) sv.textContent = String(a);
    const ev = qs('osWildfireEndValue'); if (ev) ev.textContent = String(b);
    try {
      _osWildfireYears.clear();
      for (let y = a; y <= b; y++) _osWildfireYears.add(String(y));
      if (typeof osApplyWildfireFilter === 'function') osApplyWildfireFilter();
    } catch(e) {}
  }
  window.osUpdateWildfireYearRange = updateWildfireYearLabelsV78;
  try { osUpdateWildfireYearRange = window.osUpdateWildfireYearRange; } catch(e) {}

  function syncV78LayersUI(){
    const wf = qs('osWildfireCleanBtn');
    if (wf) { wf.classList.toggle('active', wildfireVisible()); wf.textContent = wildfireVisible() ? 'Hide Historical Wildfires' : 'Historical Wildfires'; }
    const panel = qs('osLayersPanel');
    if (panel) panel.querySelectorAll('[id^="osSnow"], .os-snow-controls, .os-v77-snow-controls').forEach(el => el.remove());
  }
  window.osSyncLayersPanelV78 = syncV78LayersUI;

  function buildLayersPanelV78(){
    removeSnowCompletely();
    const panel = qs('osLayersPanel');
    if (!panel) return;
    const wasOpen = panel.classList.contains('visible') || panel.classList.contains('open');
    panel.className = panel.className.replace(/\bos-snow-layers-panel\b|\bos-clean-layers-panel\b|\bos-v77-layers-panel\b/g, '').trim();
    panel.classList.add('os-dock-popover','os-layers-popover','os-v78-layers-panel');
    const layerOpacity = getLayerOpacity();
    panel.innerHTML = `
      <div class="os-filter-popover-head os-v77-layer-head">
        <strong>Layers</strong>
        <button type="button" class="os-layer-x" onclick="osCloseDockPanels()" aria-label="Close layers">×</button>
      </div>
      <div class="os-v77-layers os-v78-layers">
        <section class="os-v77-card os-v77-opacity-card">
          <div class="os-v77-row-head"><span>Layer Opacity</span><b id="osOpacityValue">${Math.round(layerOpacity*100)}%</b></div>
          <input id="osOpacityRange" class="os-v77-range" type="range" min="0" max="1" step="0.05" value="${layerOpacity}" oninput="osSetLayerOpacityClean(this.value)" aria-label="Layer opacity">
        </section>

        <section class="os-v77-card os-v78-context-card">
          <button type="button" id="osWildfireCleanBtn" class="os-v77-toggle" onclick="osToggleWildfireClean()">Historical Wildfires</button>
          <div class="os-v77-subblock">
            <div class="os-v77-row-head"><span>Wildfire Opacity</span><b id="osWildfireOpacityValue">${Math.round(((typeof _osWildfireOpacity !== 'undefined' ? _osWildfireOpacity : 0.30) / 0.60) * 100)}%</b></div>
            <input id="osWildfireOpacityRange" class="os-v77-range" type="range" min="0" max="1" step="0.05" value="${Math.max(0, Math.min(1, (typeof _osWildfireOpacity !== 'undefined' ? _osWildfireOpacity : 0.30) / 0.60))}" oninput="osSetWildfireOpacity(this.value)" aria-label="Wildfire opacity">
          </div>
          <div class="os-v77-subblock">
            <div class="os-v77-row-head"><span>Wildfire Years</span><b id="osWildfireRangeLabel">2013–2023</b></div>
            <label class="os-v77-mini-range"><span>Start <b id="osWildfireStartValue">2013</b></span><input id="osWildfireStartRange" class="os-v77-range" type="range" min="2013" max="2023" step="1" value="2013" oninput="osUpdateWildfireYearRange()"></label>
            <label class="os-v77-mini-range"><span>End <b id="osWildfireEndValue">2023</b></span><input id="osWildfireEndRange" class="os-v77-range" type="range" min="2013" max="2023" step="1" value="2023" oninput="osUpdateWildfireYearRange()"></label>
          </div>
        </section>
      </div>`;
    if (wasOpen) panel.classList.add('visible','open');
    updateWildfireYearLabelsV78();
    syncV78LayersUI();
  }

  window.osBuildCleanLayersPanel = buildLayersPanelV78;
  window.osToggleLayersPanel = function(){
    buildLayersPanelV78();
    try { osTogglePanelById('osLayersPanel', 'Layers'); } catch(e) { const p = qs('osLayersPanel'); if (p) p.classList.toggle('visible'); }
    setTimeout(() => { buildLayersPanelV78(); }, 40);
  };
  try { osToggleLayersPanel = window.osToggleLayersPanel; } catch(e) {}

  const oldClear = window.osClearAllGOS;
  window.osClearAllGOS = function(){
    try { removeSnowCompletely(); } catch(e) {}
    try { if (typeof osToggleWildfireLayer === 'function') osToggleWildfireLayer(false); } catch(e) {}
    try { _osWildfireVisible = false; } catch(e) {}
    if (typeof oldClear === 'function') return oldClear.apply(this, arguments);
  };
  try { osClearAllGOS = window.osClearAllGOS; } catch(e) {}

  document.addEventListener('DOMContentLoaded', () => setTimeout(() => { removeSnowCompletely(); buildLayersPanelV78(); }, 600));
})();

// V8.4 — mobile map controls: zoom + single 3D/2D toggle sync
(function(){
  window.osZoomIn = function(){ try { if (osMapInstance) osMapInstance.zoomIn({ duration: 250 }); } catch(e) {} };
  window.osZoomOut = function(){ try { if (osMapInstance) osMapInstance.zoomOut({ duration: 250 }); } catch(e) {} };

  function syncGOS3DButton(){
    try {
      const btn = document.getElementById('osMap3DToggleBtn');
      if (btn) {
        btn.classList.toggle('active', !!osTerrain3D);
        btn.textContent = osTerrain3D ? '2D' : '3D';
        btn.setAttribute('aria-label', osTerrain3D ? 'Switch to 2D map' : 'Switch to 3D terrain');
      }
      const b2 = document.getElementById('osGos2DBtn');
      const b3 = document.getElementById('osGos3DBtn');
      if (b2) b2.classList.toggle('active', !osTerrain3D);
      if (b3) b3.classList.toggle('active', !!osTerrain3D);
    } catch(e) {}
  }
  window.osSyncGOS3DButton = syncGOS3DButton;

  const prevSync = window.osSyncTileButtons || (typeof osSyncTileButtons === 'function' ? osSyncTileButtons : null);
  if (prevSync && !prevSync._v84Sync3D) {
    const wrappedSync = function(){
      const r = prevSync.apply(this, arguments);
      syncGOS3DButton();
      return r;
    };
    wrappedSync._v84Sync3D = true;
    window.osSyncTileButtons = wrappedSync;
    try { osSyncTileButtons = wrappedSync; } catch(e) {}
  }

  const prevSet3D = window.osSet3D || (typeof osSet3D === 'function' ? osSet3D : null);
  if (prevSet3D && !prevSet3D._v84Sync3D) {
    const wrappedSet = function(on){
      const r = prevSet3D.apply(this, arguments);
      setTimeout(syncGOS3DButton, 0);
      return r;
    };
    wrappedSet._v84Sync3D = true;
    window.osSet3D = wrappedSet;
    try { osSet3D = wrappedSet; } catch(e) {}
  }

  const prevToggle = window.osToggle3D || (typeof osToggle3D === 'function' ? osToggle3D : null);
  if (prevToggle && !prevToggle._v84Sync3D) {
    const wrappedToggle = function(){
      const r = prevToggle.apply(this, arguments);
      setTimeout(syncGOS3DButton, 0);
      return r;
    };
    wrappedToggle._v84Sync3D = true;
    window.osToggle3D = wrappedToggle;
    try { osToggle3D = wrappedToggle; } catch(e) {}
  }

  // Mobile should enter BC GOS in 2D; the user explicitly taps 3D if wanted.
  const prevInit = window.initOpenSeasonsPage || (typeof initOpenSeasonsPage === 'function' ? initOpenSeasonsPage : null);
  if (prevInit && !prevInit._v84Default2D) {
    const wrappedInit = function(){
      if (window.matchMedia && window.matchMedia('(max-width: 820px)').matches) osTerrain3D = false;
      const r = prevInit.apply(this, arguments);
      setTimeout(syncGOS3DButton, 120);
      return r;
    };
    wrappedInit._v84Default2D = true;
    window.initOpenSeasonsPage = wrappedInit;
    try { initOpenSeasonsPage = wrappedInit; } catch(e) {}
  }

  document.addEventListener('DOMContentLoaded', syncGOS3DButton);
  setTimeout(syncGOS3DButton, 400);
})();

// V8.5 — mobile GOS side tools + GOS method/data safety cleanup
(function(){
  function isMobile(){ return window.matchMedia && window.matchMedia('(max-width: 820px)').matches; }
  function qs(id){ return document.getElementById(id); }

  function ensureGOSMobileTools(){
    const page = qs('bcOpenSeasonsPage');
    if (!page || qs('osMobileTools')) return;
    const wrap = page.querySelector('.os-map-wrap') || page;
    const tools = document.createElement('div');
    tools.id = 'osMobileTools';
    tools.className = 'os-mobile-tools';
    tools.style.display = 'none';
    tools.innerHTML = `
      <button type="button" class="os-mobile-tool" onclick="osMobileOpenTool('layers')" aria-label="Layers"><span>▣</span><small>Layers</small></button>
      <button type="button" class="os-mobile-tool" onclick="osMobileOpenTool('filters')" aria-label="Filters"><span>▤</span><small>Filters</small></button>
      <button type="button" class="os-mobile-tool" onclick="osMobileOpenTool('details')" aria-label="Details"><span>▥</span><small>Details</small></button>`;
    wrap.appendChild(tools);
  }

  window.osMobileOpenTool = function(type){
    if (type === 'layers') {
      try { if (typeof osCloseFilterPanel === 'function') osCloseFilterPanel(); } catch(e) {}
      try { if (typeof osToggleLayersPanel === 'function') osToggleLayersPanel(); } catch(e) {}
      return;
    }
    if (type === 'filters') {
      try { if (typeof osCloseDockPanels === 'function') osCloseDockPanels(); } catch(e) {}
      try { if (typeof osToggleFilterPanel === 'function') osToggleFilterPanel(); } catch(e) {}
      return;
    }
    if (type === 'details') {
      const panel = document.querySelector('#bcOpenSeasonsPage .os-panel');
      if (panel) panel.classList.toggle('open');
      setTimeout(() => { try { osMapInstance && osMapInstance.resize(); } catch(e) {} }, 80);
    }
  };

  function syncGOSMobileTools(){
    ensureGOSMobileTools();
    const tools = qs('osMobileTools');
    if (tools) tools.style.display = isMobile() ? 'flex' : 'none';
  }

  // Do not display "Rifle" as a GOS method badge. Only show explicit restrictions such as Bow Only, Youth, Shotgun.
  const prevMethodName = window.osMethodDisplayName || (typeof osMethodDisplayName === 'function' ? osMethodDisplayName : null);
  window.osMethodDisplayName = function(method){
    const m = String(method || '').trim();
    if (!m || /^rifle$/i.test(m) || /^general$/i.test(m)) return '';
    if (prevMethodName) return prevMethodName.apply(this, arguments);
    return m;
  };
  try { osMethodDisplayName = window.osMethodDisplayName; } catch(e) {}

  // Specific correction confirmed against the Region 4 synopsis: Elk in 4-8/4-9/4-14..4-38 is Bow Only Sept 1-9, not Sept 10-Oct 5.
  function applyKootenayElkCorrection(){
    try {
      if (!Array.isArray(BC_OS_DATA)) return;
      BC_OS_DATA.forEach(r => {
        if (Number(r.region) !== 4 || String(r.species || '').toLowerCase() !== 'elk') return;
        const mu = String(r.management_units || '');
        const season = String(r.season_text || r.season_open || '');
        const isEastGroup = /4-8|4-9|4-14|4-27|4-33|4-37|4-38/.test(mu);
        const isWestGroup = /4-1 to 4-7|4-20 to 4-26|4-34 to 4-36|4-40/.test(mu);
        if (!isEastGroup && !isWestGroup) return;
        if (/Sept\s*1\s*-\s*Sept\s*9/i.test(season)) {
          r.weapon_type = 'Bow Only';
          if (/^ow\s*only$/i.test(String(r.bag_limit || '').trim())) r.bag_limit = '';
          if (/^lls$/i.test(String(r.class || '').trim())) r.class = 'Bulls';
        } else if (/Sept\s*10/i.test(season)) {
          r.weapon_type = 'Rifle';
          if (/^ow\s*only$/i.test(String(r.bag_limit || '').trim()) || !String(r.bag_limit || '').trim()) r.bag_limit = '1';
          if (/^lls$/i.test(String(r.class || '').trim())) r.class = '6 Point Bulls';
        }
      });
    } catch(e) { console.warn('Kootenay elk correction skipped', e); }
  }
  window.osApplyKootenayElkCorrection = applyKootenayElkCorrection;

  const oldInit = window.initOpenSeasonsPage || (typeof initOpenSeasonsPage === 'function' ? initOpenSeasonsPage : null);
  if (oldInit && !oldInit._v85MobileTools) {
    const wrapped = function(){
      applyKootenayElkCorrection();
      const r = oldInit.apply(this, arguments);
      setTimeout(() => { applyKootenayElkCorrection(); syncGOSMobileTools(); try { if (typeof osRenderPanel === 'function') osRenderPanel(); } catch(e) {} }, 80);
      return r;
    };
    wrapped._v85MobileTools = true;
    window.initOpenSeasonsPage = wrapped;
    try { initOpenSeasonsPage = wrapped; } catch(e) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyKootenayElkCorrection();
    syncGOSMobileTools();
  });
  window.addEventListener('resize', syncGOSMobileTools);
  setTimeout(() => { applyKootenayElkCorrection(); syncGOSMobileTools(); }, 500);
})();

// ══════════════════════════════════════════════════════════════
// V8.6 — Province-wide GOS synopsis audit cleanup
// Purpose: remove parser-note rows, correct shifted Bow Only labels, and avoid
// displaying "Rifle" as a restriction. Only explicit restrictions show as badges.
// ══════════════════════════════════════════════════════════════
(function(){
  if (window.__gosSynopsisAuditV86) return;
  window.__gosSynopsisAuditV86 = true;

  const GOS_BOW_ONLY_RULES_V86 = [
    // Region 1 — Vancouver Island
    {r:1, sp:'mule deer', mu:'1-1 to 1-15', season:'Aug 25 - Sept 9'},
    {r:1, sp:'mule deer', mu:'1-1, 1-2, 1-4, 1-5, 1-6', season:'Aug 25 - Sept 9'},
    {r:1, sp:'black bear', mu:'1-1 to 1-15', season:'Aug 25 - Sept 9'},
    {r:1, sp:'grouse', mu:'1-1 to 1-15', season:'Aug 20 - Aug 31'},

    // Region 2 — Lower Mainland
    {r:2, sp:'mule deer', mu:'2-2 to 2-19', season:'Sept 1 - Sept 9'},
    {r:2, sp:'mule deer', mu:'2-16', season:'Sept 1 - Dec 15'},
    {r:2, sp:'mule deer', mu:'2-16', season:'Nov 5 - Dec 5'},
    {r:2, sp:'mule deer', mu:'2-16', season:'Dec 16 - Jan 15'},
    {r:2, sp:'mule deer', mu:'2-16', season:'Jan 1 - Jan 15'},
    {r:2, sp:'black bear', mu:'2-2 to 2-19', season:'Sept 1 - Sept 9'},
    {r:2, sp:'grouse', mu:'2-2 to 2-19', season:'Sept 1 - Sept 9'},
    {r:2, sp:'ptarmigan', mu:'2-2, 2-3, 2-5 to 2-19', season:'Sept 1 - Sept 9'},

    // Region 3 — Thompson
    {r:3, sp:'mule deer', mu:'3-12 to 3-14, 3-17 to 3-20, 3-26 to 3-31, 3-34 to 3-44', season:'Sept 1 - Sept 9'},
    {r:3, sp:'white-tailed deer', mu:'3-12 to 3-20, 3-26 to 3-44', season:'Sept 1 - Sept 9'},

    // Region 4 — Kootenay
    {r:4, sp:'mule deer', mu:'4-1 to 4-9, 4-14 to 4-40', season:'Sept 1 - Sept 9'},
    {r:4, sp:'white-tailed deer', mu:'4-1 to 4-9, 4-14 to 4-40', season:'Sept 1 - Sept 9'},
    {r:4, sp:'white-tailed deer', mu:'4-1 to 4-9, 4-14 to 4-40', season:'Dec 1 - Dec 20'},
    {r:4, sp:'elk', mu:'4-1 to 4-7, 4-20 to 4-26, 4-34 to 4-36, 4-40', season:'Sept 1 - Sept 9'},
    {r:4, sp:'elk', mu:'4-8, 4-9, 4-14 to 4-19, 4-27 to 4-33, 4-37, 4-38', season:'Sept 1 - Sept 9'},
    {r:4, sp:'moose', mu:'4-7 to 4-9, 4-14 to 4-18, 4-27 to 4-33, 4-36 to 4-40', season:'Sept 1 - Sept 19'},
    {r:4, sp:'moose', mu:'4-1 to 4-6, 4-19 to 4-26, 4-34, 4-35', season:'Sept 1 - Oct 14'},
    {r:4, sp:'black bear', mu:'4-1 to 4-9, 4-14 to 4-40', season:'Sept 1 - Sept 9'},
    {r:4, sp:'turkey', mu:'4-1 to 4-9, 4-14 to 4-40', season:'Sept 1 - Sept 30'},

    // Region 5 — Cariboo
    {r:5, sp:'mule deer', mu:'5-1 to 5-3, 5-7 to 5-9, 5-12 to 5-14', season:'Sept 1 - Sept 9'},
    {r:5, sp:'mule deer', mu:'5-1 to 5-6, 5-13, 5-14', season:'Dec 1 - Dec 10'},
    {r:5, sp:'mule deer', mu:'5-8, 5-11', season:'Dec 1 - Dec 24'},
    {r:5, sp:'white-tailed deer', mu:'5-1 to 5-6, 5-12 to 5-15', season:'Sept 1 - Sept 9'},
    {r:5, sp:'white-tailed deer', mu:'5-1, 5-2, 5-13, 5-14', season:'Dec 1 - Dec 10'},

    // Region 6 — Skeena
    {r:6, sp:'mule deer', mu:'6-1 to 6-11, 6-14, 6-15, 6-30', season:'Sept 1 - Sept 9'},
    {r:6, sp:'mule deer', mu:'6-3, 6-10, 6-11, 6-14, 6-15', season:'Dec 1 - Dec 10'},
    {r:6, sp:'mule deer', mu:'6-7 to 6-9, 6-30', season:'Dec 1 - Dec 10'},
    {r:6, sp:'mule deer', mu:'6-10, 6-11, 6-14, 6-15', season:'Dec 1 - Dec 10'},
    {r:6, sp:'white-tailed deer', mu:'6-1 to 6-11, 6-14, 6-15, 6-30', season:'Sept 1 - Sept 9'},
    {r:6, sp:'white-tailed deer', mu:'6-3, 6-7 to 6-11, 6-14, 6-15, 6-30', season:'Dec 1 - Dec 20'},
    {r:6, sp:'moose', mu:'6-1, 6-2', season:'Sept 1 - Sept 9'},
    {r:6, sp:'moose', mu:'6-1, 6-2', season:'Nov 16 - Nov 20'},
    {r:6, sp:'elk', mu:'6-13', season:'Sept 1 - Sept 14'},
    {r:6, sp:'grouse', mu:'6-1 to 6-11, 6-14 to 6-30', season:'Sept 1 - Sept 9'},
    {r:6, sp:'grouse', mu:'6-12, 6-13', season:'Sept 1 - Sept 9'},

    // Region 7A — Omineca
    {r:7, sp:'mule deer', mu:'7-12 to 7-14, 7-24, 7-25', season:'Sept 1 - Sept 9'},
    {r:7, sp:'mule deer', mu:'7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41', season:'Sept 1 - Sept 9'},
    {r:7, sp:'white-tailed deer', mu:'7-2 to 7-18, 7-23 to 7-30, 7-37 to 7-41', season:'Sept 1 - Sept 9'},
    {r:7, sp:'moose', mu:'7-2 to 7-15', season:'Sept 1 - Sept 9'},
    {r:7, sp:'elk', mu:'7-2 to 7-18, 7-23 to 7-30, 7-38 to 7-40', season:'Sept 1 - Sept 9'},

    // Region 7B — Peace
    {r:7, sp:'mule deer', mu:'7-20, 7-21, 7-32 to 7-35, 7-44 to 7-47', season:'Sept 1 - Sept 30'},
    {r:7, sp:'white-tailed deer', mu:'7-19 to 7-22, 7-31 to 7-36, 7-42 to 7-50, 7-54 to 7-58', season:'Sept 1 - Sept 9'},
    {r:7, sp:'elk', mu:'7-50', season:'Sept 10 - Oct 31'},

    // Region 8 — Okanagan
    {r:8, sp:'mule deer', mu:'8-1 to 8-15, 8-21 to 8-26', season:'Sept 1 - Sept 9'},
    {r:8, sp:'white-tailed deer', mu:'8-1 to 8-15, 8-21 to 8-26', season:'Sept 1 - Sept 9'},
    {r:8, sp:'white-tailed deer', mu:'8-1 to 8-15, 8-21 to 8-26', season:'Dec 1 - Dec 20'},
    {r:8, sp:'elk', mu:'8-1 to 8-15, 8-21 to 8-26', season:'Sept 1 - Sept 9'},
    {r:8, sp:'grouse', mu:'8-1 to 8-15, 8-21 to 8-26', season:'Dec 1 - Dec 10'}
  ];

  function v86Norm(s){
    return String(s || '')
      .replace(/[–—]/g, '-')
      .replace(/[\u0000-\u001f]/g, ' ')
      .replace(/[\*\+\]\u00ad\u0090]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function v86SpeciesKey(s){
    const x = v86Norm(s).toLowerCase();
    if (x.includes('mule deer')) return 'mule deer';
    if (x.includes('white-tailed deer') || x.includes('white tailed deer')) return 'white-tailed deer';
    if (x.includes('black bear')) return 'black bear';
    if (x.includes('moose')) return 'moose';
    if (x === 'elk' || x.includes(' elk')) return 'elk';
    if (x.includes('turkey')) return 'turkey';
    if (x.includes('ptarmigan')) return 'ptarmigan';
    if (x.includes('grouse')) return 'grouse';
    return x;
  }
  function v86SeasonKey(s){
    return v86Norm(String(s || '').split('/')[0])
      .replace(/\bSep\b/ig,'Sept')
      .replace(/\s*-\s*/g,' - ')
      .toLowerCase();
  }
  function v86HasDate(s){
    return /(jan|feb|mar|apr|may|jun|july|jul|aug|sept|sep|oct|nov|dec|no\s+closed)/i.test(String(s || ''));
  }
  function v86CleanSeason(s){
    let out = v86Norm(s);
    // Keep true multi-period date strings, but strip notes that were appended as prose.
    out = out.replace(/\s*\/\s*(Hunters|All individuals|The bag limit|The aggregate|Restricted|Compulsory|Mandatory|See Definitions|For\s+|The open season|Open season|Note:|s\s+Restricted|H\s+See|Compusory).*$/i, '');
    out = out.replace(/\s+\(bow only\)/i, '');
    return v86Norm(out);
  }
  function v86MUs(text){
    try { if (typeof osParseMUs === 'function') return osParseMUs(text); } catch(e) {}
    const out = new Set();
    String(text || '').replace(/(\d+)\s*-\s*0*(\d+)\s+to\s+\d+\s*-\s*0*(\d+)/gi, (m, reg, a, b) => {
      reg = parseInt(reg,10); a = parseInt(a,10); b = parseInt(b,10);
      if (Number.isFinite(reg) && Number.isFinite(a) && Number.isFinite(b) && b >= a && b-a < 90) for (let i=a;i<=b;i++) out.add(`${reg}-${i}`);
      return ' ';
    });
    let m; const re = /\b(\d+)\s*-\s*0*(\d+)\b/g;
    while ((m = re.exec(String(text || ''))) !== null) out.add(`${parseInt(m[1],10)}-${parseInt(m[2],10)}`);
    return [...out];
  }
  function v86Intersects(a,b){
    const A = new Set(v86MUs(a));
    return v86MUs(b).some(x => A.has(x));
  }
  function v86IsBowOnly(row){
    return GOS_BOW_ONLY_RULES_V86.some(rule =>
      Number(row.region) === Number(rule.r) &&
      v86SpeciesKey(row.species) === rule.sp &&
      v86SeasonKey(row.season_text || row.season_open) === v86SeasonKey(rule.season) &&
      v86Intersects(row.management_units, rule.mu)
    );
  }
  function v86ShouldDrop(row){
    const sp = v86SpeciesKey(row.species);
    const mu = v86Norm(row.management_units);
    const season = v86Norm(row.season_text || row.season_open);
    if (Number(row.region) === 6 && sp === 'caribou') return true; // Synopsis lists Region 6 caribou as LEH only.
    if (/mountain goats only/i.test(season) && sp !== 'mountain goat') return true;
    if (/^(Season applies|Compulsory Inspection|Shooting Area|Map\s|Parts of|The aggregate|Bag limit|Restricted to hunters|Hunters Note:)/i.test(mu)) return true;
    if (mu.length > 130 && /(see map|closed|open season|hunters|bag limit|compulsory|aggregate|permission|restricted)/i.test(mu)) return true;
    if (!v86HasDate(season)) return true;
    return false;
  }
  function v86CleanClass(cls){
    let c = v86Norm(cls);
    const lc = c.toLowerCase();
    if (lc === 'cks') c = 'Bucks';
    if (lc === 'lls') c = 'Bulls';
    if (lc === 'lls+') c = 'Bulls+';
    if (lc === 'ws') c = 'Ewes';
    if (lc === 'rs') c = 'Rams';
    if (lc === 'earded') c = 'Bearded';
    if (/^s?6 point bulls$/i.test(c)) c = '6 Point Bulls';
    if (/^s?4 point bucks$/i.test(c)) c = '4 Point Bucks';
    if (/spike-fork/i.test(c)) c = 'Spike-fork Bulls';
    return c || 'Any';
  }
  function v86ApplySynopsisAuditCorrections(){
    try {
      if (!Array.isArray(BC_OS_DATA)) return { changed:false, reason:'BC_OS_DATA missing' };
      if (BC_OS_DATA._v86SynopsisAudited) return window.__gosSynopsisAuditReportV86 || { changed:false, already:true };
      const before = BC_OS_DATA.length;
      let dropped = 0, bowSet = 0, bowCleared = 0, notesStripped = 0, bagFixed = 0;
      const fixed = [];
      const kept = [];
      BC_OS_DATA.forEach(row => {
        if (!row) return;
        if (v86ShouldDrop(row)) { dropped++; fixed.push({ action:'drop', region:row.region, species:row.species, mu:row.management_units, season:row.season_text }); return; }
        const originalSeason = row.season_text;
        row.season_text = v86CleanSeason(row.season_text || row.season_open);
        row.season_open = v86CleanSeason(row.season_open || row.season_text);
        row.season_close = v86CleanSeason(row.season_close || '');
        if (originalSeason !== row.season_text) notesStripped++;
        row.class = v86CleanClass(row.class);
        if (/^(ow only|bow only|youth only\*?|youth bow only)$/i.test(v86Norm(row.bag_limit))) { row.bag_limit = ''; bagFixed++; }
        const shouldBow = v86IsBowOnly(row);
        if (shouldBow && !/bow only/i.test(row.weapon_type || '')) { row.weapon_type = 'Bow Only'; bowSet++; }
        if (!shouldBow && /bow only/i.test(row.weapon_type || '') && !/youth/i.test(row.weapon_type || '')) { row.weapon_type = 'Rifle'; bowCleared++; }
        if (!shouldBow && /youth bow only/i.test(row.weapon_type || '')) { row.weapon_type = 'Youth Only'; bowCleared++; }
        kept.push(row);
      });
      BC_OS_DATA.splice(0, BC_OS_DATA.length, ...kept);
      BC_OS_DATA._v86SynopsisAudited = true;
      const report = { before, after:BC_OS_DATA.length, dropped, bowSet, bowCleared, notesStripped, bagFixed, fixed };
      window.__gosSynopsisAuditReportV86 = report;
      return report;
    } catch(e) {
      console.warn('[GOS V8.6 synopsis audit] skipped', e);
      return { error:String(e) };
    }
  }

  window.osApplySynopsisAuditCorrectionsV86 = v86ApplySynopsisAuditCorrections;
  window.osRunGOSDataAudit = function(){
    const report = v86ApplySynopsisAuditCorrections();
    try { console.table((report.fixed || []).slice(0, 100)); } catch(e) {}
    return report;
  };

  // Display method badges only for actual special restrictions. No "Rifle"/general badges.
  const prevMethodDisplayV86 = window.osMethodDisplayName || (typeof osMethodDisplayName === 'function' ? osMethodDisplayName : null);
  window.osMethodDisplayName = function(method){
    const m = v86Norm(method);
    if (!m || /^rifle$/i.test(m) || /^general$/i.test(m)) return '';
    if (/bow/i.test(m)) return /youth/i.test(m) ? 'Youth Bow Only' : 'Bow Only';
    if (/youth/i.test(m)) return 'Youth Only';
    if (/shotgun/i.test(m)) return 'Shotgun Only';
    return prevMethodDisplayV86 ? prevMethodDisplayV86(method) : m;
  };
  try { osMethodDisplayName = window.osMethodDisplayName; } catch(e) {}

  const oldInitV86 = window.initOpenSeasonsPage || (typeof initOpenSeasonsPage === 'function' ? initOpenSeasonsPage : null);
  if (oldInitV86 && !oldInitV86._v86SynopsisAudit) {
    const wrapped = function(){
      v86ApplySynopsisAuditCorrections();
      const out = oldInitV86.apply(this, arguments);
      setTimeout(() => { v86ApplySynopsisAuditCorrections(); try { if (typeof osRenderPanel === 'function') osRenderPanel(); } catch(e) {} }, 60);
      return out;
    };
    wrapped._v86SynopsisAudit = true;
    window.initOpenSeasonsPage = wrapped;
    try { initOpenSeasonsPage = wrapped; } catch(e) {}
  }
  document.addEventListener('DOMContentLoaded', () => setTimeout(v86ApplySynopsisAuditCorrections, 50));
})();

// ══════════════════════════════════════════════════════════════
// V8.7 — GOS display sanitizer + mobile stability patch
// Purpose: fix OCR/missing-letter labels (B ll/Bull, F ll C rl/Full Curl),
// keep only real special-method badges, and detach mobile popovers so they are never clipped.
// ══════════════════════════════════════════════════════════════
(function(){
  if (window.__gosV87DisplayMobileFix) return;
  window.__gosV87DisplayMobileFix = true;

  function esc(s){
    if (typeof osEscape === 'function') return osEscape(s);
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  function norm(s){
    return String(s == null ? '' : s)
      .replace(/[–—]/g, '–')
      .replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function cleanClassLabel(value){
    let s = norm(value || 'Any');
    if (!s) return 'Any';

    // Fix known PDF/OCR missing-letter fragments seen in GOS cards.
    s = s
      .replace(/\bF\s*ll\s*C\s*rl\b/ig, 'Full Curl')
      .replace(/\bF\s*ll\b/ig, 'Full')
      .replace(/\bC\s*rl\b/ig, 'Curl')
      .replace(/\bMa\s*re\b/ig, 'Mature')
      .replace(/\bB\s*lls?\b/ig, 'Bulls')
      .replace(/\bB\s*ck?s?\b/ig, 'Bucks')
      .replace(/\bR\s*ams?\b/ig, 'Rams')
      .replace(/\bE\s*wes?\b/ig, 'Ewes');

    const key = s.toLowerCase();
    const exact = {
      'cks': 'Bucks',
      'lls': 'Bulls',
      'lls+': 'Bulls+',
      'earded': 'Bearded',
      's 6 point bulls': '6 Point Bulls',
      's 3 point bulls': '3 Point Bulls',
      'any turkey': 'Any Turkey',
      'either sex': 'Either Sex',
      'full curl bighorn ram': 'Full Curl Bighorn Ram',
      'full curl bighorn rams': 'Full Curl Bighorn Rams',
      'full curl thinhorn ram': 'Full Curl Thinhorn Ram',
      'full curl thinhorn rams': 'Full Curl Thinhorn Rams',
      'mature bighorn ram': 'Mature Bighorn Ram',
      'mature bighorn rams': 'Mature Bighorn Rams',
      '6 point bull': '6 Point Bull',
      '6 point bulls': '6 Point Bulls',
      '4 point buck': '4 Point Buck',
      '4 point bucks': '4 Point Bucks',
      'spike-fork bulls': 'Spike-fork Bulls',
      'spike fork bulls': 'Spike-fork Bulls'
    };
    if (exact[key]) return exact[key];

    // Repair labels that still contain broken words after exact matching.
    s = s.replace(/\b6\s*Point\s*Bulls?\b/i, '6 Point Bulls');
    s = s.replace(/\b4\s*Point\s*Bucks?\b/i, '4 Point Bucks');
    s = s.replace(/\bFull\s+Curl\s+Bighorn\s+Ram(s)?\b/i, (_, p) => 'Full Curl Bighorn Ram' + (p ? 's' : ''));
    s = s.replace(/\bMature\s+Bighorn\s+Ram(s)?\b/i, (_, p) => 'Mature Bighorn Ram' + (p ? 's' : ''));
    return norm(s) || 'Any';
  }
  function cleanSpeciesLabel(value){
    let s = norm(value || '');
    s = s.replace(/\bBighorn Mountain Sheep\b/i, 'Bighorn Mountain Sheep');
    s = s.replace(/\bThinhorn Mountain Sheep\b/i, 'Thinhorn Mountain Sheep');
    return s;
  }
  function cleanBagLabel(value){
    let s = norm(value || '');
    if (!s || /^[-–—]$/.test(s)) return '—';
    if (/^(ow only|bow only|youth bow only|youth only)$/i.test(s)) return '—';
    return s;
  }
  function cleanMethodLabel(value){
    let s = norm(value || '');
    if (!s || /^rifle$/i.test(s) || /^general$/i.test(s)) return '';
    if (/youth/i.test(s) && /bow|archery/i.test(s)) return 'Youth Bow Only';
    if (/bow|archery/i.test(s)) return 'Bow Only';
    if (/youth/i.test(s)) return 'Youth Only';
    if (/shotgun/i.test(s)) return 'Shotgun Only';
    return s;
  }
  function cleanSeason(value){
    let s = norm(value || '');
    s = s.replace(/\bSep\b/ig, 'Sept').replace(/\s+-\s+/g, ' – ');
    return s || '—';
  }
  function seasonText(row){
    try { return cleanSeason(typeof osSeasonText === 'function' ? osSeasonText(row) : (row && (row.season_text || row.season_open))); }
    catch(e) { return cleanSeason(row && (row.season_text || row.season_open)); }
  }

  function sanitizeRows(){
    try {
      if (!Array.isArray(BC_OS_DATA) || BC_OS_DATA._v87DisplaySanitized) return;
      let fixedLabels = 0, dropped = 0;
      const kept = [];
      BC_OS_DATA.forEach(r => {
        if (!r) return;
        const before = [r.species, r.class, r.weapon_type, r.bag_limit, r.season_text].join('|');
        r.species = cleanSpeciesLabel(r.species);
        r.class = cleanClassLabel(r.class);
        r.weapon_type = cleanMethodLabel(r.weapon_type) || 'Rifle';
        r.bag_limit = cleanBagLabel(r.bag_limit) === '—' ? '' : cleanBagLabel(r.bag_limit);
        r.season_text = cleanSeason(r.season_text || r.season_open);
        r.season_open = cleanSeason(r.season_open || r.season_text);
        r.season_close = cleanSeason(r.season_close || '');
        // Drop rows that are clearly parser fragments, not season classes.
        if (/^(luhk cr|telkwa river|grizzly plateau is open to|no shooting area|open season for billy \(male\))$/i.test(r.class || '')) { dropped++; return; }
        if (before !== [r.species, r.class, r.weapon_type, r.bag_limit, r.season_text].join('|')) fixedLabels++;
        kept.push(r);
      });
      if (kept.length && kept.length !== BC_OS_DATA.length) BC_OS_DATA.splice(0, BC_OS_DATA.length, ...kept);
      BC_OS_DATA._v87DisplaySanitized = true;
      window.__gosV87AuditReport = { rows: BC_OS_DATA.length, fixedLabels, dropped };
    } catch(e) { console.warn('[GOS V8.7 sanitizer] skipped', e); }
  }

  window.osCleanGOSClassLabel = cleanClassLabel;
  window.osCleanGOSMethodLabel = cleanMethodLabel;
  window.osRunGOSSpellingAudit = function(){
    sanitizeRows();
    const bad = [];
    try {
      (BC_OS_DATA || []).forEach(r => {
        const blob = [r.species, r.class, r.weapon_type, r.bag_limit, r.season_text].join(' ');
        if (/\b(B\s*ll|F\s*ll|C\s*rl|Ma\s*re|\bcks\b|\blls\b|\bearded\b)/i.test(blob)) bad.push({ region:r.region, species:r.species, class:r.class, mu:r.management_units, season:r.season_text });
      });
    } catch(e) {}
    console.info('[HuntSmart GOS spelling audit]', { report: window.__gosV87AuditReport, remainingSuspicious: bad.length });
    try { console.table(bad.slice(0,100)); } catch(e) {}
    return { report: window.__gosV87AuditReport, remainingSuspicious: bad };
  };

  // Patch display helpers so bad labels cannot show even if old cached data exists.
  window.osMethodDisplayName = function(method){ return cleanMethodLabel(method); };
  try { osMethodDisplayName = window.osMethodDisplayName; } catch(e) {}

  const oldOpportunityKey = window.osOpportunityKey || (typeof osOpportunityKey === 'function' ? osOpportunityKey : null);
  window.osOpportunityKey = function(row){
    if (!row) return '';
    return [cleanSpeciesLabel(row.species), cleanClassLabel(row.class || 'Any'), cleanMethodLabel(row.weapon_type || ''), seasonText(row)].join('|||');
  };
  try { osOpportunityKey = window.osOpportunityKey; } catch(e) {}

  const oldRowsSame = window.osRowsSameOpportunity || (typeof osRowsSameOpportunity === 'function' ? osRowsSameOpportunity : null);
  window.osRowsSameOpportunity = function(row, key){ return window.osOpportunityKey(row) === key; };
  try { osRowsSameOpportunity = window.osRowsSameOpportunity; } catch(e) {}

  const oldSortRows = window.osSortRows || (typeof osSortRows === 'function' ? osSortRows : null);
  window.osSortRows = function(rows){
    return (rows || []).slice().sort((a,b) =>
      cleanSpeciesLabel(a && a.species).localeCompare(cleanSpeciesLabel(b && b.species)) ||
      cleanClassLabel(a && a.class).localeCompare(cleanClassLabel(b && b.class), undefined, { numeric:true }) ||
      seasonText(a).localeCompare(seasonText(b)) ||
      String(a && a.management_units || '').localeCompare(String(b && b.management_units || ''), undefined, { numeric:true })
    );
  };
  try { osSortRows = window.osSortRows; } catch(e) {}

  window.osSeasonRowHTML = function(row){
    const method = cleanMethodLabel(row && row.weapon_type);
    const methodBadge = method ? `<span class="os-badge os-special-method">${esc(method)}</span>` : '';
    const bag = cleanBagLabel(row && row.bag_limit);
    const bagBadge = bag && bag !== '—' ? `<span class="os-badge muted">Bag: ${esc(bag)}</span>` : '';
    const notes = row && row.notes ? `<div class="os-warning mini">${esc(row.notes)}</div>` : '';
    return `<div class="os-season-row">
      <div class="os-season-main"><div class="os-season-class">${esc(cleanClassLabel(row && row.class))}</div><div class="os-season-date">${esc(seasonText(row))}</div><div class="os-season-mus">${esc(row && row.management_units || '')}</div>${notes}</div>
      <div class="os-season-side">${methodBadge}${bagBadge}</div>
    </div>`;
  };
  try { osSeasonRowHTML = window.osSeasonRowHTML; } catch(e) {}

  // Clean opportunity rows, avoiding ugly " ·  · " when there is no special method.
  window.osRowsGroupedByOpportunity = function(rows, compact=false){
    const by = new Map();
    (rows || []).forEach(r => { const key = window.osOpportunityKey(r); if (!by.has(key)) by.set(key, []); by.get(key).push(r); });
    return [...by.entries()].map(([key, rs]) => {
      const p = String(key || '').split('|||');
      const lab = { cls:p[1] || 'Any', method:p[2] || '', season:p[3] || '' };
      let wmus = 0, regs = 0;
      try { wmus = osWMUsForRows(rs).length; regs = osRegionsForRows(rs).length; } catch(e) {}
      const unitLabel = (typeof osHasSelectedRegions === 'function' && osHasSelectedRegions()) ? `${wmus} WMUs` : `${regs} regions`;
      const meta = [lab.season, lab.method, unitLabel].filter(Boolean).join(' · ');
      const active = (typeof osSelectedOpportunity !== 'undefined' && osSelectedOpportunity === key) ? ' active' : '';
      return `<button class="os-opportunity-row${compact ? ' compact' : ''}${active}" type="button" onclick="osSelectOpportunity(${JSON.stringify(key)})">
        <span><b>${esc(cleanClassLabel(lab.cls || 'Any'))}</b><em>${esc(meta)}</em></span>
        <span class="os-gold-dot"></span>
      </button>`;
    }).join('');
  };
  try { osRowsGroupedByOpportunity = window.osRowsGroupedByOpportunity; } catch(e) {}

  // Detach mobile popovers from the horizontally-scrolling toolbar so they cannot be clipped.
  function detachGOSMobilePanels(){
    const page = document.querySelector('#bcOpenSeasonsPage .os-page') || document.getElementById('bcOpenSeasonsPage');
    if (!page) return;
    ['osLayersPanel','osFilterPanel'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.parentElement !== page) page.appendChild(el);
    });
  }
  window.osDetachGOSMobilePanels = detachGOSMobilePanels;

  const oldMobileOpenTool = window.osMobileOpenTool;
  window.osMobileOpenTool = function(type){
    detachGOSMobilePanels();
    if (typeof oldMobileOpenTool === 'function') return oldMobileOpenTool.apply(this, arguments);
    if (type === 'layers' && typeof osToggleLayersPanel === 'function') return osToggleLayersPanel();
    if (type === 'filters' && typeof osToggleFilterPanel === 'function') return osToggleFilterPanel();
    if (type === 'details') document.querySelector('#bcOpenSeasonsPage .os-panel')?.classList.toggle('open');
  };

  const oldInit = window.initOpenSeasonsPage || (typeof initOpenSeasonsPage === 'function' ? initOpenSeasonsPage : null);
  if (oldInit && !oldInit._v87DisplayMobileFix) {
    const wrapped = function(){
      sanitizeRows();
      detachGOSMobilePanels();
      const out = oldInit.apply(this, arguments);
      setTimeout(() => { sanitizeRows(); detachGOSMobilePanels(); try { if (typeof osRenderPanel === 'function') osRenderPanel(); } catch(e) {} }, 80);
      return out;
    };
    wrapped._v87DisplayMobileFix = true;
    window.initOpenSeasonsPage = wrapped;
    try { initOpenSeasonsPage = wrapped; } catch(e) {}
  }

  document.addEventListener('DOMContentLoaded', () => { sanitizeRows(); detachGOSMobilePanels(); });
  setTimeout(() => { sanitizeRows(); detachGOSMobilePanels(); }, 300);
})();

// ══════════════════════════════════════════════════════════════
// V8.8 — Species selector rebuild
// - Guarantees Thinhorn Mountain Sheep appears when data contains it.
// - Species dropdown is alphabetized inside three groups: Big Game, Small Game, Birds.
// - Panel species sorting follows the same grouped alphabetical order.
// ══════════════════════════════════════════════════════════════
(function(){
  if (window.__gosV88SpeciesCategories) return;
  window.__gosV88SpeciesCategories = true;

  function esc(s){
    if (typeof osEscape === 'function') return osEscape(s);
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function clean(s){ return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); }
  function cleanSpecies(s){
    s = clean(s);
    if (/^mule deer/i.test(s)) return 'Mule Deer (Black-tailed)';
    if (/white[ -]?tailed deer/i.test(s)) return 'White-tailed Deer';
    if (/bighorn/i.test(s)) return 'Bighorn Mountain Sheep';
    if (/thinhorn/i.test(s)) return 'Thinhorn Mountain Sheep';
    return s;
  }

  const BIG_GAME = new Set([
    'Bighorn Mountain Sheep','Bison','Black Bear','Bobcat','Cougar','Elk','Fallow Deer','Lynx','Moose',
    'Mountain Goat','Mule Deer (Black-tailed)','Thinhorn Mountain Sheep','White-tailed Deer','Wolf','Wolverine'
  ]);
  const SMALL_GAME = new Set([
    'Columbian Ground Squirrel','Coyote','Opossum, Skunk','Raccoon','Raccoon, Skunk','Skunk','Skunk, Raccoon','Snowshoe Hare'
  ]);
  function isBird(sp){
    return /\b(duck|goose|geese|grouse|ptarmigan|pheasant|quail|partridge|snipe|coot|brant|pigeon|dove|turkey|raven)\b/i.test(sp);
  }
  function categoryOf(sp){
    sp = cleanSpecies(sp);
    if (BIG_GAME.has(sp)) return 'big';
    if (SMALL_GAME.has(sp)) return 'small';
    if (isBird(sp)) return 'bird';
    return 'small';
  }
  function compareSpecies(a,b){ return cleanSpecies(a).localeCompare(cleanSpecies(b), undefined, { sensitivity:'base', numeric:true }); }
  function speciesFromRows(rows){
    const set = new Set();
    (rows || []).forEach(r => { const sp = cleanSpecies(r && r.species); if (sp) set.add(sp); });
    return [...set];
  }
  function groupedSpecies(rows){
    const all = speciesFromRows(rows);
    return {
      big: all.filter(s => categoryOf(s) === 'big').sort(compareSpecies),
      small: all.filter(s => categoryOf(s) === 'small').sort(compareSpecies),
      bird: all.filter(s => categoryOf(s) === 'bird').sort(compareSpecies)
    };
  }
  function groupOptions(label, arr){
    if (!arr.length) return '';
    return `<optgroup label="${esc(label)}">${arr.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}</optgroup>`;
  }

  window.osSortedSpeciesForRows = function(rows){
    const g = groupedSpecies(rows || []);
    return g.big.concat(g.small, g.bird);
  };
  try { osSortedSpeciesForRows = window.osSortedSpeciesForRows; } catch(e) {}

  window.osBuildFilters = function(){
    const sp = document.getElementById('osSpeciesSel');
    if (sp) {
      const current = osSelSpecies || sp.value || '';
      const g = groupedSpecies(typeof BC_OS_DATA !== 'undefined' ? BC_OS_DATA : []);
      sp.innerHTML = '<option value="">Choose species or select region</option>' +
        groupOptions('Big Game', g.big) +
        groupOptions('Small Game', g.small) +
        groupOptions('Birds', g.bird);
      sp.value = current;
    }

    const mt = document.getElementById('osMethodSel');
    if (mt) {
      const current = osSelMethod || mt.value || '';
      const methods = [...new Set((typeof BC_OS_DATA !== 'undefined' ? BC_OS_DATA : []).map(r => r.weapon_type || 'Rifle'))]
        .sort((a,b) => (typeof osMethodDisplayName === 'function' ? osMethodDisplayName(a) : String(a)).localeCompare(typeof osMethodDisplayName === 'function' ? osMethodDisplayName(b) : String(b)));
      const extra = methods.some(m => /bow|archery/i.test(m)) ? '' : '<option value="Bow Only">Bow Only</option>';
      mt.innerHTML = '<option value="">All methods</option>' + extra + methods.map(m => `<option value="${esc(m)}">${esc(typeof osMethodDisplayName === 'function' ? (osMethodDisplayName(m) || m) : m)}</option>`).join('');
      mt.value = current;
    }

    const mo = document.getElementById('osMonthSel');
    if (mo) {
      const current = osSelMonth || mo.value || '';
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      mo.innerHTML = '<option value="">Any month</option>' + months.map((m,i) => `<option value="${i+1}">${m}</option>`).join('');
      mo.value = current;
    }

    try { if (typeof osSyncFilterControls === 'function') osSyncFilterControls(); } catch(e) {}
  };
  try { osBuildFilters = window.osBuildFilters; } catch(e) {}

  function refreshSpeciesSelector(){ try { window.osBuildFilters(); } catch(e) {} }

  const oldInitV88 = window.initOpenSeasonsPage || (typeof initOpenSeasonsPage === 'function' ? initOpenSeasonsPage : null);
  if (oldInitV88 && !oldInitV88._v88SpeciesCategories) {
    const wrapped = function(){
      const out = oldInitV88.apply(this, arguments);
      setTimeout(refreshSpeciesSelector, 50);
      setTimeout(refreshSpeciesSelector, 250);
      return out;
    };
    wrapped._v88SpeciesCategories = true;
    window.initOpenSeasonsPage = wrapped;
    try { initOpenSeasonsPage = wrapped; } catch(e) {}
  }
  document.addEventListener('DOMContentLoaded', () => setTimeout(refreshSpeciesSelector, 100));
  setTimeout(refreshSpeciesSelector, 400);
})();




// ── HARD KILL: neutralise V8.5 os-mobile-tools before they can show ──
(function() {
  var noop = function(){};
  // Kill the V8.5 sync function so it never shows old buttons
  window.syncGOSMobileTools = noop;
  window.ensureGOSMobileTools = noop;
  window.osMobileOpenTool = function(type) {
    // Redirect to new rail modals
    if (type === 'layers')  { if (typeof gosOpenModal==='function') gosOpenModal('layers');  return; }
    if (type === 'filters') { if (typeof gosOpenModal==='function') gosOpenModal('filters'); return; }
    if (type === 'details') { if (typeof gosOpenModal==='function') gosOpenModal('search');  return; }
  };
  function killOldGOSEls() {
    var el = document.getElementById('osMobileTools');
    if (el) el.style.cssText = 'display:none!important';
    document.querySelectorAll('.os-mobile-tools,.os-mobile-tool,.os-mobile-status').forEach(function(e){
      e.style.cssText = 'display:none!important';
    });
  }
  killOldGOSEls();
  document.addEventListener('DOMContentLoaded', killOldGOSEls);
  setTimeout(killOldGOSEls, 100);
  setTimeout(killOldGOSEls, 500);
  setTimeout(killOldGOSEls, 1500);
})();

// ══════════════════════════════════════════════════════════════
// V9.0 — HUNTSMART GOS MOBILE RAIL UI
// Matches Map tab exactly: rail buttons, centred modals, zone
// pill with slide animations, panel reflow, 3D toggle.
// Suppresses all legacy os-mobile-tools / V8.x mobile code.
// ══════════════════════════════════════════════════════════════
(function () {
  if (window.__gosRailV90) return;
  window.__gosRailV90 = true;

  function isMobile() { return window.matchMedia && window.matchMedia('(max-width: 768px)').matches; }
  function qs(id) { return document.getElementById(id); }

  // ── Bootstrap: called after GOS map is ready ──────────────
  function gosRailBootstrap() {
    if (!isMobile()) return;
    const page = qs('bcOpenSeasonsPage');
    const mapWrap = page && page.querySelector('.os-map-wrap');
    if (!mapWrap || qs('gosRail')) return;

    // Hide native topbar controls
    const topbar = page.querySelector('.os-topbar');
    if (topbar) topbar.style.display = 'none';

    _gosInjectTopbar(mapWrap);
    _gosInjectRail(mapWrap);
    _gosInjectBrCluster(mapWrap);
    _gosInjectZonePill(mapWrap);
    _gosInjectScrim(mapWrap);
    _gosSyncSpeciesBtn();
    _gosSync3DBtn();
  }

  // ── Topbar ────────────────────────────────────────────────
  function _gosInjectTopbar(wrap) {
    if (qs('gosTb')) return;
    const tb = document.createElement('div');
    tb.className = 'gos-tb'; tb.id = 'gosTb';
    tb.innerHTML = `
      <div class="gos-tb-label">BC GOS</div>
      <div class="gos-tb-divider"></div>
      <button type="button" class="gos-species-btn" id="gosSpeciesBtn" onclick="gosToggleSpeciesDrop()">
        <span id="gosSpeciesBtnText">All species</span>
        <span class="gos-species-arr">&#9660;</span>
      </button>`;
    wrap.appendChild(tb);
  }

  window.gosToggleSpeciesDrop = function () {
    const existing = qs('gosSpeciesDrop');
    if (existing) { existing.remove(); _gosSpeciesBtnClose(); return; }
    const sel = qs('osSpeciesSel');
    if (!sel) return;
    const btn = qs('gosSpeciesBtn');
    if (btn) btn.classList.add('open');

    const drop = document.createElement('div');
    drop.className = 'gos-species-drop'; drop.id = 'gosSpeciesDrop';

    // Mirror optgroups from the native select
    let html = '';
    Array.from(sel.children).forEach(child => {
      if (child.tagName === 'OPTGROUP') {
        html += `<div class="gos-species-group">${child.label}</div>`;
        Array.from(child.children).forEach(o => {
          html += `<div class="gos-species-row${o.value === sel.value ? ' active' : ''}" data-val="${o.value}">${o.text}</div>`;
        });
      } else {
        html += `<div class="gos-species-row${child.value === sel.value ? ' active' : ''}" data-val="${child.value}">${child.text}</div>`;
      }
    });
    drop.innerHTML = html;

    drop.querySelectorAll('.gos-species-row').forEach(row => {
      row.addEventListener('click', () => {
        sel.value = row.dataset.val;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        const t = qs('gosSpeciesBtnText');
        if (t) t.textContent = row.textContent || 'All species';
        drop.remove();
        _gosSpeciesBtnClose();
      });
    });

    const mapWrap = document.querySelector('#bcOpenSeasonsPage .os-map-wrap');
    if (mapWrap) mapWrap.appendChild(drop);
    setTimeout(() => document.addEventListener('touchstart', _gosCloseSpeciesDropOutside, { once: true, passive: true }), 50);
  };

  function _gosCloseSpeciesDropOutside(e) {
    const drop = qs('gosSpeciesDrop'), btn = qs('gosSpeciesBtn');
    if (drop && btn && !drop.contains(e.target) && !btn.contains(e.target)) {
      drop.remove(); _gosSpeciesBtnClose();
    }
  }
  function _gosSpeciesBtnClose() {
    const btn = qs('gosSpeciesBtn');
    if (btn) btn.classList.remove('open');
    const arr = btn && btn.querySelector('.gos-species-arr');
    if (arr) arr.innerHTML = '&#9660;';
  }
  function _gosSyncSpeciesBtn() {
    const sel = qs('osSpeciesSel'), t = qs('gosSpeciesBtnText');
    if (sel && t) t.textContent = sel.options[sel.selectedIndex]?.text || 'All species';
    if (sel) sel.addEventListener('change', () => {
      const tt = qs('gosSpeciesBtnText');
      if (tt) tt.textContent = sel.options[sel.selectedIndex]?.text || 'All species';
    });
  }

  // ── Rail (4 buttons) ──────────────────────────────────────
  function _gosInjectRail(wrap) {
    const rail = document.createElement('div');
    rail.className = 'gos-rail'; rail.id = 'gosRail';
    rail.innerHTML = `
      <button type="button" class="gos-rail-btn" id="gosRailSearch" onclick="gosOpenModal('search')" aria-label="Search">
        <span class="gos-rail-btn-icon">&#8981;</span>
        <span class="gos-rail-btn-label">Search</span>
      </button>
      <button type="button" class="gos-rail-btn" id="gosRailFilters" onclick="gosOpenModal('filters')" aria-label="Filters">
        <span class="gos-rail-btn-icon">&#9638;</span>
        <span class="gos-rail-btn-label">Filters</span>
      </button>
      <button type="button" class="gos-rail-btn" id="gosRailLayers" onclick="gosOpenModal('layers')" aria-label="Layers">
        <span class="gos-rail-btn-icon">&#9635;</span>
        <span class="gos-rail-btn-label">Layers</span>
      </button>
      <button type="button" class="gos-rail-btn clr" id="gosRailClear" onclick="gosClearAll()" aria-label="Clear">
        <span class="gos-rail-btn-icon">&#10005;</span>
        <span class="gos-rail-btn-label">Clear</span>
      </button>`;
    wrap.appendChild(rail);
  }

  // ── Bottom-right cluster (+, −, 3D) ──────────────────────
  function _gosInjectBrCluster(wrap) {
    const cl = document.createElement('div');
    cl.className = 'gos-br-cluster'; cl.id = 'gosBrCluster';
    cl.innerHTML = `
      <button type="button" class="gos-br-btn" onclick="try{osZoomIn()}catch(e){if(window.osMapInstance)osMapInstance.zoomIn({duration:250})}" aria-label="Zoom in">
        <span class="gos-br-btn-icon">+</span>
      </button>
      <button type="button" class="gos-br-btn" onclick="try{osZoomOut()}catch(e){if(window.osMapInstance)osMapInstance.zoomOut({duration:250})}" aria-label="Zoom out">
        <span class="gos-br-btn-icon">&#8722;</span>
      </button>
      <button type="button" class="gos-br-btn toggle" id="gos3DBtn" onclick="gosToggle3D()" aria-label="Toggle 3D">
        <span class="gos-br-btn-icon" id="gos3DBtnLabel">3D</span>
      </button>`;
    wrap.appendChild(cl);
  }

  window.gosToggle3D = function () {
    try { if (typeof osToggle3D === 'function') osToggle3D(); } catch (e) {}
    _gosSync3DBtn();
  };
  function _gosSync3DBtn() {
    const btn = qs('gos3DBtn'), lbl = qs('gos3DBtnLabel');
    if (!btn || !lbl) return;
    const is3D = !!(window.osTerrain3D || (typeof osTerrain3D !== 'undefined' && osTerrain3D));
    lbl.textContent = is3D ? '2D' : '3D';
    btn.classList.toggle('active', is3D);
  }

  // ── Zone pill ─────────────────────────────────────────────
  function _gosInjectZonePill(wrap) {
    const pill = document.createElement('div');
    pill.className = 'gos-zone-pill'; pill.id = 'gosZonePill';
    pill.innerHTML = `
      <span class="gos-pill-dot"></span>
      <span class="gos-pill-name" id="gosPillName"></span>
      <span class="gos-pill-div" id="gosPillDivider" style="display:none"></span>
      <span class="gos-pill-sub" id="gosPillSub"></span>`;
    wrap.appendChild(pill);
  }

  window.gosShowPill = function (regionLabel, wmuLabel) {
    if (!isMobile()) return;
    const pill = qs('gosZonePill');
    const name = qs('gosPillName');
    const div  = qs('gosPillDivider');
    const sub  = qs('gosPillSub');
    if (!pill || !name) return;
    pill.classList.remove('hiding');
    name.textContent = regionLabel || '';
    if (wmuLabel) {
      if (div) div.style.display = '';
      if (sub) sub.textContent = wmuLabel;
    } else {
      if (div) div.style.display = 'none';
      if (sub) sub.textContent = '';
    }
    pill.classList.add('visible');
  };

  window.gosHidePill = function () {
    const pill = qs('gosZonePill');
    if (!pill || !pill.classList.contains('visible')) return;
    pill.classList.add('hiding');
    setTimeout(() => { pill.classList.remove('visible', 'hiding'); }, 160);
  };

  // ── Modal scrim ───────────────────────────────────────────
  function _gosInjectScrim(wrap) {
    const scrim = document.createElement('div');
    scrim.className = 'gos-modal-scrim'; scrim.id = 'gosModalScrim';
    scrim.addEventListener('click', gosCloseModal);
    wrap.appendChild(scrim);
  }

  // ── Modal open/close ──────────────────────────────────────
  window.gosOpenModal = function (type) {
    if (!isMobile()) return;
    const scrim = qs('gosModalScrim');
    if (!scrim) return;

    document.querySelectorAll('.gos-rail-btn').forEach(b => b.classList.remove('active'));
    const map = { search: 'gosRailSearch', filters: 'gosRailFilters', layers: 'gosRailLayers' };
    if (map[type]) { const b = qs(map[type]); if (b) b.classList.add('active'); }

    scrim.innerHTML = '';
    const modal = document.createElement('div');
    modal.className = 'gos-modal'; modal.id = 'gosModal';
    modal.addEventListener('click', e => e.stopPropagation());

    if (type === 'search')  modal.innerHTML = _gosSearchHTML();
    if (type === 'filters') modal.innerHTML = _gosFiltersHTML();
    if (type === 'layers')  modal.innerHTML = _gosLayersHTML();

    scrim.appendChild(modal);
    scrim.classList.add('visible');

    if (type === 'search') setTimeout(() => qs('gosSearchInput')?.focus(), 80);
  };

  window.gosCloseModal = function () {
    const scrim = qs('gosModalScrim');
    if (scrim) { scrim.classList.remove('visible'); scrim.innerHTML = ''; }
    document.querySelectorAll('.gos-rail-btn').forEach(b => b.classList.remove('active'));
  };

  // ── Clear all ─────────────────────────────────────────────
  window.gosClearAll = function () {
    try { if (typeof osClearAllGOS === 'function') osClearAllGOS(); } catch (e) {}
    gosHidePill();
    gosCloseModal();
    _gosSyncSpeciesBtn();
  };

  // ── Layers modal ──────────────────────────────────────────
  function _gosLayersHTML() {
    const tile = (typeof _osCurrentTile !== 'undefined' && _osCurrentTile) || 'streets';
    const is3D  = !!(window.osTerrain3D || (typeof osTerrain3D !== 'undefined' && osTerrain3D));
    const overlayPct = 75;
    const wildfirePct = 60;
    const wildfireOn = !!(window.osWildfireVisible);
    const btn = (label, cls, active, fn) =>
      `<button type="button" class="gos-modal-btn ${cls}${active?' active':''}" onclick="${fn}">${label}</button>`;
    return `
      <div class="gos-modal-head">
        <span class="gos-modal-title">Map layers</span>
        <button type="button" class="gos-modal-close" onclick="gosCloseModal()">&#10005;</button>
      </div>
      <div class="gos-modal-lbl">Map type</div>
      <div class="gos-modal-seg3">
        ${btn('Streets','map-type',tile==='streets',"gosSetTile('streets')")}
        ${btn('Satellite','map-type',tile==='satellite',"gosSetTile('satellite')")}
        ${btn('Topo','map-type',tile==='topo',"gosSetTile('topo')")}
      </div>
      <div class="gos-modal-lbl">Mode</div>
      <div class="gos-modal-seg2">
        ${btn('2D','mode',!is3D,"gosSet3D(false)")}
        ${btn('3D','mode',is3D,"gosSet3D(true)")}
      </div>
      <div class="gos-modal-lbl">GOS overlay opacity</div>
      <div class="gos-slider-row">
        <input type="range" min="0" max="100" step="1" value="${overlayPct}" oninput="gosSetOverlayOpacity(this.value)">
        <span class="gos-slider-val" id="gosOverlayVal">${overlayPct}%</span>
      </div>
      <div class="gos-modal-lbl">Historical wildfires</div>
      <div class="gos-modal-seg2" style="margin-bottom:6px">
        ${btn('Show','',wildfireOn,"gosSetWildfire(true)")}
        ${btn('Hide','',!wildfireOn,"gosSetWildfire(false)")}
      </div>
      <div class="gos-slider-row">
        <input type="range" min="0" max="100" step="1" value="${wildfirePct}" oninput="gosSetWildfireOpacity(this.value)">
        <span class="gos-slider-val amber" id="gosWildfireVal">${wildfirePct}%</span>
      </div>`;
  }

  window.gosSetTile = function (type) {
    try { if (typeof osSetTile === 'function') osSetTile(type); } catch (e) {}
    window._osCurrentTile = type;
    const modal = qs('gosModal');
    if (modal) modal.innerHTML = _gosLayersHTML();
  };
  window.gosSet3D = function (on) {
    try {
      const cur = !!(window.osTerrain3D || (typeof osTerrain3D !== 'undefined' && osTerrain3D));
      if (cur !== on && typeof osToggle3D === 'function') osToggle3D();
    } catch (e) {}
    _gosSync3DBtn();
    const modal = qs('gosModal');
    if (modal) modal.innerHTML = _gosLayersHTML();
  };
  window.gosSetOverlayOpacity = function (val) {
    const v = qs('gosOverlayVal'); if (v) v.textContent = Math.round(val) + '%';
    try { if (typeof osSetOverlayOpacity === 'function') osSetOverlayOpacity(1 - val / 100); } catch (e) {}
  };
  window.gosSetWildfire = function (show) {
    window.osWildfireVisible = show;
    try { if (typeof osToggleWildfireClean === 'function') osToggleWildfireClean(show); } catch (e) {}
    const modal = qs('gosModal');
    if (modal) modal.innerHTML = _gosLayersHTML();
  };
  window.gosSetWildfireOpacity = function (val) {
    const v = qs('gosWildfireVal'); if (v) v.textContent = Math.round(val) + '%';
    try { if (typeof osSetLayerOpacityClean === 'function') osSetLayerOpacityClean(val / 100); } catch (e) {}
  };

  // ── Filters modal ─────────────────────────────────────────
  function _gosFiltersHTML() {
    const sel = qs('osSpeciesSel');
    const methSel = qs('osMethodSel');
    const monSel  = qs('osMonthSel');
    const monthOpts = monSel ? monSel.innerHTML : '<option value="">Any month</option>';
    const methOpts  = methSel ? methSel.innerHTML : '<option value="">All methods</option>';
    const curMonth = (typeof osSelMonth !== 'undefined') ? osSelMonth : '';
    const curMeth  = (typeof osSelMethod !== 'undefined') ? osSelMethod : '';
    return `
      <div class="gos-modal-head">
        <span class="gos-modal-title">Filters</span>
        <button type="button" class="gos-modal-close" onclick="gosCloseModal()">&#10005;</button>
      </div>
      <div class="gos-modal-lbl">Month</div>
      <select class="gos-modal-select" onchange="gosSetMonth(this.value)">${monthOpts}</select>
      <div class="gos-modal-lbl">Hunting method</div>
      <select class="gos-modal-select" style="margin-bottom:8px" onchange="gosSetMethod(this.value)">${methOpts}</select>
      <div class="gos-modal-note">Matching WMUs highlighted in gold on the map.</div>`;
  }

  window.gosSetMonth = function (val) {
    try { if (typeof osOnMonth === 'function') osOnMonth(val); } catch (e) {}
    // set the hidden native select
    const mo = qs('osMonthSel'); if (mo) mo.value = val;
  };
  window.gosSetMethod = function (val) {
    try { if (typeof osOnMethod === 'function') osOnMethod(val); } catch (e) {}
    const ms = qs('osMethodSel'); if (ms) ms.value = val;
  };

  // ── Search modal ──────────────────────────────────────────
  function _gosSearchHTML() {
    return `
      <div class="gos-modal-head">
        <span class="gos-modal-title">Search</span>
        <button type="button" class="gos-modal-close" onclick="gosCloseModal()">&#10005;</button>
      </div>
      <div class="gos-search-wrap">
        <span class="gos-search-icon">&#8981;</span>
        <input class="gos-search-input" id="gosSearchInput" type="text"
          placeholder="City, WMU, or coordinates\u2026"
          autocomplete="off"
          oninput="gosHandleSearch(this.value)">
      </div>
      <div id="gosSearchResults"></div>`;
  }

  window.gosHandleSearch = function (val) {
    const box = qs('gosSearchResults'); if (!box) return;
    const q = String(val || '').trim().toLowerCase();
    if (!q) { box.innerHTML = ''; return; }

    const out = [];

    // WMU match
    try {
      const geojson = window.bcWmuGeoJSON || window.BC_WMU_GEOJSON;
      (geojson?.features || []).forEach(feat => {
        const id = feat.properties.wmu_id || '';
        if (id.toLowerCase().includes(q)) out.push({ label: `WMU ${id}`, sub: 'BC Wildlife Unit', badge: 'wmu', action: () => { try { osSelectWMU && osSelectWMU(id); } catch(e){} gosCloseModal(); } });
      });
    } catch (e) {}

    // Region match
    try {
      const regions = { '1':'Region 1 — Vancouver Island', '2':'Region 2 — Lower Mainland', '3':'Region 3 — Thompson-Okanagan', '4':'Region 4 — Kootenay', '5':'Region 5 — Cariboo', '6':'Region 6 — Skeena', '7A':'Region 7A — Omineca', '7B':'Region 7B — Peace', '8':'Region 8 — Okanagan' };
      Object.entries(regions).forEach(([id, name]) => {
        if (name.toLowerCase().includes(q) || id.toLowerCase().includes(q)) {
          out.push({ label: name.split(' — ')[0], sub: name.split(' — ')[1] || '', badge: 'reg', action: () => { try { osSelectRegion && osSelectRegion(id); } catch(e){} gosCloseModal(); } });
        }
      });
    } catch(e) {}

    window._gosSearchRows = out.slice(0, 5);
    _gosRenderSearch(window._gosSearchRows);

    // Geocode
    const token = typeof MAPBOX_TOKEN !== 'undefined' ? MAPBOX_TOKEN : '';
    if (!token) return;
    if (window._gosGeoCtrl) { try { window._gosGeoCtrl.abort(); } catch(e) {} }
    window._gosGeoCtrl = new AbortController();
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${token}&bbox=-139.1,48.3,-114.0,60.1&types=place,locality&limit=3&country=CA`, { signal: window._gosGeoCtrl.signal })
      .then(r => r.json())
      .then(data => {
        const cityRows = (data.features || []).map(f => ({ label: f.text || f.place_name, sub: f.place_name, badge: 'city', action: () => { try { if (window.osMapInstance) osMapInstance.easeTo({ center: f.center, zoom: 9, duration: 700 }); } catch(e){} gosCloseModal(); } }));
        const rows = [...(window._gosSearchRows || []), ...cityRows].slice(0, 8);
        window._gosSearchRows = rows;
        _gosRenderSearch(rows);
      })
      .catch(() => {});
  };

  function _gosRenderSearch(rows) {
    const box = qs('gosSearchResults'); if (!box) return;
    box.innerHTML = rows.map((r, i) => `
      <div class="gos-search-result" onclick="gosPickSearch(${i})">
        <div>
          <div class="gos-search-result-name">${r.label}</div>
          <div class="gos-search-result-sub">${r.sub}</div>
        </div>
        <span class="gos-search-badge ${r.badge}">${r.badge === 'reg' ? 'Region' : r.badge === 'wmu' ? 'WMU' : 'City'}</span>
      </div>`).join('');
  }

  window.gosPickSearch = function (i) {
    const row = (window._gosSearchRows || [])[i];
    if (row) { row.action(); gosCloseModal(); }
  };

  // ── Panel open/close (wired to region selection) ──────────
  function _gosSyncPanel() {
    if (!isMobile()) return;
    const panel = document.querySelector('#bcOpenSeasonsPage .os-panel');
    const body  = document.querySelector('#bcOpenSeasonsPage .os-body');
    const isOpen = panel && panel.classList.contains('open');
    if (body) body.classList.toggle('panel-open', !!isOpen);
    const cl = qs('gosBrCluster');
    if (cl) cl.classList.toggle('hidden', !!isOpen);
    setTimeout(() => { try { if (window.osMapInstance) osMapInstance.resize(); } catch(e){} }, 80);
  }

  // ── Hook into GOS render/select to show/hide zone pill ────
  function _gosHookPanelEvents() {
    const prevRender = window.osRenderPanel || (typeof osRenderPanel === 'function' ? osRenderPanel : null);
    if (prevRender && !prevRender._gosRailHooked) {
      const wrapped = function () {
        const r = prevRender.apply(this, arguments);
        if (isMobile()) _gosUpdatePillFromState();
        setTimeout(_gosSyncPanel, 20);
        return r;
      };
      wrapped._gosRailHooked = true;
      window.osRenderPanel = wrapped;
      try { osRenderPanel = wrapped; } catch(e) {}
    }
  }

  function _gosUpdatePillFromState() {
    try {
      const hasRegion = (window.osSelectedRegion != null) ||
        (window.osSelectedRegions && window.osSelectedRegions.size > 0);
      if (!hasRegion) { gosHidePill(); return; }

      let regionLabel = '';
      if (typeof osSelectedRegionLabel === 'function') {
        regionLabel = osSelectedRegionLabel();
      } else if (window.osSelectedRegion != null) {
        const names = { '1':'Region 1','2':'Region 2','3':'Region 3','4':'Region 4','5':'Region 5','6':'Region 6','7A':'Region 7A','7B':'Region 7B','8':'Region 8' };
        regionLabel = names[String(window.osSelectedRegion)] || `Region ${window.osSelectedRegion}`;
      } else if (window.osSelectedRegions && window.osSelectedRegions.size > 0) {
        regionLabel = `${window.osSelectedRegions.size} regions`;
      }

      const wmuLabel = window.osSelectedWMU ? `WMU ${window.osSelectedWMU}` : '';
      gosShowPill(regionLabel, wmuLabel);
    } catch(e) {}
  }

  // ── Wire into initOpenSeasonsPage ─────────────────────────
  const prevInit = window.initOpenSeasonsPage || (typeof initOpenSeasonsPage === 'function' ? initOpenSeasonsPage : null);
  if (prevInit && !prevInit._gosRailV90) {
    const wrapped = function () {
      const r = prevInit.apply(this, arguments);
      setTimeout(() => {
        gosRailBootstrap();
        _gosHookPanelEvents();
        _gosSync3DBtn();
      }, 120);
      return r;
    };
    wrapped._gosRailV90 = true;
    window.initOpenSeasonsPage = wrapped;
    try { initOpenSeasonsPage = wrapped; } catch(e) {}
  }

  // Also hook if page is already shown
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { if (isMobile()) { gosRailBootstrap(); _gosHookPanelEvents(); } }, 200);
  });
  window.addEventListener('resize', () => {
    if (isMobile()) { gosRailBootstrap(); _gosSyncPanel(); }
    _gosSync3DBtn();
  });
  setTimeout(() => { if (isMobile()) { gosRailBootstrap(); _gosHookPanelEvents(); _gosSync3DBtn(); } }, 600);

  // Expose for external callers
  window.gosRailBootstrap = gosRailBootstrap;

})();


(function(){
  if(window.__gosMobileRail)return;
  window.__gosMobileRail=true;
  var $=function(id){return document.getElementById(id);};
  var mob=function(){return window.innerWidth<=768;};
  /* Noop old mobile tool functions */
  window.syncGOSMobileTools=function(){};
  window.ensureGOSMobileTools=function(){};
  function resize(){try{if(window.osMapInstance&&osMapInstance.resize)osMapInstance.resize();}catch(e){}}
  function kill(){
    if(!mob())return;
    var tb=document.querySelector('#bcOpenSeasonsPage .os-topbar');
    if(tb)tb.style.cssText='display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;overflow:hidden!important;pointer-events:none!important';
    ['osMapControlStack','osFilterPanel','osLayersPanel','osSearchWrap'].forEach(function(id){var el=$(id);if(el)el.style.cssText='display:none!important;visibility:hidden!important;height:0!important;pointer-events:none!important';});
  }
  function unkill(){
    if(mob())return;
    var tb=document.querySelector('#bcOpenSeasonsPage .os-topbar');
    if(tb)tb.style.cssText='';
    var cs=$('osMapControlStack');if(cs)cs.style.cssText='';
    ['osFilterPanel','osLayersPanel','osSearchWrap'].forEach(function(id){var el=$(id);if(el&&el.style.cssText.indexOf('important')>=0)el.style.cssText='display:none';});
  }
  function boot(){
    if(!mob())return;
    var sc0=$('gosScrim');if(sc0&&!sc0.classList.contains('hs-open'))sc0.style.cssText='display:none!important';
    kill();_ss();_s3();_wp();
    setTimeout(resize,80);setTimeout(resize,300);setTimeout(resize,700);setTimeout(resize,1500);
  }
  function _ss(){
    var sel=$('osSpeciesSel'),t=$('gosSpeciesBtnText');if(!sel||!t)return;
    t.textContent=(sel.options[sel.selectedIndex]?sel.options[sel.selectedIndex].text:null)||'All species';
    if(!sel._gl){sel._gl=1;sel.addEventListener('change',function(){var tt=$('gosSpeciesBtnText');if(tt)tt.textContent=(sel.options[sel.selectedIndex]?sel.options[sel.selectedIndex].text:null)||'All species';});}
  }
  window.gosToggleSpeciesDrop=function(){
    var d=$('gosSpeciesDrop');if(!d)return;
    if(d.style.display==='block'){d.style.display='none';return;}
    var sel=$('osSpeciesSel');if(!sel)return;
    var h='';
    Array.from(sel.children).forEach(function(c){
      if(c.tagName==='OPTGROUP'){h+='<div class="hs-species-group">'+c.label+'</div>';Array.from(c.children).forEach(function(o){h+='<div class="hs-species-row'+(o.value===sel.value?' hs-active':'')+'" onclick="gosPickSpecies(\''+o.value.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\',this)">'+o.text+'</div>';});}
      else{h+='<div class="hs-species-row'+(c.value===sel.value?' hs-active':'')+'" onclick="gosPickSpecies(\''+c.value.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\',this)">'+c.text+'</div>';}
    });
    d.innerHTML=h;d.style.display='block';
    setTimeout(function(){document.addEventListener('touchstart',function(e){var dd=$('gosSpeciesDrop'),bb=$('gosSpeciesBtn');if(dd&&bb&&!dd.contains(e.target)&&!bb.contains(e.target))dd.style.display='none';},{once:true,passive:true});},50);
  };
  window.gosPickSpecies=function(val,row){
    var sel=$('osSpeciesSel');if(sel){sel.value=val;sel.dispatchEvent(new Event('change',{bubbles:true}));}
    var t=$('gosSpeciesBtnText');if(t)t.textContent=row.textContent||'All species';
    var d=$('gosSpeciesDrop');if(d)d.style.display='none';
  };
  window.gosShowPill=function(region,wmu){
    if(!mob())return;
    var pill=$('gosZonePill'),nm=$('gosZonePillName'),dv=$('gosZonePillDiv'),sb=$('gosZonePillSub');
    if(!pill||!nm)return;
    pill.classList.remove('hs-hiding');nm.textContent=region||'';
    if(wmu){if(dv)dv.style.display='';if(sb)sb.textContent=wmu;}
    else{if(dv)dv.style.display='none';if(sb)sb.textContent='';}
    pill.style.display='flex';
  };
  window.gosHidePill=function(){var pill=$('gosZonePill');if(!pill||pill.style.display==='none')return;pill.classList.add('hs-hiding');setTimeout(function(){pill.style.display='none';pill.classList.remove('hs-hiding');},160);};
  window.gosToggle3D=function(){try{if(typeof osToggle3D==='function')osToggle3D();}catch(e){}_s3();};
  function _s3(){var btn=$('gos3DBtn'),lbl=$('gos3DLabel');if(!btn||!lbl)return;var is=!!(window.osTerrain3D||(typeof osTerrain3D!=='undefined'&&osTerrain3D));lbl.textContent=is?'2D':'3D';btn.classList.toggle('hs-active',is);}
  window.gosClearAll=function(){try{if(typeof osClearAllGOS==='function')osClearAllGOS();}catch(e){}gosHidePill();gosCloseModal();setTimeout(_ss,100);};
  window.gosOpenModal=function(type){
    if(!mob())return;
    var sc=$('gosScrim'),mo=$('gosModal');if(!sc||!mo)return;
    ['gosRbSearch','gosRbFilters','gosRbLayers'].forEach(function(id){var b=$(id);if(b)b.classList.remove('hs-active');});
    var map={search:'gosRbSearch',filters:'gosRbFilters',layers:'gosRbLayers'};
    if(map[type]){var b=$(map[type]);if(b)b.classList.add('hs-active');}
    if(type==='layers')mo.innerHTML=_glh();
    if(type==='filters')mo.innerHTML=_gfh();
    if(type==='search')mo.innerHTML=_gsh();
    sc.classList.add('hs-open');sc.style.cssText='display:flex!important';
    if(type==='search')setTimeout(function(){var i=$('gosSearchInput');if(i)i.focus();},80);
  };
  window.gosCloseModal=function(){var s=$('gosScrim');if(s){s.classList.remove('hs-open');s.style.cssText='display:none!important';}['gosRbSearch','gosRbFilters','gosRbLayers'].forEach(function(id){var b=$(id);if(b)b.classList.remove('hs-active');});};
  function _glh(){
    var tile=(typeof _osCurrentTile!=='undefined'&&_osCurrentTile)||'streets';
    var i3=!!(window.osTerrain3D||(typeof osTerrain3D!=='undefined'&&osTerrain3D));
    function B(l,c,on,f){return '<button type="button" class="hs-sc '+c+(on?' gos-on':'')+'" onclick="'+f+'">'+l+'</button>';}
    return '<div class="hs-mh"><span class="hs-mt">Map layers</span><button type="button" class="hs-mx" onclick="gosCloseModal()">&#10005;</button></div>'
      +'<div class="hs-ml">Map type</div><div class="hs-seg3">'+B('Streets','hs-mt-btn',tile==='streets',"gosSetTile('streets')")+B('Satellite','hs-mt-btn',tile==='satellite',"gosSetTile('satellite')")+B('Topo','hs-mt-btn',tile==='topo',"gosSetTile('topo')")+'</div>'
      +'<div class="hs-ml">Mode</div><div class="hs-seg2">'+B('2D','hs-mode',!i3,"gosSet3D(false)")+B('3D','hs-mode',!!i3,"gosSet3D(true)")+'</div>'
      +'<div class="hs-ml">GOS overlay opacity</div><div class="hs-slider-row"><input type="range" min="0" max="100" value="75" oninput="var v=document.getElementById(\'gosOpV\');if(v)v.textContent=Math.round(this.value)+\'%\'"><span class="hs-sv" id="gosOpV">75%</span></div>'
      +'<div class="hs-ml">Historical wildfires</div>'
      +'<div class="hs-seg2" style="margin-bottom:6px">'+B('Show','',!!window.osWildfireVisible,"gosSetWildfire(true)")+B('Hide','',!window.osWildfireVisible,"gosSetWildfire(false)")+'</div>'
      +'<div class="hs-slider-row"><input type="range" min="0" max="100" value="60" oninput="var v=document.getElementById(\'gosWfV\');if(v)v.textContent=Math.round(this.value)+\'%\'"><span class="hs-sv hs-sv-amber" id="gosWfV">60%</span></div>';
  }
  window.gosSetTile=function(t){window._osCurrentTile=t;try{if(typeof osSetTile==='function')osSetTile(t);}catch(e){}var m=$('gosModal');if(m)m.innerHTML=_glh();};
  window.gosSet3D=function(on){try{var cur=!!(window.osTerrain3D||(typeof osTerrain3D!=='undefined'&&osTerrain3D));if(cur!==on&&typeof osToggle3D==='function')osToggle3D();}catch(e){}_s3();var m=$('gosModal');if(m)m.innerHTML=_glh();};
  window.gosSetWildfire=function(show){window.osWildfireVisible=show;try{if(typeof osToggleWildfireClean==='function')osToggleWildfireClean(show);}catch(e){}var m=$('gosModal');if(m)m.innerHTML=_glh();};
  function _gfh(){
    var mo=$('osMonthSel'),me=$('osMethodSel');
    var monO=mo?mo.innerHTML:'<option value="">Any month</option>';
    var metO=me?me.innerHTML:'<option value="">All methods</option>';
    return '<div class="hs-mh"><span class="hs-mt">Filters</span><button type="button" class="hs-mx" onclick="gosCloseModal()">&#10005;</button></div>'
      +'<div class="hs-ml">Month</div><select class="hs-msel" onchange="gosSetMonth(this.value)">'+monO+'</select>'
      +'<div class="hs-ml">Hunting method</div><select class="hs-msel" style="margin-bottom:8px" onchange="gosSetMethod(this.value)">'+metO+'</select>'
      +'<div class="hs-mnote hs-mnote-amber">Matching WMUs highlighted in gold on the map.</div>';
  }
  window.gosSetMonth=function(v){try{if(typeof osOnMonth==='function')osOnMonth(v);}catch(e){}var s=$('osMonthSel');if(s)s.value=v;};
  window.gosSetMethod=function(v){try{if(typeof osOnMethod==='function')osOnMethod(v);}catch(e){}var s=$('osMethodSel');if(s)s.value=v;};
  function _gsh(){
    return '<div class="hs-mh"><span class="hs-mt">Search</span><button type="button" class="hs-mx" onclick="gosCloseModal()">&#10005;</button></div>'
      +'<div class="hs-sinwrap"><span class="hs-sico">&#8981;</span><input class="hs-sinput" id="gosSearchInput" type="text" placeholder="City, WMU, or coordinates\u2026" autocomplete="off" oninput="gosSearch(this.value)"></div>'
      +'<div id="gosSearchResults"></div>';
  }
  window.gosSearch=function(val){
    var box=$('gosSearchResults');if(!box)return;
    var q=(val||'').trim().toLowerCase();if(!q){box.innerHTML='';return;}
    var rows=[];
    var R={'1':'Region 1','2':'Region 2','3':'Region 3','4':'Region 4','5':'Region 5','6':'Region 6','7A':'Region 7A','7B':'Region 7B','8':'Region 8'};
    Object.keys(R).forEach(function(id){var n=R[id];if(n.toLowerCase().indexOf(q)>=0||id.toLowerCase().indexOf(q)>=0)rows.push({label:n,sub:'BC Region',badge:'hs-badge-reg',fly:function(){try{if(typeof osSelectRegion==='function')osSelectRegion(id);}catch(e){}gosCloseModal();}});});
    window._gR=rows.slice(0,8);_gr(window._gR);
  };
  function _gr(rows){var box=$('gosSearchResults');if(!box)return;box.innerHTML=rows.map(function(r,i){return '<div class="hs-sres" onclick="gosPickSearch('+i+'"><div><div class="hs-sres-name">'+r.label+'</div><div class="hs-sres-sub">'+r.sub+'</div></div><span class="hs-badge hs-badge-reg">Region</span></div>';}).join('');}
  window.gosPickSearch=function(i){var r=(window._gR||[])[i];if(r)r.fly();};
  function _wp(){
    var panel=document.querySelector('#bcOpenSeasonsPage .os-panel');
    var body=document.querySelector('#bcOpenSeasonsPage .os-body');
    var cluster=$('gosBrCluster');
    if(!panel||panel._gw)return;panel._gw=1;
    new MutationObserver(function(){
      var open=panel.classList.contains('open');
      if(body)body.classList.toggle('hs-panel-open',open);
      if(cluster)cluster.classList.toggle('hs-hidden',open);
      try{var N={'1':'Region 1','2':'Region 2','3':'Region 3','4':'Region 4','5':'Region 5','6':'Region 6','7A':'Region 7A','7B':'Region 7B','8':'Region 8'};if(open){var reg=window.osSelectedRegion!=null?window.osSelectedRegion:(window.osSelectedRegions&&window.osSelectedRegions.size>0?Array.from(window.osSelectedRegions)[0]:null);if(reg!=null)gosShowPill(N[String(reg)]||'Region '+reg,window.osSelectedWMU?'WMU '+window.osSelectedWMU:'');}else gosHidePill();}catch(e){}
      setTimeout(resize,80);
    }).observe(panel,{attributes:true,attributeFilter:['class']});
  }
  setTimeout(boot,200);setTimeout(boot,700);
  setTimeout(kill,50);setTimeout(kill,400);setTimeout(kill,1000);
  setTimeout(unkill,60);setTimeout(unkill,450);setTimeout(unkill,1050);
  window.addEventListener('resize',function(){if(mob()){boot();resize();}else{unkill();}});
  document.addEventListener('visibilitychange',function(){if(!document.hidden&&mob()){setTimeout(boot,150);setTimeout(resize,300);}});
  var _prev=window.initOpenSeasonsPage;
  if(_prev&&!_prev._gh){var w=function(){var r=_prev.apply(this,arguments);setTimeout(boot,400);setTimeout(kill,200);setTimeout(resize,600);return r;};w._gh=true;window.initOpenSeasonsPage=w;try{initOpenSeasonsPage=w;}catch(e){}}
})();
