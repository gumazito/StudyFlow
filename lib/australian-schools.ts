/**
 * Curated list of Australian schools for instant search.
 * Users can also type any school name manually if not found here.
 * Data sourced from public directories — covers major schools across all states.
 */
export interface AustralianSchool {
  name: string
  suburb: string
  state: string
  postcode: string
  sector: string
}

export const AUSTRALIAN_SCHOOLS: AustralianSchool[] = [
  // ── NSW ──────────────────────────────────────────────────
  { name: 'Sydney Boys High School', suburb: 'Surry Hills', state: 'NSW', postcode: '2010', sector: 'Government' },
  { name: 'Sydney Girls High School', suburb: 'Surry Hills', state: 'NSW', postcode: '2010', sector: 'Government' },
  { name: 'North Sydney Boys High School', suburb: 'Crows Nest', state: 'NSW', postcode: '2065', sector: 'Government' },
  { name: 'North Sydney Girls High School', suburb: 'Crows Nest', state: 'NSW', postcode: '2065', sector: 'Government' },
  { name: 'Fort Street High School', suburb: 'Petersham', state: 'NSW', postcode: '2049', sector: 'Government' },
  { name: 'James Ruse Agricultural High School', suburb: 'Carlingford', state: 'NSW', postcode: '2118', sector: 'Government' },
  { name: 'Baulkham Hills High School', suburb: 'Baulkham Hills', state: 'NSW', postcode: '2153', sector: 'Government' },
  { name: 'Hornsby Girls High School', suburb: 'Hornsby', state: 'NSW', postcode: '2077', sector: 'Government' },
  { name: 'Normanhurst Boys High School', suburb: 'Normanhurst', state: 'NSW', postcode: '2076', sector: 'Government' },
  { name: 'Penrith High School', suburb: 'Penrith', state: 'NSW', postcode: '2750', sector: 'Government' },
  { name: 'Hurlstone Agricultural High School', suburb: 'Glenfield', state: 'NSW', postcode: '2167', sector: 'Government' },
  { name: 'Blacktown Boys High School', suburb: 'Blacktown', state: 'NSW', postcode: '2148', sector: 'Government' },
  { name: 'Blacktown Girls High School', suburb: 'Blacktown', state: 'NSW', postcode: '2148', sector: 'Government' },
  { name: 'Parramatta High School', suburb: 'Parramatta', state: 'NSW', postcode: '2150', sector: 'Government' },
  { name: 'Epping Boys High School', suburb: 'Epping', state: 'NSW', postcode: '2121', sector: 'Government' },
  { name: 'Chatswood High School', suburb: 'Chatswood', state: 'NSW', postcode: '2067', sector: 'Government' },
  { name: 'Manly Selective Campus', suburb: 'Manly', state: 'NSW', postcode: '2095', sector: 'Government' },
  { name: 'St Clare\'s College', suburb: 'Waverley', state: 'NSW', postcode: '2024', sector: 'Catholic' },
  { name: 'Loreto Kirribilli', suburb: 'Kirribilli', state: 'NSW', postcode: '2061', sector: 'Independent' },
  { name: 'St Ignatius College Riverview', suburb: 'Lane Cove', state: 'NSW', postcode: '2066', sector: 'Independent' },
  { name: 'Monte Sant Angelo Mercy College', suburb: 'North Sydney', state: 'NSW', postcode: '2060', sector: 'Independent' },
  { name: 'Ascham School', suburb: 'Edgecliff', state: 'NSW', postcode: '2027', sector: 'Independent' },
  { name: 'Pymble Ladies College', suburb: 'Pymble', state: 'NSW', postcode: '2073', sector: 'Independent' },
  { name: 'Cranbrook School', suburb: 'Bellevue Hill', state: 'NSW', postcode: '2023', sector: 'Independent' },
  { name: 'The King\'s School', suburb: 'North Parramatta', state: 'NSW', postcode: '2151', sector: 'Independent' },
  { name: 'Barker College', suburb: 'Hornsby', state: 'NSW', postcode: '2077', sector: 'Independent' },
  { name: 'Knox Grammar School', suburb: 'Wahroonga', state: 'NSW', postcode: '2076', sector: 'Independent' },
  { name: 'Ravenswood School for Girls', suburb: 'Gordon', state: 'NSW', postcode: '2072', sector: 'Independent' },
  { name: 'Abbotsleigh', suburb: 'Wahroonga', state: 'NSW', postcode: '2076', sector: 'Independent' },
  { name: 'SCEGGS Darlinghurst', suburb: 'Darlinghurst', state: 'NSW', postcode: '2010', sector: 'Independent' },
  { name: 'Trinity Grammar School', suburb: 'Summer Hill', state: 'NSW', postcode: '2130', sector: 'Independent' },
  { name: 'St Andrew\'s Cathedral School', suburb: 'Sydney', state: 'NSW', postcode: '2000', sector: 'Independent' },
  { name: 'Newington College', suburb: 'Stanmore', state: 'NSW', postcode: '2048', sector: 'Independent' },
  { name: 'Shore School', suburb: 'North Sydney', state: 'NSW', postcode: '2060', sector: 'Independent' },
  { name: 'Reddam House', suburb: 'Woollahra', state: 'NSW', postcode: '2025', sector: 'Independent' },
  { name: 'Meriden School', suburb: 'Strathfield', state: 'NSW', postcode: '2135', sector: 'Independent' },
  { name: 'Our Lady of Mercy College', suburb: 'Parramatta', state: 'NSW', postcode: '2150', sector: 'Catholic' },
  { name: 'Marist College North Shore', suburb: 'North Sydney', state: 'NSW', postcode: '2060', sector: 'Catholic' },
  { name: 'De La Salle College', suburb: 'Cronulla', state: 'NSW', postcode: '2230', sector: 'Catholic' },

  // ── VIC ──────────────────────────────────────────────────
  { name: 'Melbourne High School', suburb: 'South Yarra', state: 'VIC', postcode: '3141', sector: 'Government' },
  { name: 'Mac.Robertson Girls High School', suburb: 'Melbourne', state: 'VIC', postcode: '3004', sector: 'Government' },
  { name: 'Nossal High School', suburb: 'Berwick', state: 'VIC', postcode: '3806', sector: 'Government' },
  { name: 'Suzanne Cory High School', suburb: 'Werribee', state: 'VIC', postcode: '3030', sector: 'Government' },
  { name: 'John Monash Science School', suburb: 'Clayton', state: 'VIC', postcode: '3168', sector: 'Government' },
  { name: 'Victorian College of the Arts Secondary School', suburb: 'Southbank', state: 'VIC', postcode: '3006', sector: 'Government' },
  { name: 'Balwyn High School', suburb: 'Balwyn', state: 'VIC', postcode: '3103', sector: 'Government' },
  { name: 'Glen Waverley Secondary College', suburb: 'Glen Waverley', state: 'VIC', postcode: '3150', sector: 'Government' },
  { name: 'Melbourne Grammar School', suburb: 'South Yarra', state: 'VIC', postcode: '3141', sector: 'Independent' },
  { name: 'Scotch College Melbourne', suburb: 'Hawthorn', state: 'VIC', postcode: '3122', sector: 'Independent' },
  { name: 'Xavier College', suburb: 'Kew', state: 'VIC', postcode: '3101', sector: 'Independent' },
  { name: 'Geelong Grammar School', suburb: 'Corio', state: 'VIC', postcode: '3214', sector: 'Independent' },
  { name: 'Caulfield Grammar School', suburb: 'Caulfield', state: 'VIC', postcode: '3161', sector: 'Independent' },
  { name: 'Haileybury', suburb: 'Brighton', state: 'VIC', postcode: '3186', sector: 'Independent' },
  { name: 'Ivanhoe Grammar School', suburb: 'Ivanhoe', state: 'VIC', postcode: '3079', sector: 'Independent' },
  { name: 'Loreto Mandeville Hall', suburb: 'Toorak', state: 'VIC', postcode: '3142', sector: 'Independent' },
  { name: 'Genazzano FCJ College', suburb: 'Kew', state: 'VIC', postcode: '3101', sector: 'Independent' },
  { name: 'Wesley College', suburb: 'Prahran', state: 'VIC', postcode: '3181', sector: 'Independent' },
  { name: 'Brighton Grammar School', suburb: 'Brighton', state: 'VIC', postcode: '3186', sector: 'Independent' },
  { name: 'Carey Baptist Grammar School', suburb: 'Kew', state: 'VIC', postcode: '3101', sector: 'Independent' },
  { name: 'Penleigh and Essendon Grammar School', suburb: 'Keilor East', state: 'VIC', postcode: '3033', sector: 'Independent' },
  { name: 'Camberwell Grammar School', suburb: 'Canterbury', state: 'VIC', postcode: '3126', sector: 'Independent' },
  { name: 'St Kevin\'s College', suburb: 'Toorak', state: 'VIC', postcode: '3142', sector: 'Catholic' },
  { name: 'Star of the Sea College', suburb: 'Brighton', state: 'VIC', postcode: '3186', sector: 'Catholic' },
  { name: 'Marymede Catholic College', suburb: 'South Morang', state: 'VIC', postcode: '3752', sector: 'Catholic' },

  // ── QLD ──────────────────────────────────────────────────
  { name: 'Brisbane State High School', suburb: 'South Brisbane', state: 'QLD', postcode: '4101', sector: 'Government' },
  { name: 'Queensland Academy for Science Mathematics and Technology', suburb: 'Toowong', state: 'QLD', postcode: '4066', sector: 'Government' },
  { name: 'Indooroopilly State High School', suburb: 'Indooroopilly', state: 'QLD', postcode: '4068', sector: 'Government' },
  { name: 'Kelvin Grove State College', suburb: 'Kelvin Grove', state: 'QLD', postcode: '4059', sector: 'Government' },
  { name: 'Mansfield State High School', suburb: 'Mansfield', state: 'QLD', postcode: '4122', sector: 'Government' },
  { name: 'Brisbane Boys College', suburb: 'Toowong', state: 'QLD', postcode: '4066', sector: 'Independent' },
  { name: 'Brisbane Girls Grammar School', suburb: 'Brisbane', state: 'QLD', postcode: '4000', sector: 'Independent' },
  { name: 'Brisbane Grammar School', suburb: 'Brisbane', state: 'QLD', postcode: '4000', sector: 'Independent' },
  { name: 'Somerville House', suburb: 'South Brisbane', state: 'QLD', postcode: '4101', sector: 'Independent' },
  { name: 'Ipswich Grammar School', suburb: 'Ipswich', state: 'QLD', postcode: '4305', sector: 'Independent' },
  { name: 'St Aidan\'s Anglican Girls School', suburb: 'Corinda', state: 'QLD', postcode: '4075', sector: 'Independent' },
  { name: 'The Southport School', suburb: 'Southport', state: 'QLD', postcode: '4215', sector: 'Independent' },
  { name: 'Brigidine College', suburb: 'Indooroopilly', state: 'QLD', postcode: '4068', sector: 'Independent' },
  { name: 'St Laurence\'s College', suburb: 'South Brisbane', state: 'QLD', postcode: '4101', sector: 'Catholic' },
  { name: 'Stuartholme School', suburb: 'Toowong', state: 'QLD', postcode: '4066', sector: 'Catholic' },
  { name: 'Villanova College', suburb: 'Coorparoo', state: 'QLD', postcode: '4151', sector: 'Catholic' },
  { name: 'Padua College', suburb: 'Kedron', state: 'QLD', postcode: '4031', sector: 'Catholic' },
  { name: 'All Hallows School', suburb: 'Brisbane', state: 'QLD', postcode: '4000', sector: 'Catholic' },
  { name: 'Nudgee College', suburb: 'Boondall', state: 'QLD', postcode: '4034', sector: 'Catholic' },

  // ── SA ───────────────────────────────────────────────────
  { name: 'Adelaide High School', suburb: 'Adelaide', state: 'SA', postcode: '5000', sector: 'Government' },
  { name: 'Glenunga International High School', suburb: 'Glenunga', state: 'SA', postcode: '5064', sector: 'Government' },
  { name: 'Marryatville High School', suburb: 'Marryatville', state: 'SA', postcode: '5068', sector: 'Government' },
  { name: 'Brighton Secondary School', suburb: 'Brighton', state: 'SA', postcode: '5048', sector: 'Government' },
  { name: 'Unley High School', suburb: 'Netherby', state: 'SA', postcode: '5062', sector: 'Government' },
  { name: 'St Peter\'s College Adelaide', suburb: 'St Peters', state: 'SA', postcode: '5069', sector: 'Independent' },
  { name: 'Prince Alfred College', suburb: 'Kent Town', state: 'SA', postcode: '5067', sector: 'Independent' },
  { name: 'Pulteney Grammar School', suburb: 'Adelaide', state: 'SA', postcode: '5000', sector: 'Independent' },
  { name: 'Scotch College Adelaide', suburb: 'Torrens Park', state: 'SA', postcode: '5062', sector: 'Independent' },
  { name: 'Pembroke School', suburb: 'Kensington Park', state: 'SA', postcode: '5068', sector: 'Independent' },
  { name: 'Loreto College Adelaide', suburb: 'Marryatville', state: 'SA', postcode: '5068', sector: 'Independent' },
  { name: 'Cabra Dominican College', suburb: 'Cumberland Park', state: 'SA', postcode: '5041', sector: 'Catholic' },
  { name: 'Rostrevor College', suburb: 'Woodforde', state: 'SA', postcode: '5072', sector: 'Catholic' },
  { name: 'Sacred Heart College Adelaide', suburb: 'Somerton Park', state: 'SA', postcode: '5044', sector: 'Catholic' },

  // ── WA ───────────────────────────────────────────────────
  { name: 'Perth Modern School', suburb: 'Subiaco', state: 'WA', postcode: '6008', sector: 'Government' },
  { name: 'Rossmoyne Senior High School', suburb: 'Rossmoyne', state: 'WA', postcode: '6148', sector: 'Government' },
  { name: 'Shenton College', suburb: 'Shenton Park', state: 'WA', postcode: '6008', sector: 'Government' },
  { name: 'Churchlands Senior High School', suburb: 'Churchlands', state: 'WA', postcode: '6018', sector: 'Government' },
  { name: 'Willetton Senior High School', suburb: 'Willetton', state: 'WA', postcode: '6155', sector: 'Government' },
  { name: 'Christ Church Grammar School', suburb: 'Claremont', state: 'WA', postcode: '6010', sector: 'Independent' },
  { name: 'Scotch College Perth', suburb: 'Swanbourne', state: 'WA', postcode: '6010', sector: 'Independent' },
  { name: 'Hale School', suburb: 'Wembley Downs', state: 'WA', postcode: '6019', sector: 'Independent' },
  { name: 'Methodist Ladies College Perth', suburb: 'Claremont', state: 'WA', postcode: '6010', sector: 'Independent' },
  { name: 'St Mary\'s Anglican Girls School', suburb: 'Karrinyup', state: 'WA', postcode: '6018', sector: 'Independent' },
  { name: 'Perth College', suburb: 'Mt Lawley', state: 'WA', postcode: '6050', sector: 'Independent' },
  { name: 'Guildford Grammar School', suburb: 'Guildford', state: 'WA', postcode: '6055', sector: 'Independent' },
  { name: 'Aquinas College Perth', suburb: 'Manning', state: 'WA', postcode: '6152', sector: 'Catholic' },
  { name: 'John XXIII College', suburb: 'Mt Claremont', state: 'WA', postcode: '6010', sector: 'Catholic' },
  { name: 'Mercedes College Perth', suburb: 'Perth', state: 'WA', postcode: '6000', sector: 'Catholic' },

  // ── TAS ──────────────────────────────────────────────────
  { name: 'Elizabeth College', suburb: 'Hobart', state: 'TAS', postcode: '7000', sector: 'Government' },
  { name: 'Hobart College', suburb: 'Mt Nelson', state: 'TAS', postcode: '7007', sector: 'Government' },
  { name: 'Launceston College', suburb: 'Launceston', state: 'TAS', postcode: '7250', sector: 'Government' },
  { name: 'Rosny College', suburb: 'Rosny Park', state: 'TAS', postcode: '7018', sector: 'Government' },
  { name: 'Fahan School', suburb: 'Sandy Bay', state: 'TAS', postcode: '7005', sector: 'Independent' },
  { name: 'The Hutchins School', suburb: 'Sandy Bay', state: 'TAS', postcode: '7005', sector: 'Independent' },
  { name: 'St Michael\'s Collegiate', suburb: 'Hobart', state: 'TAS', postcode: '7000', sector: 'Independent' },
  { name: 'Scotch Oakburn College', suburb: 'Launceston', state: 'TAS', postcode: '7250', sector: 'Independent' },
  { name: 'Launceston Church Grammar School', suburb: 'Launceston', state: 'TAS', postcode: '7250', sector: 'Independent' },
  { name: 'Guilford Young College', suburb: 'Hobart', state: 'TAS', postcode: '7000', sector: 'Catholic' },
  { name: 'Sacred Heart College Hobart', suburb: 'New Town', state: 'TAS', postcode: '7008', sector: 'Catholic' },
  { name: 'Dominic College', suburb: 'Glenorchy', state: 'TAS', postcode: '7010', sector: 'Catholic' },

  // ── NT ───────────────────────────────────────────────────
  { name: 'Darwin High School', suburb: 'Darwin', state: 'NT', postcode: '0800', sector: 'Government' },
  { name: 'Casuarina Senior College', suburb: 'Casuarina', state: 'NT', postcode: '0810', sector: 'Government' },
  { name: 'Nightcliff Middle School', suburb: 'Nightcliff', state: 'NT', postcode: '0810', sector: 'Government' },
  { name: 'Palmerston Senior College', suburb: 'Palmerston', state: 'NT', postcode: '0830', sector: 'Government' },
  { name: 'Alice Springs School of the Air', suburb: 'Alice Springs', state: 'NT', postcode: '0870', sector: 'Government' },
  { name: 'St John\'s Catholic College', suburb: 'Darwin', state: 'NT', postcode: '0800', sector: 'Catholic' },
  { name: 'Haileybury Rendall School', suburb: 'Berrimah', state: 'NT', postcode: '0828', sector: 'Independent' },
  { name: 'Kormilda College', suburb: 'Stuart Park', state: 'NT', postcode: '0820', sector: 'Independent' },

  // ── ACT ──────────────────────────────────────────────────
  { name: 'Narrabundah College', suburb: 'Narrabundah', state: 'ACT', postcode: '2604', sector: 'Government' },
  { name: 'Dickson College', suburb: 'Dickson', state: 'ACT', postcode: '2602', sector: 'Government' },
  { name: 'Hawker College', suburb: 'Hawker', state: 'ACT', postcode: '2614', sector: 'Government' },
  { name: 'Lake Ginninderra College', suburb: 'Belconnen', state: 'ACT', postcode: '2617', sector: 'Government' },
  { name: 'Canberra College', suburb: 'Phillip', state: 'ACT', postcode: '2606', sector: 'Government' },
  { name: 'Canberra Grammar School', suburb: 'Red Hill', state: 'ACT', postcode: '2603', sector: 'Independent' },
  { name: 'Radford College', suburb: 'Bruce', state: 'ACT', postcode: '2617', sector: 'Independent' },
  { name: 'Canberra Girls Grammar School', suburb: 'Deakin', state: 'ACT', postcode: '2600', sector: 'Independent' },
  { name: 'Burgmann Anglican School', suburb: 'Gungahlin', state: 'ACT', postcode: '2912', sector: 'Independent' },
  { name: 'Marist College Canberra', suburb: 'Pearce', state: 'ACT', postcode: '2607', sector: 'Catholic' },
  { name: 'Daramalan College', suburb: 'Dickson', state: 'ACT', postcode: '2602', sector: 'Catholic' },
  { name: 'St Clare\'s College Canberra', suburb: 'Griffith', state: 'ACT', postcode: '2603', sector: 'Catholic' },
  { name: 'Merici College', suburb: 'Braddon', state: 'ACT', postcode: '2612', sector: 'Catholic' },
  { name: 'St Edmund\'s College', suburb: 'Griffith', state: 'ACT', postcode: '2603', sector: 'Catholic' },
  { name: 'St Francis Xavier College', suburb: 'Florey', state: 'ACT', postcode: '2615', sector: 'Catholic' },
]

/**
 * Search schools with instant filtering (no API calls).
 * Returns matches ranked by relevance — exact prefix matches first, then contains matches.
 */
export function searchSchools(query: string, limit = 10): AustralianSchool[] {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
  const results = AUSTRALIAN_SCHOOLS.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.suburb.toLowerCase().includes(q) ||
    s.state.toLowerCase() === q ||
    s.postcode.startsWith(q)
  )
  // Sort: prefix matches first, then alphabetical
  results.sort((a, b) => {
    const aStart = a.name.toLowerCase().startsWith(q) ? 0 : 1
    const bStart = b.name.toLowerCase().startsWith(q) ? 0 : 1
    if (aStart !== bStart) return aStart - bStart
    return a.name.localeCompare(b.name)
  })
  return results.slice(0, limit)
}
