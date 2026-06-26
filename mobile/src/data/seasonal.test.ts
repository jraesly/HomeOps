import {
  currentSeasonSuggestions,
  getSeason,
  SEASONAL_SUGGESTIONS,
} from '@/data/seasonal';

describe('getSeason', () => {
  it('maps months to seasons (northern hemisphere)', () => {
    expect(getSeason(new Date(2026, 0, 15))).toBe('Winter'); // Jan
    expect(getSeason(new Date(2026, 3, 15))).toBe('Spring'); // Apr
    expect(getSeason(new Date(2026, 6, 15))).toBe('Summer'); // Jul
    expect(getSeason(new Date(2026, 9, 15))).toBe('Fall'); // Oct
    expect(getSeason(new Date(2026, 11, 15))).toBe('Winter'); // Dec
  });
});

describe('currentSeasonSuggestions', () => {
  it('returns the season and a non-empty list', () => {
    const { season, suggestions } = currentSeasonSuggestions(
      new Date(2026, 9, 1),
    );
    expect(season).toBe('Fall');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions).toBe(SEASONAL_SUGGESTIONS.Fall);
  });
});
