// Real IPEDS institution list (HD2023 Institutional Characteristics survey).
// Filtered to currently-operating, degree-granting, open-to-public institutions in
// sectors 1, 2, 4, 5: public 4-year + private nonprofit 4-year + public 2-year (community
// colleges) + private nonprofit 2-year. For-profit institutions and < 2-year programs
// (most trade / beauty / cosmetology schools) are excluded.
//
// Source: https://nces.ed.gov/ipeds/datacenter/data/HD2023.zip
// Regenerate via the procedure documented in scripts/build-institutions.md (TODO).
//
// 223 KB JSON, 3,316 records — bundled in the main app chunk (well under the
// 500 KB lazy-load threshold the spec calls for).

import raw from './institutions.json'

export interface Institution {
  name: string
  state: string
  unitid: number
}

export const INSTITUTIONS: readonly Institution[] = raw as Institution[]

// Pre-computed lowercase haystack so we don't .toLowerCase() 3,316 names per keystroke.
const LOWER_NAMES: readonly string[] = INSTITUTIONS.map(i => i.name.toLowerCase())

// Returns up to `limit` institutions whose name contains the query as a substring
// (case-insensitive). Empty query returns the first `limit` institutions alphabetically.
export function searchInstitutions(query: string, limit = 8): Institution[] {
  const q = query.trim().toLowerCase()
  if (!q) return INSTITUTIONS.slice(0, limit)
  const out: Institution[] = []
  for (let i = 0; i < INSTITUTIONS.length && out.length < limit; i++) {
    if (LOWER_NAMES[i].includes(q)) out.push(INSTITUTIONS[i])
  }
  return out
}

// Sentinel value the intake screen offers at the bottom of every autocomplete result.
// Selecting it just dismisses the dropdown and accepts whatever's already in the input —
// useful for non-academic visitors and non-US institutions.
export const OTHER_OPTION_LABEL = 'Other… (type your own)'
