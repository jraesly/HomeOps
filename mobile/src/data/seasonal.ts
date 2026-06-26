export type Season = 'Spring' | 'Summer' | 'Fall' | 'Winter';

/** Northern-hemisphere season for a date (by month). */
export function getSeason(date: Date): Season {
  const month = date.getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

export const SEASONAL_SUGGESTIONS: Record<Season, string[]> = {
  Spring: [
    'Service the AC before summer',
    'Clean gutters and downspouts',
    'Replace HVAC filters',
    'Test the sump pump',
    'Inspect the roof and exterior',
  ],
  Summer: [
    'Clean refrigerator coils',
    'Clean the dryer vent',
    'Inspect the deck and reseal if needed',
    'Check outdoor faucets and irrigation',
  ],
  Fall: [
    'Service the furnace before winter',
    'Replace HVAC filters',
    'Clean gutters after leaf-fall',
    'Test smoke and CO detectors',
    'Winterize outdoor faucets and irrigation',
  ],
  Winter: [
    'Check for drafts and reseal windows',
    'Test smoke and CO detectors',
    'Reverse ceiling fans',
    'Inspect the water heater',
  ],
};

export function currentSeasonSuggestions(date: Date): {
  season: Season;
  suggestions: string[];
} {
  const season = getSeason(date);
  return { season, suggestions: SEASONAL_SUGGESTIONS[season] };
}
